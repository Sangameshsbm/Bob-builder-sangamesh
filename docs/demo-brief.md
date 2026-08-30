# IBM i Developer Detective — Full Demo Walkthrough

> Everything you need to present confidently. Read this top to bottom before the demo.
> Estimated demo time: 3–4 minutes including questions.

---

## 1. The Story You Are Telling

Start every demo with this problem statement — say it out loud before touching the keyboard:

> "IBM i is one of the most stable platforms in enterprise computing. But when something
> breaks — especially after an upgrade — developers are on their own. There is no
> centralised diagnostic tool. You search GitHub issues manually, you run CL commands one
> by one, you piece together a root cause from a 40-comment thread, and then you write a
> support ticket from scratch — often missing the diagnostic data the support team actually
> needs.
>
> IBM i Developer Detective changes that. One prompt. The system collects the diagnostics,
> matches the symptoms against a registry of known issues, tells you exactly how confident
> it is, gives you ordered fix steps, and generates a structured GitHub issue — ready to
> raise — in under two minutes.
>
> And because the diagnostic engine is plain JavaScript with zero AI in the matching logic,
> the diagnosis is reproducible, auditable, and runs offline. The AI only writes the prose."

---

## 2. Setup (Do This Before the Room Fills)

### Required
- [ ] VS Code open with this workspace loaded
- [ ] Bob active — switch to **IBM i Detective** mode (appears in mode picker bottom-left)
- [ ] `.env` file present in workspace root with these values:
  ```
  IBM_I_MOCK=true
  IBM_I_MOCK_SCENARIO=3239
  ```
- [ ] Node.js 18+ available: run `node --version` in terminal to confirm

### Recommended (for contrast moments)
- [ ] Browser tab pre-opened to https://github.com/halcyon-tech/vscode-ibmi/issues/3239
- [ ] `docs/sample-report-3239.md` open in a VS Code tab (backup)
- [ ] `docs/sample-issue-3239.md` open in a VS Code tab (backup)
- [ ] `src/known-issues.json` open in a VS Code tab (for extensibility talking point)

### Verify the pipeline works right now
```powershell
$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='3239'
node src/run-diagnostics.js | node src/match-symptom.js
```
Expected output: `"confidence_score": 100, "confidence_band": "high"`

---

## 3. Tier 1 — Warm-up: Port 449 (~30 seconds)

### Purpose
Judges need to understand the concept before seeing complexity. Port 449 is the simplest
possible IBM i error — everyone in the room knows what "cannot connect" means. Get a clean
match and a clean report in 30 seconds. Then move to the real scenario.

### Change the mock scenario
In your `.env` file, set:
```
IBM_I_MOCK_SCENARIO=port449
```
Or type this in the Bob chat before triggering:
> "Please set IBM_I_MOCK_SCENARIO to port449 before running diagnostics"

### Type this in Bob (IBM i Detective mode):
```
investigate ibmi issue: cannot connect to IBM i, port 449 connection refused
```

### What happens — step by step
1. Bob runs `src/run-diagnostics.js` — reads `mock-diagnostics-port449.json`
2. Bob pipes the JSON to `src/match-symptom.js`
3. Matcher finds `port-449-blocked` entry: **8/9 keywords matched, 89% confidence, HIGH band**
4. Bob presents: root cause, 5 resolution steps (STRHOSTSVR, NETSTAT, firewall check)
5. Bob offers to generate a GitHub issue

### What to say while it runs
> "The diagnostic runner collected system data. The matcher — 50 lines of plain JavaScript,
> zero AI — found 8 out of 9 symptom keywords. 89% confidence. High band.
> The developer gets ordered fix steps in seconds."

### What to say about the confidence score
> "89% means 8 of the 9 keywords we registered for this issue were present in the
> diagnostic data. It is a simple ratio — not a neural network, not a probability model.
> You can audit it. If we were wrong, a developer can tell us which keyword we got wrong
> and we add it to the registry. That is all it takes."

---

## 4. Tier 2 — Main Act: Issue #3239 (~90 seconds)

### Purpose
This is the real scenario. A real GitHub issue that real developers have hit. Show the
full depth: diagnostic data, 100% confidence, root cause, fix steps, validation commands,
and the GitHub issue output that the maintainers actually need.

