# IBM i Developer Detective — Architecture

## Overview

The Detective is built on a **two-adapter, one-core-engine** design. The core engine
(diagnostic runner, symptom matcher, known issue registry, templates) is plain
JavaScript/JSON — IDE-agnostic, no AI, no external dependencies. Two thin orchestration
adapters sit on top: one for Bob, one for VS Code with Copilot or Claude. Both call the
same scripts and reference the same templates.

---

## Full Pipeline

```mermaid
flowchart TD
    DEV[Developer types symptom or error message]

    subgraph ADAPTERS [Orchestration Adapters]
        A1[Bob — ibmi-detective skill + mode]
        A2[VS Code — AGENT.md for Copilot or Claude]
    end

    subgraph CORE [Core Engine — IDE-agnostic Node.js]
        B[run-diagnostics.js]
        C[match-symptom.js]
        D[(known-issues.json registry)]
    end

    subgraph MOCK [Mock Mode - no IBM i required]
        M1[mock-diagnostics-port449.json]
        M2[mock-diagnostics-3239.json]
    end

    subgraph LIVE [Live Mode]
        L1[SQL via execute_sql_statement - Bob]
        L2[SQL via MCP tools or manual - VS Code]
    end

    subgraph AI [AI Layer - prose only]
        E[Resolution report generation]
        F[Open-ended fallback analysis]
        G[GitHub issue body generation]
    end

    subgraph OUTPUTS [Developer Outputs]
        H[Resolution Report - report-template.md]
        I[GitHub Issue Body - github-issue-template.md]
    end

    DEV --> A1
    DEV --> A2
    A1 --> B
    A2 --> B
    B -- IBM_I_MOCK=true --> M1
    B -- IBM_I_MOCK=true --> M2
    B -- live --> L1
    B -- live --> L2
    L1 --> C
    L2 --> C
    M1 --> C
    M2 --> C
    C --> D
    D --> C
    C -- confidence high or medium --> E
    C -- confidence low or no match --> F
    C -- suggest_github_issue=true --> G
    E --> H
    F --> H
    G --> I
```

---

## Confidence Score Flow

```mermaid
flowchart TD
    IN[Diagnostic JSON input]
    MATCH[match-symptom.js]
    SCORE[Confidence Score = matched keywords / total keywords x 100]

    IN --> MATCH
    MATCH --> SCORE

    SCORE --> HIGH{75-100 = high}
    SCORE --> MED{40-74 = medium}
    SCORE --> LOW{0-39 = low}
    SCORE --> NONE{matched: false}

    HIGH --> RH[Present resolution steps and validation commands]
    MED --> RM[Present resolution steps - suggest raising issue if unresolved]
    LOW --> RL[AI open-ended analysis - suggest raising GitHub issue with full data]
    NONE --> RN[AI open-ended analysis - suggest raising GitHub issue with full data]

    RH --> OFFER[Offer to generate GitHub issue body]
    RM --> OFFER
    RL --> OFFER
    RN --> OFFER
```

---

## Demo Flow — Two Tiers

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Det as Detective - Bob skill
    participant Core as Core Engine
    participant AI as Bob AI

    Note over Dev,AI: Tier 1 warm-up - port 449

    Dev->>Det: investigate ibmi issue - cannot connect port 449
    Det->>Core: run-diagnostics.js - IBM_I_MOCK_SCENARIO=port449
    Core-->>Det: mock-diagnostics-port449.json
    Det->>Core: match-symptom.js
    Core-->>Det: matched=true, confidence=90, band=high
    Det->>AI: generate resolution report
    AI-->>Dev: report with resolution steps and validation checklist

    Note over Dev,AI: Tier 2 main act - issue 3239

    Dev->>Det: investigate ibmi issue - stuck at Starting Mapepire after upgrade
    Det->>Core: run-diagnostics.js - IBM_I_MOCK_SCENARIO=3239
    Core-->>Det: mock-diagnostics-3239.json
    Det->>Core: match-symptom.js
    Core-->>Det: matched=true, confidence=83, band=high, suggest_github_issue=true
    Det->>AI: generate resolution report
    AI-->>Dev: report with confidence score and validation checklist
    Det->>Dev: Offer to generate GitHub issue for vscode-ibmi maintainers
    Dev->>Det: Yes
    Det->>AI: fill github-issue-template.md
    AI-->>Dev: structured issue body ready to paste into GitHub
```

---

## AI vs Deterministic Split

| Component | Type | File |
|---|---|---|
| Known Issue Registry | Deterministic | `src/known-issues.json` |
| Diagnostic runner - mock mode | Deterministic | `src/run-diagnostics.js` |
| Diagnostic runner - live mode query emit | Deterministic | `src/run-diagnostics.js` |
| Symptom matcher | Deterministic | `src/match-symptom.js` |
| Confidence score calculation | Deterministic | `src/match-symptom.js` |
| Bob orchestration | Orchestration | `.bob/skills/ibmi-detective.md` |
| Bob mode definition | Orchestration | `.bob/custom_modes.yaml` |
| VS Code orchestration | Orchestration | `AGENT.md` |
| Resolution report prose | AI | fills `src/report-template.md` |
| GitHub issue body | AI | fills `src/github-issue-template.md` |
| Open-ended fallback analysis | AI | inline in skill/AGENT.md |

---

## File Dependency Map

```mermaid
flowchart LR
    SKILL[.bob/skills/ibmi-detective.md]
    AGENT[AGENT.md]
    RD[src/run-diagnostics.js]
    MS[src/match-symptom.js]
    KI[src/known-issues.json]
    MD1[src/mock-diagnostics-port449.json]
    MD2[src/mock-diagnostics-3239.json]
    RT[src/report-template.md]
    GT[src/github-issue-template.md]

    SKILL --> RD
    SKILL --> MS
    SKILL --> RT
    SKILL --> GT
    AGENT --> RD
    AGENT --> MS
    AGENT --> RT
    AGENT --> GT
    RD --> MD1
    RD --> MD2
    MS --> KI
```
