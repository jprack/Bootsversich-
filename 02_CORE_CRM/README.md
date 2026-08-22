# 02_CORE_CRM

**Callidus Boat Intelligence Platform — Kern-CRM**

| Feld | Wert |
|---|---|
| Modul | `02_CORE_CRM` |
| Fassung | 1.1 |
| Datum | 2026-08-22 |
| Status | Fachkonzept zur Freigabe |
| Grundlage | [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md) Fassung 1.3 |
| Plattformbasis | WordPress als Werkbank, PostgreSQL als Aktenschrank |
| Märkte | AT und DE ab Welle 1 |

---

## Management Summary

Das Kern-CRM ist das **Gedächtnis der Plattform**. Alles, was später kommt —
Leadgenerierung, Newsletter, Dealer Hub, Kundenportal, KI-Assistent, Analytics —
liest aus ihm oder schreibt in ihn. Ist es falsch geschnitten, erbt jedes
Folgemodul den Fehler.

### Die fünf Entscheidungen, die alles Weitere bestimmen

**1. Vier Begriffe, vier Tabellen — nicht ein „Kunde" für alles.**
`KONTAKT` ist eine natürliche Person. `ORGANISATION` ist eine juristische
Person. `KUNDE` ist die wirtschaftliche Einheit, die einen Vertrag hält.
`LEAD` ist eine Absicht, die noch keine von beiden sein muss. Ein Ehepaar mit
gemeinsamer Yacht ist **ein** Kunde mit **zwei** Kontakten. Ein Händler, der
selbst eine Police hat, ist **eine** Organisation, **ein** Kunde und über seinen
Geschäftsführer **ein** Kontakt. Wer das in einer Tabelle abbildet, kann keine
dieser drei Beziehungen sauber führen.

**2. Händler, Bootsclub, Partner, Hersteller und Versicherer sind Rollen einer
Organisation — keine fünf Tabellen.**
Struktur identisch, Verhalten verschieden. Und sie überschneiden sich: Ein
Händler, der auch vermittelt, ist Händler *und* Makler. Fünf Tabellen bedeuten
fünf Adressverwaltungen und garantiert auseinanderlaufende Stammdaten. Siehe
[ADR-0004](../01_ARCHITECTURE/adr/0004-organisation-mit-rollen.md), hier
erweitert um Hersteller und Versicherer.

**3. Der Vertrag ist unveränderlich. Jede Änderung erzeugt eine neue Version.**
Prämienanpassung, Bootswechsel, Deckungsänderung, Verlängerung — alles wird zur
`VERTRAGSVERSION`. Bei einem Streit über den Deckungsumfang zum Schadenzeitpunkt
ist das der Unterschied zwischen einer Antwort und einer Vermutung.

**4. Automatisierungen sind Daten, keine Programmierung.**
Derselbe Grundsatz wie beim Tarifwerk. Ein Regelkatalog in der Datenbank,
gepflegt vom Innendienst, nicht vom Entwickler. Sonst wird jede Fristanpassung
zum Entwicklungsauftrag und niemand traut sich mehr, etwas zu ändern.

**5. WordPress ist die Werkbank, nicht der Aktenschrank.**
Der Innendienst arbeitet in `wp-admin`. Die Daten liegen in PostgreSQL hinter
der Core-Bridge-API. Eine kompromittierte WordPress-Instanz gibt keine einzige
Kundenakte preis. Das ist die wirksamste Einzelmaßnahme der gesamten
Sicherheitsarchitektur — und der Grund, weshalb Plugins überhaupt frei
einsetzbar bleiben.

### Was dieses Modul wirtschaftlich leistet

