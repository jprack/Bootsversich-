/**
 * Wiederverwendbare Bausteine der Eingabevalidierung.
 *
 * Dieselben Schemata laufen im Browser (frühe Rückmeldung) und auf dem Server
 * (verbindliche Prüfung). Die Prüfung im Browser ist Komfort, die auf dem
 * Server ist die Kontrolle.
 */

import { COUNTRIES, type Country } from '@app/shared-types';
import { z } from 'zod';

/** Entfernt Rand-Leerraum und vereinheitlicht innere Leerzeichen. */
const tidy = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const personNameSchema = z
  .string()
  .transform(tidy)
  .pipe(
    z
      .string()
      .min(1, 'Bitte ausfüllen.')
      .max(100, 'Höchstens 100 Zeichen.')
      // Bewusst weit gefasst: Namen enthalten Bindestriche, Apostrophe und
      // diakritische Zeichen. Ausgeschlossen werden nur Steuerzeichen und
      // Zeichen, die auf eine Fehleingabe deuten.
      .regex(/^[^\p{Cc}\p{Cf}<>{}[\]\\|@#$%^*_=+~`]+$/u, 'Enthält unzulässige Zeichen.'),
  );

export const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().email('Bitte eine gültige E-Mail-Adresse angeben.').max(254));

/**
 * Telefonnummern werden in E.164 normalisiert. Führende Nullen nach der
 * Landesvorwahl sind ein häufiger Eingabefehler und werden entfernt.
 */
export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s/.()-]/g, ''))
  .pipe(
    z
      .string()
      .regex(
        /^\+?[1-9]\d{6,14}$/,
        'Bitte eine gültige Telefonnummer angeben, z. B. +43 660 1234567.',
      ),
  );

export const countrySchema = z.enum(COUNTRIES);

/** Postleitzahlen: Österreich vierstellig, Deutschland fünfstellig. */
const POSTAL_CODE_PATTERN: Readonly<Record<Country, RegExp>> = {
  AT: /^\d{4}$/,
  DE: /^\d{5}$/,
};

export function postalCodeSchemaFor(country: Country) {
  const pattern = POSTAL_CODE_PATTERN[country];
  const laenge = country === 'AT' ? 'vierstellig' : 'fünfstellig';
  return z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().regex(pattern, `Die Postleitzahl ist in ${country} ${laenge}.`));
}

/** Reines Kalenderdatum ohne Zeitzone, Format YYYY-MM-DD. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte im Format JJJJ-MM-TT angeben.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, 'Dieses Datum gibt es nicht.');

/**
 * Geburtsdatum. Untergrenze 120 Jahre, Obergrenze heute — beides schützt vor
 * Zahlendrehern, nicht vor Betrug.
 */
export function birthDateSchema(today: Date = new Date()) {
  return isoDateSchema.superRefine((value, ctx) => {
    const date = new Date(`${value}T00:00:00Z`);
    const heute = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    if (date.getTime() > heute.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Das Geburtsdatum liegt in der Zukunft.',
      });
      return;
    }
    const aeltesteZulaessige = new Date(heute);
    aeltesteZulaessige.setUTCFullYear(aeltesteZulaessige.getUTCFullYear() - 120);
    if (date.getTime() < aeltesteZulaessige.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bitte das Geburtsdatum prüfen.' });
    }
  });
}

/** Geldbetrag an der API-Grenze: Zeichenkette mit zwei Nachkommastellen. */
export const moneyAmountSchema = z
  .string()
  .regex(/^-?\d{1,12}\.\d{2}$/, 'Betrag bitte mit zwei Nachkommastellen angeben, z. B. 1234.50.');

export const moneySchema = z
  .object({
    amount: moneyAmountSchema,
    currency: z.literal('EUR'),
  })
  .strict();

/** Idempotenzschlüssel für schreibende Übermittlungen. */
export const idempotencyKeySchema = z
  .string()
  .min(16, 'Idempotenzschlüssel ist zu kurz.')
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'Idempotenzschlüssel enthält unzulässige Zeichen.');

export const uuidSchema = z.string().uuid('Ungültige Kennung.');

/** Freitext aus der Oberfläche: begrenzt und ohne Steuerzeichen. */
export function freeTextSchema(maxLength: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .max(maxLength, `Höchstens ${maxLength} Zeichen.`)
        .regex(/^[^\p{Cc}]*$/u, 'Enthält unzulässige Steuerzeichen.'),
    );
}

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();
