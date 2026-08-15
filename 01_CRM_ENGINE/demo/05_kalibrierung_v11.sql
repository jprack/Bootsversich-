-- =============================================================================
--  01_CRM_ENGINE — Kalibrierung 1.1
--  Korrigiert vier im Demolauf 1.0 nachgewiesene Fehler:
--
--  K1  Lead Score: Normierung auf ERREICHBARE Punkte statt auf 100.
--      Ein Lead ohne digitale Identität (Werft-, Messe-, Telefonlead) kann die
--      18 Verhaltenspunkte nie erreichen und wurde dadurch systematisch als
--      C/D eingestuft — genau die Quellen mit der höchsten Abschlussquote.
--
--  K2  Customer Value: € Schwellen auf Boots-/Yachtprämien kalibriert
--      (200–3.000 € privat, 3.000–20.000 € gewerblich statt Industrieniveau)
--      und Blockgewichte auf 55/15/15/5/10 verschoben.
--
--  K3  Risk Score: Trennung von Verhaltensmerkmalen (Nenner) und harten
--      Ereignissen (Eskalatoren). Vorher konnte ein Kunde jedes Stille-Kriterium
--      erfüllen und blieb dennoch unter der Schwelle 65, weil selten
--      gleichzeitig auftretende Hartereignisse den Nenner aufblähten.
--
--  K4  A-21: Aufgabenwert ist die Summe der gefährdeten Jahresprämie
--      eines Kunden, nicht die Prämie des zuletzt verarbeiteten Vertrags.
-- =============================================================================

-- --- K1: Lead Score mit Erreichbarkeitsnormierung ------------------------------
CREATE OR REPLACE FUNCTION crm_fn_lead_score(p_lead uuid)
RETURNS crm_typ_score LANGUAGE plpgsql STABLE AS $$
DECLARE
    l crm_lead%ROWTYPE; k crm_kontakt%ROWTYPE; q crm_lead_quelle%ROWTYPE;
    a int := 0; b int := 0; c numeric := 0; d int := 0; bonus int := 0;
    c_erreichbar int := 0;
    faktor numeric := 1.0; tage_seit_signal numeric;
    n_web int; n_tarif int; n_doc1 int; n_doc2 int; n_nl_open int; n_nl_klick int;
    v_termin int; v_termin_wahr int;
    hat_tracking boolean; hat_newsletter boolean; hat_kontakt boolean;
    roh numeric; v_final int; erkl jsonb := '[]'::jsonb; res crm_typ_score;
