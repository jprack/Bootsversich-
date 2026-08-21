# 08 — Sicherheitsarchitektur

> **Diese Architektur behauptet keine erreichte Rechtskonformität.** Sie
> beschreibt technische und organisatorische Maßnahmen, die eine Prüfung
> bestehen sollen. Die Freigabe erteilen eine datenschutzbeauftragte Person und
> eine Rechtsberatung, nicht ein Architekturdokument.

---

## 1. Schutzbedarf

Nicht alle Daten sind gleich schutzbedürftig. Aufwand gehört dorthin, wo
Schaden entsteht.

| Klasse | Beispiele | Schaden bei Offenlegung | Maßnahmen |
|---|---|---|---|
| **K1 — öffentlich** | Produktbeschreibungen, Ratgeber, Standorte | keiner | Standardschutz |
| **K2 — intern** | Kampagnenplanung, Segmentdefinitionen, Kennzahlen | gering, Wettbewerb | Anmeldung, Rollenprüfung |
| **K3 — personenbezogen** | Name, Anschrift, Geburtsdatum, Kontaktwege, Bootsdaten | hoch, meldepflichtig | Verschlüsselung, Objektberechtigung, Audit, Maskierung im Protokoll |
| **K4 — besonders sensibel** | Verträge, Prämien, Schäden, Zahlungsverhalten, Scores, Dokumente | sehr hoch, meldepflichtig, Vertrauensverlust | K3 **plus** verschärfte Protokollierung, Vier-Augen-Prinzip beim Export, kurze Linklaufzeiten |
| **K5 — untersagt** | Gesundheitsdaten, biometrische Daten, Bonitätsdaten | — | Werden nicht erhoben |

> **Bemerkenswert:** Ein Bootsdatensatz ist kein harmloses technisches Datum.
> Bootstyp, Wert, Liegeplatz und Abwesenheitsmuster ergeben zusammen ein Profil,
> das für Einbrüche verwertbar ist. Deshalb ist `Boot` als K3 eingestuft und
> Liegeplatzangaben werden in Auswertungen nur aggregiert ausgegeben.

---

## 2. DSGVO

### 2.1 Rollen der Beteiligten

| Beteiligter | Rolle | Erforderlich |
|---|---|---|
| Plattformbetreiber | Verantwortlicher | Verzeichnis von Verarbeitungstätigkeiten, Datenschutzhinweise, Prozesse für Betroffenenrechte |
| Hosting-Anbieter | Auftragsverarbeiter | Auftragsverarbeitungsvertrag, EU-Standort, Unterauftragsverarbeiter offengelegt |
| Brevo | Auftragsverarbeiter | Auftragsverarbeitungsvertrag, Datenstandort (**A-07**) |
| Microsoft | Auftragsverarbeiter | Auftragsverarbeitungsvertrag, Datenstandort, Drittlandbewertung (**A-07**) |
| KI-Anbieter | Auftragsverarbeiter | Auftragsverarbeitungsvertrag, kein Training mit Kundendaten, Datenstandort (**A-07**) |
| Versicherer | **eigener Verantwortlicher** | Vereinbarung über die Übermittlung, kein Auftragsverarbeitungsvertrag |
| Händler, Club, Makler | eigener Verantwortlicher, teils gemeinsam | Vereinbarung; bei gemeinsamer Verantwortung Vereinbarung nach Art. 26 DSGVO |

> Der Unterschied zwischen Auftragsverarbeitung und eigener Verantwortlichkeit
> ist kein Formalie: Bei der Weitergabe an einen Versicherer braucht es eine
> **Rechtsgrundlage der Übermittlung**, nicht bloß einen Vertrag über die
> Verarbeitung. Deshalb existiert der Einwilligungszweck
> `UEBERMITTLUNG_VERSICHERER` als eigener Datensatz.

### 2.2 Rechtsgrundlagen je Zweck

