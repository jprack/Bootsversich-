# 04_DEALER_DATABASE

**Callidus Boat Intelligence Platform — Bootshändler-Datenbank**

| Feld | Wert |
| --- | --- |
| Modul | `04_DEALER_DATABASE` |
| Fassung | 1.0 |
| Datum | 2026-08-23 |
| Status | Fachkonzept zur Freigabe |
| Grundlage | [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md) 1.3 · [`02_CORE_CRM/`](../02_CORE_CRM/README.md) 1.2 · [`03_LEAD_GENERATION_ENGINE/`](../03_LEAD_GENERATION_ENGINE/README.md) 1.0 |
| Märkte | AT ab Stufe 1, DE ab Stufe 2, CH ab Stufe 3 |

---

## Executive Summary

Der Bootshändler ist der wichtigste Zugang zum Versicherungsgeschäft dieser
Plattform — weil Bootsversicherung im Moment des Kaufs entschieden wird und
nicht im Moment des Bedarfs. Dieses Modul beschreibt, wie das Händlernetz
erfasst, bewertet, betreut und ausgewertet wird.

### Das Ziel, präzisiert

Der Auftrag nennt als Ziel die **größte** Händlerdatenbank im DACH-Raum. Modul 03
hat belegt, dass der Markt endlich ist — Größenordnung 10³ Betriebe je Land.
**Damit ist Größe kein Vorsprung:** Wer den Markt vollständig erfasst, hat die
größte Datenbank, und jeder Wettbewerber mit derselben Arbeit hat sie in
derselben Woche auch.

Der Engpass ist ein anderer. Eine Händlerliste veraltet im ersten Jahr um
schätzungsweise ein Fünftel: Marken wechseln, Filialen schließen, Verkaufsleiter
gehen. Nichts davon meldet jemand.

> **Nicht die größte Händlerdatenbank, sondern die einzige aktuelle.**
> Gemessen als **Aktualitätsgrad** — der Anteil der Betriebe, deren fünf
> tragende Angaben in den letzten zwölf Monaten bestätigt wurden.

Diese Zahl kann niemand abschreiben, sie entsteht nur aus gepflegten Beziehungen,
und sie **fällt von selbst**, wenn nicht gearbeitet wird. Genau das macht sie zur
Führungskennzahl ([ADR-0005](adr/0005-aktualitaet-statt-menge.md)).

### Die fünf tragenden Entscheidungen

**1. Es entsteht keine Tabelle `BOOTSHAENDLER`.**
Ein Händler ist eine `ORGANISATION` mit der Rolle `HAENDLER` und einem
Rollenprofil. Der Grund ist praktisch: Ein Betrieb ist häufig mehreres
gleichzeitig — Händler *und* Kunde *und* Charterbetrieb. Eine eigene Tabelle
hieße zwei Adressen derselben Firma, die auseinanderlaufen
([ADR-0001](adr/0001-haendler-als-rolle.md)).

**2. Rechtsträger und Standort sind zwei Dinge.**
Ein Betrieb mit drei Filialen ist **eine** Organisation mit drei Standorten.
Entscheidungsfrage: *Kann diese Adresse einen Vertrag unterschreiben?*
Diese Lücke ist nicht beim Entwerfen aufgefallen, sondern **beim Ansehen des
Prüflaufs von Modul 03** — dort wurden zwei Filialen als zwei Organisationen
freigegeben ([ADR-0002](adr/0002-standort-getrennt.md)).

**3. Markenvertretungen werden historisiert.**
Sie wechseln im Jahresrhythmus. Ohne Historie ist „Wer hat dieses Boot 2024
verkauft?" nicht beantwortbar — und „Warum ist die Vermittlung eingebrochen?"
auch nicht. Dieselbe Logik wie beim unveränderlichen Vertrag
([ADR-0003](adr/0003-markenbeziehung-historisiert.md)).

