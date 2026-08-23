# ADR-0002 — Der Kandidat ist eine Organisation, keine Person

**Status:** vorgeschlagen · 2026-08-23

## Kontext

Der Auftrag beschreibt eine flache `LEAD`-Tabelle mit Firma, Vorname, Nachname,
Position und Adresse in einer Zeile. Die Zielgruppen sind jedoch Clubs, Marinas,
Werften, Händler — durchweg Organisationen.

| Option | Bewertung |
|---|---|
| **Eine Zeile je Lead**, Firma und Person gemischt | Scheitert am Verein mit Obmann *und* Schriftführer, am Händler mit drei Standorten, an der Person in zwei Vereinen. Kollidiert mit ADR-0001 des Kern-CRM |
| **Nur Personen erfassen** | Es gibt zu Beginn keine. Die Recherche findet Betriebe, keine Menschen |
| **Organisation als Kandidat, Person als eigene Entität mit 0..n** *(gewählt)* | Entspricht der Wirklichkeit und dem bestehenden Modell |

## Entscheidung

`RECHERCHEOBJEKT` ist eine Organisation. `AKQUISEKONTAKT` hängt daran, null bis
mehrfach, und wird **erst angelegt, wenn ein Ansprechpartner tatsächlich
gebraucht wird**.

Die Feldliste des Auftrags ist vollständig umgesetzt — als Ansicht über beide
Entitäten, mit Zuordnungstabelle in Kapitel 3.1.

## Begründung

- **Der Score braucht keinen Namen.** Erfassung, Bewertung und Priorisierung
  funktionieren vollständig auf Organisationsdaten.
- **Datenschutz ohne Aufwand:** Solange kein Name gespeichert ist, entsteht keine
  Informationspflicht nach Art. 14 DSGVO. Die Pflicht entsteht erst dort, wo sie
  ohnehin durch die Ansprache erfüllt wird.
- **Übergang ohne Bruch:** Eine Organisation wird zu `ORGANISATION` +
  `ORGANISATIONSROLLE`. Eine gemischte Zeile wäre beim Übergang zu zerlegen — und
  jede Zerlegung verliert etwas.

## Konsequenzen

**Positiv:** Weniger Personendaten, weniger Pflichten, sauberer Übergang,
mehrere Ansprechpartner möglich.

**Negativ:** Die Oberfläche muss zwei Entitäten zu einer Ansicht verbinden. Wer
die Datenbank direkt liest, findet nicht „eine Zeile je Lead".
