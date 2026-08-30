# Code for IBM i Developer Detective — Full Demo Walkthrough

> Everything you need to present confidently. Read this top to bottom before the demo.
> Estimated demo time: 3–4 minutes including questions.

---

## 1. The Story You Are Telling

Start every demo with this problem statement — say it out loud before touching the keyboard:

> "The Code for IBM i VS Code extension is used by developers across thousands of IBM i
> shops. But when it breaks — especially after an upgrade — developers are on their own.
> There is no centralised diagnostic tool. You search GitHub issues manually, you piece
> together a root cause from a 40-comment thread, and then you write a support ticket
> from scratch — often missing the diagnostic data the maintainers actually need.
>
> Code for IBM i Developer Detective changes that. One prompt. The system collects the
> extension logs automatically from VS Code's local log directory, searches the
> codefori/vscode-ibmi GitHub issue tracker for matching known issues, tells you exactly
> what it found, gives you ordered fix steps, and generates a structured GitHub issue —
> ready to raise — in under two minutes.
>
> And because the log collection and GitHub search are plain JavaScript scripts with no AI
> in the data-gathering layer, the evidence is reproducible and auditable. The AI only
> analyses and writes the prose — it never invents the facts."

---

## 2. Setup (Do This Before the Room Fills)

### Required
- [ ] VS Code open with this workspace loaded
- [ ] Bob active — switch to **Code for IBM i Detective** mode (appears in mode picker bottom-left)
- [ ] Terminal open in the workspace root
- [ ] Node.js 18+ available: run `node --version` to confirm

### Environment variables — set these before the demo
```powershell
$env:IBM_I_MOCK='true'
$env:IBM_I_MOCK_SCENARIO='mapepire-hang'
```

> `IBM_I_MOCK=true` keeps the demo fully offline — no IBM i, no GitHub token needed.
> `IBM_I_MOCK_SCENARIO` selects which pre-built log fixture to use.
> Valid values: **`mapepire-hang`** (default, Tier 2) and **`port449`** (Tier 1).

### Recommended (for contrast moments)
- [ ] Browser tab pre-opened to https://github.com/codefori/vscode-ibmi/issues/3239
- [ ] `docs/sample-report-3239.md` open in a VS Code tab (backup)
- [ ] `docs/sample-issue-3239.md` open in a VS Code tab (backup)
- [ ] `src/mock-extension-logs-mapepire-hang.json` open in a VS Code tab (for log talking point)

### Verify the pipeline works right now
```powershell
$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='mapepire-hang'
node src/collect-diagnostics.js
```
Expected: a JSON object with `"collection_mode": "mock"`, `"extension_version": "3.0.2"`,
and five entries in `error_summary`.

```powershell
node src/search-github-issues.js "Starting Mapepire stuck upgrade"
```
Expected: a JSON object with `"total_count": 2`, issues #3239 (open) and #3201 (closed).

---

## 3. Tier 1 — Warm-up: Port 449 (~30 seconds)

### Purpose
Judges need to understand the concept before seeing complexity. Port 449 is the simplest
possible IBM i error — everyone in the room knows what "cannot connect" means. Get clean
log collection and a clean report in 30 seconds. Then move to the real scenario.

### Change the mock scenario
```powershell
$env:IBM_I_MOCK_SCENARIO='port449'
```
Or say this in the Bob chat before triggering:
> "Set IBM_I_MOCK_SCENARIO to port449, then investigate: Code for IBM i cannot connect, port 449 connection refused"

### Type this in Bob (Code for IBM i Detective mode):
```
investigate Code for IBM i issue: cannot connect, port 449 connection refused
```

### What happens — step by step
1. Bob runs `src/collect-diagnostics.js` — reads `src/mock-extension-logs-port449.json`
2. Returns four `error_summary` entries, all pointing at `ECONNREFUSED` on port 449
3. Bob runs `src/search-github-issues.js "port 449 connection refused ECONNREFUSED"`
4. Returns matching GitHub issues from `src/mock-github-issues.json`
5. Bob analyses the log + search results and presents: root cause, fix steps (STRHOSTSVR,
   NETSTAT, firewall check), and offers to generate a GitHub issue

### What to say while it runs
> "The diagnostic runner read the Code for IBM i extension log from VS Code's local log
> directory — no IBM i connection, no VS Code API. Four error lines, all pointing at
> the same thing: port 449 not responding. The GitHub search then checked the
> codefori/vscode-ibmi issue tracker for matching reports.
> The developer gets an ordered fix list in seconds."

