# 03 — Markenmodell und Standortmodell

---

## Teil A — Die Kette Hersteller → Importeur → Händler → Endkunde

## 1. Was die Kette wirklich ist

Der Auftrag zeichnet sie als Linie. Im Datenmodell ist sie **keine
Fremdschlüsselkette**, und das ist der wichtigste Punkt dieses Kapitels:

```
   HERSTELLER            Organisation, Rolle HERSTELLER
        │
        │ führt (1..n)
        ▼
     MARKE               eigene Entität — ein Hersteller führt mehrere Marken
        │
        │ HAENDLER_MARKE   ◀── befristet · mit Gebiet · mit Rang
        ▼
    HAENDLER             Organisation, Rolle HAENDLER
        │
        │ verkauft (nicht gespeichert)
        ▼
    ENDKUNDE             ist KUNDE im CRM — verbunden über das BOOT,
                         nicht über den Händler
```

### 1.1 Warum der Endkunde nicht an der Kette hängt

Ein Kunde gehört keinem Händler. Er hat dort **ein Boot gekauft** — das ist eine
Tatsache über einen Kaufvorgang, nicht über eine Zugehörigkeit. Gespeichert wird
sie am Boot (`BOOT.haendler_organisation_id`, gesetzt bei Kenntnis) und am Lead
(`quelle = HAENDLER`).

Der Unterschied ist praktisch: Wechselt der Kunde das Boot und kauft beim
zweiten Händler, wäre eine Zuordnung „Kunde gehört Händler A" falsch — die
Provisionszuordnung des ersten Geschäfts bleibt aber richtig. **Vorgänge werden
zugeordnet, Menschen nicht.**

### 1.2 Warum die Marke eine eigene Entität ist

Ein Hersteller führt mehrere Marken; Marken wechseln den Eigentümer; ein Händler
vertritt eine Marke, nicht ein Unternehmen. Wer Marke und Hersteller in einem
Feld führt, kann den Verkauf einer Marke nicht abbilden, ohne die Historie zu
zerstören.

Und für uns hängt daran Geld: Der **Premiumwerften-Nachlass** aus dem NAUTIMA-Tarif
gilt für **Marken**, nicht für Unternehmen
([`01_ARCHITECTURE/13_TARIFWERK.md`](../01_ARCHITECTURE/13_TARIFWERK.md)).

---

## 2. MARKE

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `name` | text(120) | ja | |
| `hersteller_organisation_id` | uuid | nein | Leer, solange der Hersteller nicht erfasst ist |
| `land_herkunft` | char(2) | nein | |
| `segment` | enum | ja | `SEGEL`, `MOTOR`, `KATAMARAN`, `SUPERYACHT`, `SCHLAUCHBOOT`, `MOTOR_ANTRIEB`, `SONSTIGE` |
| `preisklasse` | enum | nein | `EINSTIEG`, `MITTE`, `PREMIUM`, `LUXUS` |
| `ist_premiumwerft` | boolean | ja | **Steuert den Tarifnachlass.** Standard `false` |
| `premiumwerft_quelle` | text(200) | nein | **Pflicht, wenn `true`** — welches Tarifwerk, welche Fassung |
| `aktiv` | boolean | ja | Eine eingestellte Marke wird nicht gelöscht |

**`premiumwerft_quelle` als Pflichtfeld ist kein Formalismus.** Ein Häkchen ohne
Beleg wird irgendwann gesetzt, weil eine Marke „sicher dazugehört" — und dann
rechnet die Plattform einen Nachlass, den der Versicherer nicht gewährt. Die
Differenz zahlt niemand zurück.

---

## 3. HAENDLER_MARKE — die befristete Vertretung

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `organisation_id` | uuid | ja | Der Händler |
| `marke_id` | uuid | ja | |
| `rang` | enum | ja | `VERTRAGSHAENDLER`, `SERVICEPARTNER`, `GEBIETSVERTRETUNG`, `GELEGENTLICH` |
| `gebiet` | text(200) | nein | Vertriebsgebiet **je Marke** — nicht am Standort |
| `exklusiv` | boolean | ja | |
| `importeur_organisation_id` | uuid | nein | Wenn nicht direkt beim Hersteller |
| `gueltig_ab` | date | ja | |
| `gueltig_bis` | date | nein | Leer = läuft |
| `beendigungsgrund` | enum | nein | `ABGEGEBEN`, `ENTZOGEN`, `MARKE_EINGESTELLT`, `BETRIEBSAUFGABE`, `UNBEKANNT` |
| `herkunft` | enum | ja | `SELBSTAUSKUNFT`, `HERSTELLERVERZEICHNIS`, `WEBSITE`, `SCHAETZUNG` |
| `bestaetigt_am` | date | ja | |

### 3.1 Warum das historisiert wird

Markenvertretungen wechseln. Das ist im Bootshandel keine Ausnahme, sondern der
normale Jahresrhythmus — und es ist der häufigste Grund, weshalb Händlerlisten
veralten.

Drei Fragen, die nur mit Historie beantwortbar sind:

| Frage | Ohne Historie | Mit Historie |
|---|---|---|
| Wer hat dieses Boot 2024 verkauft? | „Der heutige Händler dieser Marke" — oft falsch | Der damalige Vertragshändler |
| Warum ist die Vermittlung eingebrochen? | unbekannt | Die Marke wurde entzogen |
| Wem gebührt die Provision für einen Altvorgang? | Streit | Nachweisbar |

**Das ist dieselbe Logik wie beim unveränderlichen Vertrag**
([ADR-0002 des Kern-CRM](../02_CORE_CRM/adr/0002-vertrag-unveraenderlich.md)):
Der aktuelle Stand ist eine Ansicht auf eine Folge, nicht der einzige Zustand.

