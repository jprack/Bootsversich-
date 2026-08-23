# Domänenmodell

## Leitentscheidungen

1. **Lead, Person und Vorgang sind getrennt.** Ein Lead ist eine vertriebliche
   Absicht und kann existieren, bevor eine Person zweifelsfrei identifiziert
   ist. Ein Vorgang (`InsuranceCase`) ist der prozessuale Kern und trägt die
   Statusmaschine.
2. **Kein universeller JSON-Klumpen.** Zentrale CRM-Felder sind relational.
   `JSONB` ist ausschließlich für produktspezifische Risikodaten zugelassen —
   mit JSON-Schema, gespeicherter Schemaversion und relational gespiegelten
   Suchfeldern.
3. **Angebotsdaten sind unveränderlich.** Eine Änderung erzeugt eine neue
   `QuoteRequestVersion` beziehungsweise ein neues `Quote`, niemals ein
   Überschreiben.
4. **Geldbeträge sind `Decimal(14,2)` mit Währung.** Kein Floating Point.
5. **Löschen ist ein Prozess, kein `DELETE`.** Siehe `docs/compliance/`.

## ER-Diagramm

```mermaid
erDiagram
    User ||--o{ UserRole : hat
    Role ||--o{ UserRole : "wird zugewiesen"
    Role ||--o{ RolePermission : bündelt
    Permission ||--o{ RolePermission : "gehört zu"

    Customer ||--o{ CustomerAddress : hat
    Customer ||--o{ ContactMethod : hat
    Customer ||--o{ Consent : erteilt
    PrivacyNoticeVersion ||--o{ Consent : "gilt für"
    Customer ||--o{ Lead : "wird zugeordnet"
    Customer ||--o{ InsuranceCase : "ist Antragsteller"

    Lead ||--o| InsuranceCase : "führt zu"
    User ||--o{ Lead : betreut
    User ||--o{ InsuranceCase : betreut

    ProductDefinition ||--o{ ProductSchema : versioniert
    ProductSchema ||--o{ ProductFieldMapping : mappt
    ProductDefinition ||--o{ InsuranceCase : "Produkt des Vorgangs"

    InsuranceCase ||--|| WorkflowInstance : besitzt
    WorkflowInstance ||--o{ WorkflowEvent : protokolliert

    InsuranceCase ||--o{ QuoteRequest : erzeugt
    QuoteRequest ||--o{ QuoteRequestVersion : versioniert
    ProductSchema ||--o{ QuoteRequestVersion : "validiert gegen"
    QuoteRequest ||--o{ Quote : liefert
    Quote ||--o{ QuoteCoverage : enthaelt
    Quote ||--o{ QuoteExclusion : enthaelt

    Quote ||--o{ ValidationRun : "wird geprueft in"
    ValidationRun ||--o{ ValidationResult : ergibt
    User ||--o{ ValidationResult : entscheidet

    InsuranceCase ||--o{ Document : besitzt
    Document ||--o{ DocumentVersion : versioniert
    DocumentVersion ||--o{ SignatureEnvelope : "wird signiert in"
    SignatureEnvelope ||--o{ SignatureEvent : protokolliert

    InsuranceCase ||--o{ Task : erzeugt
    User ||--o{ Task : bearbeitet
    InsuranceCase ||--o{ Communication : ausloest
    Customer ||--o{ Communication : empfaengt

    InsuranceCase ||--o{ CallidusTransmission : uebermittelt
    CallidusTransmission ||--o{ CallidusEvent : protokolliert

    Customer ||--o{ DeletionRequest : stellt
    Customer ||--o{ DataExportRequest : stellt
    RetentionPolicy ||--o{ Document : "bestimmt Aufbewahrung"
```

`AuditEvent` steht bewusst ohne Fremdschlüsselkanten: es referenziert
Entitäten über `entityType` + `entityId`, damit das Protokoll auch dann
erhalten bleibt, wenn ein Datensatz anonymisiert wird.

