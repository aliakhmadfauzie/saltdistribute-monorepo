---
name: agent-orchestrator
description: 'Workflow for the Agent Orchestrator: intent classification, sub-agent delegation, skill-sequence enforcement, and quality gates for Architecture, UI/UX Design, and API/Webhook work. Load when orchestrating multi-part changes across this repository.'
---

# Agent Orchestrator

Coordinates this repository's installed agents and skills so a multi-part request is
routed, sequenced, and validated consistently.

## When to load

- The user asks to coordinate, plan, or build a feature spanning architecture + design
  + backend.
- A request must invoke sub-agents and produce standards-compliant output.
- You are the `agent-orchestrator` agent and need the routing, sequence, and gate
  details.

## Pipeline (always enforce order)

1. **Understand** — ground on the codebase using `acquire-codebase-knowledge`
   (+ `premium-frontend-ui` for design context).
2. **Plan** — for Architecture intent, produce a plan before any code.
3. **Design** — for UI/UX intent, define a design contract before implementing.
4. **Implement** — one sub-agent per concern.
5. **Verify** — gate on type-safety, architecture, and consistency.
6. **Ship** — `git-commit` (conventional commit) only after gates are green.

## Reference files

- `references/intent-taxonomy.md` — intent categories and how to classify.
- `references/delegation-matrix.md` — intent → sub-agent mapping (actual installed agents).
- `references/skill-pipelines.md` — ordered skill sequence per intent.
- `references/quality-gates.md` — type-safety, architecture, consistency, secrets gates.

## Hard rules

- Never implement before a plan exists (Architecture) or a design contract exists (UI-UX).
- One concern per sub-agent; do not bundle Architecture + UI/UX + API into a single
  sub-agent call.
- Run every gate. Do not declare success if any gate fails — re-route to the
  responsible sub-agent.
- Never edit agent or skill files you did not author unless the user explicitly asks.
- Respect this stack: React 19, TypeScript 5.8, Vite 6, Tailwind 4, `motion`,
  `lucide-react`, Express API, `@google/genai`.