### Set the mock scenario back
```
IBM_I_MOCK_SCENARIO=3239
```

### Type this in Bob (IBM i Detective mode):
```
investigate ibmi issue: stuck at Starting Mapepire after upgrading to Code for IBM i 3.x
```

### What happens — step by step
1. Bob runs `src/run-diagnostics.js` — reads `mock-diagnostics-3239.json`
2. Diagnostic data includes:
   - Job `284719/QUSER/NOXDBSRV` in **MSGW state for 47 minutes**
   - MCH3601 error: stale object references in QGPL/NOXDBSRV
   - Object lock: SHRRD on NOXDBSRV *SRVPGM
   - Extension log: "Starting Mapepire" timeout after 3.x upgrade
3. Bob pipes to `src/match-symptom.js` — **14/14 keywords matched, 100% confidence, HIGH**
4. Bob presents:
   - Matched issue title + confidence score
   - Root cause paragraph
   - 6 ordered resolution steps
   - 3 validation commands (CL + SQL)
5. Bob offers GitHub issue — say yes
6. Bob reads `src/github-issue-template.md`, fills all placeholders, presents the body

### Narrate each section as it appears

**When the diagnostic data appears:**
> "This is what the IBM i system reported. A NOXDBSRV job in MSGW — waiting for a reply
> that will never come. 47 minutes. An MCH3601 error pointing at stale object references
> from the old version. An object lock on the service program. And the extension just
> waiting indefinitely — no timeout, no error message."

**When the confidence score appears:**
> "100%. Every single symptom keyword in our registry for this issue was found in the
> diagnostic data. No guesswork. The developer knows exactly how confident the system is."

**When resolution steps appear:**
> "Six steps. In order. The developer does not need to read a 40-comment GitHub thread
> to find these. ENDJOB, clear the lock, disconnect, reconnect, reinstall if needed."

**When validation commands appear:**
> "And then this — the validation checklist. After applying the fix, run these commands.
> Confirm no NOXDB jobs in MSGW. Confirm no object lock. If both are clear, you are done."

**When GitHub issue appears:**
> "Now the maintainers. This is what Code for IBM i currently receives from a stuck
> developer — point to the browser tab with issue #3239 — a short message, maybe a
> screenshot.
> This is what Detective produces — full environment table, diagnostic data summary,
> confidence score, suggested root cause, suggested fix approach — and this footer:
> 'AI-proposed — maintainers please verify before implementation.'
> We are not telling the maintainers what to do. We are giving them everything they need
> to make a fast, informed decision."

---

## 5. Significance of Each File — What to Show Judges

Open these files during the demo when indicated. Each one tells part of the story.

### `src/known-issues.json` — "The Brain"
**When to open:** After the confidence score talking point.
**What to say:**
> "This is the entire knowledge base. Three JSON objects. Anyone can read it. Anyone can
> add to it. No training data. No model weights. No deployment pipeline.
> To add a new known issue, you write one JSON object. The matcher picks it up on the
> next run. That is the full extensibility story."

**Point to the third entry (JDBC skeleton):**
> "This skeleton entry is a deliberate placeholder. It shows exactly what a new entry
> looks like. A developer who hits a JDBC timeout tomorrow can contribute the entry
> in five minutes."

**Show the schema:**
- `symptoms` — the keywords the matcher looks for
- `resolution_steps` — ordered fix steps shown to the developer
- `suggested_approach` — the fix proposal that goes into the GitHub issue
- `confidence_hint` — the expected minimum score for a genuine match

---

### `src/match-symptom.js` — "The Detective Engine"
**When to open:** When explaining the AI vs. deterministic split.
**What to say:**
> "This is the entire matching engine. About 50 lines. No imports. No AI calls.
> It reads the diagnostic JSON, stringifies it, and checks whether each symptom keyword
> appears in that string — case-insensitive. That is it.
> The confidence score is matched keywords divided by total keywords, times 100.
> You can verify it manually. You can test it in a CI pipeline. You can explain it to
> a non-technical judge in ten seconds."

---

