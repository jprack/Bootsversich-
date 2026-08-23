# Nicht-Ziele des MVP

Diese Punkte sind **bewusst** ausgeschlossen. Ausschluss bedeutet nicht
„unwichtig", sondern „nicht in diesem Schnitt".

| #   | Nicht-Ziel                                               | Begründung                                                                                                                    | Frühestens          |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Schadenmanagement                                        | Eigene Domäne mit eigenem Lebenszyklus und eigenen Rechtsanforderungen.                                                       | nach MVP            |
| 2   | Provisions- und Courtageabrechnung                       | Erfordert Vertrags- und Zahlungsdaten, die das MVP nicht besitzt.                                                             | nach MVP            |
| 3   | Vollautomatisches Cross- und Upselling                   | Setzt belastbare Bestandsdaten und geprüfte Rechtsgrundlage voraus.                                                           | nach MVP            |
| 4   | Native Mobile Apps                                       | Responsive Web deckt den MVP-Bedarf.                                                                                          | nach MVP            |
| 5   | Integration weiterer Versicherungsplattformen            | Auftrag: Callidus ist die einzige Produktquelle.                                                                              | —                   |
| 6   | Automatisierung des Callidus-Partnerportals              | Ohne schriftliche Erlaubnis und Rechtsprüfung untersagt.                                                                      | nach O-06           |
| 7   | KI-gestützte Dokumentenextraktion (OCR/LLM)              | MVP arbeitet deterministisch und erklärbar. Ergänzung nur mit Confidence, menschlicher Prüfung und geprüfter Rechtsgrundlage. | nach MVP            |
| 8   | Automatische nachteilige Entscheidungen gegenüber Kunden | Untersagt. Jede nachteilige Entscheidung erfordert menschliche Freigabe.                                                      | —                   |
| 9   | Qualifizierte elektronische Signatur (QES)               | Anbieter nicht ausgewählt, Signaturstufe unbestimmt. Es wird keine QES behauptet.                                             | nach O-08           |
| 10  | Mandantenfähigkeit für mehrere Agenturen                 | A-01: ein Agent. Schlüssel sind vorbereitet, Trennung ist nicht aktiviert.                                                    | nach MVP            |
| 11  | Bestandsdatenmigration                                   | Kein Altdatenbestand im Umfang.                                                                                               | nach MVP            |
| 12  | Behauptung produktiver DSGVO-Konformität                 | Erfordert Datenschutzprüfung, AVV, Pentest und Freigaben. Siehe `docs/compliance/`.                                           | nach Prüfung        |
| 13  | Microservice-Architektur                                 | Ohne belegbaren Grund unnötige Komplexität.                                                                                   | bei belegtem Bedarf |
| 14  | Produktive Nutzung von Mock-Diensten                     | Ausgeschlossen. Mocks sind ausschließlich für Entwicklung und Test.                                                           | —                   |
