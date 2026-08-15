# 1. Zielbild CRM

## 1.1 Leitsatz

> **Das CRM ist kein Datenspeicher. Das CRM ist ein Entscheidungssystem.**
>
> Es beantwortet jeden Morgen für jeden Vertriebsmitarbeiter genau eine Frage:
> *"Was muss ich heute tun, damit Umsatz entsteht und kein Kunde verloren geht?"*

Ein CRM-Datensatz, der keine Regel speist, keinen Score verändert und keine
Aufgabe erzeugen kann, wird nicht erhoben. Das ist die härteste Regel dieses Moduls.

## 1.2 Abgrenzung: Was dieses CRM *nicht* ist

| Nicht | Sondern |
|---|---|
| Adressverwaltung | Beziehungs- und Chancen-Engine |
| Dokumentationspflicht nach dem Gespräch | Vorschlag *vor* dem Gespräch |
| Bericht am Monatsende | Handlung am Morgen |
| Pipeline-Tabelle | Priorisierte Tagesliste |
| Speicher für Vertragsdaten | Konsument von Vertragsdaten |
| Marketing-Tool | Empfänger und Auslöser von Marketing-Signalen |

## 1.3 Die Wirkkette (Kernarchitektur)

Das CRM besteht aus sechs Schichten. Jede Schicht hat genau eine Aufgabe.
Daten fließen nach rechts, Ergebnisse fließen als Lernsignal zurück.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1 SIGNAL     │──▶│ 2 IDENTITÄT  │──▶│ 3 SCORING    │──▶│ 4 ENTSCHEID. │──▶│ 5 AKTION     │──▶│ 6 ERGEBNIS   │
│              │   │              │   │              │   │              │   │              │   │              │
│ Website      │   │ Kontakt      │   │ Lead Score   │   │ Regelwerk    │   │ Aufgabe      │   │ Gewonnen /   │
│ Newsletter   │   │ Kunde        │   │ Value Score  │   │ + KI-Modell  │   │ E-Mail       │   │ Verloren     │
│ Brevo        │   │ Boot         │   │ Risk Score   │   │              │   │ Kampagne     │   │ Umsatz       │
│ Partner      │   │ Vertrag      │   │ Fit Score    │   │ Priorisierung│   │ Termin       │   │ Reaktion     │
│ Academy      │   │ Opportunity  │   │ Engagement   │   │ Next Best    │   │ Opportunity  │   │ Dauer        │
│ Marketplace  │   │              │   │              │   │ Action       │   │ Eskalation   │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────┬───────┘
        ▲                                      ▲                  ▲                                    │
        │                                      └──────────────────┴────────────────────────────────────┘
        │                                            LERNSCHLEIFE (Outcome Feedback)
        └───────────────────────────────────────────────────────────────────────────────────────────────
                                         Aktion erzeugt neues Signal