### `src/run-diagnostics.js` — "The Data Collector"
**When to open:** If a judge asks about live IBM i support.
**What to say:**
> "In mock mode — which we are using now — this script reads a pre-built JSON file.
> In live mode, it emits the SQL queries needed to collect the same data from a real
> IBM i system. The calling agent — Bob or Copilot or Claude — executes those queries
> using its built-in IBM i MCP tools and assembles the result.
> No separate client library. No extra dependency. The script is IDE-agnostic by design."

---

### `.bob/skills/ibmi-detective/SKILL.md` — "The Bob Adapter"
**When to open:** When explaining how Bob orchestrates the workflow.
**What to say:**
> "This is the Bob skill. It tells Bob exactly what to do, step by step: run the
> diagnostic script, pipe the output to the matcher, read the result, branch on the
> confidence band, generate the report, offer the GitHub issue.
> Bob is following a recipe. The recipe is auditable. The AI is filling in prose —
> it is not making diagnostic decisions."

**Point to the grounding rule:**
> "And this line — 'Do NOT speculate. Never invent error messages, version numbers,
> or job names.' — that is the honesty contract. The report is grounded in real data."

---

### `AGENT.md` — "The VS Code Adapter"
**When to open:** VS Code compatibility talking point.
**What to say:**
> "This is the same workflow — same ten steps, same scripts, same templates —
> expressed as instructions for GitHub Copilot Agent mode or Claude.
> Same diagnosis. Same output. No re-implementation.
> IBM i shops that use VS Code without Bob get the same Detective capability
> by dropping this file into their workspace."

---

### `docs/sample-issue-3239.md` — "The Before/After Moment"
**When to open:** Side by side with the GitHub issue #3239 browser tab.
**What to say:**
> "On the left — what the Code for IBM i maintainers currently receive. A short message,
> maybe a screenshot, no diagnostic data, no version info.
> On the right — what Detective produces. Environment table. Diagnostic summary.
> Confidence score. Suggested root cause. Suggested fix. Validation commands.
> And the AI-proposed label so maintainers know exactly what needs their verification.
> The maintainers are a small team. The quality of incoming issues directly determines
> how fast they can fix things. This is where Detective makes a measurable difference."

---

## 6. What Happens With a New Issue

This is the extensibility story — practice saying this clearly.

### Scenario: A developer reports a new error you have never seen before

**Step 1 — Detective runs anyway.**
Even with no registry match, Detective collects the diagnostic data and runs the matcher.
The matcher returns `matched: false`. Bob then performs open-ended AI analysis on the
raw diagnostic JSON — surfacing anomalies, error codes, and suspicious job states.
The developer still gets a structured report and a GitHub issue offer.

**Step 2 — The GitHub issue contains the raw diagnostic data.**
Because the issue body includes the full diagnostic summary and the confidence score
(`0% — no known issue matched`), the maintainers receive real data to work with — even
without a registry entry.

**Step 3 — A maintainer or contributor adds the entry.**
Once the root cause is confirmed (by the maintainer or by the developer following up),
anyone adds one JSON object to `src/known-issues.json`:
```json
{
  "id": "new-issue-id",
  "title": "Short descriptive title",
  "symptoms": ["keyword from the error", "job name", "message id"],
  "root_cause": "What actually causes this.",
  "resolution_steps": ["Step 1", "Step 2"],
  "validation_commands": ["WRKACTJOB ..."],
  "suggested_approach": "What the fix looks like for maintainers.",
  "confidence_hint": 70,
  "references": ["https://github.com/halcyon-tech/vscode-ibmi/issues/XXXX"]
}
```

**Step 4 — Next time someone hits the same issue, Detective catches it instantly.**
No retraining. No deployment. No code change. The registry is the only thing that changes.

### What to say to judges about this
> "The registry grows with every confirmed issue. Each new entry is contributed by the
> community — developers, maintainers, IBM support engineers. Detective gets smarter
> with every fix that is documented. And unlike a model, you can see exactly why it
> matched, edit the keywords if they are wrong, and test it in 10 seconds."

---

## 7. Likely Judge Questions and Answers

### "Why not just use AI to diagnose everything?"
> "We do use AI — for the prose. But diagnostic matching needs to be reproducible and
> auditable. If Bob tells a developer to end a production job, that recommendation needs
> to be traceable to a specific known issue with a specific confidence score. 'The AI
> decided' is not good enough for IBM i operations. The deterministic layer is the
> trust anchor."

