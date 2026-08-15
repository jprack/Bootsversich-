-- =============================================================================
--  01_CRM_ENGINE — Lasttest
--  Schließt den offenen Punkt aus dem Prüfbericht: Die Antwortzeitziele aus
--  09_APIS.md waren unbelegt, weil 27 Signale kein Durchsatztest sind.
--
--  Erzeugt einen synthetischen Bestand in realistischer Größenordnung für einen
--  mittelständischen Bootsversicherungs-Makler und misst die Abfragen, für die
--  das API-Konzept Zielwerte nennt.
--
--  Zielwerte (09_APIS.md, Abschnitt 9.5):
--    GET /aufgaben/tagesliste   p95 <= 300 ms
--    GET /kunden/{id}/akte      p95 <= 700 ms
--    POST /leads (inkl. Scoring) p95 <= 800 ms
-- =============================================================================
\set M '''11111111-0000-0000-0000-000000000001'''
SET client_min_messages = warning;

\echo '==> Reste eines früheren Lasttests entfernen'
DELETE FROM crm_vertrag_ref WHERE policennummer LIKE 'P-LAST-%';
DELETE FROM crm_boot_ref   WHERE name LIKE 'Boot K-LAST-%';
DELETE FROM crm_lead       WHERE leadnummer LIKE 'L-LAST-%';
DELETE FROM crm_signal     WHERE tracking_id LIKE 'tr-last-%';
DELETE FROM crm_kunde      WHERE kundennummer LIKE 'K-LAST-%';
DELETE FROM crm_kontakt    WHERE nachname LIKE 'Testkontakt%';

\echo '==> Synthetischen Bestand erzeugen'

-- --- 5.000 Kontakte -----------------------------------------------------------
INSERT INTO crm_kontakt (id,mandant_id,vorname,nachname,email,telefon,plz,ort,land,
                         lifecycle_stufe,stufe_seit,verantwortlicher_id,tracking_ids,letztes_signal_am)
SELECT gen_random_uuid(), :M,
       'Vorname'||g, 'Testkontakt'||g,
       'last'||g||'@example.invalid',
       '+4940'||lpad(g::text,7,'0'),
       lpad(((g % 80000) + 10000)::text,5,'0'),
       'Testort', 'DE',
       'S1_lead', now() - (g % 300 || ' days')::interval,
       (ARRAY['22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
              '22222222-0000-0000-0000-000000000004']::uuid[])[1 + g % 3],
       CASE WHEN g % 3 = 0 THEN ARRAY['tr-last-'||g] ELSE '{}'::text[] END,
       NULL
FROM generate_series(1,5000) g;

-- Einwilligungen für die Hälfte
INSERT INTO crm_consent (mandant_id,kontakt_id,kanal,zweck,status,rechtsgrundlage)
SELECT :M, id, 'email','vertragsanbahnung','erteilt','einwilligung'
FROM crm_kontakt WHERE nachname LIKE 'Testkontakt%' AND (right(nachname,1)::int % 2) = 0;

-- --- 5.000 Leads --------------------------------------------------------------
INSERT INTO crm_lead (mandant_id,leadnummer,kontakt_id,bedarfsart,produktinteresse,zeitfenster,
       boot_typ,boot_laenge_m,boot_wert_eur,boot_baujahr,motorleistung_kw,anzahl_objekte,
       fahrgebiet,nutzungsart,unternehmerstatus,hauptfaelligkeit_bestand,
       quelle_id,verantwortlicher_id,status,disqualifikationsgrund,eingegangen_am,erstkontakt_faellig_am,
       erstkontakt_am,reaktionszeit_minuten)
