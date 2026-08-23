# 01 — Gesamtkonzept

| Feld | Wert |
|---|---|
| Modul | `04_DEALER_DATABASE` |
| Fassung | 1.0 |
| Datum | 2026-08-23 |
| Grundlage | [`01_ARCHITECTURE/`](../01_ARCHITECTURE/README.md) 1.3 · [`02_CORE_CRM/`](../02_CORE_CRM/README.md) 1.2 · [`03_LEAD_GENERATION_ENGINE/`](../03_LEAD_GENERATION_ENGINE/README.md) 1.0 |

---

## 1. Das Ziel, präzisiert

Der Auftrag nennt als Ziel die **größte und strukturierteste
Bootshändler-Datenbank im DACH-Raum**. Der zweite Teil ist erreichbar und
wertvoll. Der erste ist es nicht — und zwar aus einem Grund, der bereits
belegt ist.

**Der Markt ist endlich.** Modul 03 hat es zur Leitkennzahl gemacht: Es gibt im
DACH-Raum eine zählbare Menge von Bootshändlern, Größenordnung 10³. Wer sie
vollständig erfasst, hat die größte Datenbank — und jeder Wettbewerber, der
dieselbe Arbeit macht, hat sie in derselben Woche auch. **Größe ist kein
Vorsprung, weil sie kein Engpass ist.**

Der Engpass ist ein anderer:

> Eine Händlerliste veraltet im ersten Jahr um schätzungsweise **ein Fünftel**.
> Betriebe wechseln die Marke, geben eine Vertretung ab, fusionieren, schließen
> einen Standort, ersetzen den Verkaufsleiter. Nichts davon meldet jemand.

**Daraus folgt das eigentliche Ziel:**

> Nicht die größte Händlerdatenbank, sondern die **einzige aktuelle**.
> Gemessen wird das als **Aktualitätsgrad** — der Anteil der Datensätze, deren
> tragende Angaben in den letzten zwölf Monaten bestätigt wurden.

Diese Zahl kann niemand abschreiben. Sie entsteht nur aus gepflegten Beziehungen
und lässt sich nicht kaufen. Sie ist damit der einzige Teil dieser Datenbank,
der ein Vermögenswert ist ([ADR-0005](adr/0005-aktualitaet-statt-menge.md)).

---

## 2. Warum ausgerechnet Händler

Aus [`03_LEAD_GENERATION_ENGINE/02_ZIELGRUPPEN.md`](../03_LEAD_GENERATION_ENGINE/02_ZIELGRUPPEN.md),
unverändert gültig:

> **Der Bootshändler ist der Kanal, nicht der Kunde.** Bootsversicherung wird im
> Moment des Kaufs entschieden. Wer beim Händler steht, wenn der Kaufvertrag
> unterschrieben wird, hat die Police. Wer erst zur nächsten Hauptfälligkeit
> anruft, kämpft gegen einen bestehenden Vertrag.

Der Händler steht damit in **drei** Verhältnissen gleichzeitig, und die Datenbank
muss alle drei tragen:

| Rolle | Was daraus folgt |
|---|---|
| **Multiplikator** | Jedes verkaufte Boot ist eine Police in Entstehung. Der Händler entscheidet, ob wir gefragt werden |
| **Versicherungsnehmer** | Eigener Bedarf: Betriebshaftpflicht, fremdes Eigentum in Obhut, Probefahrten, Ausstellungsstücke, Winterlager |
| **Datenquelle** | Er weiß, welche Boote den Halter wechseln, welche Werften liefern, wer im Revier baut |

Ein Datenmodell, das nur den ersten Fall kennt, verliert die anderen beiden —
und damit den größeren Teil des Werts.

---

## 3. Strategische Bedeutung — vier Wirkungen

| Wirkung | Beschreibung | Messbar an |
|---|---|---|
| **Zugang zum Kaufmoment** | Empfehlung des Händlers, bevor der Kunde selbst sucht | Anteil der Anfragen mit Händlerherkunft |
| **Eigenes Geschäft** | Der Betrieb selbst wird Kunde | Verträge mit Organisationsrolle `HAENDLER` |
| **Markttransparenz** | Welche Marken, welche Reviere, welche Preisklassen bewegen sich | Markenverteilung, Standortdichte |
| **Verhandlungsposition** | Wer das Händlernetz kennt, verhandelt anders mit Versicherern | qualitativ |

Die vierte Zeile wird meist übersehen und ist wirtschaftlich erheblich: Ein
Mehrfachagent, der belegen kann, über welche Vertriebswege er verfügt,
verhandelt Konditionen anders als einer, der Anfragen weiterreicht.

---

## 4. Integration ins CRM — die tragende Entscheidung

**Es entsteht keine Tabelle `BOOTSHAENDLER`.**

