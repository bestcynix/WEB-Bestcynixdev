{
  "score": 4,
  "summary": "Prototype rules now isolate workforce, attendance, payroll, identity and finance data behind owner or verified Dev-admin checks. Payment profiles use an append-only approval history, and the client no longer creates new Firebase download-token URLs. Private files are read through authenticated SDK Blob reads to remain on the no-cost Spark plan.",
  "findings": [
    {
      "check": "The Update Bypass",
      "severity": "minor",
      "issue": "New collections call validators on both create and update and protect immutable UID/creation fields.",
      "recommendation": "Keep regression tests for every new field when the schema changes."
    },
    {
      "check": "Authority Source",
      "severity": "minor",
      "issue": "New privileged writes require the verified admin claim/email check; users cannot grant themselves payroll or finance privileges.",
      "recommendation": "Move the bootstrap admin allowlist to custom claims before broad production use."
    },
    {
      "check": "PII and sensitive document exposure",
      "severity": "moderate",
      "issue": "New client code stores only private storage paths and reads bytes after Firebase Storage Rules authorization. Existing legacy documents may still contain old downloadUrl/slipUrl/receiptUrl fields and should be rotated or removed by an admin migration.",
      "recommendation": "Keep the authenticated Blob approach on Spark, or move to a server-side short-lived signed URL only if Billing is intentionally enabled. Rotate legacy files/tokens and add malware scanning/retention controls."
    },
    {
      "check": "Business logic and timestamp trust",
      "severity": "moderate",
      "issue": "An owner may create or update their own attendance record, which is convenient but cannot by itself prove work attendance.",
      "recommendation": "Add manager approval, immutable server event logs, or a trusted backend clock before using attendance as a payroll source."
    },
    {
      "check": "Storage abuse and type safety",
      "severity": "minor",
      "issue": "Private uploads are restricted to image/PDF files up to 20 MiB and new Firestore fields have type and size checks.",
      "recommendation": "Add malware scanning and retention deletion jobs for uploaded documents."
    }
  ],
  "attack_outcomes": {
    "unauthenticated_private_read": "blocked by default deny",
    "user_reads_other_user_private_data": "blocked by owner UID checks",
    "user_creates_payroll_or_finance": "blocked by isAdmin",
    "user_changes_payment_profile_uid": "blocked by immutable uid validation",
    "user_overwrites_payment_history": "blocked because members create requests only; history create/update/delete is admin-only/deny",
    "invalid_oversized_upload": "blocked by Storage size/content-type rules",
    "schema_pollution": "blocked by hasOnly validators",
    "audit_log_spoofing": "blocked because audit create now requires isAdmin",
    "rules_compilation": "passed firebase deploy --only firestore:rules --dry-run",
    "storage_rules_compilation": "passed firebase deploy --only storage --dry-run",
    "signed_url_function_deploy": "not used: kept the project on Spark with authenticated Blob reads instead of a paid Cloud Function"
  },
  "red_team_attacks": {
    "member_overwrites_current_bank_profile": "blocked by admin-only paymentProfiles create/update",
    "member_deletes_old_bank_history": "blocked because paymentProfileHistory update/delete are denied",
    "member_edits_or_deletes_change_request": "blocked because paymentChangeRequests update/delete are admin-only/denied",
    "member_reads_other_user_history": "blocked by userUid == request.auth.uid or verified admin check",
    "member_reads_other_user_file": "blocked by Storage Rules owner UID check",
    "unauthenticated_file_read": "blocked by Storage Rules authentication check",
    "permanent_url_created_by_new_upload": "blocked in client flow; new metadata stores only storagePath and the UI uses authenticated Blob reads",
    "schema_pollution_on_payment_history": "blocked by hasOnly plus type, enum, length and timestamp validation"
  }
}
