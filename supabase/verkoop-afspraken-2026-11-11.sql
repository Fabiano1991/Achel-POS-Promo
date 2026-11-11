-- Verkoop-module: agenda. Afspraken worden bewaard als collectie 'afspraken'.
alter table public.verkoop_records drop constraint if exists verkoop_records_collectie_check;
alter table public.verkoop_records add constraint verkoop_records_collectie_check
  check (collectie in ('klanten','bezoeken','bestellingen','acties','seizoensbieren','instellingen','afspraken'));
