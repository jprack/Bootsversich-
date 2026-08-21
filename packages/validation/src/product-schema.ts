/**
 * Produktschemata (ADR-0003).
 *
 * Die Formulare der öffentlichen Website sind nicht codiert, sondern werden aus
 * einem versionierten Datensatz erzeugt. Diese Datei beschreibt, wie ein
 * solcher Datensatz aussehen muss, und liefert den serverseitigen Validierer.
 *
 * Zugelassen ist ein **Teilmenge** von JSON Schema. Die Einschränkung ist
 * Absicht: ein beliebiges Schema aus der Datenbank ist eine Angriffsfläche und
 * lässt sich nicht mehr sinnvoll auf eine Oberfläche abbilden.
 */

import { COUNTRIES, PRODUCT_SCHEMA_STATUSES } from '@app/shared-types';
import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import { z } from 'zod';

/** Datenschutzklassifikation eines Feldes. */
export const FIELD_CLASSIFICATIONS = ['ORDINARY', 'SENSITIVE', 'SPECIAL_CATEGORY'] as const;
export type FieldClassification = (typeof FIELD_CLASSIFICATIONS)[number];

const ALLOWED_TYPES = ['string', 'number', 'integer', 'boolean'] as const;
const ALLOWED_FORMATS = ['date', 'email', 'uri'] as const;

const fieldSchema = z
  .object({
    type: z.enum(ALLOWED_TYPES),
    title: z.string().min(1),
    description: z.string().max(500).optional(),
    format: z.enum(ALLOWED_FORMATS).optional(),
    enum: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).max(100).optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).max(2000).optional(),
    pattern: z.string().max(200).optional(),
    /**
     * Datenschutzklassifikation. Ohne Angabe gilt ORDINARY. Felder der
     * besonderen Kategorien nach Art. 9 DSGVO sind im MVP nicht zugelassen.
     */
    'x-classification': z.enum(FIELD_CLASSIFICATIONS).default('ORDINARY'),
    /** Ob das Feld zusätzlich relational gespiegelt wird (ADR-0003, Bedingung 5). */
    'x-searchable': z.boolean().default(false),
  })
  .strict();

export const productInputSchemaSchema = z
  .object({
    type: z.literal('object'),
    properties: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/), fieldSchema),
    required: z.array(z.string()).default([]),
    additionalProperties: z.literal(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const name of value.required) {
      if (!(name in value.properties)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['required'],
          message: `Pflichtfeld "${name}" ist nicht definiert.`,
        });
      }
    }
    for (const [name, field] of Object.entries(value.properties)) {
      if (field['x-classification'] === 'SPECIAL_CATEGORY') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['properties', name],
          message:
            'Besondere Kategorien personenbezogener Daten sind im MVP nicht zugelassen (docs/product/non-goals.md).',
        });
      }
      if (field.pattern) {
        try {
          new RegExp(field.pattern, 'u');
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['properties', name, 'pattern'],
            message: 'Muster ist kein gültiger regulärer Ausdruck.',
          });
        }
      }
    }
  });

/** Darstellungshinweise. Sie beeinflussen die Prüfung nicht. */
export const productUiSchemaSchema = z
  .object({
    order: z.array(z.string()).default([]),
    groups: z
      .array(z.object({ title: z.string().min(1), fields: z.array(z.string()).min(1) }).strict())
      .default([]),
    widgets: z.record(z.string(), z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number'])).default({}),
  })
  .strict();

export const productSchemaRecordSchema = z
  .object({
    productCode: z.string().regex(/^[A-Z][A-Z0-9-]{2,49}$/),
    country: z.enum(COUNTRIES),
    version: z.number().int().min(1),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().nullable().default(null),
    status: z.enum(PRODUCT_SCHEMA_STATUSES),
    inputSchema: productInputSchemaSchema,
    uiSchema: productUiSchemaSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.effectiveTo && value.effectiveTo <= value.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: 'Das Ende der Gültigkeit muss nach dem Beginn liegen.',
      });
    }
    const bekannt = new Set(Object.keys(value.inputSchema.properties));
    for (const feld of value.uiSchema.order) {
      if (!bekannt.has(feld)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['uiSchema', 'order'],
          message: `Feld "${feld}" ist im Eingabeschema nicht definiert.`,
        });
      }
    }
  });

export type ProductInputSchema = z.infer<typeof productInputSchemaSchema>;
export type ProductSchemaRecord = z.infer<typeof productSchemaRecordSchema>;

export interface ProductDataIssue {
  /** JSON-Pointer auf das betroffene Feld. */
  readonly pointer: string;
  readonly rule: string;
  readonly message: string;
}

