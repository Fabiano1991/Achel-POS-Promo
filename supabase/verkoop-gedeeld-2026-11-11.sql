-- Verkoop-module: gedeelde drankenhandels.
-- Eén gemeenschappelijke fiche per drankenhandel, zichtbaar en aanpasbaar voor
-- alle vertegenwoordigers, admin en commercieel directeur. Verwijderen: enkel admin.
-- Persoonlijke velden (laatste bezoek, volgende actie, verwachte HL) staan per
-- gebruiker in data->'perRep'->'<user id>'.
create table if not exists public.verkoop_gedeeld (
  id          text primary key check (char_length(id) between 1 and 80),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid() references auth.users(id) on delete set null
);
alter table public.verkoop_gedeeld enable row level security;

drop policy if exists vg_select on public.verkoop_gedeeld;
create policy vg_select on public.verkoop_gedeeld for select to authenticated
  using ((select public.has_app_role(array['vertegenwoordiger','admin','commercieel_directeur'])));
drop policy if exists vg_insert on public.verkoop_gedeeld;
create policy vg_insert on public.verkoop_gedeeld for insert to authenticated
  with check ((select public.has_app_role(array['vertegenwoordiger','admin','commercieel_directeur'])));
drop policy if exists vg_update on public.verkoop_gedeeld;
create policy vg_update on public.verkoop_gedeeld for update to authenticated
  using ((select public.has_app_role(array['vertegenwoordiger','admin','commercieel_directeur'])))
  with check ((select public.has_app_role(array['vertegenwoordiger','admin','commercieel_directeur'])));
drop policy if exists vg_delete on public.verkoop_gedeeld;
create policy vg_delete on public.verkoop_gedeeld for delete to authenticated
  using ((select public.has_app_role(array['admin'])));
revoke all on public.verkoop_gedeeld from anon;
grant select, insert, update, delete on public.verkoop_gedeeld to authenticated;

-- Inladen van gedeelde drankenhandels (bv. uit Salesforce): enkel admin.
-- Bestaande fiches worden nooit overschreven.
create or replace function public.verkoop_import_gedeeld(p_rows jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.has_app_role(array['admin']) then raise exception 'alleen admin mag gedeelde klanten inladen'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'maximaal 500 rijen per keer'; end if;
  insert into public.verkoop_gedeeld (id, data, updated_at, updated_by)
  select r->>'id', coalesce(r->'data','{}'::jsonb), now(), auth.uid()
  from jsonb_array_elements(p_rows) r where coalesce(r->>'id','') <> ''
  on conflict (id) do nothing;
  get diagnostics n = row_count; return n;
end; $$;
revoke all on function public.verkoop_import_gedeeld(jsonb) from public, anon;
grant execute on function public.verkoop_import_gedeeld(jsonb) to authenticated;
