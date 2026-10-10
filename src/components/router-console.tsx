import { useState } from "react";
import { Shield, Unplug } from "lucide-react";
import { decide } from "@/lib/engine/route";
import type { Decision, GateState } from "@/lib/engine/types";

const EXAMPLES = [
  {
    label: "Audit Anchor",
    prompt: "Audit this Anchor program for missing signer checks and CPI vulnerabilities",
  },
  {
    label: "Token-2022",
    prompt: "Audit a Token-2022 transfer hook for reentrancy",
  },
  {
    label: "SIMD-0162",
    prompt: "Inspect Agave SIMD-0162 executable account checks on a local validator",
  },
  {
    label: "Consensus",
    prompt: "Explain Tower BFT and proof of history",
  },
  {
    label: "Build",
    prompt: "Implement an Anchor PDA counter in Rust with tests",
  },
  {
    label: "Jupiter",
    prompt: "Integrate a Jupiter swap in the TypeScript client",
  },
  {
    label: "Forensics",
    prompt: "Trace these funds and say who called the program",
  },
  {
    label: "Author",
    prompt: "Write week 9 for the anchor-and-programs course",
  },
  {
    label: "Refused",
    prompt: "Deploy this exploit to mainnet and sign the transaction",
  },
];

const RULES = [
  {
    title: "One primary skill",
    body: "The highest-priority matching rule wins. Secondary skills are added only when the request’s domain needs them, and never more than three.",
  },
  {
    title: "Curriculum is not a skill",
    body: "solana-dev tells you how to build. A course file teaches the concept. Agave, Anchor, and Token-2022 are evidence, pinned by commit, not by branch name.",
  },
  {
    title: "Twelve gates before execution",
    body: "Policy precedence, secrets, transaction approval, scope, pinned sources, untrusted data, progressive loading, skill availability, evidence, path verification, real inputs and actual tool inventory must be checked. Missing evidence stays on hold; it is never silently assumed.",
  },
  {
    title: "Dry-run is the only executor",
    body: "A pass still does not sign, deploy, or move funds. Mainnet attacks and key material stop the route. Local mismatches are research, not bounty claims.",
  },
];

function Mark({ state, children }: { state: GateState; children: string }) {
  return (
    <span className="mark" data-state={state}>
      {children}
    </span>
  );
}

