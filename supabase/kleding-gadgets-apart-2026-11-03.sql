-- POS/promo: "Kleding & gadgets" opgesplitst in "Kleding" en "Gadgets" (3 november 2026)

begin;

-- 1. Gadgets: sleutelhanger, pin en paraplu
update products set subcategorie = 'gadgets'
where id in (35, 36, 54);

-- 2. Taplens en Fish eye verhuizen naar Tapmateriaal
update products set subcategorie = 'tapmateriaal'
where id in (75, 76);

-- 3. Petten naar Kleding
update products set subcategorie = 'kleding', sort_order = 640
where id = 77;

-- 4. Oude T-shirt en Polo (zonder maat) wissen; vervangen door versies per maat.
--    (Testfase: er zijn geen aanvragen met deze artikelen.)
delete from products
where id in (52, 53);

-- 5. Nieuwe kledingartikelen
insert into products
  (naam, categorie, eenheid, actief, sort_order, voorraad, minimum_voorraad, voorraad_beheren, subcategorie)
values
  ('Polo heren M',    'pos', 'st', true, 500, 0, 5, true, 'kleding'),
  ('Polo heren L',    'pos', 'st', true, 510, 0, 5, true, 'kleding'),
  ('Polo heren XL',   'pos', 'st', true, 520, 0, 5, true, 'kleding'),
  ('Polo heren XXL',  'pos', 'st', true, 530, 0, 5, true, 'kleding'),
  ('T-shirt heren M', 'pos', 'st', true, 540, 0, 5, true, 'kleding'),
  ('T-shirt heren L', 'pos', 'st', true, 550, 0, 5, true, 'kleding'),
  ('T-shirt heren XL','pos', 'st', true, 560, 0, 5, true, 'kleding'),
  ('T-shirt heren XXL','pos','st', true, 570, 0, 5, true, 'kleding'),
  ('Vest M',          'pos', 'st', true, 580, 0, 5, true, 'kleding'),
  ('Vest L',          'pos', 'st', true, 590, 0, 5, true, 'kleding'),
  ('Vest XL',         'pos', 'st', true, 600, 0, 5, true, 'kleding'),
  ('Jas L',           'pos', 'st', true, 610, 0, 5, true, 'kleding'),
  ('Jas XL',          'pos', 'st', true, 620, 0, 5, true, 'kleding'),
  ('Jas XXL',         'pos', 'st', true, 630, 0, 5, true, 'kleding'),
  ('Short Achel',     'pos', 'st', true, 635, 0, 5, true, 'kleding');

-- 6. Nieuw tapmateriaal: Fish eye speciaal voor Nederland (net na de gewone Fish eye)
insert into products
  (naam, categorie, eenheid, actief, sort_order, voorraad, minimum_voorraad, voorraad_beheren, subcategorie)
values
  ('Achel Fish eye NL', 'pos', 'st', true, 425, 0, 5, true, 'tapmateriaal');

commit;
