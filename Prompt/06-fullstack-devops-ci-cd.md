# 🚀 Fullstack Orchestration & CI/CD DevOps Prompts

This guide contains prompts to call **`full-stack-orchestration-full-stack-feature`**, **`cicd-automation-workflow-automate`**, **`github-actions-templates`**, and **`deployment-pipeline-design`**.

---

## 1. Full-Stack Feature Orchestration (`full-stack-orchestration-full-stack-feature`)

### Common Prompts
```text
Please use the 'full-stack-orchestration-full-stack-feature' skill to coordinate an end-to-end feature across React Native screens, Firestore rules, state context, and notification triggers.
```

### Specific Feature Prompts
* **End-to-End Bulk Order Workflow:**
  ```text
  Orchestrate a complete bulk order discount feature using 'full-stack-orchestration-full-stack-feature':
  1. Update TypeScript interfaces in src/types/.
  2. Implement backend calculation in src/services/firestoreService.ts.
  3. Update firestore.rules for permission validation.
  4. Build dynamic pricing UI in app/(buyer)/cart.tsx and app/(admin)/orders.tsx.
  5. Trigger push notification upon bulk approval.
  ```

---

## 2. CI/CD Workflows & GitHub Actions (`github-actions-templates` / `cicd-automation-workflow-automate`)

### Common Prompts
```text
Please use the 'github-actions-templates' skill to set up automated linting, TypeScript type-checking, and EAS Android builds on push.
```

### Specific Feature Prompts
* **Automated Pull Request Validation Pipeline:**
  ```text
  Generate a GitHub Actions workflow using 'cicd-automation-workflow-automate' that runs 'npx tsc --noEmit', 'npx expo-doctor', and Jest test suites on every pull request to main.
  ```
* **Automated Firebase Rules & Hosting Deployment:**
  ```text
  Create a GitHub Actions workflow using 'github-actions-templates' to automatically deploy firestore.rules, storage.rules, and Firebase web hosting preview channels.
  ```

---

## 3. Deployment Pipeline Design (`deployment-pipeline-design`)

### Common Prompts
```text
Use the 'deployment-pipeline-design' skill to architect our staging, preview, and production release channels for Expo EAS and web hosting.
```

### Specific Feature Prompts
* **EAS Release Channels & OTA Updates:**
  ```text
  Design an Over-The-Air (OTA) update rollout strategy using 'deployment-pipeline-design' with Expo EAS Update for pushing urgent bugfixes without requiring full Play Store APK resubmissions.
  ```
