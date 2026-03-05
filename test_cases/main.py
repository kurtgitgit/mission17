"""
Mission 17 — Master Test Suite
================================
Runs all 7 test cases in sequence, separated by clear banners.
Each test is isolated — a failure or server-offline error in one test
will NOT stop the remaining tests from running.

Requirements:
    - AI server running   : cd mission17-ai     && python app.py
    - Backend server running: cd mission17-backend && node index.js

Run (from project root):
    python test_cases/main.py
"""

import sys
import time
import traceback
from pathlib import Path

# Ensure the project root is on sys.path so imports work whether this file is
# run as  `python test_cases/main.py`  OR  `python -m test_cases.main`
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ── Import all test runner functions ──────────────────────────────────────────
from test_cases.ai_speed_test                import run_speed_test
from test_cases.login_speed_test             import run_login_speed_test
from test_cases.blockchain_cost_test         import run_blockchain_cost_test
from test_cases.register_validation_test     import run_register_validation_test
from test_cases.rate_limiter_test            import run_rate_limiter_test
from test_cases.ai_file_upload_security_test import run_file_upload_security_test
from test_cases.audit_log_integrity_test     import run_audit_log_integrity_test


# ── Test registry ─────────────────────────────────────────────────────────────
TESTS = [
    {
        "id":       1,
        "name":     "AI Speed Benchmark",
        "runner":   run_speed_test,
        "requires": "AI server  (python app.py  in mission17-ai/)",
    },
    {
        "id":       2,
        "name":     "Login Speed Benchmark",
        "runner":   run_login_speed_test,
        "requires": "Backend     (node index.js  in mission17-backend/)",
    },
    {
        "id":       3,
        "name":     "Blockchain Cost & Speed",
        "runner":   run_blockchain_cost_test,
        "requires": "Backend     (node index.js  in mission17-backend/)",
    },
    {
        "id":       4,
        "name":     "Register Validation",
        "runner":   run_register_validation_test,
        "requires": "Backend     (node index.js  in mission17-backend/)",
    },
    {
        "id":       5,
        "name":     "Rate Limiter",
        "runner":   run_rate_limiter_test,
        "requires": "Backend     (node index.js  in mission17-backend/)",
    },
    {
        "id":       6,
        "name":     "AI File Upload Security",
        "runner":   run_file_upload_security_test,
        "requires": "AI server  (python app.py  in mission17-ai/)",
    },
    {
        "id":       7,
        "name":     "Audit Log Integrity",
        "runner":   run_audit_log_integrity_test,
        "requires": "Backend     (node index.js  in mission17-backend/)",
    },
]

WIDTH = 66


# ── Helpers ───────────────────────────────────────────────────────────────────
def div(char: str = "─", width: int = WIDTH):
    print(char * width)


def banner(test: dict):
    """Print the opening separator for a test."""
    print()
    div("╔", 1)
    div("═")
    label = f"  TEST {test['id']}/7  —  {test['name']}"
    print(label)
    print(f"  Requires : {test['requires']}")
    div("═")


def result_line(test_id: int, name: str, status: str, elapsed: float):
    """Print one row in the final summary table."""
    icon = "✅" if status == "PASS" else "⚠️ " if status == "SKIP" else "❌"
    print(f"  {icon}  [{test_id}/7]  {name:<35}  {status:<5}  ({elapsed:.1f}s)")


# ── Master runner ─────────────────────────────────────────────────────────────
def main():
    print()
    div("═")
    print("  MISSION 17 — MASTER TEST SUITE")
    print(f"  Running {len(TESTS)} tests  |  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    div("─")
    for t in TESTS:
        print(f"  {t['id']}.  {t['name']}")
    div("═")

    results = []   # list of (id, name, status, elapsed_sec)

    for test in TESTS:
        banner(test)

        t_start = time.perf_counter()
        status  = "PASS"

        try:
            test["runner"]()

        except SystemExit:
            # run_* functions call raise SystemExit(1) when server is unreachable
            status = "SKIP"
            print()
            print(f"  ⚠️  Test skipped — server not running.")
            print(f"     Start: {test['requires']}")

        except KeyboardInterrupt:
            status = "SKIP"
            print()
            print("  ⚠️  Interrupted by user — skipping remaining tests.")
            elapsed = time.perf_counter() - t_start
            results.append((test["id"], test["name"], status, elapsed))
            break

        except Exception:
            status = "FAIL"
            print()
            print("  ❌ Unexpected error during test:")
            traceback.print_exc()

        elapsed = time.perf_counter() - t_start
        results.append((test["id"], test["name"], status, elapsed))

        # Closing separator
        div("─")
        icon = "✅ DONE" if status == "PASS" else ("⚠️  SKIPPED" if status == "SKIP" else "❌ FAILED")
        print(f"  {icon}  |  {test['name']}  |  {elapsed:.1f}s")
        div("═")

    # ── Final Summary ─────────────────────────────────────────────────────────
    passed = sum(1 for _, _, s, _ in results if s == "PASS")
    skipped = sum(1 for _, _, s, _ in results if s == "SKIP")
    failed  = sum(1 for _, _, s, _ in results if s == "FAIL")
    total_time = sum(e for _, _, _, e in results)

    print()
    div("═")
    print("  FINAL SUMMARY")
    div("─")
    for (tid, name, status, elapsed) in results:
        result_line(tid, name, status, elapsed)
    div("─")
    print(f"  Passed  : {passed}")
    print(f"  Skipped : {skipped}  (server not running)")
    print(f"  Failed  : {failed}  (unexpected error)")
    print(f"  Total   : {len(results)} tests  in  {total_time:.1f}s")
    div("─")

    if failed == 0 and skipped == 0:
        verdict = "✅ ALL TESTS PASSED"
    elif failed == 0:
        verdict = f"⚠️  {skipped} SKIPPED — start the required servers and re-run"
    else:
        verdict = f"❌ {failed} FAILED — review output above"

    print(f"  {verdict}")
    div("═")
    print()

    # Exit with non-zero code if any test failed (useful for CI pipelines)
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
