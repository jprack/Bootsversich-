# ADR-0005 — WordPress-Adminbereich als CRM-Werkbank

**Status:** vorgeschlagen · 2026-08-22

## Kontext

Der Innendienst braucht einen Arbeitsplatz. Drei Wege standen zur Wahl.

| Option | Bewertung |
|---|---|
| **Eigene Anwendung neben WordPress** | Höchste Freiheit, höchster Aufwand. Zweite Anmeldung, zweites Aussehen, zweiter Betrieb |
| **Fertiges CRM-Plugin** | Speichert in `wp_postmeta`, kein Objektberechtigungsmodell, keine Mandantentrennung, keine Versionierung. Scheitert an den Kernanforderungen |
| **Eigene Plugins im Adminbereich** *(gewählt)* | Vertraute Bedienung, eine Anmeldung, ein Betrieb. Daten bleiben im Kern |

## Entscheidung

Die Werkbank entsteht als eigene Plugins in `wp-admin`. Listen serverseitig über
`WP_List_Table`, die interaktiven Bildschirme (Tagesliste, Kundenakte,
Dashboards) als React-Inseln. Jeder Datenzugriff läuft über die Core Bridge.

## Begründung

- **Eine Anmeldung, ein Aussehen, ein Betrieb.** Der Innendienst wechselt nicht zwischen Systemen.
- **`WP_List_Table` löst, was sonst gebaut werden müsste:** Sortierung, Filter, Massenaktionen, Seitennavigation.
- **Kein Fachdatum in WordPress.** Der Schutz aus ADR-0001 der Gesamtarchitektur bleibt vollständig erhalten.
- **Ablösbar.** Sollte der Adminbereich an Grenzen stoßen, tritt eine eigene Anwendung an dieselbe API. Die Domäne bleibt unberührt.

## Konsequenzen

**Positiv:** Schnell nutzbar, vertraut, geringer Betriebsaufwand.

**Negativ:** Der Adminbereich ist für Redaktion entworfen, nicht für
Sachbearbeitung. Tastaturbedienung und Massenerfassung sind schwächer als in
einer eigenen Anwendung. Jeder Bildschirm braucht einen API-Aufruf statt einer
Datenbankabfrage.

**Ausgangslage (`C-04` entschieden):** zwei gleichzeitige Arbeitsplätze. Die
Entscheidung ist damit unstrittig.

**Grenze, an der neu zu entscheiden ist:** Ab etwa fünfzehn
gleichzeitigen Arbeitsplätzen mit dauerhafter Erfassung überwiegt der Nachteil.
Dann wird die Werkbank eine eigene Anwendung — gegen dieselbe API, ohne
Domänenänderung.

## Bedingung, die nicht verhandelbar ist

**Ein Bildschirm ruft einen Endpunkt auf.** Sieben Einzelaufrufe je Ansicht sind
das erste, was als „langsam" auffällt — und der Moment, in dem der Innendienst
auf Excel ausweicht. Damit wäre das Modul gescheitert, unabhängig von der
Qualität des Datenmodells.
