-- =============================================================================
--  03_LEAD_GENERATION_ENGINE — Testsuite
--
--  Prueft die Zusicherungen des Fachkonzepts gegen die laufende Engine.
--  Jede Zeile nennt Erwartung und Ist. Ein "FEHLGESCHLAGEN" ist ein Befund,
--  kein Hinweis.
-- =============================================================================
\set ON_ERROR_STOP on

CREATE TEMP TABLE pruefung (
  nr text, bereich text, pruefung text, erwartet text, ist text, status text
);

CREATE OR REPLACE FUNCTION pg_temp.pruefe(
  p_nr text, p_bereich text, p_text text, p_erwartet text, p_ist text
) RETURNS void LANGUAGE sql AS $$
  INSERT INTO pruefung VALUES (p_nr, p_bereich, p_text, p_erwartet, p_ist,
    CASE WHEN p_erwartet = p_ist THEN 'BESTANDEN' ELSE 'FEHLGESCHLAGEN' END);
$$;

-- Zwischenergebnisse unterdruecken; ausgegeben wird nur die Tabelle am Ende.
\o /dev/null

-- =============================================================================
--  A. Normalisierung  (Kapitel 6.2)
-- =============================================================================
SELECT pg_temp.pruefe('T01','Normalisierung',
  'Rechtsform wird aus dem Namen entfernt',
  'bootscenter steinbach', lg_fn_norm_name('Bootscenter Steinbach GmbH'));

SELECT pg_temp.pruefe('T02','Normalisierung',
  'Verein, Bindestrich und Fuellwort werden entfernt',
  'yacht segelclub seeblick', lg_fn_norm_name('Yacht- und Segelclub Seeblick e.V.'));

SELECT pg_temp.pruefe('T03','Normalisierung',
  'Domain wird auf die registrierbare Form gekuerzt',
  'bootscenter-steinbach.example',
  lg_fn_norm_domain('https://WWW.Bootscenter-Steinbach.example/haendler'));

SELECT pg_temp.pruefe('T04','Normalisierung',
  'Telefon wird nach E.164 gebracht, Durchwahl abgetrennt',
  '+4376632140', lg_fn_norm_telefon('0 76 63 / 21 40-12','AT'));

SELECT pg_temp.pruefe('T05','Normalisierung',
  'Zwei Schreibweisen derselben Nummer ergeben denselben Wert',
  'gleich',
  CASE WHEN lg_fn_norm_telefon('0 76 66 / 44 12','AT')
          = lg_fn_norm_telefon('076 66 44 12','AT') THEN 'gleich' ELSE 'verschieden' END);

-- =============================================================================
--  B. Sperrvermerke  (Kapitel 6.1, Stelle 1)
-- =============================================================================
SELECT pg_temp.pruefe('T06','Sperre',
  'Gesperrte Domain erzeugt gar kein Objekt',
  '0', (SELECT count(*)::text FROM lg_objekt
         WHERE domain_norm = 'segelschule-nordwind.example'));

SELECT pg_temp.pruefe('T07','Sperre',
  'Der gesperrte Treffer ist im Lauf gezaehlt, nicht verschwiegen',
  '1', (SELECT sum(anzahl_gesperrt)::text FROM lg_lauf));

SELECT pg_temp.pruefe('T08','Sperre',
  'Ein Widerspruch traegt keine Frist (Art. 21 DSGVO)',
  '0', (SELECT count(*)::text FROM lg_sperrvermerk
         WHERE art = 'WIDERSPRUCH' AND gueltig_bis IS NOT NULL));

-- =============================================================================
--  C. Erfassung und Marktgrenze
-- =============================================================================
SELECT pg_temp.pruefe('T09','Erfassung',
  'Land ohne Mandant erzeugt kein Objekt',
  '0', (SELECT count(*)::text FROM lg_objekt WHERE land = 'CH'));

SELECT pg_temp.pruefe('T10','Erfassung',
  'Quelle mit ungeklaerter Erlaubnis ist nicht ausfuehrbar',
  'abgewiesen',
  (SELECT CASE WHEN count(*) = 0 THEN 'abgewiesen' ELSE 'ausgefuehrt' END
     FROM lg_lauf l JOIN lg_quelle q ON q.id = l.quelle_id
    WHERE q.erlaubnis = 'UNGEKLAERT'));