### "What if the confidence score is wrong?"
> "It can be. 89% means one keyword was missing — which might mean the diagnostic data
> used different terminology, or the keyword list needs updating. That is a one-line fix
> in the registry. We are explicit about the score — we never hide a low number. A 40%
> match is presented as 40%, with a warning to review carefully."

### "How does this work without a live IBM i?"
> "Mock mode is first-class, not a fallback. `IBM_I_MOCK=true` in the environment tells
> the runner to use pre-built diagnostic JSON that contains realistic IBM i data — job
> names, message IDs, object locks, version strings. The matcher and all downstream logic
> run identically. For a demo, this is safer than live. For development, this means any
> contributor can work on the registry without an IBM i licence."

### "Could this be used for IBM Support tickets instead of GitHub issues?"
> "Yes — and that is a natural extension. The GitHub issue template is structured enough
> that it can be adapted to IBM PMR format in an afternoon. We made the design decision
> to route to the Code for IBM i maintainers first because they know the boundary between
> the extension and IBM's stack. They can escalate to IBM Support with the same diagnostic
> data if needed. That routing decision belongs to the humans who understand the system,
> not to the tool."

### "What about security — you are running scripts and passing diagnostic data?"
> "The diagnostic runner only collects data — it runs read-only SQL queries against system
> views. No writes, no configuration changes. The `.bobignore` and `.gitignore` protect
> credential files. `IBM_I_MOCK=true` means the demo never touches a real system.
> In live mode, credentials come from environment variables — never hardcoded."

### "How is this different from just asking Bob to diagnose the error?"
> "Without Detective, Bob has no diagnostic data — it only has the developer's description,
> which is often incomplete. It will hallucinate plausible-sounding fixes. Detective gives
> Bob real data: actual job states, actual error message IDs, actual object locks. The AI
> is grounded in facts, not guesses. And the grounding rule in the skill explicitly says:
> 'Never invent error messages, version numbers, or job names.' That rule is enforceable
> because the data comes from scripts, not from the developer's memory."

---

## 8. Measurable Improvement (Repeat This to Judges)

| What | Manual Baseline | With Detective |
|---|---|---|
| Identify the issue | 5–15 min searching GitHub | Instant registry match |
| Collect diagnostics | Multiple CL commands, one by one | 1 script call |
| Understand root cause | Read a 40-comment GitHub thread | 1-paragraph summary |
| Confidence in diagnosis | Pure guesswork | Explicit score 0–100, auditable |
| Fix steps | Scattered across issue comments | Ordered numbered list |
| Validate the fix | Re-check manually, no checklist | Explicit validation commands |
| Raise a quality GitHub issue | Written from scratch, often vague | Structured body in seconds |
| Maintainer triage time | Investigate from vague report | Act on structured data + suggested fix |

---

## 9. Recovery Plan (If Things Go Wrong)

| What goes wrong | What to do |
|---|---|
| Bob skill not found in mode picker | Restart VS Code — mode loads from `.bob/custom_modes.yaml` |
| Bob times out or is slow | Open `docs/sample-report-3239.md` — walk through it manually |
| GitHub issue generation fails | Open `docs/sample-issue-3239.md` — show it directly |
| Script throws an error | Run manually in terminal: `$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='3239'; node src/run-diagnostics.js \| node src/match-symptom.js` and show the JSON output |
| Wrong mock scenario loaded | Check `.env` — `IBM_I_MOCK_SCENARIO` must be `3239` for Tier 2 |
| Judge asks for live demo | Explain live mode: open `src/run-diagnostics.js`, show the SQL queries in the live branch, explain that Bob would run these via `execute_sql_statement` |

---

## 10. Closing Line

End every demo with this:

> "IBM i is not going away. There are 100,000 IBM i systems running in production right now.
> The developers maintaining them deserve better tooling than a Google search and a long
> GitHub thread.
> Detective is a starting point — a pattern that any shop can adopt, any maintainer can
> extend, and any AI agent can run. The knowledge lives in a JSON file that anyone can
> read and anyone can contribute to.
> That is the real value: not the AI, but the structured knowledge — and the workflow
> that puts it in front of the developer at exactly the right moment."
