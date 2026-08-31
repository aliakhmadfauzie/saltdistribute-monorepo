# Quality Gates

Run EVERY gate before declaring a task complete. A task is only "done" when all gates
pass. If a gate fails, route back to the responsible sub-agent; do not report success.

## G1 — Type safety

- Run `npm run lint` (= `tsc --noEmit`). Must exit 0 with no errors.
- No new `any` or `@ts-ignore`. Prefer explicit types from `src/types.ts`.
- All component props and API payloads are typed (`interface`/`type`), no `props: any`.
- No `eslint-disable` added without a comment explaining why.

## G2 — Architectural standards

- Follow the **Container/Presentation** component pattern
  (`react-container-presentation-component` skill) for non-trivial components.
- Keep data in `src/data/`; components receive data via props, not by importing raw
  JSON from arbitrary locations.
- Use `motion` for animation, `lucide-react` for icons — do not pull in new UI libs
  without the user's approval.
- React 19 idioms: prefer `useTransition`/`useDeferredValue`/`Suspense`
  (`react19-concurrent-patterns`) where relevant; no deprecated lifecycle/legacy
  context patterns.

## G3 — Consistency

- Components in `src/components/` follow the existing naming/style conventions.
- Tailwind classes consistent with the rest of the codebase; reuse `index.css` tokens.
- No duplicate or near-duplicate components; consolidate via `gem-code-simplifier`.

## G4 — Security

- No hardcoded secrets/API keys; use `.env` + `dotenv` (`@google/genai` key etc.).
- No `dangerouslySetInnerHTML` unless content is sanitized; `react-markdown` output
  must be safe.
- No XSS via user input; no unsafe `eval`/`new Function`.
- Run `security-review` skill; fix any high/critical findings.

## G5 — Runtime verification

- Build passes (`npm run build`).
- UI verified via `webapp-testing` / `chrome-devtools` in the browser; screenshots via
  `ui-screenshots`.
- For UI/UX: `anti-ui-slop` finish gate and `web-design-reviewer` visual checks pass.
- For API: endpoint exercised and response shape matches the typed contract.

## Gate check-table

| Gate | Command / check | Pass condition |
|------|-----------------|----------------|
| G1 | `npm run lint` | 0 errors |
| G2 | architecture standards | Follows container/presentation + React 19 |
| G3 | consistency | No dupes, consistent Tailwind |
| G4 | `security-review` | No high/critical findings |
| G5 | `npm run build` + browser verify | Build green, UI/API verified |

**Report format on completion:** list each gate as ✅/❌ with evidence. If any ❌,
list the responsible sub-agent and the corrective action.
