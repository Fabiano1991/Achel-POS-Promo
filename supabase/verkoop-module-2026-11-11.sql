-- Verkoop-module: klanten, bezoeken, bestellingen, acties, seizoensbieren en
-- instellingen per vertegenwoordiger. Elke rij hoort bij één eigenaar.
-- Vertegenwoordiger: ziet en wijzigt enkel eigen rijen.
-- Admin en commercieel directeur: zien alles (alleen lezen).
create table if not exists public.verkoop_records (
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  collectie   text not null check (collectie in ('klanten','bezoeken','bestellingen','acties','seizoensbieren','instellingen')),
  id          text not null check (char_length(id) between 1 and 80),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (owner, collectie, id)
);
alter table public.verkoop_records enable row level security;

drop policy if exists vr_select on public.verkoop_records;
create policy vr_select on public.verkoop_records
  for select to authenticated using (
    owner = (select auth.uid())
    or (select public.has_app_role(array['admin','commercieel_directeur']))
  );
drop policy if exists vr_insert on public.verkoop_records;
create policy vr_insert on public.verkoop_records
  for insert to authenticated with check (
    owner = (select auth.uid()) and (select public.current_app_role()) is not null
  );
drop policy if exists vr_update on public.verkoop_records;
create policy vr_update on public.verkoop_records
  for update to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()) and (select public.current_app_role()) is not null);
drop policy if exists vr_delete on public.verkoop_records;
create policy vr_delete on public.verkoop_records
  for delete to authenticated using (owner = (select auth.uid()));

revoke all on public.verkoop_records from anon;
grant select, insert, update, delete on public.verkoop_records to authenticated;
