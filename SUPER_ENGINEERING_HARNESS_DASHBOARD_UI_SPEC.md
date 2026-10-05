# Super Engineering Harness Dashboard — UI Specification

## Purpose

Build a premium local developer-control-room dashboard for the **Super Engineering Harness**.

The dashboard is an **observability UI**, not an AI agent. It visualizes the harness execution in real time:

- current agent
- completed agents
- waiting agents
- actual execution path
- loops/retries
- observable current activity
- model used
- input/output tokens
- elapsed time
- live events
- PASS / FAIL / BLOCKED states

## Critical rule: the dashboard uses NO LLM

Never call an LLM to:

- summarize events
- determine the current agent
- infer workflow state
- generate explanations
- create dashboard content
- describe hidden reasoning

Use deterministic structured events and a deterministic state machine.

```text
OMP / Harness
     |
     v
Event Collector (NO LLM)
     |
     v
State Manager (NO LLM)
     |
  WebSocket
     |
     v
React Dashboard
```

---

# 1. Implementation strategy

Build this in phases.

### Phase 1 — UI only

Use mock runtime data.

Build the complete visual dashboard before integrating OMP.

### Phase 2 — State/event engine

Convert structured events into deterministic dashboard state.

### Phase 3 — WebSocket

Push state/events to the React UI.

### Phase 4 — OMP integration

Replace the mock event source with real OMP/harness events.

### Phase 5 — Optional controls

Later support pause, stop, retry, etc.

**Do not integrate OMP during Phase 1.**

---

# 2. Product vision

The dashboard should feel like **mission control for software-engineering agents**.

It must answer immediately:

```text
What task?
    ↓
Where is the harness?
    ↓
Which agent is running?
    ↓
Which model?
    ↓
What is it doing?
    ↓
What already happened?
    ↓
Did it loop?
    ↓
How many tokens/time?
    ↓
What happens next?
```

It should be:

- professional
- technical
- precise
- modern
- clean
- information-dense without clutter
- visually interesting while an agent run progresses

It must NOT look like:

- generic SaaS admin dashboard
- analytics dashboard
- crypto dashboard
- cyberpunk/hacker UI
- neon-heavy interface
- rainbow monitoring tool
- AI chat UI

Avoid excessive gradients, giant cards, decorative illustrations, excessive glassmorphism, and unnecessary animation.

---

# 3. Main screen

The primary screen should be a single execution control room.

```text
+--------------------------------------------------------------------+
| SUPER ENGINEERING HARNESS                    ● LIVE       18:42    |
| Task: Add Quick Sale Held Bills                                    |
+--------------------------------------------------------------------+
|                                                                    |
| EXECUTION FLOW                                                     |
|                                                                    |
| Planner -> Phase -> Writer -> Review -> UI QA -> QA -> Final -> Git|
|                                                                    |
+--------------------------------------------------------------------+
|                                                                    |
| CURRENT AGENT / ACTIVITY                    RUN METRICS            |
|                                                                    |
| Code Writer                                  Input     18.4K        |
| DeepSeek v4.1                                Output     2.1K        |
| Reading POS.jsx                              Requests      11       |
| Searching saleMode                            Elapsed      42s       |
| Running test                                 Loops          0       |
|                                                                    |
+--------------------------------------------------------------------+
| LIVE EVENTS                                                        |
|                                                                    |
| 22:41:03  ✓ Planner completed                                      |
| 22:41:04  ✓ Phase Controller selected SMALL                        |
| 22:41:06  ● Code Writer started                                    |
| 22:41:12    read POS.jsx                                           |
| 22:41:19    search saleMode                                        |
+--------------------------------------------------------------------+
```

The execution graph is the visual centerpiece.

---

# 4. Header

Compact, premium header.

Left:

```text
SUPER ENGINEERING HARNESS
Task: Add Quick Sale Held Bills
```

Right:

```text
● LIVE
18:42
```

Optional:

- run selector
- connection indicator
- settings
- theme toggle

Do not make the header oversized.

---

# 5. Overall run status

Supported statuses:

```text
QUEUED
PLANNING
IMPLEMENTING
REVIEWING
TESTING
COMPLETED
FAILED
BLOCKED
CANCELLED
```

Use restrained semantic colors:

```text
RUNNING   = cool blue/cyan
SUCCESS   = green
WAITING   = muted gray
FAILED    = red
BLOCKED   = amber
RETRY     = violet/blue
```

Do not color every text element.

---

# 6. Execution graph

The graph must clearly show:

1. completed path
2. current agent
3. waiting agents
4. conditional agents
5. loops/retries
6. current location

Base topology:

```text
Planner
   |
   v
Phase Controller
   |
   v
Code Writer
   |
   v
Code Review
   |
   v
Frontend UI QA [conditional]
   |
   v
QA
   |
   v
Final Review
   |
   v
Git
```

Actual execution can branch.

Example UI-QA loop:

```text
Code Writer
    |
    v
UI QA
    |
    +---- PASS ----> QA
    |
    +---- FAIL ----> Code Writer
                         |
                         v
                       UI QA
```

Example QA loop:

```text
QA
 |
 +---- PASS ----> Final Review
 |
 +---- FAIL ----> Debug/Fix
                       |
                       v
                      QA
```

Use a proper node/edge graph library such as React Flow or an equivalent.

Do not manually fake a static diagram if a graph library makes dynamic edges/nodes easier.

---

# 7. Agent nodes

Nodes should be compact and readable.

Running:

```text
+------------------------------+
| <>  CODE WRITER              |
|                              |
| ● RUNNING                    |
| DeepSeek v4.1                |
|                              |
| Reading POS.jsx              |
+------------------------------+
```

Completed:

```text
+------------------------------+
| ✓  PLANNER                   |
|                              |
| COMPLETE                     |
| GPT Luna                     |
| 2m 14s                       |
+------------------------------+
```

Waiting:

```text
+------------------------------+
| QA                           |
|                              |
| WAITING                      |
+------------------------------+
```

Failed:

```text
+------------------------------+
| UI QA                        |
|                              |
| FAILED                       |
| Loop #1                      |
+------------------------------+
```

Do not put all token metrics inside every node. Detailed data belongs elsewhere.

---

# 8. Current-agent panel

The current agent must be visually dominant.

Show:

```text
CURRENT AGENT

CODE WRITER
● RUNNING

Model
DeepSeek v4.1

Current activity
Reading frontend/pos-frontend/src/pages/POS.jsx

Elapsed
00:42
```

Only show observable operations:

- reading files
- searching code
- editing files
- running commands
- running tests
- starting browser
- opening routes
- screenshots
- tool calls
- handoffs

Never show private chain-of-thought.

Never generate fake explanations such as "agent is carefully analyzing architecture."

---

# 9. Live event timeline

Compact chronological stream:

```text
LIVE EVENTS

22:41:03  ✓  Planner completed
22:41:04  ✓  Phase Controller selected SMALL
22:41:06  ●  Code Writer started
22:41:12     read POS.jsx
22:41:19     search "saleMode"
22:41:28     read AppConfigurationContext.jsx
22:41:35     run npm test
22:41:42  →  handoff to UI QA
```

Requirements:

- scrollable
- timestamps
- agent identity
- event type
- status indicator
- loop markers
- newest events easy to find

Do not make every event a large card.

---

# 10. Loop visualization

Loops are a first-class feature.

Example:

```text
UI QA
  |
  X FAIL
  |
  +----------------------+
                         |
                         v
                   CODE WRITER
                         |
                         v
                       UI QA
                         |
                         v
                        PASS
```

Show:

```text
Loop #1
```

and, where known:

```text
Loop #1 of 2
```

The graph must retain the completed path rather than replacing it.

---

# 11. Model display

Show the model as secondary metadata:

```text
Planner
GPT Luna
```

```text
Code Writer
DeepSeek v4.1
```

```text
Frontend UI QA
Kimi Coding
```

```text
QA
GLM 5.3
```

Do not make model names more prominent than agent names.

---

# 12. Metrics panel

Provide:

```text
RUN METRICS

Input       73.3K
Output       2.1K
Requests        14
Elapsed      02:31
Agents        5 / 8
Loops             1
```

Optional per-agent usage:

```text
Planner             12.4K
Phase Controller     6.8K
Code Writer         20.5K
Code Review          8.1K
UI QA                0
QA                   0
```

This is important because the dashboard will be used to optimize the harness.

---

# 13. Agent details

Selecting an agent should show:

