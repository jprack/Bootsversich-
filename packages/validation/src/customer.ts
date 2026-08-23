/** Schemata für Personen, Adressen, Kontaktwege und Einwilligungen. */

import { CONSENT_PURPOSES, COUNTRIES, LEGAL_BASES, type Country } from '@app/shared-types';
import { z } from 'zod';
import {
  birthDateSchema,
  countrySchema,
  emailSchema,
  freeTextSchema,
  personNameSchema,
  phoneSchema,
  postalCodeSchemaFor,
} from './common.js';

/**
 * Adresse. Die Postleitzahlprüfung hängt vom Land ab, deshalb wird sie erst
 * nach dem Land ausgewertet — eine feste Regel für beide Länder würde entweder
 * österreichische oder deutsche Eingaben falsch abweisen.
 */
export const addressSchema = z
  .object({
    street: freeTextSchema(120).pipe(z.string().min(1, 'Bitte ausfüllen.')),
    houseNumber: freeTextSchema(20).pipe(z.string().min(1, 'Bitte ausfüllen.')),
    addressLine2: freeTextSchema(120).optional(),
    postalCode: z.string(),
    city: freeTextSchema(100).pipe(z.string().min(1, 'Bitte ausfüllen.')),
    country: countrySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const result = postalCodeSchemaFor(value.country as Country).safeParse(value.postalCode);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: issue.message });
      }
    }
  });

export const contactMethodSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('EMAIL'),
      value: emailSchema,
      isPrimary: z.boolean().default(false),
    }),
    z.object({
      kind: z.literal('PHONE'),
      value: phoneSchema,
      isPrimary: z.boolean().default(false),
    }),
  ])
  .and(z.object({}).strict().partial());

export const consentInputSchema = z
  .object({
    purpose: z.enum(CONSENT_PURPOSES),
    legalBasis: z.enum(LEGAL_BASES),
    granted: z.boolean(),
    /** Version des Datenschutzhinweises, der bei der Erteilung galt. */
    privacyNoticeVersion: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    // Eine erteilte Einwilligung ohne Rechtsgrundlage CONSENT wäre ein
    // Widerspruch in sich und macht den Nachweis wertlos.
    if (value.legalBasis === 'CONSENT' && !value.granted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['granted'],
        message: 'Eine Einwilligung ohne Zustimmung wird nicht gespeichert.',
      });
    }
  });

export const customerInputSchema = z
  .object({
    firstName: personNameSchema,
    lastName: personNameSchema,
    birthDate: birthDateSchema(),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: addressSchema,
    preferredLanguage: z.enum(['de']).default('de'),
  })
  .strict();

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ConsentInput = z.infer<typeof consentInputSchema>;

/**
 * Merkmale für die Erkennung bereits vorhandener Personen.
 *
 * Bewusst konservativ: Diese Funktion liefert einen Vergleichsschlüssel, aber
 * **kein** Urteil über Identität. Zusammenführen von Datensätzen erfolgt nie
 * automatisch (docs/product/non-goals.md).
 */
export function matchKey(input: {
  lastName: string;
  birthDate: string;
  postalCode: string;
}): string {
  const name = input.lastName.trim().toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
  return `${name}|${input.birthDate}|${input.postalCode.trim()}`;
}

export const COUNTRY_OPTIONS = COUNTRIES.map((code) => ({
  code,
  label: code === 'AT' ? 'Österreich' : 'Deutschland',
}));
