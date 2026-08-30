import { createRemoteJWKSet, jwtVerify } from "npm:jose";
import { createSupabaseContext } from "npm:@supabase/server";

const FIREBASE_PROJECT_ID = "bestcynixdev";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const BUCKET = "private-workforce";
const ORIGINS = new Set([
  "https://bestcynixdev.web.app",
  "https://bestcynixdev.firebaseapp.com",
  "https://bestcynix.web.app",
  "https://bestcynix.firebaseapp.com",
  "https://web-bestcynixdev.vercel.app"
]);

type Claims = Record<string, any> & { sub: string; email?: string; email_verified?: boolean };
type Db = any;

function headers(req: Request) {
  const h = new Headers({
    "Cache-Control": "no-store, max-age=0",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  });
  const origin = req.headers.get("origin") || "";
  if (ORIGINS.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

function json(req: Request, body: unknown, status = 200) {
  const h = headers(req);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: h });
}

function bad(req: Request, status: number, error: string) {
  return json(req, { error }, status);
}

function now() { return new Date().toISOString(); }

function asText(value: unknown, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function validSlug(value: unknown) {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(String(value || ""));
}

function validMonth(value: unknown) {
  return /^\d{4}-\d{2}$/.test(String(value || ""));
}

function thailandDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (name: string) => parts.find((part) => part.type === name)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function iso(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function base64(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (const byte of view) out += String.fromCharCode(byte);
  return btoa(out);
}

function bytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  const encoded = Deno.env.get("PRIVATE_DATA_ENCRYPTION_KEY") || "";
  const raw = bytes(encoded);
  if (raw.byteLength !== 32) throw new Error("private_encryption_key_must_be_32_bytes_base64");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(value: string) {
  if (!value) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return `v1.${base64(iv)}.${base64(encrypted)}`;
}

async function decrypt(value: string | null | undefined) {
  if (!value) return "";
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") throw new Error("invalid_private_ciphertext");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(parts[1]) }, await encryptionKey(), bytes(parts[2]));
  return new TextDecoder().decode(plain);
}

async function authenticate(req: Request): Promise<Claims> {
  const value = req.headers.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice(7).trim() : "";
  if (!token) throw new Error("missing_bearer_token");
  const result = await jwtVerify(token, FIREBASE_KEYS, { issuer: FIREBASE_ISSUER, audience: FIREBASE_PROJECT_ID });
  if (!result.payload.sub || result.payload.firebase?.sign_in_provider === "anonymous") throw new Error("invalid_firebase_identity");
  return result.payload as Claims;
}

function adminEmails() {
  return new Set((Deno.env.get("WORKFORCE_ADMIN_EMAILS") || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

function isAdmin(claims: Claims) {
  const email = String(claims.email || "").toLowerCase();
  return (claims.admin === true || claims.role === "admin" || claims.role === "dev" || claims.role === "ceo")
    || (claims.email_verified === true && adminEmails().has(email));
}

async function context(req: Request) {
  const result = await createSupabaseContext(req, { auth: "none" });
  if (result.error) throw new Error("supabase_context_unavailable");
  return result.data.supabaseAdmin as Db;
}

async function memberByFirebaseUid(db: Db, firebaseUid: string) {
  const result = await db.from("workforce_members").select("*").eq("firebase_uid", firebaseUid).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function memberById(db: Db, id: string) {
  const result = await db.from("workforce_members").select("*").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function targetMember(db: Db, claims: Claims, targetUid: string) {
  const target = targetUid || claims.sub;
  if (!isAdmin(claims) && target !== claims.sub) throw new Error("forbidden_target");
  const member = await memberByFirebaseUid(db, target);
  if (!member) throw new Error("workforce_member_not_found");
  return member;
}

function mapMember(member: any) {
  if (!member) return null;
  return {
    id: member.id,
    firebaseUid: member.firebase_uid,
    displayName: member.display_name,
    companyId: member.company_slug,
    companyName: member.company_slug,
    teamName: member.team_slug,
    teamRole: member.role_name,
    employmentStatus: member.employment_status,
    joinedAt: iso(member.joined_at),
    endedAt: iso(member.ended_at),
    employmentNote: member.ended_reason || "",
    createdAt: iso(member.created_at),
    updatedAt: iso(member.updated_at)
  };
}

function mapApplication(row: any, contracts: any[]) {
  const contract = contracts.find((item) => item.id === row.contract_id);
  return {
    id: row.id,
    userId: row.firebase_uid,
    applicantUid: row.firebase_uid,
    companyId: row.company_slug,
    teamName: row.team_slug,
    positionName: row.role_name,
    status: row.application_status,
    createdAt: iso(row.submitted_at),
    updatedAt: iso(row.updated_at),
    decidedAt: iso(row.decided_at),
    decisionReason: row.decision_reason || "",
    contract: contract ? { signed: contract.contract_status === "signed", voided: contract.contract_status === "terminated", signedAt: iso(contract.signed_at) } : null
  };
}

function mapContract(row: any) {
  return {
    id: row.id,
    userUid: row.member_id,
    companyId: row.company_slug,
    companyName: row.company_slug,
    teamName: row.team_slug,
    teamRole: row.role_name,
    status: row.contract_status,
    signedAt: iso(row.signed_at),
    terminatedAt: iso(row.terminated_at),
    reason: row.termination_reason || "",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapAttendance(row: any) {
  return {
    id: row.id,
    uid: row.member_id,
    date: row.work_date,
    checkIn: iso(row.check_in),
    checkOut: iso(row.check_out),
    hours: Number(row.hours || 0),
    status: row.attendance_status,
    note: row.note || "",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapPayroll(row: any, documents: any[]) {
  const document = documents.find((item) => item.storage_path === row.slip_storage_path);
  return {
    id: row.id,
    uid: row.member_id,
    period: String(row.period_month || "").slice(0, 7),
    companyId: row.company_slug,
    companyName: row.company_slug,
    teamName: row.team_slug,
    baseSalary: Number(row.gross_amount || 0),
    bonus: 0,
    deductions: Number(row.deductions_amount || 0),
    netSalary: Number(row.net_amount || 0),
    paymentStatus: row.payment_status,
    paidAt: iso(row.paid_at),
    note: row.note || "",
    slipPath: document ? `supabase-document:${document.id}` : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapDocument(row: any) {
  return {
    id: row.id,
    userUid: row.member_id,
    kind: row.document_type,
    fileName: row.original_file_name || "ไฟล์ส่วนตัว",
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    reviewStatus: row.review_status,
    storagePath: `supabase-document:${row.id}`,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapFinance(row: any, documents: any[]) {
  const document = documents.find((item) => item.storage_path === row.receipt_storage_path);
  return {
    id: row.id,
    type: row.entry_type,
    amount: Number(row.amount || 0),
    category: row.category,
    companyName: row.company_slug,
    companyId: row.company_slug,
    teamName: row.team_slug,
    period: String(row.period_month || "").slice(0, 7),
    note: row.note || "",
    receiptPath: document ? `supabase-document:${document.id}` : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

async function paymentView(row: any) {
  if (!row) return null;
  return {
    id: row.member_id,
    bankName: row.bank_name || "",
    accountName: await decrypt(row.account_name_ciphertext),
    accountNumber: await decrypt(row.account_number_ciphertext),
    taxId: await decrypt(row.tax_id_ciphertext),
    accountLast4: row.account_last4 || "",
    taxIdLast4: row.tax_id_last4 || "",
    version: row.encryption_key_version,
    status: row.profile_status,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

async function paymentHistoryView(rows: any[]) {
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    userUid: row.member_id,
    version: row.version_no,
    bankName: row.bank_name || "",
    accountName: await decrypt(row.account_name_ciphertext),
    accountNumber: await decrypt(row.account_number_ciphertext),
    taxId: await decrypt(row.tax_id_ciphertext),
    accountLast4: row.account_last4 || "",
    taxIdLast4: row.tax_id_last4 || "",
    status: row.version_no ? "archived" : "active",
    createdAt: iso(row.created_at),
    createdBy: row.created_by,
    requestedAt: iso(row.created_at)
  })));
}

async function paymentRequestView(rows: any[]) {
  return Promise.all(rows.map(async (row) => {
    const account = (await decrypt(row.requested_account_ciphertext)).split("\\n");
    return {
      id: row.id,
      userUid: row.member_id,
      newBankName: row.requested_bank_name || "",
      newAccountName: account.shift() || "",
      newAccountNumber: account.join("\\n"),
      newTaxId: await decrypt(row.requested_tax_id_ciphertext),
      reason: row.request_reason || "",
      status: row.request_status,
      requestedAt: iso(row.created_at),
      reviewedAt: iso(row.reviewed_at),
      reviewNote: row.review_note || ""
    };
  }));
}

async function snapshot(req: Request, db: Db, claims: Claims) {
  const targetUid = new URL(req.url).searchParams.get("uid") || claims.sub;
  if (!isAdmin(claims) && targetUid !== claims.sub) throw new Error("forbidden_target");
  const member = await memberByFirebaseUid(db, targetUid);
  if (!member) {
    return { isAdmin: isAdmin(claims), member: null, applications: [], employment: [], attendance: [], payroll: [], identityDocs: [], finance: [], paymentProfile: null, paymentHistory: [], paymentRequests: [] };
  }
  const memberId = member.id;
  const [applicationsA, applicationsB, contracts, attendance, payroll, documents, payment, history, requests, finance] = await Promise.all([
    db.from("recruitment_applications").select("*").eq("firebase_uid", targetUid),
    db.from("recruitment_applications").select("*").eq("member_id", memberId),
    db.from("work_contracts").select("*").eq("member_id", memberId).order("created_at", { ascending: false }),
    db.from("attendance_entries").select("*").eq("member_id", memberId).order("work_date", { ascending: false }).limit(500),
    db.from("payroll_records").select("*").eq("member_id", memberId).order("period_month", { ascending: false }).limit(240),
    db.from("private_documents").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(200),
    db.from("payment_profiles").select("*").eq("member_id", memberId).maybeSingle(),
    db.from("payment_profile_history").select("*").eq("member_id", memberId).order("version_no", { ascending: false }).limit(100),
    db.from("payment_change_requests").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(100),
    isAdmin(claims) ? db.from("finance_entries").select("*").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null })
  ]);
  for (const result of [applicationsA, applicationsB, contracts, attendance, payroll, documents, payment, history, requests, finance]) if (result.error) throw result.error;
  const appMap = new Map<string, any>();
  for (const row of [...(applicationsA.data || []), ...(applicationsB.data || [])]) appMap.set(row.id, row);
  const contractRows = contracts.data || [];
  const docRows = documents.data || [];
  return {
    isAdmin: isAdmin(claims),
    member: mapMember(member),
    applications: [...appMap.values()].map((row) => mapApplication(row, contractRows)),
    employment: contractRows.map(mapContract),
    attendance: (attendance.data || []).map(mapAttendance),
    payroll: (payroll.data || []).map((row) => mapPayroll(row, docRows)),
    identityDocs: docRows.map(mapDocument),
    finance: (finance.data || []).map((row: any) => mapFinance(row, docRows)),
    paymentProfile: await paymentView(payment.data),
    paymentHistory: await paymentHistoryView(history.data || []),
    paymentRequests: await paymentRequestView(requests.data || [])
  };
}

async function writeAudit(db: Db, claims: Claims, memberId: string | null, action: string, result = "success", metadata: Record<string, unknown> = {}) {
  await db.from("audit_events").insert({ actor_member_id: memberId, actor_firebase_uid: claims.sub, action, resource_type: "private_workforce", result, metadata });
}

function targetUidFrom(body: Record<string, any>, claims: Claims) {
  return asText(body.targetUid || body.uid || claims.sub, 160);
}

async function uploadFile(db: Db, memberId: string, file: File, folder: string, requestedType?: string) {
  if (!(file instanceof File) || !file.size) throw new Error("missing_private_file");
  if (file.size > 20 * 1024 * 1024) throw new Error("private_file_too_large");
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) throw new Error("private_file_type_not_allowed");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document";
  const path = `members/${memberId}/${folder}/${crypto.randomUUID()}_${safeName}`;
  const result = await db.storage.from(BUCKET).upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (result.error) throw result.error;
  const row = await db.from("private_documents").insert({
    member_id: memberId,
    document_type: folder === "identity" && ["identity_card", "bank_book", "tax_document", "other"].includes(requestedType || "") ? requestedType : folder === "payroll" ? "payroll_slip" : folder === "finance" ? "receipt" : "other",
    storage_path: path,
    original_file_name: file.name.slice(0, 255),
    mime_type: file.type,
    size_bytes: file.size,
    purpose: folder === "identity" ? "workforce_identity_review" : folder === "payroll" ? "payroll_evidence" : "finance_evidence",
    notice_version: "private-workforce-v1",
    review_status: "pending"
  }).select("*").single();
  if (row.error) {
    await db.storage.from(BUCKET).remove([path]);
    throw row.error;
  }
  return row.data;
}

async function signedUrl(req: Request, db: Db, claims: Claims) {
  const id = new URL(req.url).searchParams.get("documentId") || "";
  const result = await db.from("private_documents").select("id,member_id,storage_path,review_status").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data || result.data.review_status === "deleted") throw new Error("private_document_not_found");
  const member = await memberByFirebaseUid(db, claims.sub);
  if (!isAdmin(claims) && (!member || member.id !== result.data.member_id)) throw new Error("forbidden_private_document");
  const signed = await db.storage.from(BUCKET).createSignedUrl(result.data.storage_path, 60);
  if (signed.error) throw signed.error;
  await writeAudit(db, claims, member?.id || null, "DOWNLOAD_PRIVATE_DOCUMENT");
  return json(req, { url: signed.data.signedUrl, expiresIn: 60 });
}

async function handleAction(req: Request, db: Db, claims: Claims, body: Record<string, any>, file?: File) {
  const action = asText(body.action, 80);
  const targetUid = targetUidFrom(body, claims);
  const admin = isAdmin(claims);
  const member = await targetMember(db, claims, targetUid);
  const actor = await memberByFirebaseUid(db, claims.sub);
  const memberId = member.id;
  const self = targetUid === claims.sub;
  if (["attendance.check_in", "attendance.check_out", "payment.request", "document.upload", "document.delete"].includes(action) && !self && !admin) throw new Error("forbidden_action");

  if (action === "attendance.check_in") {
    const row = await db.from("attendance_entries").upsert({ member_id: memberId, company_slug: member.company_slug, team_slug: member.team_slug, work_date: thailandDate(), check_in: now(), check_out: null, hours: 0, attendance_status: "open" }, { onConflict: "member_id,work_date", ignoreDuplicates: true }).select("*").maybeSingle();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "CHECK_IN");
    return json(req, { ok: true, attendance: row.data });
  }
  if (action === "attendance.check_out") {
    const current = await db.from("attendance_entries").select("*").eq("member_id", memberId).eq("work_date", thailandDate()).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data?.check_in) throw new Error("attendance_check_in_required");
    const hours = Math.max(0, Math.min(24, (Date.now() - Date.parse(current.data.check_in)) / 3600000));
    const row = await db.from("attendance_entries").update({ check_out: now(), hours: Number(hours.toFixed(2)), attendance_status: "closed" }).eq("id", current.data.id).select("*").single();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "CHECK_OUT");
    return json(req, { ok: true, attendance: row.data });
  }
  if (action === "attendance.update") {
    if (!admin) throw new Error("admin_required");
    const id = asText(body.id, 80);
    const checkIn = body.checkIn ? new Date(String(body.checkIn)) : null;
    const checkOut = body.checkOut ? new Date(String(body.checkOut)) : null;
    if ((checkIn && Number.isNaN(checkIn.getTime())) || (checkOut && Number.isNaN(checkOut.getTime())) || (checkIn && checkOut && checkOut < checkIn)) throw new Error("invalid_attendance_time");
    const hours = checkIn && checkOut ? Math.max(0, Math.min(24, (checkOut.getTime() - checkIn.getTime()) / 3600000)) : 0;
    const row = await db.from("attendance_entries").update({ check_in: checkIn?.toISOString() || null, check_out: checkOut?.toISOString() || null, hours: Number(hours.toFixed(2)), attendance_status: checkOut ? "closed" : "open", note: asText(body.note) }).eq("id", id).eq("member_id", memberId).select("*").single();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "UPDATE_ATTENDANCE");
    return json(req, { ok: true });
  }
  if (action === "payroll.upsert") {
    if (!admin) throw new Error("admin_required");
    const period = asText(body.period, 7);
    if (!validMonth(period)) throw new Error("invalid_payroll_period");
    const gross = Number(body.base || 0) + Number(body.bonus || 0);
    const deductions = Number(body.deductions || 0);
    if (!Number.isFinite(gross) || !Number.isFinite(deductions) || gross < 0 || deductions < 0 || gross > 100000000 || deductions > 100000000) throw new Error("invalid_payroll_amount");
    let slipPath = body.existingSlipPath ? asText(body.existingSlipPath, 300) : null;
    if (!file && body.id && !slipPath) {
      const existing = await db.from("payroll_records").select("slip_storage_path").eq("id", asText(body.id, 80)).eq("member_id", memberId).maybeSingle();
      if (existing.error) throw existing.error;
      slipPath = existing.data?.slip_storage_path || null;
    }
    if (file) slipPath = (await uploadFile(db, memberId, file, "payroll")).storage_path;
    const values = { member_id: memberId, company_slug: member.company_slug, team_slug: member.team_slug, period_month: `${period}-01`, gross_amount: gross, deductions_amount: deductions, payment_status: ["draft", "approved", "paid", "cancelled"].includes(body.status) ? body.status : "draft", slip_storage_path: slipPath, paid_at: body.status === "paid" ? now() : null, note: asText(body.note), created_by: actor?.id || null };
    const query = body.id ? db.from("payroll_records").update(values).eq("id", asText(body.id, 80)).eq("member_id", memberId) : db.from("payroll_records").insert(values);
    const row = await query.select("*").single();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "UPSERT_PAYROLL");
    return json(req, { ok: true, id: row.data.id });
  }
  if (action === "payroll.delete") {
    if (!admin) throw new Error("admin_required");
    const row = await db.from("payroll_records").delete().eq("id", asText(body.id, 80)).eq("member_id", memberId);
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "DELETE_PAYROLL");
    return json(req, { ok: true });
  }
  if (action === "document.upload") {
    const row = await uploadFile(db, memberId, file as File, "identity", asText(body.documentType, 40));
    await writeAudit(db, claims, actor?.id || null, "UPLOAD_PRIVATE_DOCUMENT");
    return json(req, { ok: true, documentId: row.id });
  }
  if (action === "document.delete") {
    const id = asText(body.id, 80);
    const existing = await db.from("private_documents").select("*").eq("id", id).eq("member_id", memberId).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) throw new Error("private_document_not_found");
    await db.storage.from(BUCKET).remove([existing.data.storage_path]);
    const row = await db.from("private_documents").update({ review_status: "deleted", deleted_at: now() }).eq("id", id);
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "DELETE_PRIVATE_DOCUMENT");
    return json(req, { ok: true });
  }
  if (action === "finance.upsert") {
    if (!admin) throw new Error("admin_required");
    const period = asText(body.period, 7);
    if (!validMonth(period)) throw new Error("invalid_finance_period");
    const amount = Number(body.amount || 0);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) throw new Error("invalid_finance_amount");
    let receiptPath = body.existingReceiptPath ? asText(body.existingReceiptPath, 300) : null;
    if (!file && body.id && !receiptPath) {
      const existing = await db.from("finance_entries").select("receipt_storage_path").eq("id", asText(body.id, 80)).maybeSingle();
      if (existing.error) throw existing.error;
      receiptPath = existing.data?.receipt_storage_path || null;
    }
    if (file) receiptPath = (await uploadFile(db, memberId, file, "finance")).storage_path;
    const values = { company_slug: asText(body.companySlug || member.company_slug, 80), team_slug: asText(body.teamSlug || member.team_slug, 80), entry_type: body.type === "expense" ? "expense" : "income", amount, period_month: `${period}-01`, category: asText(body.category, 160), receipt_storage_path: receiptPath, note: asText(body.note), recorded_by: actor?.id || null };
    if (!values.category) throw new Error("finance_category_required");
    const query = body.id ? db.from("finance_entries").update(values).eq("id", asText(body.id, 80)) : db.from("finance_entries").insert(values);
    const row = await query.select("*").single();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "UPSERT_FINANCE_ENTRY");
    return json(req, { ok: true, id: row.data.id });
  }
  if (action === "finance.delete") {
    if (!admin) throw new Error("admin_required");
    const row = await db.from("finance_entries").delete().eq("id", asText(body.id, 80));
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "DELETE_FINANCE_ENTRY");
    return json(req, { ok: true });
  }
  if (action === "payment.request") {
    const bank = asText(body.bankName, 160);
    const accountName = asText(body.accountName, 160);
    const accountNumber = asText(body.accountNumber, 80);
    const taxId = asText(body.taxId, 80);
    const reason = asText(body.reason);
    if (!bank || !accountName || !accountNumber || !reason) throw new Error("payment_request_incomplete");
    const row = await db.from("payment_change_requests").insert({ member_id: memberId, requested_bank_name: bank, requested_account_ciphertext: await encrypt(`${accountName}\\n${accountNumber}`), requested_tax_id_ciphertext: await encrypt(taxId), account_last4: accountNumber.slice(-4), tax_id_last4: taxId ? taxId.slice(-4) : null, request_reason: reason, request_status: "pending" }).select("id").single();
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "REQUEST_PAYMENT_PROFILE_CHANGE");
    return json(req, { ok: true, id: row.data.id });
  }
  if (action === "payment.review") {
    if (!admin) throw new Error("admin_required");
    const request = await db.from("payment_change_requests").select("*").eq("id", asText(body.id, 80)).eq("member_id", memberId).maybeSingle();
    if (request.error) throw request.error;
    if (!request.data || request.data.request_status !== "pending") throw new Error("payment_request_not_pending");
    const status = body.status === "approved" ? "approved" : "rejected";
    if (status === "rejected") {
      const rejected = await db.from("payment_change_requests").update({ request_status: "rejected", reviewed_by: actor?.id || null, reviewed_at: now(), review_note: asText(body.reviewNote) }).eq("id", request.data.id);
      if (rejected.error) throw rejected.error;
    } else {
      const current = await db.from("payment_profiles").select("*").eq("member_id", memberId).maybeSingle();
      if (current.error) throw current.error;
      const history = await db.from("payment_profile_history").select("version_no").eq("member_id", memberId).order("version_no", { ascending: false }).limit(1).maybeSingle();
      if (history.error) throw history.error;
      const version = Number(history.data?.version_no || 0) + 1;
      if (current.data) {
        const archived = await db.from("payment_profile_history").insert({ member_id: memberId, version_no: version, bank_name: current.data.bank_name, account_name_ciphertext: current.data.account_name_ciphertext, account_number_ciphertext: current.data.account_number_ciphertext, tax_id_ciphertext: current.data.tax_id_ciphertext, account_last4: current.data.account_last4, tax_id_last4: current.data.tax_id_last4, encryption_key_version: current.data.encryption_key_version, change_reason: "archived_before_replacement", created_by: actor?.id || null });
        if (archived.error) throw archived.error;
      }
      const encrypted = (await decrypt(request.data.requested_account_ciphertext)).split("\\n");
      const accountName = encrypted.shift() || "";
      const accountNumber = encrypted.join("\\n");
      const profile = await db.from("payment_profiles").upsert({ member_id: memberId, bank_name: request.data.requested_bank_name, account_name_ciphertext: await encrypt(accountName), account_number_ciphertext: await encrypt(accountNumber), tax_id_ciphertext: request.data.requested_tax_id_ciphertext, account_last4: request.data.account_last4, tax_id_last4: request.data.tax_id_last4, profile_status: "approved", effective_at: now() }, { onConflict: "member_id" });
      if (profile.error) throw profile.error;
      const updated = await db.from("payment_change_requests").update({ request_status: "approved", reviewed_by: actor?.id || null, reviewed_at: now(), review_note: asText(body.reviewNote) }).eq("id", request.data.id);
      if (updated.error) throw updated.error;
    }
    await writeAudit(db, claims, actor?.id || null, status === "approved" ? "APPROVE_PAYMENT_PROFILE" : "REJECT_PAYMENT_PROFILE");
    return json(req, { ok: true });
  }
  if (action === "employment.update") {
    if (!admin) throw new Error("admin_required");
    const status = ["applicant", "pending", "active", "suspended", "ended", "rejected"].includes(body.status) ? body.status : "active";
    const row = await db.from("workforce_members").update({ company_slug: asText(body.companySlug || member.company_slug, 80), team_slug: asText(body.teamSlug || member.team_slug, 80), role_name: asText(body.roleName || member.role_name, 120), employment_status: status, ended_at: ["ended", "rejected"].includes(status) ? now() : null, ended_reason: asText(body.reason) }).eq("id", memberId);
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "UPDATE_EMPLOYMENT_STATUS");
    return json(req, { ok: true });
  }
  if (action === "application.update") {
    if (!admin) throw new Error("admin_required");
    const status = ["submitted", "interview", "trial", "approved", "rejected", "withdrawn"].includes(body.status) ? body.status : "submitted";
    const row = await db.from("recruitment_applications").update({ application_status: status, decided_at: ["approved", "rejected"].includes(status) ? now() : null, decision_reason: asText(body.reason) }).eq("id", asText(body.id, 80));
    if (row.error) throw row.error;
    await writeAudit(db, claims, actor?.id || null, "UPDATE_APPLICATION_STATUS");
    return json(req, { ok: true });
  }
  throw new Error("unsupported_private_workforce_action");
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
    try {
      const claims = await authenticate(req);
      const db = await context(req);
      if (req.method === "GET") {
        const url = new URL(req.url);
        if (url.searchParams.get("action") === "signed-url") return await signedUrl(req, db, claims);
        return json(req, await snapshot(req, db, claims));
      }
      if (req.method !== "POST") return bad(req, 405, "method_not_allowed");
      const contentType = req.headers.get("content-type") || "";
      let body: Record<string, any> = {};
      let file: File | undefined;
      if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        for (const [key, value] of form.entries()) if (value instanceof File) file = value; else body[key] = value;
      } else {
        body = await req.json();
      }
      return await handleAction(req, db, claims, body, file);
    } catch (error: any) {
      const message = String(error?.message || error || "private_workforce_api_failed");
      const status = ["missing_bearer_token", "invalid_firebase_identity"].includes(message) ? 401 : ["forbidden_target", "forbidden_action", "forbidden_private_document", "admin_required"].includes(message) ? 403 : message === "workforce_member_not_found" ? 404 : 400;
      console.error("private-workforce-api", message);
      return bad(req, status, message);
    }
  }
};
