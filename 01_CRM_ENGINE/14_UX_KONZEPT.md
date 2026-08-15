# 14. UX-Konzept

## 14.1 Gestaltungsprinzipien

| # | Prinzip | Konsequenz |
|---|---|---|
| 1 | **Handlung vor Information** | Jeder Bildschirm beginnt mit dem, was zu tun ist — nicht mit dem, was gespeichert wurde. |
| 2 | **Ein Klick zur Tat** | Anrufen, Mailen, Termin, Erledigen sind auf jedem Bildschirm direkt erreichbar. |
| 3 | **Begründung ist Pflicht** | Jede Systemempfehlung zeigt ihren Grund im Klartext. Blackbox erzeugt Misstrauen. |
| 4 | **Erfassen ohne Tippen** | Sprachnotiz, Vorlagen, Vorschläge, automatische Erfassung. |
| 5 | **Mobil vollwertig** | Kein „Light"-Modus. Was am Schreibtisch geht, geht am Steg. |
| 6 | **Drei Klicks zum Ziel** | Von der Startseite zu jedem Datensatz. |
| 7 | **Nie eine leere Seite** | Jede Liste ohne Treffer schlägt die nächste sinnvolle Handlung vor. |
| 8 | **Geschwindigkeit ist Design** | Interaktionsantwort < 100 ms, Seitenwechsel < 300 ms. |

---

## 14.2 Startseite — „Mein Tag"

