# 11 — Skalierung und Roadmap

## 1. Was in Version 1 fertig sein muss — und was nicht

Der teuerste Fehler ist nicht, zu wenig zu bauen. Es ist, das Falsche zuerst zu
bauen. Diese Tabelle trennt beides.

| Ab Tag eins verbindlich | Warum ein Nachrüsten teuer wäre |
|---|---|
| `mandant_id` in jeder Kerntabelle | Migration über den gesamten Bestand bei laufendem Betrieb |
| `quelle` an jedem Datensatz | Herkunft lässt sich nachträglich nicht rekonstruieren |
| Vertragsversionierung | Eine nachträglich eingeführte Historie hat keine Vergangenheit |
| Einwilligung als eigene Entität | Ein Häkchen lässt sich nicht rückwirkend zum Nachweis machen |
| Auditprotokoll append-only | dito |
| Dublettenschlüssel an Aufgaben | Ohne ihn erzeugt der erste Wiederanlauf tausende Doppelaufgaben |
| Ereignisse über Outbox | Nachträgliche Entkopplung heißt: jede Integration neu schreiben |
| API-Vertrag vor der Umsetzung | Der einzige Hebel für parallele Arbeit |
| Objektbezogene Berechtigung | Sicherheitsregeln dürfen nicht mit der Ausbaustufe schwanken |

| Bewusst erst später | Warum es warten kann |
|---|---|
| Volltextsuche über alles | PostgreSQL-Volltext genügt bis in den fünfstelligen Bestand |
| Vertragsvergleich mehrerer Träger nebeneinander | Braucht erst mehrere angebundene Träger |
| Provisionsabrechnung | Braucht Zahlungsdaten, die noch fehlen (**C-05**) |
| Schadenverwaltung | Eigene Domäne |
| KI-Assistenz | Verstärkt Vorhandenes; ohne Vorhandenes wirkungslos |
| Mobile App | Responsive Web genügt |

---

## 2. Version 1 — Tragfähigkeit

> **Ziel:** Der Innendienst arbeitet vollständig im CRM. Excel und Postfach sind
> für Kundendaten abgelöst.

| Bereich | Umfang |
|---|---|
| **Stammdaten** | Kontakt, Adresse, Kontaktweg, Organisation mit allen sieben Rollen, Kunde, Kundenverbund |
| **Objekte** | Boot mit allen tarifrelevanten Merkmalen, Hersteller als Stammdaten |
| **Verträge** | Vertrag, Vertragsversion, Deckung, Prämie, Vertragsobjekt |
| **Vertrieb** | Lead mit Attribution, Aktivität, Aufgabe, Notiz |
| **Nachweis** | Einwilligung, Dokument mit Versionierung und Virenprüfung, Auditprotokoll |
| **Steuerung** | Regelkatalog mit den Regeln `A-01` bis `A-49`, Lastschutz |
| **Oberfläche** | Werkbank in `wp-admin`: Kundenakte, Tagesliste, Listen, Suche |
| **API** | Vollständiger Endpunktkatalog, OpenAPI erzeugt |
| **Auswertung** | Vertriebs-Dashboard, Verlängerungsvorschau, Bestandsbericht |
| **Mandanten** | AT und DE ab Beginn |

**Abnahme von Version 1:**

1. Ein Lead entsteht auf der Website, wird bewertet und erscheint priorisiert in der Tagesliste.
2. Ein Kunde mit zwei Kontakten, zwei Booten und drei Verträgen ist vollständig abbildbar.
3. Ein Vertrag wird geändert und erzeugt eine Version — die alte bleibt lesbar.
4. Der Verlängerungslauf erzeugt 90 Tage vor Hauptfälligkeit einen Vorgang, ohne Doppelaufgaben.
5. Ein Dokument wird hochgeladen, geprüft, abgerufen — jeder Schritt auditiert.
6. Ein Widerruf wirkt binnen einer Minute systemweit.
7. Eine Auskunft über eine Person ist vollständig und in unter zehn Minuten erzeugbar.

Punkt 7 ist der beste Gesamttest des Moduls: Er berührt jede Entität, jede
Berechtigung und das Audit.

**Lastannahme:** 500 Kunden · 700 Verträge · 800 Boote · 300 Leads im Monat ·
5 interne Arbeitsplätze. Die Grenzen der Umsetzung liegen weit darüber — der
Lasttest von `01_CRM_ENGINE` zeigt 5.009 Leads und 2.010 Kunden in gut
20 Sekunden Nachtlauf.

---

## 3. Version 2 — Ausbau

