/**
 * Feature Flags.
 *
 * Sie steuern ausschließlich, welcher Adapter greift und welche noch nicht
 * abgenommenen Oberflächen sichtbar sind. Ein Flag ersetzt niemals eine
 * Berechtigungsprüfung.
 */

export const FEATURE_FLAGS = [
  'callidus.realAdapter',
  'signature.realProvider',
  'portal.customerUploads',
  'privacy.selfServiceExport',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

/**
 * Vorgabe. `callidus.realAdapter` und `signature.realProvider` sind fest
 * ausgeschaltet und dürfen nur nach Abschluss der jeweiligen offenen Punkte
 * (O-04, O-08) aktiviert werden.
 */
export const DEFAULT_FEATURE_FLAGS: Readonly<Record<FeatureFlag, boolean>> = {
  'callidus.realAdapter': false,
  'signature.realProvider': false,
  'portal.customerUploads': true,
  'privacy.selfServiceExport': false,
};

/** Flags, die im MVP nicht aktivierbar sind, unabhängig von der Konfiguration. */
export const LOCKED_FEATURE_FLAGS: readonly FeatureFlag[] = [
  'callidus.realAdapter',
  'signature.realProvider',
];

export function isFeatureEnabled(
  flag: FeatureFlag,
  overrides: Partial<Record<FeatureFlag, boolean>> = {},
): boolean {
  if (LOCKED_FEATURE_FLAGS.includes(flag)) {
    return false;
  }
  return overrides[flag] ?? DEFAULT_FEATURE_FLAGS[flag];
}