Ein Händler ist eine `ORGANISATION` mit `ORGANISATIONSROLLE = HAENDLER`. Das ist
keine Formsache, sondern die Entscheidung, die verhindert, dass dieselbe Firma
zweimal im System liegt:

| Fall | Ohne Rollenmodell | Mit Rollenmodell |
|---|---|---|
| Händler ist zugleich Kunde | zwei Datensätze, zwei Adressen, zwei Wahrheiten | eine Organisation, zwei Rollen, ein Kundendatensatz |
| Händler betreibt auch Charter | zwei Datensätze | eine Organisation, zwei Rollen |
| Händler wird Makler | dritter Datensatz | dritte Rolle mit Vermittlerregistrierung |
| Händler gibt die Marke ab | Datensatz wird gelöscht oder verfälscht | Markenbeziehung endet, Organisation bleibt |

Die Dealer Database ist deshalb **kein eigener Bestand**, sondern:

```
   ORGANISATION                         ← das Kern-CRM
        │
        ├── ORGANISATIONSROLLE HAENDLER
        │        │
        │        └── ROLLENPROFIL_HAENDLER      ← dieses Modul
        │                 │
        │                 ├── STANDORT (1..n)   ← dieses Modul
        │                 ├── HAENDLER_MARKE    ← dieses Modul
        │                 ├── KOOPERATION       ← dieses Modul
        │                 └── HAENDLERWERT      ← dieses Modul
        │
        ├── KONTAKT_ORGANISATION → KONTAKT      ← Kern-CRM
        ├── VERTRAG · AUFGABE · DOKUMENT        ← Kern-CRM
        └── weitere Rollen (KUNDE, PARTNER, …)
```

**Was dieses Modul beiträgt, ist Tiefe — nicht ein zweiter Bestand.**

---

## 5. Verhältnis zu den Nachbarmodulen

| Modul | Verhältnis |
|---|---|
| `03_LEAD_GENERATION_ENGINE` | **Liefert** neue Händler. Der Rechercheraum findet, die Freigabe übergibt, ab dann führt dieses Modul |
| `02_CORE_CRM` | **Trägt** Organisation, Kontakt, Aufgabe, Dokument, Vertrag. Hier entstehen nur Rollen-Zusatzdaten |
| Tarifwerk | **Braucht** die Markenliste: Der Premiumwerften-Nachlass ist ohne gepflegte Hersteller nicht anwendbar |
| Dealer Hub (M4) | **Konsumiert** dieses Modul. Ohne Händlerstammdaten kein Portal |
| Newsletter (M3) | Erhält **nur** Kontakte mit Einwilligung — der Weg dorthin steht in Kapitel 8 |

---

## 6. Systemgrenze — was dieses Modul nicht tut

| Nicht Aufgabe | Wo es hingehört |
|---|---|
| Händler finden | `03_LEAD_GENERATION_ENGINE` |
| Verträge, Prämien, Policen | `02_CORE_CRM`, Tarifwerk |
| Provisionsabrechnung | Offen (C-05), gehört zur Buchhaltung |
| Newsletterversand | Brevo |
| Portalzugang und Händleroberfläche | Modul M4 Dealer Hub |
| Kalte Erstansprache | Modul 03, Kanalmatrix — hier beginnt die Arbeit **nach** dem Erstkontakt |

---

## 7. Acht Grundsätze

| Nr. | Grundsatz | Konsequenz |
|---|---|---|
| **H1** | Der Händler ist eine Organisationsrolle, keine eigene Tabelle | [ADR-0001](adr/0001-haendler-als-rolle.md) |
| **H2** | Rechtsträger und Standort sind zwei Dinge | Eine Filiale ist keine Firma ([ADR-0002](adr/0002-standort-getrennt.md)) |
| **H3** | Markenbeziehungen sind befristet und werden historisiert | Wer 2024 lieferte, muss 2029 beantwortbar sein ([ADR-0003](adr/0003-markenbeziehung-historisiert.md)) |
| **H4** | Jedes Feld kennt seine Herkunft und sein Alter | Ohne beides ist ein Wert nicht beurteilbar |
| **H5** | Der Wert wechselt von Schätzung zu Messung, sobald Daten vorliegen | [ADR-0004](adr/0004-score-wechselt-zu-messung.md) |
| **H6** | Aktualität schlägt Menge | [ADR-0005](adr/0005-aktualitaet-statt-menge.md) |
| **H7** | Kein Marketing ohne Einwilligung, kein personenbezogenes Tracking ohne Rechtsgrundlage | Kapitel 8 und 12 |
| **H8** | Die Kontaktfrequenz muss zur Kapazität passen | Sonst ist die Klassifizierung eine Zahl ohne Folgen (Kapitel 4.5) |
