import { describe, expect, it } from 'vitest';
import {
  productInputSchemaSchema,
  productSchemaRecordSchema,
  searchableFields,
  sensitiveFields,
  validateProductData,
  type ProductInputSchema,
} from '../product-schema.js';

const schema: ProductInputSchema = productInputSchemaSchema.parse({
  type: 'object',
  additionalProperties: false,
  required: ['objectValue', 'coverageStart'],
  properties: {
    objectValue: {
      type: 'number',
      title: 'Wert des Objekts',
      minimum: 0,
      maximum: 10_000_000,
      'x-searchable': true,
    },
    coverageStart: { type: 'string', title: 'Versicherungsbeginn', format: 'date' },
    usage: { type: 'string', title: 'Nutzung', enum: ['privat', 'gewerblich'] },
    previousDamage: { type: 'boolean', title: 'Vorschäden' },
    note: { type: 'string', title: 'Anmerkung', maxLength: 500, 'x-classification': 'SENSITIVE' },
  },
});

describe('Produktdaten — Prüfung gegen das Schema', () => {
  it('akzeptiert vollständige, gültige Daten', () => {
    const result = validateProductData(schema, {
      objectValue: 42000,
      coverageStart: '2026-09-01',
      usage: 'privat',
    });
    expect(result.valid).toBe(true);
  });

  it('benennt fehlende Pflichtfelder mit JSON-Pointer', () => {
    const result = validateProductData(schema, { usage: 'privat' });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    const pointer = result.issues.map((i) => i.pointer).sort();
    expect(pointer).toEqual(['/coverageStart', '/objectValue']);
    expect(result.issues[0]?.message).toBe('Bitte ausfüllen.');
  });

  it('weist unbekannte Felder ab, statt sie stillschweigend zu übernehmen', () => {
    const result = validateProductData(schema, {
      objectValue: 1000,
      coverageStart: '2026-09-01',
      heimlichesFeld: 'x',
    });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.issues.some((i) => i.pointer === '/heimlichesFeld')).toBe(true);
  });

  it('prüft Zahlengrenzen', () => {
    const zuGross = validateProductData(schema, {
      objectValue: 20_000_000,
      coverageStart: '2026-09-01',
    });
    expect(zuGross.valid).toBe(false);
    const negativ = validateProductData(schema, { objectValue: -1, coverageStart: '2026-09-01' });
    expect(negativ.valid).toBe(false);
  });

  it('erkennt ein Datum, das es im Kalender nicht gibt', () => {
    const result = validateProductData(schema, { objectValue: 1000, coverageStart: '2026-02-30' });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.issues[0]?.pointer).toBe('/coverageStart');
  });

  it('wandelt keine Typen still um', () => {
    const result = validateProductData(schema, {
      objectValue: '42000',
      coverageStart: '2026-09-01',
    });
    expect(result.valid).toBe(false);
  });

  it('lässt nur die vorgesehenen Auswahlwerte zu', () => {
    const result = validateProductData(schema, {
      objectValue: 1000,
      coverageStart: '2026-09-01',
      usage: 'militärisch',
    });
    expect(result.valid).toBe(false);
  });

  it('meldet fehlende Daten insgesamt statt zu stürzen', () => {
    for (const eingabe of [null, undefined, 'text', 42, []]) {
      const result = validateProductData(schema, eingabe);
      expect(result.valid).toBe(false);
    }
  });

  it('liefert bei wiederholtem Aufruf mit Cache-Schlüssel dasselbe Ergebnis', () => {
    const key = 'DEMO-PRODUCT-A|AT|1';
    const erste = validateProductData(schema, { objectValue: 1, coverageStart: '2026-01-01' }, key);
    const zweite = validateProductData(
      schema,
      { objectValue: 1, coverageStart: '2026-01-01' },
      key,
    );
    expect(erste.valid).toBe(true);
    expect(zweite.valid).toBe(true);
  });
});

describe('Produktschema — Aufbau', () => {
  it('weist ein Pflichtfeld ab, das nicht definiert ist', () => {
    const result = productInputSchemaSchema.safeParse({
      type: 'object',
      additionalProperties: false,
      required: ['gibtEsNicht'],
      properties: { a: { type: 'string', title: 'A' } },
    });
    expect(result.success).toBe(false);
  });

  it('lässt keine besonderen Kategorien personenbezogener Daten zu', () => {
    const result = productInputSchemaSchema.safeParse({
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {
        gesundheit: {
          type: 'string',
          title: 'Gesundheitsangaben',
          'x-classification': 'SPECIAL_CATEGORY',
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it('lässt offene Objekte nicht zu', () => {
    const result = productInputSchemaSchema.safeParse({
      type: 'object',
      additionalProperties: true,
      required: [],
      properties: {},
    });
    expect(result.success).toBe(false);
  });

  it('weist ein ungültiges Muster ab', () => {
    const result = productInputSchemaSchema.safeParse({
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: { a: { type: 'string', title: 'A', pattern: '([' } },
    });
    expect(result.success).toBe(false);
  });

  it('benennt suchbare und sensible Felder', () => {
    expect(searchableFields(schema)).toEqual(['objectValue']);
    expect(sensitiveFields(schema)).toEqual(['note']);
  });
});

describe('Produktschema — Datensatz', () => {
  const basis = {
    productCode: 'DEMO-PRODUCT-A',
    country: 'AT',
    version: 1,
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: null,
    status: 'APPROVED',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: { a: { type: 'string', title: 'A' } },
    },
    uiSchema: { order: ['a'], groups: [], widgets: {} },
  };

  it('akzeptiert einen vollständigen Datensatz', () => {
    expect(productSchemaRecordSchema.safeParse(basis).success).toBe(true);
  });

  it('weist ein Gültigkeitsende vor dem Beginn ab', () => {
    const result = productSchemaRecordSchema.safeParse({
      ...basis,
      effectiveTo: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('weist eine Feldreihenfolge mit unbekanntem Feld ab', () => {
    const result = productSchemaRecordSchema.safeParse({
      ...basis,
      uiSchema: { order: ['a', 'b'], groups: [], widgets: {} },
    });
    expect(result.success).toBe(false);
  });
});
