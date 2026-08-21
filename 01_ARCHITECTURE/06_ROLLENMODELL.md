# 06 — Rollenmodell

## 1. Grundsätze

| Nr. | Grundsatz |
|---|---|
| **R1** | Jede Berechtigung wird **serverseitig** geprüft. Eine ausgeblendete Schaltfläche ist keine Zugriffskontrolle. |
| **R2** | Berechtigung hat zwei Stufen: **Darf diese Rolle das überhaupt?** und **Gehört dieses konkrete Objekt zum Zugriffsbereich?** Beide werden geprüft, jedes Mal. |
| **R3** | Fremde Objekte liefern `404`, nicht `403`, wenn schon die Existenz eine Information wäre. |
| **R4** | Rollen werden im Identitätsanbieter zugewiesen, Rechte im Domänenkern ausgewertet. WordPress-Rollen sind eine **Ableitung**, nie die Quelle. |
| **R5** | Die wirtschaftlich bindende Handlung — Angebot freigeben — ist von der vorbereitenden Arbeit getrennt. |
| **R6** | Jeder Fehlzugriff erzeugt einen Auditeintrag. Ein Angriff, der nichts hinterlässt, wird nicht bemerkt. |

---

## 2. Die sechs Geschäftsrollen

### Administrator

| | |
|---|---|
| **Wer** | Technische und fachliche Systemverwaltung |
| **Aufgabe** | Benutzer und Rollen, Produktkonfiguration, Regeln, Vorlagen, Aufbewahrungsregeln, Feature Flags, Audit-Einsicht |
| **Datenbereich** | Alle Mandanten, für die die Zuweisung gilt |
| **Bewusste Grenze** | **Kein fachliches Freigaberecht für Angebote.** Verwaltung und Vertrieb sind getrennt; sonst genügt ein einziges übernommenes Konto, um Verträge auszulösen |
| **Pflicht** | Mehrfaktor-Anmeldung. Jede Handlung vollständig auditiert |

### Vertrieb

| | |
|---|---|
| **Wer** | Angestellte Vertriebsmitarbeitende und der Versicherungsagent selbst |
| **Aufgabe** | Leads bearbeiten, beraten, Angebote einholen und freigeben, Kunden betreuen, Aufgaben abarbeiten |
| **Datenbereich** | Eigene und Team-Vorgänge im eigenen Mandanten |
| **Besonderes Recht** | `angebot:freigeben` — als einzige Rolle |
| **Grenze** | Keine Benutzerverwaltung, keine Produktkonfiguration, keine Audit-Einsicht |

### Innendienst

> Nicht in der Auftragsliste genannt, in der Praxis aber unverzichtbar: Ohne
> diese Rolle müsste jede vorbereitende Tätigkeit mit Vertriebsrechten
> erfolgen — dann wäre die Trennung aus R5 wirkungslos.

| | |
|---|---|
| **Aufgabe** | Daten erfassen, Unterlagen anfordern und prüfen, Vorgänge vorbereiten, Angebote einholen |
| **Datenbereich** | Alle Vorgänge des Mandanten |
| **Grenze** | **Keine Angebotsfreigabe.** Keine Benutzerverwaltung |

### Makler

| | |
|---|---|
| **Wer** | Selbständige Vermittler mit eigenem Bestand, angebunden über das Partnerportal |
| **Aufgabe** | Eigene Kunden und Verträge betreuen, Anfragen stellen, Unterlagen austauschen, Provisionen einsehen |
| **Datenbereich** | **Ausschließlich der eigene Bestand** — Zuordnung über `Vertrag.vermittler_organisation_id` |
| **Grenze** | Sieht keine fremden Kunden, keine fremden Provisionen, keine internen Scores und keine Kalkulationsgrundlagen |
| **Rechtlicher Hinweis** | Vermittlerregistrierung ist Pflichtfeld der Organisationsrolle. Ohne Eintrag kein Portalzugang (**A-02**) |

### Partner

