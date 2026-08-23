# 10 — Marketingübergabe und Ansprachekanäle

---

## 1. Der Befund, der das Modul prägt

Der Auftrag beschreibt eine Engine, die Kontakte findet und in Marketing
überführt. Dazwischen steht eine Rechtslage, die in Österreich und Deutschland
enger ist, als es die meisten Lead-Werkzeuge unterstellen — und sie gilt
**auch im Geschäftsverkehr**, nicht nur gegenüber Verbrauchern.

**Sinngemäße Rechtslage, wie sie diesem Konzept zugrunde liegt:**

| Kanal | Österreich | Deutschland |
|---|---|---|
| **Werbe-E-Mail ohne vorherige Einwilligung** | **unzulässig** (§ 174 TKG 2021) — auch an Unternehmen | **unzulässig** (§ 7 Abs. 2 UWG) — auch an Unternehmen |
| **Werbeanruf ohne Einwilligung** | **unzulässig** (§ 174 TKG 2021), enger als in DE | zulässig gegenüber Unternehmen bei **mutmaßlicher** Einwilligung (§ 7 Abs. 2 Nr. 1 UWG) |
| **Postalische Werbung** | zulässig, mit Widerspruchsrecht | zulässig, mit Widerspruchsrecht |
| **Persönliche Ansprache** (Messe, Termin, Veranstaltung) | zulässig | zulässig |
| **Eingehende Anfrage** | zulässig, bringt Grundlage mit | zulässig |
| Bestandskundenausnahme | eng, an Bedingungen geknüpft | eng (§ 7 Abs. 3 UWG) |

> **Diese Einordnung ist die Arbeitsgrundlage dieses Konzepts und ersetzt keine
> Rechtsberatung.** Sie ist vor der ersten Aussendung anwaltlich zu bestätigen —
> **offener Punkt L-02**. Bis dahin gilt die engere Auslegung, also die
> österreichische, für beide Mandanten.

### 1.1 Die Konsequenz, unmissverständlich

> **Es gibt keine Kaltakquise per E-Mail.**
>
> Kein Massenanschreiben an recherchierte Adressen. Kein „Sequenz"-Werkzeug. Kein
> Newsletter an Kontakte, die ihn nicht bestellt haben. Auch nicht an `info@`.

Das ist die zweite folgenreiche Einschränkung dieses Projekts nach „Es gibt keine
Online-Tarifierung" — und sie trifft genau den Teil, den ein Lead-Werkzeug
üblicherweise als Kernfunktion verkauft.

### 1.2 Was daraus folgt — und warum es kein Verlust ist

Die zulässigen Kanäle sind **Post, Telefon (nach Prüfung), persönliche Ansprache
und eingehende Anfrage**. Alle vier sind langsamer als E-Mail und alle vier
brauchen Menschen.

Bei den hier bearbeiteten Zielgruppen ist das kein Nachteil, sondern der
passende Weg:

| | Kaltmail | Zulässige Kanäle |
|---|---|---|
| Grundgesamtheit | funktioniert ab 10.000 Adressen | funktioniert ab 10 Adressen |
| Hier vorhanden | ~10³ je Land | ~10³ je Land |
| Antwortquote bei Vereinen und Betreibern | sehr niedrig | hoch |
| Rechtliches Risiko | erheblich | gering |
| Wirkung auf den Ruf im Revier | negativ | positiv |

Der Markt ist klein und persönlich. **Ein Anschreiben an alle Yachtclubs eines
Sees spricht sich schneller herum als jede Empfehlung** — und zwar in die
falsche Richtung.

---

## 2. Kanalmatrix als Daten

Die zulässigen Kanäle liegen als **gepflegte Tabelle** vor, nicht als
Programmlogik — je Land, Empfängerart und Rechtsgrundlage. Ändert sich die
Rechtslage oder liegt die anwaltliche Klärung aus L-02 vor, wird eine Zeile
geändert, nicht Code.

| Land | Empfänger | Kanal | Erlaubt | Bedingung |
|---|---|---|---|---|
| AT | Organisation | Post | ✓ | Widerspruch beachten |
| AT | Organisation | Telefon | **gesperrt** | Bis L-02 geklärt ist |
| AT | Organisation | E-Mail | ✗ | Nur mit vorheriger Einwilligung |
| AT | Person | jeder | wie Organisation, zusätzlich Informationspflicht | |
| DE | Organisation | Post | ✓ | Widerspruch beachten |
| DE | Organisation | Telefon | ✓ | **Sachbezug dokumentiert** (§3) |
| DE | Organisation | E-Mail | ✗ | Nur mit vorheriger Einwilligung |
| beide | alle | persönlich, Messe | ✓ | |
| beide | alle | eingehende Anfrage | ✓ | Grundlage wird miterfasst |

**Technisch bindend:** Ein Kanal, der hier nicht erlaubt ist, lässt sich in der
Oberfläche nicht als Aktivität erfassen und von keiner Automation auslösen.
Nicht als Warnung — als Sperre.

---

## 3. Der Sachbezug beim Telefonanruf (DE)

Wo ein Anruf auf mutmaßliche Einwilligung gestützt wird, ist der Sachbezug
**vor** dem Anruf zu dokumentieren, nicht danach. Ein Feld am Vorgang, ausgefüllt
aus dem Recherchebeleg:

