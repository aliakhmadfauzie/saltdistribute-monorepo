# Intent Taxonomy

Classify each request into ONE primary intent (secondary intents allowed). Classification
must be evidence-based — cite the trigger phrase or code signal you used. If two intents
are equally likely, ask one clarifying question.

| Intent | Trigger phrases / signals | Primary sub-agent | Primary skill |
|--------|----------------------------|-------------------|---------------|
| **Architecture** | "plan the architecture", "how should I structure", "refactor the modules", "component hierarchy", "data flow", "design system" | `Plan Mode - Strategic Planning & Architecture`, `Context Architect` | `acquire-codebase-knowledge`, `architecture-blueprint-generator` |
| **UI/UX Design** | "redesign", "make it look premium", "animations", "scroll effect", "responsive", "accessibility", "design contract" | `gem-designer`, `Accessibility Expert`, `Frontend Performance Investigator` | `premium-frontend-ui`, `anti-ui-slop`, `gsap-framer-scroll-animation`, `web-design-reviewer` |
| **API/Webhook** | "add an endpoint", "webhook", "fetch from API", "Express server", "form submission", "server-side logic" | `Expert React Frontend Engineer`, `gem-debugger`, `QA` | `security-review`, `refactor` |
| **Quality/Testing** | "add tests", "verify", "find bugs", "regression", "audit", "coverage" | `QA`, `gem-browser-tester`, `Playwright Tester Mode` | `javascript-typescript-jest`, `webapp-testing` |
| **Performance** | "slow", "optimize", "Core Web Vitals", "LCP", "bundle size", "layout shift" | `Frontend Performance Investigator` | `chrome-devtools`, `premium-frontend-ui` |
| **Security** | "is this secure", "XSS", "secrets", "hardening", "injection" | `gem-debugger` (with security review) | `security-review` |
| **Refactor/Cleanup** | "simplify", "remove dead code", "reduce complexity", "deduplicate" | `gem-code-simplifier`, `gem-debugger` | `refactor` |
| **Documentation** | "document", "README", "onboard me", "architecture docs" | `Context Architect`, `Plan Mode - Strategic Planning & Architecture` | `acquire-codebase-knowledge`, `readme-blueprint-generator` |

## Notes

- **UI/UX + Performance** often co-occur (animations + Core Web Vitals). Run UI/UX as
  primary, add Performance as a secondary intent.
- **API + Security** co-occur (any endpoint). Run Security as a gate after API work.
- Write the classified intent(s) at the top of your delegation plan so the user can
  confirm routing before work begins.
