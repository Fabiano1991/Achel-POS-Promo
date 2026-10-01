-- Historiek per beurscontact: notities en statuswijzigingen met datum.
create table if not exists public.fair_contact_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid(),
  contact_id  uuid not null references public.fair_contacts(id) on delete cascade,
  kind        text not null check (kind in ('note','status')),
  text        text,
  status      text
);
create index if not exists idx_fair_contact_events_contact on public.fair_contact_events (contact_id, created_at desc);
alter table public.fair_contact_events enable row level security;
drop policy if exists fce_select on public.fair_contact_events;
create policy fce_select on public.fair_contact_events
  for select using (exists (select 1 from public.fair_contacts c where c.id = contact_id));
drop policy if exists fce_insert on public.fair_contact_events;
create policy fce_insert on public.fair_contact_events
  for insert with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.fair_contacts c where c.id = contact_id)
  );
drop policy if exists fce_delete on public.fair_contact_events;
create policy fce_delete on public.fair_contact_events
  for delete using (created_by = (select auth.uid()));
