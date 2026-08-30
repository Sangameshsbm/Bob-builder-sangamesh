# Code for IBM i Developer Detective

> IBM TechXchange 2026 Pre-conference Dev Day Hackathon project.

A working prototype that improves the Code for IBM i VS Code extension troubleshooting workflow using IBM Bob.
A developer pastes an error or symptom into a single Bob prompt — the Detective collects
diagnostic data from the Code for IBM i extension logs, matches it against a known issue registry,
scores confidence, and outputs a structured resolution report and a ready-to-raise GitHub issue
for the Code for IBM i maintainer team. No live IBM i required for the demo.

---

## The Problem

Code for IBM i developers waste 15–30 minutes every time the extension breaks:
- Search GitHub issues and long threads manually
- Manually locate the Code for IBM i extension log in VS Code's output panel
- Piece together a root cause from scattered comments in a 40-comment thread
- Write a vague support ticket or GitHub issue from scratch — usually missing the data maintainers actually need

**Code for IBM i Developer Detective eliminates that workflow.**

---

## Demo Scenario

| Tier | Issue | Time |
|---|---|---|
| Warm-up | Code for IBM i cannot connect — port 449 blocked | ~30 seconds |
| Main act | [Code for IBM i #3239](https://github.com/codefori/vscode-ibmi/issues/3239) — stuck at "Starting Mapepire" after upgrading to 3.x | ~90 seconds |

See [`docs/demo-brief.md`](docs/demo-brief.md) for the full presenter script.

---

## Architecture

```
Two orchestration adapters — one core engine
────────────────────────────────────────────
Bob adapter:     .bob/skills/code-for-i-detective/SKILL.md  +  .bob/custom_modes.yaml
VS Code adapter: AGENT.md  (Copilot Agent mode / Claude via Cline or Continue)

Both call the same IDE-agnostic scripts:

  run-diagnostics.js   →   match-symptom.js   →   known-issues.json
  (collect data)           (score confidence)      (registry)
       ↓
  AI fills templates
  report-template.md  /  github-issue-template.md
```

Full Mermaid diagrams: [`docs/architecture.md`](docs/architecture.md)

---

## AI vs. Deterministic Split

| Component | Type | File |
|---|---|---|
| Known Issue Registry | **Deterministic** | `src/known-issues.json` |
| Diagnostic runner — mock mode | **Deterministic** | `src/run-diagnostics.js` |
| Diagnostic runner — live SQL emit | **Deterministic** | `src/run-diagnostics.js` |
| Symptom matcher + confidence score | **Deterministic** | `src/match-symptom.js` |
| Bob skill + mode orchestration | Orchestration | `.bob/skills/code-for-i-detective/` |
| VS Code adapter | Orchestration | `AGENT.md` |
| Resolution report prose | **AI** | fills `src/report-template.md` |
| GitHub issue body | **AI** | fills `src/github-issue-template.md` |
| Open-ended fallback analysis | **AI** | inline in skill/AGENT.md |

The matching engine is ~50 lines of plain JavaScript. Zero AI in the diagnosis path.

---

## How to Demo

### Prerequisites

```powershell
node --version   # must be 18+
```

Copy `.env.example` to `.env` — default values are already set for offline demo.

### Tier 1 — Port 449 warm-up (~30 s)

In Bob (any mode), type:
```
investigate Code for IBM i issue: cannot connect, port 449 connection refused
```

Expected: matched `port-449-blocked`, 89% confidence, high band, resolution steps presented.

### Tier 2 — Issue #3239 main act (~90 s)

In Bob, type:
```
investigate Code for IBM i issue: stuck at Starting Mapepire after upgrading to 3.x
```

Expected: matched `mapepire-hang-3239`, 100% confidence, high band, 6 resolution steps,
3 validation commands, offer to generate GitHub issue — accept it.

### Manual pipeline test (terminal)

```powershell
# Tier 1
$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='port449'
node src/run-diagnostics.js | node src/match-symptom.js

# Tier 2
$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='3239'
node src/run-diagnostics.js | node src/match-symptom.js
```

### Demo safety nets

If Bob is slow or unavailable, open these pre-filled sample docs directly:
- [`docs/sample-report-3239.md`](docs/sample-report-3239.md) — resolution report
- [`docs/sample-issue-3239.md`](docs/sample-issue-3239.md) — GitHub issue body

---

## VS Code Compatibility

The deterministic core (`run-diagnostics.js`, `match-symptom.js`, `known-issues.json`)
is plain Node.js — IDE-agnostic.

[`AGENT.md`](AGENT.md) provides equivalent workflow instructions for:
- GitHub Copilot Agent mode
- Claude via Cline or Continue

Same scripts. Same templates. Same outputs. No re-implementation required.
The live demo uses Bob; `AGENT.md` demonstrates the design-in compatibility.

---

## Measurable Improvement

| Measurement Point | Manual | With Detective |
|---|---|---|
| Identify the issue | 5–15 min searching | Instant registry match |
| Collect diagnostics | Multiple CL commands | 1 script call |
| Understand root cause | Read long GitHub thread | 1-paragraph summary |
| Confidence in diagnosis | Guesswork | Explicit score 0–100 |
| Fix steps | Scattered in comments | Ordered numbered list |
| Validate the fix | Re-check manually | Explicit checklist |
| Raise a quality GitHub issue | Write from scratch (often vague) | Structured body in seconds |

---

## File Structure

```
.bob/
  skills/code-for-i-detective/
    SKILL.md                     Bob skill — entry-point trigger
  custom_modes.yaml              code-for-i-detective mode definition

src/
  known-issues.json              Known Issue Registry (3 entries)
  mock-diagnostics-port449.json  Mock data — tier-1 demo
  mock-diagnostics-3239.json     Mock data — tier-2 demo
  run-diagnostics.js             Diagnostic runner (mock + live, IDE-agnostic)
  match-symptom.js               Symptom matcher with confidence score (IDE-agnostic)
  report-template.md             Developer resolution report template
  github-issue-template.md       GitHub issue body template for maintainers

docs/
  sample-report-3239.md          Pre-filled resolution report (demo safety net)
  sample-issue-3239.md           Pre-filled GitHub issue body (demo safety net)
  architecture.md                Component diagrams (Mermaid)
  demo-brief.md                  Presenter script and talking points

AGENT.md                         VS Code + Copilot/Claude adapter
package.json                     npm scripts: diagnose, match
ibmi-developer-detective-plan.md Implementation plan
```

---

## Adding a New Known Issue

Open `src/known-issues.json` and add a new object following the existing schema:

```json
{
  "id": "your-issue-id",
  "title": "Short human-readable title",
  "symptoms": ["keyword1", "keyword2", "..."],
  "root_cause": "One paragraph description.",
  "resolution_steps": ["Step 1", "Step 2"],
  "validation_commands": ["CL or SQL command"],
  "suggested_approach": "Fix proposal for maintainers to review.",
  "confidence_hint": 70,
  "references": ["https://..."]
}
```

No code changes required. The matcher picks it up on the next run.

---

## Security

Credentials are never hardcoded. See `.env.example` for required variables.
`.gitignore` and `.bobignore` protect all credential files.
IBM_I_MOCK=true in `.env` ensures no live Code for IBM i extension connection is attempted during demo.
