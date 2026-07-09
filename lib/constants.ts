// Design tokens — single source of truth for the frontend.
// Every value is a CSS custom property defined in app/globals.css for BOTH
// themes (light + dark, switched via <html data-theme>). Components keep
// using T.* in inline styles and become theme-aware automatically.
// NOTE: these are var() strings — usable in CSS/inline styles/SVG only,
// never in emails or PDFs (those use literal hexes / the PDF palette below).
export const T = {
  // Backgrounds — layered depth, not flat
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  elevated: 'var(--elevated)',
  surfaceHover: 'var(--surface-hover)',

  // Borders
  borderSubtle: 'var(--border-subtle)',
  borderVisible: 'var(--border-visible)',
  borderStrong: 'var(--border-strong)',
  borderFocus: 'var(--border-focus)',

  // Brand accent
  orange: 'var(--orange)',
  orangeHover: 'var(--orange-hover)',
  orangeDim: 'var(--orange-dim)',
  orangeBorder: 'var(--orange-border)',

  // Kept for backwards-compat with existing component references
  blue: 'var(--blue)',
  blueDim: 'var(--blue-dim)',

  // Text hierarchy — 4 levels
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textDisabled: 'var(--text-disabled)',

  // Semantic scores
  red: 'var(--red)',
  amber: 'var(--amber)',
  blueScore: 'var(--blue-score)',
  green: 'var(--green)',

  // Semantic backgrounds (callout boxes)
  amberBg: 'var(--amber-bg)',
  amberBorder: 'var(--amber-border)',
  redBg: 'var(--red-bg)',
  greenBg: 'var(--green-bg)',
  blueBg: 'var(--blue-bg)',

  // Component-level tokens
  pillBg: 'var(--pill-bg)',
  inputBg: 'var(--input-bg)',
} as const;

export function scoreColor(n: number): string {
  if (n <= 3) return T.red;
  if (n <= 5) return T.amber;
  if (n <= 7) return T.blueScore;
  return T.green;
}

// Light-mode palette for the PDF report (premium consultant deliverable).
export const PDF = {
  bg: '#ffffff',
  content: '#f8fafc',
  cardBorder: '#e2e8f0',
  hairline: '#f1f5f9',
  header: '#0f172a',
  body: '#334155',
  bodySoft: '#475569',
  muted: '#64748b',
  faint: '#94a3b8',
  orange: '#f97316',
  orangeBg: '#fff7ed',
  orangeBorder: '#fed7aa',
  orangeText: '#c2410c',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
  greenText: '#15803d',
  amber: '#d97706',
  amberSignalBg: '#fffbeb',
  amberSignalBorder: '#fde68a',
  amberSignalRule: '#f59e0b',
  amberSignalLabel: '#b45309',
  amberSignalText: '#78350f',
  red: '#dc2626',
  blue: '#2563eb',
} as const;

// Score colors for the LIGHT PDF (darker, print-friendly values).
export function pdfScoreColor(n: number): string {
  if (n <= 3) return PDF.red;
  if (n <= 5) return PDF.amber;
  if (n <= 7) return PDF.blue;
  return PDF.green;
}

// The 5 questions, exact text per spec.
export interface QuestionDef {
  id: string;
  type: 'text' | 'capacity' | 'pills';
  q: string;
  placeholder?: string;
  hint?: string;
  multi?: boolean;
  other?: boolean;
  options?: string[];
  fields?: { key: string; label: string; suffix: string }[];
}

export const QUESTIONS: QuestionDef[] = [
  {
    id: 'q1',
    type: 'text',
    q: "What's the single biggest thing limiting your growth or performance right now?",
    placeholder:
      "e.g. Not enough leads, too much manual admin, can't scale without hiring...",
  },
  {
    id: 'q2',
    type: 'capacity',
    q: "How many new clients are you currently taking on per month — and what's your realistic capacity?",
    fields: [
      { key: 'q2Current', label: 'Currently taking on', suffix: 'new clients/month' },
      { key: 'q2Capacity', label: 'Capacity up to', suffix: 'per month' },
    ],
  },
  {
    id: 'q3',
    type: 'pills',
    multi: true,
    other: true,
    q: 'Where does most of your new business currently come from?',
    hint: 'Select all that apply.',
    options: [
      'Word of mouth & referrals',
      'Inbound from our website',
      'Active prospecting',
      'Cold outreach',
      'Paid advertising',
      'Generative AI / AI search',
      'Repeat & existing clients',
      'No clear source',
    ],
  },
  {
    id: 'q4',
    type: 'pills',
    q: 'How often do you proactively contact your existing database at scale?',
    options: [
      'Weekly',
      'Monthly',
      'A few times a year',
      'Rarely or never',
      'No consolidated database',
    ],
  },
  {
    id: 'q5',
    type: 'pills',
    q: 'Do you have any guidelines for how your team uses AI tools?',
    options: [
      'Yes — formal policy',
      'Informal guidelines only',
      'None at all',
      "We don't allow AI tool use",
    ],
  },
];

// Manual tasks checklist groups, exact labels per spec.
export interface TaskGroup {
  group: string;
  tasks: string[];
}

export const MANUAL_TASK_GROUPS: TaskGroup[] = [
  {
    group: 'FINANCE',
    tasks: ['Invoicing', 'Chasing payments', 'Expense tracking', 'Financial reporting'],
  },
  {
    group: 'SALES & CLIENT MANAGEMENT',
    tasks: ['Lead follow-up', 'CRM data entry', 'Booking appointments', 'Client onboarding'],
  },
  {
    group: 'MARKETING',
    tasks: ['Writing content', 'Social posting', 'Email campaigns', 'Listings & SEO updates'],
  },
  {
    group: 'OPERATIONS',
    tasks: ['Reporting prep', 'Document drafting', 'Scheduling', 'Compliance checks'],
  },
  {
    group: 'TEAM & HR',
    tasks: ['Onboarding staff', 'Internal Q&A', 'Rostering', 'Performance tracking'],
  },
];

export const SCORE_LABELS: { key: string; label: string }[] = [
  { key: 'aeo', label: 'AEO' },
  { key: 'geo', label: 'GEO' },
  { key: 'readiness', label: 'AI Readiness' },
  { key: 'opportunity', label: 'AI Opportunity' },
  { key: 'icp', label: 'ICP Fit' },
];

export const CALENDLY_URL = 'https://calendly.com/remap-ai';
