# 01 — Gesamtkonzept des Kern-CRM

## 1. Zweck

Das Kern-CRM beantwortet vier Fragen verbindlich, für jeden Menschen im
Unternehmen, zu jedem Zeitpunkt:

| Frage | Ohne CRM | Mit CRM |
|---|---|---|
| **Wen kennen wir?** | verteilt über Postfächer, Excel und Köpfe | eine Person, ein Datensatz, eine Historie |
| **Was besitzt er?** | im Vertragsordner, wenn man ihn findet | Boote und Verträge an der Person, mit Fristen |
| **Was ist zu tun?** | wer am lautesten ruft | priorisierte Tagesliste mit Begründung |
| **Was ist passiert?** | Erinnerung | lückenloser, nachweisbarer Verlauf |

Die vierte Frage ist die, die im Versicherungsgeschäft den Unterschied macht.
Ein Vermittler, der nicht belegen kann, **wann er worüber beraten hat**, trägt
das Risiko selbst.

## 2. Die Systemgrenze

```
                    ┌──────────────────────────────────────────────┐
   Interessent ────▶│  Öffentliche Website (M2)                    │
                    │  Formular · Richtprämie · Einwilligung       │
                    └───────────────────┬──────────────────────────┘
                                        │ Lead
   Innendienst  ───▶┌───────────────────▼──────────────────────────┐
   Vertrieb        │                                               │
                    │           02_CORE_CRM                        │
   Kunde  ────────▶│  KONTAKT · ORGANISATION · KUNDE · LEAD       │◀── Händler
   (Portal)         │  BOOT · VERTRAG · AUFGABE · DOKUMENT         │    (Empfehlung)
                    │  AKTIVITÄT · NOTIZ · EINWILLIGUNG            │
                    └───┬──────────┬──────────┬──────────┬─────────┘
                        │          │          │          │
                        ▼          ▼          ▼          ▼
                   Tarifwerk   Workflow   Newsletter   Analytics
                   (rechnet)   (M10)      (M3/Brevo)   (M11)
                        │
                        ▼
                   Versicherer (E-Mail, ADR-0010)
```

**Das CRM besitzt Stammdaten und Historie.** Es besitzt nicht: die
Prämienberechnung (Tarifwerk), den Prozesszustand (Workflow), den Versand
(Brevo), die Auswertung (Analytics). Es liefert allen vieren die Grundlage.

## 3. Struktur — fünf Schichten innerhalb des Moduls

```
┌───────────────────────────────────────────────────────────────────┐
│ ① STAMMDATEN            Wer und was existiert                     │
│   Kontakt · Organisation · Organisationsrolle · Kunde             │
│   Adresse · Kontaktweg · Boot · Hersteller                        │
│   Eigenschaft: langlebig, ändert sich selten, wird nie gelöscht   │
├───────────────────────────────────────────────────────────────────┤
│ ② VERTRÄGE              Was wirtschaftlich gilt                   │
│   Vertrag · Vertragsversion · Deckung · Prämie · Vertragsobjekt   │
│   Eigenschaft: unveränderlich, versioniert, fristbehaftet         │
├───────────────────────────────────────────────────────────────────┤
│ ③ VERTRIEB              Was gerade läuft                          │
│   Lead · Aktivität · Aufgabe · Notiz                              │
│   Eigenschaft: kurzlebig, hohe Änderungsrate, priorisiert         │
├───────────────────────────────────────────────────────────────────┤
│ ④ NACHWEIS              Was belegbar sein muss                    │
│   Einwilligung · Dokument · Dokumentversion · Auditeintrag        │
│   Eigenschaft: append-only, aufbewahrungspflichtig                │
├───────────────────────────────────────────────────────────────────┤
│ ⑤ STEUERUNG             Was das System selbst tut                 │
│   Automatisierungsregel · Regelauslösung · Erinnerungsplan        │
│   Eigenschaft: Konfiguration, kein Code                           │
└───────────────────────────────────────────────────────────────────┘
```

Die Schichten haben **gegensätzliche Eigenschaften**, und das ist der Grund für
die Trennung. Schicht ① ändert sich selten und muss jahrzehntelang halten.
Schicht ③ ändert sich stündlich und darf vergessen werden. Beide in einer
Struktur zu führen bedeutet, die Anforderungen der einen gegen die andere
auszuspielen.

