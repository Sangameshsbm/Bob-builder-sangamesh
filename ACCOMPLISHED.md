# Accomplished — IBM i Developer Detective

> Running log of everything built, shipped, and completed.
> Updated as milestones are reached.

---

## ✅ Phase 1 — Hackathon POC (Bob-builder-sangamesh)

**Repo:** https://github.com/Sangameshsbm/Bob-builder-sangamesh

### Core Engine (IDE-agnostic Node.js)
- [x] `src/collect-diagnostics.js` — reads Code for IBM i extension logs from VS Code log directories (Windows / macOS / Linux); mock mode supported
- [x] `src/search-github-issues.js` — queries `codefori/vscode-ibmi` GitHub issue tracker via GitHub Search API; mock mode supported
- [x] `src/known-issues.json` — Known Issue Registry with 3 entries: Mapepire hang (#3239), port 449 connection refused, SSH key auth failure
- [x] Mock diagnostic fixtures — `mock-extension-logs-port449.json`, `mock-extension-logs-mapepire-hang.json`, `mock-github-issues.json`
- [x] `src/report-template.md` — developer-facing resolution report template
- [x] `src/github-issue-template.md` — GitHub issue body template for maintainers

### Orchestration Adapters
- [x] `.bob/skills/code-for-i-detective/SKILL.md` — Bob custom skill (6-step workflow, grounding rules, GitHub issue generation)
- [x] `.bob/custom_modes.yaml` — `ibmi-detective` Bob custom mode
- [x] `AGENT.md` — VS Code Copilot/Claude adapter (same workflow, same scripts)

### Documentation
- [x] `README.md` — project overview, architecture, demo instructions
- [x] `docs/architecture.md` — full Mermaid pipeline diagrams
- [x] `docs/demo-brief.md` — two-tier demo presenter script
- [x] `docs/demo-cheatsheet.md` — quick reference for live demo
- [x] `docs/sample-issue-3239.md` — pre-filled GitHub issue body for issue #3239
- [x] `docs/sample-report-3239.md` — pre-filled resolution report for issue #3239

### Design Principles Established
- [x] Deterministic-first: AI touches only prose generation (~5% of logic)
- [x] Two-adapter, one-core-engine architecture
- [x] Confidence score: keyword frequency matching (0–100), three bands (HIGH/MEDIUM/LOW)
- [x] Grounding rule: never speculate, never invent log lines or issue numbers

---

## ✅ Phase 2 — Community Contribution Proposal

**Plan file:** `code-for-ibmi-detective-proposal-plan.md` (local reference only)

### Analysis & Strategy Documents (local, not in repo)
- [x] `docs/integration-paths.md` — five-path technical analysis
- [x] `docs/rfc-github-issue.md` — draft GitHub Issue RFC for `codefori/vscode-ibmi`
- [x] `docs/direct-contribution-design.md` — design spec for PR to `codefori/vscode-ibmi`
- [x] `docs/community-strategy.md` — sequencing rationale, success criteria, community onramp

### Decisions Made
- [x] VS Code Marketplace: personal publisher account (`SangameshSBM`)
- [x] GitHub entry point: raise as GitHub Issue tagged `enhancement` on `codefori/vscode-ibmi`
- [x] Known Issue Registry: lives in companion extension repo as single community contribution point
- [x] License: MIT (compatible with `codefori/vscode-ibmi` MIT license)

---

## ✅ Phase 3 — Companion VS Code Extension

**Repo:** https://github.com/Sangameshsbm/code-for-ibmi-detective
**Marketplace:** https://marketplace.visualstudio.com/items?itemName=SangameshSBM.vscode-ibmi-detective

### Extension Code
- [x] `src/extension.ts` — `activate()` / `deactivate()`, soft-checks for Code for IBM i, registers `ibmiDetective.investigate` command
- [x] `src/detective-panel.ts` — Webview panel controller, 4-phase UI (Input → Running → Results → No Match), SecretStorage for GitHub token
- [x] `src/pipeline/collect-diagnostics.ts` — TypeScript port of `collect-diagnostics.js`, exports `collectDiagnostics()`
- [x] `src/pipeline/search-github-issues.ts` — TypeScript port, exports `searchGitHubIssues()`
- [x] `src/pipeline/match-symptom.ts` — TypeScript port, exports `matchSymptom()`, same confidence scoring formula
- [x] `media/detective-panel.html` — Webview HTML, inline CSS, colour-coded confidence badge (green ≥75 / amber 40–74 / red <40), one-click Copy button
- [x] `data/known-issues.json` — Known Issue Registry (migrated from Bob-builder repo, community contribution point)

### Build & Package
- [x] `package.json` — VS Code extension manifest + npm workspace root, publisher `SangameshSBM`
- [x] `tsconfig.json` — TypeScript config (ES2020, commonjs, strict)
- [x] `esbuild.js` — bundles `src/extension.ts` → `dist/extension.js` (8.1kb)
- [x] `.vscodeignore` — excludes src/, test/, packages/, node_modules/ from .vsix
- [x] `.gitignore` + `.gitattributes` — clean repo hygiene, LF line endings
- [x] `LICENSE` — MIT, Copyright 2025 Sangamesh

### MCP Server
- [x] `packages/mcp-server/index.js` — stdio MCP server, 4 tools registered
- [x] `packages/mcp-server/tools/collect.js` — `collect_ibmi_extension_diagnostics`
- [x] `packages/mcp-server/tools/search.js` — `search_ibmi_github_issues`
- [x] `packages/mcp-server/tools/match.js` — `match_ibmi_symptom`
- [x] `packages/mcp-server/tools/registry.js` — `get_known_issues_registry`
- [x] `packages/mcp-server/README.md` — Bob / Claude / Cursor config snippets

### GitHub Actions CI
- [x] `.github/workflows/ci.yml` — validate-registry matrix (port449 + 3239), lint, test, vsce package artifact
- [x] `.github/workflows/detective-reusable.yml` — `workflow_call`, typed inputs/outputs, callable by any IBM i repo
- [x] `.github/actions/ibmi-detective/action.yml` — composite action, single-step usage

### Community Files
- [x] `CONTRIBUTING.md` — how to add Known Issue Registry entries, JSON schema, example, PR process
- [x] `README.md` — Marketplace-ready, problem statement, features table, usage guide
- [x] `bob-marketplace.yaml` — Bob Marketplace listing descriptor

### Tests
- [x] `test/collect-diagnostics.test.ts` — 9 tests passing
- [x] `test/match-symptom.test.ts` — 10 tests passing
- [x] `test/fixtures/` — mock log and GitHub issue fixtures

### Published
- [x] Publisher `SangameshSBM` registered on VS Code Marketplace
- [x] `IBM i Detective` v0.1.0 — initial publish
- [x] `IBM i Detective` v0.1.1 — publisher ID fix (`SangameshSBM`)
- [x] GitHub repo live: https://github.com/Sangameshsbm/code-for-ibmi-detective

---

## 🔜 Phase 4 — Community Outreach (Pending)

- [ ] Raise RFC Issue on `codefori/vscode-ibmi` — paste `docs/rfc-github-issue.md`, label `enhancement`
- [ ] Publish `ibmi-detective-mcp` to npm — `npm publish` inside `packages/mcp-server/`
- [ ] Submit Bob skill/mode to Bob Marketplace
- [ ] Write deep-dive hackathon blog post for Hashnode (sbm-tech.hashnode.dev)
- [ ] Add extension icon (128×128px PNG) to improve Marketplace listing

---

## Stats

| Metric | Value |
|---|---|
| Repos | 2 (Bob-builder-sangamesh, code-for-ibmi-detective) |
| Source files | 33 files in companion extension repo |
| Tests passing | 19 (9 diagnostic + 10 confidence scoring) |
| Known Issue Registry entries | 3 |
| MCP tools | 4 |
| VS Code Marketplace | Published — IBM i Detective v0.1.1 |
| License | MIT |
| Days to build (hackathon) | 3 |