Die wichtigste Ansicht des Systems. Sie ersetzt die klassische CRM-Startseite
(Zahlenkacheln, die niemand liest) durch eine **Arbeitsliste**.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Guten Morgen, Marc          Freitag, 15. August 2026        [Suche…]  [+ Neu] │
├───────────────────────────────────────────────────────────────────────────────┤
│  9 Aufgaben heute  ·  2 überfällig  ·  Potenzial in dieser Liste: 47.300 €    │
├───────────────────────────────────────────────────────────────────────────────┤
│ ① ⚠ Rückholgespräch — Nordwind Charter GmbH            14.280 €/Jahr  📞 ✉ ⋯ │
│    Risiko 71 (hoch) · Kundenwert 86 · 312 Tage kein Kontakt                   │
│    Aufhänger: Hauptfälligkeit 01.10. · Prämie +18 % · neues Boot ungedeckt    │
├───────────────────────────────────────────────────────────────────────────────┤
│ ② 🔥 Erstkontakt A-Lead — Jan Kramer                    ~2.400 €/Jahr  📞 ✉ ⋯ │
│    Score 87 · Werftempfehlung · Bavaria 46, 380.000 € · Frist: heute 14:00    │
├───────────────────────────────────────────────────────────────────────────────┤
│ ③ 📄 Angebot nachfassen — Seebär GmbH (T+3)             3.100 €/Jahr  📞 ✉ ⋯ │
│    2× geöffnet vorgestern · Entscheidung steht an                            │
├───────────────────────────────────────────────────────────────────────────────┤
│ ④ 🎂 3 Geburtstage diese Woche                          [Sammelaufgabe]  ⋯   │
├───────────────────────────────────────────────────────────────────────────────┤
│ … 5 weitere Aufgaben                              [Alle anzeigen]            │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Interaktionsregeln:**
- Zeile antippen → Detailkontext seitlich (Desktop) bzw. Vollbild (Mobil), ohne Navigationsverlust.
- 📞 startet Anruf **und** öffnet den Aktivitätsdialog vorbefüllt.
- Nach Abschluss erscheint sofort der Folgeaktionsdialog — Standardwert vorgeschlagen, ein Klick genügt.
- Wischen nach rechts = erledigt, nach links = verschieben (mit Datumsvorschlägen: morgen, Montag, in 1 Woche).
- Zahl im Kopf („Potenzial in dieser Liste") macht die Liste wirtschaftlich lesbar — nicht als Bürde, sondern als Chance.

---

## 14.3 Leadübersicht

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Leads   [Alle ▾] [Meine ▾] [A-Leads] [Ohne Aufgabe ⚠] [SLA-kritisch 🔥]      │
│ Suche…                                        Sortierung: Score ▾   [+ Lead] │
├──────┬──────────────────┬────────┬───────────┬──────────┬────────┬───────────┤
│ Kat  │ Name             │ Score  │ Bedarf    │ Wert     │ Quelle │ Nächster  │
├──────┼──────────────────┼────────┼───────────┼──────────┼────────┼───────────┤
│  A   │ Jan Kramer       │ 87 ▲12 │ Wechsel   │ 380.000 €│ Werft  │ heute 14h │
│  A   │ S. Ohlsen        │ 82 ▬   │ Neuvers.  │ 210.000 €│ Empf.  │ morgen    │
│  B   │ Nordsee Charter  │ 74 ▲ 5 │ Flotte    │ 890.000 €│ Messe  │ ⚠ fehlt   │
│  C   │ M. Peters        │ 51 ▼ 8 │ Skipper   │  35.000 €│ Meta   │ 22.08.    │
└──────┴──────────────────┴────────┴───────────┴──────────┴────────┴───────────┘
```

- **Scoretrend** (▲▬▼) ist wichtiger als der absolute Wert — er zeigt Bewegung.
- Filter **„Ohne Aufgabe"** ist der Vergessenswächter im Alltag und immer sichtbar.
- Mouseover/Tap auf den Score zeigt die drei stärksten Treiber.
- Massenaktionen: zuweisen, in Kampagne aufnehmen, Aufgabe erzeugen, exportieren.
- Ansicht umschaltbar: Tabelle · Kanban nach Status · Karte nach Revier/Liegeplatz.

---

## 14.4 Kundenakte

Dreispaltig auf dem Desktop, gestapelt auf dem Telefon.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚓ Nordwind Charter GmbH      [VIP] [Empfehlungsgeber]      📞 ✉ 📅 [+ Aufg.]│
│ CVS 86 ●●●●●○  ·  Risiko 71 ▲ HOCH  ·  Jahresprämie 14.280 €  ·  seit 2019  │
├──────────────┬───────────────────────────────────┬──────────────────────────┤
│ NAVIGATION   │ INHALT                            │ INTELLIGENZ              │
│              │                                   │                          │
│ Übersicht    │  Timeline (Standard)              │ ⚡ Hauptfälligkeit 01.10. │
│ Boote (5)    │  ──────────────────────           │    Gespräch fällig       │
│ Kontakte (3) │  12.08 📞 Anruf · nicht erreicht  │ 💰 Skipper-Haftpflicht    │
│ Verträge (8) │  04.08 ✉ Angebot versendet        │    fehlt · ~340 €/Jahr   │
│ Schäden (2)  │  28.07 🔧 Schaden reguliert (4/5) │    Trefferquote 41 %     │
│ Aktivitäten  │  15.07 ⭐ Score: VIP erreicht      │ ⚠ „Seeadler" seit 2021   │
│ Chancen (2)  │  02.07 🤝 Empfehlung → Abschluss  │    nicht bewertet        │
│ Empfehl. (4) │                                   │ 🤝 Empfehlungspotenzial  │
│ Dokumente    │  [Aktivität erfassen]  🎙         │    hoch · letzte Anfrage │
│ Aufgaben (3) │                                   │    vor 14 Monaten        │
│ Partner (2)  │                                   │ [Alle Vorschläge]        │
└──────────────┴───────────────────────────────────┴──────────────────────────┘
```

- Die rechte Spalte ist **das Produkt**. Sie unterscheidet dieses CRM von einer Datenbank.
- Jeder Vorschlag hat eine Aktionsschaltfläche: „Opportunity anlegen", „Aufgabe erzeugen", „Verwerfen (Grund)".
- Verwerfen mit Grund ist Trainingsdaten-Erfassung — nicht Wegklicken.
- Score-Badges öffnen die vollständige Erklärung mit Blockaufschlüsselung.
- Mobil: Kopfzeile bleibt fixiert, Intelligenz-Spalte wird zum ersten Reiter.

---

## 14.5 Opportunity-Cockpit

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pipeline   Q3/2026   Gewichtet 198.400 €   Ziel 180.000 € ✓   Coverage 3,4× │
├──────────┬──────────────┬────────────┬──────────────┬───────────┬───────────┤
│ Neu (42) │ In Bearb.(28)│ Angebot(17)│Verhandlung(9)│ Gewonnen  │ Verloren  │
│ 412.000 €│  296.000 €   │ 198.000 €  │  121.000 €   │  86.400 € │  54.000 € │
├──────────┼──────────────┼────────────┼──────────────┼───────────┼───────────┤
│ ▣ Kramer │ ▣ Seebär     │ ▣ Nordwind │ ▣ Marina Kiel│           │           │
│  2.400 € │  3.100 €     │  14.280 €  │   9.800 €    │           │           │
│  10 %    │  25 %        │  50 % 👁2  │   75 %       │           │           │
│  ⚠ 4 Tg  │  ✓ heute     │  ⏱ T+3     │   ✓ Mi 10:00 │           │           │
└──────────┴──────────────┴────────────┴──────────────┴───────────┴───────────┘
```

- Kanban mit Ziehen und Ablegen; Stufenwechsel öffnet den Pflichtdialog (Grund, nächster Schritt).
- Karten zeigen Alarme: ⚠ Stillstand · ⏱ Nachfassen fällig · 👁 Angebot geöffnet (Anzahl) · ✓ Termin steht.
- Karte **ohne** offene Aufgabe erhält einen roten Rand — sichtbarer Systemfehler.
- Kopfzeile zeigt jederzeit Zielerreichung und Coverage.
- Umschaltbar auf Listen- und Prognoseansicht (Monatsverlauf mit Commit/Best Case).

---

## 14.6 Vertriebsdashboard

Sieben Kacheln (siehe Kapitel 11.2), jede mit: Zahl · Trend gegen Vorperiode ·
Zielwert · Klickziel. Farblogik ausschließlich handlungsbezogen:
**rot = Handlung fehlt**, gelb = Aufmerksamkeit, grün = im Plan.
Zeitraumumschaltung: Heute · Woche · Monat · Quartal.
Sichtumschaltung nach Berechtigung: Ich · Team · Gesamt.

---

## 14.7 Mobile

| Aspekt | Festlegung |
|---|---|
| Ansatz | Progressive Web App, installierbar, Offline-Cache für Tagesliste und Kundenakten |
| Startbildschirm | „Mein Tag" — identische Priorisierung wie Desktop |
| Erfassung | Sprachnotiz als primärer Weg; Transkription → Entwurf → Freigabe |
| Anruf | Direktwahl aus der Aufgabe; nach Auflegen automatischer Aktivitätsdialog |
| Standort | Erkennt Marina/Werft in der Nähe → schlägt Kunden und Partner in Reichweite vor (Messe-/Stegbetrieb) |
| Offline | Aufgaben abschließen und Aktivitäten erfassen ohne Netz; Synchronisation mit Konfliktprüfung |
| Benachrichtigungen | Nur bei Priorität `kritisch` und SLA-Gefahr; Ruhezeiten 20:00–07:00 |
| Bedienung | Einhandbetrieb, Aktionen im unteren Bildschirmdrittel, Wischgesten |

---

## 14.8 Wiederkehrende Bausteine

| Baustein | Verhalten |
|---|---|
| **Score-Badge** | Farbe nach Kategorie, Trendpfeil, Klick öffnet Erklärung mit Top-Faktoren |
| **Aktivitätsdialog** | Typ, Ergebnis, Notiz, **Folgeaktion (Pflicht)** — Standardwerte vorbelegt, in ≤ 15 Sekunden abschließbar |
| **Aufgabenkarte** | Titel, Grund, Wert, Frist, Direktaktionen, Wischgesten |
| **Empfehlungsfeld** | Vorschlagstext, erwarteter Wert, Trefferquote, Annehmen/Verwerfen (mit Grund) |
| **Globale Suche** | Ein Feld für Kontakt, Kunde, Boot, Police, Angebot, Marina; Trigram-tolerant gegen Tippfehler |
| **Schnellerfassung (+ Neu)** | Lead in ≤ 30 Sekunden: Name, Kanal, Bedarf, Quelle — Rest ergänzt das System |
| **Leerzustand** | Immer mit Vorschlag: „Keine Aufgaben — 4 Kunden ohne Kontakt seit 180 Tagen ansehen?" |

## 14.9 Barrierefreiheit und Robustheit

| Anforderung | Festlegung |
|---|---|
| Standard | WCAG 2.2 Stufe AA |
| Kontrast | ≥ 4,5:1 für Text, ≥ 3:1 für Bedienelemente |
| Farbe nie allein | Status immer zusätzlich durch Symbol und Text (Rot-Grün-Schwäche) |
| Tastatur | Vollständige Bedienbarkeit; `n` neue Aufgabe, `l` neuer Lead, `/` Suche, `e` erledigen, `Esc` schließen |
| Bildschirmleser | Semantisches HTML, ARIA-Live-Regionen für Score- und Statusänderungen |
| Schriftgröße | Skalierung bis 200 % ohne Layoutbruch |
| Sprache | Deutsch als Standard, Englisch vollständig ab Phase 4; Fachbegriffe konsistent zum Glossar |
| Fehlertoleranz | Jede zerstörende Aktion ist 10 Sekunden lang widerrufbar; Entwürfe werden lokal gesichert |
