# 7. Aufgabenmodell

## 7.1 Die drei Grundsätze

```
1. Kein Lead darf vergessen werden.
2. Kein Kunde darf verloren gehen.
3. Kein Angebot darf ungeprüft bleiben.
```

Daraus folgt die operative Grundregel des gesamten Moduls:

> **Wenn keine Automatisierung möglich ist → Aufgabe.**
> **Wenn die Opportunity hoch ist → Aufgabe + E-Mail + Benachrichtigung.**

Eine Aufgabe ist damit nicht Verwaltung, sondern das **Ausgabeformat aller
Intelligenz des Systems**. Alles, was das CRM erkennt, endet entweder in einer
Automatisierung oder in genau einer Aufgabe bei genau einem Menschen.

## 7.2 Aufgabendatenmodell

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `titel` | Text | ✅ | Handlungsorientiert formuliert („Hauptfälligkeitsgespräch führen") |
| `beschreibung` | Text | – | Kontext + Gesprächsleitfaden |
| `typ` | Enum | ✅ | siehe 7.3 |
| `prioritaet` | Enum | ✅ | `kritisch`, `hoch`, `normal`, `niedrig` |
| `prioritaets_score` | int 0–100 | ✅ | berechnet, siehe 7.5 |
| `faellig_am` | timestamptz | ✅ | |
| `sla_frist` | timestamptz | – | Härtere Frist als Fälligkeit (z. B. A-Lead 4 h) |
| `zugewiesen_an` | uuid | ✅ | Immer eine Person, nie ein Team ohne Auflösung |
| `zugewiesen_team_id` | uuid | – | Sekundär, für Umverteilung |
| `bezug_typ` / `bezug_id` | Enum / uuid | ✅ | `lead`, `kunde`, `opportunity`, `angebot`, `empfehlung`, `partner`, `vertrag_ref` |
| `status` | Enum | ✅ | `offen`, `in_arbeit`, `wartet`, `erledigt`, `verworfen`, `delegiert` |
| `quelle` | Enum | ✅ | `automatisch`, `manuell`, `folgeaktion`, `eskalation`, `wiedervorlage` |
| `regel_code` | Text | – | z. B. `A-24` — Rückverfolgbarkeit der Automatisierung |
| `ergebnis` | Enum | ✅ bei Abschluss | siehe 7.6 |
| `ergebnis_notiz` | Text | – | Pflicht bei `verworfen` |
| `erledigt_am`, `erledigt_von` | – | – | |
| `eskalationsstufe` | int | ✅ | 0 = normal, 1 = Teamleitung, 2 = Vertriebsleitung |
| `verschoben_anzahl` | int | ✅ | ab 3 Verschiebungen → Eskalation (A-18) |
| `erwarteter_wert_eur` | numeric | – | Umsatzpotenzial der Aufgabe — treibt Priorität |
| `checkliste` | jsonb | – | Teilschritte mit Abhaken |
| `vorlage_id` | uuid | – | E-Mail-/Gesprächsvorlage |

## 7.3 Aufgabentypen

| Typ | Typischer Auslöser | Standard-SLA |
|---|---|---|
| `erstkontakt` | Neuer Lead | A: 4 h · B: 24 h · C: 72 h |
| `anruf` | Folgeaktion, Nachfassen | 2 Werktage |
| `email` | Folgeaktion | 1 Werktag |
| `termin_vereinbaren` | Qualifizierter Lead | 3 Werktage |
| `termin_vorbereiten` | Termin in < 48 h | vor Termin |
| `angebot_erstellen` | Opportunity Stufe 2 abgeschlossen | 2 Werktage |
| `angebot_nachfassen` | Angebotsstaffel T+3/T+7/T+14 | am Tag der Fälligkeit |
| `unterlagen_anfordern` | Fehlende Dokumente | 1 Werktag |
| `hauptfaelligkeit` | T-90 vor Vertragsablauf | 10 Werktage |
| `jahresgespraech` | Jahrestag Kundenbeziehung | 20 Werktage |
| `wertpruefung` | Bootswert > 24 Monate ungeprüft | 20 Werktage |
| `rueckhol_kontakt` | Risk Score ≥ 65 | 5 Werktage |
| `beziehungspflege` | Risk Score 35–64 | 15 Werktage |
| `empfehlungsanfrage` | Empfehlungsregeln erfüllt | 15 Werktage |
| `empfehlung_bearbeiten` | Neue Empfehlung eingegangen | 24 h |
| `geburtstag` | Geburtstag Kontakt (CVS ≥ 60) | am Tag |
| `partner_pflege` | Partnerkontakt überfällig | 10 Werktage |
| `datenpflege` | Pflichtfeld fehlt, Dublette | 10 Werktage |
| `eskalation` | SLA-Verstoß | 1 Werktag |
| `exit_gespraech` | Kündigung eingegangen | 5 Werktage |
| `win_back` | Ehemaliger Kunde, Rückholfenster | 10 Werktage |

## 7.4 Aufgabenerzeugung — Entscheidungsbaum

```
Ereignis erkannt
   │
   ├─ Kann das System es vollständig und risikofrei selbst erledigen?
   │     JA ──▶ Automatisierung ausführen
   │            └─ Ergebnis protokollieren (crm_automation_lauf)
   │            └─ Bei Fehlschlag ──▶ Aufgabe „Automatisierung fehlgeschlagen"
   │
   └─ NEIN ──▶ Aufgabe erzeugen
         │
         ├─ Erwarteter Wert ≥ 2.000 € ODER Lead-Kategorie A ODER (Risk ≥ 65 UND CVS ≥ 70)?
         │     JA ──▶ Aufgabe + E-Mail an Verantwortlichen + Push-Benachrichtigung
         │            + Position 1–3 in der Tagesliste
         │            + bei Nichtbearbeitung binnen SLA ──▶ Eskalation Stufe 1
         │
         └─ NEIN ──▶ Aufgabe in normaler Priorisierung
```

**Duplikatsschutz:** Vor jeder automatischen Aufgabenerzeugung prüft das System, ob
für dieselbe Kombination aus `bezug_id`, `typ` und `regel_code` bereits eine offene
Aufgabe existiert. Wenn ja, wird die bestehende Aufgabe aktualisiert
(Fälligkeit, Priorität, Kontext) statt eine zweite zu erzeugen.
**Ein Vertriebsmitarbeiter darf nie zwei Aufgaben für dieselbe Sache sehen.**

## 7.5 Priorisierung (Prioritäts-Score)

Die Tagesliste wird nicht nach Fälligkeit sortiert, sondern nach Wirkung:

```
prio_score =  0,30 · norm(erwarteter_wert_eur)
            + 0,25 · dringlichkeit
            + 0,20 · norm(customer_value_score)
            + 0,15 · abschlusswahrscheinlichkeit
            + 0,10 · norm(risk_score)
```

| Komponente | Berechnung |
|---|---|
| `dringlichkeit` | 100 bei überfällig · 80 heute fällig · 60 morgen · 40 diese Woche · 20 später |
| `norm(x)` | Perzentilnormierung über den aktuellen Bestand des Benutzers |

**Harte Überschreibungen (immer ganz oben, in dieser Reihenfolge):**
1. SLA-Verstoß bei A-Lead
2. Risk Score ≥ 65 **und** CVS ≥ 70
3. Angebot läuft in ≤ 3 Tagen ab, Wert ≥ 5.000 €
4. Eskalation Stufe 2
5. Vom Vorgesetzten manuell markierte Aufgabe

## 7.6 Abschluss von Aufgaben

| Ergebnis | Bedeutung | Folgewirkung |
|---|---|---|
| `erledigt_erfolgreich` | Ziel erreicht | Aktivität erzeugen (Pflicht), Folgeaktion abfragen |
| `erledigt_ohne_erfolg` | Durchgeführt, kein Ergebnis | Aktivität + Folgeaktion Pflicht |
| `nicht_erreicht` | Kontakt kam nicht zustande | Automatische Neuterminierung (+2 Werktage), Zähler +1 |
| `verschoben` | Neuer Termin | `verschoben_anzahl` +1; ab 3 → Eskalation |
| `delegiert` | An Kollegen übergeben | Neue Aufgabe beim Ziel, Historie bleibt |
| `verworfen` | Nicht sinnvoll | **Begründung Pflicht**; Regel-Feedback für Automatisierungsqualität |
| `automatisch_erledigt` | Ziel anderweitig erreicht | z. B. Kunde hat selbst angerufen |

> **Regel:** Eine Aufgabe mit Bezug zu Lead/Opportunity kann nur mit gleichzeitiger
> Aktivitätserfassung abgeschlossen werden. Ein Klick auf „erledigt" ohne Inhalt
> ist im System nicht vorgesehen — sonst verliert das gesamte Scoring seine Datenbasis.

## 7.7 Wiedervorlagen

Wiedervorlagen sind regelbasiert erzeugte Aufgaben. Sie werden in
`crm_wiedervorlage_regel` gepflegt und sind **ohne Programmierung änderbar**.

| Code | Anlass | Zeitpunkt | Empfänger | Typ |
|---|---|---|---|---|
| `W-01` | Angebot versendet | T+3, T+7, T+14 | Verantwortlicher | `angebot_nachfassen` |
| `W-02` | Angebot läuft ab | T−3 vor `gueltig_bis` | Verantwortlicher | `angebot_nachfassen` |
| `W-03` | Hauptfälligkeit Vertrag | T−90, T−60, T−30 | Betreuer | `hauptfaelligkeit` |
| `W-04` | Jahresgespräch | Jahrestag Vertragsbeginn − 30 Tage | Betreuer | `jahresgespraech` |
| `W-05` | Geburtstag Kontakt | T−3 (CVS ≥ 60) | Betreuer | `geburtstag` |
| `W-06` | Bootswert nicht geprüft | 24 Monate nach letzter Prüfung | Betreuer | `wertpruefung` |
| `W-07` | Empfehlungsanfrage | 9 Monate nach letzter Anfrage, Bedingungen erfüllt | Betreuer | `empfehlungsanfrage` |
| `W-08` | Kein Kontakt Bestandskunde | 180 Tage ohne Aktivität | Betreuer | `beziehungspflege` |
| `W-09` | Lead im Nurturing | 90 Tage | Verantwortlicher | `anruf` |
| `W-10` | Verlorene Opportunity (Grund `preis`/`wettbewerb`) | 10 Monate vor Hauptfälligkeit Wettbewerber | Verantwortlicher | `win_back` |
| `W-11` | Ehemaliger Kunde | 3, 9, 12 Monate nach Abgang | Betreuer | `win_back` |
| `W-12` | Schaden abgeschlossen | T+14 nach Regulierung | Betreuer | `beziehungspflege` |
| `W-13` | Partnerkontakt | 90 Tage ohne Kontakt (Partner Value ≥ 40) | Partnerbetreuer | `partner_pflege` |
| `W-14` | Saisonstart | 1. März jährlich, Kunden mit Fahrgebiet Binnen/Küste | Betreuer | `beziehungspflege` |
| `W-15` | Winterlager | 1. September jährlich | Betreuer | `beziehungspflege` |
| `W-16` | Neukunde Onboarding | T+5, T+30, T+90 nach Abschluss | Betreuer | `anruf` |

**Regelparameter je Wiedervorlage:** Zeitpunkt (relativ/absolut), Bedingung
(SQL-Prädikat oder Regelausdruck), Empfängerlogik, Priorität, Vorlage,
Aktiv-Kennzeichen, Mandant, Gültigkeitszeitraum.

## 7.8 Lastschutz (damit das System benutzbar bleibt)

Ein System, das 60 Aufgaben pro Tag erzeugt, wird ignoriert. Deshalb:

| Schutzmechanismus | Regel |
|---|---|
| **Bündelung** (Schritt 1) | Ab 6 gleichartigen Aufgaben je Benutzer, Regel und Typ mit Priorität `normal`/`niedrig` entsteht **eine** Sammelaufgabe mit Checkliste. Die Einzelaufgaben bleiben offen und verknüpft — das Versprechen V1 gilt weiter —, verlassen aber die Tagesliste. |
| **Staffelung** (Schritt 2) | Was danach über 25 heute fälligen Aufgaben liegt, wird nach `prio_score` auf Folgetage verteilt. |
| **Unantastbar** | Aufgaben mit Priorität `kritisch` und Aufgaben mit SLA-Frist werden **weder gebündelt noch verschoben**. Sonst versteckte der Lastschutz genau die Fälle, für die das System gebaut ist. |
| **Kapazitätswarnung** | Bleibt die Zahl danach über dem Limit, ist das kein Systemfehler, sondern ein Kapazitätsproblem. Regel **A-49** erzeugt eine Eskalation an die Teamleitung mit Anzahl, SLA-Anteil und gefährdetem Potenzial — statt eines stillen Rückstaus. |
| **Ruhezeiten** | Keine Benachrichtigungen 20:00–07:00 und an Wochenenden (außer Eskalation Stufe 2). |
| **Urlaubsvertretung** | Bei Abwesenheit automatische Umleitung an Vertretung; kritische Aufgaben zusätzlich an Teamleitung. |
| **Regelqualität** | Regel mit `verworfen`-Quote > 30 % über 30 Tage → automatische Meldung an den CRM-Verantwortlichen zur Nachschärfung (A-42). |
| **Kapazitätsausgleich** | Neue Leads werden bevorzugt Benutzern mit < 15 offenen Aufgaben zugewiesen. |
