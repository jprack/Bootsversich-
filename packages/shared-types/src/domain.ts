/** Gemeinsame Aufzählungen der Fachdomäne. */

export const COUNTRIES = ['AT', 'DE'] as const;
export type Country = (typeof COUNTRIES)[number];

/** Anzeige-Zeitzone je Land (docs/callidus/data-mapping.md §5). */
export const COUNTRY_TIME_ZONE: Readonly<Record<Country, string>> = {
  AT: 'Europe/Vienna',
  DE: 'Europe/Berlin',
};

export const COUNTRY_LOCALE: Readonly<Record<Country, string>> = {
  AT: 'de-AT',
  DE: 'de-DE',
};

export const LEAD_SOURCES = [
  'WEBSITE',
  'REFERRAL',
  'PHONE',
  'EMAIL',
  'EVENT',
  'PARTNER',
  'OTHER',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'CONVERTED', 'LOST'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_LOST_REASONS = [
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'PRICE',
  'COMPETITOR',
  'NOT_INSURABLE',
  'DUPLICATE',
  'OTHER',
] as const;
export type LeadLostReason = (typeof LEAD_LOST_REASONS)[number];

export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type Priority = (typeof PRIORITIES)[number];

/**
 * Rechtsgrundlage der Verarbeitung. Ohne Rechtsgrundlage wird nicht
 * verarbeitet — deshalb ist dieses Feld an `Consent` verpflichtend.
 */
export const CONSENT_PURPOSES = [
  'QUOTE_PROCESSING',
  'CONTACT_BY_EMAIL',
  'CONTACT_BY_PHONE',
  'TRANSFER_TO_INSURER',
  'MARKETING',
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const LEGAL_BASES = [
  'CONSENT',
  'CONTRACT',
  'LEGAL_OBLIGATION',
  'LEGITIMATE_INTEREST',
] as const;
export type LegalBasis = (typeof LEGAL_BASES)[number];

/** Einwilligungen, ohne die kein Vorgang die Tarifierung erreichen darf. */
export const REQUIRED_CONSENTS_FOR_QUOTE: readonly ConsentPurpose[] = [
  'QUOTE_PROCESSING',
  'TRANSFER_TO_INSURER',
];

export const PRODUCT_SCHEMA_STATUSES = ['DRAFT', 'APPROVED', 'RETIRED'] as const;
export type ProductSchemaStatus = (typeof PRODUCT_SCHEMA_STATUSES)[number];

export const QUOTE_REQUEST_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'ANSWERED',
  'FAILED',
  'CANCELLED',
] as const;
export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUSES)[number];

export const PAYMENT_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

export const QUOTE_ORIGINS = ['MOCK', 'MANUAL', 'CALLIDUS_API'] as const;
export type QuoteOrigin = (typeof QUOTE_ORIGINS)[number];

export const QUOTE_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type QuoteApprovalStatus = (typeof QUOTE_APPROVAL_STATUSES)[number];

/**
 * Ergebnis einer einzelnen Prüfregel.
 * `UNKNOWN` bedeutet: die Regel konnte nicht entscheiden. Das ist ausdrücklich
 * kein `PASS` — es erzwingt eine menschliche Prüfung.
 */
export const VALIDATION_OUTCOMES = ['PASS', 'WARNING', 'FAIL', 'UNKNOWN'] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export const VALIDATION_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

export const HUMAN_DECISIONS = ['ACCEPTED', 'REJECTED', 'CORRECTED'] as const;
export type HumanDecision = (typeof HUMAN_DECISIONS)[number];

/** Ergebnisse, die eine menschliche Prüfung erzwingen. */
export const OUTCOMES_REQUIRING_REVIEW: readonly ValidationOutcome[] = [
  'WARNING',
  'FAIL',
  'UNKNOWN',
];

export const DOCUMENT_TYPES = [
  'QUOTE_DOCUMENT',
  'APPLICATION_FORM',
  'SIGNED_APPLICATION',
  'IDENTITY_PROOF',
  'CUSTOMER_UPLOAD',
  'PRIVACY_NOTICE',
  'ADVISORY_PROTOCOL',
  'EXPORT_PACKAGE',
  'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_ORIGINS = [
  'CUSTOMER',
  'AGENT',
  'SYSTEM',
  'CALLIDUS',
  'SIGNATURE_PROVIDER',
] as const;
export type DocumentOrigin = (typeof DOCUMENT_ORIGINS)[number];

export const SCAN_STATUSES = ['PENDING', 'CLEAN', 'INFECTED', 'FAILED'] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

/** Nur virengeprüfte, saubere Dokumente sind abrufbar oder übermittelbar. */
export const DOWNLOADABLE_SCAN_STATUSES: readonly ScanStatus[] = ['CLEAN'];

export const ACCESS_CLASSES = ['INTERNAL', 'CUSTOMER_VISIBLE', 'RESTRICTED'] as const;
export type AccessClass = (typeof ACCESS_CLASSES)[number];

export const SIGNATURE_STATUSES = [
  'CREATED',
  'SENT',
  'OPENED',
  'SIGNED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
  'FAILED',
] as const;
export type SignatureStatus = (typeof SIGNATURE_STATUSES)[number];

/**
 * Signaturstufe (ADR-0005). Der Vorgabewert ist `UNDETERMINED` und bleibt es,
 * solange kein Anbieter geprüft ist. Das System behauptet keine QES.
 */
export const SIGNATURE_ASSURANCE_LEVELS = ['UNDETERMINED', 'SES', 'AES', 'QES'] as const;
export type SignatureAssuranceLevel = (typeof SIGNATURE_ASSURANCE_LEVELS)[number];

export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const COMMUNICATION_CHANNELS = ['EMAIL', 'PORTAL_MESSAGE', 'SYSTEM_NOTIFICATION'] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_STATUSES = [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'SUPPRESSED',
] as const;
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export const TRANSMISSION_DIRECTIONS = ['OUTBOUND', 'INBOUND'] as const;
export type TransmissionDirection = (typeof TRANSMISSION_DIRECTIONS)[number];

export const TRANSMISSION_CHANNELS = ['MOCK', 'MANUAL_EXPORT', 'MANUAL_IMPORT', 'API'] as const;
export type TransmissionChannel = (typeof TRANSMISSION_CHANNELS)[number];

export const TRANSMISSION_STATUSES = [
  'PREPARED',
  'IN_PROGRESS',
  'CONFIRMED',
  'FAILED',
  'ABORTED',
] as const;
export type TransmissionStatus = (typeof TRANSMISSION_STATUSES)[number];

export const TRANSMISSION_KINDS = ['QUOTE_REQUEST', 'APPLICATION', 'DOCUMENT'] as const;
export type TransmissionKind = (typeof TRANSMISSION_KINDS)[number];