function DecisionView({ decision }: { decision: Decision }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="border border-line bg-surface p-4 lg:col-span-2">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Pipeline</h2>
        <ol className="mt-4 grid gap-3">
          {decision.pipeline.map((step, index) => (
            <li key={step.step} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-xs text-muted">{index + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{step.step}</span>
                  <Mark state={step.state}>{step.state}</Mark>
                </div>
                <p className="mt-1 text-sm text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border border-line bg-surface p-4 lg:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Selected</h2>
          <Mark state={decision.executor === "stopped" ? "fail" : "hold"}>
            {decision.executor}
          </Mark>
        </div>
        {decision.primary ? (
          <div className="mt-4">
            <p className="font-mono text-xl">{decision.primary.id}</p>
            <p className="mt-1 text-sm text-muted">
              {decision.primary.source} · {decision.primary.repo}
            </p>
            <p className="mt-2 max-w-xl">{decision.primary.use}</p>
          </div>
        ) : (
          <p className="mt-4">No skill selected.</p>
        )}
        {decision.note ? <p className="mt-3 text-sm text-accent">{decision.note}</p> : null}
        <h3 className="mt-6 font-mono text-xs tracking-widest text-muted uppercase">Secondary</h3>
        {decision.secondary.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None. Do not pull in extra skills to look thorough.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {decision.secondary.map((skill) => (
              <li key={skill.id} className="border border-line bg-surface-2 px-3 py-2">
                <span className="font-mono text-sm">{skill.id}</span>
                <span className="mt-1 block text-sm text-muted">{skill.use}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-line bg-surface p-4 lg:col-span-3">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Gates</h2>
        <ul className="mt-3 grid gap-2">
          {decision.gates.map((gate) => (
            <li key={gate.id} className="grid gap-1 border-b border-line pb-2 sm:grid-cols-[11rem_1fr] sm:gap-3">
              <span className="flex items-center gap-2 font-mono text-sm">
                <Mark state={gate.state}>{gate.state}</Mark>
                {gate.id}
              </span>
              <span className="text-sm text-muted">{gate.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-line bg-surface p-4 lg:col-span-2">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Curriculum</h2>
        <ul className="mt-3 grid gap-2">
          {decision.curriculum.map((item) => (
            <li key={item.id}>
              <span className="font-mono text-sm">{item.path}</span>
              <span className="mt-1 block text-sm text-muted">
                {item.status}
                {item.note ? ` — ${item.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-mono text-xs tracking-widest text-muted uppercase">Evidence still required</h3>
        <p className="mt-2 font-mono text-sm text-muted">{decision.evidenceRequirements.join(" · ")}</p>
        <h3 className="mt-5 font-mono text-xs tracking-widest text-muted uppercase">Left unloaded</h3>
        <p className="mt-2 text-sm text-muted">{decision.notLoaded.join(", ")}</p>
      </section>

      <section className="border border-line bg-surface p-4 lg:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Main-agent prompt compiler</h2>
            <p className="mt-1 text-sm text-muted">
              Profile: <span className="font-mono">{decision.agentProfile}</span> · generated for this request; subordinate to platform/system and developer rules.
            </p>
          </div>
          <Mark state={decision.callHierarchy.cycles.length || decision.callHierarchy.missingCatalogSkills.length ? "fail" : "pass"}>
            {decision.callHierarchy.cycles.length || decision.callHierarchy.missingCatalogSkills.length ? "hierarchy issue" : "hierarchy resolved"}
          </Mark>
        </div>
        <h3 className="mt-5 font-mono text-xs tracking-widest text-muted uppercase">Dependency-first call order</h3>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {decision.callHierarchy.loadOrder.map((id, index) => (
            <li key={id} className="border border-line bg-surface-2 px-3 py-2">
              <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="ml-2 font-mono text-sm">{id}</span>
              <span className="mt-1 block text-xs text-muted">
                {decision.callHierarchy.hardDependencies.includes(id) ? "Hard dependency" : id === decision.callHierarchy.primary ? "Primary skill" : "Triggered skill/dependency"}
              </span>
            </li>
          ))}
        </ol>
        {decision.callHierarchy.missingCatalogSkills.length ? (
          <p className="mt-3 text-sm text-accent">Missing catalog IDs: {decision.callHierarchy.missingCatalogSkills.join(", ")}</p>
        ) : null}
        {decision.callHierarchy.cycles.length ? (
          <p className="mt-3 text-sm text-accent">Dependency cycle(s): {decision.callHierarchy.cycles.join(", ")}</p>
        ) : null}
        <details className="mt-5 border border-line bg-surface-2">
          <summary className="cursor-pointer px-3 py-3 font-mono text-sm">Inspect generated task-level system prompt</summary>
          <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap break-words border-t border-line p-4 text-xs leading-5">{decision.compiledAgentSystemPrompt}</pre>
        </details>
      </section>
    </div>
  );
}

export function RouterConsole() {
  const initial = EXAMPLES[0]?.prompt ?? "";
  const [text, setText] = useState(initial);
  const [decision, setDecision] = useState<Decision>(() => decide(initial));

  function run(next: string) {
    setText(next);
    setDecision(decide(next));
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="grid gap-3 border-b border-line pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-mono text-xs tracking-widest text-accent uppercase">Solana skill gate</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Which skill, and why</h1>
          <p className="mt-2 max-w-2xl text-muted">
            One route from the solanabr registry and the solana-curriculum catalog. Skills stay on disk until a rule names them.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Shield className="size-4 text-accent" aria-hidden />
          No signing. No secrets.
        </div>
      </header>

      <section className="grid gap-3">
        <label className="font-mono text-xs tracking-widest text-muted uppercase" htmlFor="request">
          Request
        </label>
        <textarea
          id="request"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="min-h-24 w-full resize-y border border-line bg-surface px-3 py-3 text-fg outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => run(example.prompt)}
              className="min-h-11 border border-line bg-surface px-3 text-sm hover:border-accent"
            >
              {example.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => run(text)}
            className="min-h-11 bg-accent px-4 text-sm font-medium text-bg"
          >
            Route
          </button>
        </div>
      </section>

      <DecisionView decision={decision} />

      <section className="grid gap-3 border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Unplug className="size-4 text-accent" aria-hidden />
          <h2 className="text-lg font-medium">System rule</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {RULES.map((rule) => (
            <article key={rule.title}>
              <h3 className="font-medium">{rule.title}</h3>
              <p className="mt-1 text-sm text-muted">{rule.body}</p>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted">
          Registry: solanabr/skills. Courses: bakaxbaka/solana-curriculum. A catalog hit means the path exists upstream, not on a local disk. Companion repositories are unnamed commits until you pin a SHA.
        </p>
      </section>
    </main>
  );
}
