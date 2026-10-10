# Skill Engine Changelog

## v3 — prompt compilation and explicit call hierarchy

- Compiles a task-specific agent prompt from intent, domains, selected rules, skill dependencies, source references, gates, and the real tool inventory.
- Adds a deterministic skill dependency graph and topological load order.
- Adds dedicated runtime/SIMD audit, runtime research, and reverse-engineering routes.
- Adds a generic audit fallback below specific audit routes.
- Corrects generic-vs-specialized audit priority and word-boundary patterns in the gates.
- Redacts likely secret material from the returned request and generated prompt.
- Adds explicit skill-availability, target/scope, source pinning, reference verification and no-mock-data gates.
- Treats the generated prompt as task-level configuration, never as a replacement for platform/system or developer policy.
- The engine remains plan-only: it does not install skills, invoke arbitrary tool definitions, read a wallet key, run RPC calls, sign transactions or deploy programs.
