# 🔥 Firebase Backend & Database Prompts (`firebase`)

This guide contains prompts to call the **`firebase`** plugin, its specialized skills, and Firebase MCP tools.

---

## 1. Firebase Firestore & Schema (`firebase-firestore`)

### Common Prompts
```text
Please use the 'firebase-firestore' skill to review our collections architecture and query performance.
```
```text
Use 'firebase-firestore' to design a strongly typed Firestore schema for multi-tenant salt distribution orders and tenant inventory.
```

### Specific Feature Prompts
* **Atomic Batch Transactions:**
  ```text
  Using 'firebase-firestore', implement an atomic write batch or runTransaction() for placing an order that decrements product inventory and writes an order document simultaneously.
  ```
* **Composite Indexes Check:**
  ```text
  Check if our compound queries in src/services/firestoreService.ts require composite index declarations in firestore.indexes.json using 'firebase-firestore'.
  ```

---

## 2. Security Rules Auditor (`firebase-security-rules-auditor`)

### Common Prompts
```text
Please use the 'firebase-security-rules-auditor' skill to audit firestore.rules for unauthorized read/write vulnerabilities.
```

### Specific Feature Prompts
* **Role-Based Parity Audit:**
  ```text
  Use 'firebase-security-rules-auditor' to verify that tenant users can only read/update their own order documents (request.auth.uid == resource.data.buyerId), while admin users with admin role claim have full operational access.
  ```
* **Storage Rules Audit:**
  ```text
  Audit our storage.rules using 'firebase-security-rules-auditor' to ensure receipt images and payment proof uploads cannot be accessed publicly or overwritten by unauthorized users.
  ```

---

## 3. Firebase Authentication (`firebase-auth-basics`)

### Common Prompts
```text
Use the 'firebase-auth-basics' skill to review our auth flow, token refresh handling, and session state persistence.
```

### Specific Feature Prompts
* **Custom User Claims & Role Enforcement:**
  ```text
  Using 'firebase-auth-basics', design a secure role assignment strategy (admin, tenant, distributor) with custom claims and client-side AuthContext integration.
  ```
* **Anonymous Guest Checkout to Permanent Account Migration:**
  ```text
  Use 'firebase-auth-basics' to implement anonymous authentication for guest buyers with seamless account linking to email/password or Google Auth upon checkout.
  ```

---

## 4. Crashlytics & Error Monitoring (`firebase-crashlytics`)

### Common Prompts
```text
Use the 'firebase-crashlytics' skill to set up error boundary logging and crash reporting across our mobile and web builds.
```

### Specific Feature Prompts
* **Custom Error Attributes & User Tagging:**
  ```text
  Using 'firebase-crashlytics', create an error reporting service that tags crash reports with user role, active order ID, and network state before submitting.
  ```

---

## 5. Direct Firebase MCP Tools

You can also prompt the AI to run live MCP operations directly:
```text
List all Firestore collections and documents in our active Firebase project.
```
```text
Deploy our updated firestore.rules using the Firebase MCP deployment tool.
```
```text
Fetch the current Firebase SDK configuration for Android and Web.
```
