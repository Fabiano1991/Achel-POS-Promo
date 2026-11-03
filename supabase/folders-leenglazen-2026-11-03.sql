-- POS/promo: nieuwe categorie "Folders" + leenglazen bij Glaswerk (3 november 2026)

insert into products
  (naam, categorie, eenheid, actief, sort_order, voorraad, minimum_voorraad, voorraad_beheren, subcategorie, groep_naam, bier_variant)
values
  -- Folders (losse artikelen)
  ('A4 Achel bieren',              'pos', 'st', true, 700, 0, 5, true, 'folders', null, null),
  ('A4 Achel dubbel – tripel',     'pos', 'st', true, 710, 0, 5, true, 'folders', null, null),
  ('A5 Achelse kluis',             'pos', 'st', true, 720, 0, 5, true, 'folders', null, null),
  -- Folders drieluik (groep met 4 talen)
  ('Folder drieluik Nederlands',   'pos', 'st', true, 730, 0, 5, true, 'folders', 'Folders drieluik', 'Nederlands'),
  ('Folder drieluik Frans',        'pos', 'st', true, 740, 0, 5, true, 'folders', 'Folders drieluik', 'Frans'),
  ('Folder drieluik Duits',        'pos', 'st', true, 750, 0, 5, true, 'folders', 'Folders drieluik', 'Duits'),
  ('Folder drieluik Engels',       'pos', 'st', true, 760, 0, 5, true, 'folders', 'Folders drieluik', 'Engels'),
  -- Glaswerk
  ('Leenglazen',                   'pos', 'doos', true, 45, 0, 5, true, 'glaswerk', null, null);
