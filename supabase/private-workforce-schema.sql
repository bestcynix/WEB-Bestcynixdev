-- BestCyniX Dev private workforce schema
--
-- This migration is intentionally separate from the public status_reports table.
-- Do not run it against production until the RLS policy has been reviewed and
-- the application has a tested rollback/export plan.
--
-- Design rules:
--   * Supabase is the canonical store for workforce, payroll and private files.
--   * Firebase/Firestore receives only explicitly aggregated, non-PII summaries.
--   * Raw identity, bank, tax and payroll-document values are never copied to
--     Firestore and are never exposed through an anonymous/public API.
--   * Firebase Auth is still the current login provider. Direct Supabase RLS
--     policies below are for a future Supabase Auth bridge; the server API must
--     verify Firebase ID tokens before using a server-side database key.

create extension if not exists pgcrypto;

create schema if not exists app;

create or replace function app.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('dev', 'ceo', 'admin'), false);
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function app.guard_attendance_update()
returns trigger
language plpgsql
as $$
begin
  if not app.is_admin() then
    if new.member_id <> old.member_id
      or new.company_slug <> old.company_slug
      or new.team_slug <> old.team_slug
      or new.work_date <> old.work_date then
      raise exception 'attendance_identity_fields_are_immutable';
    end if;
  end if;
  return new;
end;
$$;

