# Callidus — Technischer Fragebogen

| Feld     | Wert                                                  |
| -------- | ----------------------------------------------------- |
| Zweck    | Freischaltung der realen Integration (Discovery-Gate) |
| Adressat | Callidus — technischer Partnerkontakt                 |
| Absender | Versicherungsagent / Produktverantwortung             |
| Status   | **versandbereit, noch nicht versandt**                |

Jede Frage trägt eine stabile Nummer (`F-xx`). Antworten werden in
`capability-matrix.md` und `data-mapping.md` übernommen und in
`decision-log.md` datiert festgehalten.

---

## A. Produkte und Verfügbarkeit

| Nr.  | Frage                                                                           | Antwort | Quelle | Datum |
| ---- | ------------------------------------------------------------------------------- | ------- | ------ | ----- |
| F-01 | Welche Versicherungsprodukte dürfen über Partner technisch angeboten werden?    |         |        |       |
| F-02 | Welche dieser Produkte sind in **Österreich** verfügbar?                        |         |        |       |
| F-03 | Welche dieser Produkte sind in **Deutschland** verfügbar?                       |         |        |       |
| F-04 | Welche Pflichtfelder benötigt jedes Produkt zur Tarifierung, welche zum Antrag? |         |        |       |

## B. Technische Schnittstelle

| Nr.  | Frage                                                                                                       | Antwort | Quelle | Datum |
| ---- | ----------------------------------------------------------------------------------------------------------- | ------- | ------ | ----- |
| F-05 | Existiert eine REST-, SOAP-, GraphQL- oder sonstige API?                                                    |         |        |       |
| F-06 | Existieren OpenAPI-, Swagger-, WSDL- oder vergleichbare Spezifikationen?                                    |         |        |       |
| F-07 | Existiert eine Sandbox oder Testumgebung? Wie wird Zugang beantragt?                                        |         |        |       |
| F-08 | Welches Authentifizierungsverfahren wird verwendet (OAuth2 Client Credentials, mTLS, API-Key, sonstiges)?   |         |        |       |
| F-09 | Gibt es Webhooks oder ausschließlich Statusabfragen (Polling)? Bei Webhooks: wie wird die Signatur geprüft? |         |        |       |

## C. Datenaustausch

| Nr.  | Frage                                                                                           | Antwort | Quelle | Datum |
| ---- | ----------------------------------------------------------------------------------------------- | ------- | ------ | ----- |
| F-10 | Wie werden Angebotsanfragen, Angebote, Anträge und Dokumente technisch übertragen?              |         |        |       |
| F-11 | Welche Dateiformate werden unterstützt (PDF, XML, JSON, GDV, BiPRO, CSV)? Existiert ein Schema? |         |        |       |
| F-12 | Welche IDs dienen zur Korrelation eines Vorgangs über alle Schritte hinweg? Wer vergibt sie?    |         |        |       |
| F-13 | Welche Statuswerte und Fehlercodes existieren? Gibt es eine abschließende Liste?                |         |        |       |
| F-14 | Welche Rate Limits, Wartungsfenster und Verfügbarkeitszusagen gelten?                           |         |        |       |
| F-15 | Wie werden Schnittstellenänderungen versioniert und angekündigt (Vorlauffrist)?                 |         |        |       |

## D. Datenschutz und Recht

| Nr.  | Frage                                                                                                                                                | Antwort | Quelle | Datum |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ----- |
| F-16 | Welche personenbezogenen Daten dürfen beziehungsweise müssen übertragen werden? Gibt es Felder, die ausdrücklich **nicht** übertragen werden dürfen? |         |        |       |
| F-17 | Welche Aufbewahrungs- und Löschregeln gelten auf Callidus-Seite?                                                                                     |         |        |       |
| F-18 | Welche Auftragsverarbeitungs- oder Datenschutzvereinbarungen sind notwendig? Wo liegen die Verarbeitungsstandorte (EU/EWR)?                          |         |        |       |
| F-19 | Ist die Automatisierung des Partnerportals ausdrücklich erlaubt? Falls nein: welcher Weg ist der freigegebene?                                       |         |        |       |
| F-20 | Welche Branding-, Beratungs- und Vertriebsanforderungen gelten für Partner (Impressum, Erstinformation, Beratungsprotokoll)?                         |         |        |       |

---

## Hinweis zur Beantwortung

Bitte technische Unterlagen als Anhang beifügen. Eine mündliche Zusage genügt
für die Freischaltung der Integration nicht (siehe `capability-matrix.md` §1).
Bis zum Vorliegen der Antworten arbeitet das System mit einem dokumentierten
manuellen Prozess (`manual-fallback.md`).
