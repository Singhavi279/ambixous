const fs = require('fs');
const crypto = require('crypto');
// Tiny .env reader so secrets stay out of the code (real environment variables always win).
try {
  for (const line of fs.readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env file – fine */ }
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const { open } = require('./db');
const L = require('./lib');
const { invoicePdf } = require('./pdf');
const mail = require('./mail');
const scheduler = require('./scheduler');
const A = require('./auth');
const G = require('./google');

function createApp(db) {
  const app = express();
  app.set('trust proxy', 1); // behind Vercel/Nginx the real client IP comes from the proxy
  // Make sure the owners' accounts exist before the first request is handled (once per server start).
  const seeded = (G.enabled() || process.env.SUPER_ADMIN_EMAILS) ? A.seedSuperAdmins(db, G.superAdminEmails()) : Promise.resolve();
  seeded.catch(() => {});
  // Per-IP rate limits (in memory, so per server instance): generous for the app, strict for sign-in.
  const limit = (max) => rateLimit({
    windowMs: 60 * 1000, limit: max, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute and try again.' },
  });
  const authLimiter = limit(30);
  app.use('/api', limit(600));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', (req, res, next) => { seeded.then(() => next(), next); });

  const wrap = (fn) => (req, res, next) => {
    Promise.resolve().then(() => fn(req, res, next)).catch((e) => {
      if (e instanceof L.UserError) return res.status(e.status).json({ error: e.message });
      if (e && /UNIQUE|constraint/i.test(e.message)) return res.status(409).json({ error: 'That would create a duplicate. Nothing was changed.' });
      console.error(e);
      res.status(500).json({ error: 'Something went wrong on our side. Nothing was saved — please try again.' });
    });
  };
  const idOf = (req) => { const n = Number(req.params.id); if (!Number.isInteger(n)) throw new L.UserError('Not found', 404); return n; };
  const need = (v, msg) => { if (!String(v ?? '').trim()) throw new L.UserError(msg); return String(v).trim(); };

  // ---------- sign in (Google only, like ambixous.in) ----------
  // Plain string checks (no backtracking regex) on a length-capped value.
  const emailOk = (e) => {
    if (typeof e !== 'string' || e.length > 254 || /\s/.test(e)) return false;
    const parts = e.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    const domain = parts[1];
    return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.') && !domain.includes('..');
  };
  const startSession = async (res, user) => A.setCookie(res, await A.createSession(db, user.id));
  const me = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role };

  app.get('/api/auth/me', wrap(async (req, res) => {
    res.json({ user: me(await A.userFromRequest(db, req)), google: G.enabled() });
  }));
  // Only people already on the team (or the permanent super admins) get in.
  const loginError = (res, msg) => res.redirect(`${G.basePath()}/?login_error=${encodeURIComponent(msg)}`);
  app.get('/api/auth/google', authLimiter, (req, res) => {
    if (!G.enabled()) return loginError(res, 'Google sign-in is not set up on this server.');
    const state = G.newState();
    A.setCookie(res, state, 'gstate', 600);
    res.redirect(G.authUrl(state));
  });
  app.get('/api/auth/google/callback', authLimiter, async (req, res) => {
    try {
      const saved = A.cookieOf(req, 'gstate');
      A.setCookie(res, null, 'gstate');
      if (req.query.error) return loginError(res, 'Google sign-in was cancelled.');
      if (!saved || !req.query.state || saved !== req.query.state || !req.query.code) return loginError(res, 'That sign-in link expired. Please try again.');
      const g = await G.identityFromCode(String(req.query.code));
      let u = await db.prepare('SELECT * FROM users WHERE email = ?').get(g.email);
      if (!u && G.superAdminEmails().includes(g.email)) { await A.seedSuperAdmins(db, [g.email]); u = await db.prepare('SELECT * FROM users WHERE email = ?').get(g.email); }
      if (!u || !u.active) return loginError(res, `${g.email} has not been given access. Ask a super admin to add you under Settings → Team.`);
      if (u.name === u.email.split('@')[0] && g.name) await db.prepare('UPDATE users SET name=? WHERE id=?').run(g.name, u.id);
      await startSession(res, u);
      await L.actor.run({ name: u.name }, () => L.audit(db, 'user.login_google', 'user', u.id, g.email));
      res.redirect(`${G.basePath()}/`);
    } catch (e) {
      console.error('Google sign-in failed:', e.message);
      loginError(res, 'Google sign-in failed. Please try again.');
    }
  });
  app.post('/api/auth/logout', wrap(async (req, res) => {
    const t = A.cookieOf(req, 'sid');
    if (t) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(A.sha(t));
    A.setCookie(res, null);
    res.json({ ok: true });
  }));

  // Scheduled trigger (GitHub Actions calls this): creates due repeat invoices and sends reminders.
  app.post('/api/cron/tick', wrap(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    const given = String(req.headers.authorization || '');
    const ok = secret && given.length === `Bearer ${secret}`.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(`Bearer ${secret}`));
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    res.json(await scheduler.tick(db));
  }));

  // Everything below needs a signed-in user, and the role must allow the request.
  app.use('/api', wrap(async (req, res, next) => {
    const user = await A.userFromRequest(db, req);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    if (!A.allowed(user.role, req.method, req.path)) {
      return res.status(403).json({ error: 'Your account is not allowed to do that.' });
    }
    req.user = user;
    L.actor.run({ name: user.name }, next);
  }));

  // ---------- team (admins only, via the permission table) ----------
  const ROLES = ['super_admin', 'ca'];
  const activeAdmins = async (exceptId) => (await db.prepare("SELECT COUNT(*) n FROM users WHERE role='super_admin' AND active=1 AND id != ?").get(exceptId || 0)).n;
  app.get('/api/users', wrap(async (req, res) => res.json(await db.prepare('SELECT id,name,email,role,active,created_at FROM users ORDER BY id').all())));
  app.post('/api/users', wrap(async (req, res) => {
    const name = need(req.body.name, 'Please enter a name.'), email = need(req.body.email, 'Please enter an email.').toLowerCase();
    if (!emailOk(email)) throw new L.UserError('That email address does not look right.');
    if (!ROLES.includes(req.body.role)) throw new L.UserError('Choose a role.');
    const r = await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,'',?)").run(name, email, req.body.role); // they sign in with Google
    await L.audit(db, 'user.created', 'user', r.lastInsertRowid, `${email} (${req.body.role})`);
    res.json({ id: r.lastInsertRowid });
  }));
  app.put('/api/users/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const u = await db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if (!u) throw new L.UserError('User not found.', 404);
    if (G.superAdminEmails().includes(u.email) && (req.body.role === 'ca' || req.body.active === false)) {
      throw new L.UserError('This person is a permanent super admin set up on the server, so their access cannot be reduced here.');
    }
    const role = req.body.role ?? u.role, active = req.body.active === undefined ? u.active : (req.body.active ? 1 : 0);
    if (!ROLES.includes(role)) throw new L.UserError('Choose a role.');
    if ((role !== 'super_admin' || !active) && u.role === 'super_admin' && u.active && await activeAdmins(id) === 0) {
      throw new L.UserError('There must always be at least one active super admin.');
    }
    if (id === req.user.id && !active) throw new L.UserError('You cannot switch off your own account.');
    const name = need(req.body.name ?? u.name, 'Please enter a name.');
    await db.transaction(async (db) => {
      await db.prepare('UPDATE users SET name=?, role=?, active=? WHERE id=?').run(name, role, active, id);
      if (!active || role !== u.role) await db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); // sign them out
      await L.audit(db, 'user.updated', 'user', id, `${u.email}: role=${role}, active=${active}`);
    });
    res.json({ ok: true });
  }));

  // ---------- signers ----------
  app.get('/api/signers', wrap(async (req, res) => res.json(Object.entries(L.SIGNERS).map(([key, v]) => ({ key, name: v.name, title: v.title })))));
  app.get('/api/signers/:key/image', wrap(async (req, res) => {
    const signer = L.SIGNERS[req.params.key];
    if (!signer) throw new L.UserError('Not found', 404);
    const file = [path.join(process.cwd(), 'invoxa', 'server', 'assets'), path.join(process.cwd(), 'server', 'assets'), path.join(__dirname, 'assets')]
      .map((d) => path.join(d, signer.file)).find((p) => fs.existsSync(p));
    if (!file) throw new L.UserError('Not found', 404);
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=86400' }).send(fs.readFileSync(file));
  }));

  // ---------- settings ----------
  const publicSettings = (s) => ({ ...s, smtp_pass: s.smtp_pass ? '********' : '' });
  app.get('/api/settings', wrap(async (req, res) => res.json(req.user.role === 'super_admin' ? publicSettings(await L.getSettings(db)) : { business_name: (await L.getSettings(db)).business_name })));
  app.put('/api/settings', wrap(async (req, res) => {
    const patch = { ...req.body };
    if (patch.smtp_pass === '********') delete patch.smtp_pass;
    for (const k of ['invoice_pad', 'default_terms_days', 'smtp_port', 'gst_rate']) if (k in patch) patch[k] = Number(patch[k]);
    if ('invoice_prefix' in patch) patch.invoice_prefix = need(patch.invoice_prefix, 'Invoice prefix cannot be empty.').replace(/[^A-Za-z0-9-]/g, '');
    if ('business_name' in patch) need(patch.business_name, 'Please enter your business name.');
    await L.saveSettings(db, patch);
    await L.audit(db, 'settings.updated', 'settings', 0, Object.keys(patch).filter((k) => !k.startsWith('smtp')).join(','));
    res.json(publicSettings(await L.getSettings(db)));
  }));
  app.post('/api/settings/test-email', wrap(async (req, res) => {
    res.json(await mail.sendTestEmail(db, need(req.body.to, 'Enter the address to send the test to.')));
  }));

  // ---------- customers ----------
  app.get('/api/customers', wrap(async (req, res) => {
    const q = `%${(req.query.q || '').trim()}%`;
    res.json(await db.prepare(`SELECT c.*,
        COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.customer_id=c.id AND i.status='issued'),0) -
        COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE i.customer_id=c.id AND i.status='issued'),0) AS owed
        FROM customers c WHERE c.archived = 0 AND (c.name LIKE ? OR c.email LIKE ?) ORDER BY c.name COLLATE NOCASE`).all(q, q));
  }));
  const customerFields = (b) => [need(b.name, 'Please enter the customer\'s name.'), (b.email || '').trim(), (b.phone || '').trim(),
    (b.address || '').trim(), (b.gstin || '').trim(), (b.notes || '').trim()];
  const checkEmail = (e) => { if (e && !emailOk(e)) throw new L.UserError('That email address does not look right.'); };
  app.post('/api/customers', wrap(async (req, res) => {
    const f = customerFields(req.body); checkEmail(f[1]);
    const r = await db.prepare('INSERT INTO customers(name,email,phone,address,gstin,notes) VALUES(?,?,?,?,?,?)').run(...f);
    await L.audit(db, 'customer.created', 'customer', r.lastInsertRowid);
    res.json({ id: r.lastInsertRowid });
  }));
  app.put('/api/customers/:id', wrap(async (req, res) => {
    const f = customerFields(req.body); checkEmail(f[1]);
    await db.prepare('UPDATE customers SET name=?,email=?,phone=?,address=?,gstin=?,notes=? WHERE id=?').run(...f, idOf(req));
    await L.audit(db, 'customer.updated', 'customer', idOf(req));
    res.json({ ok: true });
  }));
  app.delete('/api/customers/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const used = (await db.prepare('SELECT COUNT(*) n FROM invoices WHERE customer_id=?').get(id)).n;
    if (used) await db.prepare('UPDATE customers SET archived=1 WHERE id=?').run(id); // keep history intact
    else await db.prepare('DELETE FROM customers WHERE id=?').run(id);
    await L.audit(db, 'customer.removed', 'customer', id);
    res.json({ ok: true, archived: !!used });
  }));

  // ---------- services ----------
  app.get('/api/services', wrap(async (req, res) => res.json(await db.prepare('SELECT * FROM services WHERE archived=0 ORDER BY activity, name COLLATE NOCASE').all())));
  const serviceFields = (b) => [need(b.name, 'Please enter the service name.'), (b.description || '').trim(),
    Math.round(Number(b.price) || 0), (b.unit || '').trim(), (b.activity || '').trim()];
  app.post('/api/services', wrap(async (req, res) => {
    const r = await db.prepare('INSERT INTO services(name,description,price,unit,activity) VALUES(?,?,?,?,?)').run(...serviceFields(req.body));
    res.json({ id: r.lastInsertRowid });
  }));
  app.put('/api/services/:id', wrap(async (req, res) => {
    await db.prepare('UPDATE services SET name=?,description=?,price=?,unit=?,activity=? WHERE id=?').run(...serviceFields(req.body), idOf(req));
    res.json({ ok: true });
  }));
  app.delete('/api/services/:id', wrap(async (req, res) => {
    await db.prepare('UPDATE services SET archived=1 WHERE id=?').run(idOf(req)); // past invoices keep their own copy of the text
    res.json({ ok: true });
  }));

  // ---------- invoices ----------
  const listInvoices = async (query) => {
    const rows = await db.prepare(`SELECT i.id, i.number, i.status, i.issue_date, i.due_date, i.total, i.reference, i.sent_at,
        i.customer_id, c.name AS customer_name,
        COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0) AS paid
        FROM invoices i JOIN customers c ON c.id=i.customer_id
        ORDER BY i.issue_date DESC, i.id DESC`).all();
    const q = (query.q || '').toLowerCase();
    return rows.map((r) => ({ ...r, display_status: L.displayStatus(r, r.paid), balance: r.status === 'issued' ? r.total - r.paid : 0 }))
      .filter((r) => !query.status || query.status === 'all' || r.display_status === query.status || (query.status === 'open' && ['unpaid', 'partial', 'overdue'].includes(r.display_status)))
      .filter((r) => !query.customer_id || r.customer_id === Number(query.customer_id))
      .filter((r) => !q || `${r.number} ${r.customer_name} ${r.reference}`.toLowerCase().includes(q));
  };
  app.get('/api/invoices', wrap(async (req, res) => res.json(await listInvoices(req.query))));
  app.get('/api/invoices/:id', wrap(async (req, res) => {
    const inv = await L.loadInvoice(db, idOf(req));
    if (!inv) throw new L.UserError('Invoice not found.', 404);
    inv.emails = await db.prepare('SELECT * FROM emails WHERE invoice_id=? ORDER BY id DESC').all(inv.id);
    res.json(inv);
  }));
  app.post('/api/invoices', wrap(async (req, res) => {
    const { action = 'draft', ...data } = req.body; // draft | issue | send
    const id = await L.createInvoice(db, data, { issue: action !== 'draft' });
    let email = null;
    if (action === 'send') email = await mail.sendInvoiceEmail(db, id);
    res.json({ id, email });
  }));
  app.put('/api/invoices/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const { action = 'draft', ...data } = req.body;
    await L.updateDraft(db, id, data);
    let email = null;
    if (action !== 'draft') {
      await L.issueInvoice(db, id);
      if (action === 'send') email = await mail.sendInvoiceEmail(db, id);
    }
    res.json({ id, email });
  }));
  app.post('/api/invoices/:id/issue', wrap(async (req, res) => res.json({ number: await L.issueInvoice(db, idOf(req)) })));
  app.post('/api/invoices/:id/send', wrap(async (req, res) => {
    res.json(await mail.sendInvoiceEmail(db, idOf(req), { to: req.body && req.body.to }));
  }));
  app.post('/api/invoices/:id/void', wrap(async (req, res) => { await L.voidInvoice(db, idOf(req), (req.body && req.body.reason) || ''); res.json({ ok: true }); }));
  app.delete('/api/invoices/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const inv = await db.prepare('SELECT status FROM invoices WHERE id=?').get(id);
    if (!inv) throw new L.UserError('Invoice not found.', 404);
    if (inv.status !== 'draft') throw new L.UserError('Issued invoices cannot be deleted — use Void instead so your records stay complete.');
    await db.prepare('DELETE FROM invoices WHERE id=?').run(id);
    await L.audit(db, 'invoice.draft_deleted', 'invoice', id);
    res.json({ ok: true });
  }));
  app.get('/api/invoices/:id/pdf', wrap(async (req, res) => {
    const inv = await L.loadInvoice(db, idOf(req));
    if (!inv) throw new L.UserError('Invoice not found.', 404);
    const pdf = await invoicePdf(inv, await L.getSettings(db));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${(inv.number || 'draft').replace(/\//g, '-')}.pdf"`,
    });
    res.send(pdf);
  }));

  // ---------- payments ----------
  app.post('/api/invoices/:id/payments', wrap(async (req, res) => res.json({ id: await L.addPayment(db, idOf(req), req.body) })));
  app.delete('/api/payments/:id', wrap(async (req, res) => {
    const id = idOf(req);
    const p = await db.prepare('SELECT * FROM payments WHERE id=?').get(id);
    if (!p) throw new L.UserError('Payment not found.', 404);
    await db.transaction(async (db) => {
      await db.prepare('DELETE FROM payments WHERE id=?').run(id);
      await L.audit(db, 'payment.deleted', 'invoice', p.invoice_id, `${L.formatINR(p.amount)} on ${p.date}`);
    });
    res.json({ ok: true });
  }));

  // ---------- recurring ----------
  const recurringRow = async (r) => {
    const items = JSON.parse(r.items);
    const customer = await db.prepare('SELECT name, email FROM customers WHERE id=?').get(r.customer_id) || {};
    const total = items.reduce((a, i) => a + Math.round((i.qty ?? 1) * i.rate), 0);
    return { ...r, items, customer_name: customer.name, customer_email: customer.email, total };
  };
  app.get('/api/recurring', wrap(async (req, res) => res.json(await Promise.all((await db.prepare('SELECT * FROM recurring ORDER BY active DESC, next_run').all()).map(recurringRow)))));
  app.post('/api/recurring', wrap(async (req, res) => res.json({ id: await L.saveRecurring(db, req.body) })));
  app.put('/api/recurring/:id', wrap(async (req, res) => res.json({ id: await L.saveRecurring(db, req.body, idOf(req)) })));
  app.post('/api/recurring/:id/toggle', wrap(async (req, res) => {
    const id = idOf(req);
    const r = await db.prepare('SELECT * FROM recurring WHERE id=?').get(id);
    if (!r) throw new L.UserError('Schedule not found.', 404);
    const active = r.active ? 0 : 1;
    let next = r.next_run;
    if (active) { // resuming: skip any cycles that passed while paused
      next = r.last_run ? L.nextRunAfter(r.last_run, r.every_months, r.day_of_month) : L.firstRunDate(r.start_date, r.every_months, r.day_of_month);
      while (next < L.today()) next = L.nextRunAfter(next, r.every_months, r.day_of_month);
      if (r.end_date && next > r.end_date) next = null;
    }
    await db.prepare('UPDATE recurring SET active=?, next_run=? WHERE id=?').run(active, next, id);
    await L.audit(db, active ? 'recurring.resumed' : 'recurring.paused', 'recurring', id);
    res.json({ active, next_run: next });
  }));
  app.post('/api/recurring/:id/run-now', wrap(async (req, res) => {
    const r = await db.prepare('SELECT * FROM recurring WHERE id=?').get(idOf(req));
    if (!r) throw new L.UserError('Schedule not found.', 404);
    if (!r.next_run) throw new L.UserError('This schedule has finished — there is nothing left to generate.');
    const invoiceId = await L.generateRecurringInvoice(db, r, L.today(), { issueToday: true });
    const email = r.auto_send ? await mail.sendInvoiceEmail(db, invoiceId) : null;
    res.json({ invoiceId, email });
  }));
  app.delete('/api/recurring/:id', wrap(async (req, res) => {
    await db.prepare('DELETE FROM recurring WHERE id=?').run(idOf(req));
    res.json({ ok: true });
  }));

  // ---------- dashboard & reports ----------
  app.get('/api/dashboard', wrap(async (req, res) => {
    const now = L.today();
    const month = now.slice(0, 7);
    const invs = await listInvoices({});
    const issued = invs.filter((i) => i.status === 'issued');
    const open = issued.filter((i) => i.balance > 0);
    const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
    const paidThisMonth = (await db.prepare("SELECT COALESCE(SUM(p.amount),0) s FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE i.status='issued' AND substr(p.date,1,7)=?").get(month)).s;
    const settings = await L.getSettings(db);
    const fy = L.financialYear(now);
    const fyTurnover = sum(issued.filter((i) => L.financialYear(i.issue_date) === fy), (i) => i.total);
    res.json({
      owed: sum(open, (i) => i.balance),
      owedCount: open.length,
      overdue: sum(open.filter((i) => i.due_date < now), (i) => i.balance),
      overdueCount: open.filter((i) => i.due_date < now).length,
      dueSoon: sum(open.filter((i) => i.due_date >= now && i.due_date <= L.addDays(now, 7)), (i) => i.balance),
      billedThisMonth: sum(issued.filter((i) => i.issue_date.startsWith(month)), (i) => i.total),
      paidThisMonth,
      drafts: invs.filter((i) => i.status === 'draft').length,
      attention: open.filter((i) => i.due_date < now).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5),
      recent: invs.slice(0, 6),
      upcoming: (await db.prepare("SELECT r.id, r.next_run, r.items, c.name customer_name FROM recurring r JOIN customers c ON c.id=r.customer_id WHERE r.active=1 AND r.next_run IS NOT NULL ORDER BY r.next_run LIMIT 4").all())
        .map((r) => ({ id: r.id, next_run: r.next_run, customer_name: r.customer_name, total: JSON.parse(r.items).reduce((a, i) => a + Math.round((i.qty ?? 1) * i.rate), 0) })),
      failedEmails: (await db.prepare("SELECT COUNT(*) n FROM emails e WHERE e.status != 'sent' AND e.kind != 'test' AND e.created_at >= datetime('now','-14 days') AND NOT EXISTS (SELECT 1 FROM emails e2 WHERE e2.invoice_id=e.invoice_id AND e2.kind=e.kind AND e2.status='sent' AND e2.id > e.id)").get()).n,
      setup: {
        business: Boolean(settings.business_address || settings.business_email),
        email: mail.smtpReady(settings),
        customer: (await db.prepare('SELECT COUNT(*) n FROM customers WHERE archived=0').get()).n > 0,
        invoice: invs.some((i) => i.status !== 'draft'),
      },
      fy, fyTurnover,
      gstEnabled: !!settings.gst_enabled,
    });
  }));

  app.get('/api/reports/revenue', wrap(async (req, res) => {
    const from = req.query.from || `${L.today().slice(0, 4)}-04-01`;
    const to = req.query.to || '9999-12-31';
    const base = `FROM invoice_items it JOIN invoices i ON i.id=it.invoice_id JOIN customers c ON c.id=i.customer_id
      WHERE i.status='issued' AND i.issue_date BETWEEN ? AND ?`;
    res.json({
      from, to,
      total: (await db.prepare(`SELECT COALESCE(SUM(it.amount),0) s ${base}`).get(from, to)).s,
      byActivity: await db.prepare(`SELECT COALESCE(NULLIF(it.activity,''),'Other') AS label, SUM(it.amount) AS amount ${base} GROUP BY label ORDER BY amount DESC`).all(from, to),
      byCustomer: await db.prepare(`SELECT c.name AS label, SUM(it.amount) AS amount ${base} GROUP BY c.id ORDER BY amount DESC LIMIT 10`).all(from, to),
      byMonth: await db.prepare(`SELECT substr(i.issue_date,1,7) AS label, SUM(it.amount) AS amount ${base} GROUP BY label ORDER BY label`).all(from, to),
    });
  }));

  const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const rupees = (p) => (p / 100).toFixed(2);
  app.get('/api/export/invoices.csv', wrap(async (req, res) => {
    const rows = await db.prepare(`SELECT i.number, i.status, i.issue_date, i.due_date, c.name, i.reference, i.subtotal, i.discount, i.tax, i.total,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0) paid FROM invoices i JOIN customers c ON c.id=i.customer_id
      WHERE i.status != 'draft' ORDER BY i.issue_date, i.number`).all();
    res.type('text/csv').attachment('invoices.csv').send(csv([
      ['Invoice No', 'Status', 'Invoice Date', 'Due Date', 'Customer', 'Reference', 'Subtotal', 'Discount', 'Tax', 'Total', 'Paid', 'Balance'],
      ...rows.map((r) => [r.number, r.status, r.issue_date, r.due_date, r.name, r.reference, rupees(r.subtotal), rupees(r.discount), rupees(r.tax), rupees(r.total), rupees(r.paid), rupees(r.status === 'issued' ? r.total - r.paid : 0)]),
    ]));
  }));
  app.get('/api/export/payments.csv', wrap(async (req, res) => {
    const rows = await db.prepare(`SELECT p.date, i.number, c.name, p.amount, p.method, p.reference, p.notes FROM payments p
      JOIN invoices i ON i.id=p.invoice_id JOIN customers c ON c.id=i.customer_id ORDER BY p.date, p.id`).all();
    res.type('text/csv').attachment('payments.csv').send(csv([
      ['Date', 'Invoice No', 'Customer', 'Amount', 'Method', 'Reference', 'Notes'],
      ...rows.map((r) => [r.date, r.number, r.name, rupees(r.amount), r.method, r.reference, r.notes]),
    ]));
  }));

  app.get('/api/emails', wrap(async (req, res) => res.json(await db.prepare(`SELECT e.*, i.number FROM emails e LEFT JOIN invoices i ON i.id=e.invoice_id ORDER BY e.id DESC LIMIT 100`).all())));
  app.get('/api/activity', wrap(async (req, res) => res.json(await db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all())));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

if (require.main === module) {
  open().then((db) => {
    const port = Number(process.env.PORT) || 3100;
    // Bound to this computer only: your invoices are private unless you deliberately host it.
    createApp(db).listen(port, process.env.HOST || '127.0.0.1', () => {
      console.log(`\n  Invoxa is running →  http://localhost:${port}\n`);
    });
    scheduler.start(db);
  });
}

module.exports = { createApp };
