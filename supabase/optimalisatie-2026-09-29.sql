-- ============================================================
-- OPTIMALISATIE 29-09-2026
-- Al toegepast op de database. Dit bestand is enkel ter archief.
-- ============================================================

-- 1) TOEGANGSREGELS (RLS) SNELLER
--    auth.uid() en de rol-hulpfuncties werden per rij opnieuw
--    berekend. Door ze in (select ...) te zetten rekent de database
--    ze één keer per verzoek uit. Wie wat mag zien verandert NIET.
do $$
declare
  r record;
  q text;
  c text;
  fn text;
begin
  for r in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    q := r.qual;
    c := r.with_check;

    foreach fn in array array[
      'auth.uid()', 'is_active_user()', 'is_manager()',
      'is_achel_manager()', 'is_data_reader()', 'current_app_role()'
    ]
    loop
      q := replace(q, fn, '(select ' || fn || ')');
      c := replace(c, fn, '(select ' || fn || ')');
    end loop;

    q := regexp_replace(q, 'has_app_role\((ARRAY\[[^\]]*\])\)', '(select has_app_role(\1))', 'g');
    c := regexp_replace(c, 'has_app_role\((ARRAY\[[^\]]*\])\)', '(select has_app_role(\1))', 'g');

    if q is not null and q is distinct from r.qual then
      execute format('alter policy %I on public.%I using (%s)', r.policyname, r.tablename, q);
    end if;

    if c is not null and c is distinct from r.with_check then
      execute format('alter policy %I on public.%I with check (%s)', r.policyname, r.tablename, c);
    end if;
  end loop;
end
$$;

-- 2) DUBBELE INDEX WEG (twee identieke indexen op dezelfde kolom)
drop index if exists public.idx_orders_event_returned_at;

-- 3) ONTBREKENDE INDEXEN OP KOPPELINGEN
create index if not exists idx_event_delivery_proofs_created_by   on public.event_delivery_proofs (created_by);
create index if not exists idx_event_material_returns_updated_by  on public.event_material_returns (updated_by);
create index if not exists idx_expenses_representative_id         on public.expenses (representative_id);
create index if not exists idx_fair_contacts_created_by           on public.fair_contacts (created_by);
create index if not exists idx_fair_orders_created_by             on public.fair_orders (created_by);
create index if not exists idx_free_beer_registrations_user_id    on public.free_beer_registrations (user_id);
create index if not exists idx_order_status_history_changed_by    on public.order_status_history (changed_by);
create index if not exists idx_orders_event_returned_by           on public.orders (event_returned_by);
create index if not exists idx_wholesale_order_items_product_id   on public.wholesale_order_items (product_id);

-- 4) BEVEILIGING: interne functies niet meer oproepbaar zonder login
--    a) trigger-functies: worden enkel door de database zelf gebruikt
revoke execute on function public.handle_new_user()                     from public, anon, authenticated;
revoke execute on function public.handle_order_status_change()          from public, anon, authenticated;
revoke execute on function public.log_new_order()                       from public, anon, authenticated;
revoke execute on function public.log_order_status_change()             from public, anon, authenticated;
revoke execute on function public.prevent_wholesale_proof_change()      from public, anon, authenticated;
revoke execute on function public.queue_new_order_admin_notification()  from public, anon, authenticated;
revoke execute on function public.queue_order_ready_notification()      from public, anon, authenticated;
revoke execute on function public.send_achel_push_from_queue()          from public, anon, authenticated;

--    b) functies die de app gebruikt: enkel voor ingelogde gebruikers
revoke execute on function public.create_signed_wholesale_order(text, text, text, jsonb, text, text, jsonb, text) from public, anon;
revoke execute on function public.current_app_role()                    from public, anon;
revoke execute on function public.get_event_available_stock(date, date) from public, anon;
revoke execute on function public.get_event_requester_names(uuid[])     from public, anon;
revoke execute on function public.has_app_role(text[])                  from public, anon;
revoke execute on function public.is_achel_manager()                    from public, anon;
revoke execute on function public.is_active_user()                      from public, anon;
revoke execute on function public.is_data_reader()                      from public, anon;
revoke execute on function public.is_manager()                          from public, anon;

grant execute on function public.create_signed_wholesale_order(text, text, text, jsonb, text, text, jsonb, text) to authenticated, service_role;
grant execute on function public.current_app_role()                    to authenticated, service_role;
grant execute on function public.get_event_available_stock(date, date) to authenticated, service_role;
grant execute on function public.get_event_requester_names(uuid[])     to authenticated, service_role;
grant execute on function public.has_app_role(text[])                  to authenticated, service_role;
grant execute on function public.is_achel_manager()                    to authenticated, service_role;
grant execute on function public.is_active_user()                      to authenticated, service_role;
grant execute on function public.is_data_reader()                      to authenticated, service_role;
grant execute on function public.is_manager()                          to authenticated, service_role;

-- 5) Kleine veiligheidsfix
alter function public.touch_order_updated_at() set search_path = public;