| Zweck | Rechtsgrundlage | Anmerkung |
|---|---|---|
| Angebotsbearbeitung | Vertrag beziehungsweise vorvertragliche Maßnahme | Art. 6 Abs. 1 lit. b |
| Übermittlung an den Versicherer | Vertrag, ergänzend Einwilligung | Umfang wird dokumentiert |
| Vertragsverwaltung | Vertrag | |
| Aufbewahrung nach Vertragsende | Rechtliche Verpflichtung | Handels- und steuerrechtliche Fristen |
| Newsletter an Interessenten | Einwilligung | Art. 6 Abs. 1 lit. a, Double-Opt-in |
| Newsletter an Bestandskunden | Berechtigtes Interesse, ggf. § 7 UWG / § 174 TKG | Rechtliche Prüfung je Land erforderlich |
| Scoring und Priorisierung | Berechtigtes Interesse | **Abwägung dokumentieren.** Kein automatisiertes Ablehnen |
| Reichweitenmessung | Einwilligung | Ohne Einwilligung kein Messskript |
| Betrugsprävention | Berechtigtes Interesse | Umfang eng begrenzen |

### 2.3 Scoring und Profilbildung

Die Plattform berechnet Lead Score, Customer Value Score und
Abwanderungsrisiko. Das ist Profilbildung im Sinne der DSGVO.

| Maßnahme | Umsetzung |
|---|---|
| Kein automatisiertes Ablehnen | Ein Score entscheidet nie über Annahme, Ablehnung oder Prämie. Er priorisiert ausschließlich interne Arbeit |
| Erklärbarkeit | Jeder Score speichert seine Top-Faktoren. Auf Anfrage ist die Bewertung darstellbar |
| Transparenz | Der Datenschutzhinweis beschreibt Zweck und Logik der Priorisierung |
| Widerspruch | Betroffene können der Profilbildung widersprechen; der Zweck `PROFILBILDUNG` ist eigenständig widerrufbar |
| Datenschutz-Folgenabschätzung | **Wahrscheinlich erforderlich** (systematische Bewertung persönlicher Aspekte, große Zahl Betroffener). Offener Punkt **A-05** — vor dem Produktivgang von M1 und M8 zu klären |

### 2.4 Betroffenenrechte

| Recht | Umsetzung | Frist |
|---|---|---|
| Auskunft | Selbstbedienung im Kundenportal, sonst über den Innendienst; maschinenlesbarer Export | 1 Monat |
| Berichtigung | Direkt im Portal, Änderungen auditiert | unverzüglich |
| Löschung | Antrag erzeugt einen Vorgang; Aufbewahrungsregeln werden geprüft; bei Sperre Begründung und Nachholtermin | 1 Monat |
| Einschränkung | Kennzeichnung am Datensatz, Verarbeitung ausgesetzt | unverzüglich |
| Datenübertragbarkeit | Export als JSON und CSV | 1 Monat |
| Widerspruch | Sofort wirksam, systemweit, alle Kanäle | unverzüglich |
| Widerruf der Einwilligung | Jederzeit, ebenso einfach wie die Erteilung | sofort |

### 2.5 Löschkonzept

Löschen ist ein Prozess, kein `DELETE`.

```
Löschantrag
    │
    ├─▶ Aufbewahrungspflicht prüfen (Aufbewahrungsregel je Datenklasse)
    │       ├─ gesperrt ──▶ Verarbeitung einschränken, Antrag als
    │       │              GESPERRT_DURCH_AUFBEWAHRUNG führen,
    │       │              Nachholtermin setzen, Antragsteller begründet informieren
    │       └─ frei ─────▶ weiter
    │
    ├─▶ ANONYMISIEREN statt Löschen, wo Referenzen bestehen:
    │       Kontakt: Name, Kontaktwege, Geburtsdatum, Adresse überschreiben
    │       Datensatz und Kennung bleiben — sonst brechen Vertrag,
    │       Buchhaltung und Auditprotokoll
    │
    ├─▶ Dokumente: Objekt im Speicher löschen, Metadaten mit Löschvermerk behalten
    │
    ├─▶ Fremdsysteme: Löschauftrag an Brevo und weitere Auftragsverarbeiter,
    │       Bestätigung protokollieren
    │
    └─▶ Auditeintrag: WER hat WANN WAS gelöscht — der Eintrag selbst bleibt
```

**Aufbewahrungsklassen** (Werte durch Rechts- und Steuerberatung zu bestätigen):