| Hebel | Mechanik | Wirkung |
|---|---|---|
| **Bestandssicherung** | Verlängerungslauf 90 Tage vor Hauptfälligkeit, automatisch, mit Eskalation | Der Bestand ist wertvoller als das Neugeschäft. Eine nicht bemerkte Hauptfälligkeit ist ein verlorener Kunde |
| **Vertriebssteuerung** | Priorisierte Tagesliste statt Postfach | Die Reihenfolge der Arbeit entscheidet über die Abschlussquote, nicht die Menge |
| **Cross-Selling** | Ein erfasstes Boot ohne passenden Vertrag erzeugt eine Prüfaufgabe | Jedes Boot in der Datenbank ist ein Vertrag, den es noch nicht gibt |
| **Partnernetz** | Empfehlungen mit nachvollziehbarem Status und Abrechnung | Leads, die kein Werbebudget kosten |
| **Nachweisfähigkeit** | Einwilligung, Beratungsdokumentation, Audit ab Tag eins | Kein nachträglicher Umbau unter Zeitdruck |

### Was dieses Modul bewusst **nicht** tut

Schaden · Provisionsabrechnung · Buchhaltung · Prämienberechnung (das ist das
Tarifwerk) · Newsletter-Versand (das ist Brevo) · Vertragsverwaltung beim
Versicherer. Die Begründungen stehen in
[`01_GESAMTKONZEPT.md`](01_GESAMTKONZEPT.md) §6.

---

## Zuordnung zum Auftrag

| Auftrag | Findet sich in |
|---|---|
| 1 · Management Summary | dieses Dokument |
| 2 · CRM Architektur | [`01_GESAMTKONZEPT.md`](01_GESAMTKONZEPT.md) |
| 3 · Datenmodell | [`02_DATENMODELL.md`](02_DATENMODELL.md) |
| 4 · ER Diagram | [`03_ER_MODELL.md`](03_ER_MODELL.md) |
| 5 · Rollenmodell | [`04_ROLLENMODELL.md`](04_ROLLENMODELL.md) |
| 6 · Automationen | [`07_AUFGABEN_UND_AUTOMATIONEN.md`](07_AUFGABEN_UND_AUTOMATIONEN.md) |
| 7 · API Konzept | [`10_API_KONZEPT.md`](10_API_KONZEPT.md) |
| 8 · Reporting | [`09_DASHBOARD_UND_REPORTING.md`](09_DASHBOARD_UND_REPORTING.md) |
| 9 · Roadmap | [`11_SKALIERUNG_ROADMAP.md`](11_SKALIERUNG_ROADMAP.md) |
| 10 · Umsetzung WordPress | [`12_UMSETZUNG_WORDPRESS.md`](12_UMSETZUNG_WORDPRESS.md) |
| — Startkonfiguration (C-02, C-03, C-04) | [`13_STARTKONFIGURATION.md`](13_STARTKONFIGURATION.md) |
| — Kundenakte | [`05_KUNDENAKTE.md`](05_KUNDENAKTE.md) |
| — Vertrags- und Bootsverwaltung | [`06_VERTRAG_UND_BOOT.md`](06_VERTRAG_UND_BOOT.md) |
| — Dokumentenmanagement | [`08_DOKUMENTE.md`](08_DOKUMENTE.md) |
| — Aufgabenmanagement | [`07_AUFGABEN_UND_AUTOMATIONEN.md`](07_AUFGABEN_UND_AUTOMATIONEN.md) |
| — Modulentscheidungen | [`adr/`](adr/) |

**Lesereihenfolge:** Summary → 01 → 02 → 03 → 05 → 06 → 07 → 12.
Für die Geschäftsführung genügen Summary, 01, 09 und 11.

---

## Verhältnis zu den übrigen Modulen

```
        01_ARCHITECTURE          Rahmen: Schichten, Prinzipien, Sicherheit
                 │
                 ▼
        02_CORE_CRM              ◀── dieses Modul
        Kontakt · Organisation · Kunde · Lead
        Boot · Vertrag · Aufgabe · Dokument
                 │
     ┌───────────┼───────────┬──────────────┬──────────────┐
     ▼           ▼           ▼              ▼              ▼
  Lead-       Newsletter   Portale      KI-Assistent    Analytics
  generierung              Kunde/Händler/
                           Club/Partner
```

