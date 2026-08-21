import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  PERMISSIONS_FORBIDDEN_FOR_CUSTOMERS,
  ROLES,
  type Permission,
} from '../roles.js';

describe('Rollen und Berechtigungen', () => {
  it('kennt für jede Rolle eine Zuordnung', () => {
    for (const role of ROLES) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it('vergibt ausschließlich definierte Berechtigungen', () => {
    const known = new Set<string>(PERMISSIONS);
    for (const role of ROLES) {
      for (const permission of DEFAULT_ROLE_PERMISSIONS[role]) {
        expect(known.has(permission)).toBe(true);
      }
    }
  });

  it('gibt der Kundenrolle keine einzige verbotene Berechtigung', () => {
    const kunde = new Set<Permission>(DEFAULT_ROLE_PERMISSIONS.CUSTOMER);
    const verstoesse = PERMISSIONS_FORBIDDEN_FOR_CUSTOMERS.filter((p) => kunde.has(p));
    expect(verstoesse).toEqual([]);
  });

  it('beschränkt die Kundenrolle auf eigene Objekte', () => {
    for (const permission of DEFAULT_ROLE_PERMISSIONS.CUSTOMER) {
      expect(permission.endsWith(':own')).toBe(true);
    }
  });

  it('erlaubt die Angebotsfreigabe nur dem Agenten', () => {
    const freigeben = ROLES.filter((r) => DEFAULT_ROLE_PERMISSIONS[r].includes('quote:approve'));
    expect(freigeben).toEqual(['AGENT']);
  });

  it('gibt dem Innendienst keine Angebotsfreigabe und keine Benutzerverwaltung', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.BACK_OFFICE).not.toContain('quote:approve');
    expect(DEFAULT_ROLE_PERMISSIONS.BACK_OFFICE).not.toContain('user:manage');
  });

  it('gibt dem Dienstkonto standardmäßig keine Rechte', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.SERVICE_ACCOUNT).toEqual([]);
  });

  it('erlaubt die Audit-Einsicht nur der Administration', () => {
    const lesen = ROLES.filter((r) => DEFAULT_ROLE_PERMISSIONS[r].includes('audit:read'));
    expect(lesen).toEqual(['ADMIN']);
  });
});
