# 03_LEAD_GENERATION_ENGINE

**Callidus Boat Intelligence Platform — Lead Generation Engine**

| Feld | Wert |
|---|---|
| Modul | `03_LEAD_GENERATION_ENGINE` |
| Fassung | 1.0 |
| Datum | 2026-08-23 |
| Status | Fachkonzept zur Freigabe |
| Grundlage | [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md) 1.3 · [`02_CORE_CRM/`](../02_CORE_CRM/README.md) 1.2 |
| Märkte | AT ab Stufe 1, DE ab Stufe 2 |

---

## Management Summary

Die Engine findet, bewertet und übergibt die Organisationen der Wassersportbranche
— Händler, Marinas, Clubs, Charterbetriebe, Werften, Hersteller — an das Kern-CRM.
Sie ist der Zulieferer der Partnergewinnung.

Die Ausarbeitung hat zwei Annahmen des Auftrags nicht bestätigt. Beide sind
folgenreich genug, um vorn zu stehen.

### Befund 1 — Der Markt ist endlich

Es gibt keine beliebige Zahl von Segelclubs in Österreich. Es gibt eine zählbare
Menge in der Größenordnung von **10³ je Land und Cluster**, und sie wächst um
wenige Einheiten im Jahr.

**Damit ist Leadgenerierung hier kein Mengenproblem, sondern ein
Vollständigkeitsproblem.** Eine Engine, die monatlich 400 neue Leads meldet,
beschreibt nicht den Markt, sondern ihre eigene Dublettenrate.

Die Leitkennzahl ist deshalb der **Abdeckungsgrad** — wie viel Prozent der
bekannten Grundgesamtheit ist erfasst, bewertet und in einem definierten
Zustand. Eine Zahl, die gegen 100 % läuft und dort bleibt.

### Befund 2 — Es gibt keine Kaltakquise per E-Mail

Werbe-E-Mail ohne vorherige Einwilligung ist in Österreich (§ 174 TKG 2021) und
Deutschland (§ 7 Abs. 2 UWG) unzulässig — **auch an Unternehmen, auch an
`info@`**. Österreich ist beim Werbeanruf zusätzlich enger als Deutschland.

Damit fällt genau der Kanal weg, den übliche Lead-Werkzeuge als Kernfunktion
verkaufen. Die zulässigen Wege sind **Post, Telefon nach Prüfung, persönliche
Ansprache und eingehende Anfrage** — alle vier langsamer, alle vier mit Menschen.

Das ist bei diesen Zielgruppen kein Verlust: Kaltmail braucht Masse, um zu
wirken, und die gibt es hier nicht. Ein Massenanschreiben an alle Yachtclubs
eines Sees spricht sich schneller herum als jede Empfehlung — in die falsche
Richtung.

> Diese Einordnung ist die Arbeitsgrundlage des Konzepts und **vor der ersten
> Aussendung anwaltlich zu bestätigen** (offener Punkt **L-02**). Bis dahin gilt
> die engere Auslegung für beide Mandanten.

### Die sechs tragenden Entscheidungen

**1. Der Rechercheraum ist nicht das CRM.**
Recherchedaten sind unsicher, unvollständig und teils falsch. Sie liegen in einem
eigenen Schema mit eigenen Rechten; der einzige Weg ins CRM ist eine
menschliche Freigabe über genau einen Endpunkt. Dasselbe Muster wie der
Polizzenimport: erfassen, vorschlagen, prüfen, übernehmen —
[ADR-0001](adr/0001-rechercheraum-getrennt.md).

**2. Der Kandidat ist eine Organisation, keine Person.**
Ein Segelclub ist kein Kontakt. Eine Person entsteht erst, wenn ein
Ansprechpartner gebraucht wird — und solange kein Name gespeichert ist, entsteht
keine Informationspflicht. Datenminimierung, die nichts kostet
([ADR-0002](adr/0002-kandidat-ist-organisation.md)).

