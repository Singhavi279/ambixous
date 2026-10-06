const test = require('node:test');
const assert = require('node:assert');
const { open } = require('../server/db');
const L = require('../server/lib');
const { invoicePdf } = require('../server/pdf');

const fresh = async () => {
  const db = await open(':memory:');
  const c = (await db.prepare("INSERT INTO customers(name,email) VALUES('Rohan Mehta','rohan@example.com')").run()).lastInsertRowid;
  return { db, c };
};
const item = (rate = 2000000) => ({ description: 'LinkedIn Management Services', qty: 1, rate, activity: 'Advertising' });

test('financial year and numbering', async () => {
  assert.equal(L.financialYear('2026-10-30'), '26-27');
  assert.equal(L.financialYear('2027-03-31'), '26-27');
  assert.equal(L.financialYear('2027-04-01'), '27-28');
  const { db, c } = await fresh();
  const a = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], issue_date: '2026-10-30' }, { issue: true });
  const b = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], issue_date: '2026-11-02' }, { issue: true });
  const n = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], issue_date: '2027-04-02' }, { issue: true });
  assert.equal((await L.loadInvoice(db, a)).number, 'AI/26-27/001');
  assert.equal((await L.loadInvoice(db, b)).number, 'AI/26-27/002');
  assert.equal((await L.loadInvoice(db, n)).number, 'AI/27-28/001'); // resets each FY
});

test('drafts do not burn numbers; no duplicate numbers possible', async () => {
  const { db, c } = await fresh();
  await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] });
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] }, { issue: true });
  assert.ok((await L.loadInvoice(db, id)).number.endsWith('/001'));
  await assert.rejects(async () => await db.prepare("INSERT INTO invoices(number,customer_id,issue_date,due_date) VALUES(?,?,?,?)").run((await L.loadInvoice(db, id)).number, c, '2026-01-01', '2026-01-02'), /UNIQUE/);
});

test('due date from payment terms; totals; GST off by default', async () => {
  const { db, c } = await fresh();
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], issue_date: '2026-10-30', terms_days: 10 }, { issue: true });
  const inv = await L.loadInvoice(db, id);
  assert.equal(inv.due_date, '2026-11-09');
  assert.equal(inv.total, 2000000);
  assert.equal(inv.tax, 0);
});

test('GST on adds one simple tax line', async () => {
  const { db, c } = await fresh();
  await L.saveSettings(db, { gst_enabled: true, gst_rate: 18 });
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item(1000000)], discount: 100000 });
  const inv = await L.loadInvoice(db, id);
  assert.deepEqual([inv.subtotal, inv.tax, inv.total], [1000000, 162000, 1062000]);
});

test('bad input is rejected with friendly errors', async () => {
  const { db, c } = await fresh();
  await assert.rejects(async () => await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [] }), /at least one item/);
  await assert.rejects(async () => await L.createInvoice(db, { customer_id: 999, items: [item()] }), /choose a customer/);
  await assert.rejects(async () => await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], discount: 99999999 }), /Discount/);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM invoices').get()).n, 0); // rolled back
});

test('payments: partial, full, over-payment blocked, status', async () => {
  const { db, c } = await fresh();
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], issue_date: '2026-10-30' }, { issue: true });
  await L.addPayment(db, id, { amount: 5000, date: '2026-11-01' });
  assert.equal((await L.loadInvoice(db, id)).display_status, L.displayStatus({ status: 'issued', total: 2000000, due_date: '2099-01-01' }, 500000));
  await assert.rejects(async () => await L.addPayment(db, id, { amount: 20000 }), /more than the balance/);
  await L.addPayment(db, id, { amount: 15000, date: '2026-11-05' });
  const inv = await L.loadInvoice(db, id);
  assert.equal(inv.display_status, 'paid'); assert.equal(inv.balance, 0);
});