SELECT :M, 'L-LAST-'||lpad(row_number() OVER ()::text,6,'0'), k.id,
       (ARRAY['neuversicherung','wechsel','zusatzdeckung','bootswechsel','flotte','skipper'])[1 + (n % 6)],
       ARRAY['KASKO'],
       (ARRAY['sofort','4_wochen','3_monate','saison','unklar'])[1 + (n % 5)],
       (ARRAY['segelyacht','motoryacht','sportboot','katamaran'])[1 + (n % 4)],
       (4 + (n % 16))::numeric, (15000 + (n % 60) * 18000)::numeric, (1995 + (n % 30))::int, (20 + (n % 300))::numeric,
       CASE WHEN n % 25 = 0 THEN (3 + (n % 5))::int ELSE 1 END,
       (ARRAY['binnen','kuestennah','nord_ostsee','mittelmeer','weltweit'])[1 + (n % 5)],
       (ARRAY['privat','privat','privat','gewerblich_charter','gewerblich_flotte'])[1 + (n % 5)],
       (n % 9 = 0),
       CASE WHEN n % 4 = 0 THEN current_date + (n % 300)::int ELSE NULL END,
       (SELECT id FROM crm_lead_quelle WHERE mandant_id=:M ORDER BY code LIMIT 1 OFFSET (n % 18)),
       k.verantwortlicher_id,
       (ARRAY['neu','in_bearbeitung','kontaktiert','qualifiziert','nurturing','disqualifiziert'])[1 + (n % 6)],
       CASE WHEN (n % 6) = 5 THEN 'kein_bedarf' ELSE NULL END,
       now() - (n % 180 || ' days')::interval,
       now() - (n % 180 || ' days')::interval + interval '4 hours',
       CASE WHEN n % 3 <> 0 THEN now() - (n % 180 || ' days')::interval + interval '6 hours' ELSE NULL END,
       CASE WHEN n % 3 <> 0 THEN (360 + (n % 3000))::int ELSE NULL END
FROM (SELECT id, verantwortlicher_id, row_number() OVER (ORDER BY id) AS n
      FROM crm_kontakt WHERE nachname LIKE 'Testkontakt%') k;

-- --- 2.000 Kunden mit Booten und Verträgen ------------------------------------
INSERT INTO crm_kunde (id,mandant_id,kundennummer,bezeichnung,kundentyp,status,kunde_seit,
       betreuer_id,team_id,letzter_kontakt_am,naechstes_jahresgespraech_am)
SELECT gen_random_uuid(), :M, 'K-LAST-'||lpad(g::text,6,'0'), 'Testkunde '||g,
       (ARRAY['privat','privat','privat','gewerblich','charterbetrieb'])[1 + (g % 5)],
       'aktiv', current_date - (200 + g % 3000)::int,
       (ARRAY['22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002']::uuid[])[1 + g % 2],
       '23000000-0000-0000-0000-000000000001',
       now() - (g % 400 || ' days')::interval,
       current_date + (g % 365)::int - 90
FROM generate_series(1,2000) g;

INSERT INTO crm_boot_ref (id,mandant_id,kunde_id,name,boot_typ,baujahr,laenge_m,wert_eur,
       wert_geprueft_am,fahrgebiet,nutzungsart,status)
SELECT gen_random_uuid(), :M, k.id, 'Boot '||k.kundennummer||'-'||s,
       (ARRAY['segelyacht','motoryacht','sportboot'])[1 + (s % 3)],
       (2000 + (k.n % 25))::int, (5 + (k.n % 15))::numeric, (20000 + (k.n % 40) * 12000)::numeric,
       current_date - (100 + (k.n % 1200))::int,
       (ARRAY['binnen','kuestennah','nord_ostsee','mittelmeer'])[1 + (k.n % 4)],
       'privat','aktiv'
FROM (SELECT id, kundennummer, row_number() OVER (ORDER BY id) AS n
      FROM crm_kunde WHERE kundennummer LIKE 'K-LAST-%') k,
     generate_series(1, 2) s
WHERE s = 1 OR k.n % 4 = 0;

INSERT INTO crm_vertrag_ref (id,mandant_id,kunde_id,boot_ref_id,policennummer,produkt_code,sparte,
       status,beginn_am,hauptfaelligkeit,jahrespraemie_eur,versicherungssumme_eur,
       courtage_eur,fahrgebiet,praemienaenderung_prozent)
SELECT gen_random_uuid(), :M, b.kunde_id, b.id,
       'P-LAST-'||substr(b.id::text,1,8),
       (ARRAY['KASKO','HP','RS'])[1 + (row_number() OVER () % 3)],
       (ARRAY['kasko','haftpflicht','rechtsschutz'])[1 + (row_number() OVER () % 3)],
       'aktiv', current_date - 400,
       current_date + (row_number() OVER () % 365)::int,
       (200 + (row_number() OVER () % 40) * 95)::numeric,
       b.wert_eur, 150, b.fahrgebiet,
       CASE WHEN row_number() OVER () % 11 = 0 THEN 18 ELSE 3 END
