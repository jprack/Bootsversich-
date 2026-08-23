import { describe, expect, it } from 'vitest';
import {
  CurrencyMismatchError,
  formatMoney,
  fromMinorUnits,
  isMoney,
  moneyDifference,
  moneyEquals,
  moneyWithinTolerance,
  toMinorUnits,
  type Money,
} from '../money.js';

const eur = (amount: string): Money => ({ amount, currency: 'EUR' });

describe('Geldbeträge — Form', () => {
  it('akzeptiert genau zwei Nachkommastellen', () => {
    expect(isMoney(eur('1234.50'))).toBe(true);
    expect(isMoney(eur('0.00'))).toBe(true);
    expect(isMoney(eur('-12.34'))).toBe(true);
  });

  it('weist unvollständige oder fremde Formate ab', () => {
    expect(isMoney(eur('1234.5'))).toBe(false);
    expect(isMoney(eur('1234'))).toBe(false);
    expect(isMoney(eur('1.234,50'))).toBe(false);
    expect(isMoney({ amount: 1234.5, currency: 'EUR' })).toBe(false);
    expect(isMoney({ amount: '10.00', currency: 'CHF' })).toBe(false);
    expect(isMoney(null)).toBe(false);
  });
});

describe('Geldbeträge — Umrechnung', () => {
  it('wandelt verlustfrei in kleinste Einheiten und zurück', () => {
    for (const amount of ['0.00', '0.01', '19.99', '1234.56', '999999999999.99', '-42.07']) {
      expect(fromMinorUnits(toMinorUnits(eur(amount)), 'EUR').amount).toBe(amount);
    }
  });

  it('rechnet ohne Gleitkommafehler', () => {
    // 0.1 + 0.2 ist in IEEE-754 nicht 0.3 — hier schon.
    const sum = fromMinorUnits(toMinorUnits(eur('0.10')) + toMinorUnits(eur('0.20')), 'EUR');
    expect(sum.amount).toBe('0.30');
  });

  it('füllt fehlende Cent-Stellen auf', () => {
    expect(fromMinorUnits(5n, 'EUR').amount).toBe('0.05');
    expect(fromMinorUnits(-5n, 'EUR').amount).toBe('-0.05');
  });
});

describe('Geldbeträge — Vergleich', () => {
  it('vergleicht gleiche Beträge gleicher Währung als gleich', () => {
    expect(moneyEquals(eur('19.99'), eur('19.99'))).toBe(true);
    expect(moneyEquals(eur('19.99'), eur('19.98'))).toBe(false);
  });

  it('liefert die absolute Differenz unabhängig von der Reihenfolge', () => {
    expect(moneyDifference(eur('100.00'), eur('99.50')).amount).toBe('0.50');
    expect(moneyDifference(eur('99.50'), eur('100.00')).amount).toBe('0.50');
  });

  it('verweigert die Differenz bei verschiedenen Währungen', () => {
    const foreign = { amount: '10.00', currency: 'USD' } as unknown as Money;
    expect(() => moneyDifference(eur('10.00'), foreign)).toThrow(CurrencyMismatchError);
  });
});

describe('Geldbeträge — Toleranz für Prüfregeln', () => {
  it('verlangt ohne Toleranzangabe exakte Gleichheit', () => {
    expect(moneyWithinTolerance(eur('100.00'), eur('100.00'))).toBe(true);
    expect(moneyWithinTolerance(eur('100.01'), eur('100.00'))).toBe(false);
  });

  it('akzeptiert eine absolute Cent-Toleranz', () => {
    expect(moneyWithinTolerance(eur('100.02'), eur('100.00'), { toleranceMinorUnits: 2n })).toBe(
      true,
    );
    expect(moneyWithinTolerance(eur('100.03'), eur('100.00'), { toleranceMinorUnits: 2n })).toBe(
      false,
    );
  });

  it('akzeptiert eine relative Toleranz', () => {
    expect(moneyWithinTolerance(eur('101.00'), eur('100.00'), { tolerancePercent: 1 })).toBe(true);
    expect(moneyWithinTolerance(eur('101.01'), eur('100.00'), { tolerancePercent: 1 })).toBe(false);
  });

  it('lässt kleine Rundungen zu, ohne bei großen Beträgen die Prozentspanne zu öffnen', () => {
    const options = { toleranceMinorUnits: 2n, tolerancePercent: 0.5 };
    expect(moneyWithinTolerance(eur('1.02'), eur('1.00'), options)).toBe(true);
    expect(moneyWithinTolerance(eur('10050.00'), eur('10000.00'), options)).toBe(true);
    expect(moneyWithinTolerance(eur('10051.00'), eur('10000.00'), options)).toBe(false);
  });

  it('gilt bei verschiedenen Währungen nie als erfüllt', () => {
    const foreign = { amount: '100.00', currency: 'USD' } as unknown as Money;
    expect(moneyWithinTolerance(foreign, eur('100.00'), { tolerancePercent: 100 })).toBe(false);
  });
});

describe('Geldbeträge — Darstellung', () => {
  it('formatiert österreichisch und deutsch mit Währungszeichen', () => {
    expect(formatMoney(eur('1234.50'), 'de-AT')).toContain('1.234,50');
    expect(formatMoney(eur('1234.50'), 'de-DE')).toContain('1.234,50');
  });
});
