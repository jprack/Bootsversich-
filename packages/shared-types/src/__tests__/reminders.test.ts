import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_PLAN,
  suppressionReason,
  type ReminderContext,
} from '../reminders.js';

const versandfaehig: ReminderContext = {
  caseOpen: true,
  quoteValid: true,
  alreadySigned: false,
  customerDeclined: false,
  communicationPermitted: true,
  alreadySentForStep: false,
};

describe('Erinnerungsplan', () => {
  it('hält die vorgegebene Staffelung 3 / 7 / 14 / 21 Kalendertage ein', () => {
    expect(DEFAULT_REMINDER_PLAN.map((s) => s.afterCalendarDays)).toEqual([3, 7, 14, 21]);
  });

  it('schreibt nur die ersten beiden Stufen an den Kunden', () => {
    expect(DEFAULT_REMINDER_PLAN.map((s) => s.notifiesCustomer)).toEqual([true, true, false, false]);
  });

  it('steigert die Dringlichkeit monoton', () => {
    const rang = { LOW: 0, NORMAL: 1, HIGH: 2, URGENT: 3 } as const;
    const werte = DEFAULT_REMINDER_PLAN.map((s) => rang[s.priority]);
    for (let i = 1; i < werte.length; i++) {
      expect(werte[i]).toBeGreaterThanOrEqual(werte[i - 1] as number);
    }
  });
});

describe('Unterdrückung von Erinnerungen', () => {
  it('versendet, wenn alle Voraussetzungen erfüllt sind', () => {
    expect(suppressionReason(versandfaehig)).toBeNull();
  });

  it('unterdrückt bei geschlossenem Vorgang', () => {
    expect(suppressionReason({ ...versandfaehig, caseOpen: false })).toBe('CASE_CLOSED');
  });

  it('unterdrückt nach erfolgter Signatur', () => {
    expect(suppressionReason({ ...versandfaehig, alreadySigned: true })).toBe('ALREADY_SIGNED');
  });

  it('unterdrückt nach Ablehnung durch den Kunden', () => {
    expect(suppressionReason({ ...versandfaehig, customerDeclined: true })).toBe('CUSTOMER_DECLINED');
  });

  it('unterdrückt bei abgelaufenem Angebot', () => {
    expect(suppressionReason({ ...versandfaehig, quoteValid: false })).toBe('QUOTE_EXPIRED');
  });

  it('unterdrückt bei widerrufener oder fehlender Kommunikationserlaubnis', () => {
    expect(suppressionReason({ ...versandfaehig, communicationPermitted: false })).toBe(
      'COMMUNICATION_NOT_PERMITTED',
    );
  });

  it('erzeugt keine Duplikate für denselben Schritt', () => {
    expect(suppressionReason({ ...versandfaehig, alreadySentForStep: true })).toBe('ALREADY_SENT');
  });

  it('nennt bei mehreren Gründen den fachlich stärksten', () => {
    const alles: ReminderContext = {
      caseOpen: false,
      quoteValid: false,
      alreadySigned: true,
      customerDeclined: true,
      communicationPermitted: false,
      alreadySentForStep: true,
    };
    expect(suppressionReason(alles)).toBe('CASE_CLOSED');
  });
});