**4. Der Händlerwert wechselt von Schätzung zu Messung.**
Reichweite (40) + Beziehung (30) + **Ertrag (30)**. Solange nichts vermittelt
wurde, ist der Ertragsteil leer und der Wert sichtbar *vorläufig*. Mit der ersten
Vermittlung zählt Gemessenes. Ein großer Betrieb, der nichts schickt, ist kein
A-Händler — er ist ein großer Betrieb
([ADR-0004](adr/0004-score-wechselt-zu-messung.md)).

**5. Die Klassifizierung ist an die Kapazität gekoppelt.**
A alle 60 Tage, B alle 120, C jährlich. Bei 250 Händlern sind das **505
Betreuungskontakte im Jahr** — rund 2,3 am Tag für zwei Personen. Machbar, aber
an der Obergrenze. Deshalb: **Der Bestand darf nicht schneller wachsen, als
Betreuung möglich ist.**

### Was der Auftrag nicht genannt hat und trotzdem hier steht

| Ergänzung | Warum |
|---|---|
| `VERLOREN` als Pipelinezustand | Ohne ihn verfälschen gescheiterte Anbahnungen entweder den Bestand oder die Pipeline |
| `PARTNER_RUHEND` | Die sichtbare Vorstufe eines Verlusts — noch umkehrbar |
| **Vermittlungsquote** als Kennzahl | Die einzige Zahl, die eine *unterschriebene* von einer *funktionierenden* Kooperation unterscheidet |
| Versicherungsrelevanz je Produktbereich | Macht aus einer Merkmalsliste ein Vertriebswerkzeug — inklusive Wert `KONKURRENZ` |
| Herkunft und Datum an beurteilenden Feldern | Ohne sie ist eine Schätzung nach zwei Jahren von einer Tatsache nicht mehr zu unterscheiden |

### Was nicht so umgesetzt ist wie beschrieben

| Vorgabe | Umsetzung | Grund |
|---|---|---|
| Online-Präsenz und Social Media im Score | **Erfasst, aber nicht bewertend** | Sie messen Marketingbudget, nicht Versicherungsbedarf. Sonst verliert der Familienbetrieb mit 30 Neubooten gegen eine Agenturseite ohne Geschäft |
| Geburtstag | Nur **Tag und Monat**, nur freiwillig genannt, nie recherchiert | Ein Geburtstagsanruf beim Verkaufsleiter, der ihn nie genannt hat, wirkt nicht aufmerksam, sondern beunruhigend |
| Öffnungsraten und Klickverhalten je Person | **Nur mit getrennter Einwilligung zur Messung** | Eine Newsletter-Einwilligung ist keine Messeinwilligung. Ohne sie: aggregierte Zahlen, die für 250 Händler ohnehin genügen |
| 15 Produktbereiche als Felder | **Katalog mit Zuordnung je Standort** | Der 16. Bereich kommt bestimmt — ein Katalogeintrag ist kein Entwicklungsauftrag |

---

## Zuordnung zum Auftrag

| Auftrag | Findet sich in |
| --- | --- |
| 1 · Executive Summary | dieses Dokument |
| 2 · Dealer Architektur | [`01_GESAMTKONZEPT.md`](01_GESAMTKONZEPT.md) |
| 3 · Datenmodell | [`02_DATENMODELL.md`](02_DATENMODELL.md) — mit Zuordnung jedes geforderten Feldes |
| 4 · Händlerklassifizierung | [`04_KLASSIFIZIERUNG.md`](04_KLASSIFIZIERUNG.md) |
| 5 · Scoringmodell | [`05_SCORINGMODELL.md`](05_SCORINGMODELL.md) |
| 6 · Vertriebsworkflow | [`06_VERTRIEBSPROZESS.md`](06_VERTRIEBSPROZESS.md) · [`07_AUTOMATIONEN.md`](07_AUTOMATIONEN.md) |
| 7 · Marketingintegration | [`08_MARKETING_UND_VERANSTALTUNGEN.md`](08_MARKETING_UND_VERANSTALTUNGEN.md) |
| 8 · Dashboard | [`10_DASHBOARD.md`](10_DASHBOARD.md) |
| 9 · API-Modell | [`11_API_KONZEPT.md`](11_API_KONZEPT.md) |
| 10 · DSGVO-Konzept | [`12_DSGVO.md`](12_DSGVO.md) |
| 11 · Roadmap | [`13_SKALIERUNG_ROADMAP.md`](13_SKALIERUNG_ROADMAP.md) |
| — Markenmodell und Standortmodell | [`03_MARKEN_UND_STANDORTE.md`](03_MARKEN_UND_STANDORTE.md) |
| — Dokumentenmanagement | [`09_DOKUMENTE.md`](09_DOKUMENTE.md) |
| — Modulentscheidungen | [`adr/`](adr/README.md) |

