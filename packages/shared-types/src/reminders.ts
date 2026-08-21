/**
 * Erinnerungsplan für versendete Angebote.
 *
 * Die Voreinstellung stammt aus dem Produktauftrag. Sie ist Konfiguration, kein
 * Naturgesetz: Werte sind je Produkt überschreibbar. Diese Datei liefert die
 * Voreinstellung und die reine Berechnung — das Versenden liegt im Worker.
 */

import type { Priority } from './domain.js';

export const REMINDER_KINDS = [
  'FIRST_REMINDER',
  'SECOND_REMINDER',
  'AGENT_TASK',
  'ESCALATION_DECISION',
] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface ReminderStep {
  readonly kind: ReminderKind;
  /** Kalendertage nach dem Versand an den Kunden. */
  readonly afterCalendarDays: number;
  /** Ob der Kunde angeschrieben wird oder nur intern eine Aufgabe entsteht. */
  readonly notifiesCustomer: boolean;
  readonly priority: Priority;
}

export const DEFAULT_REMINDER_PLAN: readonly ReminderStep[] = [
  { kind: 'FIRST_REMINDER', afterCalendarDays: 3, notifiesCustomer: true, priority: 'NORMAL' },
  { kind: 'SECOND_REMINDER', afterCalendarDays: 7, notifiesCustomer: true, priority: 'NORMAL' },
  { kind: 'AGENT_TASK', afterCalendarDays: 14, notifiesCustomer: false, priority: 'HIGH' },
  {
    kind: 'ESCALATION_DECISION',
    afterCalendarDays: 21,
    notifiesCustomer: false,
    priority: 'URGENT',
  },
];

/**
 * Gründe, eine fällige Erinnerung **nicht** zu versenden.
 *
 * Diese Liste ist die vollständige Prüfung vor jedem Versand. Sie steht hier
 * und nicht im Worker, damit sie ohne Infrastruktur testbar ist.
 */
export const SUPPRESSION_REASONS = [
  'CASE_CLOSED',
  'QUOTE_EXPIRED',
  'ALREADY_SIGNED',
  'CUSTOMER_DECLINED',
  'COMMUNICATION_NOT_PERMITTED',
  'ALREADY_SENT',
] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

export interface ReminderContext {
  readonly caseOpen: boolean;
  readonly quoteValid: boolean;
  readonly alreadySigned: boolean;
  readonly customerDeclined: boolean;
  readonly communicationPermitted: boolean;
  /** Ob für genau diesen Schritt bereits eine Kommunikation existiert. */
  readonly alreadySentForStep: boolean;
}

/**
 * Liefert den Grund, aus dem eine Erinnerung unterbleibt, oder `null`, wenn
 * versendet werden darf. Die Reihenfolge ist bewusst: der aussagekräftigste
 * Grund gewinnt, damit das Protokoll auswertbar bleibt.
 */
export function suppressionReason(context: ReminderContext): SuppressionReason | null {
  if (!context.caseOpen) return 'CASE_CLOSED';
  if (context.alreadySigned) return 'ALREADY_SIGNED';
  if (context.customerDeclined) return 'CUSTOMER_DECLINED';
  if (!context.quoteValid) return 'QUOTE_EXPIRED';
  if (!context.communicationPermitted) return 'COMMUNICATION_NOT_PERMITTED';
  if (context.alreadySentForStep) return 'ALREADY_SENT';
  return null;
}