BEGIN
    SELECT * INTO l FROM crm_lead WHERE id=p_lead;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT * INTO k FROM crm_kontakt WHERE id=l.kontakt_id;
    SELECT * INTO q FROM crm_lead_quelle WHERE id=l.quelle_id;

    -- Block A (30)
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
    a := least(a,30);

    -- Block B (20)
    b := b + CASE l.fahrgebiet WHEN 'weltweit' THEN 7 WHEN 'atlantik' THEN 7 WHEN 'mittelmeer' THEN 6
                               WHEN 'nord_ostsee' THEN 5 WHEN 'kuestennah' THEN 3 WHEN 'binnen' THEN 2 ELSE 0 END;
    b := b + CASE WHEN l.nutzungsart='gewerblich_flotte' THEN 8 WHEN l.nutzungsart='gewerblich_charter' THEN 6
                  WHEN l.nutzungsart IN ('verein','regatta') THEN 4 ELSE 2 END;
    IF l.nutzungsart LIKE 'gewerblich%' THEN
       erkl := erkl || jsonb_build_object('faktor','Gewerbliche Nutzung ('||l.nutzungsart||')',
         'punkte',CASE WHEN l.nutzungsart='gewerblich_flotte' THEN 8 ELSE 6 END,'richtung','positiv'); END IF;
    b := b + CASE WHEN k.plz IS NULL THEN 0 WHEN left(k.plz,1)='2' THEN 5 WHEN k.land='DE' THEN 3 ELSE 1 END;
    b := least(b,20);

    -- Erreichbarkeit der Verhaltenskriterien bestimmen
    hat_tracking   := coalesce(array_length(k.tracking_ids,1),0) > 0;
    hat_newsletter := EXISTS (SELECT 1 FROM crm_consent c WHERE c.kontakt_id=k.id
                              AND c.kanal='email' AND c.zweck IN ('werbung','vertragsanbahnung') AND c.status='erteilt');
    hat_kontakt    := l.erstkontakt_am IS NOT NULL;
    IF hat_tracking   THEN c_erreichbar := c_erreichbar + 18; END IF;  -- Web 7 + Klick 5 + Download 6
    IF hat_newsletter THEN c_erreichbar := c_erreichbar + 5;  END IF;
    IF hat_kontakt    THEN c_erreichbar := c_erreichbar + 12; END IF;  -- Termin 8 + Antwortverhalten 4

    -- Block C (nur erreichbare Anteile)
    IF hat_tracking THEN
        SELECT count(*) FILTER (WHERE st.code IN ('S-WEB-02','S-WEB-03')),
               count(*) FILTER (WHERE st.code='S-WEB-01'),
               count(*) FILTER (WHERE st.code='S-DOC-01'),
               count(*) FILTER (WHERE st.code='S-DOC-02')
          INTO n_web,n_tarif,n_doc1,n_doc2
          FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
         WHERE s.kontakt_id=l.kontakt_id AND s.zeitstempel>now()-interval '60 days';
        c := c + CASE WHEN n_web>=8 THEN 7 WHEN n_web>=4 THEN 5 WHEN n_web>=2 THEN 3 WHEN n_web=1 THEN 1 ELSE 0 END
               + CASE WHEN n_tarif>0 THEN 5 ELSE 0 END
               + CASE WHEN n_doc1>0 THEN 6 ELSE 0 END + CASE WHEN n_doc2>0 THEN 3 ELSE 0 END;
        IF n_web>0 THEN erkl := erkl || jsonb_build_object('faktor',n_web||' Websitebesuche',
           'punkte',CASE WHEN n_web>=8 THEN 7 WHEN n_web>=4 THEN 5 WHEN n_web>=2 THEN 3 ELSE 1 END,'richtung','positiv'); END IF;
        IF n_tarif>0 THEN erkl := erkl || jsonb_build_object('faktor','Klick auf Tarifseite','punkte',5,'richtung','positiv'); END IF;
        IF n_doc1>0 THEN erkl := erkl || jsonb_build_object('faktor','Download Bedingungen','punkte',6,'richtung','positiv'); END IF;
    END IF;
    IF hat_newsletter THEN
        SELECT count(*) FILTER (WHERE st.code='S-NL-01'), count(*) FILTER (WHERE st.code IN ('S-NL-02','S-NL-03'))
          INTO n_nl_open,n_nl_klick
          FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
         WHERE s.kontakt_id=l.kontakt_id AND s.zeitstempel>now()-interval '60 days';
        c := c + CASE WHEN n_nl_open>=3 AND n_nl_klick>=1 THEN 5 WHEN n_nl_open>=1 THEN 2 ELSE 0 END;
    END IF;
    IF hat_kontakt THEN
        SELECT count(*) FILTER (WHERE act.typ IN ('termin','meeting')),
               count(*) FILTER (WHERE act.typ IN ('termin','meeting') AND act.ergebnis LIKE 'erreicht%')
          INTO v_termin,v_termin_wahr FROM crm_aktivitaet act WHERE act.lead_id=l.id;
        c := c + CASE WHEN v_termin_wahr>0 THEN 8 WHEN v_termin>0 THEN 6 ELSE 0 END;
        c := c + CASE WHEN l.reaktionszeit_minuten<=1440 THEN 4 WHEN l.reaktionszeit_minuten<=4320 THEN 2 ELSE 0 END;
    END IF;
    IF EXISTS (SELECT 1 FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
               WHERE s.kontakt_id=l.kontakt_id AND st.code='S-NEG-01') THEN
        c := c - 3; erkl := erkl || jsonb_build_object('faktor','Newsletter abgemeldet','punkte',-3,'richtung','negativ'); END IF;
    c := greatest(least(c, c_erreichbar), 0);

    SELECT EXTRACT(epoch FROM (now()-max(zeitstempel)))/86400.0 INTO tage_seit_signal
      FROM crm_signal WHERE kontakt_id=l.kontakt_id;
    IF tage_seit_signal IS NOT NULL AND tage_seit_signal>0 THEN c := c*exp(-0.015*tage_seit_signal); END IF;

    -- Block D (15)
    d := CASE q.code
            WHEN 'EMPF' THEN CASE WHEN EXISTS (SELECT 1 FROM crm_empfehlung e JOIN crm_kontakt gk
                                    ON gk.id=e.empfehlungsgeber_kontakt_id
                                    WHERE e.erzeugter_lead_id=l.id AND 'vip'=ANY(gk.rollen)) THEN 15 ELSE 12 END
            WHEN 'WERFT' THEN 11 WHEN 'HAENDL' THEN 11 WHEN 'MARINA' THEN 9 WHEN 'YCLUB' THEN 9
            WHEN 'PPORTAL' THEN 8 WHEN 'ACAD' THEN 5 WHEN 'MKTPL' THEN 5 ELSE 0 END;
    IF d>0 THEN erkl := erkl || jsonb_build_object('faktor','Quelle '||q.bezeichnung,'punkte',d,'richtung','positiv'); END IF;
    IF l.kunde_id IS NOT NULL THEN
        bonus := 10; erkl := erkl || jsonb_build_object('faktor','Bestandskunde des Hauses','punkte',10,'richtung','positiv'); END IF;

    -- K1: Normierung auf erreichbare Punkte
    roh := 100.0 * (a+b+c+d+bonus) / (30 + 20 + c_erreichbar + 15 + CASE WHEN l.kunde_id IS NOT NULL THEN 10 ELSE 0 END);
    IF c_erreichbar < 35 THEN
        erkl := erkl || jsonb_build_object('faktor','Normierung: nur '||c_erreichbar||
                ' von 35 Verhaltenspunkten erreichbar (kein '||
                CASE WHEN NOT hat_tracking THEN 'Web-Tracking' WHEN NOT hat_kontakt THEN 'Erstkontakt' ELSE 'Newsletter' END||')',
                'richtung','multiplikator','wert',round(100.0/(30+20+c_erreichbar+15),3));
    END IF;

    -- Timing
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
$$;

