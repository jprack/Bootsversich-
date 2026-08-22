# 04 — Rollenmodell

## 1. Grundsätze

| Nr. | Grundsatz | Konsequenz |
|---|---|---|
| **R1** | Jede Berechtigung wird **serverseitig** geprüft | Eine ausgeblendete Schaltfläche ist keine Zugriffskontrolle |
| **R2** | Zwei Stufen: **darf die Rolle das?** und **gehört das Objekt zum Zugriffsbereich?** | Beide, jedes Mal |
| **R3** | Fremde Objekte liefern `404`, nicht `403` | Wenn schon die Existenz eine Information wäre |
| **R4** | Rollen im Identitätsanbieter, Rechte im Kern | Die WordPress-Rolle ist eine Ableitung, nie die Quelle |
| **R5** | Vorbereiten und Freigeben sind getrennt | Die Angebotsfreigabe ist die einzige wirtschaftlich bindende Handlung |
| **R6** | Jeder Fehlzugriff erzeugt einen Auditeintrag | Ein Angriff, der nichts hinterlässt, wird nicht bemerkt |
| **R7** | Sichtbarkeit ist eine Datenbankbedingung, kein Anwendungsfilter | Ein vergessener Filter wäre sonst ein Datenleck |

> **Ausnahme zu R5 im Startbetrieb.** Das Unternehmen startet mit **zwei**
> Personen (C-04). Eine organisatorische Trennung von Vorbereiten und Freigeben
> bricht dann bei Urlaub und Krankheit. Deshalb ist die **Alleinfreigabe**
> zugelassen — mit Pflichtbegründung, Kennzeichen `alleinfreigabe`, eigenem
> Auditeintrag und monatlichem Bericht an die Geschäftsführung. R5 wird damit
> von einer vorbeugenden zu einer nachweisenden Kontrolle. **Ab der dritten
> Person wird die Alleinfreigabe abgeschaltet.** Begründung und Umsetzung:
> [`13_STARTKONFIGURATION.md`](13_STARTKONFIGURATION.md) §4.5.

---

## 2. Sieben Rollen, nicht sechs

Der Auftrag nennt Administrator, Innendienst, Makler, Marketing, Partner und
Kunde. In dieser Aufzählung fehlt der **Vertrieb** — die Rolle, die berät,
verhandelt und Angebote freigibt.

Bei einem Mehrfachagenten ist das der Agent selbst. Ohne eigene Rolle müsste
jede vorbereitende Tätigkeit mit Vertriebsrechten laufen, und die Trennung aus
**R5** wäre wirkungslos: Dann genügt ein übernommenes Innendienstkonto, um
Verträge auszulösen.

Deshalb sieben Rollen. Sechs davon sind die geforderten, `VERTRIEB` kommt hinzu.

```
    ADMINISTRATOR   ─ konfiguriert, verwaltet, prüft ─ gibt NICHTS frei
    VERTRIEB        ─ berät, verhandelt ─────────────  gibt Angebote frei ✓
    INNENDIENST     ─ erfasst, prüft, bereitet vor ──  gibt NICHTS frei
    MARKETING       ─ Kampagnen, Segmente, Inhalte ──  sieht keine Verträge
    MAKLER          ─ eigener Bestand ───────────────  gibt eigene Angebote frei ✓
    PARTNER         ─ empfiehlt, liefert ────────────  sieht nur Status
    KUNDE           ─ Selbstbedienung ───────────────  sieht nur Eigenes
```

---

## 3. Die Rollen im Einzelnen

### 3.1 ADMINISTRATOR

| | |
|---|---|
| **Wer** | Technische und fachliche Systemverwaltung |
| **Leserechte** | Alle Entitäten im zugewiesenen Mandanten, einschließlich Auditprotokoll |
| **Schreibrechte** | Benutzer, Rollen, Produktdefinitionen, Automatisierungsregeln, Aufbewahrungsregeln, Vorlagen, Feature Flags, Stammdaten der Organisationen |
| **Freigaben** | Veröffentlichung von Produktschemata und Automatisierungsregeln · Freigabe importierter Tarifwerke, **sofern nicht selbst importiert** |
| **Ausdrücklich nicht** | **Keine Angebotsfreigabe.** Keine Beratungsdokumentation. Kein Vertragsabschluss |
| **Pflicht** | Mehrfaktor-Anmeldung. Jede Handlung vollständig auditiert |

> Verwaltung und Vertrieb sind getrennt. Ein übernommenes Administratorkonto
> darf keine wirtschaftlich bindende Handlung auslösen können.

### 3.2 VERTRIEB

