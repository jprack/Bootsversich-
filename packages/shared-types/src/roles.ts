/**
 * Rollen und Berechtigungen.
 *
 * Berechtigungen werden ausschließlich serverseitig geprüft
 * (docs/architecture/security-model.md §2). Diese Datei liefert die Namen,
 * nicht die Durchsetzung.
 */

export const ROLES = ['AGENT', 'BACK_OFFICE', 'ADMIN', 'CUSTOMER', 'SERVICE_ACCOUNT'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  // Personen
  'customer:read',
  'customer:write',
  'customer:read:own',
  // Leads und Vorgänge
  'lead:read',
  'lead:write',
  'case:read',
  'case:read:own',
  'case:write',
  'case:transition',
  // Angebote
  'quote:read',
  'quote:read:own',
  'quote:approve',
  'quote:request',
  // Dokumente
  'document:read',
  'document:read:own',
  'document:upload',
  'document:upload:own',
  // Signatur
  'signature:start',
  'signature:start:own',
  // Aufgaben
  'task:read',
  'task:write',
  // Callidus
  'callidus:submit',
  'callidus:import',
  // Verwaltung
  'product:read',
  'product:write',
  'product:publish',
  'user:manage',
  'audit:read',
  'privacy:manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Standardzuordnung. In der Datenbank ist sie pflegbar; diese Tabelle ist der
 * Ausgangszustand und die Grundlage der Berechtigungstests.
 *
 * Bewusste Festlegungen:
 * - Innendienst darf alles vorbereiten, aber kein Angebot freigeben
 *   (Vier-Augen-Gedanke bei der einzigen wirtschaftlich bindenden Handlung).
 * - Administrator verwaltet Konfiguration und Benutzer, hat aber keinen
 *   fachlichen Freigabeanspruch.
 * - Kunde sieht ausschließlich eigene Objekte (`:own`).
 */
export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  AGENT: [
    'customer:read',
    'customer:write',
    'lead:read',
    'lead:write',
    'case:read',
    'case:write',
    'case:transition',
    'quote:read',
    'quote:approve',
    'quote:request',
    'document:read',
    'document:upload',
    'signature:start',
    'task:read',
    'task:write',
    'callidus:submit',
    'callidus:import',
    'product:read',
  ],
  BACK_OFFICE: [
    'customer:read',
    'customer:write',
    'lead:read',
    'lead:write',
    'case:read',
    'case:write',
    'case:transition',
    'quote:read',
    'quote:request',
    'document:read',
    'document:upload',
    'task:read',
    'task:write',
    'callidus:import',
    'product:read',
  ],
  ADMIN: [
    'customer:read',
    'lead:read',
    'case:read',
    'quote:read',
    'document:read',
    'task:read',
    'product:read',
    'product:write',
    'product:publish',
    'user:manage',
    'audit:read',
    'privacy:manage',
  ],
  CUSTOMER: [
    'customer:read:own',
    'case:read:own',
    'quote:read:own',
    'document:read:own',
    'document:upload:own',
    'signature:start:own',
  ],
  SERVICE_ACCOUNT: [],
};

/** Berechtigungen, die niemals einer Kundenrolle zugeordnet werden dürfen. */
export const PERMISSIONS_FORBIDDEN_FOR_CUSTOMERS: readonly Permission[] = [
  'customer:read',
  'customer:write',
  'lead:read',
  'lead:write',
  'case:read',
  'case:write',
  'case:transition',
  'quote:read',
  'quote:approve',
  'quote:request',
  'document:read',
  'document:upload',
  'task:read',
  'task:write',
  'callidus:submit',
  'callidus:import',
  'product:write',
  'product:publish',
  'user:manage',
  'audit:read',
  'privacy:manage',
];
