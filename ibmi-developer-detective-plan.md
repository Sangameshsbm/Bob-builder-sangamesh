# IBM i Developer Detective — Implementation Plan

## Top-Level Overview

**Goal:** Build a working POC for the IBM TechXchange 2026 Pre-conference Dev Day Hackathon that
demonstrates a measurable improvement in IBM i developer troubleshooting time. A developer pastes
an error or symptom into a Bob skill prompt (or VS Code with Copilot/Claude); the Detective
collects diagnostic data, matches it against a Known Issue Registry, and outputs a structured
resolution report and a ready-to-raise GitHub issue — all without leaving the editor.

**Demo scenario — two tiers:**
- **Tier 1 (warm-up, ~30 s):** A simple, obvious issue — port 449 blocked / cannot connect to IBM i.
  Fast match, clean report, judges immediately grasp the concept.
- **Tier 2 (main act, ~90 s):** Code for IBM i GitHub issue #3239 — stuck at "Starting Mapepire"
  after upgrading to 3.x. More complex; demonstrates registry depth, confidence score, and the
  GitHub issue output.

**Key design constraints:**
- No live IBM i required — a mock/simulated diagnostic mode must allow offline demos.
- Everything deterministic (command runner, symptom matcher, registry) is plain JavaScript/JSON
  — IDE-agnostic, runs from any terminal.
- Bob AI (and Copilot/Claude in VS Code) handles only narrative generation, report formatting,
  GitHub issue body generation, and open-ended fallback analysis.
- **Two orchestration adapters, one core engine:**
  - Bob: `.bob/skills/ibmi-detective.md` + `.bob/custom_modes.yaml`
  - VS Code + Copilot/Claude: `AGENT.md` (common agent instructions file)
  - Both adapters call the same scripts and reference the same templates.
- Known Issue Registry must visually demonstrate extensibility (minimum three entries).
- Symptom matcher emits a **confidence score** (0–100) and an **escalation recommendation**.
- Primary output: a **GitHub issue report** for the Code for IBM i maintainers, who are best
  placed to decide whether to fix it in the extension or escalate to IBM Support.

**On the contributor framing:**
Detective lowers the barrier to *quality issue reporting* — not to blind pull requests.
A developer who would previously raise a vague "it broke" issue now raises a structured report
with diagnostic data, a suggested root cause, and a resolution approach for maintainers to review.
The maintainers decide what to do with that. A developer who wants to go further and submit a PR
can use the same output as their starting point — but that is their choice, not the tool's goal.
Bob's suggested approach in the GitHub issue is explicitly framed as "proposed by AI — maintainers
please verify", to protect signal quality for the small maintainer team.

---

## Sub-Tasks

---

### Sub-Task 1 — Known Issue Registry

**Status:** [x] done

**Intent:**
Create the single source of truth for known IBM i issues. This is a static JSON file —
no AI, no runtime logic. It maps symptom fingerprints to root causes, resolution steps,
and validation commands. Judges should be able to read this file and immediately understand
the pattern-matching concept.

**Expected Outcomes:**
- `src/known-issues.json` exists and is valid JSON.
- Contains three entries:
  1. Tier-1 warm-up: port 449 blocked / cannot connect.
  2. Fully populated entry for issue #3239 (Mapepire hang).
  3. One skeleton placeholder entry to demonstrate extensibility.
- Each entry has consistent fields: `id`, `title`, `symptoms`, `root_cause`,
  `resolution_steps`, `validation_commands`, `suggested_approach`, `confidence_hint`,
  `references`.

**Todo List:**
1. Create `src/` directory.
2. Create `src/known-issues.json` with the schema described above.
3. Populate the **tier-1 entry**: port 449 / connection blocked — simple, fast match,
   suitable as the demo warm-up.
4. Populate the **#3239 entry** with accurate symptom keywords (e.g. "Starting Mapepire",
   "NOXDBSRV", "upgrade", "3.x"), root cause, resolution steps, and `suggested_approach`
   (the fix proposal for maintainers to review) sourced from the GitHub issue thread.
5. Add a third skeleton entry (e.g. a JDBC connection timeout pattern) with `TODO`
   markers to signal the registry is extensible.

