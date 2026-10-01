-- Opvolging van beurscontacten (zoals B2B): volgende actie,
-- opvolgdatum, notitie en extra status "interested" (Interesse).
alter table public.fair_contacts
  add column if not exists next_action text,
  add column if not exists followup_date date,
  add column if not exists followup_note text,
  add column if not exists followup_updated_at timestamptz;
alter table public.fair_contacts drop constraint if exists fair_contacts_followup_status_check;
alter table public.fair_contacts add constraint fair_contacts_followup_status_check
  check (followup_status = any (array['to_contact','contacted','interested','tasting','customer','no_interest']));