| Klasse | Beispiel | Dauer ab | Sperrt Löschung |
|---|---|---|---|
| `VERTRAG` | Police, Antrag, Nachtrag | Vertragsende | ja |
| `BUCHHALTUNG` | Rechnung, Provisionsabrechnung | Ende des Geschäftsjahres | ja |
| `BERATUNG` | Beratungsprotokoll | Beratung | ja |
| `LEAD_OHNE_ABSCHLUSS` | Anfrage ohne Vertrag | letzter Kontakt | nein |
| `MARKETING` | Signale, Öffnungen, Klicks | Erhebung | nein |
| `AUDIT` | Protokolleinträge | Ereignis | ja |

---

## 3. EU-Hosting und Datenresidenz

| Komponente | Standort | Verantwortlich | Status |
|---|---|---|---|
| Anwendungsserver | EU/EWR | Hosting-Anbieter | **A-03** |
| PostgreSQL (Primär und Replikate) | EU/EWR, eine Region | Hosting-Anbieter | **A-03** |
| MariaDB (WordPress) | EU/EWR | Hosting-Anbieter | **A-03** |
| Objektspeicher | EU/EWR, verschlüsselt | Hosting-Anbieter | **A-03** |
| Backups | EU/EWR, getrennter Standort | Betrieb | **A-03** |
| Protokolle und Metriken | EU/EWR, eigener Betrieb | Betrieb | geplant |
| Fehlertracking | EU-Region des Anbieters | Sentry | zu bestätigen |
| CDN | Nur EU-PoPs, Ursprung in der EU | Anbieter | zu bestätigen |
| E-Mail-Versand | EU-Rechenzentrum | Brevo | **A-07** |
| KI-Verarbeitung | EU bevorzugt; sonst Drittlandbewertung | Anbieter | **A-07** |
| Power Automate | EU-Mandant | Microsoft | **A-07** |

**Regel:** Jede Übermittlung in ein Drittland braucht eine dokumentierte
Grundlage (Angemessenheitsbeschluss oder Standardvertragsklauseln mit
Wirksamkeitsprüfung) **und** eine Bewertung, ob der Zweck nicht auch mit einem
EU-Anbieter erreichbar wäre. Bei Reichweitenmessung lautet die Antwort
meistens: ja, mit Matomo im Eigenbetrieb.

---

## 4. Berechtigungen

### 4.1 Drei Stufen, jedes Mal

```
Anfrage
   │
   ├─ ① Authentifizierung: Ist das Token gültig, unverfälscht,
   │     nicht abgelaufen, für diese Zielgruppe ausgestellt?
   │
   ├─ ② Rolle: Darf diese Rolle diese Operation grundsätzlich?
   │
   ├─ ③ Objektbezug: Gehört dieses konkrete Objekt zum Zugriffsbereich?
   │     Zusätzlich abgesichert durch Row Level Security in der Datenbank
   │
   └─ ④ Zustand: Erlaubt der aktuelle Status diesen Übergang?
```

Stufe ③ ist die, die in der Praxis fehlt. Deshalb liegt sie doppelt vor: in der
Anwendung **und** als Datenbankbedingung. Ein vergessener Filter in einer
Abfrage kann so keine fremden Daten ausgeben.

### 4.2 Vermiedene Fehlermuster

| Fehlermuster | Ersatz |
|---|---|
| Schaltfläche ausblenden statt prüfen | Prüfung im Controller **und** im Anwendungsfall |
| `PATCH /vertrag/{id} { status: "AKTIV" }` | Benannter Übergang mit eigener Berechtigung |
| Datensatz per Kennung laden, dann Zugriff prüfen | Zugriffskontext geht in die Abfrage ein, nicht in eine nachgelagerte Prüfung |
| Eingehendes Objekt direkt in ein Update geben | Ausdrückliche Feldauswahl, unbekannte Felder werden abgelehnt |
| `403` bei fremden Objekten | `404`, wenn schon die Existenz eine Information wäre |

---

## 5. Anwendungssicherheit

Orientierung: OWASP ASVS.

