import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ensureDatabaseUrl } from "./env";

/**
 * /verify harness (constitution §4, CLAUDE.md "Verify before done").
 *
 * Runs the acceptance-criteria Playwright tests, then prints a pass/fail table
 * keyed to the criteria in /mission/spec/spec.md and exits non-zero on failure.
 *
 * This is a runnable STUB that works end-to-end today. The TODOs below mark the
 * parts Phase 0's full /verify will deepen.
 */

// TODO(phase-0): auto-discover acceptance criteria by parsing /mission/spec/spec.md
// instead of maintaining this registry by hand.
const ACCEPTANCE_CRITERIA: Record<string, string> = {
  "AC-1": "Home route renders the seeded demo user's notes with no console/network errors",
};

const RESULTS_FILE = "test-results/results.json";
const SCREENSHOT_DIR = "test-results/screenshots";

type SpecResult = { title: string; ok: boolean; errors: string[] };

// Minimal shape of the Playwright JSON report (only the fields we read).
type JsonError = { message?: string };
type JsonTestRun = { errors?: JsonError[] };
type JsonTest = { results?: JsonTestRun[] };
type JsonSpec = { title: string; ok: boolean; tests?: JsonTest[] };
type JsonSuite = { specs?: JsonSpec[]; suites?: JsonSuite[] };

// Walk the Playwright JSON report and flatten every spec with its status.
function collectSpecs(node: JsonSuite): SpecResult[] {
  const out: SpecResult[] = [];
  for (const spec of node.specs ?? []) {
    const errors: string[] = [];
    for (const t of spec.tests ?? []) {
      for (const r of t.results ?? []) {
        for (const e of r.errors ?? []) {
          if (e.message) errors.push(String(e.message).split("\n")[0]);
        }
      }
    }
    out.push({ title: spec.title, ok: Boolean(spec.ok), errors });
  }
  for (const child of node.suites ?? []) {
    out.push(...collectSpecs(child));
  }
  return out;
}

function main() {
  ensureDatabaseUrl();

  console.log("\n┌─ Foundry /verify ─────────────────────────────────────────");
  console.log("│ Running acceptance-criteria tests (Playwright)…");
  console.log("└───────────────────────────────────────────────────────────\n");

  const run = spawnSync("npx", ["playwright", "test"], {
    stdio: "inherit",
    env: process.env,
  });

  // Detect the most common first-run failure: browsers not installed.
  if (run.status !== 0 && !existsSync(RESULTS_FILE)) {
    console.error(
      "\n✖ Test run produced no results. If this is a fresh checkout, install browsers:\n" +
        "    npx playwright install chromium\n",
    );
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(RESULTS_FILE, "utf8")) as JsonSuite;
  const specs = collectSpecs(report);

  // Map each acceptance criterion to the spec whose title contains its id.
  const rows = Object.entries(ACCEPTANCE_CRITERIA).map(([id, description]) => {
    const match = specs.find((s) => s.title.includes(`[${id}]`));
    const status = !match ? "MISSING" : match.ok ? "PASS" : "FAIL";
    return { id, description, status, errors: match?.errors ?? [] };
  });

  // Print the pass/fail table.
  console.log("\n  Acceptance criteria");
  console.log("  ───────────────────");
  const symbol = { PASS: "✓", FAIL: "✗", MISSING: "?" } as const;
  for (const row of rows) {
    console.log(
      `  ${symbol[row.status as keyof typeof symbol]} ${row.id.padEnd(6)} ${row.status.padEnd(8)} ${row.description}`,
    );
    for (const err of row.errors) console.log(`        ↳ ${err}`);
  }

  // List captured screenshots for the key flows.
  if (existsSync(SCREENSHOT_DIR)) {
    const shots = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith(".png"));
    if (shots.length > 0) {
      console.log("\n  Screenshots");
      console.log("  ───────────");
      for (const shot of shots) console.log(`  • ${join(SCREENSHOT_DIR, shot)}`);
    }
  }

  // TODO(phase-0): surface a richer console/network error log here (currently
  // captured by the fixture and folded into the per-criterion error lines).
  // TODO(phase-0): screenshot every primary flow + visual-diff against a baseline.

  const failed = rows.filter((r) => r.status !== "PASS");
  console.log("");
  if (failed.length > 0) {
    console.log(`  Result: ${rows.length - failed.length}/${rows.length} criteria passed — FAIL\n`);
    process.exit(1);
  }
  console.log(`  Result: ${rows.length}/${rows.length} criteria passed — PASS\n`);
}

main();