**Relevant Context:**
- GitHub issue: https://github.com/halcyon-tech/vscode-ibmi/issues/3239
- Each registry entry schema:
  - `id` — unique string identifier
  - `title` — short human-readable title
  - `symptoms` — array of keyword strings used for matching
  - `root_cause` — one paragraph string (factual, based on known issue)
  - `resolution_steps` — ordered array of strings (user-side workaround)
  - `validation_commands` — array of CL/SQL strings to confirm the fix worked
  - `suggested_approach` — string describing the fix approach for maintainers to review
  - `confidence_hint` — expected minimum confidence score for a true match (integer)
  - `references` — array of URL strings (GitHub issue, docs, etc.)
- `suggested_approach` is what goes into the GitHub issue body, framed as AI-proposed.
- Remove `escalate_to_support` and `support_severity` — routing decision belongs to
  the Code for IBM i maintainers, not the tool.

---

### Sub-Task 2 — Mock Diagnostic Data

**Status:** [x] done

**Intent:**
Provide realistic simulated IBM i diagnostic output so the demo works without a live
system. This is a static JSON file representing what the real diagnostic runner returns.
It must contain enough detail to trigger a positive symptom match for both demo scenarios.

**Expected Outcomes:**
- `src/mock-diagnostics-port449.json` exists and triggers the tier-1 match.
- `src/mock-diagnostics-3239.json` exists and triggers the #3239 match.
- Each contains: `jobs` array, `log_entries` array, `mapepire_version`, `system_name`,
  `collected_at`.
- The symptom matcher produces the correct match for each file.

**Todo List:**
1. Create `src/mock-diagnostics-port449.json` — log entries about port 449 connection
   failure, no active Mapepire jobs.
2. Create `src/mock-diagnostics-3239.json` — a stuck Mapepire job in MSGW state and a
   log entry containing "Starting Mapepire".
3. Manually verify that symptom keywords from Sub-Task 1 are present in each file.
4. Add `IBM_I_MOCK_SCENARIO` to `.env.example` (values: "port449", "3239").

**Relevant Context:**
- The real diagnostic runner (Sub-Task 3) produces the same JSON shape.
- Mock scenario is selected by the `IBM_I_MOCK_SCENARIO` env var.

---

### Sub-Task 3 — Diagnostic Command Runner

**Status:** [x] done

**Intent:**
Implement the script that collects live IBM i diagnostic data when a real system is
available. In mock mode it returns the appropriate pre-built file. This script is the
only boundary between the deterministic layer and the IBM i system, and it is
deliberately IDE-agnostic (plain Node.js, no Bob-specific imports).

**Expected Outcomes:**
- `src/run-diagnostics.js` (Node.js) exists.
- When `IBM_I_MOCK=true`: reads and returns the mock file selected by `IBM_I_MOCK_SCENARIO`.
- When live mode: emits a structured JSON array of SQL queries to stdout so the calling
  agent (Bob via `execute_sql_statement`, or Copilot/Claude via its own tool) can execute
  them and feed results back.
- Always outputs a single JSON object to stdout.
- Exit code 0 on success, non-zero on failure.
- No IDE-specific imports — works equally when called from Bob or VS Code terminal.

**Todo List:**
1. Create `src/run-diagnostics.js`.
2. Add mock-mode branch: check `process.env.IBM_I_MOCK`, read correct mock file based on
   `IBM_I_MOCK_SCENARIO`, print to stdout and exit.
3. Add live-mode branch: emit the SQL queries as a `{ mode: "live", queries: [...] }`
   JSON object so the calling agent knows to execute them.
4. SQL queries to include:
   - Active jobs matching `%NOXDB%` via `QSYS2.ACTIVE_JOB_INFO()`
   - Job log entries containing "Mapepire" via `QSYS2.JOBLOG_INFO()`
   - Mapepire version from service object attributes
5. Create `package.json` at root with `scripts.diagnose` entry.
6. Update `.env.example` with `IBM_I_HOST`, `IBM_I_USER`, `IBM_I_PASSWORD`,
   `IBM_I_MOCK=true`, `IBM_I_MOCK_SCENARIO=3239`.

**Relevant Context:**
- In Bob: the skill calls `execute_command` to run the script, reads the JSON, then calls
  `execute_sql_statement` for the live query array.
- In VS Code: the agent instructions in `AGENT.md` describe the same two steps.
- Keeping this script IDE-agnostic is what makes the VS Code compatibility real, not claimed.

