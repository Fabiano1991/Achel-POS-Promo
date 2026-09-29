-- Achel POS – Event-kalender zichtbaar voor alle collega's
-- Plak dit volledig in Supabase → SQL Editor → New query, en klik op "Run".

-- 1. Alle actieve gebruikers mogen event-aanvragen zien (niet enkel hun eigen).
--    Gewone aanvragen (POS, bier, ...) blijven privé zoals nu.
drop policy if exists "Iedereen ziet event-aanvragen" on public.orders;
create policy "Iedereen ziet event-aanvragen"
  on public.orders
  for select
  to authenticated
  using (event_naam is not null);

-- 2. Ook de materialen die bij een event horen zijn zichtbaar.
drop policy if exists "Iedereen ziet event-artikelen" on public.order_items;
create policy "Iedereen ziet event-artikelen"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.event_naam is not null
    )
  );

-- 3. De naam van wie het event aanvroeg tonen, zonder dat collega's
--    elkaars volledige profiel (e-mail, rol, ...) kunnen lezen.
create or replace function public.get_event_requester_names(user_ids uuid[])
returns table (id uuid, naam text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.naam::text
  from public.profiles p
  where p.id = any(user_ids)
    and public.is_active_user();
$$;

revoke all on function public.get_event_requester_names(uuid[]) from public, anon;
grant execute on function public.get_event_requester_names(uuid[]) to authenticated;