```text
Agent
Code Writer

Model
DeepSeek v4.1

Status
Running

Started
22:41:06

Elapsed
00:42

Input
18.4K

Output
2.1K

Requests
7

Current activity
Reading POS.jsx
```

This information must come from runtime state, not an LLM.

---

# 14. Responsive behavior

Primary target:

```text
1440px+
```

Also support:

```text
1280px
1024px
768px
```

At smaller widths:

- graph remains usable
- side panels can collapse
- event timeline can become full width
- metrics become compact
- no horizontal page overflow

Use graph pan/zoom or controlled scrolling where appropriate.

Do not simply shrink everything until unreadable.

---

# 15. Interactions

### Agent node click

Show:

- model
- status
- elapsed
- token usage
- event history
- current/last activity

### Event click

Highlight the related agent/node.

### Loop click

Highlight the loop path:

```text
failure -> writer -> retry -> QA
```

### Run selector

Future-ready support:

```text
RUNS

Add Quick Sale Held Bills
Today 10:42

POS bug fix
Today 09:31

Held Bills UI
Yesterday 18:22
```

Do not build persistent history in Phase 1 unless trivial.

---

# 16. Animation

Animation must communicate execution.

Allowed:

- subtle pulse on running node
- smooth current-agent transition
- edge/path progression
- small live activity indicator
- event arrival transition
- loop transition

Avoid:

- constant spinning
- bouncing cards
- particle effects
- excessive glow
- flashy transitions

The dashboard should feel alive, not distracting.

---

# 17. Visual design system

Use a restrained developer-tool palette.

Recommended:

- sophisticated dark neutral or clean light neutral background
- slightly elevated panels
- subtle borders
- strong primary text
- muted secondary text
- monospace for file paths/events/technical data

Semantic accents:

```text
Running    cool blue/cyan
Success    green
Warning    amber
Failure    red
Retry      violet/blue
Waiting    neutral gray
```

Do not use a different bright color for every agent.

---

# 18. Security

Never display:

- passwords
- API keys
- access tokens
- cookies
- secrets
- environment-variable secrets

If future event data contains secrets, redact them in the collector before sending to the browser.

File paths and safe tool activity are fine.

---

# 19. No chain-of-thought

Allowed:

```text
Reading POS.jsx
Searching saleMode
Running tests
Starting browser
Handoff -> UI QA
```

Forbidden:

```text
I think the bug is...
I am reasoning that...
My internal thought process...
```

The dashboard is an observability system.

---

# 20. Recommended stack

```text
Frontend
React
Vite
Tailwind CSS

Graph
React Flow or equivalent

Backend
Node.js

Realtime
WebSocket

Initial state
In-memory

Later persistence
SQLite or equivalent
```

Keep Phase 1 simple.

---

# 21. Suggested project structure

```text
super-harness-dashboard/
|
├── README.md
├── UI_SPEC.md
|
├── frontend/
|   └── src/
|       ├── components/
|       |   ├── Header/
|       |   ├── ExecutionGraph/
|       |   ├── AgentNode/
|       |   ├── CurrentAgent/
|       |   ├── Metrics/
|       |   ├── EventTimeline/
|       |   └── RunStatus/
|       |
|       ├── data/
|       |   └── mockRun.js
|       |
|       ├── state/
|       |   └── harnessStore.js
|       |
|       └── pages/
|           └── Dashboard.jsx
|
└── server/
    ├── events/
    ├── state/
    ├── websocket/
    └── index.js
```

The implementation may adapt this structure if the chosen stack has a better convention.

---

# 22. Mock data

Use this scenario for Phase 1:

```json
{
  "task": {
    "title": "Add Quick Sale Held Bills",
    "status": "IMPLEMENTING"
  },
  "currentAgent": "code-writer-small",
  "agents": {
    "planner": {
      "status": "completed",
      "model": "GPT Luna",
      "elapsed": "02:14"
    },
    "phase-controller": {
      "status": "completed",
      "model": "GPT Luna",
      "elapsed": "00:31"
    },
    "code-writer-small": {
      "status": "running",
      "model": "DeepSeek v4.1",
      "activity": "Reading frontend/pos-frontend/src/pages/POS.jsx",
      "elapsed": "00:42"
    },
    "code-reviewer": {
      "status": "waiting"
    },
    "frontend-ui-qa": {
      "status": "waiting"
    },
    "qa": {
      "status": "waiting"
    },
    "final-review": {
      "status": "waiting"
    },
    "git-agent": {
      "status": "waiting"
    }
  },
  "loops": [],
  "metrics": {
    "inputTokens": 18400,
    "outputTokens": 2100,
    "requests": 11,
    "elapsed": "03:27"
  }
}
```

