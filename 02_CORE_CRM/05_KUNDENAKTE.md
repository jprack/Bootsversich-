# 05 — Digitale Kundenakte

## 1. Die Akte ist eine Ansicht, kein Datensatz

Es gibt keine Tabelle `KUNDENAKTE`. Die Akte führt zusammen, was in elf
Entitäten liegt. Das ist wichtig, weil eine eigene Tabelle sofort zur zwölften
Wahrheit würde — die dann veraltet, sobald jemand woanders etwas ändert.

```
                        ┌─────────────────────────┐
                        │      KUNDENAKTE         │
                        │      (Ansicht)          │
                        └────────────┬────────────┘
        ┌──────────┬──────────┬──────┼──────┬──────────┬──────────┐
        ▼          ▼          ▼      ▼      ▼          ▼          ▼
     KONTAKT    KUNDE      BOOT  VERTRAG DOKUMENT  AKTIVITAET  AUFGABE
     ADRESSE  KUNDE_       VERTRAGS-      DOKUMENT-  NOTIZ   EINWILLIGUNG
   KONTAKTWEG  KONTAKT     OBJEKT  VERSION VERSION           REGELAUSLÖSUNG
```

**Der Zweck der Akte:** Ein Mensch am Telefon muss in unter drei Sekunden
wissen, mit wem er spricht, was diese Person besitzt, was zuletzt war und was
als Nächstes ansteht. Alles andere ist zweitrangig.

---

## 2. Aufbau

