# 08 — Dokumentenmanagement

## 1. Zwei Speicherorte, klar getrennt

```
   DATENBANK (PostgreSQL)              OBJEKTSPEICHER (S3, EU)
   ─────────────────────              ────────────────────────
   DOKUMENT                            die eigentliche Datei
     typ, titel, herkunft              verschlüsselt
     zugriffsklasse                    versioniert
     aufbewahrungsklasse               niemals öffentlich
     loeschdatum
   DOKUMENTVERSION
     speicherschluessel ──────────────▶ Verweis
     mime_typ, groesse
     pruefsumme_sha256
     scanstatus
     signaturstatus
```

**Niemals Dateiinhalt in der Datenbank.** Kein Base64, keine Blobs. Eine
Datenbank mit eingebetteten PDFs wird unsicherbar, unwiederherstellbar und
unbezahlbar — und ein Datenbankauszug enthielte plötzlich Kundendokumente.

---

## 2. Speicherstruktur

```
crm-documents/
  <mandant>/                     at | de
    <jahr>/<monat>/              Ablagezeitpunkt, nicht Vorgangsdatum
      <dokument-uuid>/
        v1__<sha256-kurz>.pdf
        v2__<sha256-kurz>.pdf
```

| Entscheidung | Begründung |
|---|---|
| Mandant zuoberst | Erlaubt später getrennte Buckets oder Regionen je Markt, ohne Umzug |
| Ablagezeitpunkt statt Vorgangsdatum | Der Vorgang kann sich ändern, der Ablagezeitpunkt nie |
| UUID statt sprechendem Namen | Ein Pfad wie `berger_police_2026.pdf` verrät Personendaten allein durch seine Existenz |
| Prüfsumme im Dateinamen | Manipulation fällt schon beim Auflisten auf |
| Keine Ordner je Kunde | Anonymisierung müsste sonst Pfade umbenennen |

---

## 3. Versionierung

Eine Version wird **nie** überschrieben. Jede neue Fassung ist eine neue
`DOKUMENTVERSION` mit eigenem Speicherschlüssel.

| Fall | Verhalten |
|---|---|
| Korrigierte Police vom Versicherer | v2, v1 bleibt |
| Kunde lädt ein besseres Foto | v2, v1 bleibt |
| Nachtrag zum Vertrag | **eigenes Dokument**, nicht neue Version — ein Nachtrag ist ein anderes Schriftstück |
| Signiertes Dokument | Neue Version mit `signaturstatus = SIGNIERT` |

**Die Signatur bindet an genau eine Dokumentversion.** Eine spätere Fassung gilt
nie als signiert. Das ist die einzige Absicherung dagegen, dass ein geändertes
Dokument als unterschrieben behandelt wird.

---

## 4. Dokumenttypen

| Typ | Herkunft | Zugriffsklasse | Aufbewahrung |
|---|---|---|---|
| `POLICE` | Versicherer | kundensichtbar | `VERTRAG` |
| `ANTRAG` | System, signiert | kundensichtbar | `VERTRAG` |
| `ANGEBOT` | Versicherer | kundensichtbar | `VERTRAG` |
| `BEDINGUNGSWERK` | Versicherer | kundensichtbar | `VERTRAG` |
| `BERATUNGSPROTOKOLL` | Agent | kundensichtbar | `BERATUNG` |
| `ERSTINFORMATION` | System | kundensichtbar | `BERATUNG` |
| `GUTACHTEN` | Partner | intern | `VERTRAG` |
| `RECHNUNG` | System, Versicherer | kundensichtbar | `BUCHHALTUNG` |
| `FOTO` | Kunde, Agent | intern | `VERTRAG` |
| `AUSWEIS` | Kunde | **eingeschränkt** | `VERTRAG`, kürzeste zulässige Frist |
| `KUENDIGUNG` | Kunde, Versicherer | kundensichtbar | `VERTRAG` |
| `KORRESPONDENZ` | beide | intern | `VERTRAG` |

