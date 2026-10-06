// "Sign in with Google" (OAuth 2.0 authorization-code flow). No secrets ever reach the browser.
const crypto = require('crypto');

const cfg = () => ({
  id: process.env.GOOGLE_CLIENT_ID || '',
  secret: process.env.GOOGLE_CLIENT_SECRET || '',
  base: (process.env.APP_URL || process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3100}`).replace(/\/$/, ''),
});
// '/invoxa' when hosted inside ambixous.in, '' when run on its own.
const basePath = () => (process.env.INVOXA_BASE_PATH || '').replace(/\/$/, '');
const enabled = () => Boolean(cfg().id && cfg().secret);
const redirectUri = () => `${cfg().base}${basePath()}/api/auth/google/callback`;
const isHttps = () => cfg().base.startsWith('https://');

function authUrl(state) {
  const q = new URLSearchParams({
    client_id: cfg().id, redirect_uri: redirectUri(), response_type: 'code',
    scope: 'openid email profile', state, prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
const newState = () => crypto.randomBytes(16).toString('hex');

// Trade the one-time code for the person's verified Google identity.
async function identityFromCode(code) {
  const c = cfg();
  const tok = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: c.id, client_secret: c.secret, redirect_uri: redirectUri(), grant_type: 'authorization_code' }),
  });
  const t = await tok.json();
  if (!tok.ok || !t.id_token) throw new Error(t.error_description || 'Google did not accept the sign-in.');
  // Google verifies the token's signature for us and tells us what is inside.
  const info = await (await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(t.id_token)}`)).json();
  if (info.aud !== c.id) throw new Error('Google sign-in was meant for a different app.');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(info.iss)) throw new Error('Unexpected sign-in issuer.');
  if (String(info.email_verified) !== 'true' || !info.email) throw new Error('Your Google email is not verified.');
  return { email: String(info.email).toLowerCase(), name: info.name || info.email.split('@')[0] };
}

// People who are ALWAYS super admins. Set SUPER_ADMIN_EMAILS (comma separated) to change.
const DEFAULT_SUPER_ADMINS = ['t20avnish@gmail.com', 'codework.riti@gmail.com'];
const superAdminEmails = () => (process.env.SUPER_ADMIN_EMAILS
  ? process.env.SUPER_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_SUPER_ADMINS);

module.exports = { basePath, enabled, authUrl, newState, identityFromCode, redirectUri, isHttps, superAdminEmails, DEFAULT_SUPER_ADMINS };