Also implement mock states for:

1. normal success
2. UI QA failure -> writer -> UI QA
3. QA failure -> Debug/Fix -> QA
4. blocked UI QA
5. completed run

These states are needed to verify the graph.

---

# 23. Future event contract

The UI/state layer should be compatible with events such as:

```json
{
  "type": "agent.started",
  "runId": "run-123",
  "agent": "code-writer-small",
  "model": "omniroute/Deepseek v4.1 free",
  "timestamp": 1791180000
}
```

```json
{
  "type": "tool.file_read",
  "runId": "run-123",
  "agent": "code-writer-small",
  "file": "frontend/pos-frontend/src/pages/POS.jsx",
  "timestamp": 1791180012
}
```

```json
{
  "type": "agent.handoff",
  "runId": "run-123",
  "from": "code-writer-small",
  "to": "frontend-ui-qa",
  "timestamp": 1791180042
}
```

```json
{
  "type": "qa.failed",
  "runId": "run-123",
  "agent": "frontend-ui-qa",
  "loop": 1,
  "reason": "Responsive layout issue",
  "timestamp": 1791180100
}
```

```json
{
  "type": "agent.completed",
  "runId": "run-123",
  "agent": "frontend-ui-qa",
  "status": "passed",
  "timestamp": 1791180210
}
```

The UI must not depend on these exact names if the eventual OMP adapter needs a mapping layer, but its internal state model should be compatible with this event style.

---

# 24. GPT Luna build instructions

When this file is given to GPT Luna:

1. Read the entire `UI_SPEC.md`.
2. Inspect the new project's existing structure.
3. Build Phase 1 only.
4. Use mock runtime data.
5. Focus heavily on visual quality.
6. Make the execution graph the centerpiece.
7. Make the current agent unmistakable.
8. Make completed/waiting/failed states obvious.
9. Implement loops/retries visually.
10. Implement the live event timeline.
11. Implement token/runtime metrics.
12. Test desktop and responsive layouts.
13. Do NOT integrate OMP yet.
14. Do NOT add an LLM service.
15. Do NOT create unrelated pages.
16. Do NOT redesign this into a generic admin dashboard.

After Phase 1, report exactly what was implemented and stop.

---

# 25. Phase 1 acceptance criteria

### Visual

- [ ] Premium developer-tool appearance
- [ ] Execution graph is the centerpiece
- [ ] Current agent is immediately obvious
- [ ] Completed path remains visible
- [ ] Waiting agents are distinct
- [ ] PASS/FAIL/BLOCKED are distinct
- [ ] Loops are clearly visible
- [ ] Timeline is readable
- [ ] Metrics are readable
- [ ] No generic admin-dashboard appearance
- [ ] No excessive neon/cyberpunk styling
- [ ] No excessive gradients
- [ ] No unnecessary decoration

### Functional

- [ ] Mock agent states render
- [ ] Current agent can change
- [ ] Completed agents remain visible
- [ ] Waiting agents remain visible
- [ ] Failed agents render
- [ ] UI QA loop can be represented
- [ ] QA/Debug loop can be represented
- [ ] Blocked state can be represented
- [ ] Timeline updates from mock events
- [ ] Metrics update from mock state

### Architecture

- [ ] Dashboard uses no LLM
- [ ] OMP is not required for Phase 1
- [ ] Mock event source is isolated
- [ ] State layer is separate from UI
- [ ] WebSocket can replace mock events later
- [ ] OMP adapter can replace the event source later without redesigning the UI

---

# 26. Final instruction

Build this as a **professional software-engineering execution control room**, not a generic dashboard.

The most important visual element is the live harness flow.

The user must be able to glance at the screen and immediately see:

```text
✓ what finished
→ where execution moved
● what is running now
○ what is waiting
↻ where a loop happened
✕ what failed
```

The dashboard itself remains deterministic and consumes runtime events. It must never require an LLM to understand or display the harness.
