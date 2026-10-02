-- Boekhoudkundig verwerkt (Rapporten > Te verwerken / Verwerkt)
-- Voegt per aanvraag bij wanneer en door wie ze boekhoudkundig verwerkt is.
-- Enkel toevoegingen: bestaande gegevens blijven ongewijzigd.

alter table public.orders
  add column if not exists verwerkt_at timestamptz,
  add column if not exists verwerkt_door uuid;

alter table public.wholesale_orders
  add column if not exists verwerkt_at timestamptz,
  add column if not exists verwerkt_door uuid;

alter table public.free_beer_registrations
  add column if not exists verwerkt_at timestamptz,
  add column if not exists verwerkt_door uuid;

-- Markeren / terugzetten gebeurt via deze functie, zodat de boekhoudster
-- enkel deze twee velden kan aanpassen en verder niets aan de aanvragen.
create or replace function public.zet_boekhouding_verwerkt(
  p_soort text,
  p_ids uuid[],
  p_verwerkt boolean
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_aantal integer := 0;
  v_at timestamptz := case when p_verwerkt then now() else null end;
  v_door uuid := case when p_verwerkt then auth.uid() else null end;
begin
  if not public.is_data_reader() then
    raise exception 'Geen toegang om aanvragen als verwerkt te markeren';
  end if;

  if p_soort = 'orders' then
    update public.orders
       set verwerkt_at = v_at, verwerkt_door = v_door
     where id = any(p_ids);
  elsif p_soort = 'wholesale' then
    update public.wholesale_orders
       set verwerkt_at = v_at, verwerkt_door = v_door
     where id = any(p_ids);
  elsif p_soort = 'freebeer' then
    update public.free_beer_registrations
       set verwerkt_at = v_at, verwerkt_door = v_door
     where id = any(p_ids);
  else
    raise exception 'Onbekende soort: %', p_soort;
  end if;

  get diagnostics v_aantal = row_count;
  return v_aantal;
end;
$$;

revoke all on function public.zet_boekhouding_verwerkt(text, uuid[], boolean) from public, anon;
grant execute on function public.zet_boekhouding_verwerkt(text, uuid[], boolean) to authenticated;
