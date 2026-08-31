/**
 * The set of settings an admin may edit at runtime.
 *
 * Acts as an allow-list: the settings API refuses any key not listed here,
 * so a compromised admin session can't write arbitrary rows that other code
 * might later read as configuration.
 */

export interface SettingDefinition {
  key: string;
  label: string;
  group: SettingGroupId;
  isSecret: boolean;
  placeholder?: string;
  help?: string;
  /** Rendered as a number input and validated as numeric. */
  numeric?: boolean;
}

export type SettingGroupId =
  | 'openai'
  | 'stripe'
  | 'smtp'
  | 'platform';

export interface SettingGroup {
  id: SettingGroupId;
  title: string;
  description: string;
  docsUrl?: string;
  /** Whether this group supports the "Test connection" action. */
  testable: boolean;
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'openai',
    title: 'OpenAI',
    description:
      'Powers creator insights, campaign suggestions and AI fraud scoring. Without a key these features fall back to rule-based logic.',
    docsUrl: 'https://platform.openai.com/api-keys',
    testable: true,
  },
  {
    id: 'stripe',
    title: 'Stripe',
    description:
      'Subscription billing and creator payouts. Without a key billing runs in mock mode and no real charges are made.',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    testable: true,
  },
  {
    id: 'smtp',
    title: 'Email (SMTP)',
    description:
      'Sends verification and password-reset emails. Without a host, links are written to the server log instead.',
    testable: true,
  },
  {
    id: 'platform',
    title: 'Platform',
    description: 'General platform configuration and commercial terms.',
    testable: false,
  },
];

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    key: 'OPENAI_API_KEY',
    label: 'API key',
    group: 'openai',
    isSecret: true,
    placeholder: 'sk-proj-…',
  },
  {
    key: 'OPENAI_MODEL',
    label: 'Model',
    group: 'openai',
    isSecret: false,
    placeholder: 'gpt-4o-mini',
    help: 'Defaults to gpt-4o-mini — a good cost/quality balance for this workload.',
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Secret key',
    group: 'stripe',
    isSecret: true,
    placeholder: 'sk_live_… or sk_test_…',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    label: 'Webhook signing secret',
    group: 'stripe',
    isSecret: true,
    placeholder: 'whsec_…',
    help: 'From the webhook endpoint you point at /api/v1/billing/webhook.',
  },
  {
    key: 'STRIPE_PRICE_PROFESSIONAL',
    label: 'Professional plan price ID',
    group: 'stripe',
    isSecret: false,
    placeholder: 'price_…',
  },
  {
    key: 'STRIPE_PRICE_ENTERPRISE',
    label: 'Enterprise plan price ID',
    group: 'stripe',
    isSecret: false,
    placeholder: 'price_…',
  },

  // ── SMTP ──────────────────────────────────────────────────────────────────
  {
    key: 'EMAIL_ENABLED',
    label: 'Sending enabled',
    group: 'smtp',
    isSecret: false,
    placeholder: 'on',
    help:
      'Set to "off" to silence every outgoing email without losing the SMTP ' +
      'configuration below. Empty counts as on.',
  },
  { key: 'SMTP_HOST', label: 'Host', group: 'smtp', isSecret: false, placeholder: 'smtp.resend.com' },
  { key: 'SMTP_PORT', label: 'Port', group: 'smtp', isSecret: false, placeholder: '587', numeric: true },
  { key: 'SMTP_USER', label: 'Username', group: 'smtp', isSecret: false, placeholder: 'resend' },
  { key: 'SMTP_PASS', label: 'Password', group: 'smtp', isSecret: true, placeholder: '••••••••' },
  {
    key: 'MAIL_FROM',
    label: 'From address',
    group: 'smtp',
    isSecret: false,
    placeholder: 'InfluDubai <noreply@infludubai.com>',
  },

  // ── Platform ──────────────────────────────────────────────────────────────
  {
    key: 'PLATFORM_FEE_PERCENT',
    label: 'Platform fee (%)',
    group: 'platform',
    isSecret: false,
    placeholder: '10',
    numeric: true,
    help: 'Commission taken from each creator payout.',
  },
  {
    key: 'SUPPORT_EMAIL',
    label: 'Support email',
    group: 'platform',
    isSecret: false,
    placeholder: 'support@infludubai.com',
  },
  {
    key: 'REQUIRE_SIGNUP_APPROVAL',
    label: 'Require admin approval for new accounts',
    group: 'platform',
    isSecret: false,
    placeholder: 'off',
    help:
      'Set to "on" and new signups cannot log in until you approve them in ' +
      'Admin → Users. Existing accounts are unaffected.',
  },
  {
    key: 'PLATFORM_ANNOUNCEMENT',
    label: 'Dashboard announcement',
    group: 'platform',
    isSecret: false,
    placeholder: 'Shown as a banner to all signed-in users. Leave blank to hide.',
  },
];

const BY_KEY = new Map(SETTING_DEFINITIONS.map((d) => [d.key, d]));

export function getDefinition(key: string): SettingDefinition | undefined {
  return BY_KEY.get(key);
}

export function isKnownSetting(key: string): boolean {
  return BY_KEY.has(key);
}