### What to say about the log collection
> "In mock mode, the log comes from a pre-built JSON file. In live mode, the script reads
> the actual extension log VS Code has already written to disk — same path, same data,
> no extra setup. The developer never needs to find the log manually."

---

## 4. Tier 2 — Main Act: Issue #3239 (~90 seconds)

### Purpose
This is the real scenario. A real GitHub issue that real developers have hit. Show the
full depth: diagnostic log data, GitHub issue match, root cause analysis, fix steps,
and the structured GitHub issue output that maintainers actually need.

### Change the mock scenario back
```powershell
$env:IBM_I_MOCK_SCENARIO='mapepire-hang'
```

### Type this in Bob (Code for IBM i Detective mode):
```
investigate Code for IBM i issue: stuck at Starting Mapepire after upgrading to 3.x
```

### What happens — step by step
1. Bob runs `src/collect-diagnostics.js` — reads `src/mock-extension-logs-mapepire-hang.json`
2. Log data contains:
   - Extension version 3.0.2, upgraded from 2.14.1 on 2025-01-14
   - `ERROR - MCH3601 received from NOXDBSRV: Pointer not set for location referenced`
   - `WARN  - Previous Mapepire job may still be active from version 2.x`
   - `ERROR - Connection timeout waiting for Mapepire. Status: Starting Mapepire`
   - Connection trace: `MCH3601 caught - stale service program objects in QGPL`
3. Bob extracts keywords and runs `src/search-github-issues.js "Starting Mapepire stuck upgrade"`
4. Search returns **issue #3239** (open, 14 comments) and **#3201** (closed, fixed in 2.14.1)
5. Bob presents:
   - Matched issue title + link + state (open)
   - Root cause paragraph drawn from the log evidence
   - Recommended action (end stale NOXDBSRV job, reconnect)
   - Related closed issue #3201 for context
6. Bob offers to generate a GitHub issue — say yes
7. Bob reads `src/github-issue-template.md`, fills all `{{PLACEHOLDER}}` tokens with the
   actual diagnostic data and analysis, presents the completed issue body

### Narrate each section as it appears

**When the log data appears:**
> "This is what the Code for IBM i extension logged on the developer's machine. A timeout
> waiting for Mapepire to start. An MCH3601 error pointing at stale service program objects
> left over from version 2.x. And the extension just waiting indefinitely — no timeout
> message shown to the user."

**When the GitHub search result appears:**
> "Issue #3239 — open, 14 comments. This is a known active issue. The developer is not
> alone, and the maintainers already know about it. Detective found this in the same
> workflow step, from the same diagnostic run."

**When the resolution steps appear:**
> "The recommended action: end the stale NOXDBSRV job on the IBM i system, reconnect.
> The developer does not need to read a 40-comment thread to find this. It is right here."

**When the GitHub issue body appears:**
> "Now the maintainers. This is what Code for IBM i currently receives — point to the
> browser tab with issue #3239 — a short message, maybe a screenshot.
> This is what Detective produces: environment table, full log errors, connection trace,
> related issues already linked, AI-proposed root cause and fix approach — and this footer:
> 'AI-proposed — maintainers please verify before implementation.'
> We are not telling the maintainers what to do. We are giving them everything they need
> to make a fast, informed decision."

---

## 5. Significance of Each File — What to Show Judges

Open these files during the demo when indicated. Each one tells part of the story.

---

### `src/collect-diagnostics.js` — "The Log Collector"
**When to open:** When explaining how logs are gathered without user effort.
**What to say:**
> "This is the entire log collection script. About 70 lines. It reads the Code for IBM i
> extension log from VS Code's standard log directory — AppData on Windows,
> Application Support on macOS, .config on Linux.
> No VS Code API. No IBM i connection. A pure filesystem read.
> In mock mode it reads a pre-built JSON fixture — same code path, same output shape.
> The developer never touches a log file manually."

**Point to the mock dispatch block (lines 44–63):**
> "Mock mode is first-class, not a fallback. Two fixtures: `mapepire-hang` and `port449`.
> Any contributor can add a new fixture to reproduce a new class of issue without an
> IBM i licence."

---

### `src/search-github-issues.js` — "The Issue Finder"
**When to open:** When explaining the GitHub search step.
**What to say:**
> "This script takes the symptom keywords and searches the codefori/vscode-ibmi issue
> tracker via the GitHub Search API. In mock mode it returns the pre-built response from
> `src/mock-github-issues.json` — no internet or GitHub token needed.
> In live mode it hits the real API. Set GITHUB_TOKEN for higher rate limits.
> The output is a structured JSON object — issue number, title, state, URL, body excerpt.
> The AI receives real GitHub data, not a prompt asking it to guess."