| Bedrohung | Maßnahme |
|---|---|
| SQL-Injektion | Ausschließlich parametrisierte Abfragen; ungeprüfte Roh-SQL wird durch eine Prüfregel im Build verhindert |
| XSS | Ausgabeescaping, strikte Content-Security-Policy ohne Inline-Skripte, kein ungefiltertes HTML aus Eingaben |
| CSRF | `SameSite`-Cookies plus Token bei zustandsändernden Formularen |
| SSRF | Keine benutzerdefinierten URLs im Serverabruf; ausgehende Ziele stammen aus der Konfiguration |
| Massenzuweisung | Schemaprüfung an jeder Grenze, unbekannte Felder werden abgelehnt |
| Offene Weiterleitung | Weiterleitungsziele nur aus einer Positivliste |
| Rohgewalt-Anmeldung | Ratenbegrenzung je Konto und je Adresse, wachsende Sperrzeiten, Alarm |
| Dateiupload | Typprüfung am Inhalt, Größengrenze, Virenprüfung, Ablage außerhalb des Web-Wurzelverzeichnisses |
| Aufzählung von Kennungen | UUID statt fortlaufender Zahlen, `404` bei Fremdzugriff |
| Session-Übernahme | Kurze Laufzeit, serverseitige Ungültigmachung, Neuvergabe der Kennung bei Rechteänderung |

### 5.1 HTTP-Härtung

`Strict-Transport-Security` mit Vorladung · `Content-Security-Policy` ohne
Inline-Skripte · `X-Content-Type-Options: nosniff` ·
`Referrer-Policy: strict-origin-when-cross-origin` · `X-Frame-Options: DENY` ·
`Permissions-Policy` ohne unnötige Fähigkeiten · CORS mit ausdrücklicher
Ursprungsliste, niemals mit Platzhalter.

### 5.2 WordPress-spezifische Härtung

WordPress ist das am breitesten angegriffene CMS der Welt. Das ist kein Grund
gegen WordPress — es ist ein Grund für Disziplin.

| Maßnahme | Begründung |
|---|---|
| **Kein Fachdatum in WordPress** | Wichtigste Einzelmaßnahme: Eine übernommene WordPress-Instanz gibt keine Vertragsdaten preis |
| Datei- und Plugin-Editor abgeschaltet (`DISALLOW_FILE_EDIT`) | Verhindert Codeausführung über ein übernommenes Administratorkonto |
| Installation aus dem Repository, kein Upload im Betrieb (`DISALLOW_FILE_MODS`) | Jede Änderung ist versioniert und nachvollziehbar |
| Plugin-Verwaltung mit ausdrücklicher Freigabe | Jedes Plugin ist Fremdcode mit Zugriff auf die Datenbank. Kriterien: Wartung, Verbreitung, Sicherheitshistorie, Lesbarkeit |
| Abhängigkeiten über Composer, Versionen festgeschrieben, Prüfsummen | Schutz vor Lieferkettenangriffen |
| Automatische Sicherheitsaktualisierungen, wöchentliches Fenster für Übrige | Bekannte Lücken sind die häufigste Ursache |
| `wp-admin` und `wp-login.php` mit Ratenbegrenzung, Mehrfaktor, optional IP-Beschränkung | Häufigstes Angriffsziel |
| XML-RPC abgeschaltet | Wird nicht benötigt, dient regelmäßig der Rohgewalt |
| REST-Benutzerliste abgeschaltet | Gibt sonst ohne Not Konten preis |
| Versionsangaben entfernt | Erschwert gezielte Angriffe |
| Web Application Firewall vorgeschaltet | Fängt bekannte Muster ab |
| Datenbankbenutzer ohne `DROP`, `CREATE USER`, `FILE` | Begrenzt den Schaden einer Injektion |
| Getrennte Datenbanken für WordPress und Kern, getrennte Zugangsdaten | Kein Übergriff möglich |

---

## 6. Auditprotokoll

### 6.1 Was protokolliert wird

| Bereich | Ereignisse |
|---|---|
| Anmeldung | Erfolg, Misserfolg, Sperre, Mehrfaktor, Abmeldung, Rechteänderung |
| Datenzugriff | Aufruf einer Kundenakte, eines Vertrags, eines Dokuments |
| Änderung | Anlegen, Ändern, Löschen, Anonymisieren — mit Vorher-Nachher-Verweis |
| Vorgang | Jeder Zustandsübergang mit Code, Rolle, Person, Begründung |
| Angebot | Anforderung, Eingang, Prüfergebnis, menschliche Freigabe |
| Dokument | Ablage, Abruf, Versionswechsel, Signatur, Löschung |
| Übermittlung | Jede Weitergabe an einen Dritten, mit Umfang und Rechtsgrundlage |
| Export | Jeder Export personenbezogener Daten |
| Datenschutz | Auskunft, Berichtigung, Löschung, Widerspruch |
| Konfiguration | Rollen, Produkte, Regeln, Aufbewahrung, Feature Flags |
| Sicherheit | Abgewiesener Zugriff, Ratenbegrenzung, Virenfund |