FROM crm_boot_ref b WHERE b.name LIKE 'Boot K-LAST-%';

-- --- 40.000 Signale -----------------------------------------------------------
INSERT INTO crm_signal (mandant_id,signal_typ_id,kontakt_id,tracking_id,zeitstempel,kanal,verarbeitet)
SELECT :M, st.id, k.id, k.tracking_ids[1],
       date_trunc('day', now()) - ((g * 7 + k.n) % 200 || ' days')::interval + interval '9 hours',
       'web', false
FROM (SELECT id, tracking_ids, row_number() OVER (ORDER BY id) AS n
      FROM crm_kontakt WHERE nachname LIKE 'Testkontakt%' AND array_length(tracking_ids,1) > 0) k,
     generate_series(1,24) g,
     LATERAL (SELECT id FROM crm_signal_typ WHERE mandant_id=:M AND kategorie='website'
              ORDER BY code LIMIT 1 OFFSET (g % 6)) st
WHERE (g + k.n) % 3 = 0;

ANALYZE;

\echo '==> Bestandsgröße'
SELECT 'Kontakte' AS tabelle, count(*) FROM crm_kontakt
UNION ALL SELECT 'Leads', count(*) FROM crm_lead
UNION ALL SELECT 'Kunden', count(*) FROM crm_kunde
UNION ALL SELECT 'Boote', count(*) FROM crm_boot_ref
UNION ALL SELECT 'Verträge', count(*) FROM crm_vertrag_ref
UNION ALL SELECT 'Signale', count(*) FROM crm_signal
ORDER BY 2 DESC;

\echo ''
\echo '==> Engine-Nachtlauf über den vollen Bestand (mit Zeitmessung)'
CREATE TEMP TABLE lasttest_lauf AS
SELECT clock_timestamp() AS t0;
SELECT * FROM crm_fn_engine_lauf('11111111-0000-0000-0000-000000000001');
SELECT round(EXTRACT(epoch FROM (clock_timestamp() - t0))::numeric,1)||' Sekunden' AS nachtlauf_dauer
FROM lasttest_lauf;
ANALYZE;

-- =============================================================================
--  MESSUNG
-- =============================================================================
-- Der Test ist nur gültig, wenn der Bestand tatsächlich erzeugt wurde.
DO $pruef$
DECLARE n_lead int; n_vtr int; n_boot int;
BEGIN
    SELECT count(*) INTO n_lead FROM crm_lead   WHERE leadnummer LIKE 'L-LAST-%';
    SELECT count(*) INTO n_vtr  FROM crm_vertrag_ref WHERE policennummer LIKE 'P-LAST-%';
    SELECT count(*) INTO n_boot FROM crm_boot_ref WHERE name LIKE 'Boot K-LAST-%';
    IF n_lead < 4000 OR n_vtr < 2000 OR n_boot < 2000 THEN
        RAISE EXCEPTION 'Lasttest ungueltig: Bestand nicht vollstaendig erzeugt (Leads %, Vertraege %, Boote %). Messung abgebrochen.',
              n_lead, n_vtr, n_boot;
    END IF;
END;
$pruef$;

CREATE TEMP TABLE lasttest_ergebnis (
    nr text, abfrage text, zielwert_ms int, laeufe int,
    p50_ms numeric, p95_ms numeric, max_ms numeric, status text);

DO $$
DECLARE
    v_benutzer uuid := '22222222-0000-0000-0000-000000000001';
    v_kunde uuid; v_lead uuid;
    t0 timestamptz; dauer numeric[]; i int; n int := 25; dummy record; sc crm_typ_score;
    p50 numeric; p95 numeric; mx numeric;

