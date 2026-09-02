# 🛠️ DevTools, Debugging, Accessibility & Testing Prompts

This guide contains prompts to call **`chrome-devtools-plugin`**, **`test-automator`**, **`api-testing-observability-api-mock`**, and **`memory-leak-debugging`**.

---

## 1. Chrome DevTools MCP & Browser Inspection (`chrome-devtools`)

### Common Prompts
```text
Please use the 'chrome-devtools' skill to inspect the web view running on http://localhost:8081 and check for console errors or broken layouts.
```

### Specific Feature Prompts
* **Console & Network Error Diagnostics:**
  ```text
  Use 'chrome-devtools' to open the app, perform a test login, and monitor network requests for failing Firestore or API calls.
  ```
* **Core Web Vitals & LCP Optimization (`debug-optimize-lcp`):**
  ```text
  Run 'debug-optimize-lcp' on our web entry page to analyze Largest Contentful Paint (LCP) bottlenecks and optimize hero banner asset loading.
  ```

---

## 2. Accessibility Auditing & Compliance (`a11y-debugging` / `performance-a11y-audit`)

### Common Prompts
```text
Please use the 'a11y-debugging' skill to audit our forms, modals, and navigation buttons for WCAG 2.1 AA accessibility compliance.
```

### Specific Feature Prompts
* **Screen Reader & ARIA Labels Check:**
  ```text
  Audit our cart, checkout, and order cards using 'a11y-debugging' to verify all icons have accessibilityLabel and accessibilityRole defined properly.
  ```
* **Color Contrast & Tap Target Compliance:**
  ```text
  Run 'performance-a11y-audit' to check that all text meets the minimum 4.5:1 contrast ratio against the emerald theme and touch targets are >= 48x48dp.
  ```

---

## 3. Memory Leak & Snapshot Debugging (`memory-leak-debugging`)

### Common Prompts
```text
Use the 'memory-leak-debugging' skill to investigate potential memory leaks in our realtime Firestore snapshot subscriptions.
```

### Specific Feature Prompts
* **Heap Snapshot & Unmount Lifecycle Inspection:**
  ```text
  Analyze src/context/AppContext.tsx and ChatModal.tsx using 'memory-leak-debugging' to guarantee all event listeners, timers, and Firestore snapshot subscriptions cleanly dereference on unmount.
  ```

---

## 4. Test Automation & Mocking (`test-automator` / `api-testing-observability-api-mock`)

### Common Prompts
```text
Please use the 'test-automator' skill to write unit and component tests for our core order workflow components.
```

### Specific Feature Prompts
* **Firestore Offline Mock Tests:**
  ```text
  Use 'api-testing-observability-api-mock' to create mock datasets and offline Firestore fixture handlers for testing order state transitions without hitting live production databases.
  ```
* **Component Testing with React Native Testing Library:**
  ```text
  Using 'test-automator', generate test suites for NotificationBanner.tsx, StockBanner.tsx, and GuestOrderModal.tsx verifying user interactions and error states.
  ```