SELECT pg_temp.pruefe('T11','Erfassung',
  'Jedes Feld eines Objekts traegt einen Beleg',
  '0',
  (SELECT count(*)::text FROM lg_objekt o
    WHERE o.email IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM lg_beleg b
                       WHERE b.objekt_id = o.id AND b.feldname = 'email')));

-- =============================================================================
--  D. Dubletten  (Kapitel 6)
-- =============================================================================
SELECT pg_temp.pruefe('T12','Dubletten',
  'Bereits im CRM gefuehrte Organisation wird erkannt (D1)',
  'ja',
  (SELECT CASE WHEN count(*) > 0 THEN 'ja' ELSE 'nein' END
     FROM lg_abgleich a JOIN lg_objekt o ON o.id = a.objekt_id
    WHERE a.ziel_typ = 'ORGANISATION' AND a.kennzahl >= 0.90
      AND o.domain_norm = 'marina-seeblick.example'));

SELECT pg_temp.pruefe('T13','Dubletten',
  'Schreibvariante desselben Vereins wird vorgeschlagen',
  'ja',
  (SELECT CASE WHEN count(*) > 0 THEN 'ja' ELSE 'nein' END
     FROM lg_abgleich a JOIN lg_objekt o ON o.id = a.objekt_id
    WHERE o.domain_norm = 'yachtclub-seeblick.example'
      AND a.ziel_typ = 'RECHERCHEOBJEKT' AND a.kennzahl >= 0.50));

SELECT pg_temp.pruefe('T14','Dubletten',
  'Zweite Filiale unter derselben Domain bleibt ein eigenes Objekt',
  '2', (SELECT count(*)::text FROM lg_objekt
         WHERE domain_norm = 'bootscenter-steinbach.example'));

SELECT pg_temp.pruefe('T15','Dubletten',
  'Gleiche Rufnummer bei anderer Untergruppe erzeugt keinen Vorschlag (D8)',
  '0',
  (SELECT count(*)::text FROM lg_abgleich a
     JOIN lg_objekt o1 ON o1.id = a.objekt_id
     JOIN lg_objekt o2 ON o2.id = a.ziel_id
    WHERE a.ziel_typ = 'RECHERCHEOBJEKT'
      AND o1.telefon_e164 = o2.telefon_e164
      AND o1.untergruppe <> o2.untergruppe));

SELECT pg_temp.pruefe('T16','Dubletten',
  'Kein Abgleich fuehrt automatisch zusammen',
  '0', (SELECT count(*)::text FROM lg_abgleich
         WHERE entscheidung <> 'OFFEN' AND entschieden_von IS NULL));

-- =============================================================================
--  E. Bewertung  (Kapitel 5, ADR-0005)
-- =============================================================================
SELECT pg_temp.pruefe('T17','Bewertung',
  'Kein Basiswert ohne Herleitung',
  '0', (SELECT count(*)::text FROM lg_objekt
         WHERE basiswert IS NOT NULL AND score_herleitung IS NULL));

SELECT pg_temp.pruefe('T18','Bewertung',
  'Die Herleitung nennt alle fuenf Posten',
  '0',
  (SELECT count(*)::text FROM lg_objekt
    WHERE basiswert IS NOT NULL
      AND jsonb_array_length(score_herleitung->'posten') <> 5));

SELECT pg_temp.pruefe('T19','Bewertung',
  'Die Summe der Posten ergibt den Basiswert',
  '0',
  (SELECT count(*)::text FROM lg_objekt o
    WHERE o.basiswert IS NOT NULL
      AND o.basiswert <> (SELECT sum((p->>'punkte')::int)
                            FROM jsonb_array_elements(o.score_herleitung->'posten') p)));

SELECT pg_temp.pruefe('T20','Bewertung',
  'Objekt ohne Groessenangabe erreicht hoechstens 75',
  '0', (SELECT count(*)::text FROM lg_objekt
         WHERE groesse_indikator IS NULL AND basiswert > 75));

SELECT pg_temp.pruefe('T21','Bewertung',
  'Unbekannte Groesse ergibt 0 Punkte, nicht den Mittelwert',
  '0',
  (SELECT count(*)::text FROM lg_objekt o
    WHERE o.groesse_indikator IS NULL AND o.basiswert IS NOT NULL
      AND (SELECT (p->>'punkte')::int FROM jsonb_array_elements(o.score_herleitung->'posten') p
            WHERE p->>'code' = 'B2') <> 0));

