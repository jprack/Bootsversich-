-- =============================================================================
--  01_CRM_ENGINE — Regelwerk, Mustererkennung, Next Best Offer, Priorisierung
--  Referenz: 10_AUTOMATISIERUNGEN.md
-- =============================================================================
\set M '''11111111-0000-0000-0000-000000000001'''

-- --- Regelkatalog registrieren (Voraussetzung für das Laufprotokoll) ----------
INSERT INTO crm_automation_regel (mandant_id,code,bezeichnung,ausloeser_typ,ausloeser,aktionen,max_pro_tag_je_benutzer) VALUES
 (:M,'A-01','Vergessenswächter: aktiver Vorgang ohne offene Aufgabe','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-02','Erstkontakt neuer Lead mit SLA','event','crm.lead.erstellt','[{"typ":"aufgabe"},{"typ":"email"}]',25),
 (:M,'A-05','SLA Erstkontakt überschritten','zeitplan','0 * * * *','[{"typ":"eskalation"}]',NULL),
 (:M,'A-08','Lead ohne Signal > 180 Tage in Nurturing','zeitplan','0 2 * * *','[{"typ":"kampagne"}]',NULL),
 (:M,'A-09','Konfigurator abgebrochen (Muster M2)','event','crm.signal.muster_erkannt','[{"typ":"aufgabe"}]',25),
 (:M,'A-11','Angebotsnachfassung T+3','event','crm.angebot.versendet','[{"typ":"aufgabe"}]',25),
 (:M,'A-12','Angebot läuft in 3 Tagen ab','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-14','Opportunity ohne offene Aufgabe','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-15','Stillstand in der Pipelinestufe','zeitplan','0 6 * * *','[{"typ":"eskalation"}]',NULL),
 (:M,'A-16','Angebot mehrfach geöffnet (Muster M6)','event','crm.angebot.geoeffnet','[{"typ":"aufgabe"}]',25),
 (:M,'A-21','Hauptfälligkeit T-90/T-60/T-30','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-22','Jahresgespräch fällig','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-23','Bootswert seit > 24 Monaten ungeprüft','zeitplan','0 2 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-24','Kündigungsrisiko hoch','schwellwert','risk_score>=65','[{"typ":"aufgabe"}]',NULL),
 (:M,'A-25','Kündigungsrisiko hoch bei hohem Kundenwert','schwellwert','risk>=65 AND cvs>=70','[{"typ":"aufgabe"},{"typ":"email"},{"typ":"push"}]',NULL),
 (:M,'A-28','Empfehlungsanfrage bei zufriedenen Kunden','zeitplan','0 6 1 * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-30','Next Best Offer','zeitplan','0 2 * * *','[{"typ":"opportunity"},{"typ":"aufgabe"}]',25),
 (:M,'A-34','Empfehlung eingegangen','event','crm.empfehlung.eingegangen','[{"typ":"aufgabe"}]',NULL),
 (:M,'A-35','Empfehlung ohne Rückmeldung an den Geber','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (:M,'A-37','Partnerkontakt überfällig','zeitplan','0 6 1 * *','[{"typ":"aufgabe"}]',25)
ON CONFLICT (mandant_id, code) DO NOTHING;   -- Skript muss wiederholbar sein

-- =============================================================================
--  MUSTERERKENNUNG M1 - M8
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_muster_erkennen(p_mandant uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0;
BEGIN
    DELETE FROM crm_signal_muster WHERE mandant_id = p_mandant AND erkannt_am::date = current_date;

    -- M1 Kaufvorbereitung: Konfigurator + Download Bedingungen innerhalb 7 Tagen
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,intent_score,aktion)
    SELECT p_mandant,'M1',k.id,crm_fn_intent_score(k.id),'opportunity_pruefen'
    FROM crm_kontakt k
    WHERE k.mandant_id=p_mandant
      AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                  WHERE s.kontakt_id=k.id AND t.code='S-WEB-05' AND s.zeitstempel>now()-interval '7 days')
      AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                  WHERE s.kontakt_id=k.id AND t.code='S-DOC-01' AND s.zeitstempel>now()-interval '7 days');
    GET DIAGNOSTICS n = ROW_COUNT;

    -- M2 Abbrecher: Rechner abgebrochen, keine Formularabgabe binnen 24 h
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,intent_score,aktion)
    SELECT p_mandant,'M2',k.id,crm_fn_intent_score(k.id),'rueckruf'
    FROM crm_kontakt k
    WHERE k.mandant_id=p_mandant
      AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                  WHERE s.kontakt_id=k.id AND t.code='S-WEB-06' AND s.zeitstempel>now()-interval '24 hours');

    -- M3 Wechselabsicht: Hauptfälligkeit T-90 + mindestens 2 Websitebesuche
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,intent_score,aktion)
    SELECT p_mandant,'M3',k.id,crm_fn_intent_score(k.id),'hauptfaelligkeitsgespraech'
    FROM crm_kontakt k
    WHERE k.mandant_id=p_mandant
      AND EXISTS (SELECT 1 FROM crm_lead l WHERE l.kontakt_id=k.id
                  AND l.hauptfaelligkeit_bestand BETWEEN current_date AND current_date+90)
      AND (SELECT count(*) FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
           WHERE s.kontakt_id=k.id AND t.kategorie='website' AND s.zeitstempel>now()-interval '30 days') >= 2;

    -- M4 Bootswechsel: Marketplace-Inserat + Kaufanfrage oder Objektmeldung
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,intent_score,aktion)
    SELECT p_mandant,'M4',k.id,crm_fn_intent_score(k.id),'opportunity_deckungsanpassung'
    FROM crm_kontakt k
    WHERE k.mandant_id=p_mandant
      AND (EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                   WHERE s.kontakt_id=k.id AND t.code='S-OBJ-01' AND s.zeitstempel>now()-interval '120 days')
        OR (EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                    WHERE s.kontakt_id=k.id AND t.code='S-MKT-01' AND s.zeitstempel>now()-interval '60 days')
        AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                    WHERE s.kontakt_id=k.id AND t.code='S-MKT-02' AND s.zeitstempel>now()-interval '45 days')));

    -- M5 Stiller Rückzug: Bestandskunde ohne Signal seit 120 Tagen
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,kunde_id,intent_score,aktion)
    SELECT p_mandant,'M5',k.id,kd.id,crm_fn_intent_score(k.id),'beziehungspflege'
    FROM crm_kunde kd JOIN crm_kontakt k ON k.id=kd.haupt_kontakt_id
    WHERE kd.mandant_id=p_mandant AND kd.status='aktiv'
      AND coalesce(k.letztes_signal_am, kd.kunde_seit) < now()-interval '120 days';

    -- M6 Angebotsdruck: Angebot mehrfach geöffnet + Tarifseitenbesuch
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,intent_score,aktion)
    SELECT p_mandant,'M6',k.id,crm_fn_intent_score(k.id),'sofort_nachfassen'
    FROM crm_kontakt k
    WHERE k.mandant_id=p_mandant
      AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                  WHERE s.kontakt_id=k.id AND t.code='S-MAIL-03' AND s.zeitstempel>now()-interval '3 days')
      AND EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ t ON t.id=s.signal_typ_id
                  WHERE s.kontakt_id=k.id AND t.code='S-WEB-01' AND s.zeitstempel>now()-interval '3 days');

    -- M8 Flottenpotenzial: >= 2 Boote und gewerbliche Nutzung
    INSERT INTO crm_signal_muster (mandant_id,code,kontakt_id,kunde_id,intent_score,aktion)
    SELECT p_mandant,'M8',kd.haupt_kontakt_id,kd.id,0,'flottenkonzept'
    FROM crm_kunde kd
    WHERE kd.mandant_id=p_mandant AND kd.status='aktiv'
      AND (SELECT count(*) FROM crm_boot_ref b WHERE b.kunde_id=kd.id AND b.status='aktiv') >= 2
      AND EXISTS (SELECT 1 FROM crm_boot_ref b WHERE b.kunde_id=kd.id AND b.nutzungsart LIKE 'gewerblich%')
      AND NOT EXISTS (SELECT 1 FROM crm_vertrag_ref v WHERE v.kunde_id=kd.id AND v.produkt_code='FLOTTE' AND v.status='aktiv');

    SELECT count(*) INTO n FROM crm_signal_muster WHERE mandant_id=p_mandant AND erkannt_am::date=current_date;
    RETURN n;
