import fs from 'fs';
import path from 'path';
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Circle,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

// The PDF is light/white, so use the light-mode (dark wordmark) logo.
// react-pdf can be unreliable loading a bare filesystem path, so read the PNG
// into a Buffer once and pass that as the Image src (most reliable form).
const LOGO_ASPECT = 242 / 60;
let LIGHT_LOGO: Buffer | null = null;
try {
  LIGHT_LOGO = fs.readFileSync(
    path.join(process.cwd(), 'public', 'website-logo-light-mode.png'),
  );
} catch {
  LIGHT_LOGO = null; // fall back to a text wordmark if the asset is missing
}
import type { ScanRecord } from '@/types/scan';
import type { ScoreSet, Opportunity } from '@/types/scoring';
import {
  PDF,
  pdfScoreColor,
  SCORE_LABELS,
  MANUAL_TASK_GROUPS,
  CALENDLY_URL,
} from '@/lib/constants';
import { parseAnswers, computeRouting } from '@/lib/opportunities/opportunityEngine';

// Light-mode "premium consultant deliverable" report. White background, slate
// typography, clean SVG score rings. Visual only — data wiring is unchanged.

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF.bg,
    color: PDF.body,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  cover: {
    backgroundColor: PDF.bg,
    color: PDF.body,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
  },

  // Header strip on non-cover pages
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottom: `1pt solid ${PDF.cardBorder}`,
    marginBottom: 26,
  },
  headerLogo: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: PDF.header },
  headerLogoAccent: { color: PDF.orange },
  pageMeta: { fontSize: 9, color: PDF.faint },

  // Logo block
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoSquare: {
    width: 22,
    height: 22,
    backgroundColor: PDF.orange,
    borderRadius: 4,
    marginRight: 8,
  },
  logoText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: PDF.header },
  logoTextDim: { color: PDF.faint, fontFamily: 'Helvetica' },

  // Typography
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: PDF.faint,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  h1: { fontSize: 34, fontFamily: 'Helvetica-Bold', color: PDF.header, lineHeight: 1.15 },
  h2: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: PDF.header, marginBottom: 18 },
  h3: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: PDF.header, marginBottom: 5 },
  body: { fontSize: 11, color: PDF.bodySoft, lineHeight: 1.6 },
  bodyDark: { fontSize: 11, color: PDF.body, lineHeight: 1.6 },
  muted: { fontSize: 9.5, color: PDF.muted },

  // Cards
  card: {
    backgroundColor: PDF.content,
    border: `1pt solid ${PDF.cardBorder}`,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardWhite: {
    backgroundColor: PDF.bg,
    border: `1pt solid ${PDF.cardBorder}`,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  pill: {
    fontSize: 9,
    color: PDF.bodySoft,
    backgroundColor: PDF.content,
    border: `1pt solid ${PDF.cardBorder}`,
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 9,
    marginRight: 5,
    marginBottom: 5,
  },
  pillOrange: {
    backgroundColor: PDF.orangeBg,
    borderColor: PDF.orangeBorder,
    color: PDF.orangeText,
  },
  pillGreen: {
    backgroundColor: PDF.greenBg,
    borderColor: PDF.greenBorder,
    color: PDF.greenText,
  },

  // Score rings
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scoreCell: { alignItems: 'center', width: '19%', marginBottom: 6 },
  scoreLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    color: PDF.faint,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 5,
  },

  // Key signal callout (light amber)
  signalBox: {
    backgroundColor: PDF.amberSignalBg,
    border: `1pt solid ${PDF.amberSignalBorder}`,
    borderLeft: `3pt solid ${PDF.amberSignalRule}`,
    borderRadius: 8,
    padding: 14,
  },
  signalLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PDF.amberSignalLabel,
    marginBottom: 5,
  },
  signalText: { fontSize: 11.5, color: PDF.amberSignalText, lineHeight: 1.5 },

  // Opportunity rows
  oppRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottom: `1pt solid ${PDF.hairline}`,
  },
  oppNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PDF.faint,
    width: 24,
  },
  oppTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: PDF.header, marginBottom: 3 },
  oppBody: { fontSize: 11, color: PDF.muted, lineHeight: 1.5 },
  oppOffer: { fontSize: 10.5, color: PDF.orangeText, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  impactBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
  },

  // Table
  th: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PDF.faint,
    paddingBottom: 8,
  },
  tableHeadRow: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${PDF.cardBorder}`,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: `1pt solid ${PDF.hairline}`,
  },
  td: { fontSize: 11, color: PDF.body },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    color: PDF.faint,
    borderTop: `1pt solid ${PDF.hairline}`,
    paddingTop: 8,
  },

  coverAccent: {
    width: 40,
    height: 4,
    backgroundColor: PDF.orange,
    borderRadius: 2,
    marginBottom: 18,
  },
  coverDomain: { fontSize: 13, color: PDF.muted, marginTop: 6 },

  // 2-col layout
  twoCol: { flexDirection: 'row', gap: 18 },
  colLeft: { width: '58%' },
  colRight: { width: '42%' },
});

function PageHeader({ domain }: { domain: string }) {
  return (
    <View style={styles.pageHeader} fixed>
      {LIGHT_LOGO ? (
        <Image src={LIGHT_LOGO} style={{ height: 18, width: 18 * LOGO_ASPECT }} />
      ) : (
        <Text style={styles.headerLogo}>
          REMAP <Text style={styles.headerLogoAccent}>Intelligence</Text>
        </Text>
      )}
      <Text style={styles.pageMeta}>{domain}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Prepared by REMAP Intelligence · remap.ai</Text>
      <Text>Confidential</Text>
    </View>
  );
}

// Clean light-mode SVG score ring.
function ScoreRingPdf({ value, label }: { value: number; label: string }) {
  const size = 64;
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, value)) / 10;
  // react-pdf's SVG types don't expose strokeDashoffset, so draw the partial
  // arc with a "<filled> <gap>" dash array instead. react-pdf rejects a 0 in
  // the dash array, so a full ring (10/10) skips the dash entirely, and we
  // clamp the filled length to a tiny positive value for a 0 score.
  const filled = Math.max(0.01, c * pct);
  const gap = c - filled;
  const isFull = gap <= 0;
  const color = pdfScoreColor(value);
  return (
    <View style={styles.scoreCell}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={PDF.hairline} strokeWidth={6} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={isFull ? undefined : `${filled} ${gap}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color }}>{value}</Text>
        </View>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