### 6.2 Was **nicht** protokolliert wird

Passwörter · Token und Schlüssel · vollständige Bankdaten · Dokumentinhalte ·
Inhalte von Nachrichten · besondere Datenkategorien · IP-Adressen im
Fachprotokoll (nur im technischen Protokoll mit kurzer Frist).

Ein Auditprotokoll, das selbst zum Datenleck wird, ist schlimmer als keines.

### 6.3 Unveränderlichkeit

```
Anwendungsrolle in der Datenbank:
    GRANT  INSERT, SELECT  ON auditeintrag
    REVOKE UPDATE, DELETE  ON auditeintrag
    + Trigger, der UPDATE und DELETE zusätzlich blockiert

Löschung nach Fristablauf:
    ausschließlich durch eine getrennte Rolle,
    in einem eigenen Prozess, selbst protokolliert
```

Ein fehlerhafter Eintrag wird durch einen korrigierenden Folgeeintrag
richtiggestellt, nie überschrieben. Ein übernommenes Anwendungskonto kann seine
Spuren nicht beseitigen.

---

## 7. Verschlüsselung und Geheimnisse

| Bereich | Verfahren |
|---|---|
| Transport nach außen | TLS 1.3, HSTS mit Vorladung, moderne Verschlüsselungssammlungen |
| Transport nach innen | TLS, zwischen WordPress und Kern zusätzlich gegenseitige Authentifizierung |
| Datenbank | Verschlüsselung des Speichers; zusätzlich Feldverschlüsselung für K4-Felder |
| Objektspeicher | Serverseitige Verschlüsselung, Schlüsselverwaltung getrennt |
| Backups | Verschlüsselt, Schlüssel getrennt vom Backup aufbewahrt |
| Geheimnisse | Secret Store, nie im Repository, nie im Abbild, nie im Protokoll |
| Rotation | Datenbank und Dienstkonten vierteljährlich, Webhook-Geheimnisse halbjährlich, sofort bei Verdacht |
| Fehlender Wert | Die Anwendung startet **nicht** mit einem unsicheren Vorgabewert |

---

## 8. Backup und Wiederherstellung

### 8.1 Ziele

| Daten | RPO | RTO | Verfahren |
|---|---|---|---|
| PostgreSQL (Kern) | 15 min | 1 h | Kontinuierliche Archivierung, Point-in-Time-Recovery, tägliche Vollsicherung |
| Objektspeicher | 1 h | 4 h | Versionierung plus Replikation in eine zweite EU-Zone |
| MariaDB (WordPress) | 1 h | 4 h | Tägliche Sicherung, stündliche Transaktionsprotokolle |
| Konfiguration | 0 | 30 min | Infrastruktur als Code im Repository |
| Geheimnisse | 0 | 30 min | Secret Store mit eigener Sicherung |

### 8.2 Aufbewahrung

Stündlich 48 Stunden · täglich 30 Tage · wöchentlich 12 Wochen · monatlich
12 Monate · jährlich 7 Jahre für aufbewahrungspflichtige Daten.

### 8.3 Schutz vor Verschlüsselungsangriffen

| Maßnahme | Wirkung |
|---|---|
| Mindestens eine Kopie unveränderlich (WORM) | Ein Angreifer mit Administratorrechten kann sie nicht löschen |
| Getrennte Zugangsdaten für Sicherungen | Kein Übergriff aus der Produktionsumgebung |
| Räumlich getrennter Standort | Schutz vor physischen Ereignissen |
| Wiederherstellung nie in die Produktion, immer zuerst in eine Prüfumgebung | Verhindert das Zurückspielen kompromittierter Daten |

### 8.4 Wiederherstellungsprobe

**Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung.**

| Rhythmus | Umfang | Ergebnis |
|---|---|---|
| monatlich | Einzelne Tabelle wiederherstellen | Protokoll |
| vierteljährlich | Vollständige Datenbank in die Vorproduktion | Gemessene RTO |
| jährlich | Vollständige Wiederherstellung der Plattform aus dem Nichts | Bericht an die Geschäftsführung |

