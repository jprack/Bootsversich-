/**
 * Statusmaschine des Versicherungsvorgangs.
 *
 * Diese Datei ist die maßgebliche Quelle. Das Diagramm in
 * docs/architecture/domain-model.md erläutert sie, ersetzt sie aber nicht.
 *
 * Grundsatz (ADR-0007): Es gibt keinen generischen Weg, einen Status zu setzen.
 * Jeder Übergang ist benannt, hat eine Berechtigung, Vorbedingungen,
 * Nebenwirkungen und erzeugt ein Audit-Ereignis.
 */

export const CASE_STATUSES = [
  'DRAFT',
  'DATA_COLLECTION',
  'DATA_INCOMPLETE',
  'READY_FOR_QUOTE',
  'QUOTE_SUBMISSION_PENDING',
  'QUOTE_SUBMITTED',
  'QUOTE_RECEIVED',
  'QUOTE_VALIDATION_PENDING',
  'MANUAL_REVIEW_REQUIRED',
  'QUOTE_APPROVED',
  'SENT_TO_CUSTOMER',
  'CUSTOMER_OPENED',
  'SIGNATURE_PENDING',
  'SIGNED',
  'CUSTOMER_DECLINED',
  'EXPIRED',
  'DOCUMENTS_INCOMPLETE',
  'READY_FOR_CALLIDUS',
  'CALLIDUS_SUBMISSION_PENDING',
  'SUBMITTED_TO_CALLIDUS',
  'CALLIDUS_REJECTED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

/** Endzustände. Aus ihnen führt kein Übergang mehr heraus. */
export const TERMINAL_CASE_STATUSES: readonly CaseStatus[] = ['COMPLETED', 'CANCELLED'];

/**
 * Wer einen Übergang auslösen darf.
 * `SYSTEM` bedeutet: nur durch einen Hintergrundjob oder ein eingehendes
 * Ereignis, nie durch einen direkten Aufruf aus dem Browser.
 */
export type TransitionActor = 'AGENT' | 'BACK_OFFICE' | 'ADMIN' | 'CUSTOMER' | 'SYSTEM';

export interface CaseTransition {
  /** Stabiler Code. Wird im Audit-Protokoll gespeichert und nie umbenannt. */
  readonly code: string;
  /** Erlaubte Ausgangszustände. */
  readonly from: readonly CaseStatus[];
  /** Zielzustand. */
  readonly to: CaseStatus;
  /** Wer den Übergang auslösen darf. */
  readonly actors: readonly TransitionActor[];
  /** Fachliche Vorbedingungen, die der Use Case prüfen muss. */
  readonly preconditions: readonly string[];
  /** Nebenwirkungen, die im selben Vorgang ausgelöst werden. */
  readonly sideEffects: readonly string[];
  /** Name des erzeugten Audit-Ereignisses. */
  readonly auditEvent: string;
  /**
   * Ob ein technischer Fehlschlag gefahrlos wiederholt werden darf.
   * Fachliche Fehler sind nie wiederholbar.
   */
  readonly retryable: boolean;
  /** Was passiert, wenn der Übergang nachträglich zurückgenommen werden muss. */
  readonly compensation: string | null;
}

export const CASE_TRANSITIONS: readonly CaseTransition[] = [
  {
    code: 'CASE_START_DATA_COLLECTION',
    from: ['DRAFT'],
    to: 'DATA_COLLECTION',
    actors: ['AGENT', 'BACK_OFFICE', 'SYSTEM'],
    preconditions: [
      'Produkt und Land sind gesetzt',
      'Eine gültige ProductSchema-Version ist zugeordnet',
    ],
    sideEffects: ['WorkflowInstance wird angelegt'],
    auditEvent: 'case.data_collection_started',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_MARK_DATA_INCOMPLETE',
    from: ['DATA_COLLECTION'],
    to: 'DATA_INCOMPLETE',
    actors: ['SYSTEM', 'AGENT', 'BACK_OFFICE'],
    preconditions: ['Mindestens ein Pflichtfeld des ProductSchema fehlt'],
    sideEffects: [
      'Aufgabe für den zuständigen Agenten',
      'Optional: Kundenanfrage zur Datenergänzung',
    ],
    auditEvent: 'case.data_marked_incomplete',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_RESUME_DATA_COLLECTION',
    from: ['DATA_INCOMPLETE', 'EXPIRED', 'CALLIDUS_REJECTED'],
    to: 'DATA_COLLECTION',
    actors: ['AGENT', 'BACK_OFFICE', 'CUSTOMER'],
    preconditions: ['Vorgang ist nicht abgeschlossen oder storniert'],
    sideEffects: ['Offene Erinnerungen werden zurückgesetzt'],
    auditEvent: 'case.data_collection_resumed',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_MARK_READY_FOR_QUOTE',
    from: ['DATA_COLLECTION'],
    to: 'READY_FOR_QUOTE',
    actors: ['SYSTEM', 'AGENT', 'BACK_OFFICE'],
    preconditions: [
      'Alle Pflichtfelder des zugeordneten ProductSchema sind belegt',
      'Erforderliche Einwilligungen liegen vor',
      'Serverseitige Validierung ist fehlerfrei',
    ],
    sideEffects: ['QuoteRequestVersion wird eingefroren'],
    auditEvent: 'case.ready_for_quote',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_SUBMIT_QUOTE_REQUEST',
    from: ['READY_FOR_QUOTE', 'MANUAL_REVIEW_REQUIRED'],
    to: 'QUOTE_SUBMISSION_PENDING',
    actors: ['AGENT', 'BACK_OFFICE', 'SYSTEM'],
    preconditions: [
      'Ein Callidus-Adapter ist für Produkt und Land konfiguriert',
      'Idempotenzschlüssel ist vergeben',
    ],
    sideEffects: ['CallidusTransmission wird angelegt', 'Übermittlungsjob wird eingereiht'],
    auditEvent: 'case.quote_request_submitted',
    retryable: true,
    compensation: 'Übertragung als abgebrochen markieren, Vorgang zurück nach READY_FOR_QUOTE',
  },
  {
    code: 'CASE_QUOTE_SUBMISSION_FAILED',
    from: ['QUOTE_SUBMISSION_PENDING'],
    to: 'READY_FOR_QUOTE',
    actors: ['SYSTEM'],
    preconditions: ['Der Fehler ist technischer Natur und wiederholbar'],
    sideEffects: ['Aufgabe für den Agenten', 'CallidusEvent mit Fehlercode'],
    auditEvent: 'case.quote_submission_failed',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_CONFIRM_QUOTE_SUBMITTED',
    from: ['QUOTE_SUBMISSION_PENDING'],
    to: 'QUOTE_SUBMITTED',
    actors: ['SYSTEM', 'AGENT'],
    preconditions: [
      'Übermittlung ist bestätigt',
      'Externe Referenz ist erfasst, sofern die Gegenseite eine vergibt',
    ],
    sideEffects: ['Frist für die Antworterwartung wird gesetzt'],
    auditEvent: 'case.quote_submission_confirmed',
    retryable: false,
    compensation: 'Manuelle Klärung, da die Gegenseite den Vorgang bereits kennt',
  },
  {
    code: 'CASE_RECEIVE_QUOTE',
    from: ['QUOTE_SUBMITTED'],
    to: 'QUOTE_RECEIVED',
    actors: ['SYSTEM', 'AGENT'],
    preconditions: [
      'Angebotsdaten sind strukturiert erfasst',
      'Zugehörigkeit zum Vorgang ist eindeutig',
    ],
    sideEffects: ['Quote wird angelegt', 'Dokumente werden zugeordnet'],
    auditEvent: 'case.quote_received',
    retryable: false,
    compensation: 'Angebot verwerfen und neu erfassen',
  },
  {
    code: 'CASE_START_QUOTE_VALIDATION',
    from: ['QUOTE_RECEIVED'],
    to: 'QUOTE_VALIDATION_PENDING',
    actors: ['SYSTEM'],
    preconditions: ['Mindestens ein Angebot liegt vor'],
    sideEffects: ['ValidationRun wird angelegt'],
    auditEvent: 'case.quote_validation_started',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_QUOTE_VALIDATION_PASSED',
    from: ['QUOTE_VALIDATION_PENDING'],
    to: 'QUOTE_APPROVED',
    actors: ['SYSTEM'],
    preconditions: ['Alle Prüfregeln ergeben pass', 'Kein Ergebnis mit unknown'],
    sideEffects: [],
    auditEvent: 'case.quote_validation_passed',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_REQUIRE_MANUAL_REVIEW',
    from: ['QUOTE_VALIDATION_PENDING'],
    to: 'MANUAL_REVIEW_REQUIRED',
    actors: ['SYSTEM'],
    preconditions: ['Mindestens ein Prüfergebnis ist warning, fail oder unknown'],
    sideEffects: ['Aufgabe für den zuständigen Agenten mit Verweis auf die Regel'],
    auditEvent: 'case.manual_review_required',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_APPROVE_QUOTE',
    from: ['MANUAL_REVIEW_REQUIRED'],
    to: 'QUOTE_APPROVED',
    actors: ['AGENT'],
    preconditions: [
      'Jedes Prüfergebnis mit warning, fail oder unknown ist einzeln entschieden',
      'Entscheidende Person und Begründung sind erfasst',
    ],
    sideEffects: ['ValidationResult.humanDecision wird gesetzt'],
    auditEvent: 'case.quote_approved_by_human',
    retryable: false,
    compensation: 'Freigabe zurücknehmen, solange das Angebot nicht versendet wurde',
  },
  {
    code: 'CASE_SEND_QUOTE_TO_CUSTOMER',
    from: ['QUOTE_APPROVED'],
    to: 'SENT_TO_CUSTOMER',
    actors: ['AGENT', 'BACK_OFFICE'],
    preconditions: [
      'Angebot ist freigegeben',
      'Angebot ist noch gültig',
      'Kommunikationsweg ist zulässig und nicht widerrufen',
    ],
    sideEffects: ['Communication wird erzeugt', 'Erinnerungsplan wird gestartet'],
    auditEvent: 'case.quote_sent_to_customer',
    retryable: true,
    compensation: 'Angebot zurückziehen, Kunde informieren',
  },
  {
    code: 'CASE_CUSTOMER_OPENED',
    from: ['SENT_TO_CUSTOMER'],
    to: 'CUSTOMER_OPENED',
    actors: ['CUSTOMER', 'SYSTEM'],
    preconditions: ['Angebot wurde im Portal abgerufen'],
    sideEffects: ['Erste Erinnerung wird abgesagt'],
    auditEvent: 'case.quote_opened_by_customer',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_START_SIGNATURE',
    from: ['SENT_TO_CUSTOMER', 'CUSTOMER_OPENED'],
    to: 'SIGNATURE_PENDING',
    actors: ['CUSTOMER', 'AGENT'],
    preconditions: [
      'Angebot ist noch gültig',
      'Die zu signierende DocumentVersion ist festgelegt',
      'Malware-Scan der Dokumentversion ist sauber',
    ],
    sideEffects: ['SignatureEnvelope wird angelegt'],
    auditEvent: 'case.signature_started',
    retryable: true,
    compensation: 'Signaturvorgang beim Anbieter abbrechen',
  },
  {
    code: 'CASE_SIGNED',
    from: ['SIGNATURE_PENDING'],
    to: 'SIGNED',
    actors: ['SYSTEM'],
    preconditions: [
      'Signaturereignis ist geprüft und der Hülle eindeutig zugeordnet',
      'Die signierte DocumentVersion ist die zuletzt freigegebene',
    ],
    sideEffects: ['Signiertes Dokument wird abgelegt', 'Erinnerungen werden abgesagt'],
    auditEvent: 'case.signed',
    retryable: false,
    compensation: 'Nur über einen dokumentierten Widerruf des Kunden',
  },
  {
    code: 'CASE_CUSTOMER_DECLINED',
    from: ['SENT_TO_CUSTOMER', 'CUSTOMER_OPENED', 'SIGNATURE_PENDING'],
    to: 'CUSTOMER_DECLINED',
    actors: ['CUSTOMER', 'AGENT'],
    preconditions: ['Ablehnungsgrund ist erfasst'],
    sideEffects: ['Erinnerungen werden abgesagt', 'Aufgabe für den Agenten'],
    auditEvent: 'case.declined_by_customer',
    retryable: false,
    compensation: null,
  },
  {
    code: 'CASE_EXPIRE',
    from: ['SENT_TO_CUSTOMER', 'CUSTOMER_OPENED', 'SIGNATURE_PENDING'],
    to: 'EXPIRED',
    actors: ['SYSTEM'],
    preconditions: ['Gültigkeitsdatum des Angebots ist überschritten'],
    sideEffects: ['Erinnerungen werden abgesagt', 'Aufgabe für den Agenten'],
    auditEvent: 'case.expired',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_MARK_DOCUMENTS_INCOMPLETE',
    from: ['SIGNED'],
    to: 'DOCUMENTS_INCOMPLETE',
    actors: ['SYSTEM', 'AGENT', 'BACK_OFFICE'],
    preconditions: [
      'Mindestens ein für die Einreichung erforderliches Dokument fehlt oder ist nicht freigegeben',
    ],
    sideEffects: ['Aufgabe für den Agenten', 'Kundenanfrage zur Nachreichung'],
    auditEvent: 'case.documents_marked_incomplete',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_MARK_READY_FOR_CALLIDUS',
    from: ['SIGNED', 'DOCUMENTS_INCOMPLETE'],
    to: 'READY_FOR_CALLIDUS',
    actors: ['SYSTEM', 'AGENT', 'BACK_OFFICE'],
    preconditions: [
      'Alle erforderlichen Dokumente liegen vor',
      'Alle Dokumente sind virengeprüft',
      'Signatur bezieht sich auf die aktuelle Dokumentversion',
    ],
    sideEffects: [],
    auditEvent: 'case.ready_for_callidus',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_SUBMIT_TO_CALLIDUS',
    from: ['READY_FOR_CALLIDUS'],
    to: 'CALLIDUS_SUBMISSION_PENDING',
    actors: ['AGENT', 'BACK_OFFICE'],
    preconditions: ['Idempotenzschlüssel ist vergeben', 'Einreichungspaket ist erzeugt'],
    sideEffects: ['CallidusTransmission wird angelegt'],
    auditEvent: 'case.callidus_submission_started',
    retryable: true,
    compensation: 'Übertragung als abgebrochen markieren',
  },
  {
    code: 'CASE_CALLIDUS_SUBMISSION_FAILED',
    from: ['CALLIDUS_SUBMISSION_PENDING'],
    to: 'READY_FOR_CALLIDUS',
    actors: ['SYSTEM'],
    preconditions: ['Der Fehler ist technischer Natur und wiederholbar'],
    sideEffects: ['Aufgabe für den Agenten', 'CallidusEvent mit Fehlercode'],
    auditEvent: 'case.callidus_submission_failed',
    retryable: true,
    compensation: null,
  },
  {
    code: 'CASE_CONFIRM_CALLIDUS_SUBMISSION',
    from: ['CALLIDUS_SUBMISSION_PENDING'],
    to: 'SUBMITTED_TO_CALLIDUS',
    actors: ['SYSTEM', 'AGENT'],
    preconditions: [
      'Übermittlung ist bestätigt',
      'Externe Referenz ist erfasst, sofern die Gegenseite eine vergibt',
    ],
    sideEffects: ['Frist für die Rückmeldung wird gesetzt'],
    auditEvent: 'case.callidus_submission_confirmed',
    retryable: false,
    compensation: 'Manuelle Klärung mit der Gegenseite',
  },
  {
    code: 'CASE_CALLIDUS_REJECTED',
    from: ['SUBMITTED_TO_CALLIDUS'],
    to: 'CALLIDUS_REJECTED',
    actors: ['SYSTEM', 'AGENT'],
    preconditions: ['Ablehnungsgrund der Gegenseite ist erfasst'],
    sideEffects: ['Aufgabe für den Agenten'],
    auditEvent: 'case.callidus_rejected',
    retryable: false,
    compensation: null,
  },
  {
    code: 'CASE_COMPLETE',
    from: ['SUBMITTED_TO_CALLIDUS'],
    to: 'COMPLETED',
    actors: ['SYSTEM', 'AGENT'],
    preconditions: ['Die Gegenseite hat die Annahme bestätigt'],
    sideEffects: ['Offene Aufgaben werden geschlossen', 'Aufbewahrungsfrist beginnt'],
    auditEvent: 'case.completed',
    retryable: false,
    compensation: null,
  },
  {
    code: 'CASE_CANCEL',
    from: [
      'DRAFT',
      'DATA_COLLECTION',
      'DATA_INCOMPLETE',
      'READY_FOR_QUOTE',
      'MANUAL_REVIEW_REQUIRED',
      'CUSTOMER_DECLINED',
      'EXPIRED',
      'CALLIDUS_REJECTED',
    ],
    to: 'CANCELLED',
    actors: ['AGENT', 'ADMIN'],
    preconditions: ['Abbruchgrund ist erfasst', 'Es läuft keine Übermittlung an die Gegenseite'],
    sideEffects: ['Offene Aufgaben werden geschlossen', 'Erinnerungen werden abgesagt'],
    auditEvent: 'case.cancelled',
    retryable: false,
    compensation: null,
  },
];

const TRANSITIONS_BY_CODE: ReadonlyMap<string, CaseTransition> = new Map(
  CASE_TRANSITIONS.map((t) => [t.code, t]),
);

export function findTransition(code: string): CaseTransition | undefined {
  return TRANSITIONS_BY_CODE.get(code);
}

/** Alle Übergänge, die aus einem Zustand herausführen. */
export function transitionsFrom(status: CaseStatus): readonly CaseTransition[] {
  return CASE_TRANSITIONS.filter((t) => t.from.includes(status));
}

/** Alle Übergänge, die eine Rolle aus einem Zustand heraus auslösen darf. */
export function transitionsFor(
  status: CaseStatus,
  actor: TransitionActor,
): readonly CaseTransition[] {
  return transitionsFrom(status).filter((t) => t.actors.includes(actor));
}

export type TransitionCheck =
  | { readonly allowed: true; readonly transition: CaseTransition; readonly noop: boolean }
  | { readonly allowed: false; readonly reason: TransitionRejection };

export type TransitionRejection =
  'UNKNOWN_TRANSITION' | 'WRONG_SOURCE_STATUS' | 'ACTOR_NOT_PERMITTED' | 'TERMINAL_STATUS';

/**
 * Reine Prüfung eines Übergangs. Kennt weder Datenbank noch Berechtigungen
 * jenseits der Rolle — fachliche Vorbedingungen prüft der Use Case.
 *
 * Ein Aufruf, der bereits im Zielzustand steht, ist kein Fehler, sondern ein
 * No-Op (ADR-0007). Das macht Wiederholungen nach Netzwerkfehlern gefahrlos.
 */
export function checkTransition(
  code: string,
  current: CaseStatus,
  actor: TransitionActor,
): TransitionCheck {
  const transition = TRANSITIONS_BY_CODE.get(code);
  if (!transition) {
    return { allowed: false, reason: 'UNKNOWN_TRANSITION' };
  }
  if (!transition.actors.includes(actor)) {
    return { allowed: false, reason: 'ACTOR_NOT_PERMITTED' };
  }
  if (current === transition.to) {
    return { allowed: true, transition, noop: true };
  }
  if (TERMINAL_CASE_STATUSES.includes(current)) {
    return { allowed: false, reason: 'TERMINAL_STATUS' };
  }
  if (!transition.from.includes(current)) {
    return { allowed: false, reason: 'WRONG_SOURCE_STATUS' };
  }
  return { allowed: true, transition, noop: false };
}
