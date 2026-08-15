-- =============================================================================
--  01_CRM_ENGINE — Lastschutz (K7)
--
--  Der Lasttest hat gezeigt: Über 5.000 Leads und 2.000 Kunden erzeugt das
--  Regelwerk 6.863 offene Aufgaben, davon 2.910 für einen einzigen Benutzer.
--  Kapitel 7.8 des Konzepts schreibt höchstens 25 automatisch erzeugte Aufgaben
--  je Benutzer und Tag vor — diese Regel war beschrieben, aber nicht umgesetzt.
--  Bei zehn Demokunden fiel das nicht auf, weil die Menge zufällig darunter lag.
--
--  Ein System, das 2.910 Aufgaben zeigt, wird ignoriert. Damit wäre die gesamte
--  Intelligenz des Moduls wertlos.
--
--  Zwei Mechanismen, in dieser Reihenfolge:
--    1. BÜNDELUNG  — gleichartige Aufgaben niedriger Dringlichkeit werden zu
--                    einer Sammelaufgabe mit Liste zusammengefasst.
--    2. STAFFELUNG — was dann noch über dem Tageslimit liegt, wird nach
--                    Prioritätsscore auf Folgetage verteilt.
--
--  Unantastbar: Aufgaben mit Priorität "kritisch" und Aufgaben mit SLA-Frist
--  werden weder gebündelt noch verschoben. Sonst würde der Lastschutz genau die
--  Fälle verstecken, für die das System gebaut ist.
-- =============================================================================

CREATE OR REPLACE FUNCTION crm_fn_lastschutz(p_mandant uuid, p_tageslimit int DEFAULT 25)
RETURNS TABLE(schritt text, ergebnis text) LANGUAGE plpgsql AS $$
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
$$;

-- In den Nachtlauf einhängen: Lastschutz nach der Priorisierung
CREATE OR REPLACE FUNCTION crm_fn_engine_lauf(p_mandant uuid)
RETURNS TABLE(schritt text, ergebnis text) LANGUAGE plpgsql AS $$
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
$$;

-- =============================================================================
--  K8: A-21 terminiert auf den nächsten Staffelpunkt statt auf heute
--
--  Der Lasttest zeigte 223 Hauptfälligkeitsgespräche für einen Benutzer am
--  selben Tag. Ursache: Die Regel setzte die Fälligkeit auf
--  current_date + (tage - 60), was für jeden Vertrag mit Restlaufzeit <= 60
--  Tagen "heute" ergibt. Die Staffel W-03 sieht drei Kontaktpunkte vor
--  (T-90, T-60, T-30); die Aufgabe gehört an den jeweils nächsten davon.
-- =============================================================================
CREATE OR REPLACE FUNCTION crm_fn_hauptfaelligkeit_termin(p_tage int)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$
    SELECT date_trunc('day', now())
         + (CASE WHEN p_tage > 90 THEN p_tage - 90      -- noch vor T-90
                 WHEN p_tage > 60 THEN p_tage - 60      -- nächster Punkt: T-60
                 WHEN p_tage > 30 THEN p_tage - 30      -- nächster Punkt: T-30
                 ELSE 0 END || ' days')::interval
         + interval '9 hours';
$$;

-- =============================================================================
--  K9: Kapazitätswarnung statt stillem Rückstau
--
--  Aufgaben mit SLA-Frist dürfen nicht verschoben werden — sonst versteckt der
--  Lastschutz genau die Fälle, für die das System gebaut ist. Bleibt die Last
--  danach über dem Limit, ist das kein Systemfehler, sondern ein Kapazitäts-
--  problem. Es gehört auf den Tisch der Teamleitung, nicht in eine Warteschlange.
-- =============================================================================
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
                             'mit_sla',r.mit_sla,'sla_verletzt',r.sla_verletzt,'tageslimit',p_tageslimit));
        n := n + 1;
    END LOOP;
    RETURN n;
END;
$$;

INSERT INTO crm_automation_regel (mandant_id,code,bezeichnung,ausloeser_typ,ausloeser,aktionen)
SELECT '11111111-0000-0000-0000-000000000001','A-49','Kapazität je Benutzer überschritten',
       'zeitplan','0 7 * * *','[{"typ":"eskalation"}]'
WHERE NOT EXISTS (SELECT 1 FROM crm_automation_regel WHERE code='A-49');