```

### Schicht 1 — Signal Layer
Nimmt alles auf, was ein Mensch tut: Seitenaufruf, PDF-Download, Newsletter-Öffnung,
Klick, Eventanmeldung, Marketplace-Anfrage, Academy-Kursstart, Partnerempfehlung,
E-Mail-Antwort, Terminzusage. Jedes Signal ist typisiert, gewichtet und verfällt über Zeit.

### Schicht 2 — Identity Layer
Löst Signale auf Personen auf (Cookie → E-Mail → Kontakt → Kunde) und verbindet sie
mit Objekten (Boot, Vertrag, Schaden) aus den Fachmodulen. Ohne Auflösung kein Score.

### Schicht 3 — Scoring Layer
Vier Scores, jeweils 0–100, jeweils erklärbar:
- **Lead Score** — Kaufwahrscheinlichkeit + Attraktivität
- **Customer Value Score** — wirtschaftlicher und strategischer Wert
- **Risk Score** — Kündigungs-/Abwanderungsrisiko
- **Engagement Score** — Interaktionsdichte der letzten 90 Tage

### Schicht 4 — Decision Layer
Hybrid aus **deterministischem Regelwerk** (transparent, sofort produktiv) und
**KI-Uplift** (Konversionswahrscheinlichkeit, Churn, Next-Best-Offer).
Erzeugt eine sortierte Handlungsempfehlung je Benutzer und Tag.

### Schicht 5 — Action Layer
Setzt Entscheidungen um: Aufgabe, E-Mail, Kampagnenaufnahme, Terminvorschlag,
Opportunity-Erzeugung, Eskalation an die Vertriebsleitung.

### Schicht 6 — Outcome Layer
Erfasst das Ergebnis jeder Aktion und speist es zurück in Scoring und Modelltraining.
**Ohne Ergebnisrückfluss wird keine Automatisierung freigeschaltet.**

## 1.4 Die vier Versprechen des Systems

| # | Versprechen | Technische Umsetzung |
|---|---|---|
| V1 | **Kein Lead bleibt liegen.** | Jeder Lead hat eine offene Aufgabe oder einen Abschlussgrund. Nachtjob prüft Lücken (A-01). |
| V2 | **Kein Angebot bleibt ungeprüft.** | Angebot ohne Reaktion → automatische Nachfassstaffel (A-11/12/13). |
| V3 | **Kein Kunde geht still verloren.** | Risk Score ≥ 65 erzeugt Rückholaufgabe mit Deadline (A-24). |
| V4 | **Kein Umsatzpotenzial bleibt unsichtbar.** | Jedes Boot, jeder Vertrag, jedes Signal wird auf Cross-/Upsell geprüft (A-30 ff.). |

## 1.5 Branchenspezifisches Zielbild (Boot & Yacht)

Das CRM ist kein generisches Vertriebs-CRM. Es kennt die Domäne:

| Domänenobjekt | Vertriebliche Bedeutung im CRM |
|---|---|
| **Boot** | Wertträger. Bestimmt Prämienpotenzial, Segment, Fahrgebiet, Zielprodukt. |
| **Bootswechsel** | Stärkstes Kaufsignal der Branche. Löst sofort Opportunity aus. |
| **Hauptfälligkeit / Vertragsablauf** | Planbarer Vertriebsanlass mit festem Zeitfenster (T-90/60/30). |
| **Saison** | Vertriebsrhythmus: Slippen/Kranen, Winterlager, Saisonstart. |
| **Fahrgebiet** | Deckungsbedarf und Prämienhöhe (Binnen → Küste → Mittelmeer → weltweit). |
| **Schaden** | Doppelsignal: Bindungschance bei guter Regulierung, Kündigungsrisiko bei schlechter. |
| **Werft / Händler / Marina / Yachtclub** | Empfehlungsnetzwerk mit Multiplikatorwirkung. |
| **Regatta / Messe** | Verdichtete Kontaktereignisse mit klarem Nachfassfenster. |
| **Unternehmerstatus** | Gewerbliche Nutzung (Charter, Flotte) → deutlich höheres Prämien- und Cross-Sell-Potenzial. |

## 1.6 Zielbild in Zahlen (Nordstern-Metriken)

| Nordstern | Definition | Zielwert nach 12 Monaten |
|---|---|---|
| **Handlungsquote** | Anteil der systemvorgeschlagenen Aktionen, die am selben Tag erledigt werden | ≥ 80 % |
| **Lead-Reaktionszeit** | Median von Leadeingang bis erstem echten Kontakt | ≤ 4 Arbeitsstunden |
| **Lead→Abschluss-Quote** | Gewonnene Opportunities / qualifizierte Leads | ≥ 22 % |
| **Vergessensquote** | Leads ohne Aktivität > 14 Tage und ohne Abschlussgrund | 0 % |
| **Empfehlungsanteil am Neugeschäft** | Neugeschäft aus Empfehlung / Neugeschäft gesamt | ≥ 30 % |
| **Bestandsverlustquote** | Aktive Kündigungen / Bestand | ≤ 6 % p. a. |

## 1.7 Nicht-Ziele (bewusst ausgeschlossen)

1. Das CRM führt **keine Vertragsverwaltung** (Policierung, Prämienrechnung, Mahnwesen).
2. Das CRM führt **keine Schadenbearbeitung**.
3. Das CRM ist **kein E-Mail-Versandsystem** — es steuert Brevo, es ersetzt Brevo nicht.
4. Das CRM ist **kein Dokumentenarchiv** — es referenziert das Dokumentenmodul.
5. Das CRM trifft **keine Preisentscheidungen** — es liefert Potenzial, nicht Tarif.
