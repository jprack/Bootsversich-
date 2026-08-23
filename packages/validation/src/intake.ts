/** Öffentliche Produktanfrage und Angebotsübernahme. */

import { COUNTRIES, LEAD_SOURCES, PAYMENT_FREQUENCIES, QUOTE_ORIGINS } from '@app/shared-types';
import { z } from 'zod';
import { freeTextSchema, isoDateSchema, moneySchema, uuidSchema } from './common.js';
import { consentInputSchema, customerInputSchema } from './customer.js';

/**
 * Anfrage von der öffentlichen Website.
 *
 * `productData` wird hier bewusst **nicht** typisiert: Der Inhalt hängt vom
 * gewählten Produktschema ab und wird in einem zweiten Schritt gegen die
 * gespeicherte Schemaversion geprüft (ADR-0003). Eine Vortypisierung würde
 * suggerieren, die Felder seien bekannt.
 */
export const publicIntakeSchema = z
  .object({
    productCode: z.string().regex(/^[A-Z][A-Z0-9-]{2,49}$/),
    country: z.enum(COUNTRIES),
    productSchemaVersion: z.number().int().min(1),
    applicant: customerInputSchema,
    productData: z.record(z.string(), z.unknown()),
    consents: z.array(consentInputSchema).min(1),
    source: z.enum(LEAD_SOURCES).default('WEBSITE'),
    note: freeTextSchema(1000).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    // Ohne die beiden tragenden Einwilligungen darf keine Verarbeitung starten.
    const erteilt = new Set(value.consents.filter((c) => c.granted).map((c) => c.purpose));
    for (const pflicht of ['QUOTE_PROCESSING', 'TRANSFER_TO_INSURER'] as const) {
      if (!erteilt.has(pflicht)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['consents'],
          message: 'Ohne diese Einwilligung kann die Anfrage nicht bearbeitet werden.',
        });
      }
    }
    const doppelt = value.consents.length !== new Set(value.consents.map((c) => c.purpose)).size;
    if (doppelt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['consents'],
        message: 'Zu jedem Zweck darf nur eine Angabe übermittelt werden.',
      });
    }
  });

export type PublicIntake = z.infer<typeof publicIntakeSchema>;

export const quoteCoverageSchema = z
  .object({
    code: z.string().min(1).max(50),
    label: freeTextSchema(200),
    sumInsured: moneySchema.nullable().default(null),
    deductible: moneySchema.nullable().default(null),
  })
  .strict();

export const quoteExclusionSchema = z
  .object({
    code: z.string().min(1).max(50),
    label: freeTextSchema(200),
  })
  .strict();

/**
 * Angebotsdaten — identisch für den Mock-Import und die manuelle Erfassung.
 *
 * Manuell erfasste Angebote sind gegenüber importierten nicht privilegiert:
 * beide durchlaufen dasselbe Schema und dieselben Prüfregeln
 * (docs/callidus/manual-fallback.md).
 */
export const quoteImportSchema = z
  .object({
    caseId: uuidSchema,
    quoteRequestId: uuidSchema,
    origin: z.enum(QUOTE_ORIGINS),
    externalReference: z.string().min(1).max(100).nullable().default(null),
    productCode: z.string().regex(/^[A-Z][A-Z0-9-]{2,49}$/),
    tariffName: freeTextSchema(200),
    premium: moneySchema,
    paymentFrequency: z.enum(PAYMENT_FREQUENCIES),
    termMonths: z.number().int().min(1).max(1200),
    coverageStart: isoDateSchema,
    validUntil: isoDateSchema,
    coverages: z.array(quoteCoverageSchema).default([]),
    exclusions: z.array(quoteExclusionSchema).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.validUntil < value.coverageStart) {
      // Ein Angebot, das vor dem Versicherungsbeginn verfällt, ist nicht
      // annehmbar — das ist ein Erfassungs- oder Übertragungsfehler.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'Das Angebot verfällt vor dem Versicherungsbeginn.',
      });
    }
    const codes = value.coverages.map((c) => c.code);
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverages'],
        message: 'Jede Deckung darf nur einmal vorkommen.',
      });
    }
  });

export type QuoteImport = z.infer<typeof quoteImportSchema>;