### 2.1 Kopfbereich — immer sichtbar, auch beim Scrollen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Familie Berger                            K-AT-004711    ● AKTIV        │
│  Kunde seit 03/2019 · Betreuer: M. Sanders · Mandant AT                  │
│                                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│  │ Wert  78 │ Risiko31 │ Verträge2│ Boote   1│ Offen   3│               │
│  │ ▁▃▅▆█    │ ▅▄▃▂▁    │  4.280 € │          │ 1 überf. │               │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│                                                                          │
│  ⚑ Hauptfälligkeit Kasko in 47 Tagen        ⚠ VIP · bevorzugt Telefon   │
└─────────────────────────────────────────────────────────────────────────┘
```

| Element | Herkunft | Warum im Kopf |
|---|---|---|
| Bezeichnung, Kundennummer, Status | `KUNDE` | Identifikation am Telefon |
| Betreuer | `KUNDE.betreuer_id` | „Sind Sie zuständig?" ist die erste Frage |
| Customer Value Score mit Verlauf | `01_CRM_ENGINE` | Wie viel Aufmerksamkeit ist angemessen |
| Kündigungsrisiko mit Verlauf | `01_CRM_ENGINE` | **Der Verlauf zählt mehr als der Wert.** Ein von 20 auf 31 gestiegenes Risiko ist alarmierender als ein konstantes 45 |
| Vertragsvolumen | Summe aktueller Vertragsversionen | Wirtschaftliche Bedeutung |
| Offene Aufgaben, davon überfällig | `AUFGABE` | Was liegen geblieben ist |
| Nächste Frist | `VERTRAG.hauptfaelligkeit` | Der wichtigste Termin im Bestandsgeschäft |
| Merker | `vip`, `kontaktsperre`, `bevorzugter_kanal`, `zahlungsverhalten` | Was man wissen muss, **bevor** man spricht |

**Score-Erklärung:** Ein Klick auf einen Score zeigt die Top-Faktoren aus
`score_faktoren`. Ein Score ohne Begründung wird im Vertrieb ignoriert und ist
datenschutzrechtlich angreifbar.

### 2.2 Reiter

| Reiter | Inhalt | Quelle |
|---|---|---|
| **Übersicht** | Verdichtung: letzte drei Aktivitäten, offene Aufgaben, aktive Verträge, Boote, nächste Fristen | mehrere |
| **Personen** | Alle Kontakte des Kundenverbunds mit ihrer Rolle, Adressen, Kontaktwege, Verifikationsstatus | `KONTAKT`, `KUNDE_KONTAKT`, `ADRESSE`, `KONTAKTWEG` |
| **Boote** | Alle Objekte mit Kennzahlen, Zuordnung zu Verträgen, Wertentwicklung | `BOOT`, `VERTRAGSOBJEKT` |
| **Verträge** | Aktive und historische Verträge, Versionshistorie, Deckungen, Prämien, Fristen | `VERTRAG`, `VERTRAGSVERSION`, `DECKUNG`, `PRAEMIE` |
| **Dokumente** | Nach Typ gruppiert, mit Version, Scanstatus, Aufbewahrung | `DOKUMENT`, `DOKUMENTVERSION` |
| **Verlauf** | Chronologisch alle Aktivitäten, Kommunikation, Statuswechsel, Regelauslösungen | `AKTIVITAET`, `KOMMUNIKATION`, `REGELAUSLOESUNG` |
| **Aufgaben** | Offen, erledigt, verschoben — mit erzeugender Regel | `AUFGABE` |
| **Marketing** | Einwilligungen je Zweck, Widersprüche, Segmentzugehörigkeit, Kampagnenhistorie, Öffnungen und Klicks | `EINWILLIGUNG`, M3 |
| **Notizen** | Angeheftet zuerst, dann chronologisch | `NOTIZ` |
| **Datenschutz** | Einwilligungshistorie, Auskunfts- und Löschanträge, Auditauszug | `EINWILLIGUNG`, M-Privacy, `AUDITEINTRAG` |

---

## 3. Der Verlauf — die anspruchsvollste Ansicht

Der Verlauf führt Ereignisse aus sechs Quellen in **einer** Zeitachse zusammen.
Das ist die Ansicht, die im Alltag am meisten benutzt und am häufigsten schlecht
gebaut wird.

```
 heute
   │
   ├─ 14:32  ☎  Telefonat ausgehend · M. Sanders · 8 min
   │            „Verlängerung besprochen, wartet auf Vergleichsangebot"
   │            Ergebnis: POSITIV → Folgeaufgabe erstellt
   │
   ├─ 09:15  ⚙  Regel A-21 ausgelöst
   │            Hauptfälligkeit in 90 Tagen → Aufgabe „Verlängerungsgespräch"
   │
 gestern
   ├─ 16:40  ✉  Newsletter „Saisonstart 2026" geöffnet, 2 Klicks
   │            → Engagement +, Lead Score neu berechnet
   │
   ├─ 11:02  📄 Dokument abgelegt: Police KA-2026-0912 v2 (Versicherer)
   │
 vor 3 Tagen
   ├─ 08:30  ⚙  Regel A-49 unterdrückt
   │            Grund: BEREITS_GESENDET — keine zweite Erinnerung
   │
   └─ …