| Vorhandenes Modul | Verhältnis |
|---|---|
| [`01_ARCHITECTURE`](../01_ARCHITECTURE/README.md) | Setzt den Rahmen. Dieses Modul füllt M0 und M1 fachlich aus und weicht an keiner Stelle davon ab |
| [`01_CRM_ENGINE`](../01_CRM_ENGINE/README.md) | Liefert **Scoring und Regelwerk**: Lead Score, Customer Value Score, Kündigungsrisiko, Regelkatalog A-01…A-49, Priorisierung, Lastschutz. Bereits als PostgreSQL-Prototyp lauffähig. Dieses Modul liefert die **Stammdaten**, auf denen jene Engine rechnet |
| `13_TARIFWERK` / `14_TARIFANALYSE` | Das Tarifwerk rechnet, das CRM liefert die Merkmale. Die Bootsfelder in [`02_DATENMODELL.md`](02_DATENMODELL.md) sind aus den realen Tarifen abgeleitet, nicht erfunden |

> **Bemerkenswert:** Die Analyse der Tarife hat das Datenmodell geschärft.
> Rumpfmaterial, Flaggenland, Höchstgeschwindigkeit, Segelfläche und
> Schadenfreiheitsstufe stehen nicht im Modell, weil sie „auch noch nett wären",
> sondern weil NAUTIMA und der Entwurfstarif 2026 sie zur Prämienermittlung
> brauchen. Ein Feld ohne Verwendung wird nicht erhoben (Prinzip P8).

---

## Offene Punkte dieses Moduls

| ID | Punkt | Blockiert | Zu klären durch |
|---|---|---|---|
| **C-01** | Führt der Innendienst die Beratungsdokumentation im CRM oder außerhalb? Bei Mehrfachagenten ist sie pflichtig und gehört an den Vorgang | Kundenakte, Angebotsauswahl | Rechtsberatung (Fortsetzung von A-10) |
| ~~**C-02**~~ | ~~Kundennummernkreis~~ **Entschieden: fortlaufend ab `000001`, mandantenübergreifend, ohne Bedeutung** — [Kapitel 13](13_STARTKONFIGURATION.md) §2, [ADR-0006](adr/0006-kundennummer-fortlaufend.md) | — | — |
| ~~**C-03**~~ | ~~Bestandsübernahme~~ **Entschieden: keine. Start auf leerer Datenbank** — [Kapitel 13](13_STARTKONFIGURATION.md) §3 | — | — |
| ~~**C-04**~~ | ~~Arbeitsplätze~~ **Entschieden: zwei** — [Kapitel 13](13_STARTKONFIGURATION.md) §4 | — | — |
| **C-05** | Provisionsmodell je Organisationsrolle — Struktur ist vorbereitet, Werte fehlen | Dealer Hub, Reporting | Geschäftsführung |
| **C-06** | Aufbewahrungsfristen je Dokumentklasse in AT und DE | Löschkonzept | Rechts- und Steuerberatung |
| **C-07** | Führt der Versicherer bereits vermittelte Verträge, die im CRM fehlen? | Verlängerungslauf, Provisionsprüfung | Produktverantwortung mit dem Versicherer |

---

## Glossar dieses Moduls

| Begriff | Bedeutung |
|---|---|
| **Kontakt** | Natürliche Person. Zentrale Identität, unabhängig davon, ob Interessent, Kunde oder Ansprechpartner |
| **Organisation** | Juristische Person. Wird durch Rollen zu Händler, Club, Partner, Makler, Hersteller oder Versicherer |
| **Kunde** | Wirtschaftliche Einheit mit mindestens einem Vertrag oder Antrag. Kann Personen und Organisationen bündeln |
| **Lead** | Vertriebliche Absicht. Kann existieren, bevor eine Person zweifelsfrei identifiziert ist |
| **Vorgang** | Prozessualer Kern mit Zustandsmaschine. Gehört Modul M10, wird hier referenziert |
| **Kundenakte** | Zusammenführende **Ansicht**, kein eigener Datensatz |
| **Aufgabe** | Verbindliche, terminierte Handlungsanweisung an eine Person |
| **Aktivität** | Dokumentierte Interaktion mit Zeitstempel, Ergebnis und Folgeaktion |
| **Mandant** | AT oder DE. Trennungsgrenze auf Datenbankebene |
