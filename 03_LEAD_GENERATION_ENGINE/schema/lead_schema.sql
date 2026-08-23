-- =============================================================================
--  03_LEAD_GENERATION_ENGINE — Schema des Rechercheraums
--  PostgreSQL 14+   ·   Fassung 1.0
--
--  Der Rechercheraum liegt bewusst getrennt vom CRM (ADR-0001). Alle Tabellen
--  tragen das Praefix lg_ und koennen vollstaendig geloescht werden, ohne dass
--  ein CRM-Datensatz beschaedigt wird: es gibt keinen Fremdschluessel aus dem
--  CRM hierher, nur umgekehrt.
--
--  Alle Demodaten sind synthetisch. Keine realen Organisationen, keine realen
--  Personen, keine realen Kontaktdaten.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  Aufzaehlungen
-- -----------------------------------------------------------------------------
CREATE TYPE lg_zielgruppe AS ENUM
  ('Z1_HANDEL','Z2_INFRASTRUKTUR','Z3_GEMEINSCHAFT','Z4_BETRIEB','Z5_INDUSTRIE');

CREATE TYPE lg_untergruppe AS ENUM
  ('BOOTSHAENDLER','YACHTMAKLER','MARINA','HAFENBETREIBER',
   'SEGELCLUB','MOTORBOOTCLUB','YACHTCLUB','WASSERSPORTVEREIN',
   'CHARTER','WERFT','SERVICEBETRIEB','WASSERSPORTSCHULE',
   'BOOTSHERSTELLER','MOTORENHERSTELLER');

CREATE TYPE lg_quellenart AS ENUM
  ('VERBAND','VERZEICHNIS','HERSTELLERLISTE','KARTENDIENST','MESSE',
   'WEBSITE','MANUELL','EMPFEHLUNG');

CREATE TYPE lg_erlaubnis AS ENUM
  ('OEFFENTLICH','LIZENZ','SCHRIFTLICHE_ZUSAGE','UNGEKLAERT');

CREATE TYPE lg_bearbeitungsstatus AS ENUM
  ('ROH','NORMALISIERT','BEWERTET','ZUR_PRUEFUNG','FREIGEGEBEN',
   'VERWORFEN','ZURUECKGESTELLT','GESPERRT');

CREATE TYPE lg_verwerfungsgrund AS ENUM
  ('KEINE_ZIELGRUPPE','AUFGELOEST','DUBLETTE','AUSSERHALB_MARKT','SPERRE','SONSTIGES');

CREATE TYPE lg_groessenart AS ENUM
  ('LIEGEPLAETZE','MITGLIEDER','FLOTTE','MITARBEITER','UNBEKANNT');

CREATE TYPE lg_abgleich_entscheidung AS ENUM ('OFFEN','IST_DIESELBE','IST_ANDERE','UNKLAR');

CREATE TYPE lg_sperrart AS ENUM ('WIDERSPRUCH','KEIN_INTERESSE','AUFGELOEST','WETTBEWERB','INTERN');

CREATE TYPE lg_schluesselart AS ENUM ('DOMAIN','EMAIL','TELEFON','ORGANISATION','KONTAKT');

CREATE TYPE lg_kanal AS ENUM ('POST','TELEFON','EMAIL','PERSOENLICH','EINGEHEND');

CREATE TYPE lg_laufstatus AS ENUM ('LAEUFT','ABGESCHLOSSEN','FEHLER','ABGEBROCHEN');

