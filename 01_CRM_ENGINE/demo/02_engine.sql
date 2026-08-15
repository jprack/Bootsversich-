-- =============================================================================
--  01_CRM_ENGINE — Engine
--  Umsetzung von: Lead Score (Regelmodell), Intent Score, Mustererkennung,
--  Customer Value Score, Risk Score, Next Best Offer, Regelwerk, Priorisierung.
--  Referenz: 03_LEADMODELL.md, 04_KUNDENMODELL.md, 07_AUFGABENMODELL.md,
--            10_AUTOMATISIERUNGEN.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. INTENT SCORE  (Signalverdichtung mit Zeitverfall)
--    intent = SUM( gewicht * exp(-ln2 * dt / halbwertszeit) )
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_intent_score(p_kontakt uuid)
RETURNS numeric LANGUAGE sql STABLE AS $$
    SELECT coalesce(round(sum(
             st.basisgewicht *
             exp(-ln(2) * (EXTRACT(epoch FROM (now() - s.zeitstempel))/86400.0) / st.halbwertszeit_tage)
           )::numeric, 2), 0)
    FROM crm_signal s
    JOIN crm_signal_typ st ON st.id = s.signal_typ_id
    WHERE s.kontakt_id = p_kontakt
      AND s.zeitstempel > now() - interval '365 days';
$$;

-- -----------------------------------------------------------------------------
-- 2. LEAD SCORE  (Regelmodell, Blöcke A-D, Timing-Multiplikator, Decay)
-- -----------------------------------------------------------------------------
DROP TYPE IF EXISTS crm_typ_score CASCADE;
CREATE TYPE crm_typ_score AS (score int, kategorie text, erklaerung jsonb);

CREATE OR REPLACE FUNCTION crm_fn_lead_score(p_lead uuid)
RETURNS crm_typ_score LANGUAGE plpgsql STABLE AS $$
DECLARE
    l           crm_lead%ROWTYPE;
    k           crm_kontakt%ROWTYPE;
    q           crm_lead_quelle%ROWTYPE;
    a int := 0; b int := 0; c numeric := 0; d int := 0;
    bonus int := 0;
    faktor numeric := 1.0;
    tage_seit_signal numeric;
    n_web int; n_tarif int; n_doc1 int; n_doc2 int; n_nl_open int; n_nl_klick int;
    v_termin int; v_termin_wahr int;
    roh numeric; v_score_final int;
    erkl jsonb := '[]'::jsonb;
    res crm_typ_score;
