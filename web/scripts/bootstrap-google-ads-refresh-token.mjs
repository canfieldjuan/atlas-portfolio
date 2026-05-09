#!/usr/bin/env node
/**
 * One-time OAuth bootstrap for Google Ads API.
 *
 * Runs the authorization-code flow against Google to obtain a refresh token
 * for the GOOGLE_ADS_REFRESH_TOKEN env var. Use this once after creating the
 * OAuth Desktop client in Google Cloud Console.
 *
 * Prereqs (must be in web/.env.local):
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *
 * Run:
 *   npm run ads:google:bootstrap-token
 *
 * Behavior:
 *   1. Starts an HTTP listener on a random localhost port.
 *   2. Prints the Google consent URL — open it in your browser.
 *   3. Captures the redirect, exchanges the code for tokens.
 *   4. Prints the refresh_token. Save it; Google only returns it once.
 */

import { createServer } from 'node:http';
import { URL } from 'node:url';
import { loadLocalEnv } from './local-env.mjs';

const SCOPE = 'https://www.googleapis.com/auth/adwords';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

async function main() {
  await loadLocalEnv();

  const clientId = (process.env.GOOGLE_ADS_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_ADS_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    console.error(
      'Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET.\n' +
        'Add them to web/.env.local first, then re-run this script.'
    );
    process.exit(1);
  }

  const { code, redirectUri } = await captureAuthCode(clientId);

  console.log('\nExchanging authorization code for tokens...\n');
  const tokens = await exchangeCodeForTokens({
    code,
    clientId,
    clientSecret,
    redirectUri,
  });

  if (!tokens.refresh_token) {
    console.error(
      'Google did not return a refresh_token. Most common cause: this OAuth ' +
        'client has already been authorized for this Google account, so ' +
        'Google issues only an access_token on subsequent runs.\n\n' +
        'Fix: visit https://myaccount.google.com/connections, find the ' +
        'OAuth client, click Remove access, then re-run this script.'
    );
    process.exit(1);
  }

  console.log('=========================================================');
  console.log('  SUCCESS — paste this into web/.env.local:');
  console.log('=========================================================');
  console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('=========================================================');
  console.log(`\nScope: ${tokens.scope}`);
  console.log(`Access token TTL: ${tokens.expires_in}s`);
  console.log('\nNext: ensure GOOGLE_ADS_DEVELOPER_TOKEN and');
  console.log('GOOGLE_ADS_CUSTOMER_ID are also set, then run:');
  console.log('  npm run ads:google:preflight');
}

function captureAuthCode(clientId) {
  return new Promise((resolve, reject) => {
    let redirectUri = null;

    const server = createServer((req, res) => {
      const url = new URL(req.url, redirectUri || 'http://localhost');
      if (url.pathname !== '/callback') {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');

      if (error) {
        res.writeHead(400, { 'content-type': 'text/html' });
        res.end(`<h1>Authorization failed</h1><pre>${error}</pre>`);
        server.close();
        reject(new Error(`Authorization failed: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('Missing ?code parameter.');
        return;
      }

      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        '<h1>Authorized</h1><p>You can close this tab and return to the terminal.</p>'
      );
      server.close();
      resolve({ code, redirectUri });
    });

    server.on('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      redirectUri = `http://127.0.0.1:${port}/callback`;
      const authUrl =
        `${AUTH_URL}?` +
        new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: SCOPE,
          access_type: 'offline',
          prompt: 'consent',
        }).toString();

      console.log('Open this URL in your browser:\n');
      console.log(authUrl);
      console.log(`\nWaiting for redirect to ${redirectUri} ...`);
    });
  });
}

async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return JSON.parse(text);
}

main().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
