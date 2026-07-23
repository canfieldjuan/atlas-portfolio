import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { resourceArticles } from '@/lib/resources';
import { SITE_URL } from '@/lib/seo';

const webRoot = process.cwd();

function source(path: string) {
  return readFileSync(resolve(webRoot, path), 'utf8');
}

function productionSources(directory: string): string[] {
  return readdirSync(resolve(webRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return productionSources(relativePath);
    if (!/\.[cm]?[jt]sx?$/.test(entry.name) || /\.test\.[cm]?[jt]sx?$/.test(entry.name)) {
      return [];
    }
    return [source(relativePath)];
  });
}

describe('SEO integrity', () => {
  it('keeps the sitemap public, unique, complete, and truthful', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const articleDates = new Map(
      resourceArticles.map((article) => [
        `${SITE_URL}/resources/${article.slug}`,
        new Date(article.publishedAt).toISOString(),
      ]),
    );

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(`${SITE_URL}/security`);
    expect(urls.some((url) => /\/(admin|partner|intake|results|success|review-control-smoke)(\/|$)/.test(url))).toBe(false);

    for (const entry of entries) {
      const articleDate = articleDates.get(entry.url);
      if (articleDate) {
        expect(new Date(entry.lastModified!).toISOString()).toBe(articleDate);
      } else {
        expect(entry.lastModified).toBeUndefined();
      }
    }
  });

  it('keeps obsolete FAQ structured data out of production source', () => {
    const appAndSeoSource = [
      ...productionSources('src/app'),
      source('src/lib/seo.ts'),
    ].join('\n');

    expect(appAndSeoSource).not.toContain('FAQPage');
    expect(appAndSeoSource).not.toContain('generateFaqJsonLd');
  });

  it('keeps route-specific breadcrumbs out of ancestor layouts', () => {
    const ancestorLayouts = [
      'src/app/resources/layout.tsx',
      'src/app/systems/layout.tsx',
      'src/app/systems/ai-content-ops/layout.tsx',
      'src/app/systems/support-ticket-deflection/layout.tsx',
    ];

    for (const path of ancestorLayouts) {
      expect(source(path)).not.toContain('generateBreadcrumbJsonLd');
    }
  });

  it('assigns breadcrumbs to their index and leaf owners', () => {
    const owners = [
      'src/app/resources/page.tsx',
      'src/app/systems/page.tsx',
      'src/app/systems/ai-content-ops/page.tsx',
      'src/app/systems/support-ticket-deflection/landingConfig-v2.tsx',
      'src/app/systems/support-ticket-deflection/snapshot/page.tsx',
    ];

    for (const path of owners) {
      expect(source(path)).toContain('generateBreadcrumbJsonLd');
    }
  });

  it('preserves the homepage word boundary after the visual line break', () => {
    expect(source('src/app/HomeClient.tsx')).toContain("into<br />{' '}");
  });
});