## 4. Vorteile — und was sie kosten

| Vorteil | Wodurch | Preis |
|---|---|---|
| **Eine Wahrheit je Datum** | Je Datum genau ein System of Record | Disziplin: kein „schnell noch in Excel" |
| **Nachweisfähigkeit** | Einwilligung als Entität, Audit append-only, Verträge versioniert | Mehr Tabellen, mehr Schreibvorgänge |
| **Automatisierung ohne Entwickler** | Regelkatalog als Daten | Regelpflege braucht eine verantwortliche Person |
| **Beliebig erweiterbar** | Folgemodule lesen über die API, nicht über die Datenbank | Jede Erweiterung braucht einen API-Vertrag |
| **Mandantentrennung AT/DE** | `mandant_id` in jeder Kerntabelle, Row Level Security | Jede Abfrage trägt den Mandantenkontext |
| **Kein Datenverlust bei WordPress-Vorfall** | Zwei Datenbanken, getrennte Zugangsdaten | Portalseiten brauchen API-Aufrufe statt Datenbankabfragen |

Der letzte Punkt ist der teuerste im Alltag und der wertvollste im Ernstfall.

## 5. Datenflüsse

### 5.1 Eingang — wie Daten ins CRM kommen

| Quelle | Was entsteht | Besonderheit |
|---|---|---|
| Website-Formular (M2) | Lead + Kontakt + Einwilligung | Ohne Rechtsgrundlage entsteht **kein** Datensatz |
| Händler-Empfehlung (M4) | Lead mit `quelle = HAENDLER` und Organisationsbezug | Provisionsanspruch hängt an dieser Zuordnung |
| Telefon / Messe | Lead, manuell erfasst | Einwilligung wird nachgeholt, sonst keine Ansprache |
| Kundenportal (M7) | Datenänderung, Dokument, Vorgangsauslösung | Kunde ändert nur Eigenes, serverseitig geprüft |
| Versicherer per E-Mail | Angebot, Police, Dokument | Über den Posteingang aus Kapitel 11 der Architektur |
| Bestandsübernahme | alles | Einmalig, mit eigenem Prüflauf (**C-03**) |

### 5.2 Der Lebenszyklus

```
  LEAD ──────────────▶ KONTAKT ──────────▶ KUNDE ──────────▶ VERTRAG
   │                     │                   │                  │
   │ Quelle, Score       │ Person            │ wirtschaftl.     │ Police
   │ Erstkontaktfrist    │ Einwilligung      │ Einheit          │ Fristen
   │                     │ Historie          │ Betreuer         │ Versionen
   ▼                     ▼                   ▼                  ▼
  AUFGABE ◀───────── AKTIVITÄT          KUNDENAKTE      VERLÄNGERUNG
   Wer macht was      Was war            Alles auf        90 Tage vor
   bis wann                              einen Blick      Hauptfälligkeit
                                                                │
   ┌────────────────────────────────────────────────────────────┘
   │  Bestandsereignisse fließen zurück in den Vertrieb:
   └─▶ neues Boot → Cross-Selling-Prüfung
       Vertrag gekündigt → Rückgewinnung
       Boot verkauft → Risiko erhöht, Ansprache
       Kunde schweigt → Kündigungsrisiko steigt
```

**Der Rückfluss ist der eigentliche Wert.** Ein CRM, das nur vorwärts läuft, ist
eine Adressdatenbank. Erst die Rückkopplung — Bestandsereignis erzeugt
Vertriebsaufgabe — macht daraus ein Steuerungssystem.

### 5.3 Ausgang — wer aus dem CRM liest

| Verbraucher | Was er liest | Wie |
|---|---|---|
| Tarifwerk | Bootsmerkmale, Vorschadenhistorie, SFR-Stufe | synchron, Antwortzeit < 200 ms |
| Workflow (M10) | Vorgangsbezug, Fristen, Zuständigkeit | synchron beim Übergang |
| Newsletter (M3) | Segmentmerkmale, Einwilligung, Widerspruch | Segmentabfrage, kein Personenexport |
| Portale (M4–M7) | ausschließlich eigene Objekte | objektbezogen geprüft |
| Analytics (M11) | alles, aggregiert, auf Read Replica | Ereignisse und Nachtlauf |
| KI-Assistent (M8) | alles, pseudonymisiert, **nur lesend** | keine schreibende Verbindung |