| Zulässiger Sachbezug | Beispiel |
|---|---|
| Der Betrieb versichert erkennbar Boote oder Betriebsrisiken | Marina mit 300 Liegeplätzen |
| Der Betrieb vermittelt erkennbar an Bootskäufer | Händler mit Neubootverkauf |
| Der Verein hält erkennbar eigene Boote oder Anlagen | Clubflotte, Steganlage |

| **Kein** Sachbezug |
|---|
| „Steht in unserer Liste" |
| „Hat eine Website" |
| „Score über 75" |

Ein Score begründet keinen Sachbezug. Er beschreibt unser Interesse, nicht das
des Angerufenen.

---

## 4. Die vier Übergänge des Auftrags

### 4.1 Wann wird ein Ziel **Marketingkontakt**?

**Marketingkontakt = ansprechbar für werbliche Inhalte.**

| Bedingung | Pflicht |
|---|---|
| Rechtsgrundlage dokumentiert | ja |
| Kanal in der Matrix erlaubt | ja |
| Kein Sperrvermerk | ja |
| Widerspruchshinweis erteilt | ja |

Ein recherchiertes Objekt ist damit **postalisch** Marketingkontakt, sobald es
freigegeben ist — und **niemals automatisch** per E-Mail.

### 4.2 Wann wird ein Kontakt **Newsletter-Empfänger**?

**Nur nach eigener, nachweisbarer Anmeldung mit Bestätigung (Double Opt-in).**

| Zulässiger Weg | Nicht zulässig |
|---|---|
| Anmeldung auf der Website mit Bestätigungsmail | Übernahme aus der Recherche |
| Anmeldung am Messestand mit unterschriebenem Beleg | Übernahme aus einer Visitenkarte ohne Beleg |
| Ausdrückliche Bitte im Gespräch, protokolliert | Ableitung aus „hat Interesse gezeigt" |
| Anmeldung im Partnerportal | Übernahme aus einem Verzeichnis |

**Technisch bindend gegenüber Brevo:** An die Newsletter-Engine wird **nur**
übergeben, wer eine `EINWILLIGUNG` mit `zweck = MARKETING`,
`rechtsgrundlage = EINWILLIGUNG` und `erteilt = true` besitzt. Der Rechercheraum
hat **keine** Schnittstelle zu Brevo — nicht einmal eine gesperrte. Was nicht
verbunden ist, kann nicht versehentlich verbunden werden.

### 4.3 Wann wird eine Organisation **Partnerkontakt**?

| Stufe | Bedingung | Wirkung |
|---|---|---|
| **Interessent** | Freigegeben | Sichtbar im CRM, kein Portalzugang |
| **In Anbahnung** | Pipeline ab `TERMIN` | Ansprechpartner benannt |
| **Partner** | Unterzeichnete Vereinbarung liegt als Dokument vor | Rolle wird gesetzt, `portalzugang` möglich |

**Der Portalzugang hängt an der unterschriebenen Vereinbarung, nicht am
Pipelinestatus.** Ein Zugang ohne Vertragsgrundlage ist ein offener Zugriff auf
Kundendaten — genau der Fall, den das Rollenmodell des Kern-CRM ausschließt.

### 4.4 Wann wird eine Organisation **Kunde**?

Wenn ein eigener Antrag oder Vertrag besteht. Das ist keine Entscheidung dieses
Moduls, sondern die Definition aus dem Kern-CRM.

**Wichtig: Partner und Kunde schließen einander nicht aus.** Der Händler, der
den Dealer Hub nutzt und seine Betriebshaftpflicht bei uns hat, ist beides — eine
Organisation, zwei Rollen, ein Kundendatensatz. Genau dafür ist das Modell
gebaut.

---

## 5. Was postalisch tatsächlich verschickt wird

Weil Post der Hauptkanal ist, ist die Qualität des Anschreibens keine
Marketingfrage, sondern eine Systemfrage:

| Bestandteil | Grund |
|---|---|
| Namentliche Anrede, wenn ein Ansprechpartner belegt ist | Ein „Sehr geehrte Damen und Herren" an einen Verein landet im Papierkorb des Postfachs |
| Konkreter Bezug zum Revier und zur Zielgruppe | Zeigt, dass es kein Massenversand ist — was es auch nicht ist |
| **Herkunftsangabe der Daten** | Erfüllt einen Teil der Informationspflicht und beantwortet die erste Frage im Rückruf |
| Widerspruchsmöglichkeit, einfach und kostenlos | Pflicht — und ein Widerspruch ist besser als ein verärgerter Nichtempfänger |
| Genau ein Anliegen | Zwei Anliegen halbieren die Antwortquote |

Auflagenhöhe je Aussendung: **klein und revierweise**, nie flächendeckend. Ein
Rücklauf, den zwei Personen nicht bearbeiten können, ist kein Erfolg, sondern
ein Schaden am Ruf.

---

## 6. Was dieses Modul dem Marketing übergibt — und was nicht

| Übergeben | Nicht übergeben |
|---|---|
| Organisationen mit Rolle und Revier für Gebietsplanung | E-Mail-Adressen aus der Recherche |
| Aggregierte Zahlen für Zielgruppenplanung | Ansprechpartnernamen ohne Einwilligung |
| Anlässe: Messe, Saisonbeginn, Verbandstermine | Scores — sie sind Vertriebs-, keine Marketinggröße |
| Bestätigte Newsletter-Anmeldungen | Alles Übrige |
