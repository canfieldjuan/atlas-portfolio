import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assertIncludes(haystack, needle, context) {
  assert.ok(haystack.includes(needle), `${context}: expected ${needle}`);
}

function assertNotIncludes(haystack, needle, context) {
  assert.equal(haystack.includes(needle), false, `${context}: unexpected ${needle}`);
}

async function importAnalyticsModule() {
  const analyticsSource = await source('src/lib/analytics.ts');
  const transpiled = ts.transpileModule(analyticsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });

  const tempDir = await mkdtemp(join(tmpdir(), 'atlas-ga-redaction-'));
  const modulePath = join(tempDir, 'analytics.mjs');
  await writeFile(modulePath, transpiled.outputText);

  try {
    return {
      module: await import(pathToFileURL(modulePath).href),
      cleanup: () => rm(tempDir, { force: true, recursive: true }),
    };
  } catch (error) {
    await rm(tempDir, { force: true, recursive: true });
    throw error;
  }
}

const analyticsSource = await source('src/lib/analytics.ts');
const prePushWorkflow = await source('../.github/workflows/pre_push_audit.yml');
const { module: analytics, cleanup } = await importAnalyticsModule();

try {
  const { redactAnalyticsPath, trackEvent, trackPageView } = analytics;

  assert.equal(
    redactAnalyticsPath('/systems/support-ticket-deflection/results/content-ops-unit-123'),
    '/systems/support-ticket-deflection/results/[requestId]',
  );
  assert.equal(
    redactAnalyticsPath(
      '/systems/support-ticket-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner',
    ),
    '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
  );
  assert.equal(
    redactAnalyticsPath('/admin/intake/gap-report/11111111-1111-4111-8111-111111111111/csv'),
    '/admin/intake/gap-report/[requestId]/csv',
  );
  assert.equal(
    redactAnalyticsPath('/resources/support-ticket-deflection-guide'),
    '/resources/support-ticket-deflection-guide',
  );
  assert.equal(redactAnalyticsPath(''), '/');

  const calls = [];
  globalThis.window = {
    location: {
      origin: 'https://portfolio.example.com',
      pathname: '/systems/support-ticket-deflection/results/content-ops-unit-123',
      search: '?checkout=success&priceVariant=partner',
    },
    gtag: (...args) => calls.push(args),
  };
  globalThis.document = { title: 'Support Ticket Deflection Results' };

  trackPageView(
    '/systems/support-ticket-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner',
  );
  const pageView = calls.at(-1);
  assert.equal(pageView[0], 'config');
  assert.equal(pageView[2].page_path, '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner');
  assert.equal(
    pageView[2].page_location,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
  );
  assertNotIncludes(JSON.stringify(pageView), 'content-ops-unit-123', 'redacted page view');

  trackEvent('faq_report_results_viewed', {
    generated_questions: 18,
    page_path: '/systems/support-ticket-deflection/results/raw-id-from-caller',
    page_location: 'https://portfolio.example.com/systems/support-ticket-deflection/results/raw-id-from-caller',
  });
  const event = calls.at(-1);
  assert.equal(event[0], 'event');
  assert.equal(event[1], 'faq_report_results_viewed');
  assert.equal(event[2].generated_questions, 18);
  assert.equal(event[2].page_path, '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner');
  assert.equal(
    event[2].page_location,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
  );
  for (const forbidden of ['content-ops-unit-123', 'raw-id-from-caller']) {
    assertNotIncludes(JSON.stringify(event), forbidden, 'redacted event context');
  }

  assertIncludes(
    analyticsSource,
    "replacement: '/systems/support-ticket-deflection/results/[requestId]'",
    'deflection results route redaction',
  );
  assertIncludes(
    analyticsSource,
    "replacement: '/admin/intake/gap-report/[requestId]'",
    'admin gap-report route redaction',
  );
  assertIncludes(analyticsSource, '...currentAnalyticsPageParams()', 'event page context override');
  assertIncludes(
    prePushWorkflow,
    'npm --prefix web run test:deflection-ga-path-redaction',
    'CI enrollment',
  );

  console.log('Deflection GA path redaction tests passed.');
} finally {
  delete globalThis.window;
  delete globalThis.document;
  await cleanup();
}
