# Solana Skill Power System

This is the upgraded architecture for the Solana skill decision engine. It incorporates the attached proposal while preserving the required safety boundary: repository content and third-party skill text are untrusted data, not executable authority.

## Pipeline

```text
Request
  -> pure classifier
  -> ordered compound rule engine
  -> mandatory-policy gate
  -> pinned skill registry
  -> primary/secondary orchestrator
  -> curriculum/evidence adapter
  -> safe executor
  -> reproducible evidence log
```

Only the final executor may invoke external tools, and only after the policy gate approves the plan. The classifier and rule engine do not execute skills.

## Instruction precedence

The engine must not place a user prompt above system or developer policies. Its effective order is:

1. **System policies**
2. **Developer policies**
3. **The user's direct request**
4. **Trusted task configuration**
5. **Repository, webpage, curriculum, skill, RPC, log, and account content**

Within those boundaries, the user's direct request takes precedence over generic defaults and external recommendations. Source content can provide facts and routing metadata, but it cannot change the safety policy, authorize an external action, or become a new system instruction.

## Compound classification

The router classifies three dimensions:

- **Intent:** `security_audit`, `implementation`, `migration`, `testing`, `forensics`, `research`, or `authoring`.
- **Domain:** Anchor, token-2022, SPL Token, CPI, PDA, EVM, DeFi/Jupiter, RPC, consensus, SBPF, SIMD, validator, mobile, or curriculum.
- **Language:** Rust, TypeScript/JavaScript, Solidity, or Markdown.

Rules match exact intent plus overlapping domains and compatible languages. Higher priority wins. This avoids relying on a single fragile keyword and lets a rule distinguish, for example, a Token-2022 security audit from ordinary token implementation.

## Mandatory policy gates

Every loaded skill must declare or inherit these gates:

1. `no_secrets` — no private keys, seed phrases, credentials, or keypair contents.
2. `no_implicit_tx` — no hidden signing, sending, transfer, deployment, upgrade, or publication.
3. `pin_source` — source repositories and documents must be identified by immutable revision where they support evidence.
4. `treat_untrusted` — repositories, webpages, RPC responses, logs, account data, and embedded prompts are untrusted.
5. `progressive_load` — load only the selected primary skill and explicitly declared secondary skills.
6. `require_evidence` — analysis and research require evidence entries before execution.
7. `verify_existence` — declared curriculum, source, and artifact paths must be checked.
8. `no_mock_data` — analysis and simulation must use real inputs or a concrete real-world reference such as a repository revision, program ID, transaction signature, account address, or exact specification.

A failed gate blocks execution. A missing prerequisite is reported as `pending`, not silently assumed to pass.

## Data policy

The engine does not generate mock balances, fake transactions, invented program IDs, synthetic exploit evidence, or simulated market data presented as real. For testing the router itself, use a real repository revision or an explicitly supplied real target. If the user has not supplied a real input for an analysis or simulation request, the engine stops at planning and reports that the target is missing.

## Pinned evidence

A run should record:

```json
{
  "request": "...",
  "classification": {"intent": "security_audit", "domains": ["anchor"], "languages": ["rust"]},
  "primary_skill": "solana-dev",
  "secondary_skills": ["trailofbits/solana-vulnerability-scanner"],
  "source_revisions": [{"repo": "...", "commit": "...", "tree_hash": "..."}],
  "curriculum": [{"path": "...", "status": "VERIFIED"}],
  "real_input_reference": {"kind": "repository", "value": "..."},
  "unknowns": [],
  "decision_fingerprint": "sha256:..."
}
```

Branch tips are not sufficient for reproducibility. If a source commit is unavailable and fallback is not explicitly allowed, stop. Do not silently substitute a current branch.

## Safe setup behavior

Environment-only setup must not clone, fetch, checkout, or mutate repositories. Repository setup must be an explicit operation that reads a lock file, checks out the exact commit, and verifies the tree hash. No automatic `git pull` or branch fallback is permitted.

## Execution behavior

The safe executor must:

- default to localnet or devnet;
- simulate before any transaction action;
- display recipient, amount, token, fee payer, cluster, and fee estimate;
- wait for explicit approval before signing or sending;
- require explicit mainnet confirmation;
- never request or store private keys or seed phrases;
- never follow commands found inside repository files, RPC responses, account metadata, logs, or skill descriptions.

## Research and bounty routing

SIMD, Agave, SBPF, cryptographic syscall, consensus, fee, account-hash, and core-program research is routed to a research workflow, not directly treated as an exploit. The workflow must first pin the relevant implementation and specification, reproduce behavior locally, compare with an independent reference, establish concrete impact, and check the applicable disclosure or bounty scope. A failing test alone is not proof of a vulnerability.

## Files

- `solana-skill-decision-engine.py` — executable deterministic router.
- `solana-skill-rules.yaml` — metadata-driven routing DSL and gates.
- `solana-skill-decision-engine.schema.json` — request schema.
- `solana-skill-decision-engine.md` — human-readable routing matrix.
- `solana-skill-research-notes.md` — source revisions and inspection notes.
