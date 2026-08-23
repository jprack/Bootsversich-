-- =============================================================================
--  Recherchelauf 1 — Erfassung aus vier Quellen
--  Absichtlich unsaubere Eingangsdaten. Alle Angaben erfunden.
-- =============================================================================

-- ---------------------------------------------------- Lauf 1: Herstellerliste
INSERT INTO lg_lauf (id, quelle_id, parameter)
VALUES ('d0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        '{"land":"AT","zielgruppe":"Z1_HANDEL"}');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000001','Z1_HANDEL','BOOTSHAENDLER',
  'Bootscenter Steinbach GmbH','AT','https://WWW.Bootscenter-Steinbach.example/haendler',
  'office@bootscenter-steinbach.example','0 76 63 / 21 40-12','4853','Steinbach',
  'Seepromenade 3','Attersee',22,'MITARBEITER','Haendlerliste, Seite 2');

-- Derselbe Betrieb, zweite Filiale: gleiche Domain, andere Anschrift.
-- Kein Dublettenfall — ein Haendler mit drei Filialen ist drei Standorte.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000001','Z1_HANDEL','BOOTSHAENDLER',
  'Bootscenter Steinbach GmbH - Filiale Nord','AT','bootscenter-steinbach.example',
  NULL,'+43 7663 21 40-40','5310','Mondsee',NULL,'Wolfgangsee',6,'MITARBEITER',
  'Haendlerliste, Seite 2');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000001','Z1_HANDEL','YACHTMAKLER',
  'Yachtvermittlung Hufnagl e.U.','AT','yachtvermittlung-hufnagl.example',
  'info@yachtvermittlung-hufnagl.example','07665/883 21','4854','Wolfgang',
  NULL,'Wolfgangsee',NULL,'UNBEKANNT','Haendlerliste, Seite 5');

-- Bereits Partner im CRM. Muss als Dublette gegen das CRM auffallen.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000001','Z2_INFRASTRUKTUR','MARINA',
  'Marina Seeblick Ges.m.b.H.','AT','http://marina-seeblick.example',
  'hafen@marina-seeblick.example','07666 12340','4863','Seewalchen',
  NULL,'Attersee',310,'LIEGEPLAETZE','Haendlerliste, Anhang');

UPDATE lg_lauf SET status='ABGESCHLOSSEN', beendet_am=now()
 WHERE id='d0000000-0000-0000-0000-000000000001';

-- ------------------------------------------------------- Lauf 2: Verbandsliste
INSERT INTO lg_lauf (id, quelle_id, parameter)
VALUES ('d0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000002',
        '{"land":"AT","zielgruppe":"Z3_GEMEINSCHAFT"}');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000002','Z3_GEMEINSCHAFT','YACHTCLUB',
  'Yacht- und Segelclub Seeblick e.V.','AT','ysc-seeblick.example',
  'obmann@ysc-seeblick.example','0 76 66 / 44 12','4863','Seewalchen',
  NULL,'Attersee',480,'MITGLIEDER','Mitgliederliste 2026');

-- Schreibvariante desselben Vereins aus einer anderen Zeile: andere Domain,
-- gleiche PLZ, sehr aehnlicher Name. Muss als Vorschlag erscheinen.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000002','Z3_GEMEINSCHAFT','YACHTCLUB',
  'Yachtclub Seeblick','AT','yachtclub-seeblick.example',
  NULL,'076 66 44 12','4863','Seewalchen',NULL,'Attersee',NULL,'UNBEKANNT',
  'Mitgliederliste 2026, Nachtrag');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000002','Z3_GEMEINSCHAFT','WASSERSPORTVEREIN',
  'Wassersportverein Donaublick','AT','wsv-donaublick.example',
  'verein@wsv-donaublick.example','01/2345678','1220','Wien',NULL,'Donau',
  55,'MITGLIEDER','Mitgliederliste 2026');

-- Gesperrt: Widerspruch nach Art. 21. Es darf gar kein Objekt entstehen.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000002','Z4_BETRIEB','WASSERSPORTSCHULE',
  'Segelschule Nordwind','AT','segelschule-nordwind.example',
  'info@segelschule-nordwind.example','07666/999','4860','Lenzing',NULL,'Attersee',
  NULL,'UNBEKANNT','Mitgliederliste 2026');

UPDATE lg_lauf SET status='ABGESCHLOSSEN', beendet_am=now()
 WHERE id='d0000000-0000-0000-0000-000000000002';