END;
$$;

-- =============================================================================
--  NEXT BEST OFFER  (NBO-01, 03, 05, 06, 07, 08)
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_next_best_offer(p_mandant uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
    DELETE FROM crm_nbo_vorschlag WHERE mandant_id=p_mandant AND status='offen';

    -- NBO-01: Kasko vorhanden, keine Skipper-Haftpflicht
    INSERT INTO crm_nbo_vorschlag (mandant_id,kunde_id,regel_code,produkt_id,erwarteter_wert_eur,trefferwahrscheinlichkeit,begruendung,gueltig_bis)
    SELECT p_mandant,k.id,'NBO-01',(SELECT id FROM crm_produkt WHERE code='SKIPPER' AND mandant_id=p_mandant),340,0.40,
           'Kaskodeckung vorhanden, Skipper-Haftpflicht fehlt', current_date+90
    FROM crm_kunde k
    WHERE k.mandant_id=p_mandant AND k.status='aktiv' AND k.kundentyp='privat'
      AND EXISTS (SELECT 1 FROM crm_vertrag_ref v WHERE v.kunde_id=k.id AND v.sparte='kasko' AND v.status='aktiv')
      AND NOT EXISTS (SELECT 1 FROM crm_vertrag_ref v WHERE v.kunde_id=k.id AND v.produkt_code='SKIPPER' AND v.status='aktiv');

    -- NBO-03: Fahrgebiet Mittelmeer, Vertrag deckt nur küstennah
    INSERT INTO crm_nbo_vorschlag (mandant_id,kunde_id,boot_ref_id,regel_code,erwarteter_wert_eur,trefferwahrscheinlichkeit,begruendung,gueltig_bis)
    SELECT p_mandant,k.id,b.id,'NBO-03',480,0.55,
           'Boot "'||b.name||'" liegt im Mittelmeer, Police deckt nur '||v.fahrgebiet||' — Deckungslücke',current_date+60
    FROM crm_kunde k
    JOIN crm_boot_ref b ON b.kunde_id=k.id AND b.status='aktiv' AND b.fahrgebiet='mittelmeer'
    JOIN crm_vertrag_ref v ON v.boot_ref_id=b.id AND v.status='aktiv'
    WHERE k.mandant_id=p_mandant AND v.fahrgebiet <> 'mittelmeer';

    -- NBO-05: Bootswert seit > 24 Monaten nicht geprüft
    INSERT INTO crm_nbo_vorschlag (mandant_id,kunde_id,boot_ref_id,regel_code,erwarteter_wert_eur,trefferwahrscheinlichkeit,begruendung,gueltig_bis)
    SELECT p_mandant,k.id,b.id,'NBO-05',round(v.jahrespraemie_eur*0.12),0.60,
           'Wert von "'||b.name||'" seit '||round((current_date-b.wert_geprueft_am)/30.0)||' Monaten nicht geprüft — Unterversicherungsrisiko',
           current_date+120
    FROM crm_kunde k
    JOIN crm_boot_ref b ON b.kunde_id=k.id AND b.status='aktiv'
    JOIN crm_vertrag_ref v ON v.boot_ref_id=b.id AND v.status='aktiv'
    WHERE k.mandant_id=p_mandant AND k.status='aktiv'
      AND b.wert_geprueft_am < current_date-730;

    -- NBO-06: Boot im Bestand ohne Vertrag
    INSERT INTO crm_nbo_vorschlag (mandant_id,kunde_id,boot_ref_id,regel_code,erwarteter_wert_eur,trefferwahrscheinlichkeit,begruendung,gueltig_bis)
    SELECT p_mandant,k.id,b.id,'NBO-06',round(b.wert_eur*0.0075),0.70,
           'Boot "'||b.name||'" ('||to_char(b.wert_eur,'FM999G999')||' €) ist ohne Deckung',current_date+30
    FROM crm_kunde k
    JOIN crm_boot_ref b ON b.kunde_id=k.id AND b.status='aktiv'
    WHERE k.mandant_id=p_mandant AND k.status='aktiv'
      AND NOT EXISTS (SELECT 1 FROM crm_vertrag_ref v WHERE v.boot_ref_id=b.id AND v.status='aktiv');

    -- NBO-08: >= 3 Boote mit Einzelverträgen -> Flottenvertrag
    INSERT INTO crm_nbo_vorschlag (mandant_id,kunde_id,regel_code,produkt_id,erwarteter_wert_eur,trefferwahrscheinlichkeit,begruendung,gueltig_bis)
    SELECT p_mandant,k.id,'NBO-08',(SELECT id FROM crm_produkt WHERE code='FLOTTE' AND mandant_id=p_mandant),
           round(sum(v.jahrespraemie_eur)*0.08),0.45,
           count(*)||' Einzelverträge — Bündelung als Flottenvertrag prüfen',current_date+90
    FROM crm_kunde k JOIN crm_vertrag_ref v ON v.kunde_id=k.id AND v.status='aktiv'
    WHERE k.mandant_id=p_mandant AND k.status='aktiv'
    GROUP BY k.id HAVING count(*) >= 3
      AND NOT EXISTS (SELECT 1 FROM crm_vertrag_ref v2 WHERE v2.kunde_id=k.id AND v2.produkt_code='FLOTTE' AND v2.status='aktiv');

    SELECT count(*) INTO n FROM crm_nbo_vorschlag WHERE mandant_id=p_mandant AND status='offen';
    RETURN n;
END;
$$;

-- =============================================================================
--  REGELWERK
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_regeln_ausfuehren(p_mandant uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE r record; v_id uuid; n int := 0;
BEGIN
  -- ---- A-02: Erstkontakt für neue Leads, SLA nach Kategorie -----------------
  FOR r IN SELECT l.*, k.vorname, k.nachname, q.bezeichnung AS quelle
             FROM crm_lead l JOIN crm_kontakt k ON k.id=l.kontakt_id
             JOIN crm_lead_quelle q ON q.id=l.quelle_id
            WHERE l.mandant_id=p_mandant AND l.status IN ('neu') AND l.erstkontakt_am IS NULL
              AND l.geloescht_am IS NULL
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-02',
      'Erstkontakt '||r.lead_kategorie||'-Lead: '||coalesce(r.vorname||' ','')||r.nachname,
      'Quelle: '||r.quelle||E'\nBedarf: '||r.bedarfsart||
        coalesce(E'\nBoot: '||r.boot_typ||' '||r.boot_laenge_m||' m, '||to_char(r.boot_wert_eur,'FM999G999')||' €','')||
        coalesce(E'\nHauptfälligkeit Bestand: '||r.hauptfaelligkeit_bestand,''),
      'erstkontakt',
      CASE r.lead_kategorie WHEN 'A' THEN 'kritisch' WHEN 'B' THEN 'hoch' ELSE 'normal' END,
      coalesce(r.erstkontakt_faellig_am, now()), r.verantwortlicher_id,'lead',r.id,
      round(coalesce(r.boot_wert_eur,0)*0.0075), r.erstkontakt_faellig_am,
      jsonb_build_object('lead_score',r.lead_score,'kategorie',r.lead_kategorie,
                         'score_erklaerung',r.score_erklaerung));
    n := n + 1;
  END LOOP;

  -- ---- A-05: SLA überschritten -> Eskalation Stufe 1 ------------------------
  UPDATE crm_aufgabe a SET eskalationsstufe = 1, eskaliert_am = now(), prioritaet='kritisch'
    FROM crm_lead l
   WHERE a.bezug_typ='lead' AND a.bezug_id=l.id AND a.typ='erstkontakt'
     AND a.status IN ('offen','in_arbeit') AND a.sla_frist < now() AND a.eskalationsstufe=0;

  -- ---- A-09: Muster M2 (Konfigurator abgebrochen) ---------------------------
  FOR r IN SELECT m.*, k.vorname, k.nachname, l.id AS lead_id, l.verantwortlicher_id
             FROM crm_signal_muster m
             JOIN crm_kontakt k ON k.id=m.kontakt_id
             LEFT JOIN crm_lead l ON l.kontakt_id=k.id AND l.status NOT IN ('konvertiert','disqualifiziert')
            WHERE m.mandant_id=p_mandant AND m.code='M2' AND m.erkannt_am::date=current_date
  LOOP
    IF r.lead_id IS NOT NULL THEN
      PERFORM crm_fn_aufgabe(p_mandant,'A-09',
        'Rückruf Konfigurator-Abbruch: '||coalesce(r.vorname||' ','')||r.nachname,
        'Prämienrechner wurde abgebrochen. Rückruf innerhalb von 4 Stunden (Muster M2).',
        'anruf','hoch', now()+interval '4 hours', r.verantwortlicher_id,'lead',r.lead_id,
        NULL, now()+interval '4 hours', jsonb_build_object('muster','M2','intent_score',r.intent_score));
      n := n + 1;
    END IF;
  END LOOP;

  -- ---- A-16: Muster M6 (Angebot mehrfach geöffnet) --------------------------
  FOR r IN SELECT o.id AS opp_id, o.name, o.wert_eur, o.verantwortlicher_id, ag.angebotsnummer,
                  ag.oeffnungen_anzahl, m.intent_score
             FROM crm_signal_muster m
             JOIN crm_kontakt k ON k.id=m.kontakt_id
             JOIN crm_opportunity o ON o.kontakt_id=k.id AND o.pipeline_stufe='angebot'
             JOIN crm_angebot ag ON ag.opportunity_id=o.id
            WHERE m.mandant_id=p_mandant AND m.code='M6' AND m.erkannt_am::date=current_date
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-16',
      'Sofort nachfassen: '||r.name,
      'Angebot '||r.angebotsnummer||' wurde '||r.oeffnungen_anzahl||'× geöffnet, zusätzlich Besuch der Tarifseite. '||
      'Entscheidung steht unmittelbar an (Muster M6).',
      'angebot_nachfassen','kritisch', now(), r.verantwortlicher_id,'opportunity',r.opp_id,
      r.wert_eur, now()+interval '6 hours', jsonb_build_object('muster','M6','oeffnungen',r.oeffnungen_anzahl));
    UPDATE crm_opportunity SET wahrscheinlichkeit = least(95, wahrscheinlichkeit + 15) WHERE id = r.opp_id;
    n := n + 1;
  END LOOP;

  -- ---- A-11: Angebotsnachfassung T+3 ---------------------------------------
  FOR r IN SELECT ag.*, o.name, o.wert_eur, o.verantwortlicher_id
             FROM crm_angebot ag JOIN crm_opportunity o ON o.id=ag.opportunity_id
            WHERE ag.mandant_id=p_mandant AND ag.status IN ('versendet','geoeffnet')
              AND ag.versendet_am <= now()-interval '3 days'
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-11',
      'Angebot '||r.angebotsnummer||' nachfassen (T+3)',
      'Angebot über '||to_char(r.praemie_brutto_eur,'FM999G999')||' € versendet am '||
      to_char(r.versendet_am,'DD.MM.YYYY')||'. Pflichtnachfassung laut Staffel W-01.',
      'angebot_nachfassen','hoch', date_trunc('day',now())+interval '9 hours', r.verantwortlicher_id,
      'opportunity',r.opportunity_id, r.wert_eur, NULL,
      jsonb_build_object('angebot',r.angebotsnummer,'oeffnungen',r.oeffnungen_anzahl));
    n := n + 1;
  END LOOP;

  -- ---- A-12: Angebot läuft in <= 3 Tagen ab --------------------------------
  FOR r IN SELECT ag.*, o.name, o.wert_eur, o.verantwortlicher_id
             FROM crm_angebot ag JOIN crm_opportunity o ON o.id=ag.opportunity_id
            WHERE ag.mandant_id=p_mandant AND ag.status IN ('versendet','geoeffnet','in_verhandlung')
              AND ag.gueltig_bis <= current_date+3
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-12',
      'Angebot '||r.angebotsnummer||' läuft am '||to_char(r.gueltig_bis,'DD.MM.')||' ab',
      'Gültigkeit endet in '||(r.gueltig_bis-current_date)||' Tagen. Verlängerung oder Entscheidung herbeiführen.',
      'angebot_nachfassen','kritisch', date_trunc('day',now())+interval '8 hours', r.verantwortlicher_id,
      'opportunity',r.opportunity_id, r.wert_eur, r.gueltig_bis::timestamptz,
      jsonb_build_object('angebot',r.angebotsnummer,'gueltig_bis',r.gueltig_bis));
    n := n + 1;
  END LOOP;

  -- ---- A-21: Hauptfälligkeit T-90 / T-60 / T-30 ----------------------------
  -- D2: Aggregation je Kunde. Vorher lief die Schleife je Vertrag und summierte
  -- den Wert im Aufgabenhelfer auf — das kumulierte über Nachtläufe hinweg.
  FOR r IN SELECT v.kunde_id, k.bezeichnung, k.betreuer_id, k.customer_value_score,
                  min(v.hauptfaelligkeit) AS hauptfaelligkeit,
                  min(v.hauptfaelligkeit - current_date)::int AS tage,
                  sum(v.jahrespraemie_eur) AS praemie_summe,
                  count(*) AS anzahl_policen,
                  max(v.praemienaenderung_prozent) AS max_aenderung,
                  string_agg(v.policennummer, ', ' ORDER BY v.policennummer) AS policen
             FROM crm_vertrag_ref v JOIN crm_kunde k ON k.id=v.kunde_id
            WHERE v.mandant_id=p_mandant AND v.status='aktiv'
              AND v.hauptfaelligkeit BETWEEN current_date AND current_date+90
            GROUP BY v.kunde_id, k.bezeichnung, k.betreuer_id, k.customer_value_score
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-21',
      'Hauptfälligkeitsgespräch: '||r.bezeichnung,
      CASE WHEN r.anzahl_policen>1
           THEN r.anzahl_policen||' Policen ('||r.policen||') laufen am '
           ELSE 'Police '||r.policen||' läuft am ' END||
      to_char(r.hauptfaelligkeit,'DD.MM.YYYY')||' zur Hauptfälligkeit ('||r.tage||' Tage). '||
      'Gefährdete Jahresprämie '||to_char(r.praemie_summe,'FM999G999')||' €'||
      CASE WHEN r.max_aenderung > 0 THEN ', letzte Anpassung +'||r.max_aenderung||' %' ELSE '' END||'.',
      'hauptfaelligkeit', CASE WHEN r.tage <= 30 THEN 'kritisch' WHEN r.tage <= 60 THEN 'hoch' ELSE 'normal' END,
      crm_fn_hauptfaelligkeit_termin(r.tage),
      r.betreuer_id,'kunde',r.kunde_id, r.praemie_summe, NULL,
      jsonb_build_object('policen',r.policen,'anzahl',r.anzahl_policen,
                         'hauptfaelligkeit',r.hauptfaelligkeit,'tage',r.tage));
    n := n + 1;
  END LOOP;

  -- ---- A-22: Jahresgespräch ------------------------------------------------
  FOR r IN SELECT k.* FROM crm_kunde k
            WHERE k.mandant_id=p_mandant AND k.status='aktiv'
              AND k.naechstes_jahresgespraech_am IS NOT NULL
              AND k.naechstes_jahresgespraech_am <= current_date+30
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-22',
      'Jahresgespräch: '||r.bezeichnung,
      CASE WHEN r.naechstes_jahresgespraech_am < current_date
           THEN 'ÜBERFÄLLIG seit '||(current_date-r.naechstes_jahresgespraech_am)||' Tagen.'
           ELSE 'Fällig am '||to_char(r.naechstes_jahresgespraech_am,'DD.MM.YYYY')||'.' END||
      ' Kundenwert '||r.customer_value_score||', Jahresprämie '||to_char(r.jahrespraemie_eur,'FM999G999')||' €.',
      'jahresgespraech', CASE WHEN r.naechstes_jahresgespraech_am < current_date-90 THEN 'hoch' ELSE 'normal' END,
      greatest(now(), r.naechstes_jahresgespraech_am::timestamptz), r.betreuer_id,'kunde',r.id,
      r.jahrespraemie_eur, NULL, jsonb_build_object('cvs',r.customer_value_score));
    n := n + 1;
  END LOOP;

  -- ---- A-23: Bootswert seit > 24 Monaten ungeprüft --------------------------
  FOR r IN SELECT DISTINCT ON (k.id) k.id AS kunde_id, k.bezeichnung, k.betreuer_id, b.name AS bootsname,
                  b.wert_geprueft_am, b.wert_eur
             FROM crm_kunde k JOIN crm_boot_ref b ON b.kunde_id=k.id AND b.status='aktiv'
            WHERE k.mandant_id=p_mandant AND k.status='aktiv' AND b.wert_geprueft_am < current_date-730
            ORDER BY k.id, b.wert_geprueft_am
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-23',
      'Wertprüfung: '||r.bootsname||' ('||r.bezeichnung||')',
      'Letzte Wertprüfung am '||to_char(r.wert_geprueft_am,'DD.MM.YYYY')||' — '||
      round((current_date-r.wert_geprueft_am)/30.0)||' Monate her. Versicherungswert '||
      to_char(r.wert_eur,'FM999G999')||' €. Unterversicherungsrisiko prüfen.',
      'wertpruefung','normal', now()+interval '20 days', r.betreuer_id,'kunde',r.kunde_id,
      round(r.wert_eur*0.001), NULL, jsonb_build_object('boot',r.bootsname));
    n := n + 1;
  END LOOP;

  -- ---- A-24 / A-25: Kündigungsrisiko ---------------------------------------
  FOR r IN SELECT k.*, cb.top_treiber
             FROM crm_kunde k
             JOIN LATERAL (SELECT top_treiber FROM crm_churn_bewertung c
                            WHERE c.kunde_id=k.id ORDER BY berechnet_am DESC LIMIT 1) cb ON true
            WHERE k.mandant_id=p_mandant AND k.status='aktiv' AND k.risk_score >= 65
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,
      CASE WHEN r.customer_value_score >= 70 THEN 'A-25' ELSE 'A-24' END,
      'Rückholgespräch: '||r.bezeichnung,
      'Kündigungsrisiko '||r.risk_score||' ('||r.risiko_stufe||') bei Kundenwert '||r.customer_value_score||'. '||
      'Jahresprämie '||to_char(r.jahrespraemie_eur,'FM999G999')||' € gefährdet. '||
      CASE WHEN r.customer_value_score >= 70 THEN 'Höchste Priorität — Eskalation an die Vertriebsleitung nach 5 Werktagen.' ELSE '' END,
      'rueckhol_kontakt','kritisch', now()+interval '2 days',
      r.betreuer_id,'kunde',r.id, r.jahrespraemie_eur, now()+interval '5 days',
      jsonb_build_object('risk_score',r.risk_score,'customer_value_score',r.customer_value_score,
                         'top_treiber',r.top_treiber));
    n := n + 1;
  END LOOP;

  -- ---- A-28: Empfehlungsanfrage --------------------------------------------
  FOR r IN SELECT k.* FROM crm_kunde k
            WHERE k.mandant_id=p_mandant AND k.status='aktiv'
              AND k.customer_value_score >= 65 AND k.risk_score < 35
              AND NOT EXISTS (SELECT 1 FROM crm_schaden_ref s WHERE s.kunde_id=k.id AND s.beschwerde
                              AND s.schadendatum > current_date-365)
              AND NOT EXISTS (SELECT 1 FROM crm_empfehlung e WHERE e.empfehlungsgeber_kunde_id=k.id
                              AND e.eingegangen_am > now()-interval '270 days')
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-28',
      'Empfehlung erbitten: '||r.bezeichnung,
      'Kundenwert '||r.customer_value_score||', Risiko '||r.risk_score||' — ideale Voraussetzung. '||
      'Letzte Empfehlungsanfrage liegt mehr als 9 Monate zurück.',
      'empfehlungsanfrage','normal', now()+interval '10 days', r.betreuer_id,'kunde',r.id,
      NULL,NULL,jsonb_build_object('cvs',r.customer_value_score,'risk',r.risk_score));
    n := n + 1;
  END LOOP;

  -- ---- A-30: Next Best Offer -> Opportunity + Aufgabe -----------------------
  FOR r IN SELECT nb.*, k.bezeichnung, k.betreuer_id, k.team_id, k.haupt_kontakt_id
             FROM crm_nbo_vorschlag nb JOIN crm_kunde k ON k.id=nb.kunde_id
            WHERE nb.mandant_id=p_mandant AND nb.status='offen'
              AND (nb.erwarteter_wert_eur >= 200 OR nb.trefferwahrscheinlichkeit >= 0.40)
  LOOP
    v_id := crm_fn_nbo_opportunity(p_mandant, r.id);   -- D4: keine zweite Chance je Regel und Kunde

    PERFORM crm_fn_aufgabe(p_mandant,'A-30',
      'Cross-Sell ansprechen: '||r.bezeichnung,
      r.begruendung||E'\nErwarteter Wert: '||to_char(r.erwarteter_wert_eur,'FM999G999')||' € · Trefferquote '||
      round(r.trefferwahrscheinlichkeit*100)||' %',
      'anruf','normal', now()+interval '7 days', r.betreuer_id,'opportunity',v_id,
      r.erwarteter_wert_eur,NULL,
      jsonb_build_object('nbo_regel',r.regel_code,'trefferquote',r.trefferwahrscheinlichkeit));
    n := n + 1;
  END LOOP;

  -- ---- A-34: Empfehlung eingegangen ----------------------------------------
  FOR r IN SELECT e.*, coalesce(l.verantwortlicher_id,
                  (SELECT betreuer_id FROM crm_kunde WHERE id=e.empfehlungsgeber_kunde_id),
                  (SELECT betreuer_id FROM crm_partner WHERE id=e.empfehlungsgeber_partner_id)) AS zustaendig
             FROM crm_empfehlung e LEFT JOIN crm_lead l ON l.id=e.erzeugter_lead_id
            WHERE e.mandant_id=p_mandant AND e.status='eingegangen'
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-34',
      'Empfehlung bearbeiten: '||r.empfohlener_name,
      'Empfehlung eingegangen am '||to_char(r.eingegangen_am,'DD.MM.YYYY')||'. '||
      'SLA Erstkontakt: 24 Stunden. Dank an den Empfehlungsgeber ist Pflicht.',
      'empfehlung_bearbeiten','hoch', r.eingegangen_am+interval '24 hours',
      coalesce(r.zustaendig,(SELECT id FROM crm_benutzer_ref WHERE rolle='vertrieb' AND mandant_id=p_mandant LIMIT 1)),
      'empfehlung',r.id,NULL, r.eingegangen_am+interval '24 hours',
      jsonb_build_object('empfohlener',r.empfohlener_name));
    n := n + 1;
  END LOOP;

  -- ---- A-35: Empfehlung ohne Rückmeldung an den Geber ----------------------
  FOR r IN SELECT e.*, coalesce((SELECT betreuer_id FROM crm_kunde WHERE id=e.empfehlungsgeber_kunde_id),
                  (SELECT betreuer_id FROM crm_partner WHERE id=e.empfehlungsgeber_partner_id)) AS zustaendig
             FROM crm_empfehlung e
            WHERE e.mandant_id=p_mandant AND e.rueckmeldung_am IS NULL
              AND e.eingegangen_am < now()-interval '14 days'
              AND e.status NOT IN ('ungueltig')
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-35',
      'Rückmeldung an Empfehlungsgeber offen',
      'Die Empfehlung für '||r.empfohlener_name||' ist seit '||
      round(EXTRACT(epoch FROM (now()-r.eingegangen_am))/86400)||' Tagen ohne Rückmeldung an den Geber. '||
      'Ohne Rückmeldung gibt es keine zweite Empfehlung.',
      'empfehlung_bearbeiten','hoch', now()+interval '2 days',
      coalesce(r.zustaendig,(SELECT id FROM crm_benutzer_ref WHERE rolle='vertrieb' AND mandant_id=p_mandant LIMIT 1)),
      'empfehlung',r.id,NULL,NULL,jsonb_build_object('empfohlener',r.empfohlener_name));
    n := n + 1;
  END LOOP;

  -- ---- A-37: Partnerkontakt überfällig -------------------------------------
  FOR r IN SELECT p.* FROM crm_partner p
            WHERE p.mandant_id=p_mandant AND p.kooperationsstatus IN ('aktiv','exklusiv')
              AND p.partner_value_score >= 40
              AND coalesce(p.letzter_kontakt_am, now()-interval '999 days') < now()-interval '90 days'
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-37',
      'Partnerpflege: '||r.name,
      'Letzter Kontakt vor '||round(EXTRACT(epoch FROM (now()-r.letzter_kontakt_am))/86400)||' Tagen. '||
      r.zugefuehrte_leads||' zugeführte Leads, '||to_char(r.umsatz_eur,'FM999G999')||' € Umsatz. Partnerwert '||r.partner_value_score||'.',
      'partner_pflege','normal', now()+interval '10 days', r.betreuer_id,'partner',r.id,
      NULL,NULL,jsonb_build_object('partner_value',r.partner_value_score));
    n := n + 1;
  END LOOP;

  -- ---- A-15: Stillstand in der Pipelinestufe -------------------------------
  UPDATE crm_opportunity o SET risiko_flags = risiko_flags || jsonb_build_object('stillstand',true)
   WHERE o.mandant_id=p_mandant AND o.pipeline_stufe NOT IN ('gewonnen','verloren','pausiert')
     AND o.stufe_seit < now() - (CASE o.pipeline_stufe WHEN 'neu' THEN interval '3 days'
                                 WHEN 'in_bearbeitung' THEN interval '14 days'
                                 WHEN 'angebot' THEN interval '21 days'
                                 ELSE interval '14 days' END);
  FOR r IN SELECT o.* FROM crm_opportunity o
            WHERE o.mandant_id=p_mandant AND (o.risiko_flags->>'stillstand')::boolean
              AND o.pipeline_stufe NOT IN ('gewonnen','verloren','pausiert')
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-15',
      'Stillstand klären: '||r.name,
      'Seit '||round(EXTRACT(epoch FROM (now()-r.stufe_seit))/86400)||' Tagen in Stufe "'||r.pipeline_stufe||
      '" (zulässige Verweildauer überschritten). Nächsten Schritt festlegen oder Chance schließen.',
      'eskalation', CASE WHEN r.wert_eur >= 10000 THEN 'kritisch' ELSE 'hoch' END,
      now()+interval '1 day', r.verantwortlicher_id,'opportunity',r.id, r.wert_eur, NULL,
      jsonb_build_object('stufe',r.pipeline_stufe,'tage_in_stufe',round(EXTRACT(epoch FROM (now()-r.stufe_seit))/86400)));
    IF r.wert_eur >= 10000 THEN
      UPDATE crm_aufgabe SET eskalationsstufe=2, eskaliert_am=now()
       WHERE bezug_typ='opportunity' AND bezug_id=r.id AND regel_code='A-15' AND status='offen';
    END IF;
    n := n + 1;
  END LOOP;

  -- ---- A-14: Opportunity ohne offene Aufgabe (nach allen anderen Regeln) ----
  FOR r IN SELECT o.* FROM crm_opportunity o
            WHERE o.mandant_id=p_mandant AND o.pipeline_stufe NOT IN ('gewonnen','verloren')
              AND o.geloescht_am IS NULL
              AND NOT EXISTS (SELECT 1 FROM crm_aufgabe a WHERE a.bezug_typ='opportunity'
                              AND a.bezug_id=o.id AND a.status IN ('offen','in_arbeit'))
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-14',
      'Nächsten Schritt festlegen: '||r.name,
      'Diese Chance hat keine offene Aufgabe. Laut Systemregel O-1 ist das ein Datenfehler.',
      'anruf','hoch', now()+interval '1 day', r.verantwortlicher_id,'opportunity',r.id, r.wert_eur,NULL,
      jsonb_build_object('grund','opportunity_ohne_aufgabe'));
    n := n + 1;
  END LOOP;

  -- ---- A-01: Vergessenswächter für Leads ------------------------------------
  FOR r IN SELECT l.*, k.vorname, k.nachname FROM crm_lead l JOIN crm_kontakt k ON k.id=l.kontakt_id
            WHERE l.mandant_id=p_mandant
              AND l.status IN ('neu','in_bearbeitung','kontaktiert','qualifiziert')
              AND l.geloescht_am IS NULL
              AND NOT EXISTS (SELECT 1 FROM crm_aufgabe a WHERE a.bezug_typ='lead'
                              AND a.bezug_id=l.id AND a.status IN ('offen','in_arbeit'))
  LOOP
    PERFORM crm_fn_aufgabe(p_mandant,'A-01',
      'Nächsten Schritt festlegen: '||coalesce(r.vorname||' ','')||r.nachname,
      'Lead '||r.leadnummer||' (Status '||r.status||', Score '||r.lead_score||') hat keine offene Aufgabe. '||
      'Kein Lead darf liegen bleiben — Schritt festlegen oder mit Grund abschließen.',
      'anruf', CASE WHEN r.lead_kategorie IN ('A','B') THEN 'hoch' ELSE 'normal' END,
      now()+interval '1 day', r.verantwortlicher_id,'lead',r.id,
      round(coalesce(r.boot_wert_eur,0)*0.0075),NULL,
      jsonb_build_object('grund','lead_ohne_aufgabe','lead_score',r.lead_score));
    n := n + 1;
  END LOOP;

  -- ---- A-08: Lead ohne Signal > 180 Tage -> Nurturing -----------------------
  UPDATE crm_lead l SET status='nurturing'
   WHERE l.mandant_id=p_mandant AND l.status IN ('neu','in_bearbeitung','kontaktiert')
     AND coalesce((SELECT max(zeitstempel) FROM crm_signal s WHERE s.lead_id=l.id),
                  l.eingegangen_am) < now()-interval '180 days'
     AND NOT EXISTS (SELECT 1 FROM crm_aktivitaet a WHERE a.lead_id=l.id AND a.zeitstempel > now()-interval '180 days');

  RETURN n;
