-- Verkoop-module: klanten inladen (bv. uit Salesforce).
-- Een vertegenwoordiger laadt enkel voor zichzelf in; admin mag voor iedereen.
-- Bestaande rijen worden nooit overschreven (eigen aanpassingen blijven staan).
create or replace function public.verkoop_import(p_owner uuid, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if p_owner <> auth.uid() and not public.has_app_role(array['admin']) then
    raise exception 'alleen admin mag voor iemand anders inladen';
  end if;
  if not exists (select 1 from public.profiles where id = p_owner) then
    raise exception 'onbekende gebruiker';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'maximaal 500 rijen per keer';
  end if;
  insert into public.verkoop_records (owner, collectie, id, data, updated_at)
  select p_owner, r->>'collectie', r->>'id', coalesce(r->'data','{}'::jsonb), now()
  from jsonb_array_elements(p_rows) r
  where r->>'collectie' in ('klanten','instellingen') and coalesce(r->>'id','') <> ''
  on conflict (owner, collectie, id) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.verkoop_import(uuid, jsonb) from public, anon;
grant execute on function public.verkoop_import(uuid, jsonb) to authenticated;