| | |
|---|---|
| **Wer** | Der Versicherungsagent und angestellte Vertriebsmitarbeitende |
| **Leserechte** | Kontakte, Kunden, Leads, Boote, Verträge, Aufgaben, Aktivitäten, Dokumente — **eigene und Team-Zuordnung** im eigenen Mandanten |
| **Schreibrechte** | Alles Fachliche im Zugriffsbereich: Kontakt, Kunde, Lead, Boot, Vertrag, Aufgabe, Aktivität, Notiz, Dokument-Upload |
| **Freigaben** | **`angebot:freigeben` — als einzige Rolle neben dem Makler.** Auswahl eines Angebots mit Pflichtbegründung. Freigabe von Kundenkommunikation. Entscheidung über Prüfbefunde |
| **Ausdrücklich nicht** | Keine Benutzerverwaltung, keine Produktkonfiguration, keine Audit-Einsicht, keine Regelpflege |

### 3.3 INNENDIENST

| | |
|---|---|
| **Wer** | Sachbearbeitung, Angebotsvorbereitung, Posteingang |
| **Leserechte** | Alle Vorgänge des Mandanten — **breiter als der Vertrieb**, weil er für alle vorbereitet |
| **Schreibrechte** | Kontakt, Kunde, Boot, Vertragsdatenerfassung, Angebotserfassung aus dem Posteingang, Dokumente, Aufgaben, Aktivitäten. **Tarifwerk-Import** |
| **Freigaben** | Zuordnung eingehender Versicherer-Mails · Kennzeichnung von Dokumenten als vollständig · Beratungsdokumentation erfassen |
| **Ausdrücklich nicht** | **Keine Angebotsfreigabe.** Keine Freigabe des selbst importierten Tarifwerks (Vier-Augen-Prinzip). Keine Benutzerverwaltung |

### 3.4 MARKETING

| | |
|---|---|
| **Wer** | Kampagnenplanung, Inhalte, Newsletter |
| **Leserechte** | Segmentmerkmale, Einwilligungs- und Widerspruchsstatus, aggregierte Auswertungen. Personenbezogene Einzeldaten **nur**, soweit für den Versand erforderlich: Anrede, Name, E-Mail, Sprache, Segmentmerkmale |
| **Schreibrechte** | Kampagne, Newsletter, Segmentdefinition, Inhalte, Landingpages, Kommunikationsvorlagen |
| **Freigaben** | Versandfreigabe einer Kampagne |
| **Ausdrücklich nicht** | **Kein Zugriff auf Verträge, Prämien, Boote, Scores oder Aktivitäten.** Kein Export von Personendaten ohne zweite Freigabe |

> Segmente werden über **Merkmale** gebildet, nicht über kopierte Personenlisten.
> Eine kopierte Liste veraltet ab dem Moment des Kopierens und entzieht sich
> jedem Widerruf.

### 3.5 MAKLER

| | |
|---|---|
| **Wer** | Selbständige Vermittler mit eigenem Bestand, angebunden über das Partnerportal |
| **Leserechte** | **Ausschließlich der eigene Bestand:** Kunden, Verträge, Boote, Dokumente und Aufgaben, bei denen `vermittler_organisation_id` die eigene Organisation ist |
| **Schreibrechte** | Eigene Kunden und deren Stammdaten, eigene Anfragen, eigene Dokumente, eigene Aktivitäten |
| **Freigaben** | Angebotsauswahl im eigenen Bestand, mit Pflichtbegründung |
| **Ausdrücklich nicht** | Keine fremden Kunden, keine fremden Provisionen, keine internen Scores, keine Kalkulationsgrundlagen, kein Tarifwerk |
| **Voraussetzung** | `vermittlerregistrierung` an der Organisationsrolle ist Pflichtfeld. **Ohne Eintrag kein Portalzugang** |

### 3.6 PARTNER

| | |
|---|---|
| **Wer** | Händler, Bootsclubs, Werften, Sachverständige, Serviceanbieter, Hersteller |
| **Leserechte** | Eigene Organisation, eigene Empfehlungen **mit Status**, eigene Aufträge, eigene Abrechnungspositionen, bereitgestellte Unterlagen |
| **Schreibrechte** | Eigene Stammdaten, neue Empfehlungen, Auftragsrückmeldungen, eigene Dokumente. Bei Rolle `CLUB` zusätzlich Veranstaltungen und Clubinhalte |
| **Freigaben** | Bestätigung, dass ein Auftrag erledigt ist |
| **Ausdrücklich nicht** | **Sieht den Status einer Empfehlung, nie die Kundenakte.** Keine Prämien, keine Vertragsdetails, keine Kontaktdaten anderer Interessenten |
| **Abstufung** | Über die Organisationsrolle: `HAENDLER` sieht Bestandsobjekte und Provisionen · `CLUB` sieht Veranstaltungen und Reichweite · `LIEFERANT` sieht nur Aufträge · `HERSTELLER` sieht nur die eigenen Stammdaten |

### 3.7 KUNDE