`eingeschränkt` bedeutet: nur Vertrieb und Innendienst, jeder Abruf gesondert
protokolliert, kein Erscheinen in Listen. Ein Ausweisscan ist das sensibelste
Dokument im Bestand.

---

## 5. Der Weg eines Dokuments

```
Upload (Portal · Werkbank · Posteingang · Partner)
   │
   ├─▶ Prüfung MIME-Typ am INHALT, nicht an der Endung
   ├─▶ Größenlimit
   ├─▶ Ablage im Objektspeicher, verschlüsselt
   ├─▶ SHA-256 berechnen und speichern
   ├─▶ scanstatus = OFFEN   ──▶  KEIN Zugriff möglich
   │
   └─▶ Virenprüfung (asynchron)
          ├─ sauber   ──▶ SAUBER ──▶ freigegeben
          ├─ befallen ──▶ Quarantäne · Alarm · Regel A-48 · Absender informiert
          └─ Fehler   ──▶ Wiederholung, danach manuelle Prüfung

Abruf
   │
   ├─▶ Berechtigung auf OBJEKTEBENE (nicht nur Rolle)
   ├─▶ Scanstatus muss SAUBER sein
   ├─▶ Signierter Link, ≤ 5 Minuten, an Person und Version gebunden
   └─▶ Auditeintrag: wer, wann, welche Version
```

**Die Anwendung liefert niemals Bytes aus.** Sie erzeugt einen kurzlebigen Link
und leitet um. Sonst wird jeder Dokumentabruf zur Last auf dem Anwendungsserver
— und ein Fehler in der Auslieferung zum Datenleck.

---

## 6. DSGVO-Konzept

### 6.1 Rechtsgrundlagen

| Dokumentgruppe | Grundlage | Anmerkung |
|---|---|---|
| Antrag, Police, Nachtrag | Vertrag | Art. 6 Abs. 1 lit. b |
| Beratungsprotokoll, Erstinformation | Rechtliche Verpflichtung | Vermittlerrecht |
| Rechnung, Provisionsbeleg | Rechtliche Verpflichtung | Handels- und Steuerrecht |
| Foto, Gutachten | Vertrag | Zur Risikobeurteilung erforderlich |
| Ausweis | Vertrag, ggf. rechtliche Verpflichtung | **Nur erheben, wenn ein Träger es verlangt** |
| Korrespondenz | Berechtigtes Interesse | Abwägung dokumentiert |

### 6.2 Aufbewahrungsklassen

| Klasse | Dauer ab | Sperrt Löschung | Anmerkung |
|---|---|---|---|
| `VERTRAG` | Vertragsende | ja | Handels- und steuerrechtliche Fristen (**C-06**) |
| `BUCHHALTUNG` | Ende des Geschäftsjahres | ja | (**C-06**) |
| `BERATUNG` | Beratungszeitpunkt | ja | Verjährung von Beratungsansprüchen |
| `LEAD_OHNE_ABSCHLUSS` | letzter Kontakt | nein | Kurz. Ein Interessent ohne Vertrag ist kein Archivfall |
| `MARKETING` | Erhebung | nein | Kurz |

> **Die Fristwerte sind durch Rechts- und Steuerberatung zu bestätigen.** Die
> Struktur steht, die Zahlen nicht. In beiden Märkten können sie abweichen.

### 6.3 Löschen ist ein Prozess

```
Löschdatum erreicht  ODER  Löschantrag des Betroffenen
        │
        ├─▶ Aufbewahrungspflicht prüfen
        │      gesperrt ─▶ Verarbeitung einschränken,
        │                  Nachholtermin setzen,
        │                  Antragsteller begründet informieren
        │      frei ─────▶ weiter
        │
        ├─▶ Objekt im Speicher löschen — alle Versionen
        ├─▶ DOKUMENT bleibt mit geloescht_am und Löschvermerk
        ├─▶ Auditeintrag: wer, wann, welche Grundlage
        └─▶ Bei Löschantrag: Bestätigung an den Betroffenen
```

