import { spawn } from 'node:child_process';

const DEFAULT_URL = 'http://127.0.0.1:3000/systems/support-ticket-deflection/review-control-smoke';
const DEFAULT_SESSION = 'deflection-review-control-smoke';
const DEFAULT_BROWSER_BIN = 'agent-browser';
const DEFAULT_BROWSER_ARGS = '--no-sandbox';

function usage() {
  console.log(`Deflection review-control browser smoke

Usage:
  npm --prefix web run smoke:deflection-review-control-browser -- \\
    --url http://127.0.0.1:3000/systems/support-ticket-deflection/review-control-smoke

Options:
  --url <url>            Local smoke page URL (default: ${DEFAULT_URL})
  --session <name>       agent-browser session name (default: ${DEFAULT_SESSION})
  --browser-bin <path>   agent-browser executable (default: ${DEFAULT_BROWSER_BIN})
  --browser-args <args>  Launch args for Chromium (default: ${DEFAULT_BROWSER_ARGS})
  --json                 Print machine-readable JSON
`);
}

function parseArgs(argv) {
  const options = {
    url: DEFAULT_URL,
    session: DEFAULT_SESSION,
    browserBin: process.env.AGENT_BROWSER_BIN || DEFAULT_BROWSER_BIN,
    browserArgs: process.env.AGENT_BROWSER_ARGS || DEFAULT_BROWSER_ARGS,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--url' || arg === '--session' || arg === '--browser-bin' || arg === '--browser-args') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value.`);
      }
      if (arg === '--url') options.url = value;
      if (arg === '--session') options.session = value;
      if (arg === '--browser-bin') options.browserBin = value;
      if (arg === '--browser-args') options.browserArgs = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  const url = new URL(options.url);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('--url must point at a local dev server.');
  }
  return options;
}

