# Skill Pipelines

Ordered skill sequences per intent. Skills come from `.github/skills/`. The pipeline
is mandatory: **understand → plan → design → implement → verify → ship**. Each skill's
`SKILL.md` is loaded only when its stage is reached (progressive disclosure).

## Universal spine

1. **Understand** — `acquire-codebase-knowledge` (map repo, stack, conventions)
2. **Plan** — architecture intent only
3. **Design** — UI/UX intent only
4. **Implement** — one sub-agent per concern
5. **Verify** — `security-review` + `webapp-testing` / `chrome-devtools`
6. **Ship** — `git-commit` (conventional commit)

## Per-intent sequences

### Architecture
`acquire-codebase-knowledge` → `architecture-blueprint-generator` → `refactor`
(only if the plan identifies restructuring)

### UI/UX Design
`premium-frontend-ui` → `anti-ui-slop` (design contract + finish gate) →
`gsap-framer-scroll-animation` (motion) → `web-design-reviewer` (visual inspect) →
`ui-screenshots` (capture for verification)

### API/Webhook
Implement via agent → `security-review` (gate) → `webapp-testing` (exercise the endpoint) →
`refactor` (clean up if needed)

### Quality/Testing
`javascript-typescript-jest` → `webapp-testing` → `ui-screenshots`

### Performance
`chrome-devtools` (profile) → `premium-frontend-ui` (apply) → `webapp-testing`
(verify no regression)

### Security
`security-review` (scan) → fix via `refactor`/agent → re-scan with `security-review`

### Refactor/Cleanup
`refactor` → `webapp-testing` (behavior unchanged) → `security-review` (no new issues)

### Documentation
`acquire-codebase-knowledge` → `readme-blueprint-generator` (README) /
`architecture-blueprint-generator` (architecture docs)

## Enforcement

- Load the skill's `SKILL.md` at the start of each stage.
- Do not skip the Verify stage for any intent.
- If a skill is missing for a required stage, STOP and report the gap rather than
  improvising.