```

### Was den Verlauf brauchbar macht

| Anforderung | Umsetzung |
|---|---|
| **Auch unterdrückte Automatisierungen erscheinen** | Sonst fragt sich der Vertrieb, warum nichts passiert ist. `REGELAUSLOESUNG` mit `unterdrueckungsgrund` |
| **Filter nach Art** | Nur Telefonate · nur Dokumente · nur Automatik · nur Beratung |
| **Beratungsdokumentation ist gekennzeichnet** | `AKTIVITAET.ist_beratungsdokumentation` — im Streitfall die entscheidende Zeile |
| **Seitenweise, nie „alles laden"** | Ein Bestandskunde nach zehn Jahren hat tausende Einträge |
| **Keine Vermischung mit dem Auditprotokoll** | Der Verlauf ist fachlich, das Audit ist technisch. Wer beides mischt, macht beides unbrauchbar |

---

## 4. Marketingstatus — der Reiter, der Ärger erspart

| Angabe | Herkunft | Warum sichtbar |
|---|---|---|
| Einwilligung je Zweck, mit Datum und Textversion | `EINWILLIGUNG` | Vor jedem Anruf: Darf ich überhaupt? |
| Widerruf mit Datum | `EINWILLIGUNG.widerrufen_am` | Ein Widerruf, den der Vertrieb nicht sieht, wird verletzt |
| Bounce-Sperre | `KONTAKTWEG.bounce_gesperrt` | Erklärt, warum keine Mail ankommt |
| Kontaktsperre mit Grund | `KONTAKT.kontaktsperre` | Übersteuert **alles** |
| Segmentzugehörigkeit | M3 | Warum dieser Kunde diese Mail bekam |
| Kampagnenhistorie mit Öffnung und Klick | M3 | Gesprächseinstieg: „Sie hatten sich das Chartermodul angesehen" |
| Frequenzstand | M3 | Wie oft wurde er dieses Quartal angeschrieben |

> Die letzte Zeile verhindert den häufigsten Fehler im Zusammenspiel von
> Marketing und Vertrieb: dass beide unabhängig voneinander denselben Kunden in
> derselben Woche ansprechen.

---

## 5. Leistungsanforderungen

| Vorgang | Ziel | Wie erreicht |
|---|---|---|
| Kopfbereich sichtbar | < 300 ms | Eine gebündelte Abfrage, keine sieben Einzelaufrufe |
| Vollständige Akte | < 700 ms | Reiterinhalte werden nachgeladen, nicht vorab |
| Verlauf, erste Seite | < 400 ms | Index auf `(bezug_typ, bezug_id, zeitpunkt DESC)` |
| Dokumentabruf | < 500 ms | Umleitung auf signierten Link, die Anwendung liefert keine Bytes aus |
| Suche über alle Kunden | < 500 ms | Volltext über Name, Kundennummer, Vertragsnummer, Polizzennummer, Bootsname, Kennzeichen |

**Ein gebündelter Endpunkt, nicht sieben.** `GET /customers/{id}/dossier` liefert
Kopf und Übersicht in einer Antwort. Sieben Einzelaufrufe über die Core Bridge
wären das erste, was der Innendienst als „langsam" bemerkt.

---

## 6. Was die Akte nicht zeigt

| Nicht sichtbar | Für wen | Grund |
|---|---|---|
| Interne Notizen | Kunde, Partner | `NOTIZ.sichtbarkeit = INTERN` |
| Scores und Faktoren | Kunde, Partner, Makler | Interne Steuerungsgröße |
| Kalkulationsgrundlagen, Tarifwerk | alle außer Innendienst und Administration | Geschäftsgeheimnis des Trägers |
| Auditprotokoll | alle außer Administration | Eigene Berechtigung |
| Daten anderer Kunden | alle | Objektbezogene Prüfung |
| Prämien | Marketing, mitversicherte Personen | Rollenmodell §5 |
| Dokumente vor sauberem Scan | alle | `scanstatus` muss `SAUBER` sein |

---

## 7. Aktionen aus der Akte heraus

Die Akte ist Arbeitsplatz, nicht Anzeigetafel. Jede Aktion prüft
Berechtigung **und** Zustand.

| Aktion | Rolle | Ergebnis |
|---|---|---|
| Aktivität erfassen | Vertrieb, Innendienst | `AKTIVITAET`, optional Folgeaufgabe |
| Aufgabe anlegen | alle internen | `AUFGABE` mit Dublettenschlüssel |
| Angebot anfordern | Vertrieb, Innendienst | Vorgang in M10, Fächerung an mehrere Träger |
| **Angebot freigeben** | **nur Vertrieb** | Pflichtbegründung, Auditeintrag |
| Dokument hochladen | Vertrieb, Innendienst, Kunde | Scan, Prüfsumme, Version |
| Vertrag ändern | Vertrieb, Innendienst | **neue Vertragsversion**, nie Überschreiben |
| Boot erfassen | Vertrieb, Innendienst, Kunde | Löst Cross-Selling-Prüfung aus |
| Einwilligung erfassen oder widerrufen | Vertrieb, Innendienst, Kunde | Sofort systemweit wirksam |
| Auskunft erzeugen | Innendienst, Kunde | Export nach erneuter Autorisierung |
| Kunde anonymisieren | Administration | Nur über den Löschprozess mit Aufbewahrungsprüfung |