SELECT pg_temp.pruefe('T22','Bewertung',
  'Kein Potenzialwert ohne Gespraech',
  '0', (SELECT count(*)::text FROM lg_objekt WHERE potenzialwert IS NOT NULL));

SELECT pg_temp.pruefe('T23','Bewertung',
  'Basiswert liegt in [0,100]',
  '0', (SELECT count(*)::text FROM lg_objekt
         WHERE basiswert IS NOT NULL AND (basiswert < 0 OR basiswert > 100)));

-- =============================================================================
--  F. Freigabe  (Kapitel 7.2)
-- =============================================================================

-- Freigabe bei offenem Dublettenvorschlag >= 0,80 muss scheitern
SELECT pg_temp.pruefe('T24','Freigabe',
  'Offener Dublettenvorschlag verhindert die Freigabe',
  'ABGEWIESEN',
  (SELECT ergebnis FROM lg_fn_freigeben(
     (SELECT id FROM lg_objekt WHERE domain_norm = 'marina-seeblick.example'),
     'PARTNER','pruefstand')));

-- ---------------------------------------------------------------------------
--  Der Mensch entscheidet die Vorschlaege. Drei Faelle, drei Ergebnisse:
--
--  (1) Zwei Filialen unter derselben Zentrale        -> IST_ANDERE, beide bleiben
--  (2) Zwei Schreibweisen desselben Vereins          -> IST_DIESELBE, eine faellt weg
--  (3) Bereits Partner im CRM                        -> IST_DIESELBE, kein Neuzugang
--
--  Erst danach ist die Freigabe moeglich — genau so ist es gedacht.
-- ---------------------------------------------------------------------------

-- (1) Filialen: gleiche Rufnummer der Zentrale, verschiedene Standorte
UPDATE lg_abgleich a SET entscheidung = 'IST_ANDERE',
       entschieden_von = 'pruefstand', entschieden_am = now()
 WHERE EXISTS (SELECT 1 FROM lg_objekt o WHERE o.id = a.objekt_id
                 AND o.domain_norm = 'bootscenter-steinbach.example')
   AND a.ziel_typ = 'RECHERCHEOBJEKT';

-- (2) Zwei Schreibweisen desselben Vereins: die zweite wird verworfen
UPDATE lg_abgleich a SET entscheidung = 'IST_DIESELBE',
       entschieden_von = 'pruefstand', entschieden_am = now()
 WHERE EXISTS (SELECT 1 FROM lg_objekt o WHERE o.id = a.objekt_id
                 AND o.domain_norm IN ('ysc-seeblick.example','yachtclub-seeblick.example'))
   AND a.ziel_typ = 'RECHERCHEOBJEKT';

SELECT lg_fn_verwerfen(
  (SELECT id FROM lg_objekt WHERE domain_norm = 'yachtclub-seeblick.example'),
  'DUBLETTE','pruefstand');

-- (3) Die Marina ist bereits Partner: kein Neuzugang, sondern eine Dublette
UPDATE lg_abgleich a SET entscheidung = 'IST_DIESELBE',
       entschieden_von = 'pruefstand', entschieden_am = now()
 WHERE EXISTS (SELECT 1 FROM lg_objekt o WHERE o.id = a.objekt_id
                 AND o.domain_norm = 'marina-seeblick.example');

SELECT lg_fn_verwerfen(
  (SELECT id FROM lg_objekt WHERE domain_norm = 'marina-seeblick.example'),
  'DUBLETTE','pruefstand');

SELECT pg_temp.pruefe('T24b','Freigabe',
  'Nach der Entscheidung ist die Freigabe moeglich',
  'FREIGEGEBEN',
  (SELECT ergebnis FROM lg_fn_freigeben(
     (SELECT id FROM lg_objekt WHERE domain_norm = 'bootscenter-steinbach.example'
                                 AND adresse_plz = '4853'),
     'HAENDLER','pruefstand')));

-- Freigabe eines gesperrten Objekts: Sperre nachtraeglich setzen und pruefen
INSERT INTO lg_sperrvermerk (id, art, schluesselart, schluessel, gueltig_bis, grund, erfasst_von)
VALUES (gen_random_uuid(),'KEIN_INTERESSE','DOMAIN','wsv-donaublick.example',
        current_date + 730, 'Absage 2026', 'pruefstand');