---

### Sub-Task 4 — Symptom Matcher with Confidence Score

**Status:** [x] done

**Intent:**
Implement the deterministic lookup that maps diagnostic JSON output to a known issue
registry entry. Computes a confidence score and derives an escalation recommendation.
No AI, no fuzzy logic, no external calls. IDE-agnostic.

**Expected Outcomes:**
- `src/match-symptom.js` exists.
- Reads `known-issues.json` and accepts diagnostic JSON from stdin.
- For each registry entry, counts how many `symptoms` keywords appear in the stringified
  diagnostic JSON (case-insensitive).
- Confidence score = (matched keywords / total keywords for that entry) × 100, rounded.
- Confidence bands:
  - 0–39 → `"low"` → suggest raising GitHub issue with full diagnostic data attached
  - 40–74 → `"medium"` → suggest resolution steps + raise issue if steps don't resolve
  - 75–100 → `"high"` → self-service resolution likely; offer to raise issue anyway
- Returns best-scoring entry (min 1 keyword hit) or `{ matched: false }`.
- Output shape:
  ```json
  {
    "matched": true,
    "confidence_score": 83,
    "confidence_band": "high",
    "suggest_github_issue": true,
    "issue": {}
  }
  ```
- CLI test: `node src/match-symptom.js < src/mock-diagnostics-3239.json` returns the
  #3239 entry with confidence >= 75.

**Todo List:**
1. Create `src/match-symptom.js`.
2. Load `known-issues.json` at startup.
3. Accept diagnostic JSON from stdin (pipe-friendly).
4. For each registry entry, count matching keywords and compute confidence score.
5. Pick the best-scoring entry; require at least one keyword match.
6. Compute confidence band; set `suggest_github_issue` true for all bands (always offer it;
   the developer decides whether to raise it).
7. Return result JSON or `{ matched: false }`.
8. Add `scripts.match` entry to `package.json`.
9. Verify with both mock files before marking done.

**Relevant Context:**
- Keep matching logic under 50 lines — no external dependencies.
- The calling agent (Bob skill or AGENT.md) uses `confidence_band` and `suggest_github_issue`
  to branch its workflow.
- `suggest_github_issue` is always true because raising a quality issue is always valuable,
  regardless of whether the developer can self-resolve.

---

### Sub-Task 5 — Orchestration Layer: Bob Skill + Mode and AGENT.md

**Status:** [x] done

**Intent:**
Create the two thin orchestration adapters that sit on top of the shared core engine:
1. **Bob adapter** — a skill (entry point) + a custom mode (controlled session environment)
2. **VS Code adapter** — an `AGENT.md` file with equivalent instructions for Copilot or Claude

Both adapters call the same scripts (`run-diagnostics.js`, `match-symptom.js`), reference
the same templates, and produce the same outputs. The only difference is the invocation
mechanism and file format.

**Expected Outcomes:**
- `.bob/skills/ibmi-detective.md` — valid Bob skill, trigger phrase "investigate ibmi issue".
- `.bob/custom_modes.yaml` — defines `ibmi-detective` mode with focused role and tool permissions.
- `AGENT.md` — VS Code-compatible agent instructions file, equivalent workflow to the Bob skill,
  references the same scripts and templates. Works with GitHub Copilot or Claude (Cline/Continue).
- Both adapters implement the same ten-step workflow:
  1. Accept the developer's symptom/error text as input.
  2. Run `src/run-diagnostics.js` (mock mode during demo).
  3. If live mode: execute the SQL queries from the runner's output.
  4. Pipe/pass the full diagnostic JSON to `src/match-symptom.js`.
  5. Read the matcher result.
  6. If `confidence_band` is "high" or "medium": present resolution steps and validation
     commands from the registry entry.
  7. If `confidence_band` is "low" or `matched: false`: run AI open-ended analysis on
     raw diagnostic JSON.
  8. Present the confidence score and band clearly to the developer.
  9. Offer to generate a GitHub issue report using `src/github-issue-template.md`.
  10. If accepted: fill the template and present the ready-to-raise issue body.
- AI is invoked only for: resolution report prose, open-ended fallback analysis,
  GitHub issue body generation.
- Bob adapter: note in the skill that the Bob `ibmi-developer` mode's `execute_sql_statement`
  tool handles live queries.