## Statusmaschine des Vorgangs

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> DATA_COLLECTION
    DATA_COLLECTION --> DATA_INCOMPLETE
    DATA_INCOMPLETE --> DATA_COLLECTION
    DATA_COLLECTION --> READY_FOR_QUOTE
    READY_FOR_QUOTE --> QUOTE_SUBMISSION_PENDING
    QUOTE_SUBMISSION_PENDING --> QUOTE_SUBMITTED
    QUOTE_SUBMISSION_PENDING --> READY_FOR_QUOTE : Fehler, wiederholbar
    QUOTE_SUBMITTED --> QUOTE_RECEIVED
    QUOTE_RECEIVED --> QUOTE_VALIDATION_PENDING
    QUOTE_VALIDATION_PENDING --> QUOTE_APPROVED : alle Regeln pass
    QUOTE_VALIDATION_PENDING --> MANUAL_REVIEW_REQUIRED : warning oder fail
    MANUAL_REVIEW_REQUIRED --> QUOTE_APPROVED : Agent gibt frei
    MANUAL_REVIEW_REQUIRED --> READY_FOR_QUOTE : Agent fordert neu an
    MANUAL_REVIEW_REQUIRED --> CANCELLED
    QUOTE_APPROVED --> SENT_TO_CUSTOMER
    SENT_TO_CUSTOMER --> CUSTOMER_OPENED
    CUSTOMER_OPENED --> SIGNATURE_PENDING
    SENT_TO_CUSTOMER --> SIGNATURE_PENDING
    SIGNATURE_PENDING --> SIGNED
    SIGNATURE_PENDING --> CUSTOMER_DECLINED
    SIGNATURE_PENDING --> EXPIRED
    SENT_TO_CUSTOMER --> EXPIRED
    CUSTOMER_OPENED --> CUSTOMER_DECLINED
    SIGNED --> DOCUMENTS_INCOMPLETE
    SIGNED --> READY_FOR_CALLIDUS
    DOCUMENTS_INCOMPLETE --> READY_FOR_CALLIDUS
    READY_FOR_CALLIDUS --> CALLIDUS_SUBMISSION_PENDING
    CALLIDUS_SUBMISSION_PENDING --> SUBMITTED_TO_CALLIDUS
    CALLIDUS_SUBMISSION_PENDING --> READY_FOR_CALLIDUS : Fehler, wiederholbar
    SUBMITTED_TO_CALLIDUS --> COMPLETED
    SUBMITTED_TO_CALLIDUS --> CALLIDUS_REJECTED
    CALLIDUS_REJECTED --> DATA_COLLECTION : Nachbesserung
    CALLIDUS_REJECTED --> CANCELLED
    EXPIRED --> DATA_COLLECTION : Neuanfrage
    CUSTOMER_DECLINED --> CANCELLED
    COMPLETED --> [*]
    CANCELLED --> [*]
```

Die maßgebliche, testbare Fassung dieser Maschine liegt als Datenstruktur in
`packages/shared-types` und wird in `apps/api` erzwungen. Das Diagramm ist die
Erläuterung, nicht die Quelle.

## Warum bestimmte Felder **nicht** existieren

| Nicht modelliert                      | Grund                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Bankverbindung / IBAN                 | Im MVP für keinen Prozessschritt erforderlich (Datenminimierung). Aufnahme erst nach Beleg über F-16. |
| Gesundheitsdaten                      | Besondere Kategorie nach Art. 9 DSGVO. Kein dokumentierter Zweck im MVP.                              |
| Sozialversicherungsnummer / Steuer-ID | Kein Zweck im MVP.                                                                                    |
| Bonitätsdaten                         | Kein Zweck im MVP, würde Profiling-Anforderungen auslösen.                                            |
| Passwort-Hashes                       | Authentifizierung liegt beim OIDC-Provider.                                                           |
