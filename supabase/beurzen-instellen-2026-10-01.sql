-- =========================================================
-- BEURZEN INSTELLEN + BEURSACTIES (01-10-2026)
-- Beheer maakt een beurs aan (naam, plaats, data) met eigen
-- acties zoals "10+2 op vaten". Vertegenwoordigers kiezen
-- daarna enkel de beurs; de acties worden automatisch berekend.
-- =========================================================

create table if not exists public.fairs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid(),
  name        text not null,
  location    text,
  start_date  date,
  end_date    date,
  active      boolean not null default true,
  -- Lijst van acties, bv.
  -- [{"id":"a1","type":"free","buy":10,"free":2,"categories":["vat20","krat24"],"label":"10+2 op vaten en bakken"},
  --  {"id":"a2","type":"text","label":"Gratis tapinstallatie bij 5 vaten"}]
  promotions  jsonb not null default '[]'::jsonb,
  note        text
);

alter table public.fairs enable row level security;

-- Iedere actieve gebruiker mag de beurzen zien (nodig om te bestellen).
drop policy if exists fairs_select on public.fairs;
create policy fairs_select on public.fairs
  for select using ((select public.current_app_role()) is not null);

-- Enkel admin en commercieel directeur mogen beurzen aanmaken/wijzigen/verwijderen.
drop policy if exists fairs_insert on public.fairs;
create policy fairs_insert on public.fairs
  for insert with check ((select public.has_app_role(array['admin','commercieel_directeur'])));

drop policy if exists fairs_update on public.fairs;
create policy fairs_update on public.fairs
  for update using ((select public.has_app_role(array['admin','commercieel_directeur'])))
  with check ((select public.has_app_role(array['admin','commercieel_directeur'])));

drop policy if exists fairs_delete on public.fairs;
create policy fairs_delete on public.fairs
  for delete using ((select public.has_app_role(array['admin','commercieel_directeur'])));

-- Bestelling onthoudt aan welke beurs ze gekoppeld is.
alter table public.fair_orders
  add column if not exists fair_id uuid references public.fairs(id) on delete set null;

create index if not exists idx_fair_orders_fair_id on public.fair_orders (fair_id);

-- Per artikel: hoeveel gratis door een beursactie, en welke actie.
alter table public.fair_order_items
  add column if not exists free_quantity integer not null default 0,
  add column if not exists promo_label  text;
