"""Regression tests for the Solana skill router + task-prompt compiler (v3)."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "solana-skill-decision-engine.py"
SPEC = importlib.util.spec_from_file_location("solana_skill_engine", ENGINE_PATH)
ENGINE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
SPEC.loader.exec_module(ENGINE)


class DecisionEngineTests(unittest.TestCase):
    def run_route(self, request, **extra):
        data = {
            "request": request,
            "network": "localnet",
            "available_tools": ["unit_test_fixture"],
            "available_skills": list(ENGINE.SKILL_DEPENDENCIES.keys()),
        }
        data.update(extra)
        return ENGINE.route(data)

    def test_specific_anchor_audit_beats_generic_audit(self):
        decision = self.run_route(
            "Audit this Anchor program for missing signer checks and CPI vulnerabilities",
            target={"kind": "repository", "path_or_id": "./program", "commit": "abcdef0123456789"},
            authorized_scope=True,
        )
        rules = [x["id"] for x in decision["matched_rules"]]
        self.assertEqual(rules[0], "AUDIT_PROGRAM")
        self.assertLess(rules.index("AUDIT_PROGRAM"), rules.index("AUDIT_GENERIC"))
        self.assertIn("compiled_agent_system_prompt", decision)

    def test_token_2022_audit_selects_token_specialist(self):
        decision = self.run_route(
            "Audit a Token-2022 transfer hook for authorization bugs",
            target={"kind": "repository", "path_or_id": "./program", "commit": "abcdef0123456789"},
            authorized_scope=True,
        )
        self.assertEqual(decision["matched_rules"][0]["id"], "AUDIT_TOKEN_2022")
        order = decision["call_hierarchy"]["load_order_dependencies_first"]
        self.assertIn("trailofbits/token-integration-analyzer", order)

    def test_runtime_audit_routes_to_runtime_skill_and_auditor(self):
        decision = self.run_route(
            "Audit Agave SIMD-0459 syscall pointer validation for vulnerabilities",
            target={"kind": "repository", "path_or_id": "./agave", "commit": "abcdef0123456789"},
            authorized_scope=True,
        )
        self.assertEqual(decision["matched_rules"][0]["id"], "AUDIT_RUNTIME")
        self.assertIn("svm", decision["call_hierarchy"]["load_order_dependencies_first"])
        self.assertIn("auditor-skill", decision["call_hierarchy"]["load_order_dependencies_first"])
        self.assertEqual(decision["agent_profile"], "security_auditor")

    def test_simd_research_routes_to_runtime_research_rule(self):
        decision = self.run_route(
            "Inspect Agave SIMD-0459 syscall parameter address restrictions",
            target={"kind": "repository", "path_or_id": "./agave", "commit": "abcdef0123456789"},
            authorized_scope=True,
        )
        self.assertEqual(decision["matched_rules"][0]["id"], "RUNTIME_RESEARCH")
        self.assertEqual(decision["agent_profile"], "runtime_researcher")

    def test_reverse_engineering_has_dedicated_route(self):
        decision = self.run_route(
            "Disassemble this generic binary and map its call graph",
            target={"kind": "bytecode", "path_or_id": "./target.bin", "sha256": "a" * 64},
            authorized_scope=True,
        )
        self.assertEqual(decision["classification"]["intent"], "reverse_engineering")
        self.assertEqual(decision["matched_rules"][0]["id"], "REVERSE_ENGINEERING")
        self.assertEqual(decision["agent_profile"], "reverse_engineer")

    def test_dependency_graph_is_topologically_ordered(self):
        decision = self.run_route(
            "Audit this Anchor program",
            target={"kind": "repository", "path_or_id": "./program", "commit": "abcdef0123456789"},
            authorized_scope=True,
        )
        order = decision["call_hierarchy"]["load_order_dependencies_first"]
        index = {skill: n for n, skill in enumerate(order)}
        for edge in decision["call_hierarchy"]["dependency_edges"]:
            for dependency in edge["requires"]:
                if dependency in index and edge["skill"] in index:
                    self.assertLess(index[dependency], index[edge["skill"]])

    def test_missing_target_holds_evidence_gates(self):
        decision = self.run_route("Trace these funds and explain the incident timeline")
        self.assertEqual(decision["execution_status"], "blocked_pending_gates")
        self.assertEqual(decision["gates"]["require_evidence"], "hold")
        self.assertEqual(decision["gates"]["no_mock_data"], "hold")

    def test_mainnet_drain_is_blocked(self):
        decision = self.run_route(
            "Drain the victim wallet on mainnet",
            network="mainnet",
            external_action="send",
        )
        self.assertEqual(decision["execution_status"], "blocked_by_policy")
        self.assertEqual(decision["gates"]["no_implicit_tx"], "fail")

    def test_mutating_request_without_approval_is_held(self):
        decision = self.run_route(
            "Deploy this program to devnet",
            network="devnet",
            external_action="deploy",
            authorized_scope=True,
        )
        self.assertEqual(decision["gates"]["no_implicit_tx"], "hold")
        self.assertEqual(decision["execution_status"], "blocked_pending_gates")

    def test_secret_like_request_is_redacted_from_output_and_prompt(self):
        decision = self.run_route("Use this private key to deploy now")
        self.assertEqual(decision["request"], "[REDACTED: possible secret material detected]")
        self.assertNotIn("Use this private key", decision["compiled_agent_system_prompt"])
        self.assertEqual(decision["gates"]["no_secrets"], "fail")

    def test_generated_prompt_does_not_claim_to_replace_system_policy(self):
        decision = self.run_route("Write a curriculum lesson about Solana accounts")
        prompt = decision["compiled_agent_system_prompt"]
        self.assertIn("subordinate to all platform/system and developer instructions", prompt)
        self.assertIn("Skill call hierarchy", prompt)
        self.assertIn("This engine is plan-only", prompt)

    def test_unavailable_skill_is_not_silently_replaced(self):
        decision = self.run_route(
            "Audit this Anchor program",
            target={"kind": "repository", "path_or_id": "./program", "commit": "abcdef0123456789"},
            authorized_scope=True,
            available_skills=["solana-dev"],
        )
        self.assertTrue(decision["call_hierarchy"]["unavailable"])
        self.assertEqual(decision["gates"]["skill_availability"], "hold")
        self.assertEqual(decision["execution_status"], "blocked_pending_gates")


if __name__ == "__main__":
    unittest.main(verbosity=2)
