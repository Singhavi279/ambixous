// Pure business logic: dates, money, numbering, invoice creation. No HTTP in here.

const DEFAULT_SETTINGS = {
  business_name: 'Ambixous Innovations LLP',
  business_address: '',
  business_email: '',
  business_phone: '',
  business_pan: '',
  business_llpin: '',
  business_gstin: '',
  signatory: 'Authorized Signatory',
  gst_enabled: false,
  gst_rate: 18,
  gst_note: 'GST not charged — supplier is currently not registered under GST.',
  invoice_prefix: 'AI',
  invoice_pad: 3,
  default_terms_days: 10,
  payment_details: '',
  invoice_footer: 'Thank you for your business.',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: false,
  from_name: '',
  from_email: '',
  email_subject: 'Invoice {invoice_number} from {business_name}',
  email_body:
    'Hi {customer_name},\n\nPlease find attached invoice {invoice_number} for {amount}, for {reference}.\n\n' +
    'It is due on {due_date}.\n\n{payment_details}\n\nThank you,\n{business_name}',
  reminders_enabled: true,
  reminder_subject: 'Reminder: invoice {invoice_number} {when}',
  reminder_body:
    'Hi {customer_name},\n\nThis is a friendly reminder that invoice {invoice_number} for {amount} {when_long}.\n' +
    'The invoice is attached again for your convenience.\n\n{payment_details}\n\nIf you have already paid, please ignore this message.\n\nThank you,\n{business_name}',
};

// ---------- settings ----------
async function getSettings(db) {
  const s = { ...DEFAULT_SETTINGS };
  for (const r of await db.prepare('SELECT key, value FROM settings').all()) {
    try { s[r.key] = JSON.parse(r.value); } catch { /* ignore bad row */ }
  }
  return s;
}
async function saveSettings(db, patch) {
  await db.transaction(async (tx) => {
    for (const [k, v] of Object.entries(patch)) {
      if (k in DEFAULT_SETTINGS) await tx.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, JSON.stringify(v));
    }
  });
}

