# ADR-0001 — Der Rechercheraum ist vom CRM getrennt

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Recherchedaten sind unsicher: unvollständig, veraltet, doppelt, teils falsch. Sie
stammen aus Quellen, die niemand von uns kontrolliert, und ein erheblicher Teil
wird nie zu einem Geschäftspartner.

| Option | Bewertung |
|---|---|
| **Direkt als `ORGANISATION` im CRM anlegen**, mit Statusfeld | Nach sechs Monaten ist nicht mehr unterscheidbar, welche Organisation ein geprüfter Partner ist und welche eine Zeile aus einem Verzeichnis. Löschfristen kollidieren |
| **Externe Tabelle ohne Modell**, etwa Tabellenkalkulation | Keine Belege, keine Sperren, keine Rechte, kein Abgleich. Genau der Zustand, den das Projekt ablöst |
| **Eigenes Schema mit einem einzigen Übergabepunkt** *(gewählt)* | Der Rechercheraum darf schmutzig sein, das CRM nicht |

## Entscheidung

Ein eigenes Datenbankschema mit eigenen Rechten. Der einzige Weg ins CRM ist
`POST /v1/research/objects/{id}/release`, ausgelöst von einem Menschen.

Kein Fremdschlüssel zeigt aus dem CRM in den Rechercheraum — nur umgekehrt. Der
Rückfluss läuft über Ereignisse.

## Begründung

- **Dasselbe Muster wie der Polizzenimport:** erfassen, vorschlagen, prüfen,
  übernehmen. Ein zweites Muster für dieselbe Aufgabe wäre eine unnötige zweite
  Denkweise.
- **Löschbarkeit.** Recherchedaten haben eigene, kürzere Fristen. Ein
  Fremdschlüssel aus dem CRM würde das Löschen blockieren.
- **Prüfbarkeit.** Ein Prüfer muss genau einen Endpunkt ansehen, um zu
  beurteilen, ob die Trennung hält.
- **Rechte.** Marketing hat keinen Zugriff auf den Rechercheraum. Was nicht
  lesbar ist, gerät nicht in einen Verteiler.

## Konsequenzen

**Positiv:** Der Bestand bleibt sauber. Recherche ist ohne Risiko erweiterbar.

**Negativ:** Zwei Schemata, zwei Rechtemodelle, ein Übergabeweg mit Prüfungen.
Ein Objekt existiert vorübergehend zweimal — einmal als Vermutung, einmal als
Datensatz.
