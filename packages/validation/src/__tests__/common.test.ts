import { describe, expect, it } from 'vitest';
import {
  birthDateSchema,
  emailSchema,
  idempotencyKeySchema,
  isoDateSchema,
  moneySchema,
  personNameSchema,
  phoneSchema,
  postalCodeSchemaFor,
} from '../common.js';

describe('Namen', () => {
  it('normalisiert Leerraum', () => {
    expect(personNameSchema.parse('  Anna   Maria  ')).toBe('Anna Maria');
  });

  it('lässt Bindestriche, Apostrophe und diakritische Zeichen zu', () => {
    for (const name of ['Müller-Lüdenscheidt', "O'Brien", 'Simunovic', 'Nguyen']) {
      expect(personNameSchema.parse(name)).toBe(name);
    }
  });

  it('weist leere Eingaben und Steuerzeichen ab', () => {
    expect(personNameSchema.safeParse('   ').success).toBe(false);
    expect(personNameSchema.safeParse('<script>').success).toBe(false);
  });
});

describe('E-Mail', () => {
  it('normalisiert Groß- und Kleinschreibung', () => {
    expect(emailSchema.parse('  Anna.Beispiel@EXAMPLE.AT ')).toBe('anna.beispiel@example.at');
  });

  it('weist unvollständige Adressen ab', () => {
    for (const value of ['anna', 'anna@', '@example.at', 'anna example.at']) {
      expect(emailSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe('Telefonnummer', () => {
  it('entfernt Trennzeichen', () => {
    expect(phoneSchema.parse('+43 660 123 45 67')).toBe('+436601234567');
    expect(phoneSchema.parse('+49 30 12345678')).toBe('+493012345678');
  });

  it('weist zu kurze oder unmögliche Nummern ab', () => {
    for (const value of ['12345', '+0123456789', 'abcdefghij']) {
      expect(phoneSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe('Postleitzahl', () => {
  it('prüft je Land unterschiedlich', () => {
    expect(postalCodeSchemaFor('AT').safeParse('1010').success).toBe(true);
    expect(postalCodeSchemaFor('AT').safeParse('10115').success).toBe(false);
    expect(postalCodeSchemaFor('DE').safeParse('10115').success).toBe(true);
    expect(postalCodeSchemaFor('DE').safeParse('1010').success).toBe(false);
  });
});

describe('Datum', () => {
  it('weist Kalendertage ab, die es nicht gibt', () => {
    expect(isoDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(isoDateSchema.safeParse('2025-02-29').success).toBe(false);
    expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true);
  });

  it('verlangt das Format JJJJ-MM-TT', () => {
    expect(isoDateSchema.safeParse('01.09.2026').success).toBe(false);
  });
});

describe('Geburtsdatum', () => {
  const heute = new Date('2026-08-21T12:00:00Z');

  it('akzeptiert ein plausibles Datum', () => {
    expect(birthDateSchema(heute).safeParse('1985-04-17').success).toBe(true);
  });

  it('weist ein Datum in der Zukunft ab', () => {
    expect(birthDateSchema(heute).safeParse('2026-08-22').success).toBe(false);
  });

  it('akzeptiert den heutigen Tag', () => {
    expect(birthDateSchema(heute).safeParse('2026-08-21').success).toBe(true);
  });

  it('weist ein Datum vor über 120 Jahren ab', () => {
    expect(birthDateSchema(heute).safeParse('1900-01-01').success).toBe(false);
  });
});

describe('Geldbetrag an der API-Grenze', () => {
  it('verlangt zwei Nachkommastellen und EUR', () => {
    expect(moneySchema.safeParse({ amount: '1234.50', currency: 'EUR' }).success).toBe(true);
    expect(moneySchema.safeParse({ amount: '1234.5', currency: 'EUR' }).success).toBe(false);
    expect(moneySchema.safeParse({ amount: 1234.5, currency: 'EUR' }).success).toBe(false);
    expect(moneySchema.safeParse({ amount: '1234.50', currency: 'CHF' }).success).toBe(false);
  });

  it('lässt keine zusätzlichen Felder zu', () => {
    const result = moneySchema.safeParse({ amount: '1.00', currency: 'EUR', gross: true });
    expect(result.success).toBe(false);
  });
});

describe('Idempotenzschlüssel', () => {
  it('verlangt ausreichende Länge und ein sicheres Alphabet', () => {
    expect(idempotencyKeySchema.safeParse('a'.repeat(16)).success).toBe(true);
    expect(idempotencyKeySchema.safeParse('a'.repeat(15)).success).toBe(false);
    expect(idempotencyKeySchema.safeParse(`${'a'.repeat(15)}/`).success).toBe(false);
  });
});