- VS Code adapter: note in `AGENT.md` that the agent should use its available IBM i MCP
  tools or prompt the developer to run queries manually.

**Todo List:**
1. Create `.bob/` directory and `.bob/skills/` subdirectory.
2. Activate the `create-skill` Bob skill, then create `.bob/skills/ibmi-detective.md`.
3. Write skill frontmatter: name, description, trigger phrase.
4. Write skill instructions covering the ten workflow steps above (Bob-specific invocations).
5. Add explicit grounding instruction: "Do NOT speculate. Use only data returned by the
   diagnostic scripts. Never invent error messages, version numbers, or job names."
6. Add GitHub issue offer instruction: when `suggest_github_issue` is true, offer the
   developer the option; if accepted, read `src/github-issue-template.md` and fill it.
7. Activate the `create-mode` Bob skill, then create `.bob/custom_modes.yaml` defining
   `ibmi-detective` mode with focused roleDefinition and permitted tool groups.
8. Create `AGENT.md` at root — same ten-step workflow, adapted for VS Code agent syntax.
   Include a note at the top: "Works with GitHub Copilot Agent mode, Claude via Cline or
   Continue. Uses the same scripts and templates as the Bob adapter."
9. In `AGENT.md`, note that for live IBM i queries the agent should use available MCP tools
   or instruct the developer to run the queries manually and paste the output.

**Relevant Context:**
- `AGENT.md` is a convention recognised by GitHub Copilot for workspace-level agent instructions.
- Keep `AGENT.md` instructions close to identical to the Bob skill — do not diverge logic.
- The VS Code adapter is not demoed live; it is shown as a file to judges to demonstrate
  the design-in compatibility claim.

---

### Sub-Task 6 — Templates: Resolution Report and GitHub Issue

**Status:** [x] done

**Intent:**
Provide two structured templates the AI fills in: (1) the developer-facing resolution
report, and (2) the GitHub issue body for the Code for IBM i maintainers. Templates
ensure consistent, professional output every time. Pre-filled sample documents act as
demo safety nets if live AI generation is slow.

The GitHub issue template is the primary external output. It is designed for the Code for
IBM i maintainer team, not for IBM Support — they are better placed to route to IBM if
needed. Bob's suggested approach appears in the issue body, explicitly labelled as
AI-proposed, so maintainers can verify before acting.

**Expected Outcomes:**
- `src/report-template.md` exists with placeholder tokens.
  - Sections: Problem Summary, System Info, Diagnostic Findings, Confidence Score,
    Diagnosis, Root Cause, Resolution Steps (numbered), Validation Checklist, References.
- `src/github-issue-template.md` exists with placeholder tokens.
  - Sections: Issue Title, Environment (Code for IBM i version, OS, IBM i release),
    Symptom Description, Diagnostic Data Summary, Confidence Score, Suggested Root Cause,
    Suggested Resolution Approach (AI-proposed — please verify), Steps Already Tried,
    Validation Commands, References.
  - Footer: "Generated by IBM i Developer Detective. Suggested approach is AI-proposed
    and requires maintainer review before implementation."
- `docs/sample-report-3239.md` — fully pre-filled resolution report for #3239.
- `docs/sample-issue-3239.md` — fully pre-filled GitHub issue body for #3239.
- Both templates referenced in the orchestration layer (Sub-Task 5).

**Todo List:**
1. Create `src/report-template.md` with placeholder tokens (e.g. `{{PROBLEM_SUMMARY}}`).
2. Document each placeholder's purpose inline.
3. Create `src/github-issue-template.md` with the sections listed above.
4. Include the AI-proposed footer text verbatim — this is the honesty guard for maintainers.
5. Create `docs/` directory.
6. Create `docs/sample-report-3239.md` — fully filled resolution report for #3239.
7. Create `docs/sample-issue-3239.md` — fully filled GitHub issue body for #3239,
   demonstrating what a quality structured issue looks like vs. a typical vague report.
8. Reference both template paths in the orchestration instructions (Sub-Task 5, steps 6 and 9).

**Relevant Context:**
- The contrast between `docs/sample-issue-3239.md` and a real vague GitHub issue is itself
  a demo talking point — show judges what maintainers currently receive vs. what Detective
  produces.
- Keep templates under 60 lines each — they must be readable at a glance by judges.

---