---

### `src/mock-extension-logs-mapepire-hang.json` — "The Mock Evidence"
**When to open:** When a judge asks what the log data actually looks like.
**What to say:**
> "This is realistic Code for IBM i extension log data — timestamps, error codes, job names,
> version strings. It is what a real developer's log would contain after hitting this
> upgrade issue. The AI analysis is grounded in this data. Nothing in the report is invented."

---

### `src/github-issue-template.md` — "The Issue Shape"
**When to open:** Before generating the GitHub issue, to show the before/after.
**What to say:**
> "This is the template — every `{{PLACEHOLDER}}` token is filled from actual diagnostic
> data. Environment table from the log JSON. Error summary from the log. Related issues
> from the GitHub search result. Root cause and fix from the AI analysis, labelled
> AI-proposed so maintainers know exactly what needs their verification.
> The maintainers receive a structured, complete report — not a screenshot and a vague
> description."

---

### `.bob/skills/code-for-i-detective/SKILL.md` — "The Bob Adapter"
**When to open:** When explaining how Bob orchestrates the workflow.
**What to say:**
> "This is the Bob skill. It tells Bob exactly what to do: run the log collector, run
> the GitHub search, analyse the results, branch on whether an issue was found, generate
> the report, offer the GitHub issue body.
> Bob is following a recipe. The recipe is auditable. The AI fills in the prose —
> it is not making diagnostic decisions."

**Point to the grounding rule:**
> "And this line — 'Do NOT speculate. Never invent log lines, error messages, extension
> versions, or issue numbers.' — that is the honesty contract. Every fact in the report
> came from a script."

---

### `AGENT.md` — "The VS Code Adapter"
**When to open:** VS Code compatibility talking point.
**What to say:**
> "This is the same workflow — same scripts, same templates — expressed as instructions
> for GitHub Copilot Agent mode or Claude via Cline or Continue.
> Same diagnosis. Same output. No re-implementation.
> IBM i shops that use VS Code without Bob get the same Detective capability
> by dropping this file into their workspace."

---

### `docs/sample-issue-3239.md` — "The Before/After Moment"
**When to open:** Side by side with the GitHub issue #3239 browser tab.
**What to say:**
> "On the left — what the Code for IBM i maintainers currently receive. A short message,
> maybe a screenshot, no diagnostic data, no version info.
> On the right — what Detective produces. Environment table. Log errors. Connection trace.
> Confidence in the match — two related issues already linked. AI-proposed root cause and
> fix. Validation steps. And the AI-proposed label so maintainers know exactly what needs
> their verification.
> The maintainers are a small team. The quality of incoming issues directly determines
> how fast they can fix things. This is where Detective makes a measurable difference."

---

## 6. What Happens With a New Issue

This is the extensibility story — practice saying this clearly.

### Scenario: A developer reports an error that matches no GitHub issue

**Step 1 — Detective runs anyway.**
`collect-diagnostics.js` still collects the log. `search-github-issues.js` returns zero
matches. Bob then performs open-ended AI analysis directly on the log data —
surfacing error codes, suspicious patterns, and version mismatches.
The developer still gets a structured report and a GitHub issue offer.

**Step 2 — The GitHub issue contains the full log evidence.**
Because the issue body includes the complete error summary, connection trace, and
environment table, the maintainers receive real data to work with even when no match
was found. The "Related Issues Found" section states explicitly: no matching issues found.

**Step 3 — The mock fixture grows with the project.**
Once the root cause is confirmed, a contributor adds a new JSON fixture to `src/` to
reproduce the scenario in future demos and CI runs — exactly the same pattern as the
existing `mapepire-hang` and `port449` fixtures.

### What to say to judges about this
> "The tool is useful even when it has never seen the problem before. The log collection
> and GitHub search still run. The AI analysis is still grounded in real log data.
> The maintainer still gets a structured issue body instead of a screenshot.
> And the next person who hits the same problem gets a properly documented case to
> reference in their own issue."

---

## 7. Likely Judge Questions and Answers

### "Why not just ask Bob to diagnose the error directly?"
> "Without Detective, Bob has no diagnostic data — it only has the developer's description,
> which is often incomplete or inaccurate. It will produce plausible-sounding fixes based
> on guesswork. Detective gives Bob real data: actual error message IDs from the actual
> extension log, actual GitHub issue matches. The AI is grounded in facts, not in the
> developer's memory. And the grounding rule in the skill explicitly says: 'Never invent
> error messages, version numbers, or issue numbers.' That rule is enforceable because
> the data comes from scripts."