SELECT pg_temp.pruefe('T25','Freigabe',
  'Aktiver Sperrvermerk verhindert die Freigabe',
  'ABGEWIESEN',
  (SELECT ergebnis FROM lg_fn_freigeben(
     (SELECT id FROM lg_objekt WHERE domain_norm = 'wsv-donaublick.example'),
     'CLUB','pruefstand')));

SELECT pg_temp.pruefe('T26','Freigabe',
  'Unzulaessige Rolle wird abgewiesen',
  'ABGEWIESEN',
  (SELECT ergebnis FROM lg_fn_freigeben(
     (SELECT id FROM lg_objekt WHERE domain_norm = 'seewind-charter.example'),
     'MAKLER','pruefstand')));

-- Die regulaeren Freigaben
SELECT lg_fn_freigeben(o.id,
         CASE WHEN o.zielgruppe = 'Z1_HANDEL' THEN 'HAENDLER'
              WHEN o.zielgruppe = 'Z3_GEMEINSCHAFT' THEN 'CLUB'
              WHEN o.zielgruppe = 'Z5_INDUSTRIE' THEN 'HERSTELLER'
              ELSE 'PARTNER' END,
         'pruefstand')
FROM lg_objekt o
WHERE o.bearbeitungsstatus = 'BEWERTET'
  AND o.domain_norm IS DISTINCT FROM 'wsv-donaublick.example';   -- gesperrt

SELECT pg_temp.pruefe('T27','Freigabe',
  'Jede Freigabe erzeugt genau eine Organisation',
  'gleich',
  (SELECT CASE WHEN count(*) FILTER (WHERE bearbeitungsstatus = 'FREIGEGEBEN')
                  = (SELECT count(*) FROM crm_organisation WHERE quelle = 'RECHERCHE')
               THEN 'gleich' ELSE 'verschieden' END FROM lg_objekt));

SELECT pg_temp.pruefe('T28','Freigabe',
  'Jede uebernommene Organisation traegt genau eine Rolle',
  '0',
  (SELECT count(*)::text FROM crm_organisation c
    WHERE c.quelle = 'RECHERCHE'
      AND (SELECT count(*) FROM crm_organisationsrolle r
            WHERE r.organisation_id = c.id) <> 1));

SELECT pg_temp.pruefe('T29','Freigabe',
  'Die Belegkette bleibt ueber die Objektnummer erreichbar',
  '0', (SELECT count(*)::text FROM crm_organisation
         WHERE quelle = 'RECHERCHE' AND objektnummer IS NULL));

-- =============================================================================
--  G. Aufgaben  (Kapitel 9)
-- =============================================================================
SELECT pg_temp.pruefe('T30','Aufgaben',
  'Jede Freigabe der Klassen A bis C erzeugt hoechstens eine Aufgabe',
  '0',
  (SELECT count(*)::text FROM lg_objekt o
    WHERE o.bearbeitungsstatus = 'FREIGEGEBEN'
      AND (SELECT count(*) FROM lg_aufgabe a
            WHERE a.objekt_id = o.id AND a.regel_code IN
                  ('L-01','L-02','L-03','L-04','L-05','L-06','L-07','L-08')) > 1));

SELECT pg_temp.pruefe('T31','Aufgaben',
  'Klasse D erzeugt keine Aufgabe und bleibt trotzdem gespeichert',
  'ja',
  (SELECT CASE WHEN count(*) FILTER (WHERE lg_fn_klasse(o.basiswert) = 'D') > 0
                AND count(*) FILTER (WHERE lg_fn_klasse(o.basiswert) = 'D'
                     AND EXISTS (SELECT 1 FROM lg_aufgabe a WHERE a.objekt_id = o.id
                                  AND a.regel_code LIKE 'L-0%')) = 0
               THEN 'ja' ELSE 'nein' END
     FROM lg_objekt o WHERE o.bearbeitungsstatus = 'FREIGEGEBEN'));

SELECT pg_temp.pruefe('T32','Aufgaben',
  'Der freigegebene Haendler erhaelt die Haendlerregel L-04',
  'L-04',
  (SELECT a.regel_code FROM lg_aufgabe a JOIN lg_objekt o ON o.id = a.objekt_id
    WHERE o.untergruppe = 'BOOTSHAENDLER' AND o.adresse_plz = '4853'
    LIMIT 1));

SELECT pg_temp.pruefe('T33','Aufgaben',
  'Keine doppelten Aufgaben zum selben Sachverhalt',
  '0',
  (SELECT count(*)::text FROM (
     SELECT dublettenschluessel FROM lg_aufgabe
      GROUP BY dublettenschluessel HAVING count(*) > 1) x));

