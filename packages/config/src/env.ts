/**
 * Typisierte, beim Start validierte Konfiguration.
 *
 * Grundsatz (docs/architecture/security-model.md §8): Die Anwendung startet
 * nicht mit einem unsicheren Vorgabewert. Fehlt ein sicherheitsrelevanter Wert,
 * bricht der Start mit einer Meldung ab, die das fehlende Feld benennt — aber
 * niemals einen Wert ausgibt.
 */

import { z } from 'zod';

const NODE_ENVS = ['development', 'test', 'production'] as const;

/** Geheimnisse müssen ausreichend lang sein; kurze Werte sind meist Platzhalter. */
const secret = z.string().min(32, 'Geheimnis ist zu kurz (mindestens 32 Zeichen)');

const url = z.string().url();

export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVS).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // --- API ---
    API_PORT: z.coerce.number().int().positive().default(3001),
    API_PUBLIC_URL: url,
    WEB_PUBLIC_URL: url,
    /** Erlaubte Ursprünge für CORS. Kommagetrennt, kein Platzhalter zulässig. */
    CORS_ALLOWED_ORIGINS: z
      .string()
      .min(1)
      .transform((value) => value.split(',').map((entry) => entry.trim()).filter(Boolean)),

    // --- Datenhaltung ---
    DATABASE_URL: z.string().startsWith('postgresql://'),
    REDIS_URL: z.string().startsWith('redis://'),

    // --- Object Storage ---
    STORAGE_ENDPOINT: url,
    STORAGE_REGION: z.string().min(1).default('eu-central-1'),
    STORAGE_BUCKET: z.string().min(1),
    STORAGE_ACCESS_KEY_ID: z.string().min(1),
    STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
    STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
    /** Gültigkeit signierter Downloadlinks in Sekunden. */
    STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(300),

    // --- Identität ---
    OIDC_ISSUER_URL: url,
    OIDC_CLIENT_ID: z.string().min(1),
    OIDC_CLIENT_SECRET: z.string().min(1),
    OIDC_AUDIENCE: z.string().min(1),

    // --- Magic Link ---
    MAGIC_LINK_SECRET: secret,
    MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(30),

    // --- E-Mail ---
    EMAIL_PROVIDER: z.enum(['smtp', 'console']).default('smtp'),
    EMAIL_FROM: z.string().email(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    // --- Malware-Scan ---
    MALWARE_SCANNER: z.enum(['clamav', 'noop']).default('clamav'),
    CLAMAV_HOST: z.string().default('localhost'),
    CLAMAV_PORT: z.coerce.number().int().positive().default(3310),

    // --- Adapter ---
    CALLIDUS_ADAPTER: z.enum(['mock', 'manual', 'real']).default('mock'),
    SIGNATURE_PROVIDER: z.enum(['mock', 'manual']).default('mock'),
    SIGNATURE_WEBHOOK_SECRET: secret,

    // --- Upload-Grenzen ---
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  })
  .superRefine((env, ctx) => {
    // Der reale Callidus-Adapter ist nicht freigegeben (CD-003).
    if (env.CALLIDUS_ADAPTER === 'real') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CALLIDUS_ADAPTER'],
        message:
          'Der reale Callidus-Adapter ist nicht freigegeben. Siehe docs/callidus/capability-matrix.md §5.',
      });
    }
    if (env.NODE_ENV !== 'production') return;

    // In Produktion sind Behelfsimplementierungen unzulässig.
    if (env.MALWARE_SCANNER === 'noop') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MALWARE_SCANNER'],
        message: 'Ohne Malware-Scan ist kein Produktivbetrieb zulässig.',
      });
    }
    if (env.EMAIL_PROVIDER === 'console') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_PROVIDER'],
        message: 'Der Konsolen-Versand ist nur für Entwicklung und Test vorgesehen.',
      });
    }
    for (const origin of env.CORS_ALLOWED_ORIGINS) {
      if (origin === '*' || origin.startsWith('http://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ALLOWED_ORIGINS'],
          message: 'In Produktion sind Platzhalter und unverschlüsselte Ursprünge unzulässig.',
        });
      }
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export class ConfigurationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`Konfiguration ungültig:\n  - ${issues.join('\n  - ')}`);
    this.name = 'ConfigurationError';
  }
}

/**
 * Liest und validiert die Umgebung. Die Fehlermeldung nennt ausschließlich
 * Feldnamen und Regeln, nie den gelesenen Wert — sonst landen Geheimnisse im
 * Startprotokoll.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const issues = result.error.issues.map((issue) => {
    const field = issue.path.join('.') || '(unbekanntes Feld)';
    return `${field}: ${issue.message}`;
  });
  throw new ConfigurationError(issues);
}
