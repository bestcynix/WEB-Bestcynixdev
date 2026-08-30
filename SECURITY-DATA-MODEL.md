# Profile Workforce & Finance Data Model

This note records the data paths and access patterns used by the profile workforce module.
It is intentionally kept as a local, untracked implementation note for Firestore Rules review.

## Existing paths used

- `users/{uid}`: account profile and current employment summary. The owner reads/updates their safe profile fields; verified Dev admins can inspect and manage it.
- `joinTeamApplications/{applicationId}`: recruitment applications and contract/signature state. Owners read only their own applications using `applicantUid` or `userId`; Dev admins manage applications.
- `employmentRecords/{recordId}`: append-only-ish employment status history. Dev admins create/update/delete; the matching owner can read their own records.
- `adminAnnouncements/{announcementId}`: notices sent by Dev admins to a target UID.
- `users/{uid}/notifications/{notificationId}`: per-user notices.
- `auditLogs/{logId}`: admin-only audit trail; creates are tied to the authenticated admin UID.

## New private paths

- `attendanceRecords/{uid_yyyy-mm-dd}`: one attendance record per user per day. Owner can create/update their own record; Dev admins can manage it.
- `paymentProfiles/{uid}`: current approved sensitive bank/tax payment profile. Owner and verified Dev admins can read; only verified Dev admins can write; delete is denied.
- `paymentChangeRequests/{requestId}`: member-submitted bank/tax change request. Owner and verified Dev admins can read; owner creates pending requests; only verified Dev admins can review; delete is denied.
- `paymentProfileHistory/{historyId}`: append-only account/tax versions, including archived bank accounts and the active version. Owner and verified Dev admins can read; only verified Dev admins can create; update/delete are denied.
- `payrollRecords/{recordId}`: monthly payment record, net calculation, paid status and private slip path. Owner and verified Dev admins only; only Dev admins write payroll records.
- `identityDocuments/{documentId}`: metadata for private identity/bank/tax uploads. Owner and verified Dev admins only.
- `financeEntries/{entryId}`: company/team income and expense ledger. Verified Dev admins only.

## Storage paths

- `private-personal/{uid}/identity/*`: identity card, bank book or tax files. Upload/delete are protected; authenticated SDK reads are owner/admin-only and are loaded as an in-memory Blob; images/PDF up to 20 MiB.
- `private-personal/{uid}/payroll/*`: payroll slips. Admin upload/delete are protected; authenticated SDK reads are owner/admin-only and are loaded as an in-memory Blob; images/PDF up to 20 MiB.

## Client queries

- Owners query `joinTeamApplications` by `applicantUid == auth.uid` and `userId == auth.uid`.
- Owners query `employmentRecords`, `attendanceRecords`, `payrollRecords`, and `identityDocuments` by their UID field.
- Dev admins may query these paths for the inspected UID and the finance ledger.
- The client also reads a single `paymentProfiles/{uid}` document.

## Required invariants

- A user UID, creator UID, immutable creation timestamp, payment amount and storage path are not user-controlled authority fields.
- No public read is granted to workforce, payroll, identity, bank or finance data.
- All new document writes are schema-bounded and size/type checked in both create and update rules.
- Sensitive upload URLs are never placed on public pages. New records store only `storagePath`/`slipPath`/`receiptPath`; the client reads through authenticated Storage Rules into a temporary in-memory Blob and never calls `getDownloadURL()`. Legacy URL fields are retained only for migration evidence and are ignored by the UI. This avoids Billing but remains subject to Spark quotas.
