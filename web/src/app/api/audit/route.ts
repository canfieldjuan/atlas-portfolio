import { NextRequest, NextResponse } from 'next/server';
import { AuditIntakePayload, recordAuditIntake } from '@/lib/audit-intake';
import { isAuditProjectInterest } from '@/lib/audit-routing';

export const runtime = 'nodejs';

function optionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as AuditIntakePayload | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const required = [
      'fullName',
      'workEmail',
      'companyOrProjectUrl',
      'roleAndDecisionScope',
      'projectInterest',
      'biggestBottleneck',
      'automationDataSources',
      'desiredTimeline',
      'securityRequirement',
      'anticipatedInvestmentRange',
    ] as const;

    const missing = required.filter((field) => {
      const value = (body as Record<string, string>)[field];
      return typeof value !== 'string' || value.trim() === '';
    });

    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing required fields: ${missing.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const validRanges = ['phase1', '10k-25k', '25k-50k', '50k+', 'unsure'] as const;
    if (!validRanges.includes(body.anticipatedInvestmentRange as (typeof validRanges)[number])) {
      return NextResponse.json(
        { ok: false, error: 'Invalid investment range.' },
        { status: 400 }
      );
    }

    const validTimelines = ['asap', '30-60', 'quarter', 'exploring'] as const;
    if (!validTimelines.includes(body.desiredTimeline as (typeof validTimelines)[number])) {
      return NextResponse.json(
        { ok: false, error: 'Invalid desired timeline.' },
        { status: 400 }
      );
    }

    if (!isAuditProjectInterest(body.projectInterest)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid project interest.' },
        { status: 400 }
      );
    }

    const validSecurityRequirements = [
      'none',
      'questionnaire',
      'soc2-type1',
      'soc2-type2',
      'unsure',
    ] as const;
    if (
      !validSecurityRequirements.includes(
        body.securityRequirement as (typeof validSecurityRequirements)[number]
      )
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid security requirement.' },
        { status: 400 }
      );
    }

    const normalizedWorkEmail = body.workEmail.trim();
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(normalizedWorkEmail)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid work email address.' },
        { status: 400 }
      );
    }

    const { requestId, deliveries, warnings } = await recordAuditIntake({
      ...body,
      workEmail: normalizedWorkEmail,
      sourcePage: optionalText(body.sourcePage),
      sourcePageLabel: optionalText(body.sourcePageLabel),
      sourceOffer: optionalText(body.sourceOffer),
      sourceOfferLabel: optionalText(body.sourceOfferLabel),
    });

    return NextResponse.json({
      ok: true,
      requestId,
      status: warnings.length > 0 ? 'submitted_with_warnings' : 'submitted',
      delivery: deliveries[0] || null,
      deliveries,
      warnings,
      estimatedResponseHours: 48,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to record this audit request right now.',
      },
      { status: 500 }
    );
  }
}
