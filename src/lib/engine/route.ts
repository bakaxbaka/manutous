import { CURRICULUM, SKILLS, getSkill } from "./catalog.ts";
import { classify } from "./classify.ts";
import { evaluateGates, worst } from "./gates.ts";
import { RULES } from "./rules.ts";
import type { Classification, CurriculumRef, Decision, Rule, SkillMeta } from "./types";

function matches(rule: Rule, cls: Classification): boolean {
  if (rule.intents && !rule.intents.includes(cls.intent)) return false;
  if (rule.domains && !rule.domains.some((domain) => cls.domains.includes(domain))) return false;
  if (rule.excludeDomains?.some((domain) => cls.domains.includes(domain))) return false;
  return true;
}

function curriculumFor(ids: string[], domains: string[]): CurriculumRef[] {
  const extra: string[] = [];
  if (domains.includes("token-2022") || domains.includes("spl-token")) {
    extra.push("spl-tokens-2022-and-extensions");
  }
  if (domains.includes("anchor")) extra.push("anchor-and-programs");
  if (domains.includes("consensus") || domains.includes("runtime")) extra.push("blockchain-basics");
  if (domains.includes("wallet")) extra.push("web-for-solana-development-101");
  const ordered = [...new Set([...ids, ...extra])];
  return ordered.map((id) => {
    const known = CURRICULUM[id];
    if (!known) {
      return { id, path: `courses/${id}`, status: "UNKNOWN" as const };
    }
    return { id, path: known.path, status: known.status, note: known.note };
  });
}

function subjectPresent(request: string): boolean {
  return /\b(signature|account|program id)\b/i.test(request) && /[1-9A-HJ-NP-Za-km-z]{32,88}/.test(request);
}

export function decide(request: string): Decision {
  const classification = classify(request);
  const matched = RULES.filter((rule) => matches(rule, classification)).sort(
    (a, b) => b.priority - a.priority,
  );
  const primaryRule = matched[0];
  const discarded: Decision["discarded"] = [];

  const skillIds = new Set<string>();
  let primary: SkillMeta | null = null;
  const secondary: SkillMeta[] = [];

  if (primaryRule) {
    const loadedPrimary = getSkill(primaryRule.primary);
    if (!loadedPrimary) {
      discarded.push({ ruleId: primaryRule.id, reason: "Primary skill is not in the registry." });
    } else if (loadedPrimary.gates.length < 7) {
      discarded.push({ ruleId: primaryRule.id, reason: "Primary skill does not declare the mandatory gates." });
    } else {
      primary = loadedPrimary;
      skillIds.add(loadedPrimary.id);
      const secondaryIds = [
        ...primaryRule.secondary,
        ...(primaryRule.extraSecondary ?? [])
          .filter((extra) => classification.domains.includes(extra.domain))
          .map((extra) => extra.skill),
      ];
      for (const id of secondaryIds) {
        if (skillIds.has(id) || secondary.length >= 3) continue;
        const skill = getSkill(id);
        if (!skill || skill.gates.length < 7) {
          discarded.push({ ruleId: primaryRule.id, reason: `Dropped secondary ${id}.` });
          continue;
        }
        secondary.push(skill);
        skillIds.add(id);
      }
    }
  }

  const curriculum = curriculumFor(primaryRule?.curriculum ?? [], classification.domains);
  const evidence = primaryRule?.evidence ?? [];
  const evidenceRequirements = primaryRule?.evidenceRequirements ?? ["unknowns"];
  const pinned = evidence.length > 0 && evidence.every((item) => /^[0-9a-f]{7,40}$/.test(item.commit ?? ""));

  const gates = evaluateGates({
    request,
    evidenceCount: evidence.length,
    pinned,
    curriculumStatuses: curriculum.map((item) => item.status),
    loadedCount: skillIds.size,
    catalogCount: SKILLS.length,
    evidenceRequirements,
    forensicsHasSubject: subjectPresent(request),
    intent: classification.intent,
  });

  const gateState = worst(gates);
  const executor: Decision["executor"] = gateState === "fail" || !primary ? "stopped" : "dry-run";

  const pipeline: Decision["pipeline"] = [
    {
      step: "Classify",
      state: "pass",
      detail: `${classification.intent} · ${classification.domains.join(", ") || "no domain"}`,
    },
    {
      step: "Match rules",
      state: matched.length ? "pass" : "fail",
      detail: matched.map((rule) => rule.id).join(" → ") || "none",
    },
    {
      step: "Policy gate",
      state: gateState,
      detail: gates.map((gate) => `${gate.id}:${gate.state}`).join(" "),
    },
    {
      step: "Load skills",
      state: !primary ? "fail" : executor === "stopped" ? "fail" : "pass",
      detail: !primary
        ? "No skill selected."
        : executor === "stopped"
          ? `Selected ${[primary.id, ...secondary.map((skill) => skill.id)].join(", ")} — not executed.`
          : [primary.id, ...secondary.map((skill) => skill.id)].join(", "),
    },
    {
      step: "Curriculum",
      state: curriculum.some((item) => item.status === "UNKNOWN")
        ? "fail"
        : curriculum.some((item) => item.status === "DRAFT")
          ? "hold"
          : "pass",
      detail: curriculum.map((item) => `${item.path} (${item.status})`).join("; ") || "none",
    },
    {
      step: "Evidence",
      state: pinned ? "pass" : "hold",
      detail: pinned ? "commits pinned" : "commit SHA still required",
    },
    {
      step: "Executor",
      state: executor === "stopped" ? "fail" : "hold",
      detail: executor === "stopped" ? "Stopped before any skill runs." : "Dry-run only. Nothing is signed.",
    },
  ];

  return {
    request,
    classification,
    matchedRuleIds: matched.map((rule) => rule.id),
    primary,
    secondary,
    notLoaded: SKILLS.map((skill) => skill.id).filter((id) => !skillIds.has(id)),
    discarded,
    curriculum,
    evidence,
    evidenceRequirements,
    gates,
    executor,
    note: primaryRule?.note,
    pipeline,
  };
}
