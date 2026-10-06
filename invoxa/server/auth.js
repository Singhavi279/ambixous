// Sign-in, sessions and role permissions. Enforced on the server for every request.
const crypto = require('crypto');
const L = require('./lib');

const SESSION_DAYS = 30;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  await db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?,?,?)').run(sha(token), userId, exp);
  return token;
}
const cookieOf = (req, name) => {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
};
const setCookie = (res, token, name = 'sid', maxAge = SESSION_DAYS * 86400) => {
  const prev = [].concat(res.getHeader('Set-Cookie') || []);
  const secure = require('./google').isHttps() ? '; Secure' : '';
  res.setHeader('Set-Cookie', [...prev, `${name}=${token || ''}; HttpOnly; SameSite=Lax; Path=${require('./google').basePath() || '/'}${secure}; Max-Age=${token ? maxAge : 0}`]);
};

async function userFromRequest(db, req) {
  const t = cookieOf(req, 'sid');
  if (!t) return null;
  return await db.prepare(`SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`).get(sha(t), new Date().toISOString()) || null;
}

// What each role may call. Admins: everything. CA: look at reports and download CSV exports — nothing else.
function allowed(role, method, path) {
  if (role === 'super_admin') return true;
  if (role === 'ca') return method === 'GET' && (/^\/reports(\/|$)/.test(path) || /^\/export(\/|$)/.test(path) || path === '/settings');
  return false;
}

// Keeps the owners' accounts in place at start-up so nobody can claim the app first.
async function seedSuperAdmins(db, emails) {
  for (const email of emails) {
    const u = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (u) await db.prepare("UPDATE users SET role='super_admin', active=1 WHERE id=?").run(u.id);
    else await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,'','super_admin')").run(email.split('@')[0], email);
  }
}

module.exports = { seedSuperAdmins, createSession, userFromRequest, setCookie, cookieOf, sha, allowed };
