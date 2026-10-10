export type Intent =
  | "security_audit"
  | "forensics"
  | "reverse_engineering"
  | "runtime_research"
  | "curriculum_authoring"
  | "migration"
  | "testing"
  | "implementation"
  | "analysis"
  | "generic";

export type GateState = "pass" | "hold" | "fail";

export type CatalogStatus = "CATALOG_VERIFIED" | "DRAFT" | "UNKNOWN";

export type Classification = {
  intent: Intent;
  domains: string[];
  languages: string[];
  hits: string[];
};

export type SkillMeta = {
  id: string;
  source: "official" | "ecosystem" | "local";
  repo: string;
  use: string;
  gates: string[];
};

export type CurriculumRef = {
  id: string;
  path: string;
  status: CatalogStatus;
  note?: string;
};

export type EvidenceRepo = {
  repo: string;
  role: string;
  commit: string | null;
};

export type GateResult = {
  id: string;
  state: GateState;
  detail: string;
};

export type Rule = {
  id: string;
  priority: number;
  intents?: Intent[];
  domains?: string[];
  excludeDomains?: string[];
  primary: string;
  secondary: string[];
  extraSecondary?: { domain: string; skill: string }[];
  curriculum: string[];
  evidence: EvidenceRepo[];
  evidenceRequirements: string[];
  note?: string;
};

export type SkillCallHierarchy = {
  primary: string | null;
  loadOrder: string[];
  hardDependencies: string[];
  secondary: string[];
  dependencyEdges: { skill: string; requires: string[] }[];
  missingCatalogSkills: string[];
  cycles: string[];
};

export type Decision = {
  request: string;
  agentProfile: string;
  compiledAgentSystemPrompt: string;
  callHierarchy: SkillCallHierarchy;
  classification: Classification;
  matchedRuleIds: string[];
  primary: SkillMeta | null;
  secondary: SkillMeta[];
  notLoaded: string[];
  discarded: { ruleId: string; reason: string }[];
  curriculum: CurriculumRef[];
  evidence: EvidenceRepo[];
  evidenceRequirements: string[];
  gates: GateResult[];
  executor: "stopped" | "dry-run";
  note?: string;
  pipeline: { step: string; state: GateState; detail: string }[];
};
