# IBM i Developer Detective — Demo Brief

> Quick reference for the presenter. Everything needed to run a confident 2-minute demo.

---

## The Core Story (30 seconds verbal)

> "IBM i developers waste 15–30 minutes every time they hit an unfamiliar error.
> They search GitHub issues, read long threads, run CL commands one by one, and then
> write a vague support ticket or GitHub issue from scratch.
> IBM i Developer Detective eliminates that workflow.
> One prompt. Deterministic diagnosis. Confidence score. Resolution steps.
> A structured GitHub issue — ready to raise — in under 2 minutes."

---

## Setup Checklist (do before presenting)

- [ ] VS Code open with this workspace loaded
- [ ] Bob active in any mode (Agent mode is fine)
- [ ] `.env` file present with `IBM_I_MOCK=true`
- [ ] Node.js available in terminal (`node --version` → 18+)
- [ ] Browser tab open to https://github.com/halcyon-tech/vscode-ibmi/issues/3239 (for the "before" contrast)
- [ ] `docs/sample-report-3239.md` and `docs/sample-issue-3239.md` open as backup tabs

---

## Tier 1 — Warm-up (~30 seconds)

**Goal:** Judges instantly understand the concept. Simple issue, instant result.

### What to type in Bob:
```
investigate ibmi issue: cannot connect to IBM i, port 449 connection refused
```

### What happens:
1. Detective runs `run-diagnostics.js` (mock mode, port449 scenario)
2. `match-symptom.js` returns: **matched, 89% confidence, high band**
3. Bob presents resolution steps (STRHOSTSVR, NETSTAT, firewall check)
4. Bob offers to generate a GitHub issue body

### What to say:
> "9 keywords matched. 89% confidence. High band — self-service resolution.
> The developer gets ordered steps in seconds, not after searching for 10 minutes."

---

## Tier 2 — Main Act (~90 seconds)

**Goal:** Show real depth. Real issue. Confidence score. GitHub issue output.

### What to type in Bob:
```
investigate ibmi issue: stuck at Starting Mapepire after upgrading to Code for IBM i 3.x
```

### What happens:
1. Detective runs `run-diagnostics.js` (mock mode, 3239 scenario)
2. `match-symptom.js` returns: **matched, 100% confidence, high band**
3. Bob presents: matched issue title, confidence score badge, 6 resolution steps, 3 validation commands
4. Bob offers GitHub issue — accept it
5. Bob fills `github-issue-template.md` and presents a structured issue body

### What to say:
> "14 out of 14 keywords matched. 100% confidence.
> The developer gets the exact root cause, ordered fix steps, and validation commands.
> Then — one click — a structured GitHub issue for the Code for IBM i maintainers.
> Not a vague 'it broke' report. A report with diagnostic data, a suggested fix approach,
> and a clear label: AI-proposed, maintainers please verify."

### Show the contrast:
- Point to the open browser tab (GitHub issue #3239 — long thread, scattered information)
- Point to the generated issue body (structured, concise, actionable)
> "This is what the maintainers currently receive vs. what Detective produces."

---

## Key Talking Points

### On confidence scoring:
> "The score is deterministic — no AI involved. It's a keyword match ratio.
> 100% means every symptom keyword in our registry was found in the diagnostic data.
> If a score is 40%, we tell the developer that — we never hide uncertainty."

### On the AI vs. deterministic split:
> "The matching engine is 50 lines of plain JavaScript. Zero AI.
> Bob AI only writes prose — the report narrative and the GitHub issue body.
> The diagnosis itself is reproducible and auditable."

### On VS Code + Copilot/Claude compatibility:
> "The scripts are plain Node.js. `AGENT.md` in the root gives Copilot or Claude
> the same instructions. Same diagnosis, same output — no re-implementation needed."
> (Open `AGENT.md` briefly to show it.)

### On the contributor framing:
> "We're not trying to auto-generate PRs. We're lowering the barrier to quality issue
> reporting. The Code for IBM i team is small. Getting a structured report with real
> diagnostic data is far more valuable than a vague issue — or silence."

### On extensibility:
> "Adding a new known issue is one JSON object in `src/known-issues.json`.
> The skeleton third entry shows exactly what a new entry looks like."
> (Open `src/known-issues.json` briefly, scroll to the third entry.)

---

## If Something Goes Wrong

| Problem | Recovery |
|---|---|
| Bob is slow or times out | Open `docs/sample-report-3239.md` — pre-filled report ready to show |
| GitHub issue generation fails | Open `docs/sample-issue-3239.md` — pre-filled issue body ready to show |
| Script error in terminal | Run manually: `$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='3239'; node src/run-diagnostics.js \| node src/match-symptom.js` |
| Bob skill not found | Trigger manually: open `.bob/skills/ibmi-detective/SKILL.md` and explain what it does |

---

## Measurable Improvement (for judges)

| What | Manual | With Detective |
|---|---|---|
| Identify the issue | 5–15 min searching | Instant registry match |
| Collect diagnostics | Multiple CL commands manually | 1 script call |
| Understand root cause | Read a long GitHub thread | 1-paragraph summary |
| Confidence in diagnosis | Guesswork | Explicit score 0–100 |
| Fix steps | Scattered across issue comments | Ordered numbered list |
| Validate the fix | Re-check manually | Explicit checklist |
| Raise a quality GitHub issue | Write from scratch (often vague) | Structured body in seconds |

---

## File Map (for judges browsing the repo)

```
src/known-issues.json          The brain — 3 entries, fully readable
src/match-symptom.js           50-line deterministic matcher — no AI
src/run-diagnostics.js         Diagnostic runner — mock + live modes
.bob/skills/ibmi-detective/    Bob orchestration adapter
AGENT.md                       VS Code / Copilot / Claude adapter
docs/sample-report-3239.md     Example output — resolution report
docs/sample-issue-3239.md      Example output — GitHub issue body
docs/architecture.md           4 Mermaid diagrams of the full system
```
