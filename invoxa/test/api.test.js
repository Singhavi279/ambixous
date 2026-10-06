const test = require('node:test');
const assert = require('node:assert');
const { open } = require('../server/db');
const A = require('../server/auth');
const { createApp } = require('../server/index');

// Walks the main screens' API calls end to end against a real (in-memory) database.
test('invoicing flow over HTTP: customers, invoices, payments, repeat billing, reports, exports', async () => {
  const db = await open(':memory:');
  const srv = createApp(db).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  const base = `http://127.0.0.1:${srv.address().port}/api`;
  const uid = (await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES('Founder','f@x.com','','super_admin')").run()).lastInsertRowid;
  const cookie = `sid=${await A.createSession(db, uid)}`;
  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    return { status: res.status, body: ct.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()), type: ct };
  };

  const cust = await call('POST', '/customers', { name: 'Rohan Mehta', email: 'rohan@example.com' });
  assert.equal(cust.status, 200);
  const svc = await call('POST', '/services', { name: 'LinkedIn Management', price: 2000000, activity: 'Advertising' });
  assert.equal(svc.status, 200);
  assert.equal((await call('GET', '/customers?q=rohan')).body.length, 1);
  assert.equal((await call('GET', '/services')).body.length, 1);

  const item = { description: 'LinkedIn Management', qty: 1, rate: 2000000, activity: 'Advertising' };
  const draft = await call('POST', '/invoices', { customer_id: cust.body.id, items: [item], action: 'draft' });
  assert.equal(draft.status, 200);
  assert.equal((await call('PUT', `/invoices/${draft.body.id}`, { customer_id: cust.body.id, items: [item], action: 'draft', notes: 'edited' })).status, 200);
  assert.equal((await call('DELETE', `/invoices/${draft.body.id}`)).status, 200);

  const sent = await call('POST', '/invoices', { customer_id: cust.body.id, items: [item], action: 'send', issue_date: '2026-10-05' });
  assert.equal(sent.status, 200);
  assert.equal(sent.body.email.ok, false); // mail not configured: reported honestly
  const inv = await call('GET', `/invoices/${sent.body.id}`);
  assert.equal(inv.body.number, 'AI/26-27/001');
  assert.equal(inv.body.emails.length, 1);

  const pdf = await call('GET', `/invoices/${sent.body.id}/pdf`);
  assert.equal(pdf.body.slice(0, 4).toString(), '%PDF');

  assert.equal((await call('POST', `/invoices/${sent.body.id}/payments`, { amount: 5000, date: '2026-10-06' })).status, 200);
  const list = await call('GET', '/invoices?status=open');
  assert.equal(list.body.length, 1); assert.equal(list.body[0].paid, 500000);

  const rec = await call('POST', '/recurring', { customer_id: cust.body.id, items: [item], every_months: 1, day_of_month: 30, start_date: '2026-10-01', auto_send: false });
  assert.equal(rec.status, 200);
  assert.equal((await call('GET', '/recurring')).body[0].customer_name, 'Rohan Mehta');
  const ran = await call('POST', `/recurring/${rec.body.id}/run-now`);
  assert.equal(ran.status, 200);
  assert.equal((await call('POST', `/recurring/${rec.body.id}/toggle`)).status, 200);

  const dash = await call('GET', '/dashboard');
  assert.equal(dash.status, 200); assert.equal(dash.body.owedCount, 2); assert.ok(dash.body.owed > 0);
  assert.equal(dash.body.setup.customer, true);
  const rev = await call('GET', '/reports/revenue?from=2026-04-01');
  assert.equal(rev.status, 200); assert.equal(rev.body.total, 4000000);
  assert.equal(rev.body.byActivity[0].label, 'Advertising');
  assert.match(String((await call('GET', '/export/invoices.csv')).body), /AI\/26-27\/001/);
  assert.match(String((await call('GET', '/export/payments.csv')).body), /Rohan Mehta/);
  assert.equal((await call('GET', '/emails')).status, 200);
  assert.equal((await call('GET', '/activity')).status, 200);

  const s = await call('PUT', '/settings', { business_address: 'Pune', smtp_pass: 'secret-pass' });
  assert.equal(s.body.business_address, 'Pune'); assert.equal(s.body.smtp_pass, '********');
  assert.equal((await call('DELETE', `/payments/${(await call('GET', `/invoices/${sent.body.id}`)).body.payments[0].id}`)).status, 200);
  assert.equal((await call('POST', `/invoices/${sent.body.id}/void`, { reason: 'test' })).status, 200);
  assert.equal((await call('DELETE', `/customers/${cust.body.id}`)).body.archived, true);
  srv.close();
});
