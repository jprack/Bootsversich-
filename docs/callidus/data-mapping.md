# Callidus — Datenmapping

| Feld | Wert |
|---|---|
| Status | **ENTWURF — Zielseite unverifiziert** |
| Gültig für | `MockCallidusAdapter`, `ManualCallidusAdapter` |

## 0. Warum dieses Dokument vorläufig ist

Die rechte Spalte („Callidus-Feld") kann erst gefüllt werden, wenn F-04, F-11
und F-12 beantwortet sind. Bis dahin beschreibt dieses Dokument die **eigene**
Seite des Mappings vollständig und markiert die Gegenseite als offen. Das
Mapping selbst wird nicht im Code hart verdrahtet, sondern als Datensatz
`ProductFieldMapping` je `ProductSchema`-Version gepflegt.

## 1. Vorgangskorrelation

| Eigenes Feld | Bedeutung | Callidus-Feld | Status |
|---|---|---|---|
| `InsuranceCase.caseNumber` | fachliche Vorgangsnummer, extern sichtbar | ? | `OFFENER PUNKT` (F-12) |
| `CallidusTransmission.idempotencyKey` | verhindert Doppeleinreichung | ? | `OFFENER PUNKT` (F-12) |
| `CallidusTransmission.externalReference` | Referenz der Gegenseite | ? | `OFFENER PUNKT` (F-12) |

## 2. Person

| Eigenes Feld | Typ | Pflicht | Callidus-Feld | Status |
|---|---|---|---|---|
| `Customer.lastName` | string | ja | ? | `OFFENER PUNKT` |
| `Customer.firstName` | string | ja | ? | `OFFENER PUNKT` |
| `Customer.birthDate` | date | ja | ? | `OFFENER PUNKT` |
| `Customer.email` (ContactMethod) | string | ja | ? | `OFFENER PUNKT` |
| `Customer.phone` (ContactMethod) | string | nein | ? | `OFFENER PUNKT` |
| `CustomerAddress.street` / `houseNumber` | string | ja | ? | `OFFENER PUNKT` |
| `CustomerAddress.postalCode` | string | ja | ? | `OFFENER PUNKT` |
| `CustomerAddress.city` | string | ja | ? | `OFFENER PUNKT` |
| `CustomerAddress.country` | `AT` \| `DE` | ja | ? | `OFFENER PUNKT` |

> Steuerliche Identifikationsnummern, Bankverbindungen und
> Gesundheitsangaben sind **nicht** Bestandteil des MVP-Mappings. Sie werden
> erst aufgenommen, wenn F-16 belegt, dass sie benötigt werden **und** eine
> Rechtsgrundlage dokumentiert ist.

## 3. Produktdaten

Produktspezifische Risikodaten liegen in `QuoteRequestVersion.data` (JSONB) und
folgen dem `ProductSchema` der referenzierten Version. Das Mapping auf die
Gegenseite erfolgt datengetrieben:

```
ProductFieldMapping
  productSchemaId   -> welche Schemaversion
  sourcePath        -> JSON-Pointer in unsere Daten, z. B. "/vehicle/firstRegistration"
  targetField       -> Feldname der Gegenseite   (offen bis F-04)
  transform         -> optionale, deklarative Umformung (Datum, Einheit, Codeliste)
  required          -> Pflichtfeld der Gegenseite
```

Zulässige `transform`-Werte im MVP: `none`, `dateToIso`, `dateToDdmmyyyy`,
`decimalToMinorUnits`, `upperCase`, `codeList` (mit hinterlegter Werteliste).
Freie Ausdrücke oder Code in der Datenbank sind nicht zulässig.

## 4. Geldbeträge

| Regel | Festlegung |
|---|---|
| Speicherung intern | `Decimal(14,2)` in PostgreSQL, `string` an der API-Grenze |
| Übertragung | Betrag **und** Währung, niemals nur der Betrag |
| Floating Point | ausgeschlossen — weder `number` in TypeScript noch `double precision` in der DB |
| Rundung | kaufmännisch, ausschließlich an der Darstellungsgrenze |
| Währung | ISO-4217, im MVP ausschließlich `EUR` |

## 5. Datum und Zeit

| Regel | Festlegung |
|---|---|
| Speicherung | UTC (`timestamptz`) |
| Reine Kalenderdaten (Geburtsdatum, Versicherungsbeginn) | `date`, ohne Zeitzone |
| Anzeige | `Europe/Vienna` beziehungsweise `Europe/Berlin`, je nach Land des Vorgangs |
| Fristen (Erinnerungen, Gültigkeit) | in Kalendertagen, in der Zeitzone des Vorgangs berechnet |

## 6. Rückrichtung: Angebot

| Callidus liefert | Ziel im eigenen Modell | Status |
|---|---|---|
| Tarifbezeichnung | `Quote.tariffName` | `OFFENER PUNKT` |
| Prämie + Währung | `Quote.premiumAmount`, `Quote.currency` | `OFFENER PUNKT` |
| Zahlungsweise | `Quote.paymentFrequency` | `OFFENER PUNKT` |
| Laufzeit | `Quote.termMonths` | `OFFENER PUNKT` |
| Versicherungsbeginn | `Quote.coverageStart` | `OFFENER PUNKT` |
| Deckungen | `QuoteCoverage[]` | `OFFENER PUNKT` |
| Ausschlüsse | `QuoteExclusion[]` | `OFFENER PUNKT` |
| Gültig bis | `Quote.validUntil` | `OFFENER PUNKT` |
| Dokumente | `Document[]` mit `origin = CALLIDUS` | `OFFENER PUNKT` |
