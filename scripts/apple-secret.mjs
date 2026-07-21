/**
 * Generate the "Sign in with Apple" client secret — an ES256 JWT signed with
 * the .p8 key from the Apple Developer console. Apple caps validity at 6
 * months, so this needs re-running (and the Vercel env updating) twice a year.
 *
 * Usage:
 *   node scripts/apple-secret.mjs <path-to-AuthKey.p8> <teamId> <keyId> <servicesId>
 *
 * Prints the JWT and its expiry date. No secrets are stored in the repo.
 */
import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const [, , p8Path, teamId, keyId, servicesId] = process.argv;
if (!p8Path || !teamId || !keyId || !servicesId) {
  console.error('usage: node scripts/apple-secret.mjs <AuthKey.p8> <teamId> <keyId> <servicesId>');
  process.exit(1);
}

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 24 * 60 * 60; // 180 days — Apple's max is 6 months

const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
const payload = b64url(
  JSON.stringify({ iss: teamId, iat: now, exp, aud: 'https://appleid.apple.com', sub: servicesId }),
);
const signingInput = `${header}.${payload}`;

const key = createPrivateKey(readFileSync(p8Path, 'utf8'));
// JWT ES256 requires the raw (r||s) signature form, not DER.
const signature = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
const jwt = `${signingInput}.${b64url(signature)}`;

console.log(jwt);
console.error(`\nexpires: ${new Date(exp * 1000).toISOString().slice(0, 10)} — re-run this script and update APPLE_CLIENT_SECRET before then.`);