function runAgent(args, options = {}) {
  const { browserBin, session, browserArgs, stdin = '', allowFailure = false, launch = false } = options;
  const globalArgs = ['--session', session];
  if (launch && browserArgs) {
    globalArgs.push('--args', browserArgs);
  }
  const commandArgs = [...globalArgs, ...args];

  return new Promise((resolve, reject) => {
    const child = spawn(browserBin, commandArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      reject(new Error(`${browserBin} failed to start: ${error.message}`));
    });
    child.on('close', (code) => {
      const result = { code, stdout: stdout.trim(), stderr: stderr.trim(), command: `${browserBin} ${commandArgs.join(' ')}` };
      if (code !== 0 && !allowFailure) {
        reject(new Error(`${result.command} failed.\n${result.stderr || result.stdout}`));
        return;
      }
      resolve(result);
    });
    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

function parseEvalOutput(stdout) {
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  const lastLine = lines.at(-1) ?? '';
  let parsed = JSON.parse(lastLine);
  if (typeof parsed === 'string') parsed = JSON.parse(parsed);
  return parsed;
}

async function evalJson(script, options) {
  const wrapped = `JSON.stringify((() => { ${script} })())`;
  const result = await runAgent(['eval', '--stdin'], { ...options, stdin: wrapped });
  return parseEvalOutput(result.stdout);
}

async function waitFor(label, predicateScript, options) {
  const startedAt = Date.now();
  let lastState = null;
  while (Date.now() - startedAt < 8000) {
    lastState = await evalJson(predicateScript, options);
    if (lastState?.ok === true) return lastState;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const error = new Error(`Timed out waiting for ${label}.`);
  error.state = lastState;
  throw error;
}

function collectStateScript() {
  return `
    const markers = [
      'review-control-success',
      'review-control-no-key',
      'review-control-unconfigured',
      'review-control-save-failure',
    ];
    const cases = Object.fromEntries(markers.map((marker) => {
      const scope = document.querySelector(\`[data-smoke="\${marker}"]\`);
      const buttons = scope ? Array.from(scope.querySelectorAll('button')).map((button) => ({
        label: button.getAttribute('aria-label') || button.textContent.trim(),
        disabled: button.disabled,
        pressed: button.getAttribute('aria-pressed'),
      })) : [];
      return [marker, {
        exists: Boolean(scope),
        text: scope?.innerText || '',
        buttons,
      }];
    }));
    return { ok: true, cases };
  `;
}

function assertReadyScript() {
  return `
    const state = (() => { ${collectStateScript()} })();
    const success = state.cases['review-control-success'];
    const noKey = state.cases['review-control-no-key'];
    const unconfigured = state.cases['review-control-unconfigured'];
    const failure = state.cases['review-control-save-failure'];
    const ok = success.exists &&
      success.text.includes('Keep suppressed') &&
      noKey.exists &&
      noKey.text.includes('No review handle for this row.') &&
      noKey.buttons.length === 2 &&
      noKey.buttons.every((button) => button.disabled) &&
      unconfigured.exists &&
      unconfigured.text.includes('Decision storage is not configured.') &&
      unconfigured.buttons.length === 2 &&
      unconfigured.buttons.every((button) => button.disabled) &&
      failure.exists &&
      failure.text.includes('Ready for review.') &&
      failure.buttons.length === 2 &&
      failure.buttons.every((button) => !button.disabled);
    return { ok, cases: state.cases };
  `;
}

function clickButtonScript(marker, label) {
  return `
    const scope = document.querySelector('[data-smoke="${marker}"]');
    const button = scope ? Array.from(scope.querySelectorAll('button')).find((candidate) => candidate.getAttribute('aria-label') === '${label}') : null;
    if (!button) return { ok: false, error: 'button not found', marker: '${marker}', label: '${label}' };
    if (button.disabled) return { ok: false, error: 'button disabled', marker: '${marker}', label: '${label}' };
    button.click();
    return { ok: true };
  `;
}

function savedPromoteScript() {
  return `
    const state = (() => { ${collectStateScript()} })();
    const success = state.cases['review-control-success'];
    const promoted = success.buttons.find((button) => button.label === 'Promote to review');
    return {
      ok: success.text.includes('Saved: Promote to review.') && promoted?.pressed === 'true',
      case: success,
    };
  `;
}

function saveFailureScript() {
  return `
    const state = (() => { ${collectStateScript()} })();
    const failure = state.cases['review-control-save-failure'];
    return {
      ok: failure.text.includes('Smoke save failed.') && failure.buttons.every((button) => !button.disabled),
      case: failure,
    };
  `;
}

async function runSmoke(options) {
  await runAgent(['close'], { ...options, allowFailure: true });
  await runAgent(['errors', '--clear'], { ...options, launch: true });
  await runAgent(['open', options.url], { ...options, launch: true });
  await runAgent(['wait', '[data-smoke="review-control-success"]'], options);

  const readyState = await waitFor('initial review-control states', assertReadyScript(), options);
  const successClick = await evalJson(clickButtonScript('review-control-success', 'Promote to review'), options);
  if (!successClick.ok) {
    throw Object.assign(new Error('Could not click the success promote button.'), { state: successClick });
  }
  const savedState = await waitFor('successful save state', savedPromoteScript(), options);

  const failureClick = await evalJson(clickButtonScript('review-control-save-failure', 'Promote to review'), options);
  if (!failureClick.ok) {
    throw Object.assign(new Error('Could not click the failure promote button.'), { state: failureClick });
  }
  const failureState = await waitFor('failed save state', saveFailureScript(), options);

  const errors = await runAgent(['errors'], options);
  if (errors.stdout || errors.stderr) {
    throw Object.assign(new Error('agent-browser reported page errors.'), {
      state: { stdout: errors.stdout, stderr: errors.stderr },
    });
  }

  return {
    ok: true,
    url: options.url,
    ready: readyState.ok,
    saved: savedState.ok,
    failure: failureState.ok,
  };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    const result = await runSmoke(options);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('Deflection review-control browser smoke passed.');
    }
  } catch (error) {
    const output = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      state: error instanceof Error && 'state' in error ? error.state : undefined,
    };
    if (options?.json) {
      console.error(JSON.stringify(output, null, 2));
    } else {
      console.error(output.error);
      if (output.state) console.error(JSON.stringify(output.state, null, 2));
    }
    process.exitCode = 1;
  } finally {
    if (options) {
      await runAgent(['close'], { ...options, allowFailure: true }).catch(() => {});
    }
  }
}

await main();