test('overdue status', async () => {
  assert.equal(L.displayStatus({ status: 'issued', total: 100, due_date: '2026-01-01' }, 0, '2026-01-02'), 'overdue');
  assert.equal(L.displayStatus({ status: 'issued', total: 100, due_date: '2026-01-02' }, 0, '2026-01-02'), 'unpaid');
});

test('issued invoices cannot be edited; void keeps number', async () => {
  const { db, c } = await fresh();
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] }, { issue: true });
  await assert.rejects(async () => await L.updateDraft(db, id, { customer_id: c, signer: 'avnish', items: [item()] }), /cannot be edited/);
  await L.voidInvoice(db, id, 'oops');
  assert.equal((await L.loadInvoice(db, id)).status, 'void');
  const next = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] }, { issue: true });
  assert.ok((await L.loadInvoice(db, next)).number.endsWith('/002')); // no reuse
});

test('recurring: fixed day, month-end clamping, period, catch-up', async () => {
  assert.equal(L.firstRunDate('2026-10-01', 1, 30), '2026-10-30');
  assert.equal(L.firstRunDate('2026-10-31', 1, 30), '2026-11-30');
  assert.equal(L.nextRunAfter('2026-01-30', 1, 30), '2026-02-28');
  assert.equal(L.nextRunAfter('2026-02-28', 1, 30), '2026-03-30'); // goes back to the 30th
  assert.equal(L.nextRunAfter('2026-10-30', 1, 0), '2026-11-30');
  assert.equal(L.nextRunAfter('2026-11-30', 3, 0), '2027-02-28');
  assert.deepEqual(L.recurringPeriod('2026-10-30', 'this', 1), { start: '2026-10-01', end: '2026-10-31' });
  assert.deepEqual(L.recurringPeriod('2026-10-30', 'next', 1), { start: '2026-11-01', end: '2026-11-30' });
  assert.deepEqual(L.recurringPeriod('2026-10-30', 'previous', 3), { start: '2026-09-01', end: '2026-11-30' });
  assert.equal(L.periodLabel('2026-10-01', '2026-10-31'), 'October 2026');
});

test('recurring generates numbered invoices on schedule (async runner)', async () => {
  const { db, c } = await fresh();
  const rid = await L.saveRecurring(db, { customer_id: c, signer: 'avnish', items: [item()], every_months: 1, day_of_month: 30, start_date: '2026-10-01', terms_days: 10, auto_send: false });
  const sched = require('../server/scheduler');
  let r = await sched.runRecurring(db, '2026-10-29');
  assert.equal(r.length, 0);
  r = await sched.runRecurring(db, '2026-10-30');
  assert.equal(r.length, 1);
  const inv = await L.loadInvoice(db, r[0].invoiceId);
  assert.deepEqual([inv.number, inv.issue_date, inv.due_date, inv.reference, inv.total], ['AI/26-27/001', '2026-10-30', '2026-11-09', 'LinkedIn Management Services – October 2026', 2000000]);
  r = await sched.runRecurring(db, '2026-10-30'); assert.equal(r.length, 0); // never double-bills
  assert.equal((await db.prepare('SELECT next_run FROM recurring WHERE id=?').get(rid)).next_run, '2026-11-30');
  // app was off for 2 cycles: catches up, issue date = the day it actually ran
  r = await sched.runRecurring(db, '2027-01-05');
  assert.equal(r.length, 2); assert.equal((await L.loadInvoice(db, r[1].invoiceId)).issue_date, '2027-01-05');
});

test('recurring ends at end date', async () => {
  const { db, c } = await fresh();
  const rid = await L.saveRecurring(db, { customer_id: c, signer: 'avnish', items: [item()], every_months: 1, day_of_month: 1, start_date: '2026-10-01', end_date: '2026-11-15', auto_send: false });
  await require('../server/scheduler').runRecurring(db, '2026-12-01');
  const rec = await db.prepare('SELECT * FROM recurring WHERE id=?').get(rid);
  assert.equal(rec.active, 0); assert.equal(rec.next_run, null);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM invoices').get()).n, 2);
});