| | |
|---|---|
| **Wer** | Händler, Bootsclubs, Werften, Sachverständige, Serviceanbieter |
| **Aufgabe** | Interessenten empfehlen, Aufträge annehmen und erledigen, Unterlagen liefern, eigene Stammdaten und Inhalte pflegen |
| **Datenbereich** | Eigene Organisation, eigene Empfehlungen, eigene Aufträge |
| **Grenze** | Sieht **den Status** einer Empfehlung, nicht die Kundenakte. Keine Prämien, keine Vertragsdetails, keine Kontaktdaten anderer Interessenten |
| **Abstufung** | Über die Organisationsrolle: `HAENDLER` sieht Bestandsobjekte und Provisionen, `CLUB` sieht Veranstaltungen und Reichweite, `LIEFERANT` sieht nur Aufträge |

### Kunde

| | |
|---|---|
| **Wer** | Versicherungsnehmer und mitversicherte Personen mit eigenem Zugang |
| **Aufgabe** | Verträge und Boote einsehen, Daten ergänzen, Dokumente hoch- und herunterladen, Änderungen beantragen, Verlängerung bestätigen, Datenschutzrechte wahrnehmen |
| **Datenbereich** | **Ausschließlich eigene Objekte** |
| **Grenze** | Kein Zugriff auf Scores, interne Notizen, Aktivitätenprotokolle oder Kalkulationen |

### Marketing

| | |
|---|---|
| **Aufgabe** | Kampagnen planen, Inhalte und Landingpages erstellen, Newsletter versenden, Wirkung auswerten |
| **Datenbereich** | Segmente und aggregierte Auswertungen; personenbezogene Einzeldaten nur, soweit für den Versand erforderlich |
| **Grenze** | **Kein Zugriff auf Vertrags- und Prämiendaten.** Kein Export von Personendaten ohne zweite Freigabe |
| **Besonderes** | Segmente werden über Merkmale gebildet, nicht über Listen kopierter Personendaten |

### Systemrollen (keine Menschen)

| Rolle | Zweck | Grenze |
|---|---|---|
| `DIENSTKONTO_WORDPRESS` | Aufrufe der Plattformschicht an den Kern | Nur die für Portale nötigen Endpunkte |
| `DIENSTKONTO_KONNEKTOR` | Brevo, Power Automate, Versicherer | Je Konnektor eigenes Konto, eigene Rechte |
| `DIENSTKONTO_ANALYTICS` | Lesen der Read Replica | Ausschließlich lesend, keine Personendaten im Klartext |
| `DIENSTKONTO_KI` | Lesen für Assistenzfunktionen | Ausschließlich lesend, pseudonymisiert |

---

## 3. Rechtematrix

`V` = vollständig · `T` = Team- oder Organisationsbereich · `E` = ausschließlich
eigene Objekte · `A` = nur aggregiert · `—` = kein Zugriff

| Bereich | Admin | Vertrieb | Innendienst | Makler | Partner | Kunde | Marketing |
|---|---|---|---|---|---|---|---|
| Kontakt lesen | V | T | V | E | — | E | A |
| Kontakt ändern | — | T | V | E | — | E | — |
| Kunde lesen | V | T | V | E | — | E | A |
| Vertrag lesen | V | T | V | E | — | E | — |
| Vertrag ändern | — | T | V | E | — | — | — |
| Boot lesen | V | T | V | E | E¹ | E | — |
| Lead lesen | V | T | V | E | E² | — | A |
| Lead anlegen | V | V | V | V | V | — | V |
| **Angebot freigeben** | **—** | **T** | **—** | **E** | **—** | **—** | **—** |
| Angebot anfordern | — | T | V | E | — | — | — |
| Dokument lesen | V | T | V | E | E³ | E | — |
| Dokument hochladen | — | T | V | E | E³ | E | — |
| Aufgabe lesen und bearbeiten | V | T | V | E | E | — | — |
| Vorgang: Übergang auslösen | — | T | T⁴ | E | E⁴ | E⁴ | — |
| Kampagne verwalten | V | — | — | — | — | — | V |
| Newsletter versenden | — | — | — | — | — | — | V |
| Segment bilden | V | T | — | — | — | — | V |
| Organisation verwalten | V | T | V | E | E | — | — |
| Provision einsehen | V | T | — | E | E¹ | — | — |
| Benutzer und Rollen | V | — | — | — | — | — | — |
| Produktkonfiguration | V | — | — | — | — | — | — |
| Auditprotokoll lesen | V | — | — | — | — | — | — |
| Datenschutzanliegen bearbeiten | V | — | T | — | — | E | — |
| Auswertung ansehen | V | T | T | E | E | E | V |
| Personendaten exportieren | V⁵ | T⁵ | — | E⁵ | — | E | —⁵ |