create table if not exists public.workforce_members (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid unique references auth.users(id) on delete set null,
  firebase_uid text unique,
  display_name text not null check (char_length(display_name) between 1 and 160),
  company_slug text not null check (company_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  team_slug text not null check (team_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  role_name text not null check (char_length(role_name) between 1 and 120),
  employment_status text not null default 'active' check (employment_status in ('applicant','pending','active','suspended','ended','rejected')),
  joined_at timestamptz,
  ended_at timestamptz,
  ended_reason text check (ended_reason is null or char_length(ended_reason) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ended_at is null or ended_at >= coalesce(joined_at, created_at))
);

create table if not exists public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.workforce_members(id) on delete set null,
  firebase_uid text,
  company_slug text not null check (char_length(company_slug) between 1 and 80),
  team_slug text not null check (char_length(team_slug) between 1 and 80),
  role_name text not null check (char_length(role_name) between 1 and 120),
  application_status text not null default 'submitted' check (application_status in ('submitted','interview','trial','approved','rejected','withdrawn')),
  submitted_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  decision_reason text check (decision_reason is null or char_length(decision_reason) <= 2000),
  contract_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_contracts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  company_slug text not null check (char_length(company_slug) between 1 and 80),
  team_slug text not null check (char_length(team_slug) between 1 and 80),
  role_name text not null check (char_length(role_name) between 1 and 120),
  version text not null check (char_length(version) between 1 and 40),
  contract_status text not null default 'draft' check (contract_status in ('draft','pending_signature','signed','rejected','terminated')),
  storage_path text check (storage_path is null or storage_path ~ '^members/[0-9a-f-]{36}/contracts/'),
  signed_at timestamptz,
  terminated_at timestamptz,
  termination_reason text check (termination_reason is null or char_length(termination_reason) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.recruitment_applications
  add constraint recruitment_applications_contract_fk
  foreign key (contract_id) references public.work_contracts(id) on delete set null;

create table if not exists public.attendance_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  company_slug text not null check (char_length(company_slug) between 1 and 80),
  team_slug text not null check (char_length(team_slug) between 1 and 80),
  work_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  hours numeric(7,2) not null default 0 check (hours >= 0 and hours <= 24),
  attendance_status text not null default 'open' check (attendance_status in ('open','closed','approved','rejected')),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (member_id, work_date),
  check (check_out is null or check_in is null or check_out >= check_in)
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  company_slug text not null check (char_length(company_slug) between 1 and 80),
  team_slug text not null check (char_length(team_slug) between 1 and 80),
  period_month date not null,
  gross_amount numeric(14,2) not null default 0 check (gross_amount >= 0),
  deductions_amount numeric(14,2) not null default 0 check (deductions_amount >= 0),
  net_amount numeric(14,2) generated always as (greatest(gross_amount - deductions_amount, 0)) stored,
  payment_status text not null default 'draft' check (payment_status in ('draft','approved','paid','cancelled')),
  slip_storage_path text check (slip_storage_path is null or slip_storage_path ~ '^members/[0-9a-f-]{36}/payroll/'),
  paid_at timestamptz,
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (member_id, period_month)
);

create table if not exists public.payment_profiles (
  member_id uuid primary key references public.workforce_members(id) on delete restrict,
  bank_name text check (bank_name is null or char_length(bank_name) <= 160),
  account_name_ciphertext text,
  account_number_ciphertext text,
  tax_id_ciphertext text,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  tax_id_last4 text check (tax_id_last4 is null or tax_id_last4 ~ '^[0-9]{4}$'),
  encryption_key_version text not null default 'v1' check (char_length(encryption_key_version) <= 40),
  profile_status text not null default 'pending' check (profile_status in ('pending','approved','rejected','replaced')),
  effective_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_profile_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  version_no integer not null check (version_no > 0),
  bank_name text check (bank_name is null or char_length(bank_name) <= 160),
  account_name_ciphertext text,
  account_number_ciphertext text,
  tax_id_ciphertext text,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  tax_id_last4 text check (tax_id_last4 is null or tax_id_last4 ~ '^[0-9]{4}$'),
  encryption_key_version text not null default 'v1' check (char_length(encryption_key_version) <= 40),
  change_reason text not null check (char_length(change_reason) between 1 and 2000),
  effective_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (member_id, version_no)
);

create table if not exists public.payment_change_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  requested_bank_name text check (requested_bank_name is null or char_length(requested_bank_name) <= 160),
  requested_account_ciphertext text,
  requested_tax_id_ciphertext text,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  tax_id_last4 text check (tax_id_last4 is null or tax_id_last4 ~ '^[0-9]{4}$'),
  request_reason text not null check (char_length(request_reason) between 1 and 2000),
  request_status text not null default 'pending' check (request_status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.private_documents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.workforce_members(id) on delete restrict,
  document_type text not null check (document_type in ('identity_card','bank_book','tax_document','contract','payroll_slip','receipt','other')),
  storage_path text not null check (storage_path ~ '^members/[0-9a-f-]{36}/'),
  original_file_name text check (original_file_name is null or char_length(original_file_name) <= 255),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  purpose text not null check (char_length(purpose) between 1 and 500),
  notice_version text not null check (char_length(notice_version) between 1 and 80),
  retention_until date,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','expired','deleted')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  company_slug text not null check (char_length(company_slug) between 1 and 80),
  team_slug text not null check (char_length(team_slug) between 1 and 80),
  entry_type text not null check (entry_type in ('income','expense')),
  amount numeric(14,2) not null check (amount >= 0),
  period_month date not null,
  category text not null check (char_length(category) between 1 and 160),
  receipt_storage_path text check (receipt_storage_path is null or receipt_storage_path ~ '^companies/[a-z0-9-]{1,80}/finance/'),
  note text check (note is null or char_length(note) <= 2000),
  recorded_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_member_id uuid references public.workforce_members(id) on delete set null,
  actor_firebase_uid text,
  action text not null check (char_length(action) between 1 and 120),
  resource_type text not null check (char_length(resource_type) between 1 and 120),
  resource_id text check (resource_id is null or char_length(resource_id) <= 160),
  request_id text check (request_id is null or char_length(request_id) <= 160),
  ip_hash text check (ip_hash is null or char_length(ip_hash) <= 128),
  user_agent_hash text check (user_agent_hash is null or char_length(user_agent_hash) <= 128),
  result text not null check (result in ('success','denied','failure')),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 32768),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workforce_members_team_idx on public.workforce_members(company_slug, team_slug, employment_status);
create index if not exists applications_member_idx on public.recruitment_applications(member_id, submitted_at desc);
create index if not exists contracts_member_idx on public.work_contracts(member_id, created_at desc);
create index if not exists attendance_daily_idx on public.attendance_entries(work_date, team_slug);
create index if not exists payroll_month_idx on public.payroll_records(period_month, team_slug, payment_status);
create index if not exists documents_member_idx on public.private_documents(member_id, created_at desc);
create index if not exists finance_period_idx on public.finance_entries(period_month, company_slug, team_slug);
create index if not exists audit_created_idx on public.audit_events(created_at desc);

drop trigger if exists workforce_members_touch on public.workforce_members;
create trigger workforce_members_touch before update on public.workforce_members for each row execute function app.touch_updated_at();
drop trigger if exists applications_touch on public.recruitment_applications;
create trigger applications_touch before update on public.recruitment_applications for each row execute function app.touch_updated_at();
drop trigger if exists contracts_touch on public.work_contracts;
create trigger contracts_touch before update on public.work_contracts for each row execute function app.touch_updated_at();
drop trigger if exists attendance_touch on public.attendance_entries;
create trigger attendance_touch before update on public.attendance_entries for each row execute function app.touch_updated_at();
drop trigger if exists attendance_immutable_fields on public.attendance_entries;
create trigger attendance_immutable_fields before update on public.attendance_entries for each row execute function app.guard_attendance_update();
drop trigger if exists payroll_touch on public.payroll_records;
create trigger payroll_touch before update on public.payroll_records for each row execute function app.touch_updated_at();
drop trigger if exists payment_profiles_touch on public.payment_profiles;
create trigger payment_profiles_touch before update on public.payment_profiles for each row execute function app.touch_updated_at();
drop trigger if exists payment_requests_touch on public.payment_change_requests;
create trigger payment_requests_touch before update on public.payment_change_requests for each row execute function app.touch_updated_at();
drop trigger if exists documents_touch on public.private_documents;
create trigger documents_touch before update on public.private_documents for each row execute function app.touch_updated_at();
drop trigger if exists finance_touch on public.finance_entries;
create trigger finance_touch before update on public.finance_entries for each row execute function app.touch_updated_at();

alter table public.workforce_members enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.work_contracts enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.payroll_records enable row level security;
alter table public.payment_profiles enable row level security;
alter table public.payment_profile_history enable row level security;
alter table public.payment_change_requests enable row level security;
alter table public.private_documents enable row level security;
alter table public.finance_entries enable row level security;
alter table public.audit_events enable row level security;

-- The client-facing Supabase Auth bridge can read only its own member row.
create policy workforce_members_self_read on public.workforce_members for select to authenticated
  using (supabase_user_id = auth.uid() or app.is_admin());
create policy workforce_members_admin_write on public.workforce_members for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy applications_self_read on public.recruitment_applications for select to authenticated
  using (firebase_uid = auth.jwt() ->> 'firebase_uid' or member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy applications_admin_write on public.recruitment_applications for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy contracts_self_read on public.work_contracts for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy contracts_admin_write on public.work_contracts for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy attendance_self_read on public.attendance_entries for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy attendance_self_create on public.attendance_entries for insert to authenticated
  with check (exists (select 1 from public.workforce_members m where m.id = member_id and m.supabase_user_id = auth.uid() and m.company_slug = company_slug and m.team_slug = team_slug));
create policy attendance_self_update on public.attendance_entries for update to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()))
  with check (exists (select 1 from public.workforce_members m where m.id = member_id and m.supabase_user_id = auth.uid() and m.company_slug = company_slug and m.team_slug = team_slug));
create policy attendance_admin_write on public.attendance_entries for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

create policy payroll_self_read on public.payroll_records for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy payroll_admin_write on public.payroll_records for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- Sensitive payment/profile/document writes must go through the reviewed server API.
-- No authenticated browser client receives a direct write policy for these tables.
create policy payment_profiles_self_read on public.payment_profiles for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy payment_history_self_read on public.payment_profile_history for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy payment_requests_self_read on public.payment_change_requests for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());
create policy private_documents_self_read on public.private_documents for select to authenticated
  using (member_id in (select id from public.workforce_members where supabase_user_id = auth.uid()) or app.is_admin());

