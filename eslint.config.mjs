// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Gemeinsame Lint-Regeln für das gesamte Monorepo.
 *
 * Die Regeln unter "Sicherheits- und Architekturschranken" bilden Festlegungen
 * aus docs/architecture/security-model.md und den ADRs ab. Sie sind bewusst
 * Fehler und keine Warnungen: eine Warnung, die niemand liest, schützt nichts.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '01_CRM_ENGINE/**',
      'apps/api/prisma/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // ---- Sicherheits- und Architekturschranken ----
      'no-restricted-syntax': [
        'error',
        {
          // security-model.md §3: nur parametrisierte Abfragen
          selector:
            "MemberExpression[property.name=/^\\$(queryRawUnsafe|executeRawUnsafe)$/]",
          message:
            'Ungeprüfte Roh-SQL ist untersagt (docs/architecture/security-model.md §3). Prisma-Query oder $queryRaw mit Template-Literal verwenden.',
        },
        {
          // security-model.md §3: kein XSS-Einfallstor
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'dangerouslySetInnerHTML ist untersagt (docs/architecture/security-model.md §3).',
        },
        {
          // ADR-0007: keine generischen Statusänderungen
          selector:
            "CallExpression[callee.property.name=/^(update|updateMany)$/] > ObjectExpression > Property[key.name='data'] > ObjectExpression > Property[key.name='status']",
          message:
            'Status darf nicht direkt geschrieben werden (ADR-0007). Benannten Übergang der Statusmaschine verwenden.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Für Geldbeträge Decimal verwenden (ADR-0004).' },
      ],
    },
  },
  {
    // Tests dürfen protokollieren und mit Testdoubles arbeiten.
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