-- =============================================================================
--  H. Nachtlauf und Lastschutz  (Kapitel 9.4, ADR-0006)
-- =============================================================================
CREATE TEMP TABLE nachtlauf AS SELECT * FROM lg_fn_nachtlauf('vertrieb');

SELECT pg_temp.pruefe('T34','Rechtspflicht',
  'Kontakt ohne Information nach 21 Tagen erzeugt die Aufgabe L-31',
  'ja',
  (SELECT CASE WHEN count(*) > 0 THEN 'ja' ELSE 'nein' END
     FROM lg_aufgabe WHERE regel_code = 'L-31'));

SELECT pg_temp.pruefe('T35','Rechtspflicht',
  'Ein bereits informierter Kontakt erzeugt keine Aufgabe',
  '1', (SELECT count(*)::text FROM lg_aufgabe WHERE regel_code = 'L-31'));

SELECT pg_temp.pruefe('T36','Lastschutz',
  'Hoechstens 15 Akquiseaufgaben je Tag, oder Staffelung greift',
  'eingehalten',
  (SELECT CASE WHEN count(*) FILTER (WHERE regel_code <> 'L-31') <= 15
               THEN 'eingehalten' ELSE 'ueberschritten' END
     FROM lg_aufgabe WHERE faellig_am = current_date AND erledigt_am IS NULL));

SELECT pg_temp.pruefe('T37','Lastschutz',
  'Die Rechtspflicht L-31 wird nicht gestaffelt',
  '0', (SELECT count(*)::text FROM nachtlauf
         WHERE regel = 'L-31' AND unterdrueckt > 0));

-- Zweiter Nachtlauf: darf nichts Neues erzeugen
CREATE TEMP TABLE nachtlauf2 AS SELECT * FROM lg_fn_nachtlauf('vertrieb');

SELECT pg_temp.pruefe('T38','Lastschutz',
  'Ein zweiter Nachtlauf erzeugt keine einzige zusaetzliche Aufgabe',
  '0', (SELECT coalesce(sum(erzeugt),0)::text FROM nachtlauf2));

-- =============================================================================
--  I. Der beste Gesamttest  (Kapitel 14.2, Abnahmepunkt 7)
-- =============================================================================
INSERT INTO lg_lauf (id, quelle_id, parameter)
VALUES ('d0000000-0000-0000-0000-00000000000f',
        'c0000000-0000-0000-0000-000000000002', '{"wiederholung":true}');

-- Derselbe Ausschnitt derselben Quelle, ein zweites Mal
SELECT lg_fn_erfassen('d0000000-0000-0000-0000-00000000000f','Z3_GEMEINSCHAFT','YACHTCLUB',
  'Yacht- und Segelclub Seeblick e.V.','AT','ysc-seeblick.example',
  'obmann@ysc-seeblick.example','0 76 66 / 44 12','4863','Seewalchen',NULL,'Attersee',
  480,'MITGLIEDER','Mitgliederliste 2026');
SELECT lg_fn_erfassen('d0000000-0000-0000-0000-00000000000f','Z3_GEMEINSCHAFT','WASSERSPORTVEREIN',
  'Wassersportverein Donaublick','AT','wsv-donaublick.example',
  'verein@wsv-donaublick.example','01/2345678','1220','Wien',NULL,'Donau',
  55,'MITGLIEDER','Mitgliederliste 2026');
SELECT lg_fn_erfassen('d0000000-0000-0000-0000-00000000000f','Z4_BETRIEB','WASSERSPORTSCHULE',
  'Segelschule Nordwind','AT','segelschule-nordwind.example',
  'info@segelschule-nordwind.example','07666/999','4860','Lenzing',NULL,'Attersee',
  NULL,'UNBEKANNT','Mitgliederliste 2026');

SELECT pg_temp.pruefe('T39','Wiederholung',
  'Ein zweiter Lauf derselben Quelle erzeugt kein neues Objekt',
  '0', (SELECT anzahl_neu::text FROM lg_lauf
         WHERE id = 'd0000000-0000-0000-0000-00000000000f'));

SELECT pg_temp.pruefe('T40','Wiederholung',
  'Der wiederholte Lauf erkennt das bekannte Objekt wieder',
  '1', (SELECT anzahl_dublette::text FROM lg_lauf
         WHERE id = 'd0000000-0000-0000-0000-00000000000f'));

