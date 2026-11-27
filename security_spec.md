# QuantumShield AI Security Specification (Phase 0)

## 1. Data Invariants
1. Every document written to `/scans`, `/copilot_sessions`, `/mitigation_profiles`, and `/assessment_requests` MUST belong to `request.auth.uid` (`ownerUid == request.auth.uid`) with verified email (`request.auth.token.email_verified == true`).
2. User profiles (`/users/{userId}`) and assessment requests (`/assessment_requests/{requestId}`) contain PII (`email`, `fullName`) and are strictly readable only by the document owner or a verified admin (`/admins/{uid}`). Blanket `list` queries on `/users` are denied.
3. Operators cannot self-assign `'admin'` role during `/users/{userId}` creation (`role == 'analyst'`), and `/admins/{userId}` can only be bootstrapped by the verified runtime owner email (`naifislamsarkerr@gmail.com`).
4. All document IDs (`isValidId`) are bounded to 1–128 characters matching `^[a-zA-Z0-9_-]+$`.
5. All timestamps (`createdAt`, `updatedAt`, `grantedAt`) MUST equal `request.time`; `createdAt` and `ownerUid` are immutable on updates.
6. Updates to `/scans/{scanId}` use action-based `affectedKeys().hasOnly(...)` allowlists (`remediationApplied`, `readinessScore`, `riskIndex`, `status`, `updatedAt`), and `/assessment_requests/{requestId}` locks terminal state once stored.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Scan Write**: `create /scans/scan_1` with `auth = null` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: `create /scans/scan_2` with `email_verified = false` -> `PERMISSION_DENIED`.
3. **Owner UID Spoofing**: `create /scans/scan_3` with `ownerUid = "victim_uid"` -> `PERMISSION_DENIED`.
4. **Admin Self-Escalation on Profile**: `create /users/attacker` with `role = "admin"` -> `PERMISSION_DENIED`.
5. **Non-Owner Admin Bootstrap**: `create /admins/attacker` with non-owner verified email -> `PERMISSION_DENIED`.
6. **Shadow Field Injection**: `create /scans/scan_4` including undeclared `"isOfficial": true` -> `PERMISSION_DENIED`.
7. **Oversized String Poisoning**: `create /scans/scan_5` with `aiSummary` length > 2000 -> `PERMISSION_DENIED`.
8. **Invalid ID Path Injection**: `create /scans/bad..path$id` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `create /scans/scan_6` with backdated `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Cross-Tenant PII Read**: `get /users/victim_uid` as another signed-in user -> `PERMISSION_DENIED`.
11. **Unscoped List Query**: `list /scans` without `where('ownerUid', '==', auth.uid)` constraint -> `PERMISSION_DENIED`.
12. **Out-of-Bounds Update Key**: `update /scans/scan_1` attempting to mutate `targetHost` or `ownerUid` -> `PERMISSION_DENIED`.