END;
$$;

-- =============================================================================
--  PRIORISIERUNG  (07_AUFGABENMODELL.md 7.5)
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_prioritaeten(p_mandant uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
    WITH basis AS (
        SELECT a.id, a.zugewiesen_an,
               coalesce(a.erwarteter_wert_eur,0) AS wert,
               CASE WHEN a.faellig_am < now() THEN 100
                    WHEN a.faellig_am::date = current_date THEN 80
                    WHEN a.faellig_am::date = current_date+1 THEN 60
                    WHEN a.faellig_am::date <= current_date+7 THEN 40
                    ELSE 20 END AS dringlichkeit,
               coalesce(k.customer_value_score, ko.customer_value_score, 0) AS cvs,
               coalesce(o.wahrscheinlichkeit, l.lead_score, 50) AS p_abschluss,
               coalesce(k.risk_score, ko.risk_score, 0) AS risk
        FROM crm_aufgabe a
        LEFT JOIN crm_kunde k       ON a.bezug_typ='kunde' AND k.id=a.bezug_id
        LEFT JOIN crm_opportunity o ON a.bezug_typ='opportunity' AND o.id=a.bezug_id
        LEFT JOIN crm_kunde ko      ON ko.id=o.kunde_id
        LEFT JOIN crm_lead l        ON a.bezug_typ='lead' AND l.id=a.bezug_id
        WHERE a.mandant_id=p_mandant AND a.status IN ('offen','in_arbeit')
    ), normiert AS (
        SELECT id, dringlichkeit, cvs, p_abschluss, risk,
               100*percent_rank() OVER (PARTITION BY zugewiesen_an ORDER BY wert) AS n_wert
        FROM basis
    )
    UPDATE crm_aufgabe a
       SET prioritaets_score = least(100, greatest(0, round(
             0.30*n.n_wert + 0.25*n.dringlichkeit + 0.20*n.cvs + 0.15*n.p_abschluss + 0.10*n.risk)::int))
      FROM normiert n WHERE n.id = a.id;

    -- Harte Überschreibungen (7.5)
    UPDATE crm_aufgabe a SET prioritaets_score=100, prioritaet='kritisch'
      FROM crm_lead l
     WHERE a.bezug_typ='lead' AND a.bezug_id=l.id AND l.lead_kategorie='A'
       AND a.sla_frist < now() AND a.status IN ('offen','in_arbeit');

    UPDATE crm_aufgabe a SET prioritaets_score=99, prioritaet='kritisch'
      FROM crm_kunde k
     WHERE a.bezug_typ='kunde' AND a.bezug_id=k.id
       AND k.risk_score >= 65 AND k.customer_value_score >= 70
       AND a.typ='rueckhol_kontakt' AND a.status IN ('offen','in_arbeit');

    UPDATE crm_aufgabe a SET prioritaets_score=98, prioritaet='kritisch'
      FROM crm_opportunity o JOIN crm_angebot ag ON ag.opportunity_id=o.id
     WHERE a.bezug_typ='opportunity' AND a.bezug_id=o.id
       AND ag.gueltig_bis <= current_date+3 AND o.wert_eur >= 5000
       AND ag.status IN ('versendet','geoeffnet','in_verhandlung')
       AND a.status IN ('offen','in_arbeit');

    UPDATE crm_aufgabe SET prioritaets_score=greatest(prioritaets_score,97)
     WHERE mandant_id=p_mandant AND eskalationsstufe=2 AND status IN ('offen','in_arbeit');

    SELECT count(*) INTO n FROM crm_aufgabe WHERE mandant_id=p_mandant AND status IN ('offen','in_arbeit');
    RETURN n;
END;
$$;

-- =============================================================================
--  ORCHESTRIERUNG: ein Nachtlauf
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_engine_lauf(p_mandant uuid) RETURNS TABLE(schritt text, ergebnis text) LANGUAGE plpgsql AS $$
DECLARE r record; sc crm_typ_score; n int;
BEGIN
    -- 1. Lead Scores
    n := 0;
    FOR r IN SELECT id FROM crm_lead WHERE mandant_id=p_mandant AND geloescht_am IS NULL LOOP
        sc := crm_fn_lead_score(r.id);
        UPDATE crm_lead SET lead_score=sc.score, lead_kategorie=sc.kategorie, score_regel=sc.score,
               score_erklaerung=sc.erklaerung, score_berechnet_am=now(),
               intent_score=crm_fn_intent_score(kontakt_id)
         WHERE id=r.id;
        INSERT INTO crm_score_lead_historie (mandant_id,lead_id,score,kategorie,score_regel,modell_version,erklaerung)
        VALUES (p_mandant,r.id,sc.score,sc.kategorie,sc.score,'regelmodell-1.0',sc.erklaerung);
        n := n+1;
    END LOOP;
    schritt := '1. Lead Scores'; ergebnis := n||' Leads bewertet'; RETURN NEXT;

    -- 2. Engagement / letztes Signal fortschreiben
    UPDATE crm_kontakt k SET letztes_signal_am = s.letztes,
           engagement_score = greatest(0, least(100, round(crm_fn_intent_score(k.id))::int))
      FROM (SELECT kontakt_id, max(zeitstempel) AS letztes FROM crm_signal GROUP BY kontakt_id) s
     WHERE s.kontakt_id = k.id;
    schritt := '2. Engagement'; ergebnis := 'aktualisiert'; RETURN NEXT;

    -- 3. Customer Value + Risiko
    n := 0;
    FOR r IN SELECT id FROM crm_kunde WHERE mandant_id=p_mandant AND geloescht_am IS NULL LOOP
        PERFORM crm_fn_customer_value(r.id);
        PERFORM crm_fn_risk(r.id);
        n := n+1;
    END LOOP;
    schritt := '3. Kundenscores'; ergebnis := n||' Kunden bewertet (CVS + Risiko)'; RETURN NEXT;

    -- 4. VIP-Rollen
    UPDATE crm_kontakt k SET rollen = array_append(rollen,'vip')
      FROM crm_kunde kd
     WHERE kd.haupt_kontakt_id=k.id AND kd.customer_value_score >= 80
       AND current_date - kd.kunde_seit >= 730 AND NOT ('vip' = ANY(k.rollen));
    schritt := '4. VIP-Rollen'; ergebnis := 'geprüft'; RETURN NEXT;

    -- 5. Muster
    n := crm_fn_muster_erkennen(p_mandant);
    schritt := '5. Signalmuster'; ergebnis := n||' Muster erkannt'; RETURN NEXT;

    -- 6. Next Best Offer
    n := crm_fn_next_best_offer(p_mandant);
    schritt := '6. Next Best Offer'; ergebnis := n||' Vorschläge'; RETURN NEXT;

    -- 7. Regelwerk
    n := crm_fn_regeln_ausfuehren(p_mandant);
    schritt := '7. Regelwerk'; ergebnis := n||' Regelauslösungen'; RETURN NEXT;

    -- 8. Priorisierung
    n := crm_fn_prioritaeten(p_mandant);
    schritt := '8. Priorisierung'; ergebnis := n||' offene Aufgaben priorisiert'; RETURN NEXT;

    -- 9. Signale als verarbeitet markieren
    UPDATE crm_signal SET verarbeitet=true, verarbeitet_am=now() WHERE mandant_id=p_mandant AND NOT verarbeitet;
    schritt := '9. Signale'; ergebnis := 'verarbeitet'; RETURN NEXT;
END;
$$;