create policy finance_admin_only on public.finance_entries for all to authenticated
  using (app.is_admin()) with check (app.is_admin());
create policy audit_admin_read on public.audit_events for select to authenticated
  using (app.is_admin());

-- Immutable-by-policy tables: no UPDATE or DELETE policies are intentionally created.
-- The server can archive/replace current payment_profiles only through an explicit
-- reviewed operation that also appends payment_profile_history and audit_events.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-workforce', 'private-workforce', false, 20971520,
        array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists private_workforce_read on storage.objects;
create policy private_workforce_read on storage.objects for select to authenticated
  using (bucket_id = 'private-workforce' and (((storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] in (select id::text from public.workforce_members where supabase_user_id = auth.uid())) or app.is_admin()));
drop policy if exists private_workforce_insert on storage.objects;
create policy private_workforce_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'private-workforce' and (((storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] in (select id::text from public.workforce_members where supabase_user_id = auth.uid())) or app.is_admin()));
drop policy if exists private_workforce_delete on storage.objects;
create policy private_workforce_delete on storage.objects for delete to authenticated
  using (bucket_id = 'private-workforce' and (((storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] in (select id::text from public.workforce_members where supabase_user_id = auth.uid())) or app.is_admin()));

comment on table public.payment_profiles is 'Encrypted fields only; raw account/tax values must not be stored in plaintext.';
comment on table public.payment_profile_history is 'Append-only historical versions; never delete old bank/tax records.';
comment on table public.private_documents is 'Private object metadata; download via short-lived signed URLs after authorization.';
comment on table public.audit_events is 'Append-only audit trail for access, edits, downloads, approvals and denials.';