### 3.2 Der Importeur

Ein Importeur ist keine eigene Entität, sondern eine **Organisation mit der Rolle
`LIEFERANT`** (die Rolle existiert bereits im Kern-CRM) und einer Kennzeichnung
im Rollenprofil. Er steht in `HAENDLER_MARKE.importeur_organisation_id`, weil die
Beziehung dort hingehört: **derselbe Händler kann Marke A direkt und Marke B über
einen Importeur führen.**

Ein eigenes Feld „Importeur" am Händler wäre daher falsch — es gibt nicht *den*
Importeur eines Betriebs.

---

## Teil B — Standortmodell

## 4. Der Fall, der das Modell erzwungen hat

Im Prüfstand des Moduls 03 wurden zwei Objekte erfasst:

| Objekt | Name | PLZ |
|---|---|---|
| `R000001` | Bootscenter Steinbach GmbH | 4853 |
| `R000002` | Bootscenter Steinbach GmbH — Filiale Nord | 5310 |

Beide wurden als **zwei Organisationen** ins CRM übernommen. Der Prüflauf war
darin richtig — der Dublettenabgleich hat sie korrekt als `IST_ANDERE`
entschieden, weil eine Filiale keine Dublette ist.

**Als Ergebnis ist es trotzdem falsch:** Es gibt einen Rechtsträger, nicht zwei.
Zwei Organisationen bedeuten zwei Adressverwaltungen, zwei
Vertragsmöglichkeiten, zwei Provisionsempfänger und einen doppelten Eintrag in
jeder Auswertung.

> **Das ist der Grund, weshalb dieses Modul das Standortmodell braucht — und
> ein Beispiel dafür, wozu ein Prüfstand da ist.** Die Lücke ist nicht beim
> Nachdenken aufgefallen, sondern beim Ansehen des Ergebnisses.

---

## 5. Die Regel

> **Ein Rechtsträger ist eine `ORGANISATION`. Jede Adresse, an der er tätig ist,
> ist ein `STANDORT`.**

| Erscheinung | Modellierung |
|---|---|
| Ein Betrieb, drei Filialen | **eine** Organisation, drei Standorte |
| Zwei Betriebe, ein Hafen | **zwei** Organisationen, je ein Standort |
| Ein Betrieb, zwei Rechtsformen (GmbH + Verein) | **zwei** Organisationen, verbunden über die Beziehungstabelle |
| Filiale wird eigene GmbH | Standort endet, **neue** Organisation entsteht, Beziehung wird gesetzt |
| Betrieb übernimmt einen anderen | Beide bleiben; der übernommene geht auf `BEENDET`, Standorte wechseln den Träger |

### 5.1 Woran man es entscheidet

Eine einzige Frage:

> **Kann diese Adresse einen Vertrag unterschreiben?**

Ja → Organisation. Nein → Standort.

Das ist prüfbar, in einer Minute beantwortbar und deckt sich mit dem, was im
Firmenbuch steht.

---

## 6. Was am Standort hängt und was am Rechtsträger

| Am **Rechtsträger** (Organisation) | Am **Standort** |
|---|---|
| Firmenwortlaut, Rechtsform, Register, UID | Anschrift, Telefon, unpersönliche E-Mail |
| Verträge und Kooperationen | Öffnungszeiten, Saisonbetrieb |
| Provisionsanspruch | Produktbereiche (Kapitel 2.6) |
| Klasse und Händlerwert | Liegeplätze, Hallenfläche |
| Betreuer | Zugeordnete Ansprechpartner |
| Markenvertretungen | Revier und Gebietszuordnung |

**Markenvertretungen hängen am Rechtsträger, nicht am Standort**, weil der
Herstellervertrag mit der Firma geschlossen wird. Das Gebiet steht in der
Vertretung selbst.

---

## 7. Ansprechpartner über mehrere Standorte

`KONTAKT_ORGANISATION` erhält ein zusätzliches Feld `standort_id`:

| Fall | Abbildung |
|---|---|
| Geschäftsführer, gesamter Betrieb | Zuordnung ohne Standort |
| Verkaufsleiter Nord | Zuordnung mit `standort_id` = Filiale Nord |
| Person arbeitet an zwei Standorten | Zwei Zuordnungen, dieselbe Person |
| Person wechselt zum Wettbewerber | Zuordnung endet, `KONTAKT` bleibt, neue Zuordnung entsteht |

Die letzte Zeile ist die häufigste und wird am häufigsten falsch gemacht: Wer
den Kontakt löscht, verliert die gesamte Gesprächshistorie — und trifft die
Person zwei Jahre später beim nächsten Betrieb wieder, ohne es zu wissen.

---

## 8. Regionen und Gebiete — drei verschiedene Dinge

| Begriff | Bedeutung | Liegt an |
|---|---|---|
| **Region** | Verwaltungseinheit (Bundesland) | `STANDORT` |
| **Revier** | Gewässer — die fachlich richtige Einheit | `STANDORT` |
| **Vertriebsgebiet** | Vom Hersteller zugewiesenes Gebiet, **je Marke** | `HAENDLER_MARKE` |

Sie fallen regelmäßig auseinander: Ein Betrieb am Attersee (Revier) in
Oberösterreich (Region) kann für eine Marke ganz Österreich betreuen (Gebiet).
Wer die drei in einem Feld führt, kann keine der drei Fragen beantworten.

**Für die Vertriebsplanung ist das Revier die brauchbarste Einheit** — der
Bootsbestand sammelt sich an Gewässern, nicht an Verwaltungsgrenzen. Für die
Gebietstreue gegenüber Herstellern ist es das Vertriebsgebiet. Beides wird
gebraucht.