BEGIN
    SELECT id INTO v_kunde FROM crm_kunde WHERE kundennummer LIKE 'K-LAST-%' LIMIT 1;
    SELECT id INTO v_lead  FROM crm_lead  WHERE leadnummer LIKE 'L-LAST-%' LIMIT 1;

    -- Q1: Tagesliste
    dauer := '{}';
    FOR i IN 1..n LOOP
        t0 := clock_timestamp();
        PERFORM * FROM vw_crm_next_best_action WHERE benutzer_id = v_benutzer LIMIT 25;
        dauer := dauer || (EXTRACT(epoch FROM (clock_timestamp()-t0))*1000)::numeric;
    END LOOP;
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY d), percentile_cont(0.95) WITHIN GROUP (ORDER BY d), max(d)
      INTO p50,p95,mx FROM unnest(dauer) d;
    INSERT INTO lasttest_ergebnis VALUES ('Q1','GET /aufgaben/tagesliste',300,n,round(p50,1),round(p95,1),round(mx,1),
      CASE WHEN p95 <= 300 THEN 'ZIEL ERREICHT' ELSE 'ZIEL VERFEHLT' END);

    -- Q2: Kundenakte 360
    dauer := '{}';
    FOR i IN 1..n LOOP
        t0 := clock_timestamp();
        PERFORM * FROM vw_crm_kunde_360 WHERE kunde_id = v_kunde;
        dauer := dauer || (EXTRACT(epoch FROM (clock_timestamp()-t0))*1000)::numeric;
    END LOOP;
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY d), percentile_cont(0.95) WITHIN GROUP (ORDER BY d), max(d)
      INTO p50,p95,mx FROM unnest(dauer) d;
    INSERT INTO lasttest_ergebnis VALUES ('Q2','GET /kunden/{id}/akte',700,n,round(p50,1),round(p95,1),round(mx,1),
      CASE WHEN p95 <= 700 THEN 'ZIEL ERREICHT' ELSE 'ZIEL VERFEHLT' END);

    -- Q3: Lead Score (Kern von POST /leads)
    dauer := '{}';
    FOR i IN 1..n LOOP
        t0 := clock_timestamp();
        sc := crm_fn_lead_score(v_lead);
        dauer := dauer || (EXTRACT(epoch FROM (clock_timestamp()-t0))*1000)::numeric;
    END LOOP;
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY d), percentile_cont(0.95) WITHIN GROUP (ORDER BY d), max(d)
      INTO p50,p95,mx FROM unnest(dauer) d;
    INSERT INTO lasttest_ergebnis VALUES ('Q3','POST /leads — Scoring',800,n,round(p50,1),round(p95,1),round(mx,1),
      CASE WHEN p95 <= 800 THEN 'ZIEL ERREICHT' ELSE 'ZIEL VERFEHLT' END);

    -- Q4: Pipeline-Aggregat (Dashboard)
    dauer := '{}';
    FOR i IN 1..n LOOP
        t0 := clock_timestamp();
        PERFORM * FROM vw_crm_pipeline;
        dauer := dauer || (EXTRACT(epoch FROM (clock_timestamp()-t0))*1000)::numeric;
    END LOOP;
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY d), percentile_cont(0.95) WITHIN GROUP (ORDER BY d), max(d)
      INTO p50,p95,mx FROM unnest(dauer) d;
    INSERT INTO lasttest_ergebnis VALUES ('Q4','GET /pipeline (Dashboard)',500,n,round(p50,1),round(p95,1),round(mx,1),
      CASE WHEN p95 <= 500 THEN 'ZIEL ERREICHT' ELSE 'ZIEL VERFEHLT' END);

    -- Q5: Vergessenswächter (nächtlicher Anti-Join über den Gesamtbestand)
    dauer := '{}';
    FOR i IN 1..10 LOOP
        t0 := clock_timestamp();
        PERFORM count(*) FROM vw_crm_vergessene_vorgaenge;
        dauer := dauer || (EXTRACT(epoch FROM (clock_timestamp()-t0))*1000)::numeric;
    END LOOP;
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY d), percentile_cont(0.95) WITHIN GROUP (ORDER BY d), max(d)
      INTO p50,p95,mx FROM unnest(dauer) d;
    INSERT INTO lasttest_ergebnis VALUES ('Q5','Vergessenswächter A-01 (Nachtlauf)',2000,10,round(p50,1),round(p95,1),round(mx,1),
      CASE WHEN p95 <= 2000 THEN 'ZIEL ERREICHT' ELSE 'ZIEL VERFEHLT' END);
END;
$$;

\echo ''
\echo '==> Antwortzeiten'
SELECT nr, abfrage, zielwert_ms AS "ziel_ms", laeufe, p50_ms, p95_ms, max_ms, status FROM lasttest_ergebnis ORDER BY nr;
