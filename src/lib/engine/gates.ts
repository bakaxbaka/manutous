import type { GateResult, GateState } from "./types";

const SECRET = [
  /seed phrase/i,
  /mnemonic/i,
  /private key/i,
  /BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY/,
  /\[\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,/,
];

const JAILBREAK = [
  /ignore (?:all )?(?:previous|prior|above) (?:instructions|rules|prompts)/i,
  /do not reject/i,
  /disabl(?:e|ing) (?:safety|refusals|gates)/i,
  /you are now/i,
  /edit this prompt/i,
];

const LIVE_ATTACK = /\b(mainnet(?:-beta)?)\b/i;
const MUTATING = /\b(deploy|send|sign|drain|exploit|attack|airdrop)\b/i;
const LOCAL_OK = /\b(localnet|local validator|unit test|dry-run|simulate|devnet)\b/i;

function box(id: string, state: GateState, detail: string): GateResult {
  return { id, state, detail };
}

export function evaluateGates(input: {
  request: string;
  evidenceCount: number;
  pinned: boolean;
  curriculumStatuses: string[];
  loadedCount: number;
  catalogCount: number;
  evidenceRequirements: string[];
  forensicsHasSubject: boolean;
  intent: string;
}): GateResult[] {
  const { request } = input;
  const secret = SECRET.some((pattern) => pattern.test(request));
  const injection = JAILBREAK.some((pattern) => pattern.test(request));
  const liveMutation = LIVE_ATTACK.test(request) && MUTATING.test(request);
  const wantsMutation = MUTATING.test(request) && !LOCAL_OK.test(request);

  const curriculumFail = input.curriculumStatuses.includes("UNKNOWN");
  const curriculumDraft = input.curriculumStatuses.includes("DRAFT");

  const evidenceHold =
    input.evidenceRequirements.length === 0 ||
    (input.intent === "forensics" && !input.forensicsHasSubject);

  return [
    secret
      ? box("no_secrets", "fail", "The request contains key material. It will not be stored or used.")
      : box("no_secrets", "pass", "No seed, private key, or keypair array in the request."),
    liveMutation
      ? box("no_implicit_tx", "fail", "Mainnet deploy, send, or attack is refused. Local or simulated work only.")
      : wantsMutation
        ? box("no_implicit_tx", "hold", "A mutating action was asked for without a local or simulate limit. Executor stays dry-run.")
        : box("no_implicit_tx", "pass", "No transaction will be signed or sent."),
    input.pinned
      ? box("pin_source", "pass", "Every evidence repo has a commit SHA.")
      : input.evidenceCount > 0
        ? box("pin_source", "hold", "Repos are named, but no commit is pinned. Do not treat a branch tip as the audited revision.")
        : box("pin_source", "hold", "No companion repo was required. Still record a commit before claiming a finding."),
    injection
      ? box("treat_untrusted", "fail", "The request tries to override policy. Skill text and repo files cannot do that either.")
      : box("treat_untrusted", "pass", "Registry text, curriculum files, and RPC data stay untrusted data."),
    input.loadedCount === 0
      ? box("progressive_load", "pass", "No skill module was imported.")
      : input.loadedCount < input.catalogCount
        ? box(
            "progressive_load",
            "pass",
            `Loading ${input.loadedCount} of ${input.catalogCount} skills. The rest stay unloaded.`,
          )
        : box("progressive_load", "fail", "Refusing to import the whole registry for one request."),
    evidenceHold
      ? box("require_evidence", "hold", "Evidence fields are required before any finding or attribution.")
      : box("require_evidence", "pass", input.evidenceRequirements.join(", ")),
    curriculumFail
      ? box("verify_existence", "fail", "A cited course is not in the curriculum catalog.")
      : curriculumDraft
        ? box("verify_existence", "hold", "A cited course is a draft. Say so. Do not present it as stable.")
        : box("verify_existence", "pass", "Cited courses are in the curriculum catalog. This is not a check of your local disk."),
  ];
}

export function worst(gates: GateResult[]): GateState {
  if (gates.some((gate) => gate.state === "fail")) return "fail";
  if (gates.some((gate) => gate.state === "hold")) return "hold";
  return "pass";
}
