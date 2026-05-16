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

// Reject obvious placeholder values so users see a clear error instead of GitHub's 404.
const PLACEHOLDER_RX = /(your|твой|client_id|client_secret|placeholder|<.*>|change_me|todo)/i;

app.get('/auth/github', (_req, res) => {
  if (!CLIENT_ID || !PUBLIC_URL) {
    return res.status(500).type('text/html').send(htmlError(
      'GitHub OAuth not configured',
      'Set <code>GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code> and <code>PUBLIC_URL</code> in /opt/genesis/.env, then <code>docker compose up -d --force-recreate auth</code>.',
    ));
  }
  if (PLACEHOLDER_RX.test(CLIENT_ID) || PLACEHOLDER_RX.test(CLIENT_SECRET)) {
    return res.status(500).type('text/html').send(htmlError(
      'You left placeholder values in .env',
      'Create a real GitHub OAuth App at <a href="https://github.com/settings/applications/new">github.com/settings/applications/new</a>, copy the Client ID + Client Secret into /opt/genesis/.env, then <code>docker compose up -d --force-recreate auth</code>.',
    ));
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

function htmlError(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{background:#060913;color:#fff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
  .card{max-width:640px;border:1px solid #2A2E3D;background:#161B34;border-radius:24px;padding:32px}
  h1{color:#FF4B4B;margin:0 0 16px}
  p{color:#A0A8C6;line-height:1.6;font-size:15px}
  code{background:#060913;padding:2px 6px;border-radius:4px;color:#7FFF00;font-family:"JetBrains Mono",monospace}
  a{color:#7FFF00}
</style>
</head><body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
}

app.listen(PORT, () => {
  console.log(`[genesys-auth] listening on :${PORT}, configured=${Boolean(CLIENT_ID && CLIENT_SECRET && PUBLIC_URL)}`);
});