-- --- K2: Customer Value auf Bootsprämien kalibriert ---------------------------
CREATE OR REPLACE FUNCTION crm_fn_customer_value(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    kd crm_kunde%ROWTYPE; praemie numeric; ltv numeric; n_vertraege int; n_boote int;
    n_empf int; n_community int; ist_partner boolean;
    bw int:=0; bl int:=0; bv int:=0; bd int:=0; bn int:=0; bc int:=0; bp int:=0; modi int:=0;
    quote numeric; summe int; erkl jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id=p_kunde;
    SELECT coalesce(sum(jahrespraemie_eur),0), count(*) INTO praemie,n_vertraege
      FROM crm_vertrag_ref WHERE kunde_id=p_kunde AND status='aktiv';
    SELECT count(*) INTO n_boote FROM crm_boot_ref WHERE kunde_id=p_kunde AND status='aktiv';
    ltv := praemie * greatest(1,(current_date-coalesce(kd.kunde_seit,current_date))/365.0);

    -- Block A Wirtschaft (55) — Schwellen für Boots-/Yachtprämien
    bw := CASE WHEN praemie>=10000 THEN 30 WHEN praemie>=5000 THEN 25 WHEN praemie>=2500 THEN 19
               WHEN praemie>=1200 THEN 13 WHEN praemie>=500 THEN 8 WHEN praemie>0 THEN 4 ELSE 0 END;
    bl := CASE WHEN ltv>=60000 THEN 25 WHEN ltv>=25000 THEN 20 WHEN ltv>=10000 THEN 15
               WHEN ltv>=3000 THEN 9 WHEN ltv>0 THEN 4 ELSE 0 END;
    erkl := erkl || jsonb_build_object('faktor','Jahresprämie '||to_char(praemie,'FM999G999')||' €','punkte',bw,'richtung','positiv')
                 || jsonb_build_object('faktor','Lifetime Value '||to_char(ltv,'FM999G999')||' €','punkte',bl,'richtung','positiv');

    -- Block B Vertrieb (15)
    SELECT CASE WHEN count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren'))=0 THEN NULL
                ELSE count(*) FILTER (WHERE pipeline_stufe='gewonnen')::numeric
                     / count(*) FILTER (WHERE pipeline_stufe IN ('gewonnen','verloren')) END
      INTO quote FROM crm_opportunity WHERE kunde_id=p_kunde;
    bv := CASE WHEN quote IS NULL THEN 3 WHEN quote>=0.8 THEN 10 WHEN quote>=0.6 THEN 8
               WHEN quote>=0.4 THEN 5 WHEN quote>=0.2 THEN 3 ELSE 1 END;
    bd := CASE WHEN n_boote=0 THEN 0 WHEN n_vertraege::numeric/n_boote>=3 THEN 5
               WHEN n_vertraege::numeric/n_boote>=2 THEN 3 WHEN n_vertraege>=1 THEN 1 ELSE 0 END;

    -- Block C Netzwerk (15)
    SELECT count(*) INTO n_empf FROM crm_empfehlung
     WHERE (empfehlungsgeber_kunde_id=p_kunde OR empfehlungsgeber_kontakt_id=kd.haupt_kontakt_id) AND status='gewonnen';
    bn := CASE WHEN n_empf>=5 THEN 15 WHEN n_empf>=3 THEN 12 WHEN n_empf=2 THEN 9 WHEN n_empf=1 THEN 6
               WHEN EXISTS (SELECT 1 FROM crm_empfehlung WHERE empfehlungsgeber_kunde_id=p_kunde
                            OR empfehlungsgeber_kontakt_id=kd.haupt_kontakt_id) THEN 3 ELSE 0 END;
    IF bn>0 THEN erkl := erkl || jsonb_build_object('faktor',
        CASE WHEN n_empf>0 THEN n_empf||' erfolgreiche Empfehlung(en)' ELSE 'Empfehlung ausgesprochen' END,
        'punkte',bn,'richtung','positiv'); END IF;

    -- Block D Community (5)
    SELECT count(*) INTO n_community FROM crm_signal s JOIN crm_signal_typ st ON st.id=s.signal_typ_id
     WHERE s.kontakt_id=kd.haupt_kontakt_id AND st.kategorie IN ('event','academy','marketplace')
       AND s.zeitstempel>now()-interval '365 days';
    bc := CASE WHEN n_community>=4 THEN 5 WHEN n_community>=2 THEN 3 WHEN n_community=1 THEN 2 ELSE 0 END;

    -- Block E Partner (10)
    SELECT EXISTS (SELECT 1 FROM crm_partner p WHERE p.organisation_id=kd.organisation_id) INTO ist_partner;
    bp := CASE WHEN ist_partner AND EXISTS (SELECT 1 FROM crm_partner p
                  WHERE p.organisation_id=kd.organisation_id AND p.zugefuehrte_leads>0) THEN 10
               WHEN ist_partner THEN 5 ELSE 0 END;
    IF bp>0 THEN erkl := erkl || jsonb_build_object('faktor','Kunde ist zugleich aktiver Partner','punkte',bp,'richtung','positiv'); END IF;

    -- Modifikatoren
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

    summe := greatest(0,least(100, bw+bl+bv+bd+bn+bc+bp+modi));

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
$$;

-- --- K3: Risk Score — Verhalten als Basis, Hartereignisse als Eskalatoren -----
CREATE OR REPLACE FUNCTION crm_fn_risk(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    kd crm_kunde%ROWTYPE; g_summe numeric:=0; g_max numeric:=0; score int; stufe text;
    merkmale jsonb:='{}'::jsonb; treiber jsonb:='[]'::jsonb; tage_kontakt numeric; erf numeric;
    hart boolean := false;
BEGIN
    SELECT * INTO kd FROM crm_kunde WHERE id=p_kunde;

    -- Verhaltensmerkmale (Nenner): R-01, R-03, R-04, R-05, R-06, R-12
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

    -- Hartereignisse: R-07 Zahlungsverzug, R-08 Objektverlust, R-10 Teilkündigung
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
    IF hart THEN score := greatest(score,65); END IF;

    stufe := CASE WHEN score>=65 THEN 'hoch' WHEN score>=35 THEN 'mittel' ELSE 'niedrig' END;

    INSERT INTO crm_churn_bewertung (mandant_id,kunde_id,risk_score,risiko_stufe,merkmale,top_treiber,modell_version)
    VALUES (kd.mandant_id,p_kunde,score,stufe,merkmale,
        coalesce((SELECT jsonb_agg(t) FROM (SELECT t FROM jsonb_array_elements(treiber) t
                  ORDER BY (t->>'punkte')::numeric DESC LIMIT 3) x),'[]'::jsonb),'regelmodell-1.1');
    UPDATE crm_kunde SET risk_score=score, risiko_stufe=stufe WHERE id=p_kunde;
END;
$$;

-- --- K4: A-21 trägt die Summe der gefährdeten Jahresprämie --------------------
CREATE OR REPLACE FUNCTION crm_fn_aufgabe(
    p_mandant uuid, p_regel text, p_titel text, p_beschreibung text, p_typ text,
    p_prioritaet text, p_faellig timestamptz, p_benutzer uuid,
    p_bezug_typ text, p_bezug uuid, p_wert numeric DEFAULT NULL,
    p_sla timestamptz DEFAULT NULL, p_kontext jsonb DEFAULT '{}'::jsonb,
    p_gruppe text DEFAULT NULL, p_wert_kumulieren boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_vorhanden uuid;
BEGIN
    SELECT id INTO v_vorhanden FROM crm_aufgabe
     WHERE bezug_typ=p_bezug_typ AND bezug_id=p_bezug AND typ=p_typ
       AND regel_code=p_regel AND status IN ('offen','in_arbeit');
    IF v_vorhanden IS NOT NULL THEN
        UPDATE crm_aufgabe SET faellig_am=least(faellig_am,p_faellig), prioritaet=p_prioritaet, kontext=p_kontext,
               erwarteter_wert_eur = CASE WHEN p_wert_kumulieren
                                          THEN coalesce(erwarteter_wert_eur,0)+coalesce(p_wert,0)
                                          ELSE coalesce(p_wert,erwarteter_wert_eur) END
         WHERE id=v_vorhanden;
        INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
        SELECT p_mandant,r.id,p_regel,p_bezug_typ,p_bezug,'uebersprungen',
               jsonb_build_object('grund','aufgabe_bereits_offen','aufgabe_id',v_vorhanden,'wert_kumuliert',p_wert_kumulieren)
          FROM crm_automation_regel r WHERE r.code=p_regel AND r.mandant_id=p_mandant;
        RETURN v_vorhanden;
    END IF;
    INSERT INTO crm_aufgabe (mandant_id,titel,beschreibung,typ,prioritaet,faellig_am,sla_frist,
        zugewiesen_an,bezug_typ,bezug_id,quelle,regel_code,erwarteter_wert_eur,kontext,gruppierungs_schluessel)
    VALUES (p_mandant,p_titel,p_beschreibung,p_typ,p_prioritaet,p_faellig,p_sla,p_benutzer,p_bezug_typ,p_bezug,
        'automatisch',p_regel,p_wert,p_kontext,p_gruppe)
    RETURNING id INTO v_id;
    INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
    SELECT p_mandant,r.id,p_regel,p_bezug_typ,p_bezug,'erfolg',jsonb_build_object('aufgabe_id',v_id)
      FROM crm_automation_regel r WHERE r.code=p_regel AND r.mandant_id=p_mandant;
    RETURN v_id;
END;
$$;
