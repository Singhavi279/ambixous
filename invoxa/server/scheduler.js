// Runs in the background: creates due recurring invoices, emails them, and sends payment reminders.
const L = require('./lib');
const { sendInvoiceEmail } = require('./mail');

let busy = false;

async function runRecurring(db, now = L.today()) {
  const due = await db.prepare(`SELECT * FROM recurring WHERE active = 1 AND next_run IS NOT NULL AND next_run <= ? ORDER BY next_run`).all(now);
  const results = [];
  for (const initial of due) {
    let rec = initial, guard = 0;
    // Catch up if the app was switched off over several cycles (max 12 per schedule per tick).
    while (rec && rec.active && rec.next_run && rec.next_run <= now && guard++ < 12) {
      let invoiceId;
      try {
        invoiceId = await L.generateRecurringInvoice(db, rec, now);
      } catch (e) {
        if (e.message === 'This schedule was already processed.') break; // another run handled this cycle
        await L.audit(db, 'recurring.failed', 'recurring', rec.id, e.message);
        console.error(`Recurring #${rec.id} failed:`, e.message);
        break;
      }
      let email = null;
      if (rec.auto_send) email = await sendInvoiceEmail(db, invoiceId, { kind: 'invoice' });
      results.push({ recurringId: rec.id, invoiceId, email });
      rec = await db.prepare('SELECT * FROM recurring WHERE id = ?').get(rec.id);
    }
  }
  return results;
}

// Gentle automatic reminders: 3 days before due, on the due date, 7 days after.
const REMINDERS = [
  { kind: 'before3', offset: -3, short: 'is due in 3 days', long: 'is due in 3 days' },
  { kind: 'due', offset: 0, short: 'is due today', long: 'is due today' },
  { kind: 'late7', offset: 7, short: 'is overdue', long: 'is now 7 days overdue' },
];

async function runReminders(db, now = L.today()) {
  const s = await L.getSettings(db);
  if (!s.reminders_enabled) return [];
  const sent = [];
  const open = await db.prepare("SELECT id FROM invoices WHERE status = 'issued' AND sent_at IS NOT NULL").all();
  for (const { id } of open) {
    const inv = await L.loadInvoice(db, id);
    if (inv.balance <= 0 || !inv.customer_email) continue;
    for (const r of REMINDERS) {
      const trigger = L.addDays(inv.due_date, r.offset);
      // Only fire within 2 days of the trigger so switching reminders on never blasts old invoices.
      if (now < trigger || now > L.addDays(trigger, 2)) continue;
      // Claim the reminder first so two overlapping runs can never both send it.
      const claim = await db.prepare('INSERT OR IGNORE INTO reminders_sent(invoice_id, kind) VALUES(?,?)').run(id, r.kind);
      if (claim.changes === 0) continue;
      const res = await sendInvoiceEmail(db, id, { kind: 'reminder', when: r });
      if (res.ok) sent.push({ id, kind: r.kind });
      else await db.prepare('DELETE FROM reminders_sent WHERE invoice_id=? AND kind=?').run(id, r.kind); // retry next run
      break; // at most one reminder per invoice per run
    }
  }
  return sent;
}

async function tick(db) {
  if (busy) return { skipped: true };
  busy = true;
  try {
    const recurring = await runRecurring(db);
    const reminders = await runReminders(db);
    return { recurring: recurring.length, reminders: reminders.length };
  } catch (e) {
    console.error('Scheduler error:', e);
    return { error: true };
  } finally { busy = false; }
}

// Local use only: on Vercel the same tick() is triggered by a scheduled call to /api/cron/tick instead.
function start(db, everyMs = 15 * 60 * 1000) {
  setTimeout(() => tick(db), 3000);       // shortly after start-up (catches up anything missed)
  return setInterval(() => tick(db), everyMs);
}

module.exports = { start, tick, runRecurring, runReminders };
