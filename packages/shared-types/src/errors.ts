/**
 * Einheitliches Fehlerformat der API — angelehnt an RFC 9457 (problem+json).
 *
 * Grundsatz: Technische Fehlermeldungen erreichen den Browser nie ungefiltert
 * (docs/architecture/security-model.md). `detail` ist für Menschen bestimmt und
 * enthält keine Interna; Ursachen stehen ausschließlich im Serverprotokoll,
 * verbunden über `correlationId`.
 */

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PRECONDITION_FAILED',
  'TRANSITION_NOT_ALLOWED',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_NOT_CONFIGURED',
  'INTEGRATION_BLOCKED',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface FieldError {
  /** JSON-Pointer auf das betroffene Feld, z. B. "/applicant/birthDate". */
  readonly pointer: string;
  /** Maschinenlesbarer Grund, z. B. "required" oder "format". */
  readonly rule: string;
  /** Deutschsprachiger Hinweis für die Oberfläche. */
  readonly message: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: ErrorCode;
  readonly detail?: string;
  readonly instance?: string;
  readonly correlationId: string;
  readonly errors?: readonly FieldError[];
}

export const ERROR_STATUS: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  TRANSITION_NOT_ALLOWED: 409,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PROVIDER_UNAVAILABLE: 502,
  PROVIDER_NOT_CONFIGURED: 503,
  INTEGRATION_BLOCKED: 501,
  INTERNAL_ERROR: 500,
};

export const ERROR_TITLES: Readonly<Record<ErrorCode, string>> = {
  VALIDATION_FAILED: 'Die Eingaben sind unvollständig oder ungültig.',
  UNAUTHENTICATED: 'Anmeldung erforderlich.',
  FORBIDDEN: 'Für diese Aktion fehlt die Berechtigung.',
  NOT_FOUND: 'Der Datensatz wurde nicht gefunden.',
  CONFLICT: 'Der Datensatz wurde zwischenzeitlich geändert.',
  PRECONDITION_FAILED: 'Eine Voraussetzung für diese Aktion ist nicht erfüllt.',
  TRANSITION_NOT_ALLOWED: 'Dieser Schritt ist im aktuellen Status nicht möglich.',
  RATE_LIMITED: 'Zu viele Anfragen. Bitte später erneut versuchen.',
  PAYLOAD_TOO_LARGE: 'Die Datei ist zu groß.',
  UNSUPPORTED_MEDIA_TYPE: 'Dieser Dateityp wird nicht akzeptiert.',
  PROVIDER_UNAVAILABLE: 'Ein benötigter externer Dienst ist derzeit nicht erreichbar.',
  PROVIDER_NOT_CONFIGURED: 'Ein benötigter externer Dienst ist nicht konfiguriert.',
  INTEGRATION_BLOCKED: 'Diese Integration ist noch nicht freigegeben.',
  INTERNAL_ERROR: 'Es ist ein unerwarteter Fehler aufgetreten.',
};

export const PROBLEM_TYPE_BASE = 'https://crm.local/errors/';

export function problemType(code: ErrorCode): string {
  return PROBLEM_TYPE_BASE + code.toLowerCase().replace(/_/g, '-');
}
