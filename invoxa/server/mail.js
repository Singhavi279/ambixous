const nodemailer = require('nodemailer');
const L = require('./lib');
const { invoicePdf } = require('./pdf');

function smtpReady(s) {
  return Boolean(s.smtp_host && s.smtp_user && s.smtp_pass && (s.from_email || s.smtp_user));
}

function makeTransport(s) {
  return nodemailer.createTransport({
    host: s.smtp_host,
    port: Number(s.smtp_port) || 587,
    secure: Boolean(s.smtp_secure), // true for port 465
    auth: { user: s.smtp_user, pass: s.smtp_pass },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
}

const fromHeader = (s) => `"${(s.from_name || s.business_name).replace(/"/g, '')}" <${s.from_email || s.smtp_user}>`;

function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function templateVars(inv, s, extra = {}) {
  return {
    customer_name: inv.customer_name,
    invoice_number: inv.number,
    amount: L.formatINR(inv.balance || inv.total),
    total: L.formatINR(inv.total),
    due_date: L.prettyDate(inv.due_date),
    reference: inv.reference || 'our services',
    business_name: s.business_name,
    payment_details: (s.payment_details || (inv.show_upi && s.upi_id)) ? `Payment details:\n${inv.show_upi && s.upi_id ? `UPI ID: ${s.upi_id}\n` : ''}${s.payment_details || ''}\n` : '',
    ...extra,
  };
}

async function log(db, row) {
  await db.prepare('INSERT INTO emails(invoice_id, kind, to_addr, subject, status, error) VALUES(?,?,?,?,?,?)')
    .run(row.invoice_id || null, row.kind, row.to, row.subject, row.status, row.error || null);
}

// Sends an invoice (or reminder) email with the PDF attached. Never throws – returns {ok, message}.
async function sendInvoiceEmail(db, invoiceId, { kind = 'invoice', when = null, to = null } = {}) {
  const s = await L.getSettings(db);
  const inv = await L.loadInvoice(db, invoiceId);
  if (!inv) return { ok: false, message: 'Invoice not found.' };
  if (inv.status !== 'issued') return { ok: false, message: 'Only issued invoices can be emailed.' };
  const recipient = (to || inv.customer_email || '').trim();
  const vars = templateVars(inv, s, when ? { when: when.short, when_long: when.long } : {});
  const subject = fill(kind === 'reminder' ? s.reminder_subject : s.email_subject, vars);
  const body = fill(kind === 'reminder' ? s.reminder_body : s.email_body, vars);

  if (!recipient) {
    return { ok: false, message: `${inv.customer_name} has no email address. Add one on the Customers page, then try again.` };
  }
  if (!smtpReady(s)) {
    await log(db, { invoice_id: invoiceId, kind, to: recipient, subject, status: 'not_set_up' });
    return { ok: false, notSetUp: true, message: 'Email is not set up yet. Open Settings → Email to connect your mailbox. Nothing was sent.' };
  }
  try {
    const pdf = await invoicePdf(inv, s);
    await makeTransport(s).sendMail({
      from: fromHeader(s), to: recipient, subject, text: body,
      replyTo: s.business_email || undefined,
      attachments: [{ filename: `Invoice-${inv.number.replace(/\//g, '-')}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });
    await log(db, { invoice_id: invoiceId, kind, to: recipient, subject, status: 'sent' });
    if (kind === 'invoice') await db.prepare('UPDATE invoices SET sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(invoiceId);
    await L.audit(db, `email.${kind}`, 'invoice', invoiceId, recipient);
    return { ok: true, message: `Sent to ${recipient}.` };
  } catch (e) {
    await log(db, { invoice_id: invoiceId, kind, to: recipient, subject, status: 'failed', error: e.message });
    return { ok: false, message: `Could not send the email: ${friendlyMailError(e)} The invoice itself is safe — you can retry.` };
  }
}

function friendlyMailError(e) {
  const m = e.message || String(e);
  if (/Invalid login|535|auth/i.test(m)) return 'the mailbox rejected the username or password (Gmail users need an "App Password").';
  if (/sender address|Invalid.*address|EENVELOPE/i.test(m)) return 'the sender email address looks wrong. Set a valid "Sender email" in Settings → Email.';
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|timeout/i.test(m)) return 'could not reach the mail server — check the server name, port and your internet.';
  return m;
}

async function sendTestEmail(db, to) {
  const s = await L.getSettings(db);
  if (!smtpReady(s)) return { ok: false, message: 'Fill in the mail server, username and password first, then save.' };
  const subject = `Test email from ${s.business_name}`;
  try {
    await makeTransport(s).sendMail({ from: fromHeader(s), to, subject, text: 'Great news — your invoicing email is set up correctly.' });
    await log(db, { kind: 'test', to, subject, status: 'sent' });
    return { ok: true, message: `Test email sent to ${to}.` };
  } catch (e) {
    await log(db, { kind: 'test', to, subject, status: 'failed', error: e.message });
    return { ok: false, message: `Test failed: ${friendlyMailError(e)}` };
  }
}

module.exports = { sendInvoiceEmail, sendTestEmail, smtpReady, fill };
