# Entstehungsgeschichte der Engine

Diese Dateien dokumentieren, wie die Engine von Fassung 1.0 zu 1.3 kam. Sie sind
**nicht** Teil der Auslieferung und werden von `run_demo.sh` nicht mehr ausgeführt.

> **Maßgeblich ist ausschließlich [`../../schema/crm_engine.sql`](../../schema/crm_engine.sql).**
> Änderungen gehören dorthin. Diese Dateien bleiben als Nachweis erhalten, welcher
> Fehler wann durch welche Prüfung aufgefallen ist und wie er behoben wurde.

| Datei | Fassung | Inhalt |
|---|---|---|
| `02_engine.sql` | 1.0 | Erste Fassung: Intent Score, Lead Score, Customer Value, Risk, Aufgabenhelfer |
| `03_regelwerk.sql` | 1.0 | Mustererkennung M1–M8, Next Best Offer, Regeln A-01…A-37, Priorisierung |
| `05_kalibrierung_v11.sql` | 1.1 | **K1–K4** — Erreichbarkeitsnormierung des Lead Scores, Kundenwert auf Bootsprämien, Risiko-Eskalatoren, Wertsummierung |
| `06_kalibrierung_v12.sql` | 1.2 | **K5–K6** — Erreichbarkeitsnormierung des Kundenwerts, Gewerbe- und Flottenzweig |
| `08_lastschutz.sql` | 1.2 | **K7–K9** — Bündelung, Staffelung, Staffelpunkte der Hauptfälligkeit, Kapazitätswarnung |
| `09_fixes_v13.sql` | 1.3 | **D1–D4** — Duplikatsschutz ohne Bezugsobjekt, Wertkumulierung über Läufe, Stille als Eskalator, sich vermehrende Cross-Sell-Chancen |
| `10_optimierung.sql` | 1.3 | **O1–O2** — Duplikatsschutz indexfähig gemacht (3,9 ms → 0,019 ms), fehlende Indizes |

Jede dieser Korrekturen wurde durch eine Prüfung ausgelöst, die zuvor
fehlgeschlagen ist. Die zugehörigen Zusicherungen stehen in `../04_pruefungen.sql`.