-- -----------------------------------------------------------------------------
--  Mandant  (AT / DE — wie im Kern-CRM)
-- -----------------------------------------------------------------------------
CREATE TABLE lg_mandant (
  id          uuid PRIMARY KEY,
  land        char(2) NOT NULL UNIQUE,
  bezeichnung text    NOT NULL,
  zulassung   boolean NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
--  Kanalmatrix  —  als Daten, nicht als Programmlogik (ADR-0004)
-- -----------------------------------------------------------------------------
CREATE TABLE lg_kanalmatrix (
  land        char(2)  NOT NULL,
  kanal       lg_kanal NOT NULL,
  erlaubt     boolean  NOT NULL,
  bedingung   text,
  geprueft_am date,
  PRIMARY KEY (land, kanal)
);

-- -----------------------------------------------------------------------------
--  Reviergewichtung  —  ebenfalls Daten (Kapitel 5, B3)
-- -----------------------------------------------------------------------------
CREATE TABLE lg_revier (
  id       uuid PRIMARY KEY,
  land     char(2)     NOT NULL,
  name     text        NOT NULL,
  gewicht  smallint    NOT NULL CHECK (gewicht BETWEEN 0 AND 20),
  UNIQUE (land, name)
);

-- -----------------------------------------------------------------------------
--  Grundgesamtheit  —  der Nenner des Abdeckungsgrads, mit Datum und Quelle
-- -----------------------------------------------------------------------------
CREATE TABLE lg_grundgesamtheit (
  land        char(2)       NOT NULL,
  zielgruppe  lg_zielgruppe NOT NULL,
  anzahl      integer       NOT NULL CHECK (anzahl > 0),
  erhoben_am  date          NOT NULL,
  quelle      text          NOT NULL,
  PRIMARY KEY (land, zielgruppe)
);

COMMENT ON TABLE lg_grundgesamtheit IS
  'Der Nenner ist eine Schaetzung mit Datum und Quelle, keine Konstante. '
  'Ohne quelle und erhoben_am wird der Abdeckungsgrad zur Wohlfuehlzahl.';

-- -----------------------------------------------------------------------------
--  QUELLE
-- -----------------------------------------------------------------------------
CREATE TABLE lg_quelle (
  id                   uuid PRIMARY KEY,
  bezeichnung          text          NOT NULL,
  art                  lg_quellenart NOT NULL,
  betreiber            text,
  url                  text,
  erlaubnis            lg_erlaubnis  NOT NULL,
  erlaubnis_beleg      text,
  bedingungen_geprueft date,
  speicherung_erlaubt  boolean       NOT NULL DEFAULT true,
  abdeckung            text,
  guete                text          NOT NULL DEFAULT 'MITTEL'
                       CHECK (guete IN ('HOCH','MITTEL','NIEDRIG')),
  takt                 text          NOT NULL DEFAULT 'QUARTALSWEISE',
  aktiv                boolean       NOT NULL DEFAULT true,
  erstellt_am          timestamptz   NOT NULL DEFAULT now(),

  -- Klasse B/C ohne Beleg der Erlaubnis ist nicht ausfuehrbar
  CONSTRAINT lg_quelle_beleg_bei_lizenz CHECK (
    erlaubnis NOT IN ('LIZENZ','SCHRIFTLICHE_ZUSAGE') OR erlaubnis_beleg IS NOT NULL)
);

-- -----------------------------------------------------------------------------
--  RECHERCHELAUF
-- -----------------------------------------------------------------------------
CREATE TABLE lg_lauf (
  id               uuid PRIMARY KEY,
  quelle_id        uuid          NOT NULL REFERENCES lg_quelle(id),
  gestartet_am     timestamptz   NOT NULL DEFAULT now(),
  beendet_am       timestamptz,
  parameter        jsonb,
  anzahl_gefunden  integer       NOT NULL DEFAULT 0,
  anzahl_neu       integer       NOT NULL DEFAULT 0,
  anzahl_dublette  integer       NOT NULL DEFAULT 0,
  anzahl_gesperrt  integer       NOT NULL DEFAULT 0,
  status           lg_laufstatus NOT NULL DEFAULT 'LAEUFT',
  fehlertext       text,
  CONSTRAINT lg_lauf_fehler_braucht_text CHECK (status <> 'FEHLER' OR fehlertext IS NOT NULL)
);

-- -----------------------------------------------------------------------------
--  SPERRVERMERK  —  wirkt VOR der Anlage, quellenuebergreifend
-- -----------------------------------------------------------------------------
CREATE TABLE lg_sperrvermerk (
  id            uuid PRIMARY KEY,
  art           lg_sperrart       NOT NULL,
  schluesselart lg_schluesselart  NOT NULL,
  schluessel    text              NOT NULL,
  gueltig_bis   date,
  grund         text,
  erfasst_von   text              NOT NULL,
  erfasst_am    date              NOT NULL DEFAULT current_date,

  -- Ein Widerspruch nach Art. 21 DSGVO kennt keine Frist
  CONSTRAINT lg_sperre_widerspruch_ohne_frist CHECK (art <> 'WIDERSPRUCH' OR gueltig_bis IS NULL)
);
CREATE INDEX lg_sperrvermerk_schluessel ON lg_sperrvermerk (schluesselart, schluessel);

-- -----------------------------------------------------------------------------
--  RECHERCHEOBJEKT
-- -----------------------------------------------------------------------------
CREATE SEQUENCE lg_objektnummer_seq START 1;

CREATE TABLE lg_objekt (
  id                   uuid PRIMARY KEY,
  objektnummer         text          NOT NULL UNIQUE,
  mandant_id           uuid          NOT NULL REFERENCES lg_mandant(id),
  zielgruppe           lg_zielgruppe NOT NULL,
  untergruppe          lg_untergruppe NOT NULL,

  name_roh             text          NOT NULL,
  name_norm            text          NOT NULL,
  rechtsform           text,
  website              text,
  domain_norm          text,
  email                text,
  telefon_roh          text,
  telefon_e164         text,
  adresse_strasse      text,
  adresse_plz          text,
  adresse_ort          text,
  land                 char(2)       NOT NULL,
  region               text,
  revier               text,
  profile              jsonb,

  groesse_indikator      integer,
  groesse_indikator_art  lg_groessenart NOT NULL DEFAULT 'UNBEKANNT',

  basiswert            smallint CHECK (basiswert BETWEEN 0 AND 100),
  potenzialwert        smallint CHECK (potenzialwert BETWEEN 0 AND 100),
  score_herleitung     jsonb,

  bearbeitungsstatus   lg_bearbeitungsstatus NOT NULL DEFAULT 'ROH',
  verwerfungsgrund     lg_verwerfungsgrund,
  organisation_id      uuid,
  aufgabe_id           uuid,

  erstmals_gesehen_am  date NOT NULL DEFAULT current_date,
  zuletzt_gesehen_am   date NOT NULL DEFAULT current_date,
  erstellt_am          timestamptz NOT NULL DEFAULT now(),

  -- --- Zusicherungen des Konzepts, technisch erzwungen -----------------------

  -- ADR-0005: Kein Score ohne Herleitung. Ohne diesen Eintrag ist das Setzen
  -- des Werts technisch nicht moeglich.
  CONSTRAINT lg_objekt_score_braucht_herleitung
    CHECK (basiswert IS NULL OR score_herleitung IS NOT NULL),

  -- Verwerfen ist ein Ergebnis, kein Abbruch: es braucht immer einen Grund.
  CONSTRAINT lg_objekt_verwerfen_braucht_grund
    CHECK (bearbeitungsstatus <> 'VERWORFEN' OR verwerfungsgrund IS NOT NULL),

  -- Freigegeben heisst: im CRM angekommen.
  CONSTRAINT lg_objekt_freigabe_braucht_organisation
    CHECK (bearbeitungsstatus <> 'FREIGEGEBEN' OR organisation_id IS NOT NULL),

  -- Eine Groessenangabe ohne Art ist nicht deutbar (Skala je Zielgruppe).
  CONSTRAINT lg_objekt_groesse_braucht_art
    CHECK (groesse_indikator IS NULL OR groesse_indikator_art <> 'UNBEKANNT')
);

-- Domain ist der staerkste Schluessel — aber NICHT eindeutig: ein Haendler mit
-- drei Filialen fuehrt alle unter derselben Domain (Kapitel 6.5, Fall 1).
-- Eindeutig ist erst die Kombination aus Domain und Anschrift.
CREATE INDEX lg_objekt_domain ON lg_objekt (mandant_id, domain_norm)
  WHERE domain_norm IS NOT NULL;

CREATE INDEX lg_objekt_status     ON lg_objekt (bearbeitungsstatus);
CREATE INDEX lg_objekt_zielgruppe ON lg_objekt (land, zielgruppe);
CREATE INDEX lg_objekt_name_norm  ON lg_objekt (name_norm);
CREATE INDEX lg_objekt_telefon    ON lg_objekt (telefon_e164) WHERE telefon_e164 IS NOT NULL;

-- -----------------------------------------------------------------------------
--  OBJEKTBELEG  —  ein Beleg je Feld, nicht je Objekt
-- -----------------------------------------------------------------------------
CREATE TABLE lg_beleg (
  id          uuid PRIMARY KEY,
  objekt_id   uuid NOT NULL REFERENCES lg_objekt(id) ON DELETE CASCADE,
  feldname    text NOT NULL,
  wert        text NOT NULL,
  quelle_id   uuid NOT NULL REFERENCES lg_quelle(id),
  lauf_id     uuid          REFERENCES lg_lauf(id),
  fundstelle  text,
  gesehen_am  date NOT NULL DEFAULT current_date,
  ist_aktuell boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX lg_beleg_ein_aktueller_je_feld
  ON lg_beleg (objekt_id, feldname) WHERE ist_aktuell;

COMMENT ON TABLE lg_beleg IS
  'Ein Feld ohne Beleg ist Hoerensagen. Beim Widerspruch lautet die erste Frage '
  'nie "welche Daten haben Sie", sondern "woher haben Sie meine Nummer".';

-- -----------------------------------------------------------------------------
--  AKQUISEKONTAKT  —  die Person, sobald es eine gibt
-- -----------------------------------------------------------------------------
CREATE TABLE lg_kontakt (
  id                       uuid PRIMARY KEY,
  objekt_id                uuid NOT NULL REFERENCES lg_objekt(id) ON DELETE CASCADE,
  vorname                  text,
  nachname                 text,
  funktion                 text,
  email                    text,
  telefon_e164             text,
  linkedin_url             text,
  quelle_id                uuid NOT NULL REFERENCES lg_quelle(id),
  belegt_am                date NOT NULL DEFAULT current_date,
  information_versendet_am date,
  kontakt_id_crm           uuid,

  -- Ein Kontakt ohne jede Kennzeichnung waere ein leerer Personendatensatz
  CONSTRAINT lg_kontakt_hat_inhalt CHECK (
    nachname IS NOT NULL OR email IS NOT NULL OR telefon_e164 IS NOT NULL)
);

COMMENT ON COLUMN lg_kontakt.belegt_am IS
  'Startet die Monatsfrist aus Art. 14 DSGVO. Die Aufgabe entsteht nach 21 Tagen.';

-- -----------------------------------------------------------------------------
--  ABGLEICHVORSCHLAG
-- -----------------------------------------------------------------------------
CREATE TABLE lg_abgleich (
  id             uuid PRIMARY KEY,
  objekt_id      uuid NOT NULL REFERENCES lg_objekt(id) ON DELETE CASCADE,
  ziel_typ       text NOT NULL CHECK (ziel_typ IN ('RECHERCHEOBJEKT','ORGANISATION')),
  ziel_id        uuid NOT NULL,
  kennzahl       numeric(4,3) NOT NULL CHECK (kennzahl BETWEEN 0 AND 1),
  treffer        jsonb NOT NULL,
  entscheidung   lg_abgleich_entscheidung NOT NULL DEFAULT 'OFFEN',
  entschieden_von text,
  entschieden_am timestamptz,
  UNIQUE (objekt_id, ziel_typ, ziel_id)
);

-- -----------------------------------------------------------------------------
--  AUFGABE  —  vereinfachtes Abbild der CRM-Aufgabe, fuer den Pruefstand
-- -----------------------------------------------------------------------------
CREATE TABLE lg_aufgabe (
  id                 uuid PRIMARY KEY,
  objekt_id          uuid REFERENCES lg_objekt(id) ON DELETE CASCADE,
  kontakt_id         uuid REFERENCES lg_kontakt(id) ON DELETE CASCADE,
  regel_code         text NOT NULL,
  titel              text NOT NULL,
  prioritaet         text NOT NULL CHECK (prioritaet IN ('NIEDRIG','NORMAL','HOCH','DRINGEND')),
  faellig_am         date NOT NULL,
  benutzer           text NOT NULL,
  dublettenschluessel text NOT NULL UNIQUE,
  erledigt_am        timestamptz,
  erstellt_am        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN lg_aufgabe.dublettenschluessel IS
  'UNIQUE. Ohne diese Bedingung erzeugt ein zweimal laufender Nachtjob '
  'eine zweite Aufgabe zum selben Sachverhalt.';

-- -----------------------------------------------------------------------------
--  CRM-Seite  —  im Pruefstand nur so weit abgebildet, wie die Uebergabe
--  sie beruehrt. Im Echtbetrieb ist das die Datenbank aus 02_CORE_CRM.
-- -----------------------------------------------------------------------------
CREATE TABLE crm_organisation (
  id             uuid PRIMARY KEY,
  mandant_id     uuid NOT NULL REFERENCES lg_mandant(id),
  name           text NOT NULL,
  name_norm      text NOT NULL,
  domain_norm    text,
  telefon_e164   text,
  adresse_plz    text,
  status         text NOT NULL DEFAULT 'INTERESSENT'
                 CHECK (status IN ('INTERESSENT','AKTIV','RUHEND','BEENDET')),
  quelle         text NOT NULL,
  objektnummer   text,
  erstellt_am    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_organisationsrolle (
  id              uuid PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES crm_organisation(id) ON DELETE CASCADE,
  rolle           text NOT NULL CHECK (rolle IN
                    ('HAENDLER','CLUB','PARTNER','MAKLER','LIEFERANT','HERSTELLER','VERSICHERER')),
  gueltig_ab      date NOT NULL DEFAULT current_date,
  portalzugang    boolean NOT NULL DEFAULT false,
  UNIQUE (organisation_id, rolle)
);

CREATE TABLE crm_kontakt (
  id              uuid PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES crm_organisation(id) ON DELETE CASCADE,
  vorname         text,
  nachname        text,
  funktion        text,
  email           text,
  rechtsgrundlage text NOT NULL DEFAULT 'BERECHTIGTES_INTERESSE'
                  CHECK (rechtsgrundlage IN ('EINWILLIGUNG','VERTRAG','BERECHTIGTES_INTERESSE')),
  marketing_frei  boolean NOT NULL DEFAULT false
);

-- Ein aus der Recherche uebernommener Kontakt darf nie in einem
-- Marketingsegment landen: ohne Einwilligung kein Marketing.
ALTER TABLE crm_kontakt ADD CONSTRAINT crm_kontakt_marketing_braucht_einwilligung
  CHECK (marketing_frei = false OR rechtsgrundlage = 'EINWILLIGUNG');

-- -----------------------------------------------------------------------------
--  Protokoll
-- -----------------------------------------------------------------------------
CREATE TABLE lg_protokoll (
  id         bigserial PRIMARY KEY,
  ereignis   text NOT NULL,
  objekt_id  uuid,
  detail     jsonb,
  zeitpunkt  timestamptz NOT NULL DEFAULT now()
);