// ---------- errors ----------
class UserError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// ---------- dates (all plain 'YYYY-MM-DD' strings, UTC math so no timezone drift) ----------
const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
const parseDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) throw new UserError(`"${s}" is not a valid date.`);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
// Today's date in India (the server itself may run in UTC, e.g. on Vercel).
function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function addDays(s, n) { const d = parseDate(s); d.setUTCDate(d.getUTCDate() + n); return fmtDate(d); }
function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
function lastDayOfMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); } // m is 1-based
function monthStart(y, m) { // m may overflow/underflow
  const d = new Date(Date.UTC(y, m - 1, 1)); return fmtDate(d);
}
function addMonthsClamped(y, m, add, day) { // returns date string for 'day' (0 = last) in month (m+add)
  const d = new Date(Date.UTC(y, m - 1 + add, 1));
  const yy = d.getUTCFullYear(), mm = d.getUTCMonth() + 1, last = lastDayOfMonth(yy, mm);
  const dd = day === 0 ? last : Math.min(day, last);
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

// Indian financial year (April–March): 2026-10-30 -> "26-27"
function financialYear(dateStr) {
  const d = parseDate(dateStr);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
  const start = m >= 4 ? y : y - 1;
  return `${pad2(start % 100)}-${pad2((start + 1) % 100)}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function prettyDate(s) { const d = parseDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
function periodLabel(start, end) {
  const a = parseDate(start), b = parseDate(end);
  const ay = a.getUTCFullYear(), am = a.getUTCMonth(), by = b.getUTCFullYear(), bm = b.getUTCMonth();
  const wholeMonths = a.getUTCDate() === 1 && b.getUTCDate() === lastDayOfMonth(by, bm + 1);
  if (wholeMonths) {
    if (ay === by && am === bm) return `${MONTHS[am]} ${ay}`;
    if (ay === by) return `${MONTHS[am].slice(0, 3)} – ${MONTHS[bm].slice(0, 3)} ${ay}`;
    return `${MONTHS[am].slice(0, 3)} ${ay} – ${MONTHS[bm].slice(0, 3)} ${by}`;
  }
  return `${prettyDate(start)} – ${prettyDate(end)}`;
}

// ---------- money (integer paise everywhere) ----------
function toPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) throw new UserError('Amounts must be zero or more.');
  return Math.round(n * 100);
}
function formatINR(paise) {
  const neg = paise < 0; const p = Math.abs(paise);
  const r = Math.floor(p / 100), f = p % 100;
  const s = String(r);
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `${neg ? '-' : ''}₹${grouped}${f ? '.' + pad2(f) : ''}`;
}

// ---------- totals (the ONE place invoice maths happens) ----------
function computeTotals(items, { discount = 0, taxRate = 0 } = {}) {
  const lines = items.map((it) => {
    const qty = Number(it.qty);
    if (!(qty > 0)) throw new UserError('Quantity must be more than zero.');
    const rate = Math.round(Number(it.rate));
    if (!Number.isInteger(rate) || rate < 0) throw new UserError('Rate must be zero or more.');
    return { ...it, qty, rate, amount: Math.round(qty * rate) };
  });
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  if (discount > subtotal) throw new UserError('Discount cannot be larger than the subtotal.');
  const taxable = subtotal - discount;
  const tax = taxRate > 0 ? Math.round((taxable * taxRate) / 100) : 0;
  return { lines, subtotal, discount, tax, total: taxable + tax };
}

// ---------- invoice numbering ----------
async function nextInvoiceNumber(db, settings, issueDate) {
  const fy = financialYear(issueDate);
  const row = await db.prepare('SELECT last FROM counters WHERE fy = ?').get(fy);
  const seq = (row ? row.last : 0) + 1;
  await db.prepare('INSERT INTO counters(fy,last) VALUES(?,?) ON CONFLICT(fy) DO UPDATE SET last=excluded.last').run(fy, seq);
  const prefix = String(settings.invoice_prefix || 'INV').trim();
  return `${prefix}/${fy}/${String(seq).padStart(Number(settings.invoice_pad) || 3, '0')}`;
}

const { AsyncLocalStorage } = require('node:async_hooks');
const actor = new AsyncLocalStorage(); // who is making the current request (set by the server)
async function audit(db, action, entity, entityId, detail = '') {
  const who = actor.getStore();
  await db.prepare('INSERT INTO audit(action, entity, entity_id, detail, by_user) VALUES(?,?,?,?,?)').run(action, entity, entityId, String(detail), who ? who.name : 'system');
}

// ---------- invoices ----------
function normaliseItems(rawItems) {
  const items = (rawItems || []).filter((i) => i && String(i.description || '').trim());
  if (!items.length) throw new UserError('Add at least one item to the invoice.');
  return items.map((i, idx) => ({
    service_id: i.service_id || null,
    description: String(i.description).trim(),
    activity: i.activity || '',
    qty: i.qty === undefined || i.qty === '' ? 1 : i.qty,
    unit: i.unit || '',
    rate: i.rate,
    position: idx,
  }));
}

async function writeInvoiceBody(db, invoiceId, data, settings) {
  const gst = settings.gst_enabled ? Number(settings.gst_rate) || 0 : 0;
  const totals = computeTotals(normaliseItems(data.items), { discount: data.discount || 0, taxRate: gst });
  const customer = await db.prepare('SELECT id FROM customers WHERE id = ?').get(data.customer_id);
  if (!customer) throw new UserError('Please choose a customer.');
  const issue = data.issue_date || today();
  parseDate(issue);
  const terms = Number.isInteger(+data.terms_days) && +data.terms_days >= 0 ? +data.terms_days : Number(settings.default_terms_days);
  const due = data.due_date || addDays(issue, terms);
  if (due < issue) throw new UserError('The due date cannot be before the invoice date.');
  const termsDays = daysBetween(issue, due);

  await db.prepare(`UPDATE invoices SET customer_id=?, issue_date=?, terms_days=?, due_date=?, reference=?, period_start=?, period_end=?,
      subtotal=?, discount=?, tax_rate=?, tax=?, total=?, notes=?, recurring_id=COALESCE(?, recurring_id) WHERE id=?`)
    .run(data.customer_id, issue, termsDays, due, data.reference || '', data.period_start || null, data.period_end || null,
      totals.subtotal, totals.discount, gst, totals.tax, totals.total, data.notes || '', data.recurring_id || null, invoiceId);
  await db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
  const insSql = (`INSERT INTO invoice_items(invoice_id, position, service_id, description, activity, qty, unit, rate, amount)
      VALUES(?,?,?,?,?,?,?,?,?)`);
  for (const l of totals.lines) await db.prepare(insSql).run(invoiceId, l.position, l.service_id, l.description, l.activity, l.qty, l.unit, l.rate, l.amount);
  return totals;
}

async function issueInvoiceTx(db, id, settings, issueDateOverride) {
  const inv = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) throw new UserError('Invoice not found.', 404);
  if (inv.status !== 'draft') throw new UserError('This invoice has already been issued.');
  if (issueDateOverride && issueDateOverride !== inv.issue_date) {
    await db.prepare('UPDATE invoices SET issue_date=?, due_date=? WHERE id=?').run(issueDateOverride, addDays(issueDateOverride, inv.terms_days), id);
  }
  const fresh = await db.prepare('SELECT issue_date FROM invoices WHERE id = ?').get(id);
  const number = await nextInvoiceNumber(db, settings, fresh.issue_date);
  await db.prepare("UPDATE invoices SET status='issued', number=? WHERE id=?").run(number, id);
  await audit(db, 'invoice.issued', 'invoice', id, number);
  return number;
}

// Creates a draft; if issue=true also gives it a number. Atomic: all or nothing.
async function createInvoice(db, data, { issue = false } = {}) {
  const settings = await getSettings(db);
  return db.transaction(async (db) => {
    if (!await db.prepare('SELECT 1 FROM customers WHERE id = ?').get(data.customer_id)) throw new UserError('Please choose a customer.');
    const issueDate = data.issue_date || today();
    const r = await db.prepare('INSERT INTO invoices(customer_id, issue_date, due_date) VALUES(?,?,?)')
      .run(data.customer_id, issueDate, issueDate);
    const id = r.lastInsertRowid;
    await writeInvoiceBody(db, id, data, settings);
    await audit(db, 'invoice.created', 'invoice', id);
    if (issue) await issueInvoiceTx(db, id, settings);
    return id;
  });
}

async function updateDraft(db, id, data) {
  const settings = await getSettings(db);
  await db.transaction(async (db) => {
    const inv = await db.prepare('SELECT status FROM invoices WHERE id = ?').get(id);
    if (!inv) throw new UserError('Invoice not found.', 404);
    if (inv.status !== 'draft') throw new UserError('Issued invoices cannot be edited. Void it and create a new one if something is wrong.');
    await writeInvoiceBody(db, id, data, settings);
    await audit(db, 'invoice.updated', 'invoice', id);
  });
}

async function issueInvoice(db, id) {
  const settings = await getSettings(db);
  return db.transaction(async (tx) => issueInvoiceTx(tx, id, settings));
}

async function paidAmount(db, id) {
  return (await db.prepare('SELECT COALESCE(SUM(amount),0) AS p FROM payments WHERE invoice_id = ?').get(id)).p;
}

// What the user sees: Draft / Unpaid / Partly paid / Paid / Overdue / Void
function displayStatus(inv, paid, now = today()) {
  if (inv.status === 'draft') return 'draft';
  if (inv.status === 'void') return 'void';
  if (paid >= inv.total && inv.total > 0) return 'paid';
  if (inv.total === 0) return 'paid';
  if (inv.due_date < now) return 'overdue';
  return paid > 0 ? 'partial' : 'unpaid';
}

async function addPayment(db, invoiceId, p) {
  return db.transaction(async (db) => {
    const inv = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!inv) throw new UserError('Invoice not found.', 404);
    if (inv.status !== 'issued') throw new UserError('Payments can only be recorded on issued invoices.');
    const amount = toPaise(p.amount);
    if (amount <= 0) throw new UserError('Enter the amount received.');
    const balance = inv.total - await paidAmount(db, invoiceId);
    if (amount > balance) throw new UserError(`That is more than the balance due (${formatINR(balance)}).`);
    const date = p.date || today(); parseDate(date);
    const r = await db.prepare('INSERT INTO payments(invoice_id,date,amount,method,reference,notes) VALUES(?,?,?,?,?,?)')
      .run(invoiceId, date, amount, p.method || '', p.reference || '', p.notes || '');
    await audit(db, 'payment.added', 'invoice', invoiceId, `${formatINR(amount)} on ${date}`);
    return r.lastInsertRowid;
  });
}

async function voidInvoice(db, id, reason) {
  await db.transaction(async (db) => {
    const inv = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!inv) throw new UserError('Invoice not found.', 404);
    if (inv.status !== 'issued') throw new UserError('Only issued invoices can be voided.');
    if (await paidAmount(db, id) > 0) throw new UserError('This invoice has payments. Delete the payments first if they were a mistake.');
    await db.prepare("UPDATE invoices SET status='void', void_reason=? WHERE id=?").run(reason || '', id);
    await audit(db, 'invoice.voided', 'invoice', id, reason || '');
  });
}

async function loadInvoice(db, id) {
  const inv = await db.prepare(`SELECT i.*, c.name AS customer_name, c.email AS customer_email, c.address AS customer_address,
      c.phone AS customer_phone, c.gstin AS customer_gstin
      FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`).get(id);
  if (!inv) return null;
  inv.items = await db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(id);
  inv.payments = await db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY date, id').all(id);
  inv.paid = inv.payments.reduce((a, p) => a + p.amount, 0);
  inv.balance = inv.status === 'issued' ? inv.total - inv.paid : 0;
  inv.display_status = displayStatus(inv, inv.paid);
  return inv;
}

// ---------- recurring ----------
function firstRunDate(startDate, everyMonths, day) {
  const s = parseDate(startDate);
  let c = addMonthsClamped(s.getUTCFullYear(), s.getUTCMonth() + 1, 0, day);
  if (c < startDate) c = addMonthsClamped(s.getUTCFullYear(), s.getUTCMonth() + 1, everyMonths, day);
  return c;
}
function nextRunAfter(runDate, everyMonths, day) {
  const d = parseDate(runDate);
  return addMonthsClamped(d.getUTCFullYear(), d.getUTCMonth() + 1, everyMonths, day);
}
function recurringPeriod(runDate, mode, everyMonths) {
  const d = parseDate(runDate);
  const offset = mode === 'previous' ? -1 : mode === 'next' ? 1 : 0;
  const start = monthStart(d.getUTCFullYear(), d.getUTCMonth() + 1 + offset);
  const s = parseDate(start);
  const end = addDays(monthStart(s.getUTCFullYear(), s.getUTCMonth() + 1 + everyMonths), -1);
  return { start, end };
}
function fillReference(pattern, items, period) {
  const label = periodLabel(period.start, period.end);
  const first = items[0] ? items[0].description : 'Services';
  const base = pattern && pattern.trim() ? pattern : '{service} – {period}';
  return base.replace(/\{period\}/g, label).replace(/\{service\}/g, first)
    .replace(/\{month\}/g, MONTHS[parseDate(period.start).getUTCMonth()])
    .replace(/\{year\}/g, String(parseDate(period.start).getUTCFullYear()));
}

async function validateRecurring(db, d) {
  if (!await db.prepare('SELECT 1 FROM customers WHERE id=?').get(d.customer_id)) throw new UserError('Please choose a customer.');
  const items = normaliseItems(d.items).map((i) => ({ ...i, rate: Math.round(Number(i.rate)) }));
  computeTotals(items); // throws on bad numbers
  const every = Number(d.every_months);
  if (![1, 3, 6, 12].includes(every)) throw new UserError('Choose how often to repeat.');
  const day = Number(d.day_of_month);
  if (!Number.isInteger(day) || day < 0 || day > 31) throw new UserError('Choose a day of the month.');
  parseDate(d.start_date);
  if (d.end_date) { parseDate(d.end_date); if (d.end_date < d.start_date) throw new UserError('The end date is before the start date.'); }
  return { items, every, day };
}

async function saveRecurring(db, d, id = null) {
  const { items, every, day } = await validateRecurring(db, d);
  const settings = await getSettings(db);
  const fields = [d.customer_id, JSON.stringify(items), every, day, d.start_date, d.end_date || null,
    Number.isInteger(+d.terms_days) ? +d.terms_days : settings.default_terms_days, d.reference || '',
    ['previous', 'this', 'next'].includes(d.period_mode) ? d.period_mode : 'this', d.auto_send ? 1 : 0, d.notes || ''];
  if (id) {
    await db.prepare(`UPDATE recurring SET customer_id=?, items=?, every_months=?, day_of_month=?, start_date=?, end_date=?, terms_days=?,
        reference=?, period_mode=?, auto_send=?, notes=? WHERE id=?`).run(...fields, id);
    const cur = await db.prepare('SELECT * FROM recurring WHERE id=?').get(id);
    // Re-aim the next run only if nothing has been generated yet.
    if (!cur.last_run) await db.prepare('UPDATE recurring SET next_run=? WHERE id=?').run(firstRunDate(d.start_date, every, day), id);
    else await db.prepare('UPDATE recurring SET next_run=? WHERE id=?').run(nextRunAfter(cur.last_run, every, day), id);
    await audit(db, 'recurring.updated', 'recurring', id);
    return id;
  }
  const r = await db.prepare(`INSERT INTO recurring(customer_id, items, every_months, day_of_month, start_date, end_date, terms_days,
      reference, period_mode, auto_send, notes, next_run) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(...fields, firstRunDate(d.start_date, every, day));
  await audit(db, 'recurring.created', 'recurring', r.lastInsertRowid);
  return r.lastInsertRowid;
}

// Generates ONE invoice for a schedule (atomic) and moves next_run forward.
async function generateRecurringInvoice(db, rec, now = today(), { issueToday = false } = {}) {
  const items = JSON.parse(rec.items);
  const runDate = rec.next_run;
  return db.transaction(async (db) => {
    // Another run may have handled this cycle already (two overlapping cron calls): only one gets to proceed.
    const claim = await db.prepare('UPDATE recurring SET last_run = last_run WHERE id = ? AND next_run IS ?').run(rec.id, runDate);
    if (claim.changes === 0) throw new UserError('This schedule was already processed.');
    const period = recurringPeriod(runDate, rec.period_mode, rec.every_months);
    // Use the real issuing date; if the server was off on the scheduled day this is the day we caught up.
    const issueDate = issueToday || runDate < now ? now : runDate;
    const id = await createInvoice(db, {
      customer_id: rec.customer_id, items, issue_date: issueDate, terms_days: rec.terms_days,
      reference: fillReference(rec.reference, items, period), period_start: period.start, period_end: period.end,
      recurring_id: rec.id,
    }, { issue: true });
    const nxt = nextRunAfter(runDate, rec.every_months, rec.day_of_month);
    const finished = rec.end_date && nxt > rec.end_date;
    await db.prepare('UPDATE recurring SET last_run=?, next_run=?, active=? WHERE id=?')
      .run(runDate, finished ? null : nxt, finished ? 0 : rec.active, rec.id);
    await audit(db, 'recurring.generated', 'recurring', rec.id, `invoice ${id}`);
    return id;
  });
}

module.exports = {
  actor, DEFAULT_SETTINGS, getSettings, saveSettings, UserError,
  today, addDays, daysBetween, parseDate, prettyDate, periodLabel, financialYear,
  toPaise, formatINR, computeTotals, nextInvoiceNumber, audit,
  createInvoice, updateDraft, issueInvoice, addPayment, voidInvoice, loadInvoice, paidAmount, displayStatus,
  firstRunDate, nextRunAfter, recurringPeriod, fillReference, saveRecurring, generateRecurringInvoice, validateRecurring,
};
