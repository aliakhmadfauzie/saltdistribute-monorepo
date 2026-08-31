---
name: security-review
description: 'Audits SaltDistribute application code and Firebase configuration for security vulnerabilities, including Firestore security rules, client-side price tampering prevention, role-based RBAC, receipt storage isolation, and secure credential handling.'
---

# SaltDistribute Security & Data Protection Review

Conduct security audits on the SaltDistribute application codebase and Firebase Firestore rules.

---

## Key Security Guardrails

### 1. Cloud Firestore RBAC & Rule Enforcement
- **Public Read**: Only authenticated users (`request.auth != null`) can read `inventory`.
- **Owner-Only Write**: Buyers can only write/create bookings where `request.resource.data.buyerId == request.auth.uid`.
- **Admin Override**: Only users with `role == 'admin'` can write to `inventory` or modify `booking.status` (other than initial creation / buyer cancellation in allowed states).
- **Price Immutability**: Firestore rules must forbid client manipulation of `unitPrice`, `discountAmount`, or `totalAmount`.

### 2. Client-Side Integrity
- Recalculate and validate tier prices and discounts against Firestore master data rather than trusting client-side payload overrides.
- Prevent double-booking race conditions by running transactions atomically on inventory documents.

### 3. Storage Isolation
- Receipts uploaded to Firebase Storage must be scoped to `receipts/{bookingId}/{filename}` with read access restricted to the booking owner and Admins.

### 4. Secret & Token Protection
- Keep all API keys in environment configurations.
- Use `expo-secure-store` for sensitive device persistence.
