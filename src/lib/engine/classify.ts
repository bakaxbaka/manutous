import type { Classification, Intent } from "./types";

const DOMAIN_RULES: { domain: string; pattern: RegExp }[] = [
  { domain: "token-2022", pattern: /token-?2022|transfer hook|permanent delegate|confidential transfer/i },
  { domain: "spl-token", pattern: /\bspl[\s-]?token\b|\bmint\b/i },
  { domain: "anchor", pattern: /\banchor\b|\bpda\b|\bcpi\b|#\[account\]|declare_id!/i },
  { domain: "simd", pattern: /\bsimd\b/i },
  { domain: "consensus", pattern: /proof of history|\bpoh\b|tower bft|fork choice|nakamoto/i },
  { domain: "runtime", pattern: /\bagave\b|\bsbpf\b|\bebpf\b|syscall|verifier|bpf loader|executable account|dynamic stack|feature gate|feature activation|account hash/i },
  { domain: "binary-analysis", pattern: /ghidra|disassembl|decompil|program\.so|\belf\b|bytecode|call graph|static analysis/i },
  { domain: "jupiter", pattern: /\bjupiter\b|\bdamm\b|\bdex\b|ultra swap/i },
  { domain: "wallet", pattern: /\bwallet\b|\bphantom\b|\brpc\b|frontend|transaction construction/i },
  { domain: "ethereum", pattern: /\bethereum\b|\bsolidity\b|\bevm\b/i },
  { domain: "staking", pattern: /\bstak(e|ing)\b|validator commission|vote credit/i },
  { domain: "fuzzing", pattern: /fuzz|property-based|arbitrary input/i },
  { domain: "testing", pattern: /\btest(?:s|ing)?\b|litesvm|mollusk|surfpool|regression test/i },
  { domain: "multisig", pattern: /\bmultisig\b|\bsquads\b/i },
  { domain: "program", pattern: /\bprogram\b|\binstruction\b|\baccount constraint/i },
];

function intentOf(raw: string): Intent {
  // Specific intents first: audit language must beat runtime/reverse-engineering markers.
  if (/\baudit\b|vulnerab|bug bounty|missing signer|arbitrary cpi|security review|attack surface/i.test(raw)) {
    return "security_audit";
  }
  if (/forensic|trace (these |the )?funds|who called|incident timeline/i.test(raw)) {
    return "forensics";
  }
  if (/ghidra|disassembl|decompil|bytecode|reverse[- ]engineer|call graph|program\.so/i.test(raw)) {
    return "reverse_engineering";
  }
  if (/course plan|curriculum|write week|teaching resource|lesson module/i.test(raw)) {
    return "curriculum_authoring";
  }
  if (/\b(solidity|ethereum|evm|erc[- ]?20)\b|port to solana|migrate to solana/i.test(raw)) {
    return "migration";
  }
  if (/\b(test|tests|testing|fuzz|fuzzing|property-based|litesvm|mollusk|surfpool|regression test)\b/i.test(raw)) {
    return "testing";
  }
  if (/\bsimd\b|\bagave\b|\bsbpf\b|syscall|verifier|executable account|feature gate|feature activation|runtime research|tower bft|proof of history/i.test(raw)) {
    return "runtime_research";
  }
  if (/\bimplement\b|\bscaffold\b|build a|write a program|add an instruction|create a program|integrate a/i.test(raw)) {
    return "implementation";
  }
  if (/\binspect\b|\breview\b|\bexplain\b|\bcheck\b|\banalyze\b/i.test(raw)) {
    return "analysis";
  }
  return "generic";
}

export function classify(raw: string): Classification {
  const domains = DOMAIN_RULES.filter((rule) => rule.pattern.test(raw)).map((rule) => rule.domain);
  const languages: string[] = [];
  if (/\brust\b/i.test(raw)) languages.push("rust");
  if (/\btypescript\b|\bjavascript\b|\b\bts\b/i.test(raw)) languages.push("typescript");
  const hits = [...domains, ...languages, intentOf(raw)];
  return { intent: intentOf(raw), domains, languages, hits };
}
