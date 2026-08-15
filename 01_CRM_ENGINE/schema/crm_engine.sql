-- =============================================================================
--  CALLIDUS BOAT INTELLIGENCE PLATFORM
--  Modul 01_CRM_ENGINE — Engine, Fassung 1.3
--  PostgreSQL >= 15
--
--  Ausführbarer Stand aller Scoring-, Regel- und Lastschutzfunktionen.
--  Setzt crm_schema.sql voraus und ist zusammen mit diesem die vollständige
--  Auslieferung des Moduls:
--
--      psql -f schema/crm_schema.sql
--      psql -f schema/crm_engine.sql
--
--  Diese Datei ist aus der geprüften Datenbank erzeugt und entspricht exakt dem
--  Stand, gegen den die Testsuite 29 von 29 Prüfungen bestanden hat — im
--  Demobestand und gegen 5.009 Leads.
--
--  Die Entstehungsgeschichte mit allen Korrekturen K1–K9, D1–D4 und O1–O2 liegt
--  nachvollziehbar in demo/ (05_kalibrierung_v11.sql bis 10_optimierung.sql).
--  Für einen Neuaufbau ist ausschließlich diese Datei maßgeblich.
--
--  Inhalt
--    1  crm_fn_intent_score            Signalverdichtung mit Zeitverfall
--    2  crm_fn_lead_score              Lead Score, Privat- und Gewerbezweig,
--                                      Normierung auf erreichbare Punkte
--    3  crm_fn_customer_value          Customer Value Score
--    4  crm_fn_risk                    Kündigungsrisiko inkl. Eskalatoren
--    5  crm_fn_ist_stiller_rueckzug    Einheitliche Definition von Stille
--    6  crm_fn_aufgabe                 Aufgabenhelfer mit Duplikatsschutz
--    7  crm_fn_hauptfaelligkeit_termin Staffelpunkt T-90/T-60/T-30
--    8  crm_fn_muster_erkennen         Signalmuster M1–M8
--    9  crm_fn_next_best_offer         Cross-/Upsell-Vorschläge
--   10  crm_fn_nbo_opportunity         Chance je Vorschlag, idempotent
--   11  crm_fn_regeln_ausfuehren       Regelwerk A-01 bis A-37
--   12  crm_fn_prioritaeten            Prioritätsscore und Überschreibungen
--   13  crm_fn_lastschutz_zuruecksetzen
--   14  crm_fn_lastschutz              Bündelung und Staffelung
--   15  crm_fn_kapazitaetswarnung      Eskalation bei Überlast (A-49)
--   16  crm_fn_engine_lauf             Orchestrierung des Nachtlaufs
--   17  crm_fn_regelkatalog_anlegen    Regelkatalog A-01 bis A-49 je Mandant
--
--  Ergänzende Indizes für die Engine stehen am Ende der Datei.
-- =============================================================================

SET client_min_messages = warning;

DROP TYPE IF EXISTS crm_typ_score CASCADE;
CREATE TYPE crm_typ_score AS (score int, kategorie text, erklaerung jsonb);

