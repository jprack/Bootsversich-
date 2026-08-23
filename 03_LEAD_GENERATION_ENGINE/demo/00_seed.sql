-- =============================================================================
--  03_LEAD_GENERATION_ENGINE — Demodaten
--
--  ALLE DATEN SIND ERFUNDEN. Keine realen Organisationen, keine realen
--  Personen, keine realen Kontaktdaten, keine realen Domains
--  (durchgaengig .example / .invalid, nach RFC 2606 reserviert).
--
--  Die Daten sind absichtlich unsauber: Schreibvarianten, Rechtsformen,
--  Telefonformate, Mehrfachstandorte, eine gesperrte Domain und ein Objekt
--  ausserhalb des Marktes. Ein Prueffall, der nur saubere Daten kennt,
--  prueft nichts.
-- =============================================================================

-- ---------------------------------------------------------------- Mandanten
INSERT INTO lg_mandant (id, land, bezeichnung, zulassung) VALUES
  ('a0000000-0000-0000-0000-00000000a001', 'AT', 'Oesterreich', true),
  ('a0000000-0000-0000-0000-00000000de01', 'DE', 'Deutschland', true);

-- --------------------------------------------------------------- Kanalmatrix
INSERT INTO lg_kanalmatrix (land, kanal, erlaubt, bedingung, geprueft_am) VALUES
  ('AT','POST',       true,  'Widerspruch beachten, Herkunft nennen', NULL),
  ('AT','PERSOENLICH',true,  NULL, NULL),
  ('AT','EINGEHEND',  true,  'bringt die Rechtsgrundlage mit', NULL),
  ('AT','TELEFON',    false, 'gesperrt bis L-02 geklaert ist', NULL),
  ('AT','EMAIL',      false, 'nur mit vorheriger Einwilligung (§ 174 TKG)', NULL),
  ('DE','POST',       true,  'Widerspruch beachten, Herkunft nennen', NULL),
  ('DE','PERSOENLICH',true,  NULL, NULL),
  ('DE','EINGEHEND',  true,  'bringt die Rechtsgrundlage mit', NULL),
  ('DE','TELEFON',    true,  'Sachbezug vor dem Anruf dokumentiert (§ 7 UWG)', NULL),
  ('DE','EMAIL',      false, 'nur mit vorheriger Einwilligung (§ 7 UWG)', NULL);

-- ------------------------------------------------------------------- Reviere
INSERT INTO lg_revier (id, land, name, gewicht) VALUES
  (gen_random_uuid(),'AT','Attersee',        20),
  (gen_random_uuid(),'AT','Wolfgangsee',     20),
  (gen_random_uuid(),'AT','Neusiedler See',  14),
  (gen_random_uuid(),'AT','Bodensee',        14),
  (gen_random_uuid(),'AT','Donau',            4),
  (gen_random_uuid(),'DE','Ostsee',          20),
  (gen_random_uuid(),'DE','Chiemsee',        14);

-- ----------------------------------------------------------- Grundgesamtheit
--  Schaetzung mit Datum und Quelle — nicht Konstante (Kapitel 11.1)
INSERT INTO lg_grundgesamtheit (land, zielgruppe, anzahl, erhoben_am, quelle) VALUES
  ('AT','Z1_HANDEL',          40, current_date - 20, 'Herstellerverzeichnisse + eigene Zaehlung'),
  ('AT','Z2_INFRASTRUKTUR',   55, current_date - 20, 'Revierfuehrer + Betreiberseiten'),
  ('AT','Z3_GEMEINSCHAFT',   120, current_date - 20, 'Verbandslisten'),
  ('AT','Z4_BETRIEB',         70, current_date - 20, 'Messeverzeichnis + Branchenliste'),
  ('AT','Z5_INDUSTRIE',       12, current_date - 20, 'Herstellerverzeichnisse');

-- ------------------------------------------------------------------- Quellen
INSERT INTO lg_quelle (id, bezeichnung, art, betreiber, erlaubnis, erlaubnis_beleg,
                       speicherung_erlaubt, guete, takt, aktiv) VALUES
  ('c0000000-0000-0000-0000-000000000001','Herstellerverzeichnis Werft A','HERSTELLERLISTE',
   'Werft A (fiktiv)','OEFFENTLICH',NULL,true,'HOCH','QUARTALSWEISE',true),
  ('c0000000-0000-0000-0000-000000000002','Verbandsliste Wassersport AT','VERBAND',
   'Verband (fiktiv)','OEFFENTLICH',NULL,true,'HOCH','JAEHRLICH',true),
  ('c0000000-0000-0000-0000-000000000003','Revierfuehrer Seen','VERZEICHNIS',
   'Verlag (fiktiv)','LIZENZ','DOK-2026-0007',true,'MITTEL','JAEHRLICH',true),
  ('c0000000-0000-0000-0000-000000000004','Messe Ausstellerverzeichnis','MESSE',
   'Messe (fiktiv)','OEFFENTLICH',NULL,true,'HOCH','JAEHRLICH',true),
  -- Klasse B, Bedingungen noch nicht geprueft: darf nicht laufen (L-01)
  ('c0000000-0000-0000-0000-000000000009','Kartendienst','KARTENDIENST',
   'Anbieter (fiktiv)','UNGEKLAERT',NULL,false,'MITTEL','MONATLICH',true);

-- ------------------------------------------------- Bestand im CRM (Ausgangslage)
--  Eine Organisation ist bereits Partner. Sie darf nicht erneut als kalter
--  Lead auftauchen — die wichtigste Dublettenpruefung (Kapitel 6.1, Stelle 4).
INSERT INTO crm_organisation (id, mandant_id, name, name_norm, domain_norm,
                              telefon_e164, adresse_plz, status, quelle) VALUES
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-00000000a001',
   'Marina Seeblick GmbH', lg_fn_norm_name('Marina Seeblick GmbH'),
   'marina-seeblick.example', '+43766612340', '4863', 'AKTIV', 'MANUELL');
INSERT INTO crm_organisationsrolle (id, organisation_id, rolle, portalzugang)
VALUES (gen_random_uuid(),'b0000000-0000-0000-0000-000000000001','PARTNER',true);

-- ------------------------------------------------------------- Sperrvermerke
--  Ein Widerspruch nach Art. 21 DSGVO: dauerhaft, ohne Frist.
INSERT INTO lg_sperrvermerk (id, art, schluesselart, schluessel, gueltig_bis, grund, erfasst_von)
VALUES (gen_random_uuid(),'WIDERSPRUCH','DOMAIN','segelschule-nordwind.example', NULL,
        'Widerspruch gegen Direktwerbung, schriftlich', 'innendienst');