> **Ziel:** Kunden, Händler und Partner arbeiten selbst im System. Der
> Innendienst wird entlastet, statt mehr zu werden.

| Bereich | Neu in V2 |
|---|---|
| **Portale** | Kundenportal, Dealer Hub, Club Hub, Partnerportal auf der Kern-API |
| **Vergleich** | Mehrere Angebote nebeneinander, begründete Auswahl, Beratungsdokumentation |
| **Dokumente** | Signaturanbindung, signierte Anträge, Rücklaufkontrolle |
| **Marketing** | Segmentierung aus dem CRM heraus, Kampagnenhistorie in der Akte |
| **Datenqualität** | Dublettenprüfung im Massenlauf, Zeitwertaktualisierung, Vollständigkeitsberichte |
| **Suche** | OpenSearch für Bestand und Dokumente |
| **Reporting** | Kohorten, Trichter, Partnerberichte, Indikationsgüte |
| **Provision** | Positionen und Abrechnungslauf (**C-05**) |
| **Betrieb** | Read Replica, getrennte Auswertungslast |

**Auslöser für V2** — eines genügt: mehr als 2.000 Kunden · mehr als 20 aktive
Partner · mehr als 15 interne Arbeitsplätze · das Kundenportal wird verbindlich
zugesagt · der Innendienst ist mit manueller Auskunft ausgelastet.

---

## 4. Version 3 — Plattform

> **Ziel:** Das CRM trägt weitere Märkte, Marken und Datenprodukte.

| Bereich | Neu in V3 |
|---|---|
| **Mandanten** | Weitere Länder, White-Label-Marken für Händlerketten |
| **Schaden** | Eigenes Modul, an Vertrag und Boot angebunden |
| **KI** | Vorgangszusammenfassung, Dokumentextraktion, Antwortvorschläge — **weiterhin ohne Schreibrecht** |
| **Analytics** | Eigenes Data Warehouse, Kohorten über Jahre, Vorhersagemodelle |
| **Bestandsabgleich** | Automatischer Abgleich mit dem Versicherer, Abweichungsliste |
| **Partitionierung** | Nach Mandant und Zeit, große Mandanten auf eigenen Instanzen |
| **Verfügbarkeit** | Zwei EU-Zonen, zugesagte Verfügbarkeit gegenüber Partnern |

Jeder dieser Punkte verdoppelt einen Teil des Betriebsaufwands. Sie werden
einzeln begründet, nicht als Paket eingeführt.

---

## 5. Was über alle Versionen gleich bleibt

| Unverändert | Grund |
|---|---|
| Datenmodell und Entitäten | Ein Modellwechsel ist der teuerste aller Umbauten |
| Ereignisnamen | Nachgelagerte Systeme verlassen sich darauf |
| Statusmaschine des Vertrags | Zustände sind fachliche Wahrheit, nicht technische Wahl |
| Berechtigungsmodell | Sicherheitsregeln schwanken nicht mit der Ausbaustufe |
| Auditformat | Nachweise müssen über Jahre vergleichbar bleiben |
| Regelkatalog-Codes | `A-21` bleibt `A-21`, auch wenn sich die Frist ändert |

Was sich ändert, ist ausschließlich **Umfang und Oberfläche** — nicht die
Grundlage.

---

## 6. Umsetzungsreihenfolge in Version 1

Acht Schnitte, jeder für sich abnahmefähig. Die Reihenfolge folgt der Regel:
zuerst, was andere blockiert.

| # | Schnitt | Inhalt | Abnahme |
|---|---|---|---|
| **1** | **Verträge festschreiben** | OpenAPI-Definition, Ereigniskatalog, Datenbankschema als ausführbares DDL | Frontend und Integration können gegen Mocks bauen |
| **2** | Stammdaten | Kontakt, Adresse, Kontaktweg, Organisation, Rollen, Kunde, Kundenverbund, Einwilligung | Ein Kunde mit zwei Kontakten ist vollständig abbildbar |
| **3** | Werkbank-Grundgerüst | `wp-admin`-Menü, Core Bridge, Listen, Suche, Rollen-Mapping | Der Innendienst legt eine Person an und findet sie wieder |
| **4** | Boote und Hersteller | Vollständiges Bootsmodell, Herstellerliste mit Premiumkennzeichen | `/boats/{id}/risk-attributes` liefert dem Tarifwerk alles Nötige |
| **5** | Verträge | Vertrag, Version, Deckung, Prämie, Vertragsobjekt, Statusmaschine | Eine Änderung erzeugt eine Version, die alte bleibt lesbar |
| **6** | Leads und Aktivitäten | Lead mit Attribution, Aktivität, Notiz, Umwandlung | Ein Formular erzeugt einen Lead mit Nachweis |
| **7** | Aufgaben und Regelkatalog | Aufgaben, Dublettenschutz, Eskalation, Regeln `A-01` bis `A-49`, Lastschutz | Der Verlängerungslauf erzeugt Vorgänge ohne Doppelaufgaben |
| **8** | Dokumente und Kundenakte | Dokumente mit Versionen und Scan, gebündelte Akte, Dashboards | Die Akte lädt in unter 700 ms, eine Auskunft ist erzeugbar |