**Metadaten bleiben.** Sonst lässt sich später nicht belegen, dass ein Dokument
fristgerecht gelöscht wurde — und der Nachweis der Löschung ist so wichtig wie
die Löschung selbst.

### 6.4 Betroffenenrechte

| Recht | Umsetzung | Frist |
|---|---|---|
| Auskunft | Selbstbedienung im Portal; Export als ZIP mit allen kundensichtbaren Dokumenten und einer Metadatenliste aller übrigen | 1 Monat |
| Berichtigung | Neue Version, alte bleibt mit Vermerk | unverzüglich |
| Löschung | Prozess §6.3 | 1 Monat |
| Einschränkung | Kennzeichnung am Dokument, kein Abruf, kein Versand | unverzüglich |
| Übertragbarkeit | Export in maschinenlesbarer Form | 1 Monat |

> Der Export nennt auch die Dokumente, die **nicht** herausgegeben werden — mit
> Typ, Datum und Grund. Ein Auskunftsersuchen, das interne Gutachten
> verschweigt, ist unvollständig; eines, das sie herausgibt, verletzt Rechte
> Dritter. Die Metadatenliste ist der Weg dazwischen.

---

## 7. Sicherheit

| Maßnahme | Umsetzung |
|---|---|
| Kein öffentlicher Speicherbereich | Zugriff ausschließlich über signierte Links |
| Linklaufzeit | ≤ 5 Minuten, an Person **und** Version gebunden |
| Typprüfung | Am Inhalt, nicht an der Endung |
| Größenlimit | Je Dokumenttyp konfiguriert |
| Virenprüfung | Vor jeder Freigabe, ohne Ausnahme |
| Integrität | SHA-256 bei Ablage, erneute Prüfung vor Signatur und vor Übermittlung |
| Verschlüsselung | Serverseitig im Speicher, Transport ausschließlich TLS |
| Versand an den Kunden | **Nie als E-Mail-Anhang.** Die Mail verlinkt das Portal |
| Versand an den Versicherer | Anlagen nur bei geprüftem TLS des Empfängers, sonst Link (ADR-0010) |
| Protokoll | Jeder Abruf, jeder Fehlzugriff |

---

## 8. Der Posteingang als Dokumentquelle

Der größte Teil eingehender Dokumente kommt per E-Mail vom Versicherer. Der Weg
ist in der Architektur beschrieben; hier die dokumentenseitige Sicht:

| Schritt | Regel |
|---|---|
| Anlagen werden **immer** abgelegt, auch bei unklarer Zuordnung | Sonst geht ein Angebot verloren, auf das ein Kunde wartet |
| Unzuordenbar → Aufgabe, nie stillschweigend verwerfen | |
| Die Original-Mail wird als Dokument abgelegt | **Ein Postfach ist kein Archiv:** nicht durchsuchbar für Prüfer, nicht fristgesteuert löschbar, an ein Konto gebunden |
| Anlagentyp wird vorgeschlagen, nicht gesetzt | KI darf vorschlagen, ein Mensch bestätigt (ADR-0008) |

---

## 9. Sicherung und Wiederherstellung

| Ebene | Verfahren |
|---|---|
| Objektspeicher | Versionierung aktiviert; versehentliches Überschreiben ist rückholbar |
| Zweite Kopie | Replikation in eine zweite EU-Zone |
| **Dritte Kopie** | Verschlüsselt, **außerhalb des Hetzner-Kontos**, unveränderlich |
| Wiederherstellungsprobe | Vierteljährlich ein Dokument aus jeder Klasse |
| Ziel | RPO 1 h · RTO 4 h |

Die dritte Kopie ist nicht verhandelbar: Snapshots, Backups und Objektspeicher
liegen sonst im selben Konto. Wer das Konto übernimmt, löscht alle drei.
