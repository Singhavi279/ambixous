const test = require('node:test');
const assert = require('node:assert');
const { open } = require('../server/db');
const A = require('../server/auth');
const { createApp } = require('../server/index');

async function boot() {
  const db = await open(':memory:');
  const srv = createApp(db).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  const base = `http://127.0.0.1:${srv.address().port}/api`;
  const call = (cookie) => async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    return { status: res.status, body: ct.includes('json') ? await res.json() : await res.text() };
  };
  // Signing in happens at Google; here we hand a team member a valid session directly.
  const asUser = async (email, role, name = email.split('@')[0]) => {
    const r = await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,'',?)").run(name, email, role);
    return { id: r.lastInsertRowid, call: call(`sid=${await A.createSession(db, r.lastInsertRowid)}`) };
  };
  return { db, srv, base, anon: call(''), asUser };
}

test('nothing works without signing in', async () => {
  const { srv, anon } = await boot();
  assert.equal((await anon('GET', '/invoices')).status, 401);
  assert.equal((await anon('GET', '/dashboard')).status, 401);
  assert.equal((await anon('GET', '/users')).status, 401);
  const me = await anon('GET', '/auth/me');
  assert.equal(me.status, 200); assert.equal(me.body.user, null);
  // the old password routes are gone
  assert.equal((await anon('POST', '/auth/login', { email: 'a@x.com', password: 'x' })).status, 401);
  assert.equal((await anon('POST', '/auth/setup', { name: 'x', email: 'x@x.com', password: 'longenough1' })).status, 401);
  srv.close();
});

test('roles: admin can do anything; CA only reports + exports', async () => {
  const { srv, asUser } = await boot();
  const admin = await asUser('a@x.com', 'super_admin');
  assert.equal((await admin.call('POST', '/users', { name: 'Co', email: 'co@x.com', role: 'super_admin' })).status, 200);
  assert.equal((await admin.call('POST', '/users', { name: 'CA', email: 'ca2@x.com', role: 'ca' })).status, 200);
  await admin.call('POST', '/customers', { name: 'Rohan', email: 'r@x.com' });

  const ca = await asUser('ca@x.com', 'ca');
  for (const [m, p, b] of [['GET', '/invoices'], ['GET', '/customers'], ['GET', '/dashboard'], ['GET', '/users'], ['GET', '/emails'],
    ['POST', '/customers', { name: 'x' }], ['POST', '/invoices', {}], ['PUT', '/settings', { business_name: 'Hacked' }], ['POST', '/users', { name: 'z', email: 'z@x.com', role: 'super_admin' }],
    ['DELETE', '/customers/1'], ['POST', '/settings/test-email', { to: 'a@b.com' }]]) {
    assert.equal((await ca.call(m, p, b)).status, 403, `${m} ${p} should be forbidden for CA`);
  }
  assert.equal((await ca.call('GET', '/reports/revenue')).status, 200);
  assert.equal((await ca.call('GET', '/export/invoices.csv')).status, 200);
  assert.equal((await ca.call('GET', '/export/payments.csv')).status, 200);
  const st = await ca.call('GET', '/settings');
  assert.deepEqual(Object.keys(st.body), ['business_name']); // no SMTP details for CA
  srv.close();
});

test('blocking a user signs them out; last admin is protected', async () => {
  const { srv, asUser } = await boot();
  const admin = await asUser('a@x.com', 'super_admin');
  const ca = await asUser('ca@x.com', 'ca');
  assert.equal((await ca.call('GET', '/reports/revenue')).status, 200);
  await admin.call('PUT', `/users/${ca.id}`, { active: false });
  assert.equal((await ca.call('GET', '/reports/revenue')).status, 401);
  const r = await admin.call('PUT', `/users/${admin.id}`, { role: 'ca' });
  assert.equal(r.status, 400); assert.match(r.body.error, /at least one active super admin/);
  assert.equal((await admin.call('PUT', `/users/${admin.id}`, { active: false })).status, 400);
  srv.close();
});

test('audit records who did it', async () => {
  const { db, srv, asUser } = await boot();
  const admin = await asUser('a@x.com', 'super_admin', 'Founder');
  await admin.call('POST', '/customers', { name: 'Rohan' });
  assert.equal((await db.prepare("SELECT by_user FROM audit WHERE action='customer.created'").get()).by_user, 'Founder');
  srv.close();
});

test('permanent super admins are seeded and cannot be demoted; forged Google callback refused', async () => {
  process.env.SUPER_ADMIN_EMAILS = 'owner1@gmail.com, Owner2@gmail.com';
  process.env.GOOGLE_CLIENT_ID = 'id'; process.env.GOOGLE_CLIENT_SECRET = 'secret';
  try {
    const { db, srv, base, anon } = await boot();
    assert.equal((await anon('GET', '/auth/me')).body.google, true); // also waits for seeding
    const rows = await db.prepare('SELECT email, role FROM users ORDER BY id').all();
    assert.deepEqual(rows, [{ email: 'owner1@gmail.com', role: 'super_admin' }, { email: 'owner2@gmail.com', role: 'super_admin' }]);
    const res = await fetch(`${base}/auth/google/callback?code=abc&state=forged`, { redirect: 'manual' });
    assert.equal(res.status, 302); assert.match(res.headers.get('location'), /login_error/);
    const id = (await db.prepare("SELECT id FROM users WHERE email='owner1@gmail.com'").get()).id;
    const sess = await A.createSession(db, id);
    const r = await fetch(`${base}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', cookie: `sid=${sess}` }, body: JSON.stringify({ role: 'ca' }) });
    assert.equal(r.status, 400); assert.match((await r.json()).error, /permanent super admin/);
    srv.close();
  } finally { delete process.env.SUPER_ADMIN_EMAILS; delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET; }
});

test('cron endpoint needs the secret', async () => {
  process.env.CRON_SECRET = 'topsecret-value';
  try {
    const { srv, base } = await boot();
    const hit = (h) => fetch(`${base}/cron/tick`, { method: 'POST', headers: h });
    assert.equal((await hit({})).status, 401);
    assert.equal((await hit({ authorization: 'Bearer wrong-secret-val' })).status, 401);
    const ok = await hit({ authorization: 'Bearer topsecret-value' });
    assert.equal(ok.status, 200);
    srv.close();
  } finally { delete process.env.CRON_SECRET; }
});
