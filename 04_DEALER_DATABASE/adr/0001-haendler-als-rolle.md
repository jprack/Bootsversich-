# ADR-0001 — Der Händler ist eine Organisationsrolle, keine eigene Tabelle

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Der Auftrag beschreibt eine Entität `BOOTSHÄNDLER` mit Grunddaten, Adresse,
Ansprechpartnern, Produktbereichen und CRM-Feldern in einem Block. Das Kern-CRM
führt bereits `ORGANISATION` mit `ORGANISATIONSROLLE`.

| Option | Bewertung |
|---|---|
| **Eigene Tabelle `BOOTSHAENDLER`** | Der Händler, der selbst versichert ist, liegt zweimal im Bestand — mit zwei Adressen, die auseinanderlaufen. Bei jedem Adresswechsel entscheidet der Zufall, welche gepflegt wird |
| **Sicht auf die Organisation ohne Zusatzdaten** | Reicht nicht: Marken, Bootszahl, Klasse und Betreuungsfrequenz haben in der allgemeinen Organisation nichts verloren |
| **Rollenprofil an der Organisationsrolle** *(gewählt)* | Eine Firma, ein Datensatz, beliebig viele Rollen mit eigenen Zusatzdaten |

## Entscheidung

Ein Händler ist eine `ORGANISATION` mit `ORGANISATIONSROLLE = HAENDLER`. Die
händlerspezifischen Merkmale liegen in `ROLLENPROFIL_HAENDLER`, das an der Rolle
hängt — nicht an der Organisation.

Die im Auftrag geforderte Feldliste ist vollständig umgesetzt und in Kapitel 2.1
Feld für Feld ihrem Ort zugeordnet.

Auch die API kennt keinen eigenen Pfad: `/v1/organisations/{id}/dealer-profile`
statt `/v1/dealers/{id}`.

## Begründung

- **Ein Betrieb ist häufig mehreres gleichzeitig.** Händler und Kunde, Händler
  und Charterbetrieb, Händler und später Makler. Vier Rollen, ein Datensatz.
- **Rollen enden, Organisationen nicht.** Gibt ein Betrieb den Handel auf, endet
  die Rolle. Der Kunde, der er daneben ist, bleibt unberührt.
- **Berechtigungen, Mandantentrennung und Löschregeln gelten automatisch.** Eine
  zweite Tabelle hieße, sie ein zweites Mal zu schreiben — und ein zweites Mal
  falsch machen zu können.

## Konsequenzen

**Positiv:** Keine Dubletten zwischen Händler- und Kundenbestand. Die
Organisationsakte zeigt alle Beziehungen an einer Stelle.

**Negativ:** Die Oberfläche muss mehrere Entitäten zu einer Händlerakte
verbinden. Wer die Datenbank direkt liest, findet keine Tabelle namens
`BOOTSHAENDLER`.