---

## 9. Erkennung und Reaktion

### 9.1 Alarmierung

| Signal | Schwelle | Reaktion |
|---|---|---|
| Fehlgeschlagene Anmeldungen | > 20 je Konto in 10 Minuten | Sperre, Alarm |
| Abgewiesene Objektzugriffe | > 10 je Person in 5 Minuten | Alarm, Sitzung prüfen |
| Massenexport | > 100 Datensätze | Sofortalarm, zweite Freigabe erforderlich |
| Virenfund | jeder | Quarantäne, Alarm, Aufgabe |
| Zugriff außerhalb der Arbeitszeit auf viele Akten | Musterabweichung | Alarm |
| Fehlerquote der API | > 5 % über 5 Minuten | Bereitschaft |
| Rückstau in der Warteschlange | > 1000 oder > 30 Minuten | Bereitschaft |
| Zertifikatsablauf | 30 Tage vorher | Aufgabe |

### 9.2 Runbooks

Für jedes dieser Ereignisse existiert eine schriftliche Handlungsanweisung:

Ausfall des Versicherer-Zugangs · Ausfall des Signaturdienstes · Ausfall des
E-Mail-Versands · übernommenes Benutzerkonto · verdächtiger Dokumentupload ·
fehlerhafte Produktkonfiguration · Datenwiederherstellung ·
Verschlüsselungsangriff · **Datenschutzvorfall** · WordPress-Kompromittierung ·
Rückstau in der Warteschlange.

### 9.3 Datenschutzvorfall

```
Verdacht
  └─▶ Sofort: Vorfall dokumentieren, Zeitpunkt festhalten, Beweise sichern
      └─▶ Innerhalb von Stunden: Umfang bestimmen
          Wer? Welche Daten? Wie viele? Welche Schutzklasse?
          └─▶ Bewertung: Risiko für die Rechte der Betroffenen?
              ├─ ja  ──▶ Meldung an die Aufsichtsbehörde binnen 72 Stunden
              │          (AT: Datenschutzbehörde · DE: zuständige Landesbehörde)
              │          └─▶ Bei hohem Risiko: Benachrichtigung der Betroffenen
              └─ nein ─▶ Dokumentieren, keine Meldung — Begründung festhalten
                  └─▶ Ursache beheben, Maßnahme prüfen, Erkenntnis übernehmen
```

Die 72-Stunden-Frist beginnt mit der **Kenntnis**, nicht mit der abgeschlossenen
Analyse. Deshalb ist der erste Schritt Dokumentation, nicht Aufklärung.

---

## 10. Prüfliste vor dem Produktivgang

| # | Punkt | Verantwortlich | Status |
|---|---|---|---|
| 1 | Verzeichnis von Verarbeitungstätigkeiten vollständig | Datenschutz | offen |
| 2 | Datenschutz-Folgenabschätzung für Scoring geprüft | Datenschutz | offen (**A-05**) |
| 3 | Auftragsverarbeitungsverträge mit allen Dienstleistern | Datenschutz | offen (**A-07**) |
| 4 | Drittlandübermittlungen bewertet und dokumentiert | Datenschutz | offen |
| 5 | Datenschutzhinweise je Land veröffentlicht | Recht | offen |
| 6 | Prozesse für Betroffenenrechte erprobt | Datenschutz | offen |
| 7 | Löschkonzept mit bestätigten Fristen | Recht, Steuer | offen |
| 8 | Gewerberechtliche Zulassung je Land | Recht | offen (**A-02**) |
| 9 | Erstinformation und Beratungsdokumentation | Recht | offen |
| 10 | Penetrationstest bestanden, Befunde behoben | Betrieb | offen |
| 11 | Wiederherstellungsprobe erfolgreich | Betrieb | offen |
| 12 | Runbooks geschrieben und geprobt | Betrieb | offen |
| 13 | Bereitschaft und Meldeweg festgelegt | Betrieb | offen |
| 14 | Keine Geheimnisse im Repository, Prüfung in der Auslieferungskette | Technik | offen |
| 15 | Keine echten Personendaten außerhalb der Produktion | Technik | offen |
| 16 | Schulung: Datenschutz, Meldepflichten, Phishing | Geschäftsführung | offen |