| | |
|---|---|
| **Wer** | Versicherungsnehmer und mitversicherte Personen mit eigenem Zugang |
| **Leserechte** | **Ausschließlich eigene Objekte:** eigene Kontaktdaten, eigene Verträge, eigene Boote, kundensichtbare Dokumente, eigene Vorgänge, eigene Einwilligungen |
| **Schreibrechte** | Eigene Kontaktdaten, eigene Kommunikationseinstellungen, Dokument-Upload, Änderungsanträge, Bestätigung der Verlängerung |
| **Freigaben** | Zustimmung zu Angebot und Verlängerung. Signatur |
| **Ausdrücklich nicht** | Keine Scores, keine internen Notizen, keine Aktivitätenprotokolle, keine Kalkulationen, keine Daten anderer Personen desselben Kunden — außer er ist selbst Versicherungsnehmer |

### 3.8 Systemrollen

| Rolle | Zweck | Grenze |
|---|---|---|
| `DIENST_WORDPRESS` | Aufrufe der Plattformschicht an den Kern | Nur die für Oberflächen nötigen Endpunkte |
| `DIENST_KONNEKTOR` | Brevo, Power Automate, Posteingang | Je Konnektor ein eigenes Konto mit eigenen Rechten |
| `DIENST_ANALYTICS` | Read Replica | Ausschließlich lesend, keine Klartext-Personendaten |
| `DIENST_KI` | Assistenzfunktionen | Ausschließlich lesend, pseudonymisiert, **keine schreibende Verbindung** |

---

## 4. Rechtematrix

`V` = vollständig · `T` = Team- oder Mandantenbereich · `E` = ausschließlich
eigene Objekte · `A` = nur aggregiert · `—` = kein Zugriff

| Bereich | Admin | Vertrieb | Innen­dienst | Makler | Partner | Kunde | Marketing |
|---|---|---|---|---|---|---|---|
| Kontakt lesen | V | T | V | E | — | E | A¹ |
| Kontakt ändern | — | T | V | E | — | E | — |
| Organisation lesen | V | T | V | E | E | — | A |
| Organisation ändern | V | T | V | E | E | — | — |
| Kunde lesen | V | T | V | E | — | E | A |
| Kunde ändern | — | T | V | E | — | E² | — |
| Lead lesen | V | T | V | E | E³ | — | A |
| Lead anlegen | V | V | V | V | V | — | V |
| Lead qualifizieren | — | T | V | E | — | — | — |
| Boot lesen | V | T | V | E | E⁴ | E | — |
| Boot ändern | — | T | V | E | E⁴ | E | — |
| Vertrag lesen | V | T | V | E | — | E | — |
| Vertrag anlegen und ändern | — | T | V | E | — | — | — |
| **Angebot freigeben** | **—** | **T** | **—** | **E** | **—** | **—** | **—** |
| Angebot anfordern | — | T | V | E | — | — | — |
| Dokument lesen | V | T | V | E | E⁵ | E⁵ | — |
| Dokument hochladen | — | T | V | E | E⁵ | E | — |
| Dokument löschen | V⁶ | — | — | — | — | — | — |
| Aufgabe lesen und bearbeiten | V | T | V | E | E | — | — |
| Aktivität erfassen | — | T | V | E | — | — | — |
| Notiz lesen und schreiben | V | T | V | E | — | — | — |
| Einwilligung lesen | V | T | V | E | — | E | A |
| Einwilligung erfassen | — | T | V | E | — | E | V⁷ |
| Kampagne verwalten | V | — | — | — | — | — | V |
| Newsletter versenden | — | — | — | — | — | — | V |
| Segment bilden | V | T | — | — | — | — | V |
| Tarifwerk importieren | V | — | V | — | — | — | — |
| Tarifwerk freigeben | V⁸ | — | — | — | — | — | — |
| Provision einsehen | V | T | — | E | E⁴ | — | — |
| Automatisierungsregel pflegen | V | — | — | — | — | — | — |
| Benutzer und Rollen | V | — | — | — | — | — | — |
| Auditprotokoll lesen | V | — | — | — | — | — | — |
| Datenschutzanliegen bearbeiten | V | — | T | — | — | E | — |
| Auswertung ansehen | V | T | T | E | E | E | V |
| Personendaten exportieren | V⁹ | T⁹ | — | E⁹ | — | E | —⁹ |

¹ nur Segmentmerkmale, keine Historie · ² nur eigene Stammdaten ·
³ nur selbst empfohlene · ⁴ nur eigene Bestandsobjekte · ⁵ nur Dokumente eigener
Vorgänge · ⁶ nur über den Aufbewahrungsprozess, nie direkt ·
⁷ nur Einwilligung `MARKETING` über das Anmeldeformular · ⁸ nur, wenn nicht
selbst importiert · ⁹ nur nach erneuter Autorisierung, vollständig auditiert

