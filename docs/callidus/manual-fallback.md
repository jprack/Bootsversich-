# Callidus — Manueller Fallback

Solange keine verifizierte technische Schnittstelle vorliegt, läuft der
Austausch mit Callidus über einen **kontrollierten manuellen Prozess**. Dieser
Prozess ist kein Notbehelf am Rand des Systems, sondern ein vollwertiger,
auditierter Adapter (`ManualCallidusAdapter`).

## Grundsatz

Auch im manuellen Betrieb gilt:

- Jeder Schritt erzeugt einen Audit-Eintrag mit handelnder Person.
- Statusänderungen sind nur über die Statusmaschine möglich, nie über generische Updates.
- Externe Referenzen (Vorgangsnummer bei Callidus) werden erfasst und sind eindeutig.
- Es wird **kein** Partnerportal automatisiert (kein Scraping, kein Bot, kein Credential Sharing).

## Ablauf: Angebotsanfrage (ausgehend)

1. Vorgang erreicht Status `READY_FOR_QUOTE`.
2. Agent löst „Exportpaket erzeugen" aus.
3. Das System erzeugt ein **Exportpaket** (siehe unten) und legt es im Object Storage ab.
4. Der Vorgang wechselt nach `QUOTE_SUBMISSION_PENDING`.
5. Der Agent übermittelt das Paket über den freigegebenen Weg (Portal-Upload, E-Mail an den Partnerkontakt).
6. Der Agent bestätigt die Übermittlung im Agentenportal und erfasst die externe Referenz.
7. Der Vorgang wechselt nach `QUOTE_SUBMITTED`. Audit-Eintrag mit Zeitpunkt, Person, Kanal, Referenz.

## Ablauf: Angebotsübernahme (eingehend)

1. Callidus liefert ein Angebot (PDF und/oder strukturierte Daten).
2. Der Agent lädt die Datei im Agentenportal hoch und ordnet sie dem Vorgang zu.
3. Das System speichert das Dokument unverändert, berechnet SHA-256 und startet den Malware-Scan.
4. Der Agent erfasst die strukturierten Angebotsdaten über ein Formular
   (Prämie, Währung, Zahlungsweise, Laufzeit, Versicherungsbeginn, Deckungen, Gültigkeit).
5. Der Vorgang wechselt nach `QUOTE_RECEIVED`, danach automatisch nach `QUOTE_VALIDATION_PENDING`.
6. Die deterministischen Prüfregeln laufen. Ergebnis: `QUOTE_APPROVED` oder `MANUAL_REVIEW_REQUIRED`.

> Manuell erfasste Angebotsdaten sind gegenüber automatisch importierten Daten
> **nicht** privilegiert: Sie durchlaufen dieselben Prüfregeln.

## Ablauf: Antragseinreichung (ausgehend)

1. Vorgang erreicht `READY_FOR_CALLIDUS` (signiert, Unterlagen vollständig).
2. System erzeugt das Einreichungspaket.
3. Agent übermittelt es über den freigegebenen Weg und bestätigt die Übermittlung.
4. Vorgang wechselt nach `SUBMITTED_TO_CALLIDUS`.
5. Rückmeldung von Callidus wird manuell erfasst: `COMPLETED` oder `CALLIDUS_REJECTED` mit Begründung.

## Exportpaket

Verzeichnisstruktur innerhalb eines ZIP-Archivs:

```
<vorgangsnummer>/
  manifest.json          Metadaten, Prüfsummen, Schemaversion
  antragsdaten.json      Produktdaten gemäß ProductSchema (Version im Manifest)
  antragsdaten.csv       identische Daten, flach, für manuelle Erfassung
  dokumente/
    <dokumentId>_<typ>.<ext>
  README.txt             Kurzanleitung für die manuelle Weiterverarbeitung
```

`manifest.json` enthält mindestens: interne Vorgangs-ID, Vorgangsnummer,
Produktcode, Land, `productSchemaVersion`, Erzeugungszeitpunkt (UTC),
erzeugende Person, Liste aller Dateien mit SHA-256, sowie einen Hinweis auf die
Vertraulichkeitsstufe.

## Was der manuelle Prozess **nicht** darf

- Keine Übermittlung sensibler Unterlagen als unverschlüsselter E-Mail-Anhang.
  Bevorzugt: Upload im freigegebenen Portal oder Zustellung über einen sicheren Link.
- Keine Weitergabe von Zugangsdaten zwischen Personen.
- Keine Statusänderung ohne erfassten Beleg (Referenz, Zeitpunkt, Kanal).
- Kein Export ohne erneute Autorisierung der handelnden Person.

## Übergang zur realen Integration

Der manuelle Prozess bleibt dauerhaft als Rückfallebene erhalten (Runbook
`docs/operations/runbook-callidus-ausfall.md`). Sobald der `RealCallidusAdapter`
freigeschaltet ist, wird pro Produkt und Land entschieden, welcher Adapter
greift — steuerbar über Feature Flags, nicht über Codeänderungen.
