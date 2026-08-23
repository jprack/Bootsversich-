# ADR-0002 — Rechtsträger und Standort sind zwei Dinge

**Status:** entschieden · 2026-08-23

## Kontext

Der Prüfstand des Moduls 03 hat zwei Objekte erfasst und freigegeben:
„Bootscenter Steinbach GmbH" (PLZ 4853) und „Bootscenter Steinbach GmbH —
Filiale Nord" (PLZ 5310). Der Dublettenabgleich hat sie korrekt als
`IST_ANDERE` entschieden — eine Filiale ist keine Dublette.

**Als Ergebnis war es trotzdem falsch:** Es gibt einen Rechtsträger, nicht zwei.

| Option | Bewertung |
|---|---|
| **Jede Adresse ist eine Organisation** | Doppelte Zählung in jeder Auswertung, gespaltene Vertragshistorie, zwei Provisionsempfänger für eine Firma |
| **Nur der Hauptsitz wird geführt** | Der Verkaufsleiter der Filiale, die Öffnungszeiten und die Reviernähe gehen verloren — genau das, was den Vertrieb steuert |
| **Organisation als Rechtsträger, `STANDORT` als Adresse** *(gewählt)* | Entspricht der Wirklichkeit und dem Firmenbuch |

## Entscheidung

Ein Rechtsträger ist eine `ORGANISATION`. Jede Adresse, an der er tätig ist, ist
ein `STANDORT` mit eigener Erreichbarkeit, eigenen Öffnungszeiten, eigenen
Produktbereichen und eigener Revierzuordnung.

**Die Entscheidungsfrage lautet: Kann diese Adresse einen Vertrag
unterschreiben?** Ja → Organisation. Nein → Standort.

Genau ein Standort je Organisation trägt `ist_hauptsitz`. Ansprechpartner können
einem Standort zugeordnet werden (`KONTAKT_ORGANISATION.standort_id`).
Markenvertretungen hängen dagegen am Rechtsträger, weil der Herstellervertrag
mit der Firma geschlossen wird.

## Begründung

- **Verträge, Provisionen und Klassen gehören zum Rechtsträger.** Sie an einer
  Filiale zu führen ist juristisch falsch und praktisch nicht abrechenbar.
- **Erreichbarkeit und Revier gehören zum Standort.** Ein Betrieb mit Filialen an
  drei Seen hat drei Reviere — an der Firma wäre nur eines abbildbar.
- **Der Fehler ist nicht rückwirkend heilbar.** Sind Vorgänge erst an zwei
  Organisationen gehängt, ist die Zusammenführung Handarbeit über Wochen.

## Konsequenzen

**Positiv:** Ein Betrieb wird einmal gezählt. Filialschließungen und
Verselbständigungen sind abbildbar, ohne Historie zu verlieren.

**Negativ:** Eine Ebene mehr. Der Rechercheraum aus Modul 03 muss lernen, eine
Filiale als Standortvorschlag statt als eigenständigen Betrieb zu behandeln —
dafür ist das Ereignis `dealer.location.added` vorgesehen.

**Bemerkenswert:** Diese Lücke ist nicht beim Entwerfen aufgefallen, sondern beim
Ansehen eines Laufergebnisses. Das ist der Zweck eines Prüfstands.
