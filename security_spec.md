# Phase 0: Payload-First Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every `/workspaces/{userId}` document belongs exclusively to `request.auth.uid == userId`, and `data.ownerId` must equal `request.auth.uid`.
2. **Verified Identity**: All read and write operations require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **No Collection Listing / Scraping**: `allow list` and `allow delete` are explicitly denied (`false`). Clients may only `get`, `create`, or `update` their own `/workspaces/{userId}` document.
4. **Schema Key Lock (`hasAll` + `hasOnly`)**: A workspace document must contain exact keys `['ownerId', 'schemaVersion', 'studyDate', 'streakDays', 'stateMap', 'createdAt', 'updatedAt']` with zero shadow fields.
5. **Temporal & Identity Immutability**:
   - On `create`: `createdAt == request.time` and `updatedAt == request.time`.
   - On `update`: `ownerId == resource.data.ownerId`, `createdAt == resource.data.createdAt`, `updatedAt == request.time`, and `affectedKeys().hasOnly(['schemaVersion', 'studyDate', 'streakDays', 'stateMap', 'updatedAt'])`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Read**: User `uid_A` attempting `get(/workspaces/uid_B)` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Owner Spoof on Create**: User `uid_A` creating `/workspaces/uid_A` with `ownerId: "uid_B"` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Create**: Adding `"isAdmin": true` to `/workspaces/uid_A` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection on Update**: Updating `/workspaces/uid_A` with `"extraField": "hack"` -> `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: Document ID containing invalid characters or length > 128 -> `PERMISSION_DENIED`.
8. **Malformed `studyDate` String**: Setting `studyDate: "not-a-date-string-exceeding-bounds"` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery on Create**: Passing forged past/future `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
10. **Immortal Field Mutation (`createdAt` / `ownerId`)**: Attempting to modify `createdAt` or `ownerId` during `update` -> `PERMISSION_DENIED`.
11. **Value Poisoning on `streakDays`**: Passing a negative integer or string for `streakDays` -> `PERMISSION_DENIED`.
12. **Oversized `stateMap` Object**: Passing a non-map or a map with `size() > 50` top-level keys -> `PERMISSION_DENIED`.
