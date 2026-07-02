// Design tokens — single source of truth (frontend dark theme).
export const T = {
  // Backgrounds — layered depth, not flat black
  bg: '#0a0f1a',
  surface: '#111827',
  elevated: '#1a2235',
  surfaceHover: '#1e2a3a',

  // Borders
  borderSubtle: 'rgba(148,163,184,0.08)',
  borderVisible: 'rgba(148,163,184,0.15)',
  borderFocus: 'rgba(99,179,237,0.4)',

  // Brand accent — brighter, cleaner orange
  orange: '#f97316',
  orangeHover: '#fb923c',
  orangeDim: 'rgba(249,115,22,0.12)',
  orangeBorder: 'rgba(249,115,22,0.3)',

  // Kept for backwards-compat with existing component references
  blue: '#045089',
  blueDim: 'rgba(4,80,137,0.2)',

  // Text hierarchy — 4 levels
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#334155',

  // Semantic scores — softer
  red: '#f87171',
  amber: '#fbbf24',
  blueScore: '#60a5fa',
  green: '#4ade80',

  // Semantic backgrounds (callout boxes)
  amberBg: 'rgba(251,191,36,0.08)',
  amberBorder: 'rgba(251,191,36,0.2)',
  redBg: 'rgba(248,113,113,0.08)',
  greenBg: 'rgba(74,222,128,0.08)',
  blueBg: 'rgba(96,165,250,0.08)',
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
