export const AUDIT_PROJECT_INTERESTS = [
  {
    value: 'custom-build',
    label: 'Custom AI system / custom build',
  },
  {
    value: 'competitive-intelligence',
    label: 'Competitive / vendor intelligence platform',
  },
  {
    value: 'content-generation',
    label: 'AI Content Ops Station',
  },
  {
    value: 'revenue-ops',
    label: 'Revenue operations automation',
  },
  {
    value: 'data-systems',
    label: 'Business-critical data / knowledge system',
  },
  {
    value: 'agent-workflows',
    label: 'Agent workflow / orchestration',
  },
  {
    value: 'operator-controls',
    label: 'Operator visibility / control surface',
  },
  {
    value: 'not-sure',
    label: 'Not sure yet',
  },
] as const;

export type AuditProjectInterest = (typeof AUDIT_PROJECT_INTERESTS)[number]['value'];

const AUDIT_PROJECT_INTEREST_LABELS: Record<AuditProjectInterest, string> =
  AUDIT_PROJECT_INTERESTS.reduce(
    (acc, item) => ({
      ...acc,
      [item.value]: item.label,
    }),
    {} as Record<AuditProjectInterest, string>
  );

const AUDIT_SOURCE_LABELS: Record<string, string> = {
  'home-hero': 'Home page hero',
  'home-bottom': 'Home page final CTA',
  'home-productized': 'Home page productized systems offer',
  systems: 'Productized systems page',
  'systems-card': 'Productized systems card',
  services: 'Services and pricing page',
  capabilities: 'Capabilities page',
  process: 'Process page',
  architecture: 'Architecture page',
  security: 'Security page',
  privacy: 'Privacy page',
  about: 'About page',
  demo: 'Demo page',
  proof: 'Proof page',
  navigation: 'Site navigation',
  footer: 'Footer',
  resource: 'Resource article',
  'ai-automation-consultant': 'AI automation consultant page',
  'ai-content-ops': 'AI Content Ops Station landing page',
};

const AUDIT_OFFER_LABELS: Record<string, string> = {
  'phase-1-roadmap': 'Phase 1 Roadmap',
  'productized-systems': 'Productized AI systems',
  'competitive-intelligence': 'Competitive / vendor intelligence platform',
  'content-generation': 'AI Content Ops Station',
  'custom-build': 'Custom AI system / custom build',
};

export function isAuditProjectInterest(value: unknown): value is AuditProjectInterest {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(AUDIT_PROJECT_INTEREST_LABELS, value)
  );
}

export function auditProjectInterestLabel(value: string | null | undefined) {
  if (isAuditProjectInterest(value)) {
    return AUDIT_PROJECT_INTEREST_LABELS[value];
  }

  return value || 'Not provided';
}

export function auditSourceLabel(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return AUDIT_SOURCE_LABELS[value] || value;
}

export function auditOfferLabel(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return AUDIT_OFFER_LABELS[value] || auditProjectInterestLabel(value);
}

export function buildAuditHref({
  interest,
  source,
  offer,
}: {
  interest?: AuditProjectInterest;
  source?: string;
  offer?: string;
} = {}) {
  const params = new URLSearchParams();
  if (interest) {
    params.set('interest', interest);
  }
  if (source) {
    params.set('source', source);
  }
  if (offer) {
    params.set('offer', offer);
  }

  const query = params.toString();
  return query ? `/audit?${query}` : '/audit';
}
