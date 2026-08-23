import { describe, expect, it } from 'vitest';
import { publicIntakeSchema, quoteImportSchema } from '../intake.js';
import { matchKey } from '../customer.js';

const applicant = {
  firstName: 'Anna',
  lastName: 'Beispiel',
  birthDate: '1985-04-17',
  email: 'anna.beispiel@example.at',
  address: {
    street: 'Musterstraße',
    houseNumber: '1',
    postalCode: '1010',
    city: 'Wien',
    country: 'AT',
  },
};

const consents = [
  {
    purpose: 'QUOTE_PROCESSING',
    legalBasis: 'CONSENT',
    granted: true,
    privacyNoticeVersion: '2026-01',
  },
  {
    purpose: 'TRANSFER_TO_INSURER',
    legalBasis: 'CONSENT',
    granted: true,
    privacyNoticeVersion: '2026-01',
  },
];

const intake = {
  productCode: 'DEMO-PRODUCT-A',
  country: 'AT',
  productSchemaVersion: 1,
  applicant,
  productData: { objectValue: 42000 },
  consents,
};

describe('Öffentliche Produktanfrage', () => {
  it('akzeptiert eine vollständige Anfrage', () => {
    expect(publicIntakeSchema.safeParse(intake).success).toBe(true);
  });

  it('lehnt eine Anfrage ohne Verarbeitungseinwilligung ab', () => {
    const result = publicIntakeSchema.safeParse({ ...intake, consents: [consents[1]] });
    expect(result.success).toBe(false);
  });

  it('lehnt eine Anfrage ohne Übermittlungseinwilligung ab', () => {
    const result = publicIntakeSchema.safeParse({ ...intake, consents: [consents[0]] });
    expect(result.success).toBe(false);
  });

  it('wertet eine verweigerte Einwilligung nicht als erteilt', () => {
    const result = publicIntakeSchema.safeParse({
      ...intake,
      consents: [consents[0], { ...consents[1], granted: false }],
    });
    expect(result.success).toBe(false);
  });

  it('lehnt widersprüchliche Mehrfachangaben zum selben Zweck ab', () => {
    const result = publicIntakeSchema.safeParse({
      ...intake,
      consents: [...consents, consents[0]],
    });
    expect(result.success).toBe(false);
  });

  it('prüft die Postleitzahl gegen das angegebene Land', () => {
    const result = publicIntakeSchema.safeParse({
      ...intake,
      applicant: { ...applicant, address: { ...applicant.address, country: 'DE' } },
    });
    expect(result.success).toBe(false);
  });

  it('lehnt unbekannte Felder auf oberster Ebene ab', () => {
    const result = publicIntakeSchema.safeParse({ ...intake, assignedAgentId: 'fremd' });
    expect(result.success).toBe(false);
  });

  it('typisiert die Produktdaten nicht vor', () => {
    const result = publicIntakeSchema.safeParse({ ...intake, productData: { irgendwas: true } });
    expect(result.success).toBe(true);
  });
});

describe('Angebotsübernahme', () => {
  const quote = {
    caseId: '11111111-1111-4111-8111-111111111111',
    quoteRequestId: '22222222-2222-4222-8222-222222222222',
    origin: 'MOCK',
    productCode: 'DEMO-PRODUCT-A',
    tariffName: 'Basis',
    premium: { amount: '480.00', currency: 'EUR' },
    paymentFrequency: 'ANNUAL',
    termMonths: 12,
    coverageStart: '2026-09-01',
    validUntil: '2026-10-01',
  };

  it('akzeptiert ein vollständiges Angebot', () => {
    expect(quoteImportSchema.safeParse(quote).success).toBe(true);
  });

  it('lehnt ein Angebot ab, das vor dem Versicherungsbeginn verfällt', () => {
    const result = quoteImportSchema.safeParse({ ...quote, validUntil: '2026-08-01' });
    expect(result.success).toBe(false);
  });

  it('lehnt doppelte Deckungen ab', () => {
    const result = quoteImportSchema.safeParse({
      ...quote,
      coverages: [
        { code: 'HAFT', label: 'Haftpflicht', sumInsured: null, deductible: null },
        { code: 'HAFT', label: 'Haftpflicht', sumInsured: null, deductible: null },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('lehnt eine Prämie als Gleitkommazahl ab', () => {
    const result = quoteImportSchema.safeParse({
      ...quote,
      premium: { amount: 480, currency: 'EUR' },
    });
    expect(result.success).toBe(false);
  });

  it('prüft manuell erfasste Angebote nach denselben Regeln wie importierte', () => {
    const manuell = { ...quote, origin: 'MANUAL', validUntil: '2026-08-01' };
    expect(quoteImportSchema.safeParse(manuell).success).toBe(false);
  });
});

describe('Erkennung vorhandener Personen', () => {
  it('bildet denselben Schlüssel unabhängig von Schreibweise und Leerraum', () => {
    const a = matchKey({ lastName: ' Beispiel ', birthDate: '1985-04-17', postalCode: '1010' });
    const b = matchKey({ lastName: 'beispiel', birthDate: '1985-04-17', postalCode: ' 1010' });
    expect(a).toBe(b);
  });

  it('unterscheidet Personen mit gleichem Namen und verschiedenem Geburtsdatum', () => {
    const a = matchKey({ lastName: 'Beispiel', birthDate: '1985-04-17', postalCode: '1010' });
    const b = matchKey({ lastName: 'Beispiel', birthDate: '1990-04-17', postalCode: '1010' });
    expect(a).not.toBe(b);
  });
});
