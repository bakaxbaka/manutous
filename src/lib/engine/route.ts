  const gateState = worst(gates);
  const agentProfile = profileFor(classification);
  const safeRequest = gates.some((gate) => gate.id === "no_secrets" && gate.state === "fail")
    ? "[REDACTED: possible secret material detected]"
    : request;
  const compiledAgentSystemPrompt = compileTaskPrompt({
    request: safeRequest,
    context,
    classification,
    matchedRuleIds: matched.map((rule) => rule.id),
    primary,
    secondary,
    callHierarchy,
    curriculum,
    evidenceRequirements,
    gates,
    evidence,
  });
  const executor: Decision["executor"] = gateState === "fail" || !primary ? "stopped" : "dry-run";
  const executionStatus: Decision["executionStatus"] =
    gateState === "fail" || !primary
      ? "blocked_by_policy"
      : gateState === "hold" || callHierarchy.missingCatalogSkills.length > 0 || callHierarchy.cycles.length > 0
        ? "blocked_pending_gates"
        : "ready_for_review";

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
      step: "Resolve skill call order",
      state: callHierarchy.cycles.length || callHierarchy.missingCatalogSkills.length ? "fail" : "pass",
      detail: callHierarchy.loadOrder.join(" → ") || "No skill selected.",
    },
    {
      step: "Verify skill availability",
      state: gates.find((gate) => gate.id === "skill_availability")?.state ?? "hold",
      detail: gates.find((gate) => gate.id === "skill_availability")?.detail ?? "Availability not checked.",
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
      state: pinned || !evidenceBoundIntent ? "pass" : "hold",
      detail: pinned ? "source references are pinned" : evidenceBoundIntent ? "immutable target/source revision still required" : "not evidence-bound; record versions when implementation is verified",
    },
    {
      step: "Executor",
      state: executor === "stopped" ? "fail" : "hold",
      detail: executor === "stopped" ? "Stopped before any skill runs." : "Dry-run only. Nothing is signed.",
    },
  ];

  return {
    request: safeRequest,
    executionStatus,
    agentProfile,
    compiledAgentSystemPrompt,
    callHierarchy,
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