¹ nur eigene Bestandsobjekte · ² nur selbst empfohlene Leads · ³ nur Dokumente
eigener Vorgänge · ⁴ nur die für die Rolle vorgesehenen Übergänge · ⁵ nur nach
erneuter Autorisierung, vollständig auditiert

---

## 4. Sichtbarkeitsregeln

Die Matrix sagt, *was* eine Rolle darf. Diese Regeln sagen, *welche Zeilen* sie
dabei sieht. Sie werden als Datenbankbedingung durchgesetzt, nicht als Filter
in der Anwendung — ein vergessener Filter wäre sonst ein Datenleck.

| Rolle | Regel |
|---|---|
| Administrator | `mandant_id ∈ zugewiesene Mandanten` |
| Vertrieb | `mandant_id = eigener Mandant AND (betreuer = ich OR team = mein Team)` |
| Innendienst | `mandant_id = eigener Mandant` |
| Makler | `vertrag.vermittler_organisation_id = meine Organisation` |
| Partner | `empfehlung.organisation_id = meine Organisation` **oder** `auftrag.organisation_id = meine Organisation` |
| Kunde | `kunde_id ∈ meine Kundenzuordnungen` |
| Marketing | Aggregat ohne Einschränkung; Einzeldaten nur über eine Segmentabfrage mit Zweckangabe |

---

## 5. Abbildung auf WordPress

WordPress kennt eigene Rollen. Sie werden aus den Kernrollen **abgeleitet** und
sind bewusst schwach: Ein übernommenes WordPress-Konto darf keine Fachdaten
öffnen.

| Kernrolle | WordPress-Rolle | Fähigkeiten in WordPress |
|---|---|---|
| Administrator | `callidus_admin` | Portalkonfiguration, keine Datei- und Plugin-Verwaltung |
| Vertrieb | `callidus_staff` | Portalzugriff, keine Inhaltsbearbeitung |
| Innendienst | `callidus_staff` | wie Vertrieb |
| Makler | `callidus_broker` | Partnerportal |
| Partner | `callidus_partner` | Hub gemäß Organisationsrolle |
| Kunde | `callidus_customer` | Kundenportal |
| Marketing | `editor` + `callidus_marketing` | Inhalte, Kampagnenseiten |
| — | `administrator` | **Ausschließlich für den technischen Betrieb.** Kein Alltagskonto, Mehrfaktor-Pflicht, Datei- und Plugin-Editor abgeschaltet |

**Verbindlich:** Die WordPress-Rolle entscheidet über die Sichtbarkeit von
Menüpunkten. Sie entscheidet **nie** über die Herausgabe eines Fachdatums.
Diese Prüfung findet ausschließlich im Domänenkern statt, bei jedem Aufruf.

---

## 6. Anmeldung und Sitzung

| Rolle | Verfahren | Mehrfaktor | Sitzungsdauer |
|---|---|---|---|
| Administrator | OIDC | **Pflicht** | 30 min Leerlauf, 8 h maximal |
| Vertrieb, Innendienst | OIDC | **Pflicht** | 60 min Leerlauf, 10 h maximal |
| Makler, Partner | OIDC | Pflicht ab V2 | 30 min Leerlauf, 8 h maximal |
| Kunde | OIDC | empfohlen, wählbar | 30 min Leerlauf, 12 h maximal |
| Dienstkonten | OAuth 2.0 Client Credentials | entfällt | kurzlebige Token, Rotation |

**Ergänzend:** Für die Datenergänzung ohne Konto gibt es kurzlebige Links —
einmalig verwendbar, höchstens 30 Minuten gültig, an genau einen Vorgang und
Zweck gebunden, nur als Hashwert gespeichert, jeder Aufruf auditiert. Ein
solcher Link ersetzt keine Anmeldung und gibt nie ein Dokument frei.
