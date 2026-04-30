import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Classification = {
  docId: string;
  fileName: string;
  fileSize: string;
  classification: string;
  confidence: number;
  extracted: { label: string; value: string }[];
  routing: string;
  flags: string[];
};

const CLASSIFICATIONS: Record<string, Classification> = {
  'invoice-acme': {
    docId: 'invoice-acme',
    fileName: 'ACME-Invoice-Q3-2024.pdf',
    fileSize: '127 KB',
    classification: 'Invoice / Accounts Payable',
    confidence: 0.94,
    extracted: [
      { label: 'Vendor', value: 'ACME Corp' },
      { label: 'Invoice #', value: 'INV-2024-0917' },
      { label: 'Total', value: '$24,500.00' },
      { label: 'Due date', value: '2024-10-15' },
      { label: 'Line items', value: '8' },
    ],
    routing: 'AP queue → Finance approver (Maya R.)',
    flags: ['Auto-matched to PO #PO-1042', 'Vendor previously approved'],
  },
  'resume-smith': {
    docId: 'resume-smith',
    fileName: 'Smith-Resume.docx',
    fileSize: '84 KB',
    classification: 'Candidate Resume — Senior IC',
    confidence: 0.91,
    extracted: [
      { label: 'Name', value: 'Jordan Smith' },
      { label: 'Years experience', value: '9' },
      { label: 'Top skills', value: 'Python, AWS, ML pipelines' },
      { label: 'Target role', value: 'Senior Data Engineer' },
      { label: 'Location', value: 'San Francisco, CA' },
    ],
    routing: 'ATS → recruiter inbox (data-eng pipeline)',
    flags: ['Strong match: open Senior Data Engineer req', 'Salary band check pending'],
  },
  'nda-vendor': {
    docId: 'nda-vendor',
    fileName: 'Vendor-NDA-v2.pdf',
    fileSize: '246 KB',
    classification: 'Mutual NDA — vendor',
    confidence: 0.88,
    extracted: [
      { label: 'Counterparty', value: 'Initech Industries' },
      { label: 'Governing law', value: 'Delaware' },
      { label: 'Term', value: '3 years' },
      { label: 'Mutual', value: 'Yes' },
      { label: 'Atypical clauses', value: 'Non-solicit (12 mo)' },
    ],
    routing: 'Legal review queue → in-house counsel',
    flags: ['Non-standard non-solicit detected', 'Auto-redline available from playbook'],
  },
  'support-issue': {
    docId: 'support-issue',
    fileName: 'Customer-Issue.eml',
    fileSize: '12 KB',
    classification: 'Support ticket — billing inquiry',
    confidence: 0.96,
    extracted: [
      { label: 'Customer', value: 'Globex Co' },
      { label: 'Issue type', value: 'Billing — duplicate charge' },
      { label: 'Urgency', value: 'Medium' },
      { label: 'Sentiment', value: 'Frustrated' },
      { label: 'Suggested owner', value: 'Tier 2 billing' },
    ],
    routing: 'Helpdesk → Tier 2 billing (auto-assigned)',
    flags: ['Customer on Enterprise plan', 'Repeat ticket (3rd this month)'],
  },
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { docId?: string } | null;
  const docId = body?.docId;

  if (!docId || typeof docId !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing docId.' }, { status: 400 });
  }

  const result = CLASSIFICATIONS[docId];
  if (!result) {
    return NextResponse.json({ ok: false, error: 'Unknown docId.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    result,
    note: 'Demo data. A production deploy passes the parsed document to an LLM with a strict classification schema and stores the result.',
  });
}
