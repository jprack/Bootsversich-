-- =============================================================================
--  01_CRM_ENGINE — Kalibrierung 1.2
--  Schließt zwei der offenen Punkte aus dem Prüfbericht zu Lauf 1.1:
--
--  K5  Customer Value: Erreichbarkeitsnormierung — dieselbe Korrektur, die der
--      Lead Score mit K1 bereits erhalten hat, war beim Kundenwert unterblieben.
--      Der Partnerblock (10 Punkte) ist nur für Kunden erreichbar, die selbst
--      Werft, Marina oder Händler sind — also für wenige Prozent des Bestands.
--      Für alle anderen lag er als totes Gewicht im Nenner und machte die
--      VIP-Schwelle rechnerisch unerreichbar (bester Kunde: 76 von 80).
--
--  K6  Lead Score: eigener Zweig für Gewerbe- und Flottenleads.
--      Das Privatmodell bewertet ein einzelnes Boot und 35 Punkte digitales
--      Verhalten. Eine Chartergesellschaft mit vier Booten entscheidet im
--      Termin, nicht auf der Website — und ihr Wert steckt in der Flotte, nicht
--      in der Rumpflänge. Der Gewerbezweig gewichtet Objekt und Profil höher
--      (45/25) und Verhalten niedriger (15).
-- =============================================================================

-- --- K6: Lead Score mit Privat- und Gewerbezweig -------------------------------
CREATE OR REPLACE FUNCTION crm_fn_lead_score(p_lead uuid)
RETURNS crm_typ_score LANGUAGE plpgsql STABLE AS $$
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
$$;

-- --- K5: Customer Value mit Erreichbarkeitsnormierung --------------------------
CREATE OR REPLACE FUNCTION crm_fn_customer_value(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
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
$$;
