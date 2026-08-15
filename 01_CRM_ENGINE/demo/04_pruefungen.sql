-- =============================================================================
--  01_CRM_ENGINE — Testsuite
--  Prüft die fachlichen Versprechen des Moduls gegen den tatsächlichen Zustand
--  der Datenbank nach einem Engine-Lauf. Jede Zeile ist BESTANDEN oder FEHLER.
-- =============================================================================
\set M '''11111111-0000-0000-0000-000000000001'''

CREATE OR REPLACE FUNCTION crm_fn_negativtest(p_sql text, p_erwarteter_fehler text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE p_sql;
    EXCEPTION WHEN OTHERS THEN
        RETURN position(lower(p_erwarteter_fehler) IN lower(SQLERRM)) > 0;
    END;
    RETURN false;   -- kein Fehler = Regel greift nicht
END;
$$;

SET client_min_messages = warning;
DROP TABLE IF EXISTS demo_testergebnis;
CREATE TEMP TABLE demo_testergebnis (nr text, bereich text, pruefung text, erwartet text, ist text, status text);

DO $$
DECLARE ist text; ok boolean;
BEGIN
-- ---------- Gruppe 1: Datenbank erzwingt die fachlichen Grundsätze ----------
ok := crm_fn_negativtest(
  $q$INSERT INTO crm_aktivitaet (mandant_id,typ,kontakt_id,betreff,benutzer_id,ergebnis,folgeaktion)
     VALUES ('11111111-0000-0000-0000-000000000001','anruf','30000000-0000-0000-0000-000000000021',
             'Test','22222222-0000-0000-0000-000000000001','erreicht_positiv','anruf')$q$,
  'crm_akt_folgeaktion_datum');
INSERT INTO demo_testergebnis VALUES ('T01','Constraint','Folgeaktion ohne Datum wird abgewiesen','Ablehnung',
  CASE WHEN ok THEN 'abgewiesen' ELSE 'DURCHGELASSEN' END, CASE WHEN ok THEN 'BESTANDEN' ELSE 'FEHLER' END);

ok := crm_fn_negativtest(
  $q$UPDATE crm_lead SET status='disqualifiziert' WHERE leadnummer='L-2026-004711'$q$,
  'crm_lead_disq_grund');
INSERT INTO demo_testergebnis VALUES ('T02','Constraint','Disqualifikation ohne Grund wird abgewiesen','Ablehnung',
  CASE WHEN ok THEN 'abgewiesen' ELSE 'DURCHGELASSEN' END, CASE WHEN ok THEN 'BESTANDEN' ELSE 'FEHLER' END);

ok := crm_fn_negativtest(
  $q$UPDATE crm_opportunity SET pipeline_stufe='verloren' WHERE opportunity_nummer='O-2026-0331'$q$,
  'crm_opp_verlustgrund');
INSERT INTO demo_testergebnis VALUES ('T03','Constraint','Verlust ohne Verlustgrund wird abgewiesen','Ablehnung',
  CASE WHEN ok THEN 'abgewiesen' ELSE 'DURCHGELASSEN' END, CASE WHEN ok THEN 'BESTANDEN' ELSE 'FEHLER' END);

ok := crm_fn_negativtest(
  $q$UPDATE crm_aufgabe SET status='erledigt' WHERE id=(SELECT id FROM crm_aufgabe WHERE status='offen' LIMIT 1)$q$,
  'crm_aufgabe_abschluss');
INSERT INTO demo_testergebnis VALUES ('T04','Constraint','Aufgabenabschluss ohne Ergebnis wird abgewiesen','Ablehnung',
  CASE WHEN ok THEN 'abgewiesen' ELSE 'DURCHGELASSEN' END, CASE WHEN ok THEN 'BESTANDEN' ELSE 'FEHLER' END);

ok := crm_fn_negativtest(
  $q$INSERT INTO crm_empfehlung (mandant_id,empfehlungsgeber_kunde_id,empfohlener_name,status)
     VALUES ('11111111-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003','Test','gewonnen')$q$,
  'crm_empf_lead');
INSERT INTO demo_testergebnis VALUES ('T05','Constraint','Gewonnene Empfehlung ohne Lead wird abgewiesen','Ablehnung',
  CASE WHEN ok THEN 'abgewiesen' ELSE 'DURCHGELASSEN' END, CASE WHEN ok THEN 'BESTANDEN' ELSE 'FEHLER' END);

-- ---------- Gruppe 2: Die vier Versprechen aus 01_ZIELBILD.md ----------
SELECT count(*)::text INTO ist FROM vw_crm_vergessene_vorgaenge;
INSERT INTO demo_testergebnis VALUES ('T06','Versprechen V1','Kein Lead und keine Chance ohne offene Aufgabe','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_angebot a
 WHERE a.status IN ('versendet','geoeffnet','in_verhandlung')
   AND NOT EXISTS (SELECT 1 FROM crm_aufgabe t WHERE t.bezug_typ='opportunity' AND t.bezug_id=a.opportunity_id
                   AND t.typ='angebot_nachfassen' AND t.status IN ('offen','in_arbeit'));
INSERT INTO demo_testergebnis VALUES ('T07','Versprechen V2','Jedes offene Angebot hat eine Nachfassaufgabe','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_kunde k
 WHERE k.status='aktiv' AND k.risk_score>=65
   AND NOT EXISTS (SELECT 1 FROM crm_aufgabe t WHERE t.bezug_typ='kunde' AND t.bezug_id=k.id
                   AND t.typ='rueckhol_kontakt' AND t.status IN ('offen','in_arbeit'));
INSERT INTO demo_testergebnis VALUES ('T08','Versprechen V3','Jedes hohe Kündigungsrisiko erzeugt eine Rückholaufgabe','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_boot_ref b
 WHERE b.status='aktiv' AND b.kunde_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM crm_vertrag_ref v WHERE v.boot_ref_id=b.id AND v.status='aktiv')
   AND NOT EXISTS (SELECT 1 FROM crm_nbo_vorschlag n WHERE n.boot_ref_id=b.id)
   AND NOT EXISTS (SELECT 1 FROM crm_lead l WHERE l.boot_ref_id=b.id);
INSERT INTO demo_testergebnis VALUES ('T09','Versprechen V4','Kein ungedecktes Boot ohne Vorschlag oder Lead','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

-- ---------- Gruppe 3: Aufgabenlogik ----------
SELECT coalesce(max(n),0)::text INTO ist FROM (
  SELECT count(*) n FROM crm_aufgabe WHERE status='offen' AND quelle='automatisch' GROUP BY zugewiesen_an) x;
INSERT INTO demo_testergebnis VALUES ('T10','Lastschutz','Automatikaufgaben je Benutzer <= 25','<= 25',ist,
  CASE WHEN ist::int<=25 THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM (
  SELECT bezug_typ,bezug_id,typ,regel_code FROM crm_aufgabe
   WHERE status IN ('offen','in_arbeit') AND quelle='automatisch'
   GROUP BY 1,2,3,4 HAVING count(*)>1) x;
INSERT INTO demo_testergebnis VALUES ('T11','Duplikatsschutz','Keine doppelten Automatikaufgaben','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_aufgabe a
 WHERE a.quelle='automatisch'
   AND NOT EXISTS (SELECT 1 FROM crm_automation_lauf al WHERE al.ergebnis->>'aufgabe_id'=a.id::text);
INSERT INTO demo_testergebnis VALUES ('T12','Nachvollziehbarkeit','Jede Automatikaufgabe ist protokolliert','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_aufgabe
 WHERE status IN ('offen','in_arbeit') AND (prioritaets_score IS NULL OR prioritaets_score=0);
INSERT INTO demo_testergebnis VALUES ('T13','Priorisierung','Jede offene Aufgabe ist priorisiert','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

-- ---------- Gruppe 4: Scoring ----------
SELECT count(*)::text INTO ist FROM crm_lead WHERE jsonb_array_length(score_erklaerung)=0 AND geloescht_am IS NULL;
INSERT INTO demo_testergebnis VALUES ('T14','Erklärbarkeit','Jeder Lead-Score hat eine Begründung','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_churn_bewertung WHERE risiko_stufe='hoch' AND jsonb_array_length(top_treiber)=0;
INSERT INTO demo_testergebnis VALUES ('T15','Erklärbarkeit','Jedes hohe Risiko nennt seine Treiber','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_lead WHERE lead_score NOT BETWEEN 0 AND 100;
INSERT INTO demo_testergebnis VALUES ('T16','Wertebereich','Lead Score liegt in [0,100]','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_lead
 WHERE lead_kategorie <> CASE WHEN lead_score>=80 THEN 'A' WHEN lead_score>=60 THEN 'B'
                              WHEN lead_score>=35 THEN 'C' ELSE 'D' END;
INSERT INTO demo_testergebnis VALUES ('T17','Konsistenz','Kategorie entspricht dem Score','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

-- ---------- Gruppe 5: Kalibrierung (nach Lauf 1.0 aufgedeckt) ----------
SELECT count(*)::text INTO ist FROM crm_lead
 WHERE quelle_id IN (SELECT id FROM crm_lead_quelle WHERE code IN ('WERFT','EMPF','HAENDL'))
   AND boot_wert_eur >= 300000 AND lead_kategorie NOT IN ('A','B');
INSERT INTO demo_testergebnis VALUES ('T18','Kalibrierung K1',
  'Partner-/Empfehlungslead mit Bootswert >= 300k ist A oder B','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_kunde
 WHERE status='aktiv' AND letzter_kontakt_am < now()-interval '270 days' AND risiko_stufe <> 'hoch';
INSERT INTO demo_testergebnis VALUES ('T19','Kalibrierung K3',
  'Kunde ohne Kontakt seit > 270 Tagen wird als hohes Risiko erkannt','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT coalesce(sum(v.jahrespraemie_eur),0)::int::text INTO ist FROM crm_vertrag_ref v
 WHERE v.kunde_id='40000000-0000-0000-0000-000000000001' AND v.status='aktiv';
INSERT INTO demo_testergebnis VALUES ('T20','Kalibrierung K4',
  'Hauptfälligkeitsaufgabe trägt die gesamte gefährdete Jahresprämie', ist,
  (SELECT coalesce(erwarteter_wert_eur,0)::int::text FROM crm_aufgabe
    WHERE regel_code='A-21' AND bezug_id='40000000-0000-0000-0000-000000000001'),
  CASE WHEN ist = (SELECT coalesce(erwarteter_wert_eur,0)::int::text FROM crm_aufgabe
                   WHERE regel_code='A-21' AND bezug_id='40000000-0000-0000-0000-000000000001')
       THEN 'BESTANDEN' ELSE 'FEHLER' END);

-- ---------- Gruppe 6: Empfehlungs- und Datenschutzregeln ----------
SELECT count(*)::text INTO ist FROM crm_empfehlung
 WHERE status NOT IN ('eingegangen','ungueltig') AND erzeugter_lead_id IS NULL;
INSERT INTO demo_testergebnis VALUES ('T21','Empfehlung','Jede aktive Empfehlung ist zu einem Lead geworden','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_empfehlung
 WHERE rueckmeldung_am IS NULL AND eingegangen_am < now()-interval '14 days' AND status<>'ungueltig'
   AND NOT EXISTS (SELECT 1 FROM crm_aufgabe t WHERE t.bezug_typ='empfehlung' AND t.bezug_id=crm_empfehlung.id
                   AND t.status IN ('offen','in_arbeit'));
INSERT INTO demo_testergebnis VALUES ('T22','Empfehlung','Fehlende Rückmeldung an den Geber erzeugt eine Aufgabe','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);

SELECT count(*)::text INTO ist FROM crm_signal s
 WHERE s.kontakt_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM crm_consent c WHERE c.kontakt_id=s.kontakt_id
                   AND c.kanal IN ('tracking','email') AND c.status='erteilt')
   AND s.zeitstempel > now()-interval '30 days';
INSERT INTO demo_testergebnis VALUES ('T23','DSGVO','Keine neuen Verhaltenssignale ohne Einwilligung','0',ist,
  CASE WHEN ist='0' THEN 'BESTANDEN' ELSE 'FEHLER' END);
END;
$$;

-- ---------- Gruppe 7: Mandantentrennung (Row Level Security) ----------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='crm_app') THEN
        CREATE ROLE crm_app LOGIN;
    END IF;
END$$;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO crm_app;

DO $$
DECLARE n_fremd int; n_eigen int;
BEGIN
    SET LOCAL ROLE crm_app;
    SET LOCAL app.mandant_id = '99999999-9999-9999-9999-999999999999';
    SELECT count(*) INTO n_fremd FROM crm_kunde;
    SET LOCAL app.mandant_id = '11111111-0000-0000-0000-000000000001';
    SELECT count(*) INTO n_eigen FROM crm_kunde;
    RESET ROLE;
    INSERT INTO demo_testergebnis VALUES ('T24','Mandantentrennung',
      'Fremder Mandant sieht keine Datensätze','0 / 10', n_fremd||' / '||n_eigen,
      CASE WHEN n_fremd=0 AND n_eigen>0 THEN 'BESTANDEN' ELSE 'FEHLER' END);
END;
$$;

SELECT nr, bereich, pruefung, erwartet, ist, status FROM demo_testergebnis ORDER BY nr;
SELECT count(*) FILTER (WHERE status='BESTANDEN')||' von '||count(*)||' Prüfungen bestanden' AS gesamtergebnis
  FROM demo_testergebnis;
