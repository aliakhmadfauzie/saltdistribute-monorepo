# Delegation Matrix

Maps intent → the sub-agents actually installed in `.github/agents/`. Invoke agents by
their registered `name`. One concern per agent; collect outputs before proceeding.

## Agents available

| Agent `name` | Role |
|--------------|------|
| `Plan Mode - Strategic Planning & Architecture` | Strategic planning & architecture analysis |
| `Context Architect` | Multi-file planning; identifies relevant context/dependencies |
| `Expert React Frontend Engineer` | React 19 + TypeScript implementation |
| `gem-designer` | UI/UX design: layouts, themes, color, design systems |
| `gem-code-simplifier` | Refactor: dead code, complexity, dedupe |
| `gem-debugger` | Root-cause analysis, stack-trace diagnosis |
| `gem-browser-tester` | E2E browser testing, visual regression |
| `Frontend Performance Investigator` | Core Web Vitals, Lighthouse, layout shifts |
| `Accessibility Expert` | WCAG 2.1/2.2, inclusive UX |
| `Accessibility Runtime Tester` | Keyboard flows, focus, dialogs, WCAG validation |
| `Playwright Tester Mode` | Playwright tests |
| `QA` | Test planning, bug hunting, edge cases |

## Intent → deferred sub-agents (ordered)

| Intent | Ordered sub-agents |
|--------|--------------------|
| **Architecture** | 1. `Plan Mode - Strategic Planning & Architecture` → 2. `Context Architect` → 3. `Expert React Frontend Engineer` (for implementation) |
| **UI/UX Design** | 1. `gem-designer` → 2. `Accessibility Expert` → 3. `Frontend Performance Investigator` |
| **API/Webhook** | 1. `Expert React Frontend Engineer` → 2. `gem-debugger` → 3. `QA` |
| **Quality/Testing** | 1. `QA` → 2. `gem-browser-tester` → 3. `Playwright Tester Mode` |
| **Performance** | 1. `Frontend Performance Investigator` → 2. `gem-browser-tester` (measure) → 3. `Expert React Frontend Engineer` (fix) |
| **Security** | 1. `gem-debugger` (with code review) → 2. `QA` (verify) |
| **Refactor/Cleanup** | 1. `gem-code-simplifier` → 2. `QA` (verify behavior unchanged) |
| **Documentation** | 1. `Context Architect` → 2. `Plan Mode - Strategic Planning & Architecture` |

## Invocation template

Give each sub-agent a single, self-contained brief:

```
Run as <agent-name>. Task: <what to change>. Files: <paths>. Constraints: <standards from quality-gates>. Output: <what to return>. Do not touch files outside this scope.
```