CREATE OR REPLACE FUNCTION public.crm_fn_intent_score(p_kontakt uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE
AS $function$
    SELECT coalesce(round(sum(
             st.basisgewicht *
             exp(-ln(2) * (EXTRACT(epoch FROM (now() - s.zeitstempel))/86400.0) / st.halbwertszeit_tage)
           )::numeric, 2), 0)
    FROM crm_signal s
    JOIN crm_signal_typ st ON st.id = s.signal_typ_id
    WHERE s.kontakt_id = p_kontakt
      AND s.zeitstempel > now() - interval '365 days';
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_lead_score(p_lead uuid)
 RETURNS crm_typ_score
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    l crm_lead%ROWTYPE; k crm_kontakt%ROWTYPE; q crm_lead_quelle%ROWTYPE;
    gewerblich boolean;
    max_a int; max_b int; max_c int; max_d int := 15;
    a int := 0; b int := 0; c numeric := 0; d int := 0; bonus int := 0;
    c_erreichbar numeric := 0;
    faktor numeric := 1.0; tage_seit_signal numeric;
    n_web int := 0; n_tarif int := 0; n_doc1 int := 0; n_doc2 int := 0;
    n_nl_open int := 0; n_nl_klick int := 0; v_termin int := 0; v_termin_wahr int := 0;
    hat_tracking boolean; hat_newsletter boolean; hat_kontakt boolean;
    g_web numeric; g_nl numeric; g_kontakt numeric;
    roh numeric; v_final int; erkl jsonb := '[]'::jsonb; res crm_typ_score;
BEGIN
    SELECT * INTO l FROM crm_lead WHERE id=p_lead;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT * INTO k FROM crm_kontakt WHERE id=l.kontakt_id;
    SELECT * INTO q FROM crm_lead_quelle WHERE id=l.quelle_id;

    gewerblich := coalesce(l.nutzungsart,'') LIKE 'gewerblich%'
               OR l.bedarfsart IN ('flotte','charter')
               OR l.unternehmerstatus
               OR l.anzahl_objekte >= 3;

    IF gewerblich THEN max_a := 45; max_b := 25; max_c := 15;
    ELSE            max_a := 30; max_b := 20; max_c := 35;
    END IF;

    -- ================= Block A: Objekt und Wert =================
    IF gewerblich THEN
        a := a + CASE WHEN l.boot_wert_eur>=1000000 THEN 22 WHEN l.boot_wert_eur>=500000 THEN 19
                      WHEN l.boot_wert_eur>=250000 THEN 15 WHEN l.boot_wert_eur>=100000 THEN 11
                      WHEN l.boot_wert_eur IS NOT NULL THEN 6 ELSE 0 END;
        IF l.boot_wert_eur IS NOT NULL THEN
            erkl := erkl || jsonb_build_object('faktor',
              CASE WHEN l.anzahl_objekte>1 THEN 'Flottenwert ' ELSE 'Objektwert ' END
              ||to_char(l.boot_wert_eur,'FM999G999')||' €',
              'punkte',CASE WHEN l.boot_wert_eur>=1000000 THEN 22 WHEN l.boot_wert_eur>=500000 THEN 19
                            WHEN l.boot_wert_eur>=250000 THEN 15 WHEN l.boot_wert_eur>=100000 THEN 11 ELSE 6 END,
              'richtung','positiv'); END IF;
        a := a + CASE WHEN l.anzahl_objekte>=10 THEN 10 WHEN l.anzahl_objekte>=5 THEN 8
                      WHEN l.anzahl_objekte>=3 THEN 6 WHEN l.anzahl_objekte=2 THEN 3 ELSE 0 END;
        IF l.anzahl_objekte>1 THEN
            erkl := erkl || jsonb_build_object('faktor','Flotte mit '||l.anzahl_objekte||' Objekten',
              'punkte',CASE WHEN l.anzahl_objekte>=10 THEN 10 WHEN l.anzahl_objekte>=5 THEN 8
                            WHEN l.anzahl_objekte>=3 THEN 6 ELSE 3 END,'richtung','positiv'); END IF;
        a := a + CASE WHEN l.boot_laenge_m>=18 THEN 6 WHEN l.boot_laenge_m>=12 THEN 5
                      WHEN l.boot_laenge_m>=8 THEN 3 WHEN l.boot_laenge_m IS NOT NULL THEN 1 ELSE 0 END;
        a := a + CASE WHEN l.boot_baujahr IS NULL THEN 0
                      WHEN EXTRACT(year FROM current_date)-l.boot_baujahr<=5 THEN 4
                      WHEN EXTRACT(year FROM current_date)-l.boot_baujahr<=15 THEN 3 ELSE 1 END;
        a := a + CASE WHEN l.motorleistung_kw>=300 THEN 3 WHEN l.motorleistung_kw>=100 THEN 2
                      WHEN l.motorleistung_kw IS NOT NULL THEN 1 ELSE 0 END;
    ELSE
        a := a + CASE WHEN l.boot_wert_eur>=500000 THEN 15 WHEN l.boot_wert_eur>=200000 THEN 13
                      WHEN l.boot_wert_eur>=100000 THEN 10 WHEN l.boot_wert_eur>=50000 THEN 7
                      WHEN l.boot_wert_eur>=20000 THEN 4 WHEN l.boot_wert_eur IS NOT NULL THEN 2 ELSE 0 END;
        IF l.boot_wert_eur IS NOT NULL THEN
            erkl := erkl || jsonb_build_object('faktor','Bootswert '||to_char(l.boot_wert_eur,'FM999G999')||' €',
              'punkte',CASE WHEN l.boot_wert_eur>=500000 THEN 15 WHEN l.boot_wert_eur>=200000 THEN 13
                            WHEN l.boot_wert_eur>=100000 THEN 10 WHEN l.boot_wert_eur>=50000 THEN 7
                            WHEN l.boot_wert_eur>=20000 THEN 4 ELSE 2 END,'richtung','positiv'); END IF;
        a := a + CASE WHEN l.boot_laenge_m>=18 THEN 8 WHEN l.boot_laenge_m>=12 THEN 6
                      WHEN l.boot_laenge_m>=8 THEN 4 WHEN l.boot_laenge_m>=5 THEN 2 ELSE 0 END;
        a := a + CASE WHEN l.boot_baujahr IS NULL THEN 0
                      WHEN EXTRACT(year FROM current_date)-l.boot_baujahr<=5 THEN 4
                      WHEN EXTRACT(year FROM current_date)-l.boot_baujahr<=15 THEN 3
                      WHEN EXTRACT(year FROM current_date)-l.boot_baujahr<=30 THEN 2 ELSE 1 END;
        a := a + CASE WHEN l.motorleistung_kw>=300 THEN 3 WHEN l.motorleistung_kw>=100 THEN 2
                      WHEN l.motorleistung_kw IS NOT NULL THEN 1 ELSE 0 END;
    END IF;
    a := least(a, max_a);

    -- ================= Block B: Profil und Region =================
    IF gewerblich THEN
        b := b + CASE l.fahrgebiet WHEN 'weltweit' THEN 8 WHEN 'atlantik' THEN 8 WHEN 'mittelmeer' THEN 7
                                   WHEN 'nord_ostsee' THEN 6 WHEN 'kuestennah' THEN 4 WHEN 'binnen' THEN 2 ELSE 0 END;
        b := b + CASE WHEN l.nutzungsart='gewerblich_flotte' THEN 12 WHEN l.nutzungsart='gewerblich_charter' THEN 10
                      WHEN l.nutzungsart IN ('verein','regatta') THEN 5 ELSE 3 END;
        erkl := erkl || jsonb_build_object('faktor','Gewerbliches Segment ('||coalesce(l.nutzungsart,l.bedarfsart)||')',
          'punkte',CASE WHEN l.nutzungsart='gewerblich_flotte' THEN 12 WHEN l.nutzungsart='gewerblich_charter' THEN 10
                        WHEN l.nutzungsart IN ('verein','regatta') THEN 5 ELSE 3 END,'richtung','positiv');
    ELSE
        b := b + CASE l.fahrgebiet WHEN 'weltweit' THEN 7 WHEN 'atlantik' THEN 7 WHEN 'mittelmeer' THEN 6
                                   WHEN 'nord_ostsee' THEN 5 WHEN 'kuestennah' THEN 3 WHEN 'binnen' THEN 2 ELSE 0 END;
        b := b + CASE WHEN l.nutzungsart IN ('verein','regatta') THEN 4 ELSE 2 END;
    END IF;
    b := b + CASE WHEN k.plz IS NULL THEN 0 WHEN left(k.plz,1)='2' THEN 5 WHEN k.land='DE' THEN 3 ELSE 1 END;
    b := least(b, max_b);

    -- ================= Block C: Verhalten (erreichbarkeitsnormiert) =============
    hat_tracking   := coalesce(array_length(k.tracking_ids,1),0) > 0;
    hat_newsletter := EXISTS (SELECT 1 FROM crm_consent cs WHERE cs.kontakt_id=k.id
                              AND cs.kanal='email' AND cs.status='erteilt');
    hat_kontakt    := l.erstkontakt_am IS NOT NULL;
    -- Teilbudgets des Verhaltensblocks, auf max_c skaliert
    g_web     := max_c * 18.0/35.0;   -- Websitebesuche, Klick, Download
    g_nl      := max_c *  5.0/35.0;   -- Newsletter
    g_kontakt := max_c * 12.0/35.0;   -- Termin, Antwortverhalten

    IF hat_tracking THEN
        c_erreichbar := c_erreichbar + g_web;
        SELECT count(*) FILTER (WHERE st.code IN ('S-WEB-02','S-WEB-03')),
               count(*) FILTER (WHERE st.code='S-WEB-01'),
               count(*) FILTER (WHERE st.code='S-DOC-01'),
               count(*) FILTER (WHERE st.code='S-DOC-02')
          INTO n_web,n_tarif,n_doc1,n_doc2
          FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
         WHERE s.kontakt_id=l.kontakt_id AND s.zeitstempel>now()-interval '60 days';
        c := c + (g_web/18.0) * (
               CASE WHEN n_web>=8 THEN 7 WHEN n_web>=4 THEN 5 WHEN n_web>=2 THEN 3 WHEN n_web=1 THEN 1 ELSE 0 END
             + CASE WHEN n_tarif>0 THEN 5 ELSE 0 END
             + CASE WHEN n_doc1>0 THEN 6 ELSE 0 END + CASE WHEN n_doc2>0 THEN 3 ELSE 0 END);
        IF n_web>0 THEN erkl := erkl || jsonb_build_object('faktor',n_web||' Websitebesuche',
           'punkte',round((g_web/18.0)*CASE WHEN n_web>=8 THEN 7 WHEN n_web>=4 THEN 5 WHEN n_web>=2 THEN 3 ELSE 1 END),
           'richtung','positiv'); END IF;
        IF n_tarif>0 THEN erkl := erkl || jsonb_build_object('faktor','Klick auf Tarifseite',
           'punkte',round((g_web/18.0)*5),'richtung','positiv'); END IF;
        IF n_doc1>0 THEN erkl := erkl || jsonb_build_object('faktor','Download Bedingungen',
           'punkte',round((g_web/18.0)*6),'richtung','positiv'); END IF;
    END IF;
    IF hat_newsletter THEN
        c_erreichbar := c_erreichbar + g_nl;
        SELECT count(*) FILTER (WHERE st.code='S-NL-01'), count(*) FILTER (WHERE st.code IN ('S-NL-02','S-NL-03'))
          INTO n_nl_open,n_nl_klick
          FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
         WHERE s.kontakt_id=l.kontakt_id AND s.zeitstempel>now()-interval '60 days';
        c := c + (g_nl/5.0) * CASE WHEN n_nl_open>=3 AND n_nl_klick>=1 THEN 5 WHEN n_nl_open>=1 THEN 2 ELSE 0 END;
    END IF;
    IF hat_kontakt THEN
        c_erreichbar := c_erreichbar + g_kontakt;
        SELECT count(*) FILTER (WHERE act.typ IN ('termin','meeting')),
               count(*) FILTER (WHERE act.typ IN ('termin','meeting') AND act.ergebnis LIKE 'erreicht%')
          INTO v_termin,v_termin_wahr FROM crm_aktivitaet act WHERE act.lead_id=l.id;
        c := c + (g_kontakt/12.0) * (
               CASE WHEN v_termin_wahr>0 THEN 8 WHEN v_termin>0 THEN 6 ELSE 0 END
             + CASE WHEN l.reaktionszeit_minuten<=1440 THEN 4 WHEN l.reaktionszeit_minuten<=4320 THEN 2 ELSE 0 END);
        IF v_termin>0 THEN erkl := erkl || jsonb_build_object('faktor',
           'Termin '||CASE WHEN v_termin_wahr>0 THEN 'wahrgenommen' ELSE 'vereinbart' END,
           'punkte',round((g_kontakt/12.0)*CASE WHEN v_termin_wahr>0 THEN 8 ELSE 6 END),'richtung','positiv'); END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
               WHERE s.kontakt_id=l.kontakt_id AND st.code='S-NEG-01') THEN
        c := c - (max_c*3.0/35.0);
        erkl := erkl || jsonb_build_object('faktor','Newsletter abgemeldet','punkte',-round(max_c*3.0/35.0),'richtung','negativ');
    END IF;
    c := greatest(least(c, c_erreichbar), 0);

    SELECT EXTRACT(epoch FROM (now()-max(zeitstempel)))/86400.0 INTO tage_seit_signal
      FROM crm_signal WHERE kontakt_id=l.kontakt_id;
    IF tage_seit_signal IS NOT NULL AND tage_seit_signal>0 THEN c := c*exp(-0.015*tage_seit_signal); END IF;

    -- ================= Block D: Vertrauen und Netzwerk =================
    d := CASE q.code
            WHEN 'EMPF' THEN CASE WHEN EXISTS (SELECT 1 FROM crm_empfehlung e JOIN crm_kontakt gk
                                    ON gk.id=e.empfehlungsgeber_kontakt_id
                                    WHERE e.erzeugter_lead_id=l.id AND 'vip'=ANY(gk.rollen)) THEN 15 ELSE 12 END
            WHEN 'WERFT' THEN 11 WHEN 'HAENDL' THEN 11 WHEN 'MARINA' THEN 9 WHEN 'YCLUB' THEN 9
            WHEN 'PPORTAL' THEN 8 WHEN 'ACAD' THEN 5 WHEN 'MKTPL' THEN 5 ELSE 0 END;
    IF d>0 THEN erkl := erkl || jsonb_build_object('faktor','Quelle '||q.bezeichnung,'punkte',d,'richtung','positiv'); END IF;
    IF l.kunde_id IS NOT NULL THEN
        bonus := 10; erkl := erkl || jsonb_build_object('faktor','Bestandskunde des Hauses','punkte',10,'richtung','positiv'); END IF;

    -- ================= Normierung auf erreichbare Punkte =================
    roh := 100.0 * (a+b+c+d+bonus)
           / (max_a + max_b + c_erreichbar + max_d + CASE WHEN l.kunde_id IS NOT NULL THEN 10 ELSE 0 END);
    IF c_erreichbar < max_c THEN
        erkl := erkl || jsonb_build_object('faktor','Normierung: '||round(c_erreichbar)||' von '||max_c||
                ' Verhaltenspunkten erreichbar (kein '||
                CASE WHEN NOT hat_tracking THEN 'Web-Tracking'
                     WHEN NOT hat_kontakt THEN 'Erstkontakt' ELSE 'Newsletter' END||')',
                'richtung','multiplikator',
                'wert',round(100.0/(max_a+max_b+c_erreichbar+max_d),3));
    END IF;
    IF gewerblich THEN
        erkl := erkl || jsonb_build_object('faktor','Bewertung nach Gewerbezweig (Objekt 45 / Profil 25 / Verhalten 15)',
                'richtung','multiplikator','wert',1.0);
    END IF;

    -- ================= Timing =================
    IF l.hauptfaelligkeit_bestand IS NOT NULL THEN
        IF l.hauptfaelligkeit_bestand-current_date BETWEEN 30 AND 90 THEN faktor := 1.20;
        ELSIF l.hauptfaelligkeit_bestand-current_date BETWEEN 91 AND 180 THEN faktor := 1.10;
        ELSIF l.hauptfaelligkeit_bestand-current_date > 300 THEN faktor := 0.80; END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
               WHERE s.kontakt_id=l.kontakt_id AND st.code='S-OBJ-01' AND s.zeitstempel>now()-interval '60 days')
       THEN faktor := greatest(faktor,1.25); END IF;
    IF l.zeitfenster='sofort' THEN faktor := greatest(faktor,1.15); END IF;
    IF l.zeitfenster='unklar' THEN faktor := least(faktor,0.90); END IF;
    IF faktor<>1.0 THEN
        erkl := erkl || jsonb_build_object('faktor',
          CASE WHEN l.hauptfaelligkeit_bestand IS NOT NULL AND l.hauptfaelligkeit_bestand-current_date BETWEEN 30 AND 90
               THEN 'Hauptfälligkeit in '||(l.hauptfaelligkeit_bestand-current_date)||' Tagen'
               WHEN faktor=1.25 THEN 'Bootswechsel gemeldet'
               WHEN l.zeitfenster='sofort' THEN 'Zeitfenster: sofort'
               WHEN l.zeitfenster='unklar' THEN 'Zeitfenster unklar' ELSE 'Timing' END,
          'richtung','multiplikator','wert',faktor); END IF;

    v_final := least(100, greatest(0, round(roh*faktor)))::int;
    res.score := v_final;
    res.kategorie := CASE WHEN v_final>=80 THEN 'A' WHEN v_final>=60 THEN 'B' WHEN v_final>=35 THEN 'C' ELSE 'D' END;
    res.erklaerung := erkl;
    RETURN res;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_customer_value(p_kunde uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    kd crm_kunde%ROWTYPE; praemie numeric; ltv numeric; n_vertraege int; n_boote int;
    n_empf int; n_community int; ist_partner boolean;
    bw int:=0; bl int:=0; bv int:=0; bd int:=0; bn int:=0; bc int:=0; bp int:=0; modi int:=0;
    erreichbar int; quote numeric; summe int; erkl jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id=p_kunde;
    SELECT coalesce(sum(jahrespraemie_eur),0), count(*) INTO praemie,n_vertraege
      FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='aktiv';
    SELECT count(*) INTO n_boote FROM crm_boot_ref WHERE kunde_id=p_kunde AND status='aktiv';
    ltv := praemie * greatest(1,(current_date-coalesce(kd.kunde_seit,current_date))/365.0);

    bw := CASE WHEN praemie>=10000 THEN 30 WHEN praemie>=5000 THEN 25 WHEN praemie>=2500 THEN 19
               WHEN praemie>=1200 THEN 13 WHEN praemie>=500 THEN 8 WHEN praemie>0 THEN 4 ELSE 0 END;
    bl := CASE WHEN ltv>=60000 THEN 25 WHEN ltv>=25000 THEN 20 WHEN ltv>=10000 THEN 15
               WHEN ltv>=3000 THEN 9 WHEN ltv>0 THEN 4 ELSE 0 END;
    erkl := erkl || jsonb_build_object('faktor','Jahresprämie '||to_char(praemie,'FM999G999')||' €','punkte',bw,'richtung','positiv')
                 || jsonb_build_object('faktor','Lifetime Value '||to_char(ltv,'FM999G999')||' €','punkte',bl,'richtung','positiv');

    SELECT CASE WHEN count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren'))=0 THEN NULL
                ELSE count(*) FILTER (WHERE pipeline_stufe='gewonnen')::numeric
                     / count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren')) END
      INTO quote FROM crm_opportunity WHERE kunde_id=p_kunde;
    bv := CASE WHEN quote IS NULL THEN 3 WHEN quote>=0.8 THEN 10 WHEN quote>=0.6 THEN 8
               WHEN quote>=0.4 THEN 5 WHEN quote>=0.2 THEN 3 ELSE 1 END;
    bd := CASE WHEN n_boote=0 THEN 0 WHEN n_vertraege::numeric/n_boote>=3 THEN 5
               WHEN n_vertraege::numeric/n_boote>=2 THEN 3 WHEN n_vertraege>=1 THEN 1 ELSE 0 END;

    SELECT count(*) INTO n_empf FROM crm_empfehlung
     WHERE (empfehlungsgeber_kunde_id=p_kunde OR empfehlungsgeber_kontakt_id=kd.haupt_kontakt_id) AND status='gewonnen';
    bn := CASE WHEN n_empf>=5 THEN 15 WHEN n_empf>=3 THEN 12 WHEN n_empf=2 THEN 9 WHEN n_empf=1 THEN 6
               WHEN EXISTS (SELECT 1 FROM crm_empfehlung WHERE empfehlungsgeber_kunde_id=p_kunde
                            OR empfehlungsgeber_kontakt_id=kd.haupt_kontakt_id) THEN 3 ELSE 0 END;
    IF bn>0 THEN erkl := erkl || jsonb_build_object('faktor',
        CASE WHEN n_empf>0 THEN n_empf||' erfolgreiche Empfehlung(en)' ELSE 'Empfehlung ausgesprochen' END,
        'punkte',bn,'richtung','positiv'); END IF;

    SELECT count(*) INTO n_community FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
     WHERE s.kontakt_id=kd.haupt_kontakt_id AND st.kategorie IN ('event','academy','marketplace')
       AND s.zeitstempel>now()-interval '365 days';
    bc := CASE WHEN n_community>=4 THEN 5 WHEN n_community>=2 THEN 3 WHEN n_community=1 THEN 2 ELSE 0 END;

    SELECT EXISTS (SELECT 1 FROM crm_partner p WHERE p.organisation_id=kd.organisation_id) INTO ist_partner;
    bp := CASE WHEN ist_partner AND EXISTS (SELECT 1 FROM crm_partner p
                  WHERE p.organisation_id=kd.organisation_id AND p.zugefuehrte_leads>0) THEN 10
               WHEN ist_partner THEN 5 ELSE 0 END;
    IF bp>0 THEN erkl := erkl || jsonb_build_object('faktor','Kunde ist zugleich aktiver Partner','punkte',bp,'richtung','positiv'); END IF;

    -- K5: Der Partnerblock zählt nur für Kunden, die überhaupt Partner sein können
    erreichbar := 55 + 15 + 15 + 5 + CASE WHEN ist_partner THEN 10 ELSE 0 END;

    IF kd.kunde_seit IS NOT NULL THEN
        IF current_date-kd.kunde_seit>=3650 THEN modi:=modi+5;
        ELSIF current_date-kd.kunde_seit>=1825 THEN modi:=modi+3; END IF; END IF;
    IF kd.zahlungsverzug_tage>60 THEN modi:=modi-10; END IF;
    IF kd.schadenquote_prozent>120 THEN modi:=modi-8;
        erkl := erkl || jsonb_build_object('faktor','Schadenquote '||kd.schadenquote_prozent||' %','punkte',-8,'richtung','negativ'); END IF;
    IF (SELECT count(*) FROM crm_schaden_ref WHERE kunde_id=p_kunde AND beschwerde
          AND schadendatum>current_date-365)>=2 THEN modi:=modi-6; END IF;
    IF n_boote>=5 THEN modi:=modi+8;
        erkl := erkl || jsonb_build_object('faktor','Strategisches Segment: Flotte '||n_boote||' Boote','punkte',8,'richtung','positiv'); END IF;

    summe := greatest(0, least(100, round(100.0*(bw+bl+bv+bd+bn+bc+bp)/erreichbar)::int + modi));
    IF erreichbar < 100 THEN
        erkl := erkl || jsonb_build_object('faktor','Normierung: Partnerblock nicht anwendbar ('||erreichbar||' erreichbare Punkte)',
                'richtung','multiplikator','wert',round(100.0/erreichbar,3));
    END IF;

    INSERT INTO crm_kunde_score (kunde_id,mandant_id,customer_value_score,block_wirtschaft,block_vertrieb,
        block_netzwerk,block_community,block_partner,modifikatoren,kategorie,erklaerung,berechnet_am)
    VALUES (p_kunde,kd.mandant_id,summe,bw+bl,bv+bd,bn,bc,bp,modi,
        CASE WHEN summe>=80 THEN 'vip' WHEN summe>=60 THEN 'kern' WHEN summe>=35 THEN 'standard'
             WHEN summe>=15 THEN 'basis' ELSE 'beobachtung' END, erkl, now())
    ON CONFLICT (kunde_id) DO UPDATE SET customer_value_score=EXCLUDED.customer_value_score,
        block_wirtschaft=EXCLUDED.block_wirtschaft, block_vertrieb=EXCLUDED.block_vertrieb,
        block_netzwerk=EXCLUDED.block_netzwerk, block_community=EXCLUDED.block_community,
        block_partner=EXCLUDED.block_partner, modifikatoren=EXCLUDED.modifikatoren,
        kategorie=EXCLUDED.kategorie, erklaerung=EXCLUDED.erklaerung, berechnet_am=now();

    UPDATE crm_kunde SET customer_value_score=summe, jahrespraemie_eur=praemie,
        lifetime_value_eur=round(ltv,2), anzahl_vertraege=n_vertraege, anzahl_boote=n_boote,
        betreuungsstufe=CASE WHEN summe>=80 THEN 'vip' WHEN summe>=60 THEN 'kern' WHEN summe>=35 THEN 'standard'
                             WHEN summe>=15 THEN 'basis' ELSE 'beobachtung' END
     WHERE id=p_kunde;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_risk(p_kunde uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    kd crm_kunde%ROWTYPE; g_summe numeric:=0; g_max numeric:=0; score int; stufe text;
    merkmale jsonb:='{}'::jsonb; treiber jsonb:='[]'::jsonb; tage_kontakt numeric; erf numeric;
    hart boolean := false; stille boolean := false;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id=p_kunde;

    tage_kontakt := current_date - coalesce(kd.letzter_kontakt_am::date, kd.kunde_seit, current_date);
    erf := least(1.0, tage_kontakt/270.0);
    g_summe := g_summe+20*erf; g_max := g_max+20;
    merkmale := merkmale || jsonb_build_object('R-01',round(erf,2));
    IF erf>=0.6 THEN treiber := treiber || jsonb_build_object('faktor',round(tage_kontakt)||' Tage ohne Kontakt','punkte',round(20*erf),'richtung','negativ'); END IF;

    erf := CASE WHEN NOT EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
                WHERE s.kontakt_id=kd.haupt_kontakt_id AND st.kategorie='newsletter'
                  AND s.zeitstempel>now()-interval '365 days') THEN 1 ELSE 0 END;
    g_summe := g_summe+8*erf; g_max := g_max+8; merkmale := merkmale || jsonb_build_object('R-03',erf);

    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_schaden_ref WHERE kunde_id=p_kunde AND zufriedenheit<=2) THEN 1 ELSE 0 END;
    g_summe := g_summe+12*erf; g_max := g_max+12; merkmale := merkmale || jsonb_build_object('R-04',erf);
    IF erf=1 THEN treiber := treiber || jsonb_build_object('faktor','Schadenregulierung mit Zufriedenheit ≤ 2/5','punkte',12,'richtung','negativ'); END IF;

    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_schaden_ref WHERE kunde_id=p_kunde AND beschwerde
                             AND schadendatum>current_date-365) THEN 1 ELSE 0 END;
    g_summe := g_summe+10*erf; g_max := g_max+10; merkmale := merkmale || jsonb_build_object('R-05',erf);

    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='aktiv'
                             AND praemienaenderung_prozent>15) THEN 1 ELSE 0 END;
    g_summe := g_summe+12*erf; g_max := g_max+12; merkmale := merkmale || jsonb_build_object('R-06',erf);
    IF erf=1 THEN treiber := treiber || jsonb_build_object('faktor',
        'Prämienerhöhung '||(SELECT max(praemienaenderung_prozent) FROM crm_vertrag_ref
                             WHERE kunde_id=p_kunde AND status='aktiv')||' % zur letzten Hauptfälligkeit',
        'punkte',12,'richtung','negativ'); END IF;

    erf := CASE WHEN kd.naechstes_jahresgespraech_am IS NOT NULL
                 AND current_date-kd.naechstes_jahresgespraech_am>90 THEN 1 ELSE 0 END;
    g_summe := g_summe+8*erf; g_max := g_max+8; merkmale := merkmale || jsonb_build_object('R-12',erf);
    IF erf=1 THEN treiber := treiber || jsonb_build_object('faktor',
        'Jahresgespräch seit '||(current_date-kd.naechstes_jahresgespraech_am)||' Tagen überfällig','punkte',8,'richtung','negativ'); END IF;

    score := round(100*g_summe/nullif(g_max,0))::int;

    -- Eskalatoren: harte Ereignisse
    IF kd.zahlungsverzug_tage>30 THEN hart := true;
       merkmale := merkmale || jsonb_build_object('R-07',1);
       treiber := treiber || jsonb_build_object('faktor','Zahlungsverzug '||kd.zahlungsverzug_tage||' Tage','punkte',99,'richtung','negativ'); END IF;
    IF EXISTS (SELECT 1 FROM crm_boot_ref WHERE kunde_id=p_kunde AND status IN ('verkauft','abgemeldet'))
       AND NOT EXISTS (SELECT 1 FROM crm_boot_ref WHERE kunde_id=p_kunde AND status='aktiv') THEN hart := true;
       merkmale := merkmale || jsonb_build_object('R-08',1);
       treiber := treiber || jsonb_build_object('faktor','Boot verkauft, kein Nachfolgeobjekt','punkte',99,'richtung','negativ'); END IF;
    IF EXISTS (SELECT 1 FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='gekuendigt'
               AND ende_am>current_date-365) THEN hart := true;
       merkmale := merkmale || jsonb_build_object('R-10',1);
       treiber := treiber || jsonb_build_object('faktor','Teilkündigung in den letzten 12 Monaten','punkte',99,'richtung','negativ'); END IF;

    -- D3: Stille allein ist ausreichend. Wer seit mehr als 270 Tagen kein Wort
    -- gehört hat, ist in Abwanderung — unabhängig davon, ob sonst etwas auffällt.
    -- Ab einem Kundenwert von 35 lohnt der Rückholaufwand wirtschaftlich.
    IF kd.letzter_kontakt_am < now() - interval '270 days'
       AND coalesce(kd.customer_value_score,0) >= 35 THEN
        stille := true;
        merkmale := merkmale || jsonb_build_object('R-01-eskalator',1);
        treiber := treiber || jsonb_build_object(
            'faktor','Stiller Rückzug: '||round(tage_kontakt)||' Tage ohne jeden Kontakt',
            'punkte',98,'richtung','negativ');
    END IF;

    IF hart OR stille THEN score := greatest(score,65); END IF;
    stufe := CASE WHEN score>=65 THEN 'hoch' WHEN score>=35 THEN 'mittel' ELSE 'niedrig' END;

    INSERT INTO crm_churn_bewertung (mandant_id,kunde_id,risk_score,risiko_stufe,merkmale,top_treiber,modell_version)
    VALUES (kd.mandant_id,p_kunde,score,stufe,merkmale,
        coalesce((SELECT jsonb_agg(t) FROM (SELECT t FROM jsonb_array_elements(treiber) t
                  ORDER BY (t->>'punkte')::numeric DESC LIMIT 3) x),'[]'::jsonb),'regelmodell-1.3');
    UPDATE crm_kunde SET risk_score=score, risiko_stufe=stufe WHERE id=p_kunde;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_ist_stiller_rueckzug(p_kunde uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT k.status='aktiv'
       AND k.letzter_kontakt_am < now() - interval '270 days'
       AND coalesce(k.customer_value_score,0) >= 35
      FROM crm_kunde k WHERE k.id = p_kunde;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_aufgabe(p_mandant uuid, p_regel text, p_titel text, p_beschreibung text, p_typ text, p_prioritaet text, p_faellig timestamp with time zone, p_benutzer uuid, p_bezug_typ text, p_bezug uuid, p_wert numeric DEFAULT NULL::numeric, p_sla timestamp with time zone DEFAULT NULL::timestamp with time zone, p_kontext jsonb DEFAULT '{}'::jsonb, p_gruppe text DEFAULT NULL::text, p_wert_kumulieren boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE v_id uuid; v_vorhanden uuid; v_regel uuid;
BEGIN
    IF p_bezug IS NOT NULL THEN
        -- Läuft über idx_aufgabe_dedup (Teilindex auf bezug_typ, bezug_id, typ, regel_code)
        SELECT id INTO v_vorhanden FROM crm_aufgabe
         WHERE bezug_typ = p_bezug_typ AND bezug_id = p_bezug
           AND typ = p_typ AND regel_code = p_regel
           AND status IN ('offen','in_arbeit') AND quelle = 'automatisch'
         LIMIT 1;
    ELSE
        -- Läuft über idx_aufgabe_dedup_ohne_bezug
        SELECT id INTO v_vorhanden FROM crm_aufgabe
         WHERE mandant_id = p_mandant AND bezug_id IS NULL
           AND zugewiesen_an = p_benutzer AND regel_code = p_regel AND typ = p_typ
           AND gruppierungs_schluessel IS NOT DISTINCT FROM p_gruppe
           AND status IN ('offen','in_arbeit') AND quelle = 'automatisch'
         LIMIT 1;
    END IF;

    SELECT id INTO v_regel FROM crm_automation_regel
     WHERE code = p_regel AND mandant_id = p_mandant;

    IF v_vorhanden IS NOT NULL THEN
        UPDATE crm_aufgabe SET titel=p_titel, beschreibung=p_beschreibung,
               faellig_am=least(faellig_am,p_faellig), prioritaet=p_prioritaet, kontext=p_kontext,
               erwarteter_wert_eur = CASE WHEN p_wert_kumulieren
                                          THEN coalesce(erwarteter_wert_eur,0)+coalesce(p_wert,0)
                                          ELSE coalesce(p_wert,erwarteter_wert_eur) END
         WHERE id=v_vorhanden;
        IF v_regel IS NOT NULL THEN
            INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
            VALUES (p_mandant,v_regel,p_regel,p_bezug_typ,p_bezug,'uebersprungen',
                    jsonb_build_object('grund','aufgabe_bereits_offen','aufgabe_id',v_vorhanden));
        END IF;
        RETURN v_vorhanden;
    END IF;

    INSERT INTO crm_aufgabe (mandant_id,titel,beschreibung,typ,prioritaet,faellig_am,sla_frist,
        zugewiesen_an,bezug_typ,bezug_id,quelle,regel_code,erwarteter_wert_eur,kontext,gruppierungs_schluessel)
    VALUES (p_mandant,p_titel,p_beschreibung,p_typ,p_prioritaet,p_faellig,p_sla,p_benutzer,p_bezug_typ,p_bezug,
        'automatisch',p_regel,p_wert,p_kontext,p_gruppe)
    RETURNING id INTO v_id;

    IF v_regel IS NOT NULL THEN
        INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
        VALUES (p_mandant,v_regel,p_regel,p_bezug_typ,p_bezug,'erfolg',jsonb_build_object('aufgabe_id',v_id));
    END IF;
    RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_hauptfaelligkeit_termin(p_tage integer)
 RETURNS timestamp with time zone
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT date_trunc('day', now())
         + (CASE WHEN p_tage > 90 THEN p_tage - 90      -- noch vor T-90
                 WHEN p_tage > 60 THEN p_tage - 60      -- nächster Punkt: T-60
                 WHEN p_tage > 30 THEN p_tage - 30      -- nächster Punkt: T-30
                 ELSE 0 END || ' days')::interval
         + interval '9 hours';
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_muster_erkennen(p_mandant uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_next_best_offer(p_mandant uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_nbo_opportunity(p_mandant uuid, p_nbo uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE nb record; k record; v_id uuid;
BEGIN
    SELECT * INTO nb FROM crm_nbo_vorschlag WHERE id = p_nbo;
    SELECT * INTO k  FROM crm_kunde WHERE id = nb.kunde_id;

    -- Bereits offene Chance derselben Regel für denselben Kunden?
    SELECT id INTO v_id FROM crm_opportunity
     WHERE mandant_id = p_mandant AND kunde_id = nb.kunde_id
       AND ursprung = 'next_best_offer' AND regel_code = nb.regel_code
       AND pipeline_stufe NOT IN ('gewonnen','verloren')
       AND geloescht_am IS NULL
     LIMIT 1;

    IF v_id IS NOT NULL THEN
        UPDATE crm_opportunity
           SET wert_eur = nb.erwarteter_wert_eur, naechster_schritt_am = current_date + 7
         WHERE id = v_id;
    ELSE
        INSERT INTO crm_opportunity (mandant_id,opportunity_nummer,name,kunde_id,kontakt_id,boot_ref_id,
            wert_eur,wahrscheinlichkeit,produktinteresse,quelle_id,verantwortlicher_id,team_id,
            pipeline_stufe,erwartetes_abschlussdatum,naechster_schritt,naechster_schritt_am,ursprung,regel_code)
        -- Nummer muss über die Zeit eindeutig bleiben: eine frühere, bereits
        -- gewonnene oder verlorene Chance derselben Regel darf nicht kollidieren.
        VALUES (p_mandant,'O-NBO-'||to_char(now(),'YYYYMMDD')||'-'||substr(replace(nb.id::text,'-',''),1,8),
            k.bezeichnung||' — '||nb.regel_code||' — '||left(nb.begruendung,60),
            nb.kunde_id,k.haupt_kontakt_id,nb.boot_ref_id,
            nb.erwarteter_wert_eur,10,'{}',
            (SELECT id FROM crm_lead_quelle WHERE code='WEB' AND mandant_id=p_mandant),
            k.betreuer_id,k.team_id,'neu',current_date+60,'Bedarf ansprechen',current_date+7,
            'next_best_offer',nb.regel_code)
        RETURNING id INTO v_id;
    END IF;

    UPDATE crm_nbo_vorschlag SET status='opportunity_erzeugt', opportunity_id=v_id WHERE id=p_nbo;
    RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_regeln_ausfuehren(p_mandant uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_prioritaeten(p_mandant uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_lastschutz_zuruecksetzen(p_mandant uuid)
 RETURNS void
 LANGUAGE sql
AS $function$
    WITH weg AS (
        DELETE FROM crm_aufgabe
         WHERE mandant_id = p_mandant AND gruppierungs_schluessel = 'sammelaufgabe'
           AND status IN ('offen','in_arbeit')
        RETURNING id)
    UPDATE crm_aufgabe SET gruppierungs_schluessel = NULL
     WHERE mandant_id = p_mandant AND gruppierungs_schluessel = 'gebuendelt';
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_lastschutz(p_mandant uuid, p_tageslimit integer DEFAULT 25)
 RETURNS TABLE(schritt text, ergebnis text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    r record; v_sammel uuid; n_gebuendelt int := 0; n_sammel int := 0; n_verschoben int := 0;
BEGIN
    -- ---------------------------------------------------------------------
    -- 1. Bündelung gleichartiger Aufgaben
    --    Zuerst die Bündelung des Vorlaufs auflösen, damit der Schritt
    --    wiederholbar ist und keine Sammelaufgaben doppelt entstehen.
    -- ---------------------------------------------------------------------
    PERFORM crm_fn_lastschutz_zuruecksetzen(p_mandant);
    FOR r IN
        SELECT zugewiesen_an, regel_code, typ, count(*) AS anzahl,
               sum(coalesce(erwarteter_wert_eur,0)) AS wert_summe,
               min(faellig_am) AS frueheste
        FROM crm_aufgabe
        WHERE mandant_id = p_mandant
          AND status = 'offen' AND quelle = 'automatisch'
          AND prioritaet IN ('normal','niedrig')
          AND sla_frist IS NULL
          AND regel_code IN ('A-01','A-22','A-23','A-30','A-37','A-41')
          AND gruppierungs_schluessel IS DISTINCT FROM 'gebuendelt'
        GROUP BY zugewiesen_an, regel_code, typ
        HAVING count(*) > 5
    LOOP
        INSERT INTO crm_aufgabe (mandant_id,titel,beschreibung,typ,prioritaet,prioritaets_score,
            faellig_am,zugewiesen_an,bezug_typ,bezug_id,status,quelle,regel_code,
            erwarteter_wert_eur,checkliste,gruppierungs_schluessel,kontext)
        SELECT p_mandant,
               r.anzahl||' Vorgänge: '||max(a.titel) FILTER (WHERE true)||' (Sammelaufgabe)',
               'Gebündelt aus '||r.anzahl||' gleichartigen Aufgaben der Regel '||r.regel_code||
               '. Gesamtpotenzial '||to_char(r.wert_summe,'FM999G999')||' €. '||
               'Die Einzelvorgänge sind in der Checkliste aufgeführt und bleiben verknüpft.',
               r.typ, 'normal', 40, r.frueheste, r.zugewiesen_an, 'kein', NULL, 'offen',
               'automatisch', r.regel_code, r.wert_summe,
               coalesce(jsonb_agg(jsonb_build_object(
                   'aufgabe_id', a.id, 'titel', a.titel,
                   'bezug_typ', a.bezug_typ, 'bezug_id', a.bezug_id,
                   'wert_eur', a.erwarteter_wert_eur) ORDER BY a.prioritaets_score DESC), '[]'::jsonb),
               'sammelaufgabe',
               jsonb_build_object('gebuendelte_anzahl', r.anzahl, 'regel', r.regel_code)
        FROM crm_aufgabe a
        WHERE a.mandant_id = p_mandant AND a.status='offen' AND a.quelle='automatisch'
          AND a.zugewiesen_an = r.zugewiesen_an AND a.regel_code = r.regel_code AND a.typ = r.typ
          AND a.prioritaet IN ('normal','niedrig') AND a.sla_frist IS NULL
          AND a.gruppierungs_schluessel IS DISTINCT FROM 'gebuendelt'
        RETURNING id INTO v_sammel;

        -- Einzelaufgaben bleiben erhalten, verlassen aber die Tagesliste
        -- Status bleibt "offen": der Vorgang ist weiterhin abgedeckt (Versprechen V1).
        -- Nur die Tagesliste blendet ihn aus, dort steht die Sammelaufgabe.
        UPDATE crm_aufgabe a
           SET gruppierungs_schluessel = 'gebuendelt',
               kontext = a.kontext || jsonb_build_object('sammelaufgabe_id', v_sammel)
         WHERE a.mandant_id = p_mandant AND a.status='offen' AND a.quelle='automatisch'
           AND a.zugewiesen_an = r.zugewiesen_an AND a.regel_code = r.regel_code AND a.typ = r.typ
           AND a.prioritaet IN ('normal','niedrig') AND a.sla_frist IS NULL
           AND a.id <> v_sammel
           AND a.gruppierungs_schluessel IS DISTINCT FROM 'sammelaufgabe';
        GET DIAGNOSTICS n_gebuendelt = ROW_COUNT;

        -- Auch die Sammelaufgabe gehört ins Laufprotokoll (Nachvollziehbarkeit)
        INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
        SELECT p_mandant, ar.id, r.regel_code, 'kein', NULL, 'erfolg',
               jsonb_build_object('aufgabe_id', v_sammel, 'aktion', 'buendelung',
                                  'gebuendelte_anzahl', r.anzahl)
          FROM crm_automation_regel ar WHERE ar.code = r.regel_code AND ar.mandant_id = p_mandant;

        n_sammel := n_sammel + 1;
    END LOOP;

    SELECT count(*) INTO n_gebuendelt FROM crm_aufgabe
     WHERE mandant_id=p_mandant AND gruppierungs_schluessel='gebuendelt';
    schritt := 'Bündelung';
    ergebnis := n_gebuendelt||' Einzelaufgaben in '||n_sammel||' Sammelaufgaben zusammengefasst';
    RETURN NEXT;

    -- ---------------------------------------------------------------------
    -- 2. Staffelung über dem Tageslimit
    -- ---------------------------------------------------------------------
    WITH kandidaten AS (
        SELECT id, zugewiesen_an,
               row_number() OVER (PARTITION BY zugewiesen_an
                                  ORDER BY prioritaets_score DESC, faellig_am) AS rn
        FROM crm_aufgabe
        WHERE mandant_id = p_mandant AND status IN ('offen','in_arbeit')
          AND quelle = 'automatisch'
          AND prioritaet IN ('normal','niedrig')     -- kritisch/hoch bleiben unangetastet
          AND sla_frist IS NULL                      -- SLA-gebundene Aufgaben bleiben unangetastet
          AND coalesce(gruppierungs_schluessel,'') <> 'gebuendelt'
          AND faellig_am < date_trunc('day', now()) + interval '1 day'
    )
    UPDATE crm_aufgabe a
       SET faellig_am = date_trunc('day', now())
                      + (((k.rn - 1) / p_tageslimit) || ' days')::interval
                      + interval '9 hours',
           kontext = a.kontext || jsonb_build_object('lastschutz_verschoben', true)
      FROM kandidaten k
     WHERE k.id = a.id AND k.rn > p_tageslimit;
    GET DIAGNOSTICS n_verschoben = ROW_COUNT;

    schritt := 'Staffelung';
    ergebnis := n_verschoben||' Aufgaben auf Folgetage verteilt (Limit '||p_tageslimit||' je Benutzer und Tag)';
    RETURN NEXT;

    -- 3. Was danach noch über dem Limit liegt, ist ein Kapazitätsproblem
    PERFORM crm_fn_kapazitaetswarnung(p_mandant, p_tageslimit);

    schritt := 'Heute fällig je Benutzer';
    ergebnis := (SELECT coalesce(max(n),0)||' (Maximum)' FROM (
        SELECT count(*) n FROM crm_aufgabe
         WHERE mandant_id=p_mandant AND status IN ('offen','in_arbeit')
           AND coalesce(gruppierungs_schluessel,'') <> 'gebuendelt'
           AND faellig_am < date_trunc('day', now()) + interval '1 day'
         GROUP BY zugewiesen_an) x);
    RETURN NEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_kapazitaetswarnung(p_mandant uuid, p_tageslimit integer DEFAULT 25)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE r record; n int := 0; v_leitung uuid;
BEGIN
    SELECT id INTO v_leitung FROM crm_benutzer_ref
     WHERE mandant_id=p_mandant AND rolle IN ('teamleitung','vertriebsleitung') AND aktiv
     ORDER BY CASE rolle WHEN 'teamleitung' THEN 1 ELSE 2 END LIMIT 1;
    IF v_leitung IS NULL THEN RETURN 0; END IF;

    FOR r IN
        SELECT a.zugewiesen_an, b.anzeigename, count(*) AS heute,
               count(*) FILTER (WHERE a.sla_frist IS NOT NULL) AS mit_sla,
               count(*) FILTER (WHERE a.sla_frist < now()) AS sla_verletzt,
               sum(coalesce(a.erwarteter_wert_eur,0)) AS wert
        FROM crm_aufgabe a JOIN crm_benutzer_ref b ON b.id=a.zugewiesen_an
        WHERE a.mandant_id=p_mandant AND a.status IN ('offen','in_arbeit')
          AND coalesce(a.gruppierungs_schluessel,'') <> 'gebuendelt'
          AND a.regel_code IS DISTINCT FROM 'A-49'
          AND a.faellig_am < date_trunc('day',now()) + interval '1 day'
        GROUP BY a.zugewiesen_an, b.anzeigename
        HAVING count(*) > p_tageslimit
    LOOP
        PERFORM crm_fn_aufgabe(p_mandant,'A-49',
          'Kapazität überschritten: '||r.anzeigename,
          r.heute||' Aufgaben heute fällig bei einem Tageslimit von '||p_tageslimit||'. '||
          r.mit_sla||' davon sind SLA-gebunden und dürfen nicht verschoben werden'||
          CASE WHEN r.sla_verletzt>0 THEN ', '||r.sla_verletzt||' SLA sind bereits verletzt' ELSE '' END||
          '. Gefährdetes Potenzial '||to_char(r.wert,'FM999G999')||' €. '||
          'Umverteilen, Kapazität aufstocken oder Leadzufluss drosseln.',
          'eskalation','kritisch', now(), v_leitung, 'kein', NULL,
          r.wert, now()+interval '1 day',
          jsonb_build_object('benutzer',r.anzeigename,'heute_faellig',r.heute,
                             'mit_sla',r.mit_sla,'sla_verletzt',r.sla_verletzt),
          'kapazitaet-'||r.zugewiesen_an::text);
        n := n + 1;
    END LOOP;
    RETURN n;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_fn_engine_lauf(p_mandant uuid)
 RETURNS TABLE(schritt text, ergebnis text)
 LANGUAGE plpgsql
AS $function$
DECLARE r record; sc crm_typ_score; n int; ls record;
BEGIN
    n := 0;
    FOR r IN SELECT id FROM crm_lead WHERE mandant_id=p_mandant AND geloescht_am IS NULL LOOP
        sc := crm_fn_lead_score(r.id);
        UPDATE crm_lead SET lead_score=sc.score, lead_kategorie=sc.kategorie, score_regel=sc.score,
               score_erklaerung=sc.erklaerung, score_berechnet_am=now(),
               intent_score=crm_fn_intent_score(kontakt_id)
         WHERE id=r.id;
        INSERT INTO crm_score_lead_historie (mandant_id,lead_id,score,kategorie,score_regel,modell_version,erklaerung)
        VALUES (p_mandant,r.id,sc.score,sc.kategorie,sc.score,'regelmodell-1.2',sc.erklaerung);
        n := n+1;
    END LOOP;
    schritt := '1. Lead Scores'; ergebnis := n||' Leads bewertet'; RETURN NEXT;

    UPDATE crm_kontakt k SET letztes_signal_am = s.letztes,
           engagement_score = greatest(0, least(100, round(crm_fn_intent_score(k.id))::int))
      FROM (SELECT kontakt_id, max(zeitstempel) AS letztes FROM crm_signal GROUP BY kontakt_id) s
     WHERE s.kontakt_id = k.id;
    schritt := '2. Engagement'; ergebnis := 'aktualisiert'; RETURN NEXT;

    n := 0;
    FOR r IN SELECT id FROM crm_kunde WHERE mandant_id=p_mandant AND geloescht_am IS NULL LOOP
        PERFORM crm_fn_customer_value(r.id);
        PERFORM crm_fn_risk(r.id);
        n := n+1;
    END LOOP;
    schritt := '3. Kundenscores'; ergebnis := n||' Kunden bewertet (CVS + Risiko)'; RETURN NEXT;

    UPDATE crm_kontakt k SET rollen = array_append(rollen,'vip')
      FROM crm_kunde kd
     WHERE kd.haupt_kontakt_id=k.id AND kd.customer_value_score >= 80
       AND current_date - kd.kunde_seit >= 730 AND NOT ('vip' = ANY(k.rollen));
    schritt := '4. VIP-Rollen'; ergebnis := 'geprüft'; RETURN NEXT;

    n := crm_fn_muster_erkennen(p_mandant);
    schritt := '5. Signalmuster'; ergebnis := n||' Muster erkannt'; RETURN NEXT;

    n := crm_fn_next_best_offer(p_mandant);
    schritt := '6. Next Best Offer'; ergebnis := n||' Vorschläge'; RETURN NEXT;

    n := crm_fn_regeln_ausfuehren(p_mandant);
    schritt := '7. Regelwerk'; ergebnis := n||' Regelauslösungen'; RETURN NEXT;

    n := crm_fn_prioritaeten(p_mandant);
    schritt := '8. Priorisierung'; ergebnis := n||' offene Aufgaben priorisiert'; RETURN NEXT;

    FOR ls IN SELECT * FROM crm_fn_lastschutz(p_mandant) LOOP
        schritt := '9. Lastschutz — '||ls.schritt; ergebnis := ls.ergebnis; RETURN NEXT;
    END LOOP;

    UPDATE crm_signal SET verarbeitet=true, verarbeitet_am=now() WHERE mandant_id=p_mandant AND NOT verarbeitet;
    schritt := '10. Signale'; ergebnis := 'verarbeitet'; RETURN NEXT;
END;
$function$
;


-- =============================================================================
--  Regelkatalog eines Mandanten anlegen
--
--  Der Katalog ist Betriebskonfiguration, nicht Demodaten: Ohne ihn schreibt die
--  Engine kein Laufprotokoll, und die Regeln lassen sich nicht einzeln
--  abschalten. Beim Einrichten eines Mandanten ist diese Funktion aufzurufen.
--
--      SELECT crm_fn_regelkatalog_anlegen('<mandant-uuid>');
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_regelkatalog_anlegen(p_mandant uuid)
RETURNS int LANGUAGE plpgsql AS $regelkatalog$
DECLARE n int;
BEGIN
    INSERT INTO crm_automation_regel (mandant_id,code,bezeichnung,ausloeser_typ,ausloeser,aktionen,max_pro_tag_je_benutzer)
    VALUES
(p_mandant,'A-01','Vergessenswächter: aktiver Vorgang ohne offene Aufgabe','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-02','Erstkontakt neuer Lead mit SLA','event','crm.lead.erstellt','[{"typ":"aufgabe"},{"typ":"email"}]',25),
 (p_mandant,'A-05','SLA Erstkontakt überschritten','zeitplan','0 * * * *','[{"typ":"eskalation"}]',NULL),
 (p_mandant,'A-08','Lead ohne Signal > 180 Tage in Nurturing','zeitplan','0 2 * * *','[{"typ":"kampagne"}]',NULL),
 (p_mandant,'A-09','Konfigurator abgebrochen (Muster M2)','event','crm.signal.muster_erkannt','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-11','Angebotsnachfassung T+3','event','crm.angebot.versendet','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-12','Angebot läuft in 3 Tagen ab','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-14','Opportunity ohne offene Aufgabe','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-15','Stillstand in der Pipelinestufe','zeitplan','0 6 * * *','[{"typ":"eskalation"}]',NULL),
 (p_mandant,'A-16','Angebot mehrfach geöffnet (Muster M6)','event','crm.angebot.geoeffnet','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-21','Hauptfälligkeit T-90/T-60/T-30','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-22','Jahresgespräch fällig','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-23','Bootswert seit > 24 Monaten ungeprüft','zeitplan','0 2 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-24','Kündigungsrisiko hoch','schwellwert','risk_score>=65','[{"typ":"aufgabe"}]',NULL),
 (p_mandant,'A-25','Kündigungsrisiko hoch bei hohem Kundenwert','schwellwert','risk>=65 AND cvs>=70','[{"typ":"aufgabe"},{"typ":"email"},{"typ":"push"}]',NULL),
 (p_mandant,'A-28','Empfehlungsanfrage bei zufriedenen Kunden','zeitplan','0 6 1 * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-30','Next Best Offer','zeitplan','0 2 * * *','[{"typ":"opportunity"},{"typ":"aufgabe"}]',25),
 (p_mandant,'A-34','Empfehlung eingegangen','event','crm.empfehlung.eingegangen','[{"typ":"aufgabe"}]',NULL),
 (p_mandant,'A-35','Empfehlung ohne Rückmeldung an den Geber','zeitplan','0 6 * * *','[{"typ":"aufgabe"}]',25),
 (p_mandant,'A-37','Partnerkontakt überfällig','zeitplan','0 6 1 * *','[{"typ":"aufgabe"}]',25),
     (p_mandant,'A-49','Kapazität je Benutzer überschritten','zeitplan','0 7 * * *','[{"typ":"eskalation"}]',NULL)
    ON CONFLICT (mandant_id, code) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$regelkatalog$;

-- =============================================================================
--  Indizes der Engine (O2)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_aufgabe_dedup_ohne_bezug
    ON crm_aufgabe (mandant_id, zugewiesen_an, regel_code, typ, gruppierungs_schluessel)
    WHERE bezug_id IS NULL AND status IN ('offen','in_arbeit') AND quelle = 'automatisch';

CREATE INDEX IF NOT EXISTS idx_opp_nbo
    ON crm_opportunity (mandant_id, kunde_id, regel_code)
    WHERE ursprung = 'next_best_offer' AND pipeline_stufe NOT IN ('gewonnen','verloren');

CREATE INDEX IF NOT EXISTS idx_aufgabe_buendelung
    ON crm_aufgabe (mandant_id, zugewiesen_an, regel_code, typ)
    WHERE status = 'offen' AND quelle = 'automatisch';

CREATE INDEX IF NOT EXISTS idx_muster_tag
    ON crm_signal_muster (mandant_id, code, erkannt_am);

CREATE INDEX IF NOT EXISTS idx_nbo_offen
    ON crm_nbo_vorschlag (mandant_id, status) WHERE status = 'offen';

-- =============================================================================
--  ENDE
-- =============================================================================