function impactBadgeStyle(impact: Opportunity['impact']) {
  if (impact === 'HIGH') {
    return { backgroundColor: PDF.greenBg, color: PDF.greenText };
  }
  if (impact === 'MED') {
    return { backgroundColor: '#fffbeb', color: '#b45309' };
  }
  return { backgroundColor: PDF.content, color: PDF.muted };
}

interface PdfData {
  scan: ScanRecord;
  scores: ScoreSet;
  opportunities: Opportunity[];
}

function ReportDocument({ scan, scores, opportunities }: PdfData) {
  const company =
    scan.scan_homepage?.title?.split(/[|\-–·]/)[0]?.trim() || scan.clean_domain;
  const ans = parseAnswers(scan);
  const routing = computeRouting(scan);
  const top3 = opportunities.slice(0, 3);
  const techSignals = scan.scan_homepage?.techSignals ?? [];
  const generatedDate = scan.created_at
    ? new Date(scan.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');
  const selectedTasks = scan.checkbox_selections ?? [];
  const routingLabel = routing === 'unknown' ? 'growth' : routing;

  return (
    <Document title={`REMAP Intelligence Report — ${scan.clean_domain}`}>
      {/* Page 1 — Cover */}
      <Page size="A4" style={styles.cover}>
        {LIGHT_LOGO ? (
          <Image src={LIGHT_LOGO} style={{ height: 30, width: 30 * LOGO_ASPECT }} />
        ) : (
          <View style={styles.logoRow}>
            <View style={styles.logoSquare} />
            <Text style={styles.logoText}>
              REMAP <Text style={styles.logoTextDim}>Intelligence</Text>
            </Text>
          </View>
        )}

        <View>
          <View style={styles.coverAccent} />
          <Text style={styles.h1}>AI Readiness{'\n'}Report</Text>
          <Text style={{ fontSize: 21, fontFamily: 'Helvetica-Bold', color: PDF.header, marginTop: 14 }}>
            {company}
          </Text>
          <Text style={styles.coverDomain}>{scan.clean_domain}</Text>
          <View style={styles.pillRow}>
            <Text style={[styles.pill, styles.pillOrange]}>Confidential</Text>
            <Text style={styles.pill}>Generated {generatedDate}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 10, color: PDF.faint, borderTop: `1pt solid ${PDF.cardBorder}`, paddingTop: 14 }}>
          Prepared by REMAP Intelligence · remap.ai
        </Text>
      </Page>

      {/* Page 2 — Executive Summary */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.h2}>{company}</Text>

        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <View style={styles.card}>
              <Text style={styles.h3}>Company profile</Text>
              <Text style={styles.body}>Domain: {scan.clean_domain}</Text>
              <Text style={styles.body}>
                Domain age:{' '}
                {scan.scan_wayback?.domainAgeYears != null
                  ? `${scan.scan_wayback.domainAgeYears} years`
                  : 'Unknown'}
              </Text>
              <Text style={styles.body}>
                Email provider: {scan.scan_mx_record?.provider ?? 'Unknown'}
              </Text>
              <View style={styles.pillRow}>
                {techSignals.length ? (
                  techSignals.map((t) => (
                    <Text key={t} style={styles.pill}>
                      {t}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.muted}>No major platforms detected.</Text>
                )}
              </View>
            </View>

            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>Key signal</Text>
              <Text style={styles.signalText}>{scores.signal}</Text>
            </View>
          </View>

          <View style={styles.colRight}>
            <View style={styles.scoreRow}>
              {SCORE_LABELS.map(({ key, label }) => (
                <ScoreRingPdf
                  key={key}
                  value={(scores as unknown as Record<string, number>)[key]}
                  label={label}
                />
              ))}
            </View>
            <View style={[styles.cardWhite, { marginTop: 10 }]}>
              <Text style={styles.h3}>
                Recommended focus:{' '}
                <Text style={{ color: PDF.orange }}>{routingLabel}</Text>
              </Text>
              <Text style={styles.body}>
                {routing === 'efficiency'
                  ? 'You are near capacity — efficiency unlocks scale.'
                  : 'Headroom exists to win and serve more clients.'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Top 3 opportunities</Text>
        {top3.map((o, i) => (
          <Text key={o.id} style={[styles.bodyDark, { marginBottom: 4 }]}>
            {String(i + 1).padStart(2, '0')}. {o.title} — {o.offer}
          </Text>
        ))}

        <Footer />
      </Page>

      {/* Page 3 — Scorecard */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Scorecard</Text>
        <Text style={styles.h2}>AI Readiness Scorecard</Text>
        <View style={[styles.scoreRow, { marginBottom: 20 }]}>
          {SCORE_LABELS.map(({ key, label }) => (
            <ScoreRingPdf
              key={key}
              value={(scores as unknown as Record<string, number>)[key]}
              label={label}
            />
          ))}
        </View>
        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>Key signal</Text>
          <Text style={styles.signalText}>{scores.signal}</Text>
        </View>
        <Text style={[styles.body, { marginTop: 16 }]}>
          Scores are out of 10. Red (0–3) indicates a critical gap, amber (4–5) a
          developing area, blue (6–7) solid, and green (8–10) strong. Several
          signals — Google reviews, LinkedIn presence, headcount — populate as the
          full data pipeline activates.
        </Text>
        <Footer />
      </Page>

      {/* Page 4 — Opportunities */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Priorities</Text>
        <Text style={styles.h2}>Top Opportunities</Text>
        {top3.map((o, i) => {
          const badge = impactBadgeStyle(o.impact);
          return (
            <View key={o.id} style={styles.oppRow}>
              <Text style={styles.oppNumber}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.impactBadge, badge]}>{o.impact}</Text>
                  <Text style={styles.muted}>{o.category}</Text>
                </View>
                <Text style={styles.oppTitle}>{o.title}</Text>
                <Text style={styles.oppBody}>{o.body}</Text>
                <Text style={styles.oppOffer}>REMAP can: {o.offer}</Text>
              </View>
            </View>
          );
        })}
        {top3.length === 0 && (
          <Text style={styles.body}>
            No critical gaps surfaced — your setup is comparatively mature.
          </Text>
        )}
        <Footer />
      </Page>

      {/* Page 5 — Tech Stack */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Detected technology</Text>
        <Text style={styles.h2}>Tech Stack</Text>
        <View style={styles.tableHeadRow}>
          <Text style={[styles.th, { width: '60%' }]}>Technology</Text>
          <Text style={[styles.th, { width: '40%' }]}>Signal</Text>
        </View>
        {techSignals.length ? (
          techSignals.map((t) => (
            <View key={t} style={styles.tableRow}>
              <Text style={[styles.td, { width: '60%' }]}>{t}</Text>
              <Text style={[styles.td, { width: '40%', color: PDF.green }]}>Detected</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.body, { marginTop: 8 }]}>
            No major third-party platforms detected on the homepage.
          </Text>
        )}
        <Text style={[styles.h3, { marginTop: 18 }]}>Email provider</Text>
        <Text style={styles.body}>
          {scan.scan_mx_record?.provider ?? 'Unknown'} —{' '}
          {scan.scan_mx_record?.ecosystem === 'google'
            ? 'Gemini for Workspace likely available'
            : scan.scan_mx_record?.ecosystem === 'microsoft'
              ? 'Microsoft Copilot may be on your licence'
              : 'No native AI assistant detected'}
        </Text>
        {scan.scan_crtsh?.interestingSubdomains?.length ? (
          <>
            <Text style={[styles.h3, { marginTop: 18 }]}>Notable subdomains</Text>
            <View style={styles.pillRow}>
              {scan.scan_crtsh.interestingSubdomains.map((s) => (
                <Text key={s} style={styles.pill}>
                  {s}
                </Text>
              ))}
            </View>
          </>
        ) : null}
        <Footer />
      </Page>

      {/* Page 6 — Competitor (only if provided) */}
      {scan.competitor_domain ? (
        <Page size="A4" style={styles.page}>
          <PageHeader domain={scan.clean_domain} />
          <Text style={styles.sectionTitle}>Benchmark</Text>
          <Text style={styles.h2}>Competitor Comparison</Text>
          <Text style={styles.body}>
            {scan.clean_domain} vs {scan.competitor_domain}
          </Text>
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.bodyDark}>
              Full competitor benchmarking activates in the next data release. We
              flagged {scan.competitor_domain} for a side-by-side AEO, tech-stack
              and readiness comparison — included in your follow-up call.
            </Text>
          </View>
          <Footer />
        </Page>
      ) : null}

      {/* Page 7 — Manual Tasks */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Operational load</Text>
        <Text style={styles.h2}>Manual Tasks Analysis</Text>
        <Text style={styles.body}>
          {selectedTasks.length} of 20 tasks identified as handled manually.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {MANUAL_TASK_GROUPS.map((g) => (
            <View key={g.group} style={{ flex: 1 }}>
              <Text style={[styles.scoreLabel, { textAlign: 'left', marginTop: 0, marginBottom: 6 }]}>
                {g.group}
              </Text>
              {g.tasks.map((task) => {
                const checked = selectedTasks.includes(task);
                return (
                  <View
                    key={task}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    {/* Font-independent dot — a styled box, not a glyph. */}
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        marginRight: 6,
                        backgroundColor: checked ? PDF.orange : 'transparent',
                        border: checked ? 'none' : `1pt solid ${PDF.cardBorder}`,
                      }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 9,
                        color: checked ? PDF.header : PDF.faint,
                        fontFamily: checked ? 'Helvetica-Bold' : 'Helvetica',
                      }}
                    >
                      {task}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {ans.q1 ? (
          <View style={[styles.signalBox, { marginTop: 18 }]}>
            <Text style={styles.signalLabel}>Biggest constraint (your words)</Text>
            <Text style={styles.signalText}>{ans.q1}</Text>
          </View>
        ) : null}
        <Footer />
      </Page>

      {/* Page 8 — Next Steps */}
      <Page size="A4" style={styles.page}>
        <PageHeader domain={scan.clean_domain} />
        <Text style={styles.sectionTitle}>Where to go next</Text>
        <Text style={styles.h2}>Next Steps</Text>
        <View style={styles.card}>
          <Text style={styles.bodyDark}>
            Your recommended pathway:{' '}
            <Text style={{ color: PDF.orange, fontFamily: 'Helvetica-Bold' }}>
              {routingLabel}
            </Text>
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>
            Book a free 15-minute AI Opportunity call with REMAP. We&apos;ll walk
            you through the highest-impact moves from this report and how to action
            them.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: PDF.orange,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 18,
            alignSelf: 'flex-start',
            marginTop: 6,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Helvetica-Bold' }}>
            Book a 15-minute call »
          </Text>
        </View>
        <Text style={[styles.muted, { marginTop: 8 }]}>{CALENDLY_URL}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

export async function generatePDF(data: PdfData): Promise<Buffer> {
  return renderToBuffer(<ReportDocument {...data} />);
}