**3. Nur erlaubte Quellen.**
LinkedIn, Facebook, Instagram und YouTube werden **nicht** automatisiert
ausgewertet; ihre Nutzungsbedingungen untersagen es. Eine Datengrundlage, die
jederzeit abgeschaltet werden kann, ist kein Vermögenswert
([ADR-0003](adr/0003-erlaubte-quellen.md)).

**4. Der Motor findet, der Mensch spricht.**
Keine automatisierte Ansprache. Die zulässigen Kanäle liegen als Datentabelle
vor; ein nicht erlaubter Kanal ist technisch gesperrt, nicht durch Richtlinie
untersagt ([ADR-0004](adr/0004-ansprache-ohne-kaltmail.md)).

**5. Zwei Scores statt einem.**
Vier der acht geforderten Kriterien sind bei der Recherche unbekannt. Der
**Basiswert** nutzt nur Beobachtbares und steuert die Reihenfolge; der
**Potenzialwert** bleibt leer, bis jemand gesprochen hat. Jeder Punkt ist auf
eine Tatsache zurückführbar, sonst lässt er sich technisch nicht setzen
([ADR-0005](adr/0005-score-zweistufig.md)).

**6. Die Kapazität begrenzt den Motor.**
Zwei Personen, 50 Aufgaben am Tag, davon höchstens 15 für Akquise. Übersteigt die
Prüfliste 100 Objekte, **pausiert die Recherche**. Das Ende bremst den Anfang —
ungewöhnlich für ein Vertriebswerkzeug und der Grund, weshalb dieses
funktionieren wird ([ADR-0006](adr/0006-kapazitaet-begrenzt.md)).

### Der wichtigste Satz zur Vertriebsstrategie

> **Der Bootshändler ist der Kanal, nicht der Kunde.**
> Bootsversicherung wird im Moment des Kaufs entschieden. Wer beim Händler steht,
> wenn der Kaufvertrag unterschrieben wird, hat die Police. Wer erst zur nächsten
> Hauptfälligkeit anruft, kämpft gegen einen bestehenden Vertrag.

Daraus folgt die Reihenfolge: **Handel → Infrastruktur → Charter → Vereine →
Industrie.** Hersteller stehen im Vertrieb zuletzt und in der Datenpflege
zuerst — ihr Händlerverzeichnis erschließt den ersten Cluster fast vollständig.

---

## Zuordnung zum Auftrag

| Auftrag | Findet sich in |
| --- | --- |
| 1 · Management Summary | dieses Dokument |
| 2 · Lead Generation Architektur | [`01_GESAMTKONZEPT.md`](01_GESAMTKONZEPT.md) |
| 3 · Datenmodell | [`03_DATENMODELL.md`](03_DATENMODELL.md) — mit Zuordnung jedes geforderten Feldes |
| 4 · Quellenstrategie | [`04_QUELLENSTRATEGIE.md`](04_QUELLENSTRATEGIE.md) |
| 5 · Scoringmodell | [`05_SCORINGMODELL.md`](05_SCORINGMODELL.md) |
| 6 · CRM-Integration | [`07_CRM_INTEGRATION.md`](07_CRM_INTEGRATION.md) |
| 7 · Pipeline | [`08_PIPELINE.md`](08_PIPELINE.md) |
| 8 · Automationen | [`09_AUTOMATIONEN.md`](09_AUTOMATIONEN.md) |
| 9 · Dashboard | [`11_DASHBOARD.md`](11_DASHBOARD.md) |
| 10 · API-Konzept | [`12_API_KONZEPT.md`](12_API_KONZEPT.md) |
| 11 · DSGVO-Konzept | [`13_DSGVO.md`](13_DSGVO.md) |
| 12 · Roadmap | [`14_SKALIERUNG_ROADMAP.md`](14_SKALIERUNG_ROADMAP.md) |
| — Zielgruppenmodell | [`02_ZIELGRUPPEN.md`](02_ZIELGRUPPEN.md) |
| — Dublettenprüfung | [`06_DUBLETTENPRUEFUNG.md`](06_DUBLETTENPRUEFUNG.md) |
| — Marketingübergabe | [`10_MARKETINGUEBERGABE.md`](10_MARKETINGUEBERGABE.md) |
| — Modulentscheidungen | [`adr/`](adr/README.md) |