### 5.4 Ereignisse

Jede Zustandsänderung erzeugt ein Ereignis über die Outbox. Die Namen sind
Verträge gegenüber allen Folgemodulen und werden nie umbenannt.

```
kontakt.angelegt          kontakt.zusammengefuehrt      kontakt.anonymisiert
organisation.rolle_erteilt                              organisation.rolle_beendet
kunde.entstanden          kunde.betreuer_gewechselt
lead.eingegangen          lead.qualifiziert             lead.verloren
boot.erfasst              boot.veraeussert              boot.wert_geaendert
vertrag.beantragt         vertrag.aktiviert             vertrag.geaendert
vertrag.faellig_in_90_tagen                             vertrag.verlaengert
vertrag.gekuendigt        vertrag.abgelaufen
aufgabe.erzeugt           aufgabe.erledigt              aufgabe.eskaliert
einwilligung.erteilt      einwilligung.widerrufen
dokument.abgelegt         dokument.geloescht
```

## 6. Was das CRM **nicht** tut — und warum

| Ausgeschlossen | Begründung | Wo es hingehört |
|---|---|---|
| **Prämien berechnen** | Die Rechenregel ist versionierte Tarifkonfiguration mit eigener Freigabe | Tarifwerk, Kapitel 13 der Architektur |
| **Prozesszustände führen** | Zustandsmaschinen mit Fristen und Eskalation sind ein eigenes Modul | M10 Workflow |
| **E-Mails versenden** | Zustellbarkeit, Bounces, Abmeldungen sind eine eigene Domäne | M3 / Brevo |
| **Schäden verwalten** | Eigener Lebenszyklus, eigene Rechtsanforderungen, eigene Fristen | eigene Architekturphase |
| **Provisionen abrechnen** | Braucht Zahlungsdaten, die das CRM nicht besitzt | nach MVP, **C-05** |
| **Buchhaltung** | Kein Zweck, keine Rechtsgrundlage, kein Nutzen | Steuerberatung |
| **Vertragsbestand des Versicherers spiegeln** | Wir führen unsere Sicht, nicht seine. Ein Abgleich ist ein Prozess, keine Kopie | Abstimmlauf, V2 |

Ein CRM, das alles kann, kann nichts richtig. Die Grenze ist die wichtigste
Designentscheidung nach dem Datenmodell.

## 7. Grundsätze für die Umsetzung

| Nr. | Grundsatz | Konsequenz |
|---|---|---|
| **K1** | Kein Fachdatum in WordPress-Tabellen | `wp_postmeta` enthält keine Person, keinen Vertrag, kein Dokument |
| **K2** | Jede Entität trägt `mandant_id` und `quelle` | Mandantentrennung und Herkunftsnachweis ab Tag eins |
| **K3** | Kein hartes Löschen in Stammdaten | Anonymisierung statt `DELETE`, sonst brechen Vertrag und Audit |
| **K4** | Dubletten werden vorgeschlagen, nie automatisch zusammengeführt | Eine falsche Zusammenführung ist praktisch nicht rückgängig zu machen |
| **K5** | Verträge sind unveränderlich | Änderung erzeugt Version |
| **K6** | Automatisierungen sind Daten | Regelkatalog in der Datenbank, nicht im Code |
| **K7** | Jede Aufgabe hat einen Dublettenschlüssel | Ein doppelt laufender Nachtjob erzeugt keine zweite Aufgabe |
| **K8** | Geldbeträge sind `numeric(14,2)` mit Währung | Nie Gleitkomma (ADR-0004 der Architektur) |
| **K9** | Berechtigung wird serverseitig auf Objektebene geprüft | Eine ausgeblendete Schaltfläche ist keine Zugriffskontrolle |
| **K10** | Jede schreibende Operation erzeugt einen Auditeintrag | Auch abgewiesene Zugriffe |