export type ProductDataResult =
  | { readonly valid: true; readonly data: Record<string, unknown> }
  | { readonly valid: false; readonly issues: readonly ProductDataIssue[] };

/**
 * Ajv-Instanz mit abgeschalteter Schema-Erweiterung.
 *
 * `strict: true` lässt keine unbekannten Schlüsselwörter durch; die eigenen
 * `x-`-Erweiterungen werden ausdrücklich angemeldet, statt die Strenge
 * insgesamt aufzugeben.
 */
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  removeAdditional: false,
  useDefaults: false,
  coerceTypes: false,
});

/**
 * Die drei zugelassenen Formate werden bewusst selbst definiert statt über ein
 * Zusatzpaket eingebunden: der zulässige Umfang ist klein, und die Semantik von
 * `date` (echtes Kalenderdatum, keine bloße Mustererkennung) soll dieselbe sein
 * wie in `common.ts`.
 */
ajv.addFormat('date', {
  type: 'string',
  validate: (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  },
});
ajv.addFormat('email', {
  type: 'string',
  validate: (value: string): boolean =>
    value.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value),
});
ajv.addFormat('uri', {
  type: 'string',
  validate: (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  },
});

ajv.addKeyword({ keyword: 'x-classification', schemaType: 'string', valid: true });
ajv.addKeyword({ keyword: 'x-searchable', schemaType: 'boolean', valid: true });

const compiled = new Map<string, ValidateFunction>();

function messageFor(error: ErrorObject): string {
  switch (error.keyword) {
    case 'required':
      return 'Bitte ausfüllen.';
    case 'type':
      return 'Der Wert hat das falsche Format.';
    case 'enum':
      return 'Bitte einen der angebotenen Werte wählen.';
    case 'minimum':
      return `Der Wert ist zu klein (mindestens ${String(error.params.limit)}).`;
    case 'maximum':
      return `Der Wert ist zu groß (höchstens ${String(error.params.limit)}).`;
    case 'minLength':
      return `Bitte mindestens ${String(error.params.limit)} Zeichen angeben.`;
    case 'maxLength':
      return `Bitte höchstens ${String(error.params.limit)} Zeichen angeben.`;
    case 'pattern':
      return 'Die Eingabe entspricht nicht dem erwarteten Muster.';
    case 'format':
      return 'Die Eingabe hat nicht das erwartete Format.';
    case 'additionalProperties':
      return 'Dieses Feld ist für das gewählte Produkt nicht vorgesehen.';
    default:
      return 'Die Eingabe ist ungültig.';
  }
}

function pointerFor(error: ErrorObject): string {
  if (error.keyword === 'required') {
    return `${error.instancePath}/${String(error.params.missingProperty)}`;
  }
  if (error.keyword === 'additionalProperties') {
    return `${error.instancePath}/${String(error.params.additionalProperty)}`;
  }
  return error.instancePath || '/';
}

/**
 * Prüft Produktdaten gegen ein Schema.
 *
 * `cacheKey` sollte Produktcode, Land und Version enthalten, damit ein
 * veröffentlichtes Schema nur einmal übersetzt wird. Ein Schema ist
 * unveränderlich; Änderungen erzeugen eine neue Version und damit einen neuen
 * Schlüssel.
 */
export function validateProductData(
  schema: ProductInputSchema,
  data: unknown,
  cacheKey?: string,
): ProductDataResult {
  let validate = cacheKey ? compiled.get(cacheKey) : undefined;
  if (!validate) {
    validate = ajv.compile(schema);
    if (cacheKey) compiled.set(cacheKey, validate);
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      issues: [{ pointer: '/', rule: 'type', message: 'Es wurden keine Produktdaten übermittelt.' }],
    };
  }

  if (validate(data)) {
    return { valid: true, data: data as Record<string, unknown> };
  }

  const issues = (validate.errors ?? []).map((error) => ({
    pointer: pointerFor(error),
    rule: error.keyword,
    message: messageFor(error),
  }));
  return { valid: false, issues };
}

/** Namen aller Felder, die relational gespiegelt werden sollen. */
export function searchableFields(schema: ProductInputSchema): readonly string[] {
  return Object.entries(schema.properties)
    .filter(([, field]) => field['x-searchable'])
    .map(([name]) => name);
}

/** Namen aller als sensibel klassifizierten Felder. */
export function sensitiveFields(schema: ProductInputSchema): readonly string[] {
  return Object.entries(schema.properties)
    .filter(([, field]) => field['x-classification'] !== 'ORDINARY')
    .map(([name]) => name);
}
