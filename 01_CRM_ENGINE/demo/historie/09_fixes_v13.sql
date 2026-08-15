-- =============================================================================
--  01_CRM_ENGINE — Fassung 1.3
--  Drei Defekte, die erst der Lastbestand (5.009 Leads, 2.010 Kunden) und der
--  wiederholte Nachtlauf sichtbar gemacht haben.
--
--  D1  Duplikatsschutz greift nicht bei Aufgaben ohne Bezugsobjekt.
--      Der Abgleich verglich bezug_id = p_bezug; bei NULL ist das nie wahr.
--      Sammelaufgaben und Kapazitätswarnungen entstanden bei jedem Lauf neu.
--
--  D2  Der Aufgabenwert wurde über Läufe hinweg kumuliert.
--      Die Hauptfälligkeitsaufgabe von Nordwind trug nach dem zweiten Nachtlauf
--      28.560 € statt 14.280 €. Ursache war die mit K4 eingeführte Summierung
--      im Aufgabenhelfer. Die Summe gehört in die Abfrage, nicht in den Helfer.
--
--  D3  Reine Stille erreicht die Alarmschwelle nicht.
--      651 Kunden ohne Kontakt seit über 270 Tagen kamen auf höchstens 42
--      Risikopunkte, weil Stille allein nur 28 der 70 Verhaltenspunkte stellt.
--      Damit greift der Kernsatz des Moduls — "kein Kunde geht still verloren" —
--      ausgerechnet im reinen Stillfall nicht. Stille ist jetzt ein Eskalator.
-- =============================================================================

-- --- D1: Duplikatsschutz auch ohne Bezugsobjekt --------------------------------
CREATE OR REPLACE FUNCTION crm_fn_aufgabe(
    p_mandant uuid, p_regel text, p_titel text, p_beschreibung text, p_typ text,
    p_prioritaet text, p_faellig timestamptz, p_benutzer uuid,
    p_bezug_typ text, p_bezug uuid, p_wert numeric DEFAULT NULL,
    p_sla timestamptz DEFAULT NULL, p_kontext jsonb DEFAULT '{}'::jsonb,
    p_gruppe text DEFAULT NULL, p_wert_kumulieren boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_vorhanden uuid;
BEGIN
    -- Bei Aufgaben ohne Bezugsobjekt unterscheidet der Empfänger zusammen mit
    -- dem Gruppierungsschlüssel; NULL-Vergleiche brauchen IS NOT DISTINCT FROM.
    SELECT id INTO v_vorhanden FROM crm_aufgabe
     WHERE mandant_id = p_mandant
       AND bezug_typ = p_bezug_typ
       AND bezug_id IS NOT DISTINCT FROM p_bezug
       AND typ = p_typ AND regel_code = p_regel
       AND status IN ('offen','in_arbeit')
       AND (p_bezug IS NOT NULL
            OR (zugewiesen_an = p_benutzer
                AND coalesce(gruppierungs_schluessel,'') = coalesce(p_gruppe,'')))
     LIMIT 1;

    IF v_vorhanden IS NOT NULL THEN
        UPDATE crm_aufgabe SET titel=p_titel, beschreibung=p_beschreibung,
               faellig_am=least(faellig_am,p_faellig), prioritaet=p_prioritaet, kontext=p_kontext,
               erwarteter_wert_eur = CASE WHEN p_wert_kumulieren
                                          THEN coalesce(erwarteter_wert_eur,0)+coalesce(p_wert,0)
                                          ELSE coalesce(p_wert,erwarteter_wert_eur) END
         WHERE id=v_vorhanden;
        INSERT INTO crm_automation_lauf (mandant_id,regel_id,regel_code,bezug_typ,bezug_id,status,ergebnis)
        SELECT p_mandant,r.id,p_regel,p_bezug_typ,p_bezug,'uebersprungen',
               jsonb_build_object('grund','aufgabe_bereits_offen','aufgabe_id',v_vorhanden)
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

-- Kapazitätswarnung: je Benutzer eindeutig
CREATE OR REPLACE FUNCTION crm_fn_kapazitaetswarnung(p_mandant uuid, p_tageslimit int DEFAULT 25)
RETURNS int LANGUAGE plpgsql AS $$
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
$$;

-- --- D3: Stille als Eskalator --------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_risk(p_kunde uuid) RETURNS void LANGUAGE plpgsql AS $$
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
$$;

-- --- Lastschutz: Bündelung wiederholbar machen ---------------------------------
CREATE OR REPLACE FUNCTION crm_fn_lastschutz_zuruecksetzen(p_mandant uuid) RETURNS void LANGUAGE sql AS $$
    WITH weg AS (
        DELETE FROM crm_aufgabe
         WHERE mandant_id = p_mandant AND gruppierungs_schluessel = 'sammelaufgabe'
           AND status IN ('offen','in_arbeit')
        RETURNING id)
    UPDATE crm_aufgabe SET gruppierungs_schluessel = NULL
     WHERE mandant_id = p_mandant AND gruppierungs_schluessel = 'gebuendelt';
$$;

-- =============================================================================
--  D4: Next Best Offer erzeugte bei jedem Nachtlauf neue Opportunities
--
--  crm_fn_next_best_offer() verwirft offene Vorschläge und legt sie neu an —
--  mit neuer ID. A-30 sah daraufhin einen unbekannten Vorschlag und erzeugte
--  eine weitere Opportunity samt Aufgabe. Im Lasttest wuchs der Aufgabenbestand
--  dadurch um rund 1.423 Einträge je Lauf; die Pipeline hätte sich jede Nacht
--  um etwa 1.400 Phantom-Chancen aufgebläht.
--
--  A-30 prüft jetzt auf eine bereits offene Chance derselben Regel und desselben
--  Kunden und hängt den Vorschlag daran, statt eine zweite anzulegen.
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_nbo_opportunity(p_mandant uuid, p_nbo uuid) RETURNS uuid
LANGUAGE plpgsql AS $$
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
$$;

-- --- D3 nachgeschärft: eine einzige Definition von "Stille" --------------------
-- Regel und Prüfung müssen dieselbe Grenze verwenden, sonst entstehen
-- Randfälle von wenigen Tagen Differenz.
CREATE OR REPLACE FUNCTION crm_fn_ist_stiller_rueckzug(p_kunde uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT k.status='aktiv'
       AND k.letzter_kontakt_am < now() - interval '270 days'
       AND coalesce(k.customer_value_score,0) >= 35
      FROM crm_kunde k WHERE k.id = p_kunde;
$$;