### "How does this work without a live IBM i?"
> "Mock mode is first-class, not a fallback. `IBM_I_MOCK=true` tells the scripts to use
> pre-built fixtures that contain realistic Code for IBM i extension log data — error codes, job
> names, version strings, connection traces. The full workflow runs identically.
> For a demo this is safer than live. For development, any contributor can work on the
> workflow without an IBM i licence or a GitHub token."

### "What does live mode actually look like?"
> "In live mode, `collect-diagnostics.js` reads the Code for IBM i extension log from
> VS Code's standard log directory on the developer's machine — no extra setup, no VS Code
> API, just a filesystem read. `search-github-issues.js` calls the real GitHub Search API.
> Set GITHUB_TOKEN in the environment for higher rate limits. Everything else is identical
> to mock mode."

### "What if the GitHub search returns no results?"
> "The workflow handles it explicitly. Bob reports that no known issue was found and
> switches to open-ended AI analysis of the log data. The developer still gets a root
> cause hypothesis, labelled AI-proposed, and a complete GitHub issue body with the full
> log evidence. The maintainers get more information than they would from a manually
> written ticket, even in the zero-match case."

### "Could this be used for IBM Support tickets instead of GitHub issues?"
> "Yes — that is a natural extension. The GitHub issue template is structured enough
> that it can be adapted to IBM PMR format. We made the design decision to route to the
> Code for IBM i maintainers first because they know the boundary between the extension
> and IBM's stack. They can escalate to IBM Support with the same diagnostic data if
> needed. That routing decision belongs to the humans who understand the system."

### "What about security — you are reading log files?"
> "The log collector only reads files VS Code has already written to the developer's local
> machine. No writes, no configuration changes, no network calls in live mode (only the
> GitHub search makes an outbound request, and only to the public GitHub API).
> `IBM_I_MOCK=true` means the demo never reads any real file."

---

## 8. Measurable Improvement (Repeat This to Judges)

| What | Manual Baseline | With Detective |
|---|---|---|
| Collect extension logs | Find VS Code Output channel, scroll manually | 1 script call, structured JSON |
| Search for known issues | Open GitHub, search manually, read threads | Automated API search, structured result |
| Understand root cause | Read a 40-comment GitHub thread | 1-paragraph AI summary grounded in log data |
| Identify related issues | Manual cross-referencing | Automatically surfaced in same run |
| Raise a quality GitHub issue | Written from scratch, often missing key data | Structured body in seconds, all data present |
| Maintainer triage time | Investigate from vague report | Act on structured data + suggested fix |

---

## 9. Recovery Plan (If Things Go Wrong)

| What goes wrong | What to do |
|---|---|
| Bob skill not found in mode picker | Restart VS Code — mode loads from `.bob/custom_modes.yaml` |
| Bob times out or is slow | Open `docs/sample-report-3239.md` — walk through it manually |
| GitHub issue generation fails | Open `docs/sample-issue-3239.md` — show it directly |
| `collect-diagnostics.js` throws an error | Run manually: `$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='mapepire-hang'; node src/collect-diagnostics.js` and show the JSON output |
| `search-github-issues.js` throws an error | Run manually: `$env:IBM_I_MOCK='true'; node src/search-github-issues.js "Starting Mapepire"` and show the JSON output |
| Wrong scenario loaded | Check env var: `$env:IBM_I_MOCK_SCENARIO` — must be `mapepire-hang` for Tier 2, `port449` for Tier 1 |
| Judge asks for a live demo | Open `src/collect-diagnostics.js`, show the live branch (lines 66–116): reads real VS Code log files. Open `src/search-github-issues.js`, show the live branch (lines 70–125): calls GitHub Search API. Explain: set `IBM_I_MOCK` to anything other than `'true'` and both scripts use the live paths |

---

## 10. Closing Line

End every demo with this:

> "IBM i is not going away. There are 100,000 IBM i systems running in production right now.
> The developers maintaining them deserve better tooling than a Google search and a long
> GitHub thread. The Code for IBM i extension is their primary development tool — and it
> deserves a diagnostic layer that matches its importance.
> Code for IBM i Developer Detective is a starting point — a pattern that any shop can adopt,
> any maintainer can extend, and any AI agent can run. The knowledge lives in log files and
> GitHub issues that already exist. Detective just puts them in front of the developer at
> exactly the right moment — structured, grounded, and ready to act on."
