-- =============================================================================
--  CALLIDUS BOAT INTELLIGENCE PLATFORM
--  Modul 01_CRM_ENGINE — Datenbankschema
--  PostgreSQL >= 15
--
--  Konventionen (aus 00_MASTER_SYSTEM, siehe 01_CRM_ENGINE/README.md Kap. 1):
--    - PK           : uuid, Spaltenname "id"
--    - Präfix       : crm_
--    - Read-Model   : Suffix _ref (Projektion fremder Module, nur lesend befüllt
--                     über den Event-Bus — dieses Modul besitzt die Daten nicht)
--    - Zeit         : timestamptz (UTC)
--    - Audit        : erstellt_am, erstellt_von, geaendert_am, geaendert_von
--    - Soft Delete  : geloescht_am
--    - Mandant      : mandant_id auf jeder fachlichen Tabelle + RLS
--
--  Reihenfolge: Extensions -> Hilfsfunktionen -> Stammdaten -> Kern -> Vertrieb
--               -> Signale/Scoring -> Automatisierung -> Indizes -> Views -> RLS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Fuzzy-Suche / Dublettenerkennung
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- -----------------------------------------------------------------------------
-- 0. Hilfsfunktionen
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm_fn_set_geaendert_am()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.geaendert_am := now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION crm_fn_aktueller_mandant()
RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.mandant_id', true), '')::uuid;
$$;


-- =============================================================================
-- 1. PLATTFORM-REFERENZEN (Projektionen, nicht Eigentum dieses Moduls)
-- =============================================================================

CREATE TABLE crm_mandant_ref (
    id              uuid PRIMARY KEY,
    name            text NOT NULL,
    kurzname        text,
    aktiv           boolean NOT NULL DEFAULT true,
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE crm_mandant_ref IS 'Projektion der Mandanten aus der Plattform-IAM. Nur lesend befüllt.';

CREATE TABLE crm_benutzer_ref (
    id              uuid PRIMARY KEY,
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    anzeigename     text NOT NULL,
    email           text NOT NULL,
    rolle           text NOT NULL DEFAULT 'vertrieb'
                    CHECK (rolle IN ('vertrieb','innendienst','teamleitung',
                                     'vertriebsleitung','marketing','partner_manager',
                                     'admin','system')),
    aktiv           boolean NOT NULL DEFAULT true,
    abwesend_bis    date,
    vertretung_id   uuid REFERENCES crm_benutzer_ref(id),
    kapazitaet_leads_pro_woche int NOT NULL DEFAULT 20,
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_team (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    name            text NOT NULL,
    leiter_id       uuid REFERENCES crm_benutzer_ref(id),
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, name)
);

CREATE TABLE crm_team_mitglied (
    team_id         uuid NOT NULL REFERENCES crm_team(id) ON DELETE CASCADE,
    benutzer_id     uuid NOT NULL REFERENCES crm_benutzer_ref(id) ON DELETE CASCADE,
    rolle_im_team   text NOT NULL DEFAULT 'mitglied',
    PRIMARY KEY (team_id, benutzer_id)
);

-- Vertriebsgebiet: PLZ-Bereiche, Reviere, Länder, Segmente
CREATE TABLE crm_gebiet (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    name            text NOT NULL,
    typ             text NOT NULL CHECK (typ IN ('plz','revier','land','segment','named_account')),
    kriterium       jsonb NOT NULL,      -- {plz_von, plz_bis} | {revier:[...]} | {segment:[...]}
    verantwortlicher_id uuid REFERENCES crm_benutzer_ref(id),
    team_id         uuid REFERENCES crm_team(id),
    prioritaet      int NOT NULL DEFAULT 100,   -- kleiner = gewinnt bei Überschneidung
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. KATALOGE
-- =============================================================================

-- Zentraler, fachlich pflegbarer Statuskatalog (Lead, Opportunity, Empfehlung, ...)
CREATE TABLE crm_status_definition (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    domaene         text NOT NULL CHECK (domaene IN ('lead','opportunity','angebot','aufgabe',
                                                     'empfehlung','aktivitaet','kunde','partner')),
    code            text NOT NULL,
    bezeichnung     text NOT NULL,
    beschreibung    text,
    reihenfolge     int  NOT NULL DEFAULT 0,
    ist_startstatus boolean NOT NULL DEFAULT false,
    ist_endstatus   boolean NOT NULL DEFAULT false,
    ist_erfolg      boolean NOT NULL DEFAULT false,
    basis_wahrscheinlichkeit int CHECK (basis_wahrscheinlichkeit BETWEEN 0 AND 100),
    max_verweildauer_tage int,
    farbe           text,
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, domaene, code)
);

CREATE TABLE crm_produkt (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,
    bezeichnung     text NOT NULL,
    sparte          text NOT NULL CHECK (sparte IN ('haftpflicht','kasko','vollkasko','skipper',
                                                    'unfall','rechtsschutz','transport','charter',
                                                    'flotte','winterlager','sonstige')),
    zielsegment     text[],
    durchschnittspraemie_eur numeric(12,2),
    courtage_prozent numeric(5,2),
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, code)
);

CREATE TABLE crm_lead_quelle (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,                -- WEB, LP, NL, BREVO, EMPF, WERFT, ...
    bezeichnung     text NOT NULL,
    kategorie       text NOT NULL CHECK (kategorie IN ('inbound','owned','paid_social','partner',
                                                       'netzwerk','event','plattform','sonstige')),
    kostenmodell    text CHECK (kostenmodell IN ('fix','cpc','cpl','courtage','provision','keine')),
    erwartete_qualitaet text CHECK (erwartete_qualitaet IN ('sehr_hoch','hoch','mittel','niedrig','unbekannt')),
    partner_id      uuid,                          -- FK wird nach crm_partner gesetzt
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, code)
);

-- Monatliche Kosten je Quelle -> Basis für CPL, CAC, ROI, Quellen-Index
CREATE TABLE crm_lead_quelle_kosten (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    quelle_id       uuid NOT NULL REFERENCES crm_lead_quelle(id) ON DELETE CASCADE,
    jahr            int  NOT NULL,
    monat           int  NOT NULL CHECK (monat BETWEEN 1 AND 12),
    kosten_eur      numeric(14,2) NOT NULL DEFAULT 0,
    bemerkung       text,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (quelle_id, jahr, monat)
);

