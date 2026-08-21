# ADR-0001 — WordPress als Experience Layer, eigener Domänenkern

**Status:** vorgeschlagen · 2026-08-21 · **Entscheidung der Geschäftsführung erforderlich**

## Kontext

Die Vorgabe lautet: Die Plattform soll auf WordPress basieren. Gleichzeitig
soll sie Versicherungsverträge führen, Einwilligungen nachweisen, Vorgänge mit
Fristen steuern, Dokumente revisionsfähig ablegen und mehrere Mandanten
trennen.

WordPress ist für den ersten Teil hervorragend geeignet und für den zweiten
strukturell ungeeignet. Diese Entscheidung legt fest, wie beides zusammengeht.

## Geprüfte Optionen

### Option A — WordPress allein

Fachdaten in eigenen Tabellen innerhalb der WordPress-Datenbank, Fachlogik in
Plugins, Portale als WordPress-Seiten.

| Dafür | Dagegen |
|---|---|
| Ein System, ein Betrieb, geringste Anfangskosten | Jedes Plugin läuft mit vollem Datenbankzugriff — eine Sicherheitslücke in einem beliebigen Plugin erreicht Vertragsdaten |
| Schnellster Start | Berechtigungsmodell von WordPress kennt keine Objektebene; Mandantentrennung nicht auf Datenbankebene durchsetzbar |
| Vertraute Werkzeuge | Keine Zustandsmaschinen, keine Transaktionsdisziplin, keine verlässliche Zeitsteuerung (`wp-cron` hängt an Seitenaufrufen) |
| | Auditprotokoll nicht wirksam unveränderlich zu halten |
| | Bei einem Vorfall ist die gesamte Kundendatenbank betroffen |

### Option B — WordPress als Experience Layer, eigener Domänenkern *(gewählt)*

WordPress besitzt Inhalte und Darstellung. Ein eigener Dienst besitzt Personen,
Verträge, Vorgänge, Dokumente und Protokolle. Verbindung über eine API im
privaten Netz.

| Dafür | Dagegen |
|---|---|
| Eine WordPress-Kompromittierung gibt **keine** Fachdaten preis | Zwei Systeme, zwei Datenbanken, höherer Betriebsaufwand |
| Mandantentrennung als Datenbankbedingung durchsetzbar | Mehr Anfangsaufwand |
| Zustandsmaschinen, Transaktionen, verlässliche Zeitsteuerung | API-Verträge müssen gepflegt werden |
| Auditprotokoll wirksam append-only | Zwei Sprachen wären ein Problem — deshalb ADR-0002 |
| Kern später an Bestandsführung oder Versicherer anschließbar | |
| Vorhandene CRM-Engine in PostgreSQL direkt nutzbar | |

### Option C — WordPress nur als Content-Lieferant (headless)

WordPress liefert ausschließlich Inhalte an ein eigenes Frontend.

| Dafür | Dagegen |
|---|---|
| Maximale Freiheit im Frontend | Verliert genau das, was WordPress wertvoll macht: Redaktion, Vorschau, SEO-Ökosystem, Seitenbau ohne Entwickler |
| | Höchster Aufwand, geringster Zusatznutzen für diese Plattform |

## Entscheidung

**Option B.**

WordPress bleibt die Plattformbasis für alles Sichtbare: Websites, Inhalte,
Kampagnenseiten, Formulare, Portale, Mehrsprachigkeit, Suchmaschinen. Der
Domänenkern übernimmt alles, was nachweisbar, dauerhaft und trennbar sein muss.

Die Grenze verläuft nicht nach Bequemlichkeit, sondern nach einer prüfbaren
Frage:

> **Muss dieses Datum in drei Jahren vor einer Aufsichtsbehörde, einem
> Gericht oder einem Prüfer bestehen?**
>
> Ja → Domänenkern. Nein → WordPress.

## Konsequenzen

**Positiv**

- Der Schaden einer WordPress-Kompromittierung ist auf Inhalte begrenzt.
- Plugins können freier eingesetzt werden, weil sie keine Fachdaten erreichen.
- Der Domänenkern ist ohne WordPress testbar.
- Ein späterer Wechsel des CMS berührt keine Fachdaten.

**Negativ**

- Zwei Systeme im Betrieb, zwei Sicherungsstrategien, zwei Aktualisierungspfade.
- Jede Portalansicht braucht einen API-Aufruf statt einer Datenbankabfrage —
  begegnet mit Zwischenspeicherung und gebündelten Endpunkten.
- Die Trennung muss diszipliniert eingehalten werden. Der wahrscheinlichste
  Fehlweg ist, „nur dieses eine Feld" in `wp_postmeta` abzulegen (Risiko U-02).

**Durchsetzung**

- Kein Fachdatum in WordPress-Tabellen — Gegenstand jeder Codeprüfung.
- Getrennte Datenbanken, getrennte Zugangsdaten, kein Netzweg von WordPress zur
  Kern-Datenbank.
- Der WordPress-Datenbankbenutzer hat keinerlei Zugriff auf PostgreSQL.

## Wann diese Entscheidung falsch wäre

Wenn die Plattform dauerhaft unter etwa 200 Verträgen bliebe, keine Partner
anbinden und keine Mandanten trennen müsste, wäre Option A vertretbar. Die
Modulliste des Auftrags — Dealer Hub, Club Hub, Partnerportal, Workflow,
Analytics — beschreibt jedoch ausdrücklich das Gegenteil.