### Was parallel laufen kann

| Strang | Ab wann | Bedingung |
|---|---|---|
| Oberfläche | nach Schnitt 1 | Baut gegen Mocks |
| Integration (Brevo, Power Automate) | nach Schnitt 1 | Baut gegen Mocks |
| Regelkatalog fachlich ausarbeiten | sofort | Braucht keinen Entwickler |
| Tarife auf die Import-Vorlage zuordnen | sofort | Braucht keinen Entwickler |
| Datenschutzunterlagen | sofort | Läuft parallel, verhindert später Stillstand |
| Bestandsübernahme vorbereiten | sofort | Datenqualität prüfen (**C-03**) |

**Schnitt 1 ist der Engpass der gesamten Roadmap.** Stehen die Verträge, können
sechs Stränge parallel arbeiten. Entstehen sie erst mit dem Code, kollabieren
sie auf einen.

---

## 7. Risiken

| ID | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **CR-01** | Fachdaten wandern schleichend nach WordPress | Die zentrale Trennung fällt, Sicherheit und Nachweisbarkeit sind verloren | Kein Fachdatum in `wp_postmeta` — Gegenstand jeder Codeprüfung. Getrennte Datenbanken, getrennte Zugangsdaten |
| **CR-02** | Der erste Regellauf erzeugt tausende Aufgaben | Das System wird ignoriert, dauerhaft | **Trockenlauf gegen den echten Bestand vor jeder Aktivierung.** Lastschutz von Beginn an |
| **CR-03** | Automatische Dublettenzusammenführung wird „aus Bequemlichkeit" eingebaut | Praktisch nicht rückgängig zu machen | Modell und API kennen nur Vorschläge |
| **CR-04** | Die Kundenakte lädt langsam | Der Innendienst weicht auf Excel aus, und das Modul ist gescheitert | Gebündelter `/dossier`-Endpunkt, Reiter werden nachgeladen, Leistungsziele als Abnahmekriterium |
| **CR-05** | Bestandsübernahme unterschätzt | Verzug, schlechte Datenqualität von Anfang an | Eigener Strang, Datenqualität früh prüfen (**C-03**) |
| **CR-06** | Regelpflege hat keine verantwortliche Person | Regeln veralten still, niemand merkt es | Benannte Person; monatlicher Bericht Regelwirkung |
| **CR-07** | Die API entsteht erst mit der Umsetzung | Parallelisierung entfällt, Termin vervielfacht sich | Schnitt 1 ist unverhandelbar |
| **CR-08** | Einwilligungen werden nachlässig erfasst | Ganze Segmente sind nicht ansprechbar, rückwirkend nicht heilbar | Ohne Rechtsgrundlage entsteht kein Datensatz — technisch erzwungen |
| **CR-09** | Zu viele Pflichtfelder in der Anfrage | Abbrüche auf der Website | Drei Stufen: Anfrage, Angebot, Antrag |

---

## 8. Empfehlung

| Sofort beginnen | Warum |
|---|---|
| **API-Vertrag und Ereigniskatalog festschreiben** | Der einzige Hebel auf den Termin |
| Regelkatalog fachlich ausarbeiten | Braucht keinen Entwickler und bestimmt, wie gut das System im Alltag wirkt |
| **C-02** klären: Kundennummernkreis | Rückwirkend nicht änderbar |
| **C-03** klären: Gibt es Altdaten, in welcher Qualität? | Bestimmt die Reihenfolge in Version 1 |
| **C-04** klären: Wie viele Arbeitsplätze gleichzeitig? | Entscheidet über die Oberflächenarchitektur |

| Bewusst später | Warum |
|---|---|
| Portale | Brauchen erst gefüllte Stammdaten |
| Provisionsabrechnung | Braucht Zahlungsdaten |
| KI-Assistenz | Verstärkt Vorhandenes |
| Schaden | Eigene Domäne, eigene Architekturphase |