**Lesereihenfolge:** Summary → 01 → 02 → 03 → 05 → 07 → 10.
Für die Geschäftsführung genügen Summary, 02, 10 und 14.

---

## Verhältnis zu den anderen Modulen

| Modul | Verhältnis |
| --- | --- |
| `01_ARCHITECTURE` | Füllt Modul M2 (Leadgenerierung) fachlich aus. Prinzipien, Sicherheit und Betrieb gelten unverändert |
| `02_CORE_CRM` | Der Rechercheraum liefert; das CRM führt. Organisationen, Rollen, Kontakte, Aufgaben und Einwilligungen entstehen dort |
| `01_CRM_ENGINE` | Bewertet **Verhalten** im Bestand. Der Basiswert dieses Moduls bewertet **Recherchierbares** vor dem ersten Kontakt — zwei verschiedene Zahlen, bewusst getrennt |
| Tarifwerk | Liefert zwei Argumente: die Charter-Festpreisliste als fertiges Produkt für Z4 und den Premiumwerften-Nachlass, der eine gepflegte Herstellerliste voraussetzt |

---

## Offene Punkte dieses Moduls

| ID | Punkt | Blockiert | Zu klären durch |
| --- | --- | --- | --- |
| **L-01** | Nutzungsbedingungen des gewählten Kartendienstes — ist die Speicherung der Angaben erlaubt? | Quellen der Klasse B | Produktverantwortung |
| **L-02** | Bestätigung der Kanalmatrix nach TKG (AT) und UWG (DE), insbesondere die telefonische Ansprache in Österreich | **Jede aktive Ansprache** | Rechtsberatung |
| **L-03** | Freigabe der Interessenabwägung und der Informationstexte nach Art. 14 DSGVO | Erfassung von Ansprechpartnern | Datenschutzberatung |
| **L-04** | Grundgesamtheit je Zielgruppe und Land — Erhebung, Quelle, Stand | Abdeckungsgrad als Leitkennzahl | Produktverantwortung |
| **L-05** | Sprachmodell zur Klassifikation: lokal betrieben oder unter Auftragsverarbeitungsvertrag? | Anreicherung | Geschäftsführung (deckungsgleich mit **C-08**) |
| **L-06** | Schweiz: Die Hürde ist die Vermittlerzulassung, nicht der Datenschutz | Ausbaustufe 3 | Geschäftsführung |

**Zuerst zu klären: L-02 und L-04.** Ohne L-02 darf niemand angesprochen werden;
ohne L-04 gibt es keine Leitkennzahl. Beide brauchen keinen Entwickler, und die
Erhebung zu L-04 liefert nebenbei die ersten hundert Objekte.

---

## Glossar

| Begriff | Bedeutung |
| --- | --- |
| **Rechercheobjekt** | Eine Organisation als Vermutung. Lebt außerhalb des CRM |
| **Rechercheraum** | Das getrennte Schema, in dem Vermutungen leben dürfen |
| **Beleg** | Ein Feldwert mit Quelle, Lauf, Fundstelle und Datum |
| **Freigabe** | Der einzige Übergang vom Rechercheraum ins CRM, ausgelöst von einem Menschen |
| **Basiswert** | Score aus Beobachtbarem. Steuert die Reihenfolge der Ansprache |
| **Potenzialwert** | Score aus Gesprächsergebnissen. Leer, bis gesprochen wurde |
| **Abdeckungsgrad** | Beurteilte Objekte ÷ geschätzte Grundgesamtheit. Die Leitkennzahl |
| **Sperrvermerk** | Quellenübergreifende Sperre. Wirkt vor der Erfassung, nicht danach |
| **Kanalmatrix** | Gepflegte Tabelle: welcher Kanal, welches Land, welche Empfängerart, erlaubt oder nicht |
| **Cluster Z1…Z5** | Handel · Infrastruktur · Gemeinschaft · Betrieb · Industrie |