BEGIN
    SELECT * INTO l FROM crm_lead WHERE id = p_lead;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT * INTO k FROM crm_kontakt WHERE id = l.kontakt_id;
    SELECT * INTO q FROM crm_lead_quelle WHERE id = l.quelle_id;

    -- ---------- Block A: Objekt & Wert (max 30) ----------
    a := a + CASE
        WHEN l.boot_wert_eur >= 500000 THEN 15 WHEN l.boot_wert_eur >= 200000 THEN 13
        WHEN l.boot_wert_eur >= 100000 THEN 10 WHEN l.boot_wert_eur >=  50000 THEN 7
        WHEN l.boot_wert_eur >=  20000 THEN 4  WHEN l.boot_wert_eur IS NOT NULL THEN 2 ELSE 0 END;
    IF l.boot_wert_eur IS NOT NULL THEN
        erkl := erkl || jsonb_build_object('faktor', 'Bootswert ' || to_char(l.boot_wert_eur,'FM999G999') || ' €',
                 'punkte', CASE WHEN l.boot_wert_eur >= 500000 THEN 15 WHEN l.boot_wert_eur >= 200000 THEN 13
                                WHEN l.boot_wert_eur >= 100000 THEN 10 WHEN l.boot_wert_eur >= 50000 THEN 7
                                WHEN l.boot_wert_eur >= 20000 THEN 4 ELSE 2 END, 'richtung','positiv');
    END IF;

    a := a + CASE WHEN l.boot_laenge_m >= 18 THEN 8 WHEN l.boot_laenge_m >= 12 THEN 6
                  WHEN l.boot_laenge_m >= 8 THEN 4 WHEN l.boot_laenge_m >= 5 THEN 2 ELSE 0 END;
    IF l.boot_laenge_m IS NOT NULL THEN
        erkl := erkl || jsonb_build_object('faktor','Bootsgröße '||l.boot_laenge_m||' m',
                 'punkte', CASE WHEN l.boot_laenge_m >= 18 THEN 8 WHEN l.boot_laenge_m >= 12 THEN 6
                                WHEN l.boot_laenge_m >= 8 THEN 4 WHEN l.boot_laenge_m >= 5 THEN 2 ELSE 0 END,
                 'richtung','positiv');
    END IF;

    a := a + CASE WHEN l.boot_baujahr IS NULL THEN 0
                  WHEN EXTRACT(year FROM current_date) - l.boot_baujahr <= 5 THEN 4
                  WHEN EXTRACT(year FROM current_date) - l.boot_baujahr <= 15 THEN 3
                  WHEN EXTRACT(year FROM current_date) - l.boot_baujahr <= 30 THEN 2 ELSE 1 END;
    a := a + CASE WHEN l.motorleistung_kw >= 300 THEN 3 WHEN l.motorleistung_kw >= 100 THEN 2
                  WHEN l.motorleistung_kw IS NOT NULL THEN 1 ELSE 0 END;
    a := least(a, 30);

    -- ---------- Block B: Profil & Region (max 20) ----------
    b := b + CASE l.fahrgebiet WHEN 'weltweit' THEN 7 WHEN 'atlantik' THEN 7 WHEN 'mittelmeer' THEN 6
                               WHEN 'nord_ostsee' THEN 5 WHEN 'kuestennah' THEN 3 WHEN 'binnen' THEN 2 ELSE 0 END;
    IF l.fahrgebiet IS NOT NULL THEN
        erkl := erkl || jsonb_build_object('faktor','Fahrgebiet '||l.fahrgebiet,
                 'punkte', CASE l.fahrgebiet WHEN 'weltweit' THEN 7 WHEN 'atlantik' THEN 7 WHEN 'mittelmeer' THEN 6
                           WHEN 'nord_ostsee' THEN 5 WHEN 'kuestennah' THEN 3 ELSE 2 END,'richtung','positiv');
    END IF;

    b := b + CASE WHEN l.nutzungsart = 'gewerblich_flotte' THEN 8
                  WHEN l.nutzungsart = 'gewerblich_charter' THEN 6
                  WHEN l.nutzungsart IN ('verein','regatta') THEN 4 ELSE 2 END;
    IF l.nutzungsart LIKE 'gewerblich%' THEN
        erkl := erkl || jsonb_build_object('faktor','Gewerbliche Nutzung ('||l.nutzungsart||')',
                 'punkte', CASE WHEN l.nutzungsart='gewerblich_flotte' THEN 8 ELSE 6 END,'richtung','positiv');
    END IF;

    b := b + CASE WHEN k.plz IS NULL THEN 0
                  WHEN left(k.plz,1) = '2' THEN 5                  -- Kernmarkt Küste Nord
                  WHEN k.land = 'DE' THEN 3 ELSE 1 END;
    b := least(b, 20);

    -- ---------- Block C: Verhalten & Engagement (max 35, mit Decay) ----------
    SELECT count(*) FILTER (WHERE st.code IN ('S-WEB-02','S-WEB-03')),
           count(*) FILTER (WHERE st.code = 'S-WEB-01'),
           count(*) FILTER (WHERE st.code = 'S-DOC-01'),
           count(*) FILTER (WHERE st.code = 'S-DOC-02'),
           count(*) FILTER (WHERE st.code = 'S-NL-01'),
           count(*) FILTER (WHERE st.code IN ('S-NL-02','S-NL-03'))
      INTO n_web, n_tarif, n_doc1, n_doc2, n_nl_open, n_nl_klick
      FROM crm_signal s JOIN crm_signal_typ st ON st.id = s.signal_typ_id
     WHERE s.kontakt_id = l.kontakt_id AND s.zeitstempel > now() - interval '60 days';

    c := c + CASE WHEN n_web >= 8 THEN 7 WHEN n_web >= 4 THEN 5 WHEN n_web >= 2 THEN 3 WHEN n_web = 1 THEN 1 ELSE 0 END;
    IF n_web > 0 THEN
        erkl := erkl || jsonb_build_object('faktor',n_web||' Websitebesuche (30 Tage)',
                 'punkte',CASE WHEN n_web>=8 THEN 7 WHEN n_web>=4 THEN 5 WHEN n_web>=2 THEN 3 ELSE 1 END,'richtung','positiv');
    END IF;
    c := c + CASE WHEN n_tarif > 0 THEN 5 ELSE 0 END;
    IF n_tarif > 0 THEN
        erkl := erkl || jsonb_build_object('faktor','Klick auf Tarif-/Preisseite','punkte',5,'richtung','positiv');
    END IF;
    c := c + CASE WHEN n_doc1 > 0 THEN 6 ELSE 0 END + CASE WHEN n_doc2 > 0 THEN 3 ELSE 0 END;
    IF n_doc1 > 0 THEN
        erkl := erkl || jsonb_build_object('faktor','Download Bedingungen/Tarifübersicht','punkte',6,'richtung','positiv');
    END IF;
    c := c + CASE WHEN n_nl_open >= 3 AND n_nl_klick >= 1 THEN 5 WHEN n_nl_open >= 1 THEN 2 ELSE 0 END;

    SELECT count(*) FILTER (WHERE act.typ IN ('termin','meeting')),
           count(*) FILTER (WHERE act.typ IN ('termin','meeting') AND act.ergebnis LIKE 'erreicht%')
      INTO v_termin, v_termin_wahr
      FROM crm_aktivitaet act WHERE act.lead_id = l.id;
    c := c + CASE WHEN v_termin_wahr > 0 THEN 8 WHEN v_termin > 0 THEN 6 ELSE 0 END;
    IF v_termin > 0 THEN
        erkl := erkl || jsonb_build_object('faktor','Termin '||CASE WHEN v_termin_wahr>0 THEN 'wahrgenommen' ELSE 'vereinbart' END,
                 'punkte',CASE WHEN v_termin_wahr>0 THEN 8 ELSE 6 END,'richtung','positiv');
    END IF;

    IF l.reaktionszeit_minuten IS NOT NULL THEN
        c := c + CASE WHEN l.reaktionszeit_minuten <= 1440 THEN 4 WHEN l.reaktionszeit_minuten <= 4320 THEN 2 ELSE 0 END;
    END IF;
    -- Negativsignale
    IF EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
               WHERE s.kontakt_id = l.kontakt_id AND st.code = 'S-NEG-01') THEN
        c := c - 3;
        erkl := erkl || jsonb_build_object('faktor','Newsletter abgemeldet','punkte',-3,'richtung','negativ');
    END IF;
    c := greatest(least(c, 35), 0);

    -- Decay auf den Verhaltensblock
    SELECT EXTRACT(epoch FROM (now() - max(zeitstempel)))/86400.0 INTO tage_seit_signal
      FROM crm_signal WHERE kontakt_id = l.kontakt_id;
    IF tage_seit_signal IS NOT NULL AND tage_seit_signal > 0 THEN
        c := c * exp(-0.015 * tage_seit_signal);
        IF tage_seit_signal > 30 THEN
            erkl := erkl || jsonb_build_object('faktor','Zeitverfall: '||round(tage_seit_signal)||' Tage ohne Signal',
                     'punkte', -round((c/greatest(exp(-0.015*tage_seit_signal),0.001)) - c), 'richtung','negativ');
        END IF;
    END IF;

    -- ---------- Block D: Vertrauen & Netzwerk (max 15) ----------
    d := CASE q.code
            WHEN 'EMPF'    THEN CASE WHEN EXISTS (SELECT 1 FROM crm_empfehlung e
                                                  JOIN crm_kontakt gk ON gk.id = e.empfehlungsgeber_kontakt_id
                                                  WHERE e.erzeugter_lead_id = l.id AND 'vip' = ANY(gk.rollen))
                                     THEN 15 ELSE 12 END
            WHEN 'WERFT'   THEN 11 WHEN 'HAENDL' THEN 11
            WHEN 'MARINA'  THEN 9  WHEN 'YCLUB'  THEN 9
            WHEN 'PPORTAL' THEN 8  WHEN 'ACAD'   THEN 5  WHEN 'MKTPL' THEN 5
            ELSE 0 END;
    IF d > 0 THEN
        erkl := erkl || jsonb_build_object('faktor','Quelle '||q.bezeichnung,'punkte',d,'richtung','positiv');
    END IF;
    d := least(d, 15);

    IF l.kunde_id IS NOT NULL THEN
        bonus := 10;
        erkl := erkl || jsonb_build_object('faktor','Bestandskunde des Hauses','punkte',10,'richtung','positiv');
    END IF;

    -- ---------- Timing-Multiplikator ----------
    IF l.hauptfaelligkeit_bestand IS NOT NULL THEN
        IF l.hauptfaelligkeit_bestand - current_date BETWEEN 30 AND 90 THEN faktor := 1.20;
        ELSIF l.hauptfaelligkeit_bestand - current_date BETWEEN 91 AND 180 THEN faktor := 1.10;
        ELSIF l.hauptfaelligkeit_bestand - current_date > 300 THEN faktor := 0.80;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
               WHERE s.kontakt_id=l.kontakt_id AND st.code='S-OBJ-01' AND s.zeitstempel > now()-interval '60 days')
    THEN faktor := greatest(faktor, 1.25);
    END IF;
    IF l.zeitfenster = 'sofort'  THEN faktor := greatest(faktor, 1.15); END IF;
    IF l.zeitfenster = 'unklar'  THEN faktor := least(faktor, 0.90); END IF;
    IF faktor <> 1.0 THEN
        erkl := erkl || jsonb_build_object('faktor', CASE
                    WHEN l.hauptfaelligkeit_bestand IS NOT NULL AND l.hauptfaelligkeit_bestand - current_date BETWEEN 30 AND 90
                      THEN 'Hauptfälligkeit in '||(l.hauptfaelligkeit_bestand - current_date)||' Tagen'
                    WHEN l.zeitfenster='sofort' THEN 'Zeitfenster: sofort'
                    WHEN l.zeitfenster='unklar' THEN 'Zeitfenster unklar'
                    ELSE 'Timing' END,
                 'richtung','multiplikator','wert',faktor);
    END IF;

    roh := (a + b + c + d + bonus) * faktor;
    v_score_final := least(100, greatest(0, round(roh)))::int;

    res.score := v_score_final;
    res.kategorie := CASE WHEN v_score_final >= 80 THEN 'A' WHEN v_score_final >= 60 THEN 'B'
                          WHEN v_score_final >= 35 THEN 'C' ELSE 'D' END;
    res.erklaerung := erkl;
    RETURN res;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. CUSTOMER VALUE SCORE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_customer_value(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    kd crm_kunde%ROWTYPE;
    praemie numeric; ltv numeric; n_vertraege int; n_boote int;
    n_empf int; n_community int; ist_partner boolean;
    bw int:=0; bl int:=0; bv int:=0; bd int:=0; bn int:=0; bc int:=0; bp int:=0; modi int:=0;
    quote numeric; summe int; erkl jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id = p_kunde;

    SELECT coalesce(sum(jahrespraemie_eur),0), count(*) INTO praemie, n_vertraege
      FROM crm_vertrag_ref WHERE kunde_id = p_kunde AND status = 'aktiv';
    SELECT count(*) INTO n_boote FROM crm_boot_ref WHERE kunde_id = p_kunde AND status = 'aktiv';
    ltv := praemie * greatest(1, (current_date - coalesce(kd.kunde_seit, current_date))/365.0);

    -- Block A: Wirtschaft (45)
    bw := CASE WHEN praemie >= 15000 THEN 25 WHEN praemie >= 8000 THEN 20 WHEN praemie >= 4000 THEN 15
               WHEN praemie >= 1500 THEN 10 WHEN praemie >= 500 THEN 6 ELSE 2 END;
    bl := CASE WHEN ltv >= 100000 THEN 20 WHEN ltv >= 50000 THEN 16 WHEN ltv >= 20000 THEN 12
               WHEN ltv >= 5000 THEN 7 ELSE 3 END;
    erkl := erkl || jsonb_build_object('faktor','Jahresprämie '||to_char(praemie,'FM999G999')||' €','punkte',bw,'richtung','positiv')
                 || jsonb_build_object('faktor','Lifetime Value '||to_char(ltv,'FM999G999')||' €','punkte',bl,'richtung','positiv');

    -- Block B: Vertrieb (15)
    SELECT CASE WHEN count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren')) = 0 THEN NULL
                ELSE count(*) FILTER (WHERE pipeline_stufe='gewonnen')::numeric
                     / count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren')) END
      INTO quote FROM crm_opportunity WHERE kunde_id = p_kunde;
    bv := CASE WHEN quote IS NULL THEN 3 WHEN quote >= 0.8 THEN 10 WHEN quote >= 0.6 THEN 8
               WHEN quote >= 0.4 THEN 5 WHEN quote >= 0.2 THEN 3 ELSE 1 END;
    bd := CASE WHEN n_boote = 0 THEN 0
               WHEN n_vertraege::numeric/n_boote >= 3 THEN 5
               WHEN n_vertraege::numeric/n_boote >= 2 THEN 3
               WHEN n_vertraege >= 1 THEN 1 ELSE 0 END;

    -- Block C: Netzwerk (20)
    SELECT count(*) INTO n_empf FROM crm_empfehlung
     WHERE (empfehlungsgeber_kunde_id = p_kunde OR empfehlungsgeber_kontakt_id = kd.haupt_kontakt_id)
       AND status = 'gewonnen';
    bn := CASE WHEN n_empf >= 5 THEN 20 WHEN n_empf >= 3 THEN 16 WHEN n_empf = 2 THEN 12
               WHEN n_empf = 1 THEN 8
               WHEN EXISTS (SELECT 1 FROM crm_empfehlung WHERE empfehlungsgeber_kunde_id = p_kunde) THEN 2
               ELSE 0 END;
    IF n_empf > 0 THEN
        erkl := erkl || jsonb_build_object('faktor',n_empf||' erfolgreiche Empfehlung(en)','punkte',bn,'richtung','positiv');
    END IF;

    -- Block D: Community (10)
    SELECT count(*) INTO n_community FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
     WHERE s.kontakt_id = kd.haupt_kontakt_id AND st.kategorie IN ('event','academy','marketplace')
       AND s.zeitstempel > now() - interval '365 days';
    bc := CASE WHEN n_community >= 4 THEN 10 WHEN n_community >= 2 THEN 6 WHEN n_community = 1 THEN 3 ELSE 0 END;

    -- Block E: Partner (10)
    SELECT EXISTS (SELECT 1 FROM crm_partner p JOIN crm_organisation o ON o.id = p.organisation_id
                   WHERE o.id = kd.organisation_id) INTO ist_partner;
    bp := CASE WHEN ist_partner AND EXISTS (SELECT 1 FROM crm_partner p
                    JOIN crm_organisation o ON o.id=p.organisation_id
                    WHERE o.id = kd.organisation_id AND p.zugefuehrte_leads > 0) THEN 10
               WHEN ist_partner THEN 5 ELSE 0 END;
    IF bp > 0 THEN
        erkl := erkl || jsonb_build_object('faktor','Kunde ist zugleich aktiver Partner','punkte',bp,'richtung','positiv');
    END IF;

    -- Modifikatoren
    IF kd.kunde_seit IS NOT NULL THEN
        IF current_date - kd.kunde_seit >= 3650 THEN modi := modi + 5;
        ELSIF current_date - kd.kunde_seit >= 1825 THEN modi := modi + 3; END IF;
    END IF;
    IF kd.zahlungsverzug_tage > 60 THEN modi := modi - 10; END IF;
    IF kd.schadenquote_prozent > 120 THEN
        modi := modi - 8;
        erkl := erkl || jsonb_build_object('faktor','Schadenquote '||kd.schadenquote_prozent||' %','punkte',-8,'richtung','negativ');
    END IF;
    IF (SELECT count(*) FROM crm_schaden_ref WHERE kunde_id = p_kunde AND beschwerde
          AND schadendatum > current_date - 365) >= 2 THEN modi := modi - 6; END IF;
    IF n_boote >= 5 THEN
        modi := modi + 8;
        erkl := erkl || jsonb_build_object('faktor','Strategisches Segment: Flotte '||n_boote||' Boote','punkte',8,'richtung','positiv');
    END IF;

    summe := greatest(0, least(100, bw + bl + bv + bd + bn + bc + bp + modi));

    INSERT INTO crm_kunde_score (kunde_id,mandant_id,customer_value_score,block_wirtschaft,block_vertrieb,
        block_netzwerk,block_community,block_partner,modifikatoren,kategorie,erklaerung,berechnet_am)
    VALUES (p_kunde, kd.mandant_id, summe, bw+bl, bv+bd, bn, bc, bp, modi,
            CASE WHEN summe>=80 THEN 'vip' WHEN summe>=60 THEN 'kern' WHEN summe>=35 THEN 'standard'
                 WHEN summe>=15 THEN 'basis' ELSE 'beobachtung' END, erkl, now())
    ON CONFLICT (kunde_id) DO UPDATE SET
        customer_value_score=EXCLUDED.customer_value_score, block_wirtschaft=EXCLUDED.block_wirtschaft,
        block_vertrieb=EXCLUDED.block_vertrieb, block_netzwerk=EXCLUDED.block_netzwerk,
        block_community=EXCLUDED.block_community, block_partner=EXCLUDED.block_partner,
        modifikatoren=EXCLUDED.modifikatoren, kategorie=EXCLUDED.kategorie,
        erklaerung=EXCLUDED.erklaerung, berechnet_am=now();

    UPDATE crm_kunde SET customer_value_score = summe,
           jahrespraemie_eur = praemie, lifetime_value_eur = round(ltv,2),
           anzahl_vertraege = n_vertraege, anzahl_boote = n_boote,
           betreuungsstufe = CASE WHEN summe>=80 THEN 'vip' WHEN summe>=60 THEN 'kern'
                                  WHEN summe>=35 THEN 'standard' WHEN summe>=15 THEN 'basis' ELSE 'beobachtung' END
     WHERE id = p_kunde;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. RISK SCORE (Kündigungsrisiko R-01 .. R-13)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_risk(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    kd crm_kunde%ROWTYPE;
    g_summe numeric := 0; g_max numeric := 0; score int; stufe text;
    merkmale jsonb := '{}'::jsonb; treiber jsonb := '[]'::jsonb;
    tage_kontakt numeric; erf numeric;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id = p_kunde;

    -- R-01 Tage seit letztem beidseitigen Kontakt (20)
    tage_kontakt := current_date - coalesce(kd.letzter_kontakt_am::date, kd.kunde_seit, current_date);
    erf := least(1.0, tage_kontakt / 270.0);
    g_summe := g_summe + 20*erf; g_max := g_max + 20;
    merkmale := merkmale || jsonb_build_object('R-01', round(erf,2));
    IF erf >= 0.6 THEN treiber := treiber || jsonb_build_object(
        'faktor', round(tage_kontakt)||' Tage ohne Kontakt','punkte',round(20*erf),'richtung','negativ'); END IF;

    -- R-03 keine Newsletteröffnung (8)
    erf := CASE WHEN NOT EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
                                 WHERE s.kontakt_id=kd.haupt_kontakt_id AND st.kategorie='newsletter'
                                   AND s.zeitstempel > now()-interval '365 days') THEN 1 ELSE 0 END;
    g_summe := g_summe + 8*erf; g_max := g_max + 8;
    merkmale := merkmale || jsonb_build_object('R-03', erf);

    -- R-04 Schadenregulierung mit niedriger Zufriedenheit (12)
    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_schaden_ref WHERE kunde_id=p_kunde AND zufriedenheit <= 2) THEN 1 ELSE 0 END;
    g_summe := g_summe + 12*erf; g_max := g_max + 12;
    merkmale := merkmale || jsonb_build_object('R-04', erf);
    IF erf = 1 THEN treiber := treiber || jsonb_build_object(
        'faktor','Schadenregulierung mit Zufriedenheit ≤ 2/5','punkte',12,'richtung','negativ'); END IF;

    -- R-05 Beschwerde in 12 Monaten (10)
    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_schaden_ref WHERE kunde_id=p_kunde AND beschwerde
                              AND schadendatum > current_date-365) THEN 1 ELSE 0 END;
    g_summe := g_summe + 10*erf; g_max := g_max + 10;
    merkmale := merkmale || jsonb_build_object('R-05', erf);

    -- R-06 Prämienerhöhung > 15 % (12)
    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='aktiv'
                              AND praemienaenderung_prozent > 15) THEN 1 ELSE 0 END;
    g_summe := g_summe + 12*erf; g_max := g_max + 12;
    merkmale := merkmale || jsonb_build_object('R-06', erf);
    IF erf = 1 THEN treiber := treiber || jsonb_build_object('faktor',
        'Prämienerhöhung '||(SELECT max(praemienaenderung_prozent) FROM crm_vertrag_ref
                             WHERE kunde_id=p_kunde AND status='aktiv')||' % zur letzten Hauptfälligkeit',
        'punkte',12,'richtung','negativ'); END IF;

    -- R-07 Zahlungsverzug (8)
    erf := CASE WHEN kd.zahlungsverzug_tage > 30 THEN 1 ELSE 0 END;
    g_summe := g_summe + 8*erf; g_max := g_max + 8;
    merkmale := merkmale || jsonb_build_object('R-07', erf);

    -- R-08 Boot verkauft/abgemeldet ohne Nachfolge (15)
    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_boot_ref WHERE kunde_id=p_kunde AND status IN ('verkauft','abgemeldet'))
                 AND NOT EXISTS (SELECT 1 FROM crm_boot_ref WHERE kunde_id=p_kunde AND status='aktiv') THEN 1 ELSE 0 END;
    g_summe := g_summe + 15*erf; g_max := g_max + 15;
    merkmale := merkmale || jsonb_build_object('R-08', erf);

    -- R-10 Vertragsanzahl gesunken (14)
    erf := CASE WHEN EXISTS (SELECT 1 FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='gekuendigt'
                              AND ende_am > current_date-365) THEN 1 ELSE 0 END;
    g_summe := g_summe + 14*erf; g_max := g_max + 14;
    merkmale := merkmale || jsonb_build_object('R-10', erf);

    -- R-12 Jahresgespräch überfällig > 90 Tage (8)
    erf := CASE WHEN kd.naechstes_jahresgespraech_am IS NOT NULL
                 AND current_date - kd.naechstes_jahresgespraech_am > 90 THEN 1 ELSE 0 END;
    g_summe := g_summe + 8*erf; g_max := g_max + 8;
    merkmale := merkmale || jsonb_build_object('R-12', erf);
    IF erf = 1 THEN treiber := treiber || jsonb_build_object('faktor',
        'Jahresgespräch seit '||(current_date - kd.naechstes_jahresgespraech_am)||' Tagen überfällig',
        'punkte',8,'richtung','negativ'); END IF;

    score := round(100 * g_summe / nullif(g_max,0))::int;
    stufe := CASE WHEN score >= 65 THEN 'hoch' WHEN score >= 35 THEN 'mittel' ELSE 'niedrig' END;

    INSERT INTO crm_churn_bewertung (mandant_id,kunde_id,risk_score,risiko_stufe,merkmale,top_treiber,modell_version)
    VALUES (kd.mandant_id, p_kunde, score, stufe, merkmale,
            coalesce((SELECT jsonb_agg(t) FROM (SELECT t FROM jsonb_array_elements(treiber) t
                                        ORDER BY (t->>'punkte')::numeric DESC LIMIT 3) x), '[]'::jsonb),
            'regelmodell-1.0');
    UPDATE crm_kunde SET risk_score = score, risiko_stufe = stufe WHERE id = p_kunde;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. AUFGABEN-HELFER (mit Duplikatsschutz und Protokollierung)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_aufgabe(
    p_mandant uuid, p_regel text, p_titel text, p_beschreibung text, p_typ text,
    p_prioritaet text, p_faellig timestamptz, p_benutzer uuid,
    p_bezug_typ text, p_bezug uuid, p_wert numeric DEFAULT NULL,
    p_sla timestamptz DEFAULT NULL, p_kontext jsonb DEFAULT '{}'::jsonb,
    p_gruppe text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_vorhanden uuid;
BEGIN
    SELECT id INTO v_vorhanden FROM crm_aufgabe
     WHERE bezug_typ = p_bezug_typ AND bezug_id = p_bezug AND typ = p_typ
       AND regel_code = p_regel AND status IN ('offen','in_arbeit');
    IF v_vorhanden IS NOT NULL THEN
        UPDATE crm_aufgabe SET faellig_am = least(faellig_am, p_faellig),
               prioritaet = p_prioritaet, kontext = p_kontext, erwarteter_wert_eur = coalesce(p_wert, erwarteter_wert_eur)
         WHERE id = v_vorhanden;
        INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
        SELECT p_mandant, r.id, p_regel, p_bezug_typ, p_bezug, 'uebersprungen',
               jsonb_build_object('grund','aufgabe_bereits_offen','aufgabe_id',v_vorhanden)
          FROM crm_automation_regel r WHERE r.code = p_regel AND r.mandant_id = p_mandant;
        RETURN v_vorhanden;
    END IF;

    INSERT INTO crm_aufgabe (mandant_id,titel,beschreibung,typ,prioritaet,faellig_am,sla_frist,
        zugewiesen_an,bezug_typ,bezug_id,quelle,regel_code,erwarteter_wert_eur,kontext,gruppierungs_schluessel)
    VALUES (p_mandant,p_titel,p_beschreibung,p_typ,p_prioritaet,p_faellig,p_sla,
        p_benutzer,p_bezug_typ,p_bezug,'automatisch',p_regel,p_wert,p_kontext,p_gruppe)
    RETURNING id INTO v_id;

    INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
    SELECT p_mandant, r.id, p_regel, p_bezug_typ, p_bezug, 'erfolg', jsonb_build_object('aufgabe_id',v_id)
      FROM crm_automation_regel r WHERE r.code = p_regel AND r.mandant_id = p_mandant;
    RETURN v_id;
END;
$$;