---

## 5. Sichtbarkeitsregeln

Die Matrix sagt, *was* eine Rolle darf. Diese Regeln sagen, *welche Zeilen* sie
dabei sieht. Sie werden als Datenbankbedingung durchgesetzt (**R7**).

| Rolle | Regel |
|---|---|
| Administrator | `mandant_id ∈ zugewiesene Mandanten` |
| Vertrieb | `mandant_id = eigener Mandant AND (betreuer_id = ich OR team = mein Team)` |
| Innendienst | `mandant_id = eigener Mandant` |
| Marketing | `mandant_id = eigener Mandant` **und** Entität ∈ {Kontakt-Teilmenge, Einwilligung, Kampagne} |
| Makler | `vermittler_organisation_id ∈ meine Organisationen` |
| Partner | `lead.organisation_id ∈ meine` **oder** `auftrag.organisation_id ∈ meine` **oder** `boot.erworben_bei_organisation_id ∈ meine` |
| Kunde | `kunde_id ∈ meine Kundenzuordnungen` **und** Objekt ist nicht `zugriffsklasse = INTERN` |

### Der Sonderfall, der oft übersehen wird

Ein **mitversicherter** Kontakt darf nicht automatisch alles sehen, was der
Versicherungsnehmer sieht. Die Sichtbarkeit richtet sich nach der Rolle in
`KUNDE_KONTAKT`:

| Rolle im Kundenverbund | Sieht |
|---|---|
| `VERSICHERUNGSNEHMER` | alles zum Kunden |
| `BEVOLLMAECHTIGT` | alles zum Kunden |
| `MITVERSICHERT` | Verträge und Boote, **nicht** Prämien und Zahlungsverhalten |
| `ZAHLER` | Prämien und Zahlungen, **nicht** die Beratungshistorie |
| `ANSPRECHPARTNER` | nur den laufenden Vorgang |

---

## 6. Abbildung auf WordPress

Die WordPress-Rolle steuert **die Sichtbarkeit von Menüpunkten**. Sie
entscheidet **nie** über die Herausgabe eines Fachdatums — das prüft
ausschließlich der Kern, bei jedem Aufruf.

| Kernrolle | WordPress-Rolle | Capabilities |
|---|---|---|
| Administrator | `callidus_admin` | Konfigurationsmenüs. **Keine** Datei- und Plugin-Verwaltung |
| Vertrieb | `callidus_sales` | CRM-Werkbank, Tagesliste, Kundenakte, Freigaben |
| Innendienst | `callidus_office` | wie Vertrieb, ohne Freigabemenü |
| Marketing | `callidus_marketing` + `editor` | Inhalte, Kampagnen |
| Makler | `callidus_broker` | Partnerportal, Maklersicht |
| Partner | `callidus_partner` | Hub gemäß Organisationsrolle |
| Kunde | `callidus_customer` | Kundenportal |
| — | `administrator` | **Ausschließlich technischer Betrieb.** Kein Alltagskonto, Mehrfaktor-Pflicht, Datei- und Plugin-Editor abgeschaltet |

---

## 7. Anmeldung und Sitzung

| Rolle | Verfahren | Mehrfaktor | Leerlauf | Höchstdauer |
|---|---|---|---|---|
| Administrator | OIDC | **Pflicht** | 30 min | 8 h |
| Vertrieb, Innendienst | OIDC | **Pflicht** | 60 min | 10 h |
| Marketing | OIDC | Pflicht | 60 min | 10 h |
| Makler, Partner | OIDC | Pflicht ab V2 | 30 min | 8 h |
| Kunde | OIDC | empfohlen, wählbar | 30 min | 12 h |
| Dienstkonten | OAuth 2.0 Client Credentials | entfällt | — | kurzlebige Token mit Rotation |

**Magic Link** für die Datenergänzung ohne Konto: einmalig verwendbar,
höchstens 30 Minuten gültig, an genau einen Vorgang und Zweck gebunden, nur als
Hashwert gespeichert, jeder Aufruf auditiert. Er ersetzt keine Anmeldung und
gibt **nie** ein Dokument frei.

---

## 8. Rechteänderungen

| Regel | Umsetzung |
|---|---|
| Rollenzuweisung ist auditpflichtig | `benutzer.rolle_erteilt` / `.rolle_entzogen` mit Begründung |
| Eine Rechteänderung invalidiert die Sitzung | Sonst wirkt sie erst nach Stunden |
| Kein Selbstbedienungs-Upgrade | Niemand kann sich Rechte geben, die er nicht schon hat |
| Rollen enden mit Datum | `gueltig_bis` an der Zuweisung — Urlaubsvertretungen und befristete Zugänge laufen von selbst aus |
| Vierteljährliche Rechteprüfung | Bericht an die Administration: wer hat was, seit wann, zuletzt benutzt wann |
