# Mc-Skyline.online: recruitment and document-handling handoff

เอกสารนี้เป็นแนวทางทางเทคนิค/ร่างข้อความ ไม่ใช่คำปรึกษากฎหมาย และต้องให้ทนายไทยตรวจสอบก่อนใช้งานจริง

## Current public flow

- Public overview: `/join-team`
- Project recruitment: `/join-team/mc-skyline`
- Public form document: `joinTeamForms/mc-skyline` (Firestore, compatible with the existing CMS)
- Public form must not request ID-card, bank-book, bank-account, or tax-ID documents.
- Do not send identity or payment documents to Discord webhooks.

## Mc-Skyline roles

| role | slots |
| --- | ---: |
| Developer | 2 |
| Builder | 2 |
| System / Item / Quest | 2 |
| Modeler | 2 |
| Resource Pack | 2 |
| Other staff | unlimited / reviewed case by case |

No age or gender restriction is shown in the recruitment copy. Contract capacity, payment, tax, and minor-consent requirements must be reviewed per applicant.

## Required contract fields before signing

1. Actual legal names and addresses of both parties; do not call an unregistered group a company.
2. Project, role, deliverables, acceptance criteria, schedule, and communication channel.
3. Profit-sharing formula: gross/net basis, allowable costs, accounting period, evidence, percentage, payment date, and audit/dispute process.
4. Copyright/IP ownership and licence for pre-existing and newly created work.
5. Confidentiality, security, account access, incident handling, termination, data return/deletion, and dispute process.
6. Signature/date and a copy of the final version accepted by both parties.

## Proposed funding and profit waterfall

The organizer/funding lead identified by the requester is นายพงศ์ภรณ์ ทองศิริ. Project receipts are proposed to flow into the account designated by that person, subject to the final contract, accounting evidence, and tax advice.

1. Record all project receipts for the period.
2. Deduct only documented and pre-agreed project costs: electricity, VPS, domain, software, payment fees, and other necessary costs listed in the contract.
3. Until the agreed cost basis has been recovered, no salary or guaranteed monthly payment is due unless a later written agreement says otherwise.
4. If a month has no receipts or no net profit after allowable costs, no profit distribution is made for that month; it must not be described as an accrued salary.
5. After the cost basis is fully recovered and there is net profit, distribute using explicit percentages. นายพงศ์ภรณ์ ทองศิริ may receive a larger share, but every percentage, calculation base, and payment date must be written and accepted before signing.
6. Provide a periodic statement showing receipts, costs, unrecovered balance, net profit, each person’s percentage, and paid amount.

Do not invent the percentages in code or in a contract. The final document must fill in the numbers, define “net profit”, set approval rules for expenses, explain treatment of losses/carry-forward, and specify how a participant can inspect supporting records.

Tax treatment depends on the actual arrangement. The Revenue Department publishes guidance for ordinary partnerships/non-juristic person groups and requires appropriate income/expense records; obtain an accountant/tax lawyer’s advice before receiving or distributing project money.

## Identity and payment documents

Request only after selection and only where necessary. Use a private authenticated upload flow with encryption at rest, MFA for admins, least-privilege roles, short-lived signed URLs, access audit logs, and a published retention/deletion date.

Suggested watermark text for an ID copy (not a legal guarantee):

> สำเนาถูกต้อง ใช้สำหรับทำสัญญากับ Mc-Skyline.online เท่านั้น วันที่ … ลายเซ็น … (คำนำหน้า ชื่อ–สกุล)

Ask the applicant to redact unrelated fields where lawful and appropriate. A bank-book cover/account number is for payment setup only; a tax ID is collected only when a real tax/payment requirement exists. Never store these in a public Firestore collection or as a client-side base64 data URL.

## Anti-fraud operating rule

Do not accuse or publish personal data. Preserve immutable timestamps, application IDs, relevant URLs, payment evidence, and access logs; suspend access proportionately; allow a response; then consult counsel or report to the competent authority when facts support it.

## Suggested private schema (future Supabase phase)

- `recruitment_applications`: non-sensitive application data and status.
- `identity_documents`: applicant ID, document type, private object key, checksum, purpose, consent/notice version, retention deadline, reviewed_by, reviewed_at, deleted_at.
- `payment_profiles`: masked account details, bank name, tax-purpose flag, retention deadline.
- `audit_events`: actor, action, resource, timestamp, request ID, IP hash, result.

The Supabase migration should be a separate change with a reviewed RLS policy and a tested export/rollback plan. Existing Firestore recruitment data should not be deleted during migration.
