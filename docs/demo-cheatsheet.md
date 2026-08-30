# Code for IBM i Developer Detective — 4-Minute Demo Cheat Sheet

> Print this. One page. Say the words in quotes exactly.

---

## BEFORE YOU START (do this now)

```powershell
$env:IBM_I_MOCK='true'; $env:IBM_I_MOCK_SCENARIO='port449'
node src/collect-diagnostics.js   # must return JSON with "collection_mode": "mock"
```
- Bob mode set to **Code for IBM i Detective**
- Browser tab open: https://github.com/codefori/vscode-ibmi/issues/3239
- `docs/sample-report-3239.md` and `docs/sample-issue-3239.md` open as backup tabs

---

## ⏱ 0:00–0:30 — THE PROBLEM (say this before touching the keyboard)

> "The Code for IBM i VS Code extension has no centralised diagnostic tool. When the
> extension breaks after an upgrade you search GitHub manually, read a 40-comment thread,
> and write a support ticket from scratch — usually missing the data the maintainers
> actually need.
> Code for IBM i Developer Detective fixes that. One prompt. Extension logs collected,
> GitHub searched, fix steps delivered, structured issue generated. Under two minutes."

---

## ⏱ 0:30–1:00 — TIER 1: Port 449 (warm-up, env already set to port449)

Type in Bob chat:
```
investigate Code for IBM i issue: cannot connect, port 449 connection refused
```

**While it runs say:**
> "The log collector read the Code for IBM i extension log straight from VS Code's log
> directory — no IBM i connection, no VS Code API, pure filesystem read.
> Four error lines, all ECONNREFUSED. GitHub searched. Fix steps: STRHOSTSVR, check
> firewall. Done in seconds."

---

## ⏱ 1:00–1:10 — SWITCH SCENARIO

```powershell
$env:IBM_I_MOCK_SCENARIO='mapepire-hang'
```

> "Now the real scenario. A real GitHub issue. Real developers are stuck on this today."

---

## ⏱ 1:10–2:40 — TIER 2: Issue #3239 (main act)

Type in Bob chat:
```
investigate Code for IBM i issue: stuck at Starting Mapepire after upgrading to 3.x
```

**When log data appears:**
> "Code for IBM i extension log, straight from the developer's machine. MCH3601 —
> stale service program objects left over from version 2.x. The extension waiting
> indefinitely. No timeout. No message to the user."

**When GitHub search result appears:**
> "Issue #3239 — open, 14 comments. Known active issue. The developer is not alone.
> Found automatically in the same run."

**When fix steps appear:**
> "End the stale NOXDBSRV job, reconnect. No 40-comment thread required."

**Say yes to GitHub issue generation, then when it appears:**
> "Point at browser tab with #3239 — that's what maintainers currently get. A short
> message, maybe a screenshot.
> This is what Detective produces: environment table, full log errors, connection
> trace, related issues linked, AI-proposed root cause and fix — and the footer:
> 'AI-proposed — maintainers please verify.' We give them everything to act fast."

---

## ⏱ 2:40–3:20 — SHOW TWO FILES (pick one if short on time)

**Open `src/collect-diagnostics.js`:**
> "70 lines. Reads the extension log from disk. No VS Code API. No IBM i connection.
> Mock mode uses a fixture — same code path. Any contributor can add a new scenario
> without an IBM i licence."

**Open `.bob/skills/code-for-i-detective/SKILL.md`:**
> "The recipe Bob follows. Run the log collector, run the GitHub search, analyse,
> branch, generate. The AI writes the prose — it does not make the diagnostic decisions.
> And this grounding rule: 'Never invent log lines, error messages, or issue numbers.'
> Enforceable because the data comes from scripts."

---

## ⏱ 3:20–4:00 — CLOSE

> "IBM i is not going away. 100,000 systems in production. The Code for IBM i extension
> is the primary development tool for the developers on those systems — and it deserves
> a diagnostic layer that matches its importance.
> Code for IBM i Developer Detective is a pattern any shop can adopt, any maintainer can
> extend, any AI agent can run. The knowledge lives in log files and GitHub issues that
> already exist. Detective puts them in front of the developer at exactly the right moment —
> structured, grounded, ready to act on."

---

## IF THINGS GO WRONG

| Problem | Fix |
|---|---|
| Bob slow / times out | Open `docs/sample-report-3239.md`, walk through it manually |
| GitHub issue fails | Open `docs/sample-issue-3239.md`, show it directly |
| Script error | `node src/collect-diagnostics.js` in terminal, show JSON raw |
| Wrong scenario | `$env:IBM_I_MOCK_SCENARIO` — `port449` for Tier 1, `mapepire-hang` for Tier 2 |
