import { describe, expect, it } from 'vitest';
import {
  CASE_STATUSES,
  CASE_TRANSITIONS,
  TERMINAL_CASE_STATUSES,
  checkTransition,
  findTransition,
  transitionsFor,
  transitionsFrom,
  type CaseStatus,
} from '../case-status.js';

describe('Statusmaschine — Aufbau', () => {
  it('vergibt jeden Übergangscode nur einmal', () => {
    const codes = CASE_TRANSITIONS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('verwendet ausschließlich bekannte Statuswerte', () => {
    const known = new Set<string>(CASE_STATUSES);
    for (const transition of CASE_TRANSITIONS) {
      expect(known.has(transition.to)).toBe(true);
      for (const from of transition.from) {
        expect(known.has(from)).toBe(true);
      }
    }
  });

  it('führt aus keinem Endzustand heraus', () => {
    for (const terminal of TERMINAL_CASE_STATUSES) {
      expect(transitionsFrom(terminal)).toHaveLength(0);
    }
  });

  it('erreicht jeden Status außer DRAFT über mindestens einen Übergang', () => {
    const reachable = new Set(CASE_TRANSITIONS.map((t) => t.to));
    const unreachable = CASE_STATUSES.filter((s) => s !== 'DRAFT' && !reachable.has(s));
    expect(unreachable).toEqual([]);
  });

  it('lässt jeden Nicht-Endzustand wieder verlassen', () => {
    const dead = CASE_STATUSES.filter(
      (s) => !TERMINAL_CASE_STATUSES.includes(s) && transitionsFrom(s).length === 0,
    );
    expect(dead).toEqual([]);
  });

  it('benennt für jeden Übergang ein Audit-Ereignis', () => {
    for (const transition of CASE_TRANSITIONS) {
      expect(transition.auditEvent).toMatch(/^case\.[a-z_]+$/);
    }
  });

  it('lässt keinen Übergang ohne Vorbedingung oder ohne handelnde Rolle', () => {
    for (const transition of CASE_TRANSITIONS) {
      expect(transition.actors.length).toBeGreaterThan(0);
      expect(transition.from.length).toBeGreaterThan(0);
    }
  });
});

describe('Statusmaschine — Prüfung', () => {
  it('erlaubt einen gültigen Übergang', () => {
    const result = checkTransition('CASE_START_DATA_COLLECTION', 'DRAFT', 'AGENT');
    expect(result).toEqual({
      allowed: true,
      transition: findTransition('CASE_START_DATA_COLLECTION'),
      noop: false,
    });
  });

  it('weist einen unbekannten Code ab', () => {
    const result = checkTransition('CASE_DOES_NOT_EXIST', 'DRAFT', 'AGENT');
    expect(result).toEqual({ allowed: false, reason: 'UNKNOWN_TRANSITION' });
  });

  it('weist einen falschen Ausgangsstatus ab', () => {
    const result = checkTransition('CASE_COMPLETE', 'DRAFT', 'AGENT');
    expect(result).toEqual({ allowed: false, reason: 'WRONG_SOURCE_STATUS' });
  });

  it('weist eine nicht berechtigte Rolle ab', () => {
    const result = checkTransition('CASE_APPROVE_QUOTE', 'MANUAL_REVIEW_REQUIRED', 'CUSTOMER');
    expect(result).toEqual({ allowed: false, reason: 'ACTOR_NOT_PERMITTED' });
  });

  it('behandelt einen Aufruf im Zielzustand als No-Op statt als Fehler', () => {
    const result = checkTransition('CASE_COMPLETE', 'COMPLETED', 'SYSTEM');
    expect(result.allowed).toBe(true);
    expect(result.allowed && result.noop).toBe(true);
  });

  it('verhindert jeden weiteren Übergang aus einem Endzustand', () => {
    const result = checkTransition('CASE_CANCEL', 'COMPLETED', 'AGENT');
    expect(result).toEqual({ allowed: false, reason: 'TERMINAL_STATUS' });
  });
});

describe('Statusmaschine — fachliche Zusicherungen', () => {
  it('erlaubt keiner Kundenrolle, ein Angebot freizugeben', () => {
    const approving = CASE_TRANSITIONS.filter((t) => t.to === 'QUOTE_APPROVED');
    for (const transition of approving) {
      expect(transition.actors).not.toContain('CUSTOMER');
    }
  });

  it('erlaubt dem Innendienst keine Angebotsfreigabe', () => {
    expect(findTransition('CASE_APPROVE_QUOTE')?.actors).not.toContain('BACK_OFFICE');
  });

  it('lässt QUOTE_APPROVED nur über Automatik oder menschliche Freigabe zu', () => {
    const codes = CASE_TRANSITIONS.filter((t) => t.to === 'QUOTE_APPROVED').map((t) => t.code);
    expect(codes.sort()).toEqual(['CASE_APPROVE_QUOTE', 'CASE_QUOTE_VALIDATION_PASSED']);
  });

  it('erreicht QUOTE_APPROVED aus MANUAL_REVIEW_REQUIRED nur durch einen Menschen', () => {
    const transition = findTransition('CASE_APPROVE_QUOTE');
    expect(transition?.actors).toEqual(['AGENT']);
  });

  it('lässt eine Übermittlung an die Gegenseite nie durch den Kunden auslösen', () => {
    for (const code of ['CASE_SUBMIT_QUOTE_REQUEST', 'CASE_SUBMIT_TO_CALLIDUS']) {
      expect(findTransition(code)?.actors).not.toContain('CUSTOMER');
    }
  });

  it('markiert bestätigte Übermittlungen als nicht wiederholbar', () => {
    for (const code of ['CASE_CONFIRM_QUOTE_SUBMITTED', 'CASE_CONFIRM_CALLIDUS_SUBMISSION']) {
      const transition = findTransition(code);
      expect(transition?.retryable).toBe(false);
      expect(transition?.compensation).not.toBeNull();
    }
  });

  it('bietet dem Kunden im Portal nur Öffnen, Signieren und Ablehnen an', () => {
    const fromSent = transitionsFor('SENT_TO_CUSTOMER', 'CUSTOMER').map((t) => t.code);
    expect(fromSent.sort()).toEqual([
      'CASE_CUSTOMER_DECLINED',
      'CASE_CUSTOMER_OPENED',
      'CASE_START_SIGNATURE',
    ]);
  });

  it('führt jeden Weg vom Entwurf bis zum Abschluss ohne Sackgasse', () => {
    // Breitensuche über die Übergangstabelle: COMPLETED muss von DRAFT erreichbar sein.
    const visited = new Set<CaseStatus>(['DRAFT']);
    const queue: CaseStatus[] = ['DRAFT'];
    while (queue.length > 0) {
      const current = queue.shift() as CaseStatus;
      for (const transition of transitionsFrom(current)) {
        if (!visited.has(transition.to)) {
          visited.add(transition.to);
          queue.push(transition.to);
        }
      }
    }
    expect(visited.has('COMPLETED')).toBe(true);
    expect([...CASE_STATUSES].filter((s) => !visited.has(s))).toEqual([]);
  });
});
