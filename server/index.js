// Minimal GitHub OAuth proxy for Genesys.
// Exchanges the OAuth `code` for an access_token using client_secret kept on
// the server side (never shipped to the browser), then redirects back to the
// SPA with the token in the URL fragment (browsers don't send fragments to
// servers, so the token doesn't leak through subsequent requests).

import express from 'express';

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = (process.env.GITHUB_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || '').trim();
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, ''); // no trailing slash
const SCOPE = 'read:user repo';

const app = express();

app.get('/auth/health', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(CLIENT_ID && CLIENT_SECRET && PUBLIC_URL),
    publicUrl: PUBLIC_URL || null,
  });
});

app.get('/auth/github', (_req, res) => {
  if (!CLIENT_ID || !PUBLIC_URL) {
    return res.status(500).type('text/plain').send(
      'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and PUBLIC_URL.\n'
    );
  }
  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${PUBLIC_URL}/auth/github/callback`,
    scope: SCOPE,
    state,
    allow_signup: 'true',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const code = String(req.query.code || '');
  if (!code) return res.redirect('/login?error=no_code');
  if (!CLIENT_ID || !CLIENT_SECRET) return res.redirect('/login?error=no_config');
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
    });
    const j = await r.json().catch(() => ({}));
    const token = j?.access_token;
    if (!token) {
      console.warn('GitHub did not return access_token:', j);
      return res.redirect('/login?error=no_token');
    }
    // Token lands in the URL fragment — browsers don't send #… to servers.
    return res.redirect(`/auth/success#token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error('OAuth exchange failed', e);
    return res.redirect('/login?error=exchange');
  }
});

app.listen(PORT, () => {
  console.log(`[genesys-auth] listening on :${PORT}, configured=${Boolean(CLIENT_ID && CLIENT_SECRET && PUBLIC_URL)}`);
});
