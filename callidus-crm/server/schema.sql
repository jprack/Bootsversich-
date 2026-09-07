-- Callidus Boots-CRM — lokales SQLite-Schema
-- Wird beim ersten Start automatisch von server/db.js ausgeführt (CREATE TABLE IF NOT EXISTS).

PRAGMA foreign_keys = ON;

-- ===================== Kunden =====================
CREATE TABLE IF NOT EXISTS customers (
  id                              TEXT PRIMARY KEY,
  titel                           TEXT DEFAULT '',
  vorname                         TEXT DEFAULT '',
  nachname                        TEXT NOT NULL,
  geburtsdatum                    TEXT DEFAULT '',   -- Freitext, wie bisher (TT.MM.JJJJ typischerweise)
  email                           TEXT DEFAULT '',
  telefon                         TEXT DEFAULT '',
  adresse                         TEXT DEFAULT '',
  status                          TEXT DEFAULT '',   -- '' | 'offert' | 'antrag' | 'polizze'
  notizen                         TEXT DEFAULT '',
  quelle                          TEXT DEFAULT '',   -- Kundenempfehlung | Partner-Empfehlung | Newsletter | ...
  partner_id                      TEXT REFERENCES partners(id) ON DELETE SET NULL,
  provision                       REAL,              -- Prozent
  vorversicherung_versicherer     TEXT DEFAULT '',
  vorversicherung_polizzennummer  TEXT DEFAULT '',
  vorversicherung_hauptfaelligkeit TEXT DEFAULT '',  -- ISO-Datum (YYYY-MM-DD)
  vorversicherung_praemie         REAL,
  -- Legacy-Fallback-Felder (nur relevant, falls ein Kunde ohne verknüpftes Boot importiert wird)
  bootsname                       TEXT DEFAULT '',
  bootstyp                        TEXT DEFAULT '',
  created_at                      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_partner ON customers(partner_id);

-- ===================== Boote (ein Kunde kann mehrere haben) =====================
CREATE TABLE IF NOT EXISTS boats (
  id                TEXT PRIMARY KEY,
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name              TEXT DEFAULT '',
  bootstyp          TEXT DEFAULT 'Motorboot',   -- Motorboot | Segelboot
  registrierungsland TEXT DEFAULT '',
  werft             TEXT DEFAULT '',
  hersteller        TEXT DEFAULT '',
  modell            TEXT DEFAULT '',
  yachttyp          TEXT DEFAULT '',
  baujahr           TEXT DEFAULT '',
  laenge            TEXT DEFAULT '',
  breite            TEXT DEFAULT '',
  tiefgang          TEXT DEFAULT '',
  rumpfmaterial     TEXT DEFAULT '',
  mastmaterial      TEXT DEFAULT '',
  segelflaeche      TEXT DEFAULT '',
  motortyp          TEXT DEFAULT '',
  motorleistung_kw  TEXT DEFAULT '',
  hersteller_motor  TEXT DEFAULT '',
  fahrtgebiet       TEXT DEFAULT '',
  charter           TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_boats_customer ON boats(customer_id);

-- ===================== Partner (Vermittler) =====================
CREATE TABLE IF NOT EXISTS partners (
  id             TEXT PRIMARY KEY,
  nummer         TEXT DEFAULT '',
  name           TEXT NOT NULL,
  typ            TEXT DEFAULT 'Versicherungsmakler', -- Versicherungsmakler | Sachverständiger | Bootsbauer | Marina/Charterunternehmen
  bootsbauer_typ TEXT DEFAULT '[]',  -- JSON-Array, z.B. ["Segelboot","Motorboot"] — nur bei typ='Bootsbauer'
  iban           TEXT DEFAULT '',
  email          TEXT DEFAULT '',
  adresse        TEXT DEFAULT '',
  plz_ort        TEXT DEFAULT ''
);

-- ===================== Polizzen (Verträge) =====================
CREATE TABLE IF NOT EXISTS vertraege (
  id                   TEXT PRIMARY KEY,
  customer_id          TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  versicherer          TEXT NOT NULL,
  polizzennummer       TEXT DEFAULT '',
  versicherungsbeginn  TEXT DEFAULT '',
  hauptfaelligkeit     TEXT DEFAULT '',
  zahlweise            TEXT DEFAULT 'Jährlich',
  notizen              TEXT DEFAULT '',
  quelle               TEXT DEFAULT '',   -- z.B. Link/Dateiname zum Originaldokument
  erstellt             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vertraege_customer ON vertraege(customer_id);

-- Sparten je Polizze (Kasko, Haftpflicht, Unfall, ...)
CREATE TABLE IF NOT EXISTS sparten (
  id                TEXT PRIMARY KEY,
  vertrag_id        TEXT NOT NULL REFERENCES vertraege(id) ON DELETE CASCADE,
  sparte            TEXT NOT NULL,
  versicherungssumme REAL,
  selbstbehalt      REAL,
  erstpraemie       REAL,
  folgepraemie      REAL,
  polizzennummer    TEXT DEFAULT ''   -- nur falls abweichend von vertraege.polizzennummer
);
CREATE INDEX IF NOT EXISTS idx_sparten_vertrag ON sparten(vertrag_id);

-- ===================== Prämienberechnungen (Quotes, informell gespeichert) =====================
CREATE TABLE IF NOT EXISTS quotes (
  id                  TEXT PRIMARY KEY,
  customer_id         TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  erstellt            TEXT NOT NULL DEFAULT (datetime('now')),
  bootstyp            TEXT,
  baujahr             INTEGER,
  versicherungssumme  REAL,
  zone                TEXT,
  nautima             REAL,
  callidus            REAL,
  quelle              TEXT DEFAULT ''   -- 'NAUTIMA-Antrag' | 'Bootsdatenblatt' | ...
);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);

-- ===================== Anträge & Bootsdatenblätter (volle Rohdaten) =====================
CREATE TABLE IF NOT EXISTS antraege (
  id           TEXT PRIMARY KEY,
  customer_id  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  erstellt     TEXT NOT NULL DEFAULT (datetime('now')),
  typ          TEXT NOT NULL,     -- 'NAUTIMA-Antrag' | 'Bootsdatenblatt'
  daten        TEXT NOT NULL      -- JSON-Blob, siehe BootsCRM_reference.jsx für exakte Struktur
);
CREATE INDEX IF NOT EXISTS idx_antraege_customer ON antraege(customer_id);

-- ===================== Aufgaben (Angebot nachfassen, Kündigungsfrist, Geburtstag, Empfehlung) =====================
CREATE TABLE IF NOT EXISTS tasks (
  id                 TEXT PRIMARY KEY,
  customer_id        TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name      TEXT NOT NULL,   -- denormalisiert für schnelle Anzeige ohne JOIN
  titel              TEXT NOT NULL,
  tage               INTEGER,
  faelligkeitsdatum  TEXT NOT NULL,   -- ISO-Datetime
  erstellt           TEXT NOT NULL DEFAULT (datetime('now')),
  erledigt           INTEGER NOT NULL DEFAULT 0  -- 0/1
);
CREATE INDEX IF NOT EXISTS idx_tasks_customer ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_faellig ON tasks(faelligkeitsdatum, erledigt);

-- ===================== Historie (Kontaktverlauf) =====================
CREATE TABLE IF NOT EXISTS historie (
  id           TEXT PRIMARY KEY,
  customer_id  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  datum        TEXT NOT NULL DEFAULT (datetime('now')),
  typ          TEXT NOT NULL,   -- Anruf | E-Mail | Termin | Notiz | Sonstiges
  text         TEXT NOT NULL,
  system       INTEGER NOT NULL DEFAULT 0  -- 0 = manuell eingetragen, 1 = automatisch erzeugt
);
CREATE INDEX IF NOT EXISTS idx_historie_customer ON historie(customer_id, datum);

-- ===================== Dokumente =====================
-- Dateien selbst liegen unter server/uploads/<customer_id>/<id>_<filename>,
-- hier steht nur der Verweis + Metadaten (kein Base64 mehr in der DB!).
CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  customer_id  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  mime_type    TEXT DEFAULT 'application/octet-stream',
  size         INTEGER,
  filepath     TEXT NOT NULL,    -- relativer Pfad unter server/uploads/
  uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer_id);

-- ===================== Einstellungen (Wochenziel etc.) =====================
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