-- -------------------------------------------------------- Lauf 3: Revierfuehrer
INSERT INTO lg_lauf (id, quelle_id, parameter)
VALUES ('d0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000003',
        '{"land":"AT","zielgruppe":"Z2_INFRASTRUKTUR"}');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000003','Z2_INFRASTRUKTUR','HAFENBETREIBER',
  'Hafenbetriebe Nordufer GmbH & Co KG','AT','hafen-nordufer.example',
  'buero@hafen-nordufer.example','+43 7666 5510','4864','Attersee',NULL,'Attersee',
  520,'LIEGEPLAETZE','Revierfuehrer S. 88');

-- Gleiche Rufnummer wie der Hafenbetrieb, andere Untergruppe: gemeinsame
-- Zentrale, nicht dieselbe Organisation (Regel D8).
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000003','Z4_BETRIEB','SERVICEBETRIEB',
  'Bootsservice Nordufer','AT','bootsservice-nordufer.example',
  NULL,'+43 7666 5510','4864','Attersee',NULL,'Attersee',5,'MITARBEITER',
  'Revierfuehrer S. 88');

-- Kleiner Verein am Nebenrevier: landet planmaessig in Klasse D.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000003','Z3_GEMEINSCHAFT','WASSERSPORTVEREIN',
  'Ruderriege Donaustadt','AT',NULL,NULL,NULL,'1220','Wien',NULL,'Donau',
  18,'MITGLIEDER','Revierfuehrer S. 120');

-- Ausserhalb des Marktes: kein Mandant fuer CH.
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000003','Z2_INFRASTRUKTUR','MARINA',
  'Hafen Seestern','CH','hafen-seestern.example',NULL,'+41 71 1234567','9000',
  'St. Gallen',NULL,NULL,140,'LIEGEPLAETZE','Revierfuehrer S. 210');

UPDATE lg_lauf SET status='ABGESCHLOSSEN', beendet_am=now()
 WHERE id='d0000000-0000-0000-0000-000000000003';

-- --------------------------------------------------------------- Lauf 4: Messe
INSERT INTO lg_lauf (id, quelle_id, parameter)
VALUES ('d0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000004',
        '{"land":"AT","zielgruppe":"Z4_BETRIEB"}');

SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000004','Z4_BETRIEB','CHARTER',
  'Seewind Charter GmbH','AT','seewind-charter.example',
  'charter@seewind-charter.example','07666/7788','4861','Schoerfling',NULL,'Attersee',
  18,'FLOTTE','Ausstellerverzeichnis Halle B');

-- Zweite Quelle fuer den Hafenbetrieb: Marktsichtbarkeit steigt (B5).
SELECT * FROM lg_fn_erfassen(
  'd0000000-0000-0000-0000-000000000004','Z2_INFRASTRUKTUR','HAFENBETREIBER',
  'Hafenbetriebe Nordufer','AT','hafen-nordufer.example',NULL,NULL,'4864','Attersee',
  NULL,'Attersee',NULL,'UNBEKANNT','Ausstellerverzeichnis Halle A');

UPDATE lg_lauf SET status='ABGESCHLOSSEN', beendet_am=now()
 WHERE id='d0000000-0000-0000-0000-000000000004';

-- ----------------------------------------------------------------- Kontakte
--  Nur dort, wo ein Ansprechpartner tatsaechlich gebraucht wird (ADR-0002).
--  Der zweite Kontakt ist absichtlich 30 Tage alt und noch nicht informiert:
--  er muss die Aufgabe L-31 ausloesen.
INSERT INTO lg_kontakt (id, objekt_id, vorname, nachname, funktion, email,
                        quelle_id, belegt_am, information_versendet_am)
SELECT gen_random_uuid(), o.id, 'Nina', 'Berger', 'Geschaeftsfuehrung',
       'n.berger@bootscenter-steinbach.example',
       'c0000000-0000-0000-0000-000000000004', current_date - 3, current_date - 2
FROM lg_objekt o WHERE o.name_norm = lg_fn_norm_name('Bootscenter Steinbach GmbH')
  AND o.adresse_plz = '4853';

INSERT INTO lg_kontakt (id, objekt_id, vorname, nachname, funktion, email,
                        quelle_id, belegt_am, information_versendet_am)
SELECT gen_random_uuid(), o.id, 'Rudolf', 'Ehrenreich', 'Obmann',
       'obmann@ysc-seeblick.example',
       'c0000000-0000-0000-0000-000000000002', current_date - 30, NULL
FROM lg_objekt o WHERE o.domain_norm = 'ysc-seeblick.example';

-- ------------------------------------------------------- Bewertung und Abgleich
SELECT lg_fn_bewerten(id) FROM lg_objekt WHERE bearbeitungsstatus = 'NORMALISIERT';
SELECT lg_fn_abgleichen(id) FROM lg_objekt WHERE bearbeitungsstatus = 'BEWERTET';
