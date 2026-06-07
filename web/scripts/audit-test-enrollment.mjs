import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = dirname(scriptsDir);
const repoRoot = dirname(webRoot);

function defaultPaths() {
  return {
    packageJsonPath: join(webRoot, 'package.json'),
    workflowPath: join(repoRoot, '.github/workflows/pre_push_audit.yml'),
  };
}

export function collectTestScripts(packageJsonText) {
  const packageJson = JSON.parse(packageJsonText);
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    return [];
  }

  return Object.keys(scripts)
    .filter((name) => name.startsWith('test:'))
    .sort();
}

export function collectWorkflowTestRuns(workflowText) {
  const enrolled = new Set();
  const commandPattern = /\bnpm\s+--prefix\s+web\s+run\s+([^\s'"`#]+)/g;

  for (const line of workflowText.split(/\r?\n/)) {
    const activeLine = stripYamlComment(line);
    if (!activeLine.trim()) {
      continue;
    }

    for (const match of activeLine.matchAll(commandPattern)) {
      const scriptName = match[1];
      if (scriptName.startsWith('test:')) {
        enrolled.add(scriptName);
      }
    }
  }

  return [...enrolled].sort();
}

export function findMissingTestEnrollment(testScripts, enrolledScripts) {
  const enrolled = new Set(enrolledScripts);
  return testScripts.filter((scriptName) => !enrolled.has(scriptName)).sort();
}

export async function auditTestEnrollment(options = {}) {
  const paths = { ...defaultPaths(), ...options };
  const [packageJsonText, workflowText] = await Promise.all([
    readFile(paths.packageJsonPath, 'utf8'),
    readFile(paths.workflowPath, 'utf8'),
  ]);

  const testScripts = collectTestScripts(packageJsonText);
  const enrolledScripts = collectWorkflowTestRuns(workflowText);
  const missingScripts = findMissingTestEnrollment(testScripts, enrolledScripts);

  return {
    enrolledScripts,
    missingScripts,
    packageJsonPath: paths.packageJsonPath,
    testScripts,
    workflowPath: paths.workflowPath,
  };
}

function stripYamlComment(line) {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const previous = line[index - 1];

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote && previous !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === '#' && !inSingleQuote && !inDoubleQuote) {
      return line.slice(0, index);
    }
  }

  return line;
}

function parseArgs(argv) {
  const paths = defaultPaths();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--package-json') {
      paths.packageJsonPath = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === '--workflow') {
      paths.workflowPath = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return paths;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a path value`);
  }
  return value;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const result = await auditTestEnrollment(options);
  if (result.missingScripts.length === 0) {
    console.log(`All ${result.testScripts.length} test:* scripts are enrolled in ${result.workflowPath}.`);
    return 0;
  }

  console.error('Missing CI enrollment for test:* scripts:');
  for (const scriptName of result.missingScripts) {
    console.error(`- ${scriptName}`);
  }
  console.error('');
  console.error(`Add each missing script to ${result.workflowPath} as:`);
  console.error('  npm --prefix web run <test-script>');
  console.error('If a future manual command must use test:*, add an explicit audited exemption with a reason.');
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().then((status) => {
    process.exitCode = status;
  }).catch((error) => {
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  });
}
