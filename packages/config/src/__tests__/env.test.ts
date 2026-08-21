import { describe, expect, it } from 'vitest';
import { ConfigurationError, loadEnv } from '../env.js';
import { DEFAULT_FEATURE_FLAGS, isFeatureEnabled } from '../feature-flags.js';

const gueltig: NodeJS.ProcessEnv = {
  NODE_ENV: 'development',
  API_PUBLIC_URL: 'http://localhost:3001',
  WEB_PUBLIC_URL: 'http://localhost:3000',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://crm:crm@localhost:5432/crm',
  REDIS_URL: 'redis://localhost:6379',
  STORAGE_ENDPOINT: 'http://localhost:9000',
  STORAGE_BUCKET: 'crm-documents',
  STORAGE_ACCESS_KEY_ID: 'local-access-key',
  STORAGE_SECRET_ACCESS_KEY: 'local-secret-key',
  OIDC_ISSUER_URL: 'http://localhost:8080/realms/crm',
  OIDC_CLIENT_ID: 'crm-api',
  OIDC_CLIENT_SECRET: 'local-client-secret',
  OIDC_AUDIENCE: 'crm-api',
  MAGIC_LINK_SECRET: 'x'.repeat(48),
  EMAIL_FROM: 'noreply@example.at',
  SMTP_HOST: 'localhost',
  SIGNATURE_WEBHOOK_SECRET: 'y'.repeat(48),
};

describe('Konfiguration — gültige Umgebung', () => {
  it('liest eine vollständige Entwicklungsumgebung', () => {
    const env = loadEnv(gueltig);
    expect(env.API_PORT).toBe(3001);
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['http://localhost:3000']);
    expect(env.CALLIDUS_ADAPTER).toBe('mock');
    expect(env.SIGNATURE_PROVIDER).toBe('mock');
  });

  it('zerlegt mehrere erlaubte Ursprünge', () => {
    const env = loadEnv({ ...gueltig, CORS_ALLOWED_ORIGINS: 'http://a.local, http://b.local' });
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['http://a.local', 'http://b.local']);
  });
});

describe('Konfiguration — Abbruch statt unsicherer Vorgabe', () => {
  it('bricht ab, wenn ein Pflichtwert fehlt', () => {
    const { DATABASE_URL: _entfernt, ...ohne } = gueltig;
    expect(() => loadEnv(ohne)).toThrow(ConfigurationError);
  });

  it('nennt im Fehlertext das Feld, aber nie den Wert', () => {
    try {
      loadEnv({ ...gueltig, MAGIC_LINK_SECRET: 'zu-kurz-geheim' });
      expect.unreachable('Der Aufruf hätte scheitern müssen.');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('MAGIC_LINK_SECRET');
      expect(message).not.toContain('zu-kurz-geheim');
    }
  });

  it('weist eine Datenbank-URL mit falschem Schema ab', () => {
    expect(() => loadEnv({ ...gueltig, DATABASE_URL: 'mysql://localhost/crm' })).toThrow(
      ConfigurationError,
    );
  });

  it('weist zu kurze Geheimnisse ab', () => {
    expect(() => loadEnv({ ...gueltig, SIGNATURE_WEBHOOK_SECRET: 'kurz' })).toThrow(
      ConfigurationError,
    );
  });
});

describe('Konfiguration — Schutz des Produktivbetriebs', () => {
  const produktiv: NodeJS.ProcessEnv = {
    ...gueltig,
    NODE_ENV: 'production',
    API_PUBLIC_URL: 'https://api.example.at',
    WEB_PUBLIC_URL: 'https://www.example.at',
    CORS_ALLOWED_ORIGINS: 'https://www.example.at',
  };

  it('akzeptiert eine saubere Produktionskonfiguration', () => {
    expect(() => loadEnv(produktiv)).not.toThrow();
  });

  it('lässt den realen Callidus-Adapter in keiner Umgebung zu', () => {
    expect(() => loadEnv({ ...gueltig, CALLIDUS_ADAPTER: 'real' })).toThrow(ConfigurationError);
    expect(() => loadEnv({ ...produktiv, CALLIDUS_ADAPTER: 'real' })).toThrow(ConfigurationError);
  });

  it('lässt in Produktion keinen abgeschalteten Malware-Scan zu', () => {
    expect(() => loadEnv({ ...produktiv, MALWARE_SCANNER: 'noop' })).toThrow(ConfigurationError);
  });

  it('lässt in Produktion keinen Konsolen-Versand zu', () => {
    expect(() => loadEnv({ ...produktiv, EMAIL_PROVIDER: 'console' })).toThrow(ConfigurationError);
  });

  it('lässt in Produktion weder Platzhalter noch unverschlüsselte Ursprünge zu', () => {
    expect(() => loadEnv({ ...produktiv, CORS_ALLOWED_ORIGINS: '*' })).toThrow(ConfigurationError);
    expect(() => loadEnv({ ...produktiv, CORS_ALLOWED_ORIGINS: 'http://www.example.at' })).toThrow(
      ConfigurationError,
    );
  });

  it('erlaubt in der Entwicklung, was in Produktion untersagt ist', () => {
    expect(() => loadEnv({ ...gueltig, MALWARE_SCANNER: 'noop', EMAIL_PROVIDER: 'console' })).not.toThrow();
  });
});

describe('Feature Flags', () => {
  it('hält gesperrte Flags auch gegen eine Übersteuerung aus', () => {
    expect(isFeatureEnabled('callidus.realAdapter', { 'callidus.realAdapter': true })).toBe(false);
    expect(isFeatureEnabled('signature.realProvider', { 'signature.realProvider': true })).toBe(false);
  });

  it('lässt nicht gesperrte Flags übersteuern', () => {
    expect(isFeatureEnabled('portal.customerUploads')).toBe(true);
    expect(isFeatureEnabled('portal.customerUploads', { 'portal.customerUploads': false })).toBe(false);
  });

  it('liefert ohne Übersteuerung die Vorgabe', () => {
    expect(isFeatureEnabled('privacy.selfServiceExport')).toBe(
      DEFAULT_FEATURE_FLAGS['privacy.selfServiceExport'],
    );
  });
});
