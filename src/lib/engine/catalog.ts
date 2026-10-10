import type { CatalogStatus, SkillMeta } from "./types";

export const MANDATORY_GATES = [
  "no_secrets",
  "no_implicit_tx",
  "pin_source",
  "treat_untrusted",
  "progressive_load",
  "require_evidence",
  "verify_existence",
] as const;

const GATES = [...MANDATORY_GATES];

export const SKILLS: SkillMeta[] = [
  {
    id: "solana-dev",
    source: "official",
    repo: "solana-foundation/solana-dev-skill",
    use: "Programs, clients, tests, and account design.",
    gates: GATES,
  },
  {
    id: "eth-to-sol",
    source: "official",
    repo: "solana-foundation/eth-to-sol-skill",
    use: "Translate Solidity patterns into Solana accounts and instructions.",
    gates: GATES,
  },
  {
    id: "solana-vulnerability-scanner",
    source: "ecosystem",
    repo: "trailofbits/skills",
    use: "Signer, owner, PDA, arbitrary CPI, and sysvar checks.",
    gates: GATES,
  },
  {
    id: "zz-code-recon",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "Map trust boundaries before looking for bugs.",
    gates: GATES,
  },
  {
    id: "vulnhunter",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "Search for variants only after a concrete bug class is named.",
    gates: GATES,
  },
  {
    id: "token-integration-analyzer",
    source: "ecosystem",
    repo: "trailofbits/skills",
    use: "Token-2022 and SPL token integration checks.",
    gates: GATES,
  },
  {
    id: "safe-solana-builder",
    source: "ecosystem",
    repo: "frankcastleauditor/safe-solana-builder",
    use: "Scaffold a new program with secure-by-default constraints.",
    gates: GATES,
  },
  {
    id: "svm",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "Runtime, SIMD, consensus, and validator economics.",
    gates: GATES,
  },
  {
    id: "integrating-jupiter",
    source: "ecosystem",
    repo: "jup-ag/agent-skills",
    use: "Jupiter swap, lend, and routing integration.",
    gates: GATES,
  },
  {
    id: "solana-kit",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "TypeScript client work on @solana/kit.",
    gates: GATES,
  },
  {
    id: "wallet-analysis",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "Read wallet history. Do not attribute without a signature.",
    gates: GATES,
  },
  {
    id: "squads",
    source: "ecosystem",
    repo: "sendaifun/skills",
    use: "Squads multisig and smart-account flows.",
    gates: GATES,
  },
  {
    id: "forensics-local",
    source: "local",
    repo: "bakaxbaka/solana-curriculum",
    use: "Timelines and call graphs tied to signatures or accounts.",
    gates: GATES,
  },
  {
    id: "curriculum-author",
    source: "local",
    repo: "bakaxbaka/solana-curriculum",
    use: "Write a lesson that matches the course plan and week skeleton.",
    gates: GATES,
  },
];

export const CURRICULUM: Record<
  string,
  { path: string; status: CatalogStatus; note?: string }
> = {
  "blockchain-basics": {
    path: "courses/blockchain-basics",
    status: "CATALOG_VERIFIED",
  },
  "rust-basics-for-solana-development": {
    path: "courses/rust-basics-for-solana-development",
    status: "CATALOG_VERIFIED",
  },
  "anchor-and-programs": {
    path: "courses/anchor-and-programs",
    status: "CATALOG_VERIFIED",
    note: "Week 8 is the vulnerability-analysis module.",
  },
  "spl-tokens-2022-and-extensions": {
    path: "courses/spl-tokens-2022-and-extensions",
    status: "CATALOG_VERIFIED",
  },
  "web-for-solana-development-101": {
    path: "courses/web-for-solana-development-101",
    status: "CATALOG_VERIFIED",
  },
  "web3-solana-starter-pack": {
    path: "courses/web3-solana-starter-pack",
    status: "CATALOG_VERIFIED",
  },
  "defi-on-jupiter": {
    path: "courses/defi-on-jupiter",
    status: "DRAFT",
    note: "Only week 1 exists. Do not treat it as a stable course.",
  },
};

export function getSkill(id: string): SkillMeta | undefined {
  return SKILLS.find((skill) => skill.id === id);
}