CREATE TABLE crm_kampagne (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    name            text NOT NULL,
    externe_id      text,                          -- Brevo Campaign-Id
    system          text NOT NULL DEFAULT 'brevo' CHECK (system IN ('brevo','intern','meta','linkedin','google','sonstige')),
    typ             text CHECK (typ IN ('newsletter','nurturing','event','reaktivierung','cross_sell','win_back')),
    start_am        date,
    ende_am         date,
    budget_eur      numeric(14,2),
    quelle_id       uuid REFERENCES crm_lead_quelle(id),
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. KERN: ORGANISATION, KONTAKT, KUNDE
-- =============================================================================

CREATE TABLE crm_organisation (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    name            text NOT NULL,
    rechtsform      text,
    branche         text,
    handelsregister text,
    ust_id          text,
    website         text,
    telefon         text,
    email           text,
    strasse         text,
    plz             text,
    ort             text,
    land            text NOT NULL DEFAULT 'DE',
    mitarbeiterzahl int,
    ist_gewerblich  boolean NOT NULL DEFAULT true,
    ist_partner     boolean NOT NULL DEFAULT false,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz
);

CREATE TABLE crm_kontakt (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    organisation_id uuid REFERENCES crm_organisation(id),

    -- Identität
    anrede          text CHECK (anrede IN ('herr','frau','divers','firma','keine')),
    titel           text,
    vorname         text,
    nachname        text NOT NULL,
    geburtsdatum    date,
    sprache         text NOT NULL DEFAULT 'de',

    -- Erreichbarkeit
    email           text,
    email_zweit     text,
    telefon         text,           -- E.164
    mobil           text,           -- E.164
    strasse         text,
    plz             text,
    ort             text,
    land            text NOT NULL DEFAULT 'DE',

    -- Lebenszyklus (linear) + Rollen (Overlay)
    lifecycle_stufe text NOT NULL DEFAULT 'S1_lead'
                    CHECK (lifecycle_stufe IN ('S0_unbekannt','S1_lead','S2_qualifiziert',
                                               'S3_opportunity','S4_angebot','S5_abschluss',
                                               'S6_bestandskunde','S8_ehemalig','S9_archiviert')),
    stufe_seit      timestamptz NOT NULL DEFAULT now(),
    stufen_grund    text,
    rollen          text[] NOT NULL DEFAULT '{}',   -- empfehlungsgeber, vip, partner, multiplikator, testimonial

    -- Vertriebssteuerung
    verantwortlicher_id uuid REFERENCES crm_benutzer_ref(id),
    gebiet_id       uuid REFERENCES crm_gebiet(id),

    -- Tracking-Identität
    tracking_ids    text[] NOT NULL DEFAULT '{}',   -- Cookie-/Consent-IDs zur Signalauflösung
    engagement_score int NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
    letzter_kontakt_am timestamptz,
    letztes_signal_am  timestamptz,

    -- Dublettenverwaltung
    dublette_von_id uuid REFERENCES crm_kontakt(id),
    zusammengefuehrt_am timestamptz,

    notiz           text,
    zusatzfelder    jsonb NOT NULL DEFAULT '{}'::jsonb,

    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz,

    CONSTRAINT crm_kontakt_erreichbarkeit CHECK (
        email IS NOT NULL OR telefon IS NOT NULL OR mobil IS NOT NULL
        OR lifecycle_stufe = 'S0_unbekannt'
    )
);

-- DSGVO: Einwilligungen je Kanal und Zweck, historisiert (nie überschreiben)
CREATE TABLE crm_consent (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    tracking_id     text,                            -- vor Identitätsauflösung
    kanal           text NOT NULL CHECK (kanal IN ('email','telefon','post','whatsapp','sms','tracking','profiling')),
    zweck           text NOT NULL CHECK (zweck IN ('werbung','vertragsanbahnung','tracking','profilbildung','umfrage')),
    status          text NOT NULL CHECK (status IN ('erteilt','verweigert','widerrufen','unbekannt')),
    gueltig_ab      timestamptz NOT NULL DEFAULT now(),
    gueltig_bis     timestamptz,
    rechtsgrundlage text CHECK (rechtsgrundlage IN ('einwilligung','vertrag','berechtigtes_interesse','gesetzlich')),
    nachweis_quelle text,                            -- Formular-URL, Double-Opt-In-Mail-Id, Beleg
    nachweis_ip     inet,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    CHECK (kontakt_id IS NOT NULL OR tracking_id IS NOT NULL)
);

CREATE TABLE crm_kunde (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kundennummer    text NOT NULL,
    organisation_id uuid REFERENCES crm_organisation(id),
    haupt_kontakt_id uuid REFERENCES crm_kontakt(id),
    bezeichnung     text NOT NULL,

    kundentyp       text NOT NULL DEFAULT 'privat'
                    CHECK (kundentyp IN ('privat','gewerblich','verein','charterbetrieb','flotte','oeffentlich')),
    status          text NOT NULL DEFAULT 'aktiv'
                    CHECK (status IN ('aktiv','inaktiv','ehemalig','gesperrt')),
    kunde_seit      date,
    kunde_bis       date,
    beendigungsgrund text,

    betreuer_id     uuid REFERENCES crm_benutzer_ref(id),
    team_id         uuid REFERENCES crm_team(id),
    betreuungsstufe text NOT NULL DEFAULT 'standard'
                    CHECK (betreuungsstufe IN ('vip','kern','standard','basis','beobachtung')),

    -- Wirtschaft (aggregiert aus crm_vertrag_ref, nächtlich fortgeschrieben)
    jahrespraemie_eur   numeric(14,2) NOT NULL DEFAULT 0,
    lifetime_value_eur  numeric(14,2) NOT NULL DEFAULT 0,
    deckungsbeitrag_eur numeric(14,2) NOT NULL DEFAULT 0,
    anzahl_vertraege    int NOT NULL DEFAULT 0,
    anzahl_boote        int NOT NULL DEFAULT 0,
    schadenquote_prozent numeric(6,2),
    zahlungsverzug_tage int NOT NULL DEFAULT 0,

    -- Scores (Details in crm_kunde_score)
    customer_value_score int NOT NULL DEFAULT 0 CHECK (customer_value_score BETWEEN 0 AND 100),
    risk_score           int NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risiko_stufe         text NOT NULL DEFAULT 'niedrig' CHECK (risiko_stufe IN ('hoch','mittel','niedrig')),

    letzter_kontakt_am  timestamptz,
    naechstes_jahresgespraech_am date,

    zusatzfelder    jsonb NOT NULL DEFAULT '{}'::jsonb,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz,
    UNIQUE (mandant_id, kundennummer)
);

CREATE TABLE crm_kunde_kontakt (
    kunde_id        uuid NOT NULL REFERENCES crm_kunde(id) ON DELETE CASCADE,
    kontakt_id      uuid NOT NULL REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    rolle           text NOT NULL DEFAULT 'ansprechpartner'
                    CHECK (rolle IN ('inhaber','eigner','entscheider','ansprechpartner','skipper',
                                     'mitversichert','ehepartner','buchhaltung','technik','vertretung')),
    ist_hauptkontakt boolean NOT NULL DEFAULT false,
    gueltig_ab      date NOT NULL DEFAULT current_date,
    gueltig_bis     date,
    PRIMARY KEY (kunde_id, kontakt_id, rolle)
);

-- Historie aller Lebenszykluswechsel (Kontakt und Kunde)
CREATE TABLE crm_lifecycle_historie (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    von_stufe       text,
    nach_stufe      text NOT NULL,
    grund           text,
    dauer_in_stufe_tage int,
    ausgeloest_durch text NOT NULL DEFAULT 'system' CHECK (ausgeloest_durch IN ('system','benutzer','import','event')),
    benutzer_id     uuid REFERENCES crm_benutzer_ref(id),
    zeitstempel     timestamptz NOT NULL DEFAULT now(),
    CHECK (kontakt_id IS NOT NULL OR kunde_id IS NOT NULL)
);


-- =============================================================================
-- 4. READ-MODELS FREMDER MODULE (nur über Event-Bus befüllt)
-- =============================================================================

CREATE TABLE crm_boot_ref (
    id              uuid PRIMARY KEY,               -- ID aus dem Objektmodul
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid REFERENCES crm_kunde(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id),
    name            text,
    boot_typ        text CHECK (boot_typ IN ('segelyacht','motoryacht','sportboot','jolle','katamaran',
                                             'trawler','rib','hausboot','klassiker','jetski','sonstiges')),
    hersteller      text,
    modell          text,
    baujahr         int,
    laenge_m        numeric(5,2),
    breite_m        numeric(5,2),
    tiefgang_m      numeric(4,2),
    motorleistung_kw numeric(8,2),
    rumpfnummer     text,
    wert_eur        numeric(14,2),
    wert_geprueft_am date,
    liegeplatz_land text,
    liegeplatz_marina text,
    liegeplatz_partner_id uuid,
    fahrgebiet      text CHECK (fahrgebiet IN ('binnen','kuestennah','nord_ostsee','mittelmeer','atlantik','weltweit')),
    nutzungsart     text CHECK (nutzungsart IN ('privat','gewerblich_charter','gewerblich_flotte','regatta','verein')),
    status          text CHECK (status IN ('aktiv','verkauft','abgemeldet','in_bau','geplant')),
    erworben_am     date,
    veraeussert_am  date,
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE crm_boot_ref IS 'Projektion des Objektmoduls. Schreibend nur durch den Event-Consumer.';

CREATE TABLE crm_vertrag_ref (
    id              uuid PRIMARY KEY,
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid REFERENCES crm_kunde(id),
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    policennummer   text,
    produkt_code    text,
    sparte          text,
    status          text CHECK (status IN ('antrag','aktiv','ruhend','gekuendigt','abgelaufen','storniert')),
    beginn_am       date,
    ende_am         date,
    hauptfaelligkeit date,
    kuendigungsfrist_tage int,
    jahrespraemie_eur numeric(14,2),
    versicherungssumme_eur numeric(14,2),
    selbstbehalt_eur numeric(12,2),
    courtage_eur    numeric(12,2),
    deckungsumfang  text[],
    fahrgebiet      text,
    gekuendigt_von  text CHECK (gekuendigt_von IN ('kunde','versicherer','ablauf','bootsverkauf')),
    kuendigungsgrund text,
    praemienaenderung_prozent numeric(6,2),
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_schaden_ref (
    id              uuid PRIMARY KEY,
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid REFERENCES crm_kunde(id),
    vertrag_ref_id  uuid REFERENCES crm_vertrag_ref(id),
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    schadennummer   text,
    schadendatum    date,
    meldedatum      date,
    schadenart      text,
    status          text CHECK (status IN ('gemeldet','in_pruefung','reguliert','abgelehnt','geschlossen')),
    schadenhoehe_eur numeric(14,2),
    zahlung_eur     numeric(14,2),
    regulierungsdauer_tage int,
    zufriedenheit   int CHECK (zufriedenheit BETWEEN 1 AND 5),
    beschwerde      boolean NOT NULL DEFAULT false,
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_dokument_ref (
    id              uuid PRIMARY KEY,
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid REFERENCES crm_kunde(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id),
    bezug_typ       text CHECK (bezug_typ IN ('lead','opportunity','angebot','vertrag','schaden','kunde','partner')),
    bezug_id        uuid,
    dateiname       text NOT NULL,
    dokumentart     text,
    mime_typ        text,
    groesse_bytes   bigint,
    speicher_url    text,
    hochgeladen_am  timestamptz,
    synchronisiert_am timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 5. VERTRIEB: LEAD, OPPORTUNITY, ANGEBOT
-- =============================================================================

CREATE TABLE crm_lead (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    leadnummer      text NOT NULL,
    kontakt_id      uuid NOT NULL REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id),          -- gesetzt bei Bestandskunden-Lead

    -- Bedarf
    bedarfsart      text NOT NULL CHECK (bedarfsart IN ('neuversicherung','wechsel','zusatzdeckung',
                                                        'bootswechsel','flotte','charter','skipper',
                                                        'transport','winterlager','sonstiges')),
    beschreibung    text,
    produktinteresse text[] NOT NULL DEFAULT '{}',
    zeitfenster     text CHECK (zeitfenster IN ('sofort','4_wochen','3_monate','saison','unklar')),
    budget_indikation_eur numeric(14,2),

    -- Objekt (Leaddaten, bevor ein Boot im Objektmodul existiert)
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    boot_typ        text,
    boot_laenge_m   numeric(5,2),
    boot_wert_eur   numeric(14,2),
    boot_baujahr    int,
    motorleistung_kw numeric(8,2),
    liegeplatz_land text,
    liegeplatz_marina text,
    fahrgebiet      text CHECK (fahrgebiet IN ('binnen','kuestennah','nord_ostsee','mittelmeer','atlantik','weltweit')),
    nutzungsart     text CHECK (nutzungsart IN ('privat','gewerblich_charter','gewerblich_flotte','regatta','verein')),
    unternehmerstatus boolean NOT NULL DEFAULT false,

    -- Wettbewerb / Timing
    bestehender_versicherer text,
    hauptfaelligkeit_bestand date,

    -- Steuerung
    quelle_id       uuid NOT NULL REFERENCES crm_lead_quelle(id),
    kampagne_id     uuid REFERENCES crm_kampagne(id),
    empfehlung_id   uuid,                                    -- FK nach crm_empfehlung (später gesetzt)
    verantwortlicher_id uuid REFERENCES crm_benutzer_ref(id),

    status          text NOT NULL DEFAULT 'neu'
                    CHECK (status IN ('neu','in_bearbeitung','kontaktiert','qualifiziert',
                                      'nurturing','konvertiert','disqualifiziert','dublette')),
    disqualifikationsgrund text CHECK (disqualifikationsgrund IN (
                        'kein_bedarf','kein_boot','nicht_erreichbar','falsche_daten','fremdmarkt',
                        'nicht_zeichenbar','wettbewerb','widerspruch','dublette','testdaten','sonstiges')),

    -- Scoring
    lead_score      int NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
    lead_kategorie  text NOT NULL DEFAULT 'D' CHECK (lead_kategorie IN ('A','B','C','D')),
    score_regel     int,
    score_ki        int,
    score_erklaerung jsonb NOT NULL DEFAULT '[]'::jsonb,     -- [{faktor, punkte, richtung}]
    score_berechnet_am timestamptz,
    intent_score    numeric(8,2) NOT NULL DEFAULT 0,

    -- SLA / Fortschritt
    eingegangen_am  timestamptz NOT NULL DEFAULT now(),
    erstkontakt_faellig_am timestamptz,
    erstkontakt_am  timestamptz,
    reaktionszeit_minuten int,
    qualifiziert_am timestamptz,
    konvertiert_am  timestamptz,
    naechster_schritt_am timestamptz,

    dublette_von_id uuid REFERENCES crm_lead(id),
    zusatzfelder    jsonb NOT NULL DEFAULT '{}'::jsonb,

    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz,

    UNIQUE (mandant_id, leadnummer),
    CONSTRAINT crm_lead_disq_grund CHECK (
        status <> 'disqualifiziert' OR disqualifikationsgrund IS NOT NULL
    )
);

-- Attribution: First / Last / Multi-Touch parallel
CREATE TABLE crm_lead_attribution (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    lead_id         uuid NOT NULL REFERENCES crm_lead(id) ON DELETE CASCADE,
    quelle_id       uuid NOT NULL REFERENCES crm_lead_quelle(id),
    kampagne_id     uuid REFERENCES crm_kampagne(id),
    modell          text NOT NULL CHECK (modell IN ('first_touch','last_touch','multi_touch')),
    gewicht         numeric(5,4) NOT NULL DEFAULT 1.0,
    kontaktpunkt_am timestamptz NOT NULL,
    erstellt_am     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_opportunity (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    opportunity_nummer text NOT NULL,
    name            text NOT NULL,

    kunde_id        uuid REFERENCES crm_kunde(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id),
    lead_id         uuid REFERENCES crm_lead(id),
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    vertrag_ref_id  uuid REFERENCES crm_vertrag_ref(id),     -- bei Wechsel/Verlängerung

    wert_eur        numeric(14,2) NOT NULL CHECK (wert_eur >= 0),   -- Jahresprämie
    deckungsbeitrag_eur numeric(14,2),
    courtage_prozent numeric(5,2),
    wahrscheinlichkeit int NOT NULL DEFAULT 10 CHECK (wahrscheinlichkeit BETWEEN 0 AND 100),
    wahrscheinlichkeit_manuell boolean NOT NULL DEFAULT false,
    wahrscheinlichkeit_begruendung text,

    produktinteresse text[] NOT NULL DEFAULT '{}',
    deckungsumfang  text[],
    versicherungssumme_eur numeric(14,2),
    selbstbehalt_eur numeric(12,2),
    fahrgebiet      text,
    hauptfaelligkeit_ziel date,

    wettbewerber    text,
    wettbewerbspraemie_eur numeric(14,2),

    quelle_id       uuid NOT NULL REFERENCES crm_lead_quelle(id),
    kampagne_id     uuid REFERENCES crm_kampagne(id),
    verantwortlicher_id uuid NOT NULL REFERENCES crm_benutzer_ref(id),
    team_id         uuid REFERENCES crm_team(id),

    pipeline_stufe  text NOT NULL DEFAULT 'neu'
                    CHECK (pipeline_stufe IN ('neu','in_bearbeitung','angebot','verhandlung',
                                              'pausiert','gewonnen','verloren')),
    stufe_seit      timestamptz NOT NULL DEFAULT now(),
    erwartetes_abschlussdatum date NOT NULL,
    abgeschlossen_am timestamptz,

    gewinngrund     text CHECK (gewinngrund IN ('beratungsqualitaet','preis','deckungsumfang','schnelligkeit',
                                                'empfehlung_vertrauen','bestandskundenbindung','partnerbeziehung',
                                                'spezialloesung','service_schaden','sonstiges')),
    verlustgrund    text CHECK (verlustgrund IN ('preis','wettbewerbsangebot','bedingungen_deckung','selbstbehalt',
                                                 'kein_bedarf_mehr','boot_nicht_gekauft','boot_verkauft',
                                                 'zeitlich_verschoben','nicht_erreichbar','risiko_nicht_zeichenbar',
                                                 'unterlagen_fehlend','bestandsschutz_beim_wettbewerber',
                                                 'interne_kapazitaet','zeitablauf','sonstiges')),
    verlust_notiz   text,

    naechster_schritt text,
    naechster_schritt_am timestamptz,
    pausiert_bis    date,
    risiko_flags    jsonb NOT NULL DEFAULT '{}'::jsonb,
    ursprung        text NOT NULL DEFAULT 'manuell'
                    CHECK (ursprung IN ('manuell','lead_konversion','buying_signal','next_best_offer',
                                        'hauptfaelligkeit','empfehlung','partner')),
    regel_code      text,

    zusatzfelder    jsonb NOT NULL DEFAULT '{}'::jsonb,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz,

    UNIQUE (mandant_id, opportunity_nummer),
    CONSTRAINT crm_opp_bezug CHECK (kunde_id IS NOT NULL OR kontakt_id IS NOT NULL),
    CONSTRAINT crm_opp_verlustgrund CHECK (pipeline_stufe <> 'verloren' OR verlustgrund IS NOT NULL),
    CONSTRAINT crm_opp_gewinngrund  CHECK (pipeline_stufe <> 'gewonnen' OR gewinngrund IS NOT NULL),
    CONSTRAINT crm_opp_pausiert     CHECK (pipeline_stufe <> 'pausiert' OR pausiert_bis IS NOT NULL)
);

CREATE TABLE crm_opportunity_position (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  uuid NOT NULL REFERENCES crm_opportunity(id) ON DELETE CASCADE,
    produkt_id      uuid REFERENCES crm_produkt(id),
    bezeichnung     text NOT NULL,
    praemie_eur     numeric(14,2) NOT NULL DEFAULT 0,
    menge           int NOT NULL DEFAULT 1,
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    bemerkung       text,
    erstellt_am     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_opportunity_stufen_historie (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  uuid NOT NULL REFERENCES crm_opportunity(id) ON DELETE CASCADE,
    von_stufe       text,
    nach_stufe      text NOT NULL,
    dauer_tage      numeric(8,2),
    wahrscheinlichkeit_vorher int,
    wahrscheinlichkeit_nachher int,
    grund           text,
    benutzer_id     uuid REFERENCES crm_benutzer_ref(id),
    zeitstempel     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_angebot (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    opportunity_id  uuid NOT NULL REFERENCES crm_opportunity(id) ON DELETE CASCADE,
    angebotsnummer  text NOT NULL,
    variante        text NOT NULL DEFAULT 'basis' CHECK (variante IN ('basis','komfort','premium','individuell')),

    praemie_brutto_eur numeric(14,2) NOT NULL,
    praemie_netto_eur  numeric(14,2),
    versicherungssumme_eur numeric(14,2),
    selbstbehalt_eur   numeric(12,2),
    deckungsumfang     text[],
    laufzeit_monate    int,

    gueltig_bis     date NOT NULL,
    versendet_am    timestamptz,
    versandkanal    text CHECK (versandkanal IN ('email','post','persoenlich','portal')),
    dokument_ref_id uuid REFERENCES crm_dokument_ref(id),
    geoeffnet_am    timestamptz,
    oeffnungen_anzahl int NOT NULL DEFAULT 0,
    letzte_oeffnung_am timestamptz,

    status          text NOT NULL DEFAULT 'entwurf'
                    CHECK (status IN ('entwurf','versendet','geoeffnet','in_verhandlung',
                                      'angenommen','abgelehnt','abgelaufen','zurueckgezogen')),
    ablehnungsgrund text,
    entschieden_am  timestamptz,

    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    UNIQUE (mandant_id, angebotsnummer)
);


-- =============================================================================
-- 6. AKTIVITÄTEN UND AUFGABEN
-- =============================================================================

CREATE TABLE crm_aktivitaet (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),

    typ             text NOT NULL CHECK (typ IN ('email','anruf','termin','meeting','angebot','follow_up',
                                                 'dokument','empfehlung','besuch','notiz','system',
                                                 'kampagne','whatsapp','chat')),
    richtung        text NOT NULL DEFAULT 'ausgehend' CHECK (richtung IN ('eingehend','ausgehend','intern')),

    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    lead_id         uuid REFERENCES crm_lead(id) ON DELETE CASCADE,
    opportunity_id  uuid REFERENCES crm_opportunity(id) ON DELETE CASCADE,
    angebot_id      uuid REFERENCES crm_angebot(id) ON DELETE SET NULL,
    partner_id      uuid,
    empfehlung_id   uuid,
    dokument_ref_id uuid REFERENCES crm_dokument_ref(id),

    betreff         text NOT NULL,
    inhalt          text,
    zeitstempel     timestamptz NOT NULL DEFAULT now(),
    dauer_minuten   int CHECK (dauer_minuten >= 0),
    ort             text,
    teilnehmer      text[],

    benutzer_id     uuid NOT NULL REFERENCES crm_benutzer_ref(id),

    ergebnis        text NOT NULL CHECK (ergebnis IN ('erreicht_positiv','erreicht_neutral','erreicht_einwand',
                                                      'erreicht_absage','nicht_erreicht','terminiert','versendet',
                                                      'beantwortet','keine_reaktion','abgeschlossen')),
    ergebnis_notiz  text,
    stimmung        text CHECK (stimmung IN ('positiv','neutral','negativ')),

    folgeaktion     text NOT NULL CHECK (folgeaktion IN ('anruf','email','termin_vereinbaren','angebot_erstellen',
                                                         'unterlagen_anfordern','wiedervorlage','an_kollegen_uebergeben',
                                                         'opportunity_schliessen','nurturing','keine')),
    folgeaktion_am  timestamptz,
    erzeugte_aufgabe_id uuid,

    kanal_referenz  text,
    automatisch_erzeugt boolean NOT NULL DEFAULT false,
    sichtbarkeit    text NOT NULL DEFAULT 'team' CHECK (sichtbarkeit IN ('team','vertraulich')),

    erfasst_am      timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geloescht_am    timestamptz,

    CONSTRAINT crm_akt_bezug CHECK (kontakt_id IS NOT NULL OR kunde_id IS NOT NULL OR partner_id IS NOT NULL),
    CONSTRAINT crm_akt_folgeaktion_datum CHECK (folgeaktion = 'keine' OR folgeaktion_am IS NOT NULL),
    CONSTRAINT crm_akt_ergebnis_notiz CHECK (
        ergebnis NOT IN ('erreicht_einwand','erreicht_absage') OR ergebnis_notiz IS NOT NULL
    )
);

CREATE TABLE crm_aufgabe (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),

    titel           text NOT NULL,
    beschreibung    text,
    typ             text NOT NULL CHECK (typ IN ('erstkontakt','anruf','email','termin_vereinbaren','termin_vorbereiten',
                                                 'angebot_erstellen','angebot_nachfassen','unterlagen_anfordern',
                                                 'hauptfaelligkeit','jahresgespraech','wertpruefung','rueckhol_kontakt',
                                                 'beziehungspflege','empfehlungsanfrage','empfehlung_bearbeiten',
                                                 'geburtstag','partner_pflege','datenpflege','eskalation',
                                                 'exit_gespraech','win_back','sonstige')),

    prioritaet      text NOT NULL DEFAULT 'normal' CHECK (prioritaet IN ('kritisch','hoch','normal','niedrig')),
    prioritaets_score int NOT NULL DEFAULT 50 CHECK (prioritaets_score BETWEEN 0 AND 100),
    erwarteter_wert_eur numeric(14,2),

    faellig_am      timestamptz NOT NULL,
    sla_frist       timestamptz,
    erinnerung_am   timestamptz,

    zugewiesen_an   uuid NOT NULL REFERENCES crm_benutzer_ref(id),
    zugewiesen_team_id uuid REFERENCES crm_team(id),

    bezug_typ       text NOT NULL CHECK (bezug_typ IN ('lead','kunde','kontakt','opportunity','angebot',
                                                       'empfehlung','partner','vertrag_ref','schaden_ref','kein')),
    bezug_id        uuid,

    status          text NOT NULL DEFAULT 'offen'
                    CHECK (status IN ('offen','in_arbeit','wartet','erledigt','verworfen','delegiert')),
    quelle          text NOT NULL DEFAULT 'manuell'
                    CHECK (quelle IN ('automatisch','manuell','folgeaktion','eskalation','wiedervorlage')),
    regel_code      text,
    gruppierungs_schluessel text,       -- für Bündelung gleichartiger Aufgaben

    ergebnis        text CHECK (ergebnis IN ('erledigt_erfolgreich','erledigt_ohne_erfolg','nicht_erreicht',
                                             'verschoben','delegiert','verworfen','automatisch_erledigt')),
    ergebnis_notiz  text,
    erledigt_am     timestamptz,
    erledigt_von    uuid REFERENCES crm_benutzer_ref(id),
    erzeugte_aktivitaet_id uuid REFERENCES crm_aktivitaet(id),

    eskalationsstufe int NOT NULL DEFAULT 0 CHECK (eskalationsstufe BETWEEN 0 AND 2),
    eskaliert_am    timestamptz,
    verschoben_anzahl int NOT NULL DEFAULT 0,

    checkliste      jsonb NOT NULL DEFAULT '[]'::jsonb,
    vorlage_id      uuid,
    kontext         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- Score-Erklärung, Gesprächsaufhänger

    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz,

    CONSTRAINT crm_aufgabe_abschluss CHECK (status NOT IN ('erledigt','verworfen') OR ergebnis IS NOT NULL),
    CONSTRAINT crm_aufgabe_verworfen_grund CHECK (ergebnis <> 'verworfen' OR ergebnis_notiz IS NOT NULL)
);

ALTER TABLE crm_aktivitaet
    ADD CONSTRAINT crm_akt_aufgabe_fk FOREIGN KEY (erzeugte_aufgabe_id)
    REFERENCES crm_aufgabe(id) ON DELETE SET NULL;

-- Regelwerk für Wiedervorlagen (ohne Deployment pflegbar)
CREATE TABLE crm_wiedervorlage_regel (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,                  -- W-01 ... W-16
    bezeichnung     text NOT NULL,
    beschreibung    text,
    anlass          text NOT NULL,                  -- angebot_versendet, hauptfaelligkeit, geburtstag, ...
    bezug_typ       text NOT NULL,
    zeitpunkt_typ   text NOT NULL CHECK (zeitpunkt_typ IN ('relativ','absolut','wiederkehrend')),
    offset_tage     int,                            -- negativ = vorher
    cron_ausdruck   text,
    bedingung       text,                           -- SQL-Prädikat, gegen Sicht ausgewertet
    aufgabe_typ     text NOT NULL,
    aufgabe_titel_vorlage text NOT NULL,
    prioritaet      text NOT NULL DEFAULT 'normal',
    empfaenger_logik text NOT NULL DEFAULT 'betreuer'
                    CHECK (empfaenger_logik IN ('betreuer','verantwortlicher','team','teamleitung','partner_manager','fester_benutzer')),
    empfaenger_benutzer_id uuid REFERENCES crm_benutzer_ref(id),
    buendelbar      boolean NOT NULL DEFAULT false,
    aktiv           boolean NOT NULL DEFAULT true,
    gueltig_ab      date,
    gueltig_bis     date,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, code)
);


-- =============================================================================
-- 7. EMPFEHLUNGEN UND PARTNER
-- =============================================================================

CREATE TABLE crm_partner (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    organisation_id uuid REFERENCES crm_organisation(id),
    haupt_kontakt_id uuid REFERENCES crm_kontakt(id),
    name            text NOT NULL,
    partner_typ     text NOT NULL CHECK (partner_typ IN ('werft','haendler','marina','yachtclub',
                                                         'charterbetrieb','sachverstaendiger','vermittler',
                                                         'makler','verband','sonstige')),
    region          text,
    land            text NOT NULL DEFAULT 'DE',
    website         text,
    kooperationsstatus text NOT NULL DEFAULT 'interessent'
                    CHECK (kooperationsstatus IN ('interessent','aktiv','ruhend','beendet','exklusiv')),
    vertrag_seit    date,
    courtage_prozent numeric(5,2),
    betreuer_id     uuid REFERENCES crm_benutzer_ref(id),

    partner_value_score int NOT NULL DEFAULT 0 CHECK (partner_value_score BETWEEN 0 AND 100),
    zugefuehrte_leads   int NOT NULL DEFAULT 0,
    gewonnene_leads     int NOT NULL DEFAULT 0,
    umsatz_eur          numeric(14,2) NOT NULL DEFAULT 0,
    letzter_kontakt_am  timestamptz,

    portal_zugang   boolean NOT NULL DEFAULT false,
    zusatzfelder    jsonb NOT NULL DEFAULT '{}'::jsonb,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),
    geloescht_am    timestamptz
);

ALTER TABLE crm_lead_quelle
    ADD CONSTRAINT crm_lead_quelle_partner_fk FOREIGN KEY (partner_id) REFERENCES crm_partner(id);
ALTER TABLE crm_aktivitaet
    ADD CONSTRAINT crm_akt_partner_fk FOREIGN KEY (partner_id) REFERENCES crm_partner(id) ON DELETE CASCADE;
ALTER TABLE crm_boot_ref
    ADD CONSTRAINT crm_boot_liegeplatz_partner_fk FOREIGN KEY (liegeplatz_partner_id) REFERENCES crm_partner(id);

CREATE TABLE crm_partner_beziehung (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    partner_id      uuid NOT NULL REFERENCES crm_partner(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    beziehungsart   text NOT NULL CHECK (beziehungsart IN ('liegeplatz','kauf','betreuung','mitgliedschaft',
                                                          'zufuehrung','wartung','gutachten','charter')),
    seit            date,
    bis             date,
    bemerkung       text,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    CHECK (kunde_id IS NOT NULL OR kontakt_id IS NOT NULL)
);

CREATE TABLE crm_empfehlung (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),

    empfehlungsgeber_kontakt_id uuid REFERENCES crm_kontakt(id),
    empfehlungsgeber_kunde_id   uuid REFERENCES crm_kunde(id),
    empfehlungsgeber_partner_id uuid REFERENCES crm_partner(id),

    empfohlener_name    text NOT NULL,
    empfohlener_email   text,
    empfohlener_telefon text,
    empfohlener_notiz   text,

    erzeugter_lead_id   uuid REFERENCES crm_lead(id),
    erzeugter_kontakt_id uuid REFERENCES crm_kontakt(id),
    opportunity_id      uuid REFERENCES crm_opportunity(id),

    beziehung       text CHECK (beziehung IN ('familie','freund','crew','stegnachbar','geschaeftlich','verein','sonstige')),
    anlass          text CHECK (anlass IN ('gespraech','event','kampagne','schaden_positiv','abschluss','partnerportal','sonstiges')),

    status          text NOT NULL DEFAULT 'eingegangen'
                    CHECK (status IN ('eingegangen','kontaktiert','qualifiziert','angebot',
                                      'gewonnen','verloren','kein_interesse','ungueltig')),
    wert_eur        numeric(14,2),
    praemie_geber   text,
    praemie_ausgezahlt_am date,

    rueckmeldung_am timestamptz,
    dsgvo_hinweis_erfolgt boolean NOT NULL DEFAULT false,

    eingegangen_am  timestamptz NOT NULL DEFAULT now(),
    abgeschlossen_am timestamptz,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    erstellt_von    uuid REFERENCES crm_benutzer_ref(id),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    geaendert_von   uuid REFERENCES crm_benutzer_ref(id),

    CONSTRAINT crm_empf_geber CHECK (
        num_nonnulls(empfehlungsgeber_kontakt_id, empfehlungsgeber_kunde_id, empfehlungsgeber_partner_id) >= 1
    ),
    CONSTRAINT crm_empf_lead CHECK (
        status IN ('eingegangen','ungueltig') OR erzeugter_lead_id IS NOT NULL
    )
);

ALTER TABLE crm_lead
    ADD CONSTRAINT crm_lead_empfehlung_fk FOREIGN KEY (empfehlung_id) REFERENCES crm_empfehlung(id);
ALTER TABLE crm_aktivitaet
    ADD CONSTRAINT crm_akt_empfehlung_fk FOREIGN KEY (empfehlung_id) REFERENCES crm_empfehlung(id) ON DELETE SET NULL;


-- =============================================================================
-- 8. SIGNALE UND SCORING
-- =============================================================================

CREATE TABLE crm_signal_typ (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,                  -- S-WEB-01, S-NL-02, ...
    bezeichnung     text NOT NULL,
    kategorie       text NOT NULL CHECK (kategorie IN ('website','newsletter','event','academy','marketplace',
                                                       'email','partner','objekt','vertrag','schaden','negativ')),
    basisgewicht    numeric(6,2) NOT NULL,
    halbwertszeit_tage int NOT NULL DEFAULT 30,
    consent_pflicht boolean NOT NULL DEFAULT true,
    aktiv           boolean NOT NULL DEFAULT true,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, code)
);

CREATE TABLE crm_signal (
    id              uuid NOT NULL DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    signal_typ_id   uuid NOT NULL REFERENCES crm_signal_typ(id),
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    lead_id         uuid REFERENCES crm_lead(id) ON DELETE CASCADE,
    tracking_id     text,                            -- noch nicht aufgelöst
    zeitstempel     timestamptz NOT NULL DEFAULT now(),
    kanal           text,
    url             text,
    kampagne_id     uuid REFERENCES crm_kampagne(id),
    wert            numeric(12,2),
    nutzdaten       jsonb NOT NULL DEFAULT '{}'::jsonb,
    verarbeitet     boolean NOT NULL DEFAULT false,
    verarbeitet_am  timestamptz,
    loeschen_am     date,                            -- DSGVO-Aufbewahrung (24 Monate)
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    -- PK muss bei partitionierten Tabellen den Partitionsschlüssel enthalten
    PRIMARY KEY (id, zeitstempel),
    CHECK (kontakt_id IS NOT NULL OR tracking_id IS NOT NULL)
) PARTITION BY RANGE (zeitstempel);

-- Beispielpartitionen (Anlage automatisiert je Quartal)
CREATE TABLE crm_signal_2026q1 PARTITION OF crm_signal
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE crm_signal_2026q2 PARTITION OF crm_signal
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE crm_signal_2026q3 PARTITION OF crm_signal
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE crm_signal_2026q4 PARTITION OF crm_signal
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Erkannte Signalmuster (M1..M8)
CREATE TABLE crm_signal_muster (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,                  -- M1..M8
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    erkannt_am      timestamptz NOT NULL DEFAULT now(),
    intent_score    numeric(8,2),
    ausloesende_signale uuid[],
    aktion          text,                            -- opportunity_erzeugt, aufgabe_erzeugt, nurturing
    aktion_referenz_id uuid,
    erstellt_am     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_score_lead_historie (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    lead_id         uuid NOT NULL REFERENCES crm_lead(id) ON DELETE CASCADE,
    score           int NOT NULL,
    kategorie       text NOT NULL,
    score_regel     int,
    score_ki        int,
    modell_version  text,
    erklaerung      jsonb NOT NULL DEFAULT '[]'::jsonb,
    berechnet_am    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_kunde_score (
    kunde_id        uuid PRIMARY KEY REFERENCES crm_kunde(id) ON DELETE CASCADE,
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    customer_value_score int NOT NULL DEFAULT 0 CHECK (customer_value_score BETWEEN 0 AND 100),
    block_wirtschaft int NOT NULL DEFAULT 0,
    block_vertrieb   int NOT NULL DEFAULT 0,
    block_netzwerk   int NOT NULL DEFAULT 0,
    block_community  int NOT NULL DEFAULT 0,
    block_partner    int NOT NULL DEFAULT 0,
    modifikatoren    int NOT NULL DEFAULT 0,
    kategorie        text NOT NULL DEFAULT 'basis',
    erklaerung       jsonb NOT NULL DEFAULT '[]'::jsonb,
    berechnet_am     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_kunde_score_historie (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kunde_id        uuid NOT NULL REFERENCES crm_kunde(id) ON DELETE CASCADE,
    stichtag        date NOT NULL,
    customer_value_score int NOT NULL,
    risk_score      int NOT NULL,
    jahrespraemie_eur numeric(14,2),
    anzahl_vertraege int,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (kunde_id, stichtag)
);

CREATE TABLE crm_churn_bewertung (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid NOT NULL REFERENCES crm_kunde(id) ON DELETE CASCADE,
    risk_score      int NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risiko_stufe    text NOT NULL CHECK (risiko_stufe IN ('hoch','mittel','niedrig')),
    p_kuendigung    numeric(5,4),                   -- KI-Wahrscheinlichkeit zur nächsten Hauptfälligkeit
    erwartete_bindung_monate numeric(6,2),
    merkmale        jsonb NOT NULL DEFAULT '{}'::jsonb,   -- R-01..R-13 mit Erfüllungsgrad
    top_treiber     jsonb NOT NULL DEFAULT '[]'::jsonb,
    modell_version  text,
    erzeugte_aufgabe_id uuid REFERENCES crm_aufgabe(id),
    berechnet_am    timestamptz NOT NULL DEFAULT now()
);

-- Next Best Offer Vorschläge (NBO-01..NBO-10)
CREATE TABLE crm_nbo_vorschlag (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    kunde_id        uuid REFERENCES crm_kunde(id) ON DELETE CASCADE,
    kontakt_id      uuid REFERENCES crm_kontakt(id) ON DELETE CASCADE,
    regel_code      text NOT NULL,                  -- NBO-01 ...
    produkt_id      uuid REFERENCES crm_produkt(id),
    boot_ref_id     uuid REFERENCES crm_boot_ref(id),
    erwarteter_wert_eur numeric(14,2),
    trefferwahrscheinlichkeit numeric(5,4),
    begruendung     text,
    status          text NOT NULL DEFAULT 'offen'
                    CHECK (status IN ('offen','opportunity_erzeugt','angenommen','abgelehnt','verworfen','abgelaufen')),
    opportunity_id  uuid REFERENCES crm_opportunity(id),
    gueltig_bis     date,
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 9. AUTOMATISIERUNG UND AUDIT
-- =============================================================================

CREATE TABLE crm_automation_regel (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    code            text NOT NULL,                  -- A-01 ... A-42
    bezeichnung     text NOT NULL,
    beschreibung    text,
    ausloeser_typ   text NOT NULL CHECK (ausloeser_typ IN ('event','zeitplan','schwellwert','manuell')),
    ausloeser       text NOT NULL,                  -- Event-Topic oder Cron
    bedingung       text,
    aktionen        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{typ:'aufgabe'|'email'|'opportunity'|'push'|'kampagne', ...}]
    prioritaet      int NOT NULL DEFAULT 100,
    aktiv           boolean NOT NULL DEFAULT true,
    max_pro_tag_je_benutzer int,
    ruhezeiten_beachten boolean NOT NULL DEFAULT true,
    verworfen_quote numeric(5,4),                   -- Qualitätsrückkopplung
    erstellt_am     timestamptz NOT NULL DEFAULT now(),
    geaendert_am    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mandant_id, code)
);

CREATE TABLE crm_automation_lauf (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id      uuid NOT NULL REFERENCES crm_mandant_ref(id),
    regel_id        uuid NOT NULL REFERENCES crm_automation_regel(id),
    regel_code      text NOT NULL,
    bezug_typ       text,
    bezug_id        uuid,
    status          text NOT NULL CHECK (status IN ('erfolg','uebersprungen','fehler','unterdrueckt_limit','unterdrueckt_ruhezeit')),
    ergebnis        jsonb NOT NULL DEFAULT '{}'::jsonb,
    fehlermeldung   text,
    dauer_ms        int,
    gestartet_am    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_audit_log (
    id              bigserial PRIMARY KEY,
    mandant_id      uuid NOT NULL,
    tabelle         text NOT NULL,
    datensatz_id    uuid NOT NULL,
    aktion          text NOT NULL CHECK (aktion IN ('insert','update','delete','lesen_sensibel','export')),
    benutzer_id     uuid,
    aenderungen     jsonb,
    ip_adresse      inet,
    zeitstempel     timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 10. INDIZES
-- =============================================================================

-- Kontakt
CREATE INDEX idx_kontakt_mandant_stufe     ON crm_kontakt (mandant_id, lifecycle_stufe) WHERE geloescht_am IS NULL;
CREATE INDEX idx_kontakt_verantwortlicher  ON crm_kontakt (verantwortlicher_id) WHERE geloescht_am IS NULL;
CREATE UNIQUE INDEX idx_kontakt_email_uniq ON crm_kontakt (mandant_id, lower(email)) WHERE email IS NOT NULL AND geloescht_am IS NULL;
CREATE INDEX idx_kontakt_telefon           ON crm_kontakt (mandant_id, telefon) WHERE telefon IS NOT NULL;
CREATE INDEX idx_kontakt_name_trgm         ON crm_kontakt USING gin ((coalesce(vorname,'') || ' ' || nachname) gin_trgm_ops);
CREATE INDEX idx_kontakt_tracking          ON crm_kontakt USING gin (tracking_ids);
CREATE INDEX idx_kontakt_rollen            ON crm_kontakt USING gin (rollen);
CREATE INDEX idx_kontakt_geburtstag        ON crm_kontakt (mandant_id, (extract(month from geburtsdatum)), (extract(day from geburtsdatum))) WHERE geburtsdatum IS NOT NULL;

-- Kunde
CREATE INDEX idx_kunde_betreuer            ON crm_kunde (betreuer_id, status) WHERE geloescht_am IS NULL;
CREATE INDEX idx_kunde_cvs                 ON crm_kunde (mandant_id, customer_value_score DESC) WHERE status = 'aktiv';
CREATE INDEX idx_kunde_risiko              ON crm_kunde (mandant_id, risiko_stufe, risk_score DESC) WHERE status = 'aktiv';
CREATE INDEX idx_kunde_jahresgespraech     ON crm_kunde (naechstes_jahresgespraech_am) WHERE status = 'aktiv';
CREATE INDEX idx_kunde_name_trgm           ON crm_kunde USING gin (bezeichnung gin_trgm_ops);

-- Lead
CREATE INDEX idx_lead_offen                ON crm_lead (mandant_id, status, lead_kategorie, lead_score DESC)
                                              WHERE status NOT IN ('konvertiert','disqualifiziert','dublette') AND geloescht_am IS NULL;
CREATE INDEX idx_lead_verantwortlicher     ON crm_lead (verantwortlicher_id, status) WHERE geloescht_am IS NULL;
CREATE INDEX idx_lead_quelle               ON crm_lead (quelle_id, eingegangen_am);
CREATE INDEX idx_lead_sla                  ON crm_lead (erstkontakt_faellig_am) WHERE erstkontakt_am IS NULL;
CREATE INDEX idx_lead_kontakt              ON crm_lead (kontakt_id);
CREATE INDEX idx_lead_hauptfaelligkeit     ON crm_lead (mandant_id, hauptfaelligkeit_bestand) WHERE hauptfaelligkeit_bestand IS NOT NULL;
CREATE INDEX idx_lead_eingang              ON crm_lead (mandant_id, eingegangen_am DESC);

-- Opportunity
CREATE INDEX idx_opp_offen                 ON crm_opportunity (mandant_id, pipeline_stufe, erwartetes_abschlussdatum)
                                              WHERE pipeline_stufe NOT IN ('gewonnen','verloren') AND geloescht_am IS NULL;
CREATE INDEX idx_opp_verantwortlicher      ON crm_opportunity (verantwortlicher_id, pipeline_stufe);
CREATE INDEX idx_opp_forecast              ON crm_opportunity (mandant_id, erwartetes_abschlussdatum, wahrscheinlichkeit)
                                              WHERE pipeline_stufe NOT IN ('gewonnen','verloren');
CREATE INDEX idx_opp_stillstand            ON crm_opportunity (stufe_seit) WHERE pipeline_stufe NOT IN ('gewonnen','verloren','pausiert');
CREATE INDEX idx_opp_kunde                 ON crm_opportunity (kunde_id);
CREATE INDEX idx_opp_kontakt               ON crm_opportunity (kontakt_id);
CREATE INDEX idx_opp_quelle                ON crm_opportunity (quelle_id, abgeschlossen_am);

-- Angebot
CREATE INDEX idx_angebot_opp               ON crm_angebot (opportunity_id);
CREATE INDEX idx_angebot_ablauf            ON crm_angebot (gueltig_bis) WHERE status IN ('versendet','geoeffnet','in_verhandlung');
CREATE INDEX idx_angebot_status            ON crm_angebot (mandant_id, status, versendet_am);

-- Aktivität
CREATE INDEX idx_akt_kontakt_zeit          ON crm_aktivitaet (kontakt_id, zeitstempel DESC);
CREATE INDEX idx_akt_kunde_zeit            ON crm_aktivitaet (kunde_id, zeitstempel DESC);
CREATE INDEX idx_akt_opp_zeit              ON crm_aktivitaet (opportunity_id, zeitstempel DESC);
CREATE INDEX idx_akt_benutzer_zeit         ON crm_aktivitaet (benutzer_id, zeitstempel DESC);
CREATE INDEX idx_akt_typ_zeit              ON crm_aktivitaet (mandant_id, typ, zeitstempel DESC);
CREATE INDEX idx_akt_volltext              ON crm_aktivitaet USING gin (to_tsvector('german', coalesce(betreff,'') || ' ' || coalesce(inhalt,'')));

-- Aufgabe
CREATE INDEX idx_aufgabe_tagesliste        ON crm_aufgabe (zugewiesen_an, status, prioritaets_score DESC, faellig_am)
                                              WHERE status IN ('offen','in_arbeit') AND geloescht_am IS NULL;
CREATE INDEX idx_aufgabe_faellig           ON crm_aufgabe (mandant_id, faellig_am) WHERE status IN ('offen','in_arbeit');
CREATE INDEX idx_aufgabe_sla               ON crm_aufgabe (sla_frist) WHERE status IN ('offen','in_arbeit') AND sla_frist IS NOT NULL;
CREATE INDEX idx_aufgabe_bezug             ON crm_aufgabe (bezug_typ, bezug_id);
CREATE UNIQUE INDEX idx_aufgabe_dedup      ON crm_aufgabe (bezug_typ, bezug_id, typ, regel_code)
                                              WHERE status IN ('offen','in_arbeit') AND quelle = 'automatisch';
CREATE INDEX idx_aufgabe_gruppierung       ON crm_aufgabe (zugewiesen_an, gruppierungs_schluessel) WHERE status = 'offen';

-- Signale
CREATE INDEX idx_signal_kontakt_zeit       ON crm_signal (kontakt_id, zeitstempel DESC);
CREATE INDEX idx_signal_tracking           ON crm_signal (tracking_id) WHERE kontakt_id IS NULL;
CREATE INDEX idx_signal_unverarbeitet      ON crm_signal (verarbeitet, zeitstempel) WHERE verarbeitet = false;
CREATE INDEX idx_signal_typ_zeit           ON crm_signal (signal_typ_id, zeitstempel DESC);

-- Empfehlung / Partner
CREATE INDEX idx_empf_geber_kontakt        ON crm_empfehlung (empfehlungsgeber_kontakt_id, status);
CREATE INDEX idx_empf_geber_partner        ON crm_empfehlung (empfehlungsgeber_partner_id, status);
CREATE INDEX idx_empf_status               ON crm_empfehlung (mandant_id, status, eingegangen_am DESC);
CREATE INDEX idx_partner_typ               ON crm_partner (mandant_id, partner_typ, kooperationsstatus) WHERE geloescht_am IS NULL;
CREATE INDEX idx_partner_value             ON crm_partner (mandant_id, partner_value_score DESC);
CREATE INDEX idx_partner_bez_kunde         ON crm_partner_beziehung (kunde_id);

-- Read-Models
CREATE INDEX idx_boot_kunde                ON crm_boot_ref (kunde_id) WHERE status = 'aktiv';
CREATE INDEX idx_vertrag_kunde             ON crm_vertrag_ref (kunde_id, status);
CREATE INDEX idx_vertrag_hauptfaelligkeit  ON crm_vertrag_ref (mandant_id, hauptfaelligkeit) WHERE status = 'aktiv';
CREATE INDEX idx_schaden_kunde             ON crm_schaden_ref (kunde_id, schadendatum DESC);

-- Audit
CREATE INDEX idx_audit_datensatz           ON crm_audit_log (tabelle, datensatz_id, zeitstempel DESC);
CREATE INDEX idx_audit_benutzer            ON crm_audit_log (benutzer_id, zeitstempel DESC);
CREATE INDEX idx_automation_lauf_regel     ON crm_automation_lauf (regel_code, gestartet_am DESC);


-- =============================================================================
-- 11. TRIGGER
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'crm_team','crm_gebiet','crm_status_definition','crm_produkt','crm_lead_quelle',
        'crm_lead_quelle_kosten','crm_kampagne','crm_organisation','crm_kontakt','crm_kunde',
        'crm_lead','crm_opportunity','crm_angebot','crm_aktivitaet','crm_aufgabe',
        'crm_wiedervorlage_regel','crm_partner','crm_empfehlung','crm_signal_typ',
        'crm_nbo_vorschlag','crm_automation_regel'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_geaendert BEFORE UPDATE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION crm_fn_set_geaendert_am()', t);
    END LOOP;
END;
$$;


-- =============================================================================
-- 12. SICHTEN
-- =============================================================================

-- Priorisierte Tagesliste (Next Best Action) je Benutzer
CREATE OR REPLACE VIEW vw_crm_next_best_action AS
SELECT
    a.id                AS aufgabe_id,
    a.mandant_id,
    a.zugewiesen_an     AS benutzer_id,
    a.titel,
    a.typ,
    a.prioritaet,
    a.prioritaets_score,
    a.faellig_am,
    a.sla_frist,
    a.bezug_typ,
    a.bezug_id,
    a.erwarteter_wert_eur,
    a.regel_code,
    a.kontext,
    (a.faellig_am < now())                          AS ist_ueberfaellig,
    (a.sla_frist IS NOT NULL AND a.sla_frist < now()) AS sla_verletzt,
    k.customer_value_score,
    k.risk_score,
    k.bezeichnung                                   AS kunde_bezeichnung
FROM crm_aufgabe a
LEFT JOIN crm_kunde k ON k.id = a.bezug_id AND a.bezug_typ = 'kunde'
WHERE a.status IN ('offen','in_arbeit')
  AND a.geloescht_am IS NULL
ORDER BY
    (a.sla_frist IS NOT NULL AND a.sla_frist < now()) DESC,
    a.prioritaets_score DESC,
    a.faellig_am ASC;

-- Pipeline / Forecast
CREATE OR REPLACE VIEW vw_crm_pipeline AS
SELECT
    o.mandant_id,
    o.verantwortlicher_id,
    o.team_id,
    o.pipeline_stufe,
    date_trunc('month', o.erwartetes_abschlussdatum)::date AS forecast_monat,
    count(*)                                        AS anzahl,
    sum(o.wert_eur)                                 AS pipeline_brutto_eur,
    sum(o.wert_eur * o.wahrscheinlichkeit / 100.0)  AS forecast_gewichtet_eur,
    sum(o.wert_eur) FILTER (WHERE o.wahrscheinlichkeit >= 75 AND o.pipeline_stufe = 'verhandlung') AS commit_eur,
    avg(o.wahrscheinlichkeit)                       AS durchschnitt_wahrscheinlichkeit,
    avg(EXTRACT(epoch FROM (now() - o.stufe_seit))/86400.0) AS durchschnitt_tage_in_stufe
FROM crm_opportunity o
WHERE o.pipeline_stufe NOT IN ('gewonnen','verloren')
  AND o.geloescht_am IS NULL
GROUP BY 1,2,3,4,5;

-- Leadtrichter je Quelle und Monat
CREATE OR REPLACE VIEW vw_crm_lead_trichter AS
SELECT
    l.mandant_id,
    l.quelle_id,
    q.code                                          AS quelle_code,
    q.bezeichnung                                   AS quelle_bezeichnung,
    date_trunc('month', l.eingegangen_am)::date     AS monat,
    count(*)                                        AS leads,
    count(*) FILTER (WHERE l.status = 'qualifiziert')  AS qualifiziert,
    count(*) FILTER (WHERE l.status = 'konvertiert')   AS konvertiert,
    count(*) FILTER (WHERE l.status = 'disqualifiziert') AS disqualifiziert,
    avg(l.lead_score)                               AS durchschnitt_score,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY l.reaktionszeit_minuten) AS median_reaktionszeit_min,
    count(*) FILTER (WHERE l.lead_kategorie = 'A')  AS a_leads
FROM crm_lead l
JOIN crm_lead_quelle q ON q.id = l.quelle_id
WHERE l.geloescht_am IS NULL
GROUP BY 1,2,3,4,5;

-- Quellenperformance inkl. Kosten und ROI
CREATE OR REPLACE VIEW vw_crm_quellen_performance AS
WITH gewonnen AS (
    SELECT o.quelle_id,
           date_trunc('month', o.abgeschlossen_am)::date AS monat,
           count(*) AS abschluesse,
           sum(o.wert_eur) AS umsatz_eur,
           sum(coalesce(o.deckungsbeitrag_eur,0)) AS deckungsbeitrag_eur
    FROM crm_opportunity o
    WHERE o.pipeline_stufe = 'gewonnen' AND o.abgeschlossen_am IS NOT NULL
    GROUP BY 1,2
)
SELECT
    t.mandant_id,
    t.quelle_code,
    t.monat,
    t.leads,
    t.qualifiziert,
    t.durchschnitt_score,
    coalesce(g.abschluesse,0)                       AS abschluesse,
    coalesce(g.umsatz_eur,0)                        AS umsatz_eur,
    coalesce(kk.kosten_eur,0)                       AS kosten_eur,
    CASE WHEN t.leads > 0 THEN coalesce(kk.kosten_eur,0)/t.leads END        AS cpl_eur,
    CASE WHEN coalesce(g.abschluesse,0) > 0 THEN coalesce(kk.kosten_eur,0)/g.abschluesse END AS cac_eur,
    CASE WHEN t.leads > 0 THEN coalesce(g.abschluesse,0)::numeric/t.leads END AS conversion,
    CASE WHEN coalesce(kk.kosten_eur,0) > 0
         THEN (coalesce(g.deckungsbeitrag_eur,0) - kk.kosten_eur)/kk.kosten_eur END AS roi
FROM vw_crm_lead_trichter t
LEFT JOIN gewonnen g ON g.quelle_id = t.quelle_id AND g.monat = t.monat
LEFT JOIN crm_lead_quelle_kosten kk
       ON kk.quelle_id = t.quelle_id
      AND make_date(kk.jahr, kk.monat, 1) = t.monat;

-- Kundenakte 360 (Kopfdaten mit Aggregaten)
CREATE OR REPLACE VIEW vw_crm_kunde_360 AS
SELECT
    k.id                AS kunde_id,
    k.mandant_id,
    k.kundennummer,
    k.bezeichnung,
    k.kundentyp,
    k.status,
    k.betreuungsstufe,
    k.betreuer_id,
    k.customer_value_score,
    k.risk_score,
    k.risiko_stufe,
    k.jahrespraemie_eur,
    k.lifetime_value_eur,
    k.kunde_seit,
    k.letzter_kontakt_am,
    (SELECT count(*) FROM crm_boot_ref b     WHERE b.kunde_id = k.id AND b.status = 'aktiv')        AS anzahl_boote_aktiv,
    (SELECT count(*) FROM crm_vertrag_ref v  WHERE v.kunde_id = k.id AND v.status = 'aktiv')        AS anzahl_vertraege_aktiv,
    (SELECT min(v.hauptfaelligkeit) FROM crm_vertrag_ref v WHERE v.kunde_id = k.id AND v.status='aktiv' AND v.hauptfaelligkeit >= current_date) AS naechste_hauptfaelligkeit,
    (SELECT count(*) FROM crm_schaden_ref s  WHERE s.kunde_id = k.id AND s.status <> 'geschlossen') AS offene_schaeden,
    (SELECT count(*) FROM crm_opportunity o  WHERE o.kunde_id = k.id AND o.pipeline_stufe NOT IN ('gewonnen','verloren')) AS offene_opportunities,
    (SELECT coalesce(sum(o.wert_eur),0) FROM crm_opportunity o WHERE o.kunde_id = k.id AND o.pipeline_stufe NOT IN ('gewonnen','verloren')) AS offenes_potenzial_eur,
    (SELECT count(*) FROM crm_aufgabe a      WHERE a.bezug_typ = 'kunde' AND a.bezug_id = k.id AND a.status IN ('offen','in_arbeit')) AS offene_aufgaben,
    (SELECT count(*) FROM crm_empfehlung e   WHERE e.empfehlungsgeber_kunde_id = k.id AND e.status = 'gewonnen') AS erfolgreiche_empfehlungen
FROM crm_kunde k
WHERE k.geloescht_am IS NULL;

-- Datenqualitäts-/Vergessenswächter: aktive Vorgänge ohne offene Aufgabe
CREATE OR REPLACE VIEW vw_crm_vergessene_vorgaenge AS
SELECT 'lead'::text AS vorgang_typ, l.id AS vorgang_id, l.mandant_id,
       l.verantwortlicher_id AS benutzer_id, l.lead_score AS relevanz,
       greatest(l.eingegangen_am, coalesce(l.erstkontakt_am, l.eingegangen_am)) AS letzte_bewegung
FROM crm_lead l
WHERE l.status IN ('neu','in_bearbeitung','kontaktiert','qualifiziert')
  AND l.geloescht_am IS NULL
  AND NOT EXISTS (SELECT 1 FROM crm_aufgabe a
                  WHERE a.bezug_typ='lead' AND a.bezug_id=l.id AND a.status IN ('offen','in_arbeit'))
UNION ALL
SELECT 'opportunity', o.id, o.mandant_id, o.verantwortlicher_id,
       least(100, (o.wert_eur/100)::int), o.stufe_seit
FROM crm_opportunity o
WHERE o.pipeline_stufe NOT IN ('gewonnen','verloren')
  AND o.geloescht_am IS NULL
  AND NOT EXISTS (SELECT 1 FROM crm_aufgabe a
                  WHERE a.bezug_typ='opportunity' AND a.bezug_id=o.id AND a.status IN ('offen','in_arbeit'));


-- =============================================================================
-- 13. ROW LEVEL SECURITY (Mandantentrennung)
-- =============================================================================
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'crm_organisation','crm_kontakt','crm_kunde','crm_lead','crm_opportunity','crm_angebot',
        'crm_aktivitaet','crm_aufgabe','crm_empfehlung','crm_partner','crm_signal','crm_consent',
        'crm_nbo_vorschlag','crm_churn_bewertung','crm_lifecycle_historie','crm_partner_beziehung'
    ] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format(
            'CREATE POLICY pol_%1$s_mandant ON %1$s
             USING (mandant_id = crm_fn_aktueller_mandant())
             WITH CHECK (mandant_id = crm_fn_aktueller_mandant())', t);
    END LOOP;
END;
$$;

-- =============================================================================
-- ENDE
-- =============================================================================
