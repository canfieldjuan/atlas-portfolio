import AuditForm from './AuditForm';

const VALID_INTERESTS = new Set([
  'custom-build',
  'competitive-intelligence',
  'content-generation',
  'not-sure',
]);

const VALID_CONTEXTS = new Set(['ongoing-support']);

type AuditPageProps = {
  searchParams: Promise<{ interest?: string | string[]; context?: string | string[] }>;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const interestParam = pickFirst(params.interest);
  const contextParam = pickFirst(params.context);

  const initialInterest =
    interestParam && VALID_INTERESTS.has(interestParam) ? interestParam : null;
  const initialContext =
    contextParam && VALID_CONTEXTS.has(contextParam) ? contextParam : null;

  return <AuditForm initialInterest={initialInterest} initialContext={initialContext} />;
}
