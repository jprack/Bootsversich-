-- =============================================================================
--  01_CRM_ENGINE — Optimierung
--
--  O1  Der Duplikatsschutz lief in einen Seq Scan.
--      Die mit D1 eingeführte Bedingung "bezug_id IS NOT DISTINCT FROM ..."
--      ist nicht indexfähig: PostgreSQL kann sie keinem Index zuordnen und
--      liest die gesamte Aufgabentabelle. Gemessen 3,9 ms je Prüfung bei
--      1.725 gelesenen Blöcken — bei rund 7.000 Regelauslösungen je Nachtlauf
--      der mit Abstand größte Einzelposten.
--
--      Die Abfrage wird in zwei Zweige zerlegt: mit Bezugsobjekt läuft sie über
--      den vorhandenen Teilindex, ohne Bezugsobjekt über einen neuen.
--
--  O2  Fehlende Indizes für Zugriffe, die erst mit dem Regelwerk entstanden sind
--      (Next-Best-Offer-Chancen, Signalmuster, Sammelaufgaben).
-- =============================================================================

-- --- O2: Indizes ---------------------------------------------------------------
-- Duplikatsschutz für Aufgaben ohne Bezugsobjekt (Sammelaufgaben, Kapazitätswarnung)
CREATE INDEX IF NOT EXISTS idx_aufgabe_dedup_ohne_bezug
    ON crm_aufgabe (mandant_id, zugewiesen_an, regel_code, typ, gruppierungs_schluessel)
    WHERE bezug_id IS NULL AND status IN ('offen','in_arbeit') AND quelle = 'automatisch';

-- D4: Suche nach einer bereits offenen Chance derselben Regel und desselben Kunden
CREATE INDEX IF NOT EXISTS idx_opp_nbo
    ON crm_opportunity (mandant_id, kunde_id, regel_code)
    WHERE ursprung = 'next_best_offer' AND pipeline_stufe NOT IN ('gewonnen','verloren');

-- Bündelung und Lastschutz gruppieren über diese Kombination
CREATE INDEX IF NOT EXISTS idx_aufgabe_buendelung
    ON crm_aufgabe (mandant_id, zugewiesen_an, regel_code, typ)
    WHERE status = 'offen' AND quelle = 'automatisch';

-- Mustererkennung liest je Lauf den Tagesbestand
CREATE INDEX IF NOT EXISTS idx_muster_tag
    ON crm_signal_muster (mandant_id, code, erkannt_am);

-- Offene Vorschläge für A-30
CREATE INDEX IF NOT EXISTS idx_nbo_offen
    ON crm_nbo_vorschlag (mandant_id, status) WHERE status = 'offen';

-- --- O1: Duplikatsschutz in zwei indexfähige Zweige zerlegen --------------------
CREATE OR REPLACE FUNCTION crm_fn_aufgabe(
    p_mandant uuid, p_regel text, p_titel text, p_beschreibung text, p_typ text,
    p_prioritaet text, p_faellig timestamptz, p_benutzer uuid,
    p_bezug_typ text, p_bezug uuid, p_wert numeric DEFAULT NULL,
    p_sla timestamptz DEFAULT NULL, p_kontext jsonb DEFAULT '{}'::jsonb,
    p_gruppe text DEFAULT NULL, p_wert_kumulieren boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql AS $$
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
$$;
