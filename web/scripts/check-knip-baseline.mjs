import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ISSUE_TYPES = [
  'binaries',
  'catalog',
  'dependencies',
  'devDependencies',
  'duplicates',
  'enumMembers',
  'exports',
  'files',
  'namespaceMembers',
  'nsExports',
  'nsTypes',
  'optionalPeerDependencies',
  'types',
  'unlisted',
  'unresolved',
];

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const baselineUrl = new URL('../knip-baseline.json', import.meta.url);

function findingKey(finding) {
  return `${finding.type}\u0000${finding.file}\u0000${finding.name}`;
}

function compareFindings(a, b) {
  return findingKey(a).localeCompare(findingKey(b));
}

function uniqueSorted(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings.sort(compareFindings)) {
    const key = findingKey(finding);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

function normalizeFinding(raw, context) {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${context}: finding must be an object.`);
  }
  const { type, file, name } = raw;
  if (typeof type !== 'string' || typeof file !== 'string' || typeof name !== 'string') {
    throw new Error(`${context}: finding requires string type, file, and name.`);
  }
  return { type, file, name };
}

function entryName(entry, context) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
    return entry.name;
  }
  throw new Error(`${context}: Knip entry must be a string or object with name.`);
}

export function normalizeBaseline(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Baseline must be a JSON object.');
  }
  if (raw.version !== 1 || raw.tool !== 'knip') {
    throw new Error('Baseline must declare version 1 and tool "knip".');
  }
  if (!Array.isArray(raw.issues)) {
    throw new Error('Baseline must contain an issues array.');
  }
  return uniqueSorted(raw.issues.map((finding, index) => normalizeFinding(finding, `Baseline issue ${index}`)));
}

export function normalizeKnipReport(report) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.issues)) {
    throw new Error('Knip report must contain an issues array.');
  }

  const findings = [];
  report.issues.forEach((issue, issueIndex) => {
    if (!issue || typeof issue !== 'object' || typeof issue.file !== 'string') {
      throw new Error(`Knip issue ${issueIndex}: issue requires a file string.`);
    }

    for (const type of ISSUE_TYPES) {
      const entries = issue[type];
      if (entries === undefined) continue;
      if (!Array.isArray(entries)) {
        throw new Error(`Knip issue ${issue.file}: ${type} must be an array.`);
      }
      entries.forEach((entry, entryIndex) => {
        findings.push({
          type,
          file: issue.file,
          name: entryName(entry, `Knip issue ${issue.file} ${type}[${entryIndex}]`),
        });
      });
    }
  });

  return uniqueSorted(findings);
}

export function diffFindings(baseline, current) {
  const baselineKeys = new Map(baseline.map((finding) => [findingKey(finding), finding]));
  const currentKeys = new Map(current.map((finding) => [findingKey(finding), finding]));

  return {
    added: current.filter((finding) => !baselineKeys.has(findingKey(finding))),
    removed: baseline.filter((finding) => !currentKeys.has(findingKey(finding))),
  };
}

function formatFinding(finding) {
  return `${finding.type}: ${finding.file} :: ${finding.name}`;
}

export function formatDrift(diff) {
  const lines = [];
  if (diff.added.length > 0) {
    lines.push('New Knip findings not in baseline:');
    lines.push(...diff.added.map((finding) => `  + ${formatFinding(finding)}`));
  }
  if (diff.removed.length > 0) {
    lines.push('Baseline findings resolved or renamed; update knip-baseline.json:');
    lines.push(...diff.removed.map((finding) => `  - ${formatFinding(finding)}`));
  }
  return lines.join('\n');
}

function runKnipJson() {
  const command = process.platform === 'win32' ? 'knip.cmd' : 'knip';
  const result = spawnSync(command, ['--reporter', 'json', '--no-exit-code', '--no-progress'], {
    cwd: webRoot,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  if (result.status !== 0) {
    throw new Error(`knip exited with ${result.status}:\n${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse Knip JSON output: ${message}`);
  }
}

async function main() {
  const baseline = normalizeBaseline(JSON.parse(await readFile(baselineUrl, 'utf8')));
  const current = normalizeKnipReport(runKnipJson());
  const diff = diffFindings(baseline, current);

  if (diff.added.length > 0 || diff.removed.length > 0) {
    console.error(formatDrift(diff));
    process.exitCode = 1;
    return;
  }

  console.log(`Knip baseline matches ${baseline.length} known finding(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