-- Zwischen den beiden Laeufen ist eine Absage eingegangen (T25). Der Rueckfluss
-- verhindert die Wiedererfassung — ohne ihn schlaegt das System dasselbe Ziel
-- in sechs Monaten erneut vor, und der Vertrieb ruft ein zweites Mal an.
SELECT pg_temp.pruefe('T41','Wiederholung',
  'Zwischenzeitliche Ablehnung und Widerspruch verhindern die Wiedererfassung',
  '2', (SELECT anzahl_gesperrt::text FROM lg_lauf
         WHERE id = 'd0000000-0000-0000-0000-00000000000f'));

-- =============================================================================
--  J. Recht und Marketing  (Kapitel 10, 13)
-- =============================================================================
SELECT pg_temp.pruefe('T42','Marketing',
  'Kein aus der Recherche uebernommener Kontakt ist marketingfrei',
  '0', (SELECT count(*)::text FROM crm_kontakt WHERE marketing_frei));

SELECT pg_temp.pruefe('T43','Marketing',
  'Uebernommene Kontakte tragen berechtigtes Interesse, nicht Einwilligung',
  '0', (SELECT count(*)::text FROM crm_kontakt
         WHERE rechtsgrundlage = 'EINWILLIGUNG'));

SELECT pg_temp.pruefe('T44','Kanalmatrix',
  'Werbe-E-Mail ist in beiden Mandanten gesperrt',
  '0', (SELECT count(*)::text FROM lg_kanalmatrix WHERE kanal = 'EMAIL' AND erlaubt));

SELECT pg_temp.pruefe('T45','Kanalmatrix',
  'Telefon ist in AT gesperrt, in DE erlaubt',
  'AT=false DE=true',
  (SELECT 'AT=' || (SELECT erlaubt FROM lg_kanalmatrix WHERE land='AT' AND kanal='TELEFON')::text
       || ' DE=' || (SELECT erlaubt FROM lg_kanalmatrix WHERE land='DE' AND kanal='TELEFON')::text));

-- =============================================================================
--  K. Mandantentrennung und Kennzahlen
-- =============================================================================
SELECT pg_temp.pruefe('T46','Mandant',
  'Jedes Objekt haengt am Mandanten seines Landes',
  '0',
  (SELECT count(*)::text FROM lg_objekt o JOIN lg_mandant m ON m.id = o.mandant_id
    WHERE m.land <> o.land));

SELECT pg_temp.pruefe('T47','Kennzahl',
  'Der Nenner des Abdeckungsgrads traegt Datum und Quelle',
  '0', (SELECT count(*)::text FROM lg_grundgesamtheit
         WHERE quelle IS NULL OR erhoben_am IS NULL));

SELECT pg_temp.pruefe('T48','Kennzahl',
  'Verworfene Objekte zaehlen zur Abdeckung — beurteilt, nicht bearbeitet',
  'ja',
  (SELECT CASE WHEN (SELECT beurteilt FROM vw_lg_abdeckung
                      WHERE land='AT' AND zielgruppe='Z3_GEMEINSCHAFT')
                  >= (SELECT count(*) FROM lg_objekt
                       WHERE land='AT' AND zielgruppe='Z3_GEMEINSCHAFT'
                         AND bearbeitungsstatus IN ('FREIGEGEBEN','VERWORFEN','BEWERTET'))
               THEN 'ja' ELSE 'nein' END));

SELECT pg_temp.pruefe('T49','Protokoll',
  'Jede Freigabe ist protokolliert',
  '0',
  (SELECT count(*)::text FROM lg_objekt o
    WHERE o.bearbeitungsstatus = 'FREIGEGEBEN'
      AND NOT EXISTS (SELECT 1 FROM lg_protokoll p
                       WHERE p.objekt_id = o.id
                         AND p.ereignis = 'research.object.released')));

-- =============================================================================
--  Ergebnis
-- =============================================================================
\o

SELECT nr, bereich, pruefung, erwartet, ist, status FROM pruefung ORDER BY nr;

SELECT count(*) FILTER (WHERE status = 'BESTANDEN')::text || ' von ' ||
       count(*)::text || ' Pruefungen bestanden' AS gesamtergebnis
FROM pruefung;

SELECT nr, pruefung, erwartet, ist FROM pruefung WHERE status = 'FEHLGESCHLAGEN' ORDER BY nr;
