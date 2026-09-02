---
name: cicd-automation-workflow-automate
description: Orchestrates automated testing, type-checking, linting, and Android mobile build pipelines on code changes. Use when setting up or modifying CI/CD workflows.
---

# CI/CD Automation Workflow

This skill guides the orchestration of automated testing, linting, type-checking, and mobile app build processes.

## Capabilities & Triggers
- Automatic `npx tsc --noEmit` type-checks on every pull request and push.
- Automated unit and integration test runs via Jest and Playwright.
- Build artifact packaging (Expo Application Services - EAS, Gradle APK/AAB builds).
- Automated security scanning for Firebase rules and environment variables.

## Workflow Rules
1. **Lint & Type Check Gate**: Every pipeline must execute `npx tsc --noEmit` and code analysis before triggering builds.
2. **Deterministic Environment**: Cache `node_modules` and Gradle dependencies to guarantee sub-5-minute execution times.
3. **Secret Isolation**: Never commit keystores, service account JSON files, or production tokens into repository history.
