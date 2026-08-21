/**
 * Geldbeträge (ADR-0004).
 *
 * Ein Betrag ist ohne Währung bedeutungslos, deshalb existiert kein Typ für
 * "nur der Betrag". Die Speicherung erfolgt als Dezimalzeichenkette, nicht als
 * `number` — IEEE-754 ist für Prämienvergleiche ungeeignet.
 */

export const SUPPORTED_CURRENCIES = ['EUR'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface Money {
  /** Dezimalzeichenkette mit genau zwei Nachkommastellen, z. B. "1234.50". */
  readonly amount: string;
  readonly currency: Currency;
}

const DECIMAL_PATTERN = /^-?\d{1,12}\.\d{2}$/;

export function isMoney(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { amount?: unknown; currency?: unknown };
  return (
    typeof candidate.amount === 'string' &&
    DECIMAL_PATTERN.test(candidate.amount) &&
    typeof candidate.currency === 'string' &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(candidate.currency)
  );
}

/** Betrag in kleinster Einheit (Cent) als BigInt — für exakte Arithmetik. */
export function toMinorUnits(money: Money): bigint {
  const negative = money.amount.startsWith('-');
  const digits = money.amount.replace('-', '').replace('.', '');
  const value = BigInt(digits);
  return negative ? -value : value;
}

export function fromMinorUnits(minor: bigint, currency: Currency): Money {
  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  const whole = absolute / 100n;
  const fraction = absolute % 100n;
  const amount = `${negative ? '-' : ''}${whole}.${fraction.toString().padStart(2, '0')}`;
  return { amount, currency };
}

export class CurrencyMismatchError extends Error {
  constructor(left: Currency, right: Currency) {
    super(`Währungen sind nicht vergleichbar: ${left} und ${right}`);
    this.name = 'CurrencyMismatchError';
  }
}

function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) {
    throw new CurrencyMismatchError(left.currency, right.currency);
  }
}

export function moneyEquals(left: Money, right: Money): boolean {
  return left.currency === right.currency && toMinorUnits(left) === toMinorUnits(right);
}

/** Absolute Differenz zweier Beträge gleicher Währung. */
export function moneyDifference(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  const diff = toMinorUnits(left) - toMinorUnits(right);
  return fromMinorUnits(diff < 0n ? -diff : diff, left.currency);
}

/**
 * Toleranzvergleich für Prüfregeln.
 *
 * Beide Grenzen sind einschließlich. `toleranceMinorUnits` ist absolut (Cent),
 * `tolerancePercent` relativ zum Erwartungswert. Erfüllt ist die Regel, wenn
 * die Abweichung **eine** der beiden Grenzen einhält — so bleibt eine
 * Cent-Rundung bei kleinen Beträgen tolerierbar, ohne bei großen Beträgen eine
 * unbegrenzte Prozentspanne zu öffnen.
 */
export function moneyWithinTolerance(
  actual: Money,
  expected: Money,
  options: { toleranceMinorUnits?: bigint; tolerancePercent?: number } = {},
): boolean {
  if (actual.currency !== expected.currency) return false;
  const difference = toMinorUnits(actual) - toMinorUnits(expected);
  const absolute = difference < 0n ? -difference : difference;

  const { toleranceMinorUnits, tolerancePercent } = options;
  if (toleranceMinorUnits === undefined && tolerancePercent === undefined) {
    return absolute === 0n;
  }
  if (toleranceMinorUnits !== undefined && absolute <= toleranceMinorUnits) {
    return true;
  }
  if (tolerancePercent !== undefined) {
    const expectedMinor = toMinorUnits(expected);
    const expectedAbsolute = expectedMinor < 0n ? -expectedMinor : expectedMinor;
    // Prozentgrenze in Hundertstel-Prozent, um Gleitkomma zu vermeiden.
    const permilleBasis = BigInt(Math.round(tolerancePercent * 100));
    if (absolute * 10_000n <= expectedAbsolute * permilleBasis) {
      return true;
    }
  }
  return false;
}

/** Darstellung für die Oberfläche. Rundung findet ausschließlich hier statt. */
export function formatMoney(money: Money, locale = 'de-AT'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(money.amount));
}