### Sub-Task 7 — README and Demo Script

**Status:** [x] done

**Intent:**
Update the README with project description, architecture overview, VS Code compatibility
callout, and a precise step-by-step demo script judges can follow in under two minutes.
Also produce the architecture diagram doc.

**Expected Outcomes:**
- `README.md` describes: project goal, two-tier demo structure, AI vs. deterministic split,
  VS Code + Copilot/Claude compatibility, and file layout.
- README includes a "How to Demo" section with exact typed commands and expected outputs.
- README includes a "VS Code Compatibility" section explaining the `AGENT.md` adapter.
- `.env.example` includes all variables from Sub-Task 3.
- `docs/architecture.md` contains a Mermaid flow diagram of the full component pipeline
  including both orchestration adapters.

**Todo List:**
1. Overwrite `README.md` with: project overview, architecture summary, two-tier demo
   description, AI vs. deterministic table, VS Code compatibility note, file structure,
   "How to Demo" steps (exact commands).
2. Update `.env.example` with `IBM_I_HOST`, `IBM_I_USER`, `IBM_I_PASSWORD`,
   `IBM_I_MOCK=true`, `IBM_I_MOCK_SCENARIO=3239`.
3. Create `docs/architecture.md` with Mermaid flow diagram showing both adapters
   feeding into the shared core engine.
4. Verify all file paths referenced in README actually exist after all sub-tasks complete.

**Relevant Context:**
- README is what judges read first — it must clearly label what is AI vs. deterministic.
- The VS Code compatibility section should be factual: "The same scripts and templates work
  with Copilot/Claude via AGENT.md. Live demo uses Bob."
- "How to Demo" steps must be runnable in under 2 minutes.

---

## Measurable Improvement Demonstration

| Measurement Point | Manual Baseline | With Detective |
|---|---|---|
| Time to identify the correct GitHub issue | Manual search: 5–15 min | Registry match: instant |
| Diagnostic data collection | Developer runs CL commands one by one | One skill invocation |
| Understanding root cause | Reads long GitHub thread | One-paragraph summary in report |
| Confidence in diagnosis | Subjective / guesswork | Explicit confidence score 0–100 |
| Resolution steps | Scattered across issue comments | Ordered numbered list |
| Validation | Developer re-checks manually | Explicit checklist in report |
| Raising a quality GitHub issue | Developer writes from scratch, often vague | Structured issue body generated in seconds |
| Maintainer routing decision | Maintainer reads vague report, investigates | Maintainer reads structured data + AI-proposed approach |

**Demo format — two tiers:**
1. **Tier 1 warm-up (~30 s):** Type "cannot connect, port 449" → instant match → clean report →
   judges understand the concept immediately.
2. **Tier 2 main act (~90 s):** Type "stuck at Starting Mapepire after upgrade" → #3239 match →
   full report with confidence score → validation checklist → GitHub issue body generated,
   ready to paste into the `vscode-ibmi` repo.

Show the manual path (open browser, search GitHub, read thread, write notes, draft a GitHub issue
from scratch) timed against the Detective path. The difference is the demo's core value.

**VS Code compatibility talking point:** Open `AGENT.md` in VS Code, show Copilot can follow
the same instructions with the same scripts. No re-implementation required.

---

## File Structure After All Sub-Tasks Complete

```
.bob/
  skills/
    ibmi-detective.md            <- Bob skill (entry-point trigger, any mode)
  custom_modes.yaml              <- ibmi-detective mode definition

src/
  known-issues.json              <- Known Issue Registry (3 entries)
  mock-diagnostics-port449.json  <- simulated output for tier-1 demo
  mock-diagnostics-3239.json     <- simulated output for tier-2 demo
  run-diagnostics.js             <- diagnostic runner (mock + live, IDE-agnostic)
  match-symptom.js               <- symptom matcher with confidence score (IDE-agnostic)
  report-template.md             <- developer resolution report template
  github-issue-template.md       <- GitHub issue body template for maintainers

docs/
  sample-report-3239.md          <- pre-filled resolution report (demo safety net)
  sample-issue-3239.md           <- pre-filled GitHub issue body (demo safety net + talking point)
  architecture.md                <- component diagram (Mermaid)

AGENT.md                         <- VS Code + Copilot/Claude orchestration adapter
package.json
README.md
.env.example                     (updated)
```
