# Callidus — Offene Punkte

Status: `offen` | `beantwortet` | `entschieden` | `verworfen`

| ID | Punkt | Auswirkung | Blockiert | Status | Nächster Schritt |
|---|---|---|---|---|---|
| O-01 | **Namenskonflikt:** „Callidus" bezeichnet im Bestandsmodul `01_CRM_ENGINE` die eigene Plattform, im MVP-Auftrag die externe Versicherungsplattform. | Mehrdeutigkeit in Code, Dokumentation und Verträgen. | Benennung öffentlicher Artefakte | offen | Klärung durch Produktverantwortung; bis dahin gilt ADR-0002. |
| O-02 | Keine belegte Produktliste (F-01…F-03). | Produktkonfiguration ist synthetisch. | reale Tarifierung | offen | Fragebogen versenden. |
| O-03 | Keine belegten Pflichtfelder je Produkt (F-04). | `ProductSchema` ist Platzhalter. | reale Formulare | offen | Fragebogen versenden. |
| O-04 | Kein belegter Übertragungsweg (F-05…F-11). | `RealCallidusAdapter` bleibt deaktiviert. | gesamte reale Integration | offen | Fragebogen versenden. |
| O-05 | Keine belegten Statuswerte und Fehlercodes (F-13). | Interne Statusmaschine kann nicht auf externe Werte gemappt werden. | Statusrückmeldung | offen | Fragebogen versenden. |
| O-06 | Portalautomatisierung rechtlich ungeklärt (F-19). | Screen Scraping ist untersagt, bis schriftliche Erlaubnis vorliegt. | jede Portal-Automatisierung | offen | Rechtliche Prüfung + schriftliche Freigabe. |
| O-07 | Auftragsverarbeitung / Datenstandort ungeklärt (F-18). | Keine Übermittlung produktiver personenbezogener Daten zulässig. | Produktivbetrieb | offen | AVV einholen, Datenschutzprüfung. |
| O-08 | Signaturanbieter nicht ausgewählt. | Signaturstufe (EES/FES/QES) unbestimmt. | reale Signatur | offen | Anbieterauswahl, siehe ADR-0005. |
| O-09 | Hostingstandort und Betreibermodell nicht festgelegt. | Datenschutzprüfung nicht abschließbar. | Produktivbetrieb | offen | Entscheidung Produktverantwortung. |
| O-10 | Rechtliche Anforderungen an Erstinformation und Beratungsprotokoll (AT: GewO/VersVermV, DE: VVG/VersVermV) nicht geprüft. | Öffentliche Website und Angebotsversand ggf. unvollständig. | Produktivbetrieb | offen | Rechtsberatung. |