**Lesereihenfolge:** Summary → 01 → 02 → 03 → 04 → 06.
Für die Geschäftsführung genügen Summary, 04, 10 und 13.

---

## Verhältnis zu den anderen Modulen

| Modul | Verhältnis |
| --- | --- |
| `03_LEAD_GENERATION_ENGINE` | **Liefert** neue Händler über die Freigabe. Ab dort führt dieses Modul. Der Rückkanal `dealer.location.added` verhindert, dass Filialen erneut als eigene Betriebe vorgeschlagen werden |
| `02_CORE_CRM` | **Trägt** Organisation, Kontakt, Aufgabe, Dokument, Vertrag. Hier entstehen nur Rollen-Zusatzdaten — neun neue Entitäten, keine davon dupliziert das CRM |
| Tarifwerk | **Braucht** den Markenkatalog: Der Premiumwerften-Nachlass ist ohne gepflegte Marken nicht anwendbar. Deshalb ist `premiumwerft_quelle` ein Pflichtfeld |
| Dealer Hub (M4) | **Konsumiert** dieses Modul — sieht aber weder Klasse noch Händlerwert noch Besuchsberichte |

---

## Offene Punkte dieses Moduls

| ID | Punkt | Blockiert | Zu klären durch |
| --- | --- | --- | --- |
| **D-01** | Aufbewahrungsfrist für Besuchsberichte und Vertriebsnotizen — 36 Monate tragfähig? | Löschkonzept | Rechts- und Datenschutzberatung |
| **D-02** | Getrennte Einwilligung für die Messung von Öffnungs- und Klickverhalten: Text und Gestaltung | Marketingmodul | Datenschutzberatung |
| **D-03** | Erweiterung der Interessenabwägung auf die laufende Betreuung | Erfassung von Ansprechpartnern über die Erstansprache hinaus | Datenschutzberatung |
| **D-04** | Umsatzklasse und Bootszahl bei **Einzelunternehmen** — dort personenbezogen | Bewertung dieser Betriebe | Rechtsberatung |
| **D-05** | Schweiz: Vermittlerzulassung vor jeder Ansprache. Die Datenbank selbst ist davon unberührt | Ausbaustufe 3 | Geschäftsführung |

**Zuerst zu klären: D-03.** Ohne die erweiterte Abwägung fehlt die Grundlage,
Ansprechpartner über die Erstansprache hinaus zu führen — und das ist die
Voraussetzung für jede Betreuung. D-02 folgt, sobald der erste Newsletter
ansteht.

---

## Glossar

| Begriff | Bedeutung |
| --- | --- |
| **Rechtsträger** | Die Firma, die unterschreiben kann. Eine `ORGANISATION` |
| **Standort** | Eine Adresse, an der sie tätig ist. Kein Rechtsträger |
| **Rollenprofil** | Händlerspezifische Merkmale an der Organisationsrolle |
| **Händlerwert** | Reichweite + Beziehung + Ertrag, 0–100, historisiert |
| **Klasse** | A / B / C — eine **Betreuungsentscheidung**, kein Urteil über den Betrieb |
| **Aktualitätsgrad** | Anteil der Betriebe mit in 12 Monaten bestätigten Kerndaten. Die Leitkennzahl |
| **Vermittlungsquote** | Anteil der aktiven Partner mit mindestens einer Anfrage in 12 Monaten |
| **Vertretung** | Befristete Markenzuordnung mit Gebiet und Rang |
| **Vertriebsgebiet** | Vom Hersteller zugewiesen, **je Marke** — nicht je Firma |
| **Revier** | Gewässer. Für die Vertriebsplanung brauchbarer als Bundesland |
