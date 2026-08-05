/**
 * Every piece of website copy an admin can edit.
 *
 * This doubles as an allow-list and as the source of default values, so the
 * site renders correctly against an empty database and an admin can always
 * reset a field back to what shipped.
 *
 * `list` fields hold newline-separated entries; `group` fields hold one record
 * per line with values separated by ` | ` in the order given by `columns`.
 */

export type ContentType = 'text' | 'textarea' | 'number' | 'url' | 'list' | 'rows';

export interface ContentField {
  key: string;
  label: string;
  page: string;
  section: string;
  type: ContentType;
  default: string;
  help?: string;
  /** For `rows`: the meaning of each ` | ` separated column. */
  columns?: string[];
}

export const CONTENT_PAGES = [
  { id: 'global', title: 'Global', description: 'Brand name, contact details and the footer shown on every page.' },
  { id: 'home', title: 'Homepage', description: 'Hero, statistics, features, how-it-works steps and testimonials.' },
  { id: 'pricing', title: 'Pricing', description: 'Plan names, prices and what each plan includes.' },
  { id: 'about', title: 'About', description: 'Company story and values.' },
  { id: 'contact', title: 'Contact', description: 'Contact channels and response expectations.' },
] as const;

export const CONTENT_FIELDS: ContentField[] = [
  // ── Global ────────────────────────────────────────────────────────────────
  { key: 'global.brandName', label: 'Brand name', page: 'global', section: 'Brand', type: 'text', default: 'InfluDubai AI' },
  {
    key: 'global.tagline', label: 'Tagline', page: 'global', section: 'Brand', type: 'text',
    default: 'Creator intelligence and influencer marketing built for the UAE and wider MENA market.',
  },
  { key: 'global.supportEmail', label: 'Support email', page: 'global', section: 'Contact', type: 'text', default: 'hello@infludubai.com' },
  { key: 'global.salesEmail', label: 'Sales email', page: 'global', section: 'Contact', type: 'text', default: 'sales@infludubai.com' },
  { key: 'global.phone', label: 'Phone / WhatsApp', page: 'global', section: 'Contact', type: 'text', default: '+971 54 318 6934' },
  {
    key: 'global.whatsappUrl', label: 'WhatsApp link', page: 'global', section: 'Contact', type: 'url',
    default: 'https://wa.me/971543186934',
  },
  { key: 'global.address', label: 'Address', page: 'global', section: 'Contact', type: 'text', default: 'Dubai, United Arab Emirates' },
  {
    key: 'global.footerNote', label: 'Footer strapline', page: 'global', section: 'Footer', type: 'text',
    default: 'Built for UAE & MENA creators and brands.',
  },

  // ── Homepage ──────────────────────────────────────────────────────────────
  { key: 'home.hero.badge', label: 'Hero badge', page: 'home', section: 'Hero', type: 'text', default: 'AI-powered creator marketing' },
  {
    key: 'home.hero.title', label: 'Hero headline', page: 'home', section: 'Hero', type: 'text',
    default: 'Find the right creators. Prove the return.',
  },
  {
    key: 'home.hero.subtitle', label: 'Hero subheadline', page: 'home', section: 'Hero', type: 'textarea',
    default:
      'Discover verified UAE and MENA creators, vet their audiences before you spend, and run every campaign from brief to payout in one place.',
  },
  { key: 'home.hero.primaryCta', label: 'Primary button', page: 'home', section: 'Hero', type: 'text', default: 'Start free' },
  { key: 'home.hero.secondaryCta', label: 'Secondary button', page: 'home', section: 'Hero', type: 'text', default: 'Browse creators' },
  {
    key: 'home.stats', label: 'Statistics', page: 'home', section: 'Statistics', type: 'rows',
    columns: ['Value', 'Label'],
    default: [
      '12,000+ | Verified Creators',
      '850+ | Active Brands',
      '3,200+ | Campaigns',
      'AED 40M+ | Creator Earnings',
    ].join('\n'),
    help: 'One statistic per line, as: value | label',
  },
  { key: 'home.features.title', label: 'Features heading', page: 'home', section: 'Features', type: 'text', default: 'Everything you need in one platform' },
  {
    key: 'home.features.subtitle', label: 'Features subheading', page: 'home', section: 'Features', type: 'textarea',
    default: 'Built around the way influencer campaigns really run in this region.',
  },
  {
    key: 'home.features', label: 'Feature cards', page: 'home', section: 'Features', type: 'rows',
    columns: ['Title', 'Description'],
    default: [
      'Creator Discovery | Search 12,000+ verified UAE & MENA creators by niche, location, followers and engagement.',
      'AI Matching Engine | AI-powered matching recommends the best creators for every campaign brief automatically.',
      'Fraud Detection | Flag fake followers, bot engagement and suspicious growth patterns before you spend.',
      'Campaign Analytics | Real-time dashboards: reach, engagement, conversions, ROI — all in one view.',
      'Built-in Collaboration | Proposals, deliverables, messaging and approvals all inside the platform.',
      'MENA-First Platform | Built for UAE, KSA, Egypt and MENA. Arabic-ready with local market intelligence.',
    ].join('\n'),
    help: 'One card per line, as: title | description',
  },
  { key: 'home.steps.title', label: 'How it works heading', page: 'home', section: 'How it works', type: 'text', default: 'How it works' },
  {
    key: 'home.steps', label: 'Steps', page: 'home', section: 'How it works', type: 'rows',
    columns: ['Title', 'Description'],
    default: [
      'Create your profile | Brands set campaign goals. Creators add niche, rates and link social accounts in minutes.',
      'AI finds the right match | Our engine scores and ranks creators against your brief using 20+ audience signals.',
      'Collaborate and launch | Proposals, live tracking, payments — all handled inside the platform from day one.',
    ].join('\n'),
    help: 'One step per line, as: title | description',
  },
  { key: 'home.testimonials.title', label: 'Testimonials heading', page: 'home', section: 'Testimonials', type: 'text', default: 'Trusted by brands and creators' },
  {
    key: 'home.testimonials', label: 'Testimonials', page: 'home', section: 'Testimonials', type: 'rows',
    columns: ['Quote', 'Name', 'Role'],
    default: [
      'InfluDubai AI cut our influencer sourcing time by 70%. The fraud detection alone saved us from a costly mistake. | Sarah Al-Mansoori | Marketing Director',
      'We found three incredible UAE lifestyle creators in 20 minutes. The AI matching is genuinely impressive. | Ahmed Khalil | Brand Manager',
      'The analytics dashboard helped me understand my audience and confidently raise my rates by 40%. | Layla Hassan | Fashion Creator, Dubai',
    ].join('\n'),
    help: 'One per line, as: quote | name | role',
  },
  {
    key: 'home.brands', label: 'Brand logos strip', page: 'home', section: 'Social proof', type: 'list',
    default: ['Noon', 'Emirates', 'Majid Al Futtaim', 'Talabat', 'Careem', 'ADNOC', 'Emaar', 'Etisalat'].join('\n'),
    help: 'One brand name per line.',
  },
  { key: 'home.cta.title', label: 'Closing CTA heading', page: 'home', section: 'Closing CTA', type: 'text', default: 'Ready to run better campaigns?' },
  {
    key: 'home.cta.subtitle', label: 'Closing CTA text', page: 'home', section: 'Closing CTA', type: 'textarea',
    default: 'Join the brands and creators already working together on InfluDubai AI. Free to start.',
  },

  // ── Pricing ───────────────────────────────────────────────────────────────
  { key: 'pricing.title', label: 'Page heading', page: 'pricing', section: 'Header', type: 'text', default: 'Simple, transparent pricing' },
  {
    key: 'pricing.subtitle', label: 'Page subheading', page: 'pricing', section: 'Header', type: 'textarea',
    default: 'Start free. Upgrade when you need more campaigns, seats and analytics depth. No markup on creator rates, ever.',
  },
  { key: 'pricing.currency', label: 'Currency code', page: 'pricing', section: 'Header', type: 'text', default: 'AED', help: 'Shown next to every price, e.g. AED.' },
  { key: 'pricing.period', label: 'Billing period label', page: 'pricing', section: 'Header', type: 'text', default: '/month' },

  { key: 'pricing.free.name', label: 'Plan 1 name', page: 'pricing', section: 'Free plan', type: 'text', default: 'Free' },
  { key: 'pricing.free.price', label: 'Plan 1 price', page: 'pricing', section: 'Free plan', type: 'number', default: '0' },
  { key: 'pricing.free.tagline', label: 'Plan 1 tagline', page: 'pricing', section: 'Free plan', type: 'text', default: 'Everything you need to run your first campaign.' },
  {
    key: 'pricing.free.features', label: 'Plan 1 features', page: 'pricing', section: 'Free plan', type: 'list',
    default: ['1 active campaign', '5 creator engagements', 'Full marketplace search', 'Fraud risk scores', 'In-platform messaging', '1 team seat'].join('\n'),
    help: 'One feature per line.',
  },

  { key: 'pricing.professional.name', label: 'Plan 2 name', page: 'pricing', section: 'Professional plan', type: 'text', default: 'Professional' },
  { key: 'pricing.professional.price', label: 'Plan 2 price', page: 'pricing', section: 'Professional plan', type: 'number', default: '99' },
  { key: 'pricing.professional.tagline', label: 'Plan 2 tagline', page: 'pricing', section: 'Professional plan', type: 'text', default: 'For brands running campaigns continuously.' },
  {
    key: 'pricing.professional.features', label: 'Plan 2 features', page: 'pricing', section: 'Professional plan', type: 'list',
    default: ['10 active campaigns', '100 creator engagements', 'AI creator insights', 'Full campaign analytics', 'Priority email support', '5 team seats'].join('\n'),
  },

  { key: 'pricing.enterprise.name', label: 'Plan 3 name', page: 'pricing', section: 'Enterprise plan', type: 'text', default: 'Enterprise' },
  { key: 'pricing.enterprise.price', label: 'Plan 3 price', page: 'pricing', section: 'Enterprise plan', type: 'number', default: '99' },
  { key: 'pricing.enterprise.tagline', label: 'Plan 3 tagline', page: 'pricing', section: 'Enterprise plan', type: 'text', default: 'For agencies managing multiple clients.' },
  {
    key: 'pricing.enterprise.features', label: 'Plan 3 features', page: 'pricing', section: 'Enterprise plan', type: 'list',
    default: ['Unlimited campaigns', 'Unlimited engagements', 'Unlimited client workspaces', 'Unlimited team seats', 'AI campaign prediction', 'Dedicated account manager'].join('\n'),
  },

  { key: 'pricing.highlight', label: 'Highlighted plan', page: 'pricing', section: 'Header', type: 'text', default: 'professional', help: 'One of: free, professional, enterprise.' },
  {
    key: 'pricing.footnote', label: 'Footnote', page: 'pricing', section: 'Header', type: 'textarea',
    default: 'Prices exclude VAT. Creators are always free to join, and we never mark up creator rates.',
  },

  // ── About ─────────────────────────────────────────────────────────────────
  { key: 'about.title', label: 'Page heading', page: 'about', section: 'Header', type: 'text', default: 'Influencer marketing the region can actually trust' },
  {
    key: 'about.subtitle', label: 'Page subheading', page: 'about', section: 'Header', type: 'textarea',
    default:
      'The UAE creator economy grew faster than the tooling around it. Brands still source creators through DMs and spreadsheets, and still cannot tell a real audience from a purchased one.',
  },
  {
    key: 'about.body', label: 'Story', page: 'about', section: 'Story', type: 'textarea',
    default:
      'InfluDubai AI was built to close that gap. Brands and agencies get a searchable, vetted marketplace of UAE and MENA creators, AI-assisted matching against a real brief, and a workflow that carries a campaign from invitation through deliverable approval to payout.\n\nCreators get something equally overdue: a professional profile that surfaces them to serious buyers, a verification badge that means something, clear rates agreed up front, and payment released automatically when work is approved.\n\nWe take a transparent platform fee on creator payouts and offer subscription tiers for teams that need more campaigns, seats and analytics depth. There are no hidden markups on creator rates.',
    help: 'Blank line between paragraphs.',
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  { key: 'contact.title', label: 'Page heading', page: 'contact', section: 'Header', type: 'text', default: 'Get in touch' },
  {
    key: 'contact.subtitle', label: 'Page subheading', page: 'contact', section: 'Header', type: 'textarea',
    default: 'Questions about campaigns, enterprise plans, verification or partnerships — we read everything that comes in.',
  },
  { key: 'contact.responseTime', label: 'Response time', page: 'contact', section: 'Header', type: 'text', default: 'Within one business day' },
];

const BY_KEY = new Map(CONTENT_FIELDS.map((f) => [f.key, f]));

export function getField(key: string): ContentField | undefined {
  return BY_KEY.get(key);
}

export function isKnownContentKey(key: string): boolean {
  return BY_KEY.has(key);
}

/** Built-in copy, used whenever a key has no override stored. */
export function defaults(): Record<string, string> {
  return Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.default]));
}
