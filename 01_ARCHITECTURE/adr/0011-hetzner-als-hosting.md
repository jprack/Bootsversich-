# ADR-0011 — Hetzner als Hosting-Anbieter

**Status:** angenommen · 2026-08-21 · schließt offenen Punkt **A-03**

## Entscheidung

Hetzner Online, deutsche Standorte. Ausbaustufe V1 als überschaubarer
Serververbund im Eigenbetrieb.

## Begründung

| Grund | Gewicht |
|---|---|
| Deutscher Betreiber, deutsche Rechenzentren, kein Drittlandbezug | **Hoch.** Die Drittlandbewertung entfällt vollständig — der größte Zeitgewinn in der Datenschutzprüfung |
| Preis-Leistung | Der V1-Rahmen aus Kapitel 09 ist komfortabel eingehalten |
| Feste IPv4, private Netze, S3-kompatibler Speicher | Deckt alle Anforderungen der Architektur |

## Was die Entscheidung kostet

Kapitel 02 ging von „Managed PostgreSQL" aus. Diese Annahme trägt nicht.

| Fehlt | Kompensation |
|---|---|
| Managed PostgreSQL | Eigener Datenbankserver mit dedizierten vCPU, `pgBackRest`, PITR, eigene Wartungsfenster |
| Unveränderliche Sicherungen | Dritte, verschlüsselte Kopie **außerhalb des Kontos** |
| Managed Kubernetes | V2-Pfad neu zu bewerten: `k3s` im Eigenbetrieb oder Anbieterwechsel für die Orchestrierung. V1 bleibt unberührt |
| Ausgehendes SMTP ohne Freischaltung | Siehe A-09 — der E-Mail-Weg braucht ohnehin eine eigene Entscheidung |

**Bewertet in Arbeitszeit:** rund 4–6 Stunden im Monat im Normalbetrieb, plus
Bereitschaft. Das ist vertretbar — aber nur mit einer benannten verantwortlichen
Person. Ohne diese verfällt der Betrieb still, und man merkt es an dem Tag, an
dem man die Sicherung braucht.

## Zwei Punkte, die nicht verhandelbar sind

1. **Die Datenbank läuft auf dedizierten vCPU.** Gemeinsam genutzte vCPU liefern
   unvorhersagbare Antwortzeiten. Das ist der eine Posten, an dem nicht gespart
   wird.
2. **Eine Sicherungskopie liegt außerhalb des Hetzner-Kontos.** Snapshots,
   Backups und Objektspeicher liegen sonst im selben Konto — wer es übernimmt,
   löscht alle drei. Genau darauf zielen Verschlüsselungsangriffe.

## Wann diese Entscheidung zu prüfen wäre

Beim Übergang zu V2, wenn Orchestrierung und Read Replicas gebraucht werden;
oder wenn der Betriebsaufwand die eingesparten Kosten übersteigt. Beides ist
frühestens in Jahr 2 zu erwarten, und beides ist ein Wechsel ohne Domänenänderung.
