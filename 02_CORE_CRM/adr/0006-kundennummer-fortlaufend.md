# ADR-0006 — Kundennummer: fortlaufend ab 1, ohne Bedeutung

**Status:** entschieden · 2026-08-22 · schließt **C-02**

## Kontext

Die Kundennummer wird extern kommuniziert — am Telefon, in Briefen, in
Betreffzeilen, auf Belegen. Sie ist damit die einzige Kennung des Systems, die
Menschen lesen und wiedergeben. Sie ist rückwirkend nicht änderbar: Sobald die
erste vergeben ist, sind alle künftigen darauf festgelegt.

Der Start erfolgt auf leerer Datenbank (**C-03**), es sind keine Fremdnummern zu
berücksichtigen. Drei Wege standen zur Wahl.

| Option | Bewertung |
|---|---|
| **Sprechende Nummer** (`AT-2026-HAE-0042`) | Verschlüsselt Markt, Jahr, Kanal — alles Tatsachen, die sich ändern. Eine korrekturbedürftige Nummer ist keine Nummer |
| **Ein Zähler je Mandant** | Erzeugt zweimal `000047`. Kollidiert bei Wohnsitzwechsel, gemeinsamen Dokumenten und im Telefonat |
| **Ein fortlaufender Zähler ab 1, mandantenübergreifend** *(gewählt)* | Trägt keine Bedeutung, kann nicht falsch werden, kann nicht kollidieren |

## Entscheidung

Ein mandantenübergreifender Zähler, beginnend bei 1, Schrittweite 1, ohne
Bedeutungsanteil. Darstellung sechsstellig mit führenden Nullen (`000001`).
Gespeichert als `text(20)`, global `UNIQUE`. Vergeben aus der PostgreSQL-Sequenz
`kundennummer_seq` in derselben Transaktion, die den `KUNDE`-Datensatz anlegt.

Vergabe erfolgt beim Entstehen des Kunden, **nicht** beim Lead. Nummern werden
nie wiederverwendet. Lücken sind zulässig und werden nicht nachgefüllt.

Die Vorgangsnummer (Modul M10) trägt ein Buchstabenpräfix (`V-004711`), damit
Kunden- und Vorgangsnummer im E-Mail-Posteingang nicht verwechselbar sind.

## Begründung

- **Merkmale gehören in Spalten, nicht in Schlüssel.** Alles, was jemand in
  einer sprechenden Nummer suchen würde, steht im Datenmodell als eigenes Feld —
  filterbar, auswertbar und änderbar.
- **Die Mandantentrennung leistet `mandant_id` mit Row Level Security.** Der
  Nummernkreis muss sie nicht wiederholen; täte er es, wäre er nur eine zweite,
  schlechtere Kopie derselben Grenze.
- **Feste Länge** macht die Nummer textsortierbar, vorlesbar und in Belegen
  erkennbar. Ab `999999` wächst die Darstellung, ohne dass etwas umgestellt wird.
- **Lückenlosigkeit wird nicht zugesichert**, weil sie eine Sperrtabelle
  verlangte, die jede Kundenanlage serialisiert. Lückenlos müssen
  Rechnungsnummern sein — die entstehen nicht im CRM.

## Konsequenzen

**Positiv:** Nicht falsifizierbar, nicht kollidierbar, keine Umstellung bei
Wachstum, keine Sonderbehandlung beim zweiten Markt.

**Negativ:** Die Nummer sagt nichts. Wer aus ihr auf den Markt oder das
Anlagejahr schließen möchte, muss den Datensatz öffnen. Das ist beabsichtigt.

**Nicht mehr änderbar ab:** der ersten vergebenen Nummer im Echtbetrieb.

## Verweise

[`13_STARTKONFIGURATION.md`](../13_STARTKONFIGURATION.md) §2 ·
[`02_DATENMODELL.md`](../02_DATENMODELL.md) §7