test('email without setup is logged, never claims success', async () => {
  const { db, c } = await fresh();
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] }, { issue: true });
  const r = await require('../server/mail').sendInvoiceEmail(db, id);
  assert.equal(r.ok, false); assert.match(r.message, /not set up/);
  assert.equal((await db.prepare('SELECT status FROM emails').get()).status, 'not_set_up');
  assert.equal((await L.loadInvoice(db, id)).sent_at, null);
});

test('PDF renders', async () => {
  const { db, c } = await fresh();
  const id = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], reference: 'Test' }, { issue: true });
  const pdf = await invoicePdf(await L.loadInvoice(db, id), await L.getSettings(db));
  assert.equal(pdf.slice(0, 4).toString(), '%PDF');
});

test('INR formatting uses Indian grouping', async () => {
  assert.equal(L.formatINR(25000000), '₹2,50,000');
  assert.equal(L.formatINR(2000000), '₹20,000');
  assert.equal(L.formatINR(12345), '₹123.45');
});

test('signer is required to issue; unknown signers rejected; signature image + item details reach the PDF', async () => {
  const { db, c } = await fresh();
  await assert.rejects(() => L.createInvoice(db, { customer_id: c, items: [item()] }, { issue: true }), /who signs/);
  await assert.rejects(() => L.createInvoice(db, { customer_id: c, signer: 'someone', items: [item()] }), /who signs/);
  const draft = await L.createInvoice(db, { customer_id: c, items: [item()] }); // drafts may stay unsigned
  assert.equal((await L.loadInvoice(db, draft)).signer, '');
  const images = async (signer) => {
    const id = await L.createInvoice(db, { customer_id: c, signer, items: [{ ...item(), details: 'Monthly fees for profile management' }], period_start: '2026-09-01', period_end: '2026-09-30' }, { issue: true });
    const inv = await L.loadInvoice(db, id);
    assert.equal(inv.items[0].details, 'Monthly fees for profile management');
    const pdf = (await invoicePdf(inv, await L.getSettings(db))).toString('latin1');
    return (pdf.match(/\/Subtype \/Image/g) || []).length;
  };
  assert.equal(await images('avnish'), 4); // logo + signature (each PNG carries a transparency mask)
  assert.equal(await images('riti'), 4);
  const unsigned = (await invoicePdf(await L.loadInvoice(db, draft), await L.getSettings(db))).toString('latin1');
  assert.equal((unsigned.match(/\/Subtype \/Image/g) || []).length, 2); // logo only
});

test('repeat billing needs a signer and carries it onto generated invoices', async () => {
  const { db, c } = await fresh();
  await assert.rejects(() => L.saveRecurring(db, { customer_id: c, items: [item()], every_months: 1, day_of_month: 30, start_date: '2026-10-01' }), /who signs/);
  const rid = await L.saveRecurring(db, { customer_id: c, signer: 'riti', items: [item()], every_months: 1, day_of_month: 30, start_date: '2026-10-01', auto_send: false });
  const r = await require('../server/scheduler').runRecurring(db, '2026-10-30');
  assert.equal((await L.loadInvoice(db, r[0].invoiceId)).signer, 'riti');
  assert.ok(rid);
});

test('UPI QR is only added when chosen on the invoice', async () => {
  const { db, c } = await fresh();
  const on = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()], show_upi: true }, { issue: true });
  const off = await L.createInvoice(db, { customer_id: c, signer: 'avnish', items: [item()] }, { issue: true });
  const s = await L.getSettings(db);
  const pOn = await invoicePdf(await L.loadInvoice(db, on), s);
  const pOff = await invoicePdf(await L.loadInvoice(db, off), s);
  assert.equal(pOn.slice(0, 4).toString(), '%PDF');
  assert.ok(pOn.length > pOff.length + 5000, 'QR image should be embedded only when show_upi is set');
  assert.equal((await L.loadInvoice(db, on)).show_upi, 1);
  assert.equal((await L.loadInvoice(db, off)).show_upi, 0);
});
