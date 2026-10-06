/* Plain-JS single page app. Money is always in paise (integers) when talking to the server. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- helpers ----------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad2 = (n) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const pd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fd = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
const addDays = (s, n) => { const d = pd(s); d.setUTCDate(d.getUTCDate() + n); return fd(d); };
const nice = (s) => { if (!s) return '—'; const d = pd(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const niceLong = (s) => { const d = pd(s); return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const inr = (p) => {
  const neg = p < 0; p = Math.abs(Math.round(p)); const r = Math.floor(p / 100), f = p % 100; const s = String(r);
  const g = s.length > 3 ? s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3) : s;
  return `${neg ? '-' : ''}₹${g}${f ? '.' + pad2(f) : ''}`;
};
const toPaise = (v) => Math.round((parseFloat(v) || 0) * 100);
const rupeesStr = (p) => (p ? String(p / 100) : '');
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const STATUS_LABEL = { draft: 'Draft', unpaid: 'Unpaid', partial: 'Part paid', paid: 'Paid', overdue: 'Overdue', void: 'Void' };
const chip = (s) => `<span class="chip ${s}">${STATUS_LABEL[s] || s}</span>`;

// Served at /invoxa on ambixous.in; at the root when run locally.
const BASE = location.pathname.startsWith('/invoxa') ? '/invoxa' : '';

async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + '/api' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new Error('Cannot reach the invoicing app. Please check your internet connection and try again.'); }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (res.status === 401 && !path.startsWith('/auth/')) { showAuth(false); throw new Error('Please sign in again.'); }
  if (!res.ok) throw new Error((data && data.error) || 'Something went wrong.');
  return data;
}
function toast(msg, kind = '') {
  const t = document.createElement('div'); t.className = `toast ${kind}`; t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), kind === 'bad' ? 7000 : 4000);
}
const fail = (e) => toast(e.message, 'bad');
function modal(html, onMount) {
  const w = $('#modal'); w.innerHTML = `<div class="modal">${html}</div>`; w.hidden = false;
  w.onclick = (e) => { if (e.target === w) closeModal(); };
  onMount && onMount(w);
}
const closeModal = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; };
async function busy(btn, fn) {
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Please wait…';
  try { return await fn(); } catch (e) { fail(e); } finally { btn.disabled = false; btn.innerHTML = old; }
}
const confirmBox = (title, text, okLabel, danger = false) => new Promise((res) => {
  modal(`<h2>${esc(title)}</h2><p>${text}</p><div class="actions"><button class="btn" id="cn">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="ok">${esc(okLabel)}</button></div>`, () => {
    $('#cn').onclick = () => { closeModal(); res(false); }; $('#ok').onclick = () => { closeModal(); res(true); };
  });
});

let SETTINGS = {};
const loadSettings = async () => { SETTINGS = await api('/settings'); $('#brandName').textContent = SETTINGS.business_name || 'Invoxa'; return SETTINGS; };
const view = (html) => { $('#main').innerHTML = html; window.scrollTo(0, 0); };
const empty = (icon, title, text, action = '') => `<div class="empty"><div class="big">${icon}</div><h2>${title}</h2><p>${text}</p>${action}</div>`;

// ---------- router ----------
const routes = [
  [/^\/?$/, 'home', pageHome],
  [/^\/invoices$/, 'invoices', pageInvoices],
  [/^\/invoice\/new$/, 'invoices', (m, q) => pageInvoiceForm(null, q)],
  [/^\/invoice\/(\d+)\/edit$/, 'invoices', (m) => pageInvoiceForm(+m[1])],
  [/^\/invoice\/(\d+)$/, 'invoices', (m) => pageInvoice(+m[1])],
  [/^\/customers$/, 'customers', pageCustomers],
  [/^\/services$/, 'services', pageServices],
  [/^\/recurring$/, 'recurring', pageRecurring],
  [/^\/recurring\/new$/, 'recurring', (m, q) => pageRecurringForm(null, q)],
  [/^\/recurring\/(\d+)$/, 'recurring', (m) => pageRecurringForm(+m[1])],
  [/^\/reports$/, 'reports', pageReports],
  [/^\/settings$/, 'settings', pageSettings],
];
async function route() {
  closeModal();
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  if (ME && ME.role === 'ca' && path !== '/reports') { location.hash = '#/reports'; return; }
  for (const [re, nav, fn] of routes) {
    const m = path.match(re);
    if (m) {
      $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.p === nav));
      try { await fn(m, q); } catch (e) { view(`<div class="notice bad">${esc(e.message)}</div>`); }
      return;
    }
  }
  view(empty('🤔', 'Page not found', 'That page does not exist.', '<a class="btn primary" href="#/">Go home</a>'));
}
window.addEventListener('hashchange', route);

// =====================================================================
// HOME
// =====================================================================
async function pageHome() {
  const [d] = await Promise.all([api('/dashboard'), loadSettings()]);
  const s = d.setup; const doneAll = s.business && s.email && s.customer && s.invoice;
  const step = (done, label, href, cta) => `<li class="${done ? 'done' : ''}"><span class="dot">${done ? '✓' : ''}</span><span>${label}</span>${done ? '' : `<a class="btn" href="${href}">${cta}</a>`}</li>`;
  view(`
    <div class="page-head"><div><h1>Hello 👋</h1><div class="sub">Here is how ${esc(SETTINGS.business_name)} is doing today.</div></div>
      <a class="btn primary big" href="#/invoice/new">+ New invoice</a></div>
    ${d.failedEmails ? `<div class="notice bad"><span>⚠️ ${d.failedEmails} email${d.failedEmails > 1 ? 's' : ''} could not be sent. Open the invoice and press “Email invoice” to retry.</span><a class="btn" href="#/invoices?status=open">See invoices</a></div>` : ''}
    ${doneAll ? '' : `<div class="card" style="margin-bottom:16px"><h2>Get started in 4 easy steps</h2><ul class="steps">
      ${step(s.business, 'Add your business details (they appear on every invoice)', '#/settings', 'Add details')}
      ${step(s.customer, 'Add your first customer', '#/customers?new=1', 'Add customer')}
      ${step(s.invoice, 'Create your first invoice', '#/invoice/new', 'Create invoice')}
      ${step(s.email, 'Connect your email so invoices can be sent from here', '#/settings?tab=email', 'Connect email')}
    </ul></div>`}
    <div class="grid g4" style="margin-bottom:16px">
      <a class="card stat" href="#/invoices?status=open"><div class="label">Waiting to be paid</div><div class="num">${inr(d.owed)}</div><div class="small muted">${d.owedCount} invoice${d.owedCount === 1 ? '' : 's'}</div></a>
      <a class="card stat ${d.overdue ? 'bad' : ''}" href="#/invoices?status=overdue"><div class="label">Late payments</div><div class="num">${inr(d.overdue)}</div><div class="small muted">${d.overdueCount} overdue</div></a>
      <div class="card"><div class="label muted small">Due in next 7 days</div><div class="num" style="font-size:28px;font-weight:700">${inr(d.dueSoon)}</div></div>
      <div class="card stat good"><div class="label">Received this month</div><div class="num">${inr(d.paidThisMonth)}</div><div class="small muted">Billed: ${inr(d.billedThisMonth)}</div></div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>Needs your attention</h2>
        ${d.attention.length ? `<table><tbody>${d.attention.map((i) => `<tr class="click" onclick="location.hash='#/invoice/${i.id}'"><td><b>${esc(i.customer_name)}</b><div class="small muted">${esc(i.number)} · due ${nice(i.due_date)}</div></td><td class="right"><b>${inr(i.balance)}</b></td></tr>`).join('')}</tbody></table>`
          : '<p class="muted">🎉 Nothing is overdue. Nice work.</p>'}
        ${d.drafts ? `<p class="small muted" style="margin-top:10px">You have ${d.drafts} unfinished draft${d.drafts > 1 ? 's' : ''}. <a href="#/invoices?status=draft">Review</a></p>` : ''}
      </div>
      <div class="card"><h2>Coming up (automatic)</h2>
        ${d.upcoming.length ? `<table><tbody>${d.upcoming.map((u) => `<tr class="click" onclick="location.hash='#/recurring/${u.id}'"><td><b>${esc(u.customer_name)}</b><div class="small muted">Invoice on ${nice(u.next_run)}</div></td><td class="right"><b>${inr(u.total)}</b></td></tr>`).join('')}</tbody></table>`
          : `<p class="muted">Nothing scheduled. Bill the same customer every month? <a href="#/recurring/new">Set up repeat billing</a> and it will be sent automatically.</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Latest invoices</h2><a href="#/invoices">See all</a></div>
      ${d.recent.length ? invoiceTable(d.recent) : '<p class="muted" style="margin-top:10px">No invoices yet.</p>'}</div>
    ${!d.gstEnabled ? `<p class="small muted" style="margin-top:14px">This financial year (${esc(d.fy)}) you have invoiced ${inr(d.fyTurnover)}. GST is switched off — if you ever need to turn it on, ask your CA, then see Settings → Tax.</p>` : ''}
  `);
}

function invoiceTable(rows, { showCustomer = true } = {}) {
  return `<table><thead><tr><th>Invoice</th>${showCustomer ? '<th>Customer</th>' : ''}<th class="hide-m">Due</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>
    ${rows.map((i) => `<tr class="click" onclick="location.hash='#/invoice/${i.id}'"><td><b>${esc(i.number || 'Draft')}</b><div class="small muted hide-m">${nice(i.issue_date)}</div></td>
      ${showCustomer ? `<td>${esc(i.customer_name)}<div class="small muted">${esc(i.reference || '')}</div></td>` : ''}
      <td class="hide-m nowrap">${i.status === 'issued' ? nice(i.due_date) : '—'}</td>
      <td class="right"><b>${inr(i.total)}</b>${i.display_status === 'partial' ? `<div class="small muted">${inr(i.balance)} left</div>` : ''}</td><td>${chip(i.display_status)}</td></tr>`).join('')}
  </tbody></table>`;
}

// =====================================================================
// INVOICES LIST
// =====================================================================
async function pageInvoices(m, q) {
  let status = q.status || 'all'; let search = '';
  view(`<div class="page-head"><div><h1>Invoices</h1><div class="sub">Everything you have billed.</div></div><a class="btn primary" href="#/invoice/new">+ New invoice</a></div>
    <div class="tabs" id="tabs"></div>
    <input id="search" placeholder="🔍 Search by customer, invoice number or reference" style="margin-bottom:14px">
    <div class="card flush" id="list"></div>`);
  const tabs = [['all', 'All'], ['open', 'Waiting for payment'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['draft', 'Drafts'], ['void', 'Void']];
  const draw = async () => {
    $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-k="${k}" class="${k === status ? 'on' : ''}">${l}</button>`).join('');
    $$('#tabs button').forEach((b) => b.onclick = () => { status = b.dataset.k; draw(); });
    const rows = await api(`/invoices?status=${status}&q=${encodeURIComponent(search)}`);
    $('#list').innerHTML = rows.length ? invoiceTable(rows) : empty('🧾', 'No invoices here', status === 'all' && !search ? 'Create your first invoice in under a minute.' : 'Try a different filter.', '<a class="btn primary" href="#/invoice/new">+ New invoice</a>');
  };
  let tm; $('#search').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { search = e.target.value; draw(); }, 250); };
  draw();
}

// Who signs the invoice (the signature image is added to the PDF). Chosen every time, never assumed.
function signerPicker(signers, current) {
  return `<div class="field"><label>Authorised signatory</label>
    <select id="signer"><option value="">Choose who signs…</option>${signers.map((x) => `<option value="${x.key}" ${x.key === current ? 'selected' : ''}>${esc(x.name)} — ${esc(x.title)}</option>`).join('')}</select>
    <div id="signerPrev" style="margin-top:10px;min-height:56px"></div></div>`;
}
function bindSignerPreview() {
  const draw = () => { const v = $('#signer').value; $('#signerPrev').innerHTML = v ? `<img src="${BASE}/api/signers/${v}/image" alt="Signature" style="max-height:56px;max-width:160px">` : ''; };
  $('#signer').addEventListener('input', draw); draw();
}

// =====================================================================
// ITEMS EDITOR (shared by invoice + repeat billing)
// =====================================================================
function itemsEditor(host, services, initial) {
  let rows = initial.length ? initial.map((r) => ({ ...r })) : [{ description: '', qty: 1, rate: 0 }];
  let onChange = () => {};
  const draw = () => {
    host.innerHTML = `
      <div class="items">
        <div class="item item-head hide-m"><span>What are you charging for?</span><span>Qty</span><span>Price (₹)</span><span class="right">Amount</span><span></span></div>
        ${rows.map((r, i) => `<div class="item" data-i="${i}">
          <div class="desc"><input data-f="description" placeholder="e.g. LinkedIn management – October" value="${esc(r.description)}" list="svc-list">
            <textarea data-f="details" placeholder="Extra text shown under the title on the invoice (optional)" style="margin-top:6px;min-height:46px;font-size:13px">${esc(r.details || '')}</textarea></div>
          <div><input data-f="qty" type="number" min="0" step="any" value="${r.qty ?? 1}" aria-label="Quantity"></div>
          <div class="money-in"><span>₹</span><input data-f="rate" type="number" min="0" step="any" value="${rupeesStr(r.rate)}" placeholder="0" aria-label="Price"></div>
          <div class="amt">${inr(Math.round((r.qty ?? 1) * (r.rate || 0)))}</div>
          <button type="button" class="x" data-del="${i}" title="Remove" ${rows.length === 1 ? 'disabled' : ''}>×</button></div>`).join('')}
      </div>
      <datalist id="svc-list">${services.map((s) => `<option value="${esc(s.name)}">`).join('')}</datalist>
      <div class="row" style="margin-top:12px">
        ${services.length ? `<select id="addSvc" style="width:auto;max-width:260px"><option value="">+ Add from my services…</option>${services.map((s) => `<option value="${s.id}">${esc(s.name)}${s.price ? ' — ' + inr(s.price) : ''}</option>`).join('')}</select>` : ''}
        <button type="button" class="btn" id="addLine">+ Add another line</button>
      </div>`;
    $$('.item[data-i]', host).forEach((el) => {
      const i = +el.dataset.i;
      $$('input, textarea', el).forEach((inp) => inp.addEventListener('input', () => {
        const f = inp.dataset.f;
        rows[i][f] = f === 'rate' ? toPaise(inp.value) : f === 'qty' ? (inp.value === '' ? '' : parseFloat(inp.value)) : inp.value;
        if (f === 'details') return onChange();
        if (f === 'description') { // picked a saved service from the suggestion list? fill the rest in.
          const svc = services.find((s) => s.name === inp.value);
          if (svc && !rows[i].rate) { Object.assign(rows[i], { service_id: svc.id, rate: svc.price, unit: svc.unit, activity: svc.activity, details: svc.description || '' }); draw(); return; }
        }
        el.querySelector('.amt').textContent = inr(Math.round((Number(rows[i].qty) || 0) * (rows[i].rate || 0)));
        onChange();
      }));
    });
    $$('[data-del]', host).forEach((b) => b.onclick = () => { rows.splice(+b.dataset.del, 1); draw(); onChange(); });
    $('#addLine', host).onclick = () => { rows.push({ description: '', qty: 1, rate: 0 }); draw(); onChange(); };
    const sel = $('#addSvc', host);
    if (sel) sel.onchange = () => {
      const s = services.find((x) => x.id === +sel.value); if (!s) return;
      const blank = rows.length === 1 && !rows[0].description && !rows[0].rate;
      const row = { service_id: s.id, description: s.name, details: s.description || '', qty: 1, unit: s.unit, rate: s.price, activity: s.activity };
      if (blank) rows[0] = row; else rows.push(row);
      draw(); onChange();
    };
  };
  draw();
  return {
    get: () => rows.filter((r) => r.description && r.description.trim()).map((r) => ({ ...r, qty: Number(r.qty) || 0 })),
    subtotal: () => rows.reduce((a, r) => a + Math.round((Number(r.qty) || 0) * (r.rate || 0)), 0),
    onChange: (fn) => { onChange = fn; },
  };
}

// =====================================================================
// INVOICE FORM
// =====================================================================
async function pageInvoiceForm(editId, q = {}) {
  const [customers, services, signers, s, existing] = await Promise.all([api('/customers'), api('/services'), api('/signers'), loadSettings(), editId ? api(`/invoices/${editId}`) : null]);
  if (existing && existing.status !== 'draft') { location.hash = `#/invoice/${editId}`; return; }
  const inv = existing || { customer_id: +q.customer || '', issue_date: todayStr(), terms_days: s.default_terms_days, items: [], discount: 0, reference: '', notes: '', signer: '' };
  const gstRate = s.gst_enabled ? Number(s.gst_rate) : 0;

  view(`
    <div class="page-head"><div><h1>${existing ? 'Edit draft' : 'New invoice'}</h1><div class="sub">Fill in the three boxes below. Totals and due date are worked out for you.</div></div></div>
    ${!customers.length ? `<div class="notice info"><span>You need a customer first.</span><button class="btn primary" id="firstCust">Add a customer</button></div>` : ''}
    <div class="grid" style="grid-template-columns:2fr 1fr;align-items:start" id="formgrid">
      <div class="grid">
        <div class="card"><h2>1 · Who is this for?</h2>
          <div class="row" style="flex-wrap:nowrap"><select id="customer"><option value="">Choose a customer…</option>${customers.map((c) => `<option value="${c.id}" ${c.id === inv.customer_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          <button class="btn nowrap" id="newCust" type="button">+ New</button></div>
          <div class="small muted" id="custInfo" style="margin-top:8px"></div></div>
        <div class="card"><h2>2 · What are you billing for?</h2><div id="items"></div></div>
        <div class="card"><h2>3 · Dates</h2>
          <div class="cols">
            <div class="field"><label>Invoice date</label><input type="date" id="issue" value="${inv.issue_date}"></div>
            <div class="field"><label>Customer should pay within</label><div class="money-in"><input type="number" id="terms" min="0" value="${inv.terms_days}" style="padding-left:12px;padding-right:50px"><span style="left:auto;right:12px">days</span></div></div>
            <div class="field"><label>Payment due on</label><input id="dueShow" readonly style="background:var(--bg);font-weight:600"></div>
          </div>
          <details ${inv.reference || inv.period_start || inv.notes || inv.discount ? 'open' : ''}><summary>More options (reference, billing period, discount, notes)</summary>
            <div class="field"><label>Reference <span class="muted">(optional)</span></label><input id="ref" value="${esc(inv.reference)}" placeholder="e.g. LinkedIn Management – October 2026, or PO #123"></div>
            <div class="cols"><div class="field"><label>Service period from</label><input type="date" id="pstart" value="${inv.period_start || ''}"></div>
              <div class="field"><label>to</label><input type="date" id="pend" value="${inv.period_end || ''}"></div>
              <div class="field"><label>Discount (₹)</label><div class="money-in"><span>₹</span><input type="number" id="disc" min="0" step="any" value="${rupeesStr(inv.discount)}"></div></div></div>
            <div class="field"><label>Note for the customer</label><textarea id="notes" placeholder="Shown at the bottom of the invoice">${esc(inv.notes)}</textarea></div>
          </details>
        </div>
        <div class="card"><h2>4 · Who signs it?</h2>${signerPicker(signers, inv.signer)}</div>
      </div>
      <div style="position:sticky;top:20px"><div class="card"><h2>Summary</h2><div class="sumbox" id="sum"></div>
        <div style="display:grid;gap:10px;margin-top:16px">
          <button class="btn primary big" id="btnSend">✉️ Create &amp; email invoice</button>
          <button class="btn" id="btnIssue">Create invoice (don't email yet)</button>
          <button class="btn ghost" id="btnDraft">Save as draft</button>
        </div>
        <p class="small muted" style="margin-top:10px">A draft has no invoice number yet — you can change it freely.</p></div></div>
    </div>`);
  if (innerWidth < 900) $('#formgrid').style.gridTemplateColumns = '1fr';

  bindSignerPreview();
  const editor = itemsEditor($('#items'), services, inv.items || []);
  const discEl = $('#disc');
  const refresh = () => {
    const issue = $('#issue').value, terms = parseInt($('#terms').value, 10);
    $('#dueShow').value = issue && terms >= 0 ? nice(addDays(issue, terms)) : '';
    const sub = editor.subtotal(), disc = toPaise(discEl.value), tax = Math.round(((sub - disc) * gstRate) / 100);
    $('#sum').innerHTML = `<div class="line"><span>Subtotal</span><span>${inr(sub)}</span></div>
      ${disc ? `<div class="line"><span>Discount</span><span>−${inr(disc)}</span></div>` : ''}
      <div class="line"><span>${gstRate ? `GST @ ${gstRate}%` : 'GST'}</span><span>${gstRate ? inr(tax) : 'Not applicable'}</span></div>
      <div class="line total"><span>Total</span><span>${inr(sub - disc + tax)}</span></div>`;
    const c = customers.find((x) => x.id === +$('#customer').value);
    $('#custInfo').innerHTML = c ? (c.email ? `Invoice will be emailed to <b>${esc(c.email)}</b>` : `<span style="color:var(--warn)">⚠️ No email saved for this customer — you can still create the invoice and download the PDF.</span>`) : '';
  };
  editor.onChange(refresh);
  ['issue', 'terms', 'disc', 'customer'].forEach((id) => $('#' + id).addEventListener('input', refresh));
  refresh();

  const quickCustomer = () => customerModal(null, async (id) => { const list = await api('/customers'); customers.splice(0, customers.length, ...list); $('#customer').innerHTML = `<option value="">Choose a customer…</option>${list.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}`; $('#customer').value = id; refresh(); });
  $('#newCust').onclick = quickCustomer; if ($('#firstCust')) $('#firstCust').onclick = quickCustomer;

  const submit = (action) => async (e) => busy(e.currentTarget, async () => {
    const body = {
      action, customer_id: +$('#customer').value, items: editor.get(), issue_date: $('#issue').value, terms_days: parseInt($('#terms').value, 10),
      reference: $('#ref').value, period_start: $('#pstart').value || null, period_end: $('#pend').value || null, discount: toPaise(discEl.value), notes: $('#notes').value, signer: $('#signer').value,
    };
    if (!body.customer_id) throw new Error('Please choose who this invoice is for.');
    if (action !== 'draft' && !body.signer) throw new Error('Please choose who signs this invoice.');
    if (action === 'send' && !customers.find((c) => c.id === body.customer_id)?.email) throw new Error('This customer has no email address. Add one (Customers page), or use "Create invoice" and download the PDF.');
    const r = await api(existing ? `/invoices/${editId}` : '/invoices', { method: existing ? 'PUT' : 'POST', body });
    if (r.email) toast(r.email.message, r.email.ok ? 'good' : 'bad'); else toast(action === 'draft' ? 'Draft saved.' : 'Invoice created.', 'good');
    location.hash = `#/invoice/${r.id}`;
  });
  $('#btnSend').onclick = submit('send'); $('#btnIssue').onclick = submit('issue'); $('#btnDraft').onclick = submit('draft');
}

// =====================================================================
// INVOICE DETAIL
// =====================================================================
async function pageInvoice(id) {
  const [i] = await Promise.all([api(`/invoices/${id}`), loadSettings()]);
  const st = i.display_status;
  const email = i.emails[0];
  view(`
    <div class="page-head"><div><a href="#/invoices" class="small">← All invoices</a>
      <h1 style="margin-top:6px">${esc(i.number || 'Draft invoice')} ${chip(st)}</h1>
      <div class="sub">${esc(i.customer_name)}${i.reference ? ' · ' + esc(i.reference) : ''}</div></div>
      <div class="big-total">${inr(i.total)}</div></div>
    ${st === 'overdue' ? `<div class="notice bad"><span>⏰ This was due on ${nice(i.due_date)} (${Math.round((pd(todayStr()) - pd(i.due_date)) / 86400000)} days ago). ${inr(i.balance)} still to receive.</span></div>` : ''}
    ${st === 'paid' ? `<div class="notice good">✅ Fully paid. Nothing more to do.</div>` : ''}
    ${email && email.status !== 'sent' && email.kind === 'invoice' ? `<div class="notice warn"><span>✉️ The last email attempt ${email.status === 'not_set_up' ? 'was not sent because email is not set up' : 'failed'}${email.error ? ': ' + esc(email.error) : ''}.</span>${email.status === 'not_set_up' ? '<a class="btn" href="#/settings?tab=email">Set up email</a>' : ''}</div>` : ''}
    <div class="row" id="actions" style="margin-bottom:18px">
      ${i.status === 'draft' ? `<a class="btn" href="#/invoice/${id}/edit">✏️ Edit</a><button class="btn primary" id="aIssueSend">✉️ Issue &amp; email</button><button class="btn" id="aIssue">Issue only</button><button class="btn danger" id="aDelete">Delete draft</button>` : ''}
      ${i.status === 'issued' ? `<button class="btn primary" id="aSend">✉️ ${i.sent_at ? 'Email again' : 'Email invoice'}</button>${i.balance > 0 ? '<button class="btn" id="aPay">💰 Record payment</button>' : ''}` : ''}
      ${i.status !== 'void' ? `<a class="btn" href="${BASE}/api/invoices/${id}/pdf" target="_blank">⬇️ PDF</a>` : ''}
      ${i.status === 'issued' && !i.paid ? '<button class="btn danger" id="aVoid">Void</button>' : ''}
    </div>
    <div class="split">
      <div class="grid">
        <div class="card"><h3>Details</h3><dl class="kv">
          <dt>Customer</dt><dd><a href="#/customers">${esc(i.customer_name)}</a>${i.customer_email ? `<div class="small muted">${esc(i.customer_email)}</div>` : '<div class="small" style="color:var(--warn)">No email saved</div>'}</dd>
          <dt>Invoice date</dt><dd>${nice(i.issue_date)}</dd><dt>Due date</dt><dd>${nice(i.due_date)} <span class="muted">(${i.terms_days} days)</span></dd>
          ${i.period_start ? `<dt>Service period</dt><dd>${nice(i.period_start)} – ${nice(i.period_end)}</dd>` : ''}
          ${i.sent_at ? `<dt>Emailed</dt><dd>${esc(i.sent_at.slice(0, 16))} UTC</dd>` : ''}
          ${i.recurring_id ? `<dt>Created by</dt><dd><a href="#/recurring/${i.recurring_id}">Repeat billing</a></dd>` : ''}
          ${i.void_reason ? `<dt>Void reason</dt><dd>${esc(i.void_reason)}</dd>` : ''}</dl></div>
        <div class="card"><h3>Payments</h3>
          ${i.payments.length ? `<table><tbody>${i.payments.map((p) => `<tr><td>${nice(p.date)}<div class="small muted">${esc([p.method, p.reference].filter(Boolean).join(' · '))}</div></td><td class="right"><b>${inr(p.amount)}</b></td><td class="right"><button class="btn ghost danger" data-delpay="${p.id}" title="Delete this payment">✕</button></td></tr>`).join('')}</tbody></table>
            <div class="sumbox" style="margin-top:10px"><div class="line"><span>Received</span><b>${inr(i.paid)}</b></div><div class="line"><span>Still to receive</span><b>${inr(i.balance)}</b></div></div>`
            : `<p class="muted">${i.status === 'issued' ? 'No payment recorded yet.' : 'Payments can be recorded once the invoice is issued.'}</p>`}
        </div>
        ${i.emails.length ? `<div class="card"><h3>Email history</h3>${i.emails.slice(0, 5).map((e) => `<div class="small" style="margin-bottom:6px">${e.status === 'sent' ? '✅' : '⚠️'} ${esc(e.created_at.slice(0, 16))} · ${esc(e.kind)} → ${esc(e.to_addr)} <span class="muted">${e.status === 'sent' ? '' : esc(e.status.replace('_', ' '))}</span></div>`).join('')}</div>` : ''}
      </div>
      <iframe class="pdf" id="pdf" src="${BASE}/api/invoices/${id}/pdf#toolbar=0" title="Invoice preview"></iframe>
    </div>`);

  const act = (id_, fn) => { const b = $('#' + id_); if (b) b.onclick = (e) => busy(e.currentTarget, fn); };
  const done = () => route();
  act('aSend', async () => { const r = await api(`/invoices/${id}/send`, { method: 'POST', body: {} }); toast(r.message, r.ok ? 'good' : 'bad'); done(); });
  act('aIssue', async () => { const r = await api(`/invoices/${id}/issue`, { method: 'POST' }); toast(`Issued as ${r.number}.`, 'good'); done(); });
  act('aIssueSend', async () => {
    await api(`/invoices/${id}/issue`, { method: 'POST' });
    const r = await api(`/invoices/${id}/send`, { method: 'POST', body: {} }); toast(r.message, r.ok ? 'good' : 'bad'); done();
  });
  act('aDelete', async () => { if (await confirmBox('Delete this draft?', 'It has not been issued, so nothing is lost from your records.', 'Delete', true)) { await api(`/invoices/${id}`, { method: 'DELETE' }); location.hash = '#/invoices'; } });
  act('aVoid', async () => {
    modal(`<h2>Void ${esc(i.number)}?</h2><p>The number stays in your records (so numbering has no gaps), but the invoice no longer counts as money owed.</p>
      <div class="field"><label>Reason (optional)</label><input id="vr" placeholder="e.g. wrong amount, issued twice"></div><div class="actions"><button class="btn" id="cn">Cancel</button><button class="btn danger" id="ok">Void invoice</button></div>`, () => {
      $('#cn').onclick = closeModal; $('#ok').onclick = (e) => busy(e.currentTarget, async () => { await api(`/invoices/${id}/void`, { method: 'POST', body: { reason: $('#vr').value } }); closeModal(); toast('Invoice voided.'); done(); });
    });
  });
  const pay = $('#aPay'); if (pay) pay.onclick = () => paymentModal(i, done);
  $$('[data-delpay]').forEach((b) => b.onclick = async () => { if (await confirmBox('Delete this payment?', 'Use this only if it was recorded by mistake. The invoice balance goes back up.', 'Delete payment', true)) { try { await api(`/payments/${b.dataset.delpay}`, { method: 'DELETE' }); toast('Payment deleted.'); done(); } catch (e) { fail(e); } } });
}

function paymentModal(inv, done) {
  modal(`<h2>Record a payment</h2><p class="muted">For ${esc(inv.number)} · ${inr(inv.balance)} still to receive</p>
    <div class="cols"><div class="field"><label>Amount received</label><div class="money-in"><span>₹</span><input id="pa" type="number" step="any" min="0" value="${inv.balance / 100}"></div></div>
    <div class="field"><label>Date received</label><input id="pdt" type="date" value="${todayStr()}"></div></div>
    <div class="cols"><div class="field"><label>How did they pay?</label><select id="pm"><option>UPI</option><option>Bank transfer</option><option>Cash</option><option>Cheque</option><option>Card</option><option>Other</option></select></div>
    <div class="field"><label>Reference <span class="muted">(optional)</span></label><input id="pr" placeholder="Transaction ID / cheque no."></div></div>
    <div class="actions"><button class="btn" id="cn">Cancel</button><button class="btn primary" id="ok">Save payment</button></div>`, () => {
    $('#cn').onclick = closeModal;
    $('#ok').onclick = (e) => busy(e.currentTarget, async () => {
      await api(`/invoices/${inv.id}/payments`, { method: 'POST', body: { amount: $('#pa').value, date: $('#pdt').value, method: $('#pm').value, reference: $('#pr').value } });
      closeModal(); toast('Payment saved.', 'good'); done();
    });
  });
}

// =====================================================================
// CUSTOMERS
// =====================================================================
function customerModal(c, after) {
  c = c || {};
  modal(`<h2>${c.id ? 'Edit customer' : 'New customer'}</h2>
    <div class="field"><label>Name *</label><input id="cn_name" value="${esc(c.name)}" placeholder="Person or company name"></div>
    <div class="field"><label>Email</label><input id="cn_email" type="email" value="${esc(c.email)}" placeholder="Invoices will be sent here"></div>
    <div class="cols"><div class="field"><label>Phone</label><input id="cn_phone" value="${esc(c.phone)}"></div>
    <div class="field"><label>GSTIN <span class="muted">(only if they have one)</span></label><input id="cn_gstin" value="${esc(c.gstin)}"></div></div>
    <div class="field"><label>Address</label><textarea id="cn_addr" style="min-height:64px">${esc(c.address)}</textarea></div>
    <div class="actions"><button class="btn" id="cn_cancel">Cancel</button><button class="btn primary" id="cn_ok">Save customer</button></div>`, () => {
    $('#cn_name').focus(); $('#cn_cancel').onclick = closeModal;
    $('#cn_ok').onclick = (e) => busy(e.currentTarget, async () => {
      const body = { name: $('#cn_name').value, email: $('#cn_email').value, phone: $('#cn_phone').value, gstin: $('#cn_gstin').value, address: $('#cn_addr').value };
      const r = await api(c.id ? `/customers/${c.id}` : '/customers', { method: c.id ? 'PUT' : 'POST', body });
      closeModal(); toast('Customer saved.', 'good'); after && after(c.id || r.id);
    });
  });
}
async function pageCustomers(m, q) {
  let search = '';
  view(`<div class="page-head"><div><h1>Customers</h1><div class="sub">The people and companies you bill.</div></div><button class="btn primary" id="add">+ New customer</button></div>
    <input id="s" placeholder="🔍 Search customers" style="margin-bottom:14px"><div class="card flush" id="list"></div>`);
  const draw = async () => {
    const rows = await api(`/customers?q=${encodeURIComponent(search)}`);
    $('#list').innerHTML = rows.length ? `<table><thead><tr><th>Name</th><th class="hide-m">Contact</th><th class="right">Owes you</th><th></th></tr></thead><tbody>${rows.map((c) => `<tr>
      <td><b>${esc(c.name)}</b></td><td class="hide-m">${esc(c.email || '')}<div class="small muted">${esc(c.phone || '')}</div></td>
      <td class="right">${c.owed ? `<b>${inr(c.owed)}</b>` : '<span class="muted">—</span>'}</td>
      <td class="right nowrap"><a class="btn ghost" href="#/invoice/new?customer=${c.id}">Invoice</a><button class="btn ghost" data-e="${c.id}">Edit</button><button class="btn ghost danger" data-d="${c.id}">Remove</button></td></tr>`).join('')}</tbody></table>`
      : empty('👥', search ? 'No match' : 'No customers yet', search ? 'Try another name.' : 'Add the first person or company you want to bill.', search ? '' : '<button class="btn primary" id="add2">+ New customer</button>');
    $$('[data-e]').forEach((b) => b.onclick = () => customerModal(rows.find((r) => r.id === +b.dataset.e), draw));
    $$('[data-d]').forEach((b) => b.onclick = async () => {
      const c = rows.find((r) => r.id === +b.dataset.d);
      if (await confirmBox(`Remove ${c.name}?`, 'If you have invoiced them before, they are hidden (not erased) so your old invoices stay intact.', 'Remove', true)) { try { await api(`/customers/${c.id}`, { method: 'DELETE' }); draw(); } catch (e) { fail(e); } }
    });
    const a2 = $('#add2'); if (a2) a2.onclick = () => customerModal(null, draw);
  };
  $('#add').onclick = () => customerModal(null, draw);
  let tm; $('#s').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { search = e.target.value; draw(); }, 250); };
  await draw(); if (q.new) customerModal(null, draw);
}

// =====================================================================
// SERVICES
// =====================================================================
function serviceModal(s, after) {
  s = s || {};
  modal(`<h2>${s.id ? 'Edit service' : 'New service'}</h2>
    <p class="muted small">Save what you sell once, then add it to invoices with one click.</p>
    <div class="field"><label>Service name *</label><input id="sv_name" value="${esc(s.name)}" placeholder="e.g. LinkedIn Management"></div>
    <div class="field"><label>Text shown on invoice <span class="muted">(optional)</span></label><textarea id="sv_desc" placeholder="Describe what the customer gets" style="min-height:64px">${esc(s.description)}</textarea></div>
    <div class="cols"><div class="field"><label>Usual price (₹)</label><div class="money-in"><span>₹</span><input id="sv_price" type="number" step="any" min="0" value="${rupeesStr(s.price)}"></div></div>
    <div class="field"><label>Per <span class="muted">(optional)</span></label><input id="sv_unit" value="${esc(s.unit)}" placeholder="month, hour, event…"></div></div>
    <div class="field"><label>Type of work <span class="muted">(optional – used to group your reports)</span></label><input id="sv_act" value="${esc(s.activity)}" list="act-list" placeholder="e.g. Advertising, Consulting, Events"><datalist id="act-list"><option value="Advertising"><option value="Consulting"><option value="Events"></datalist></div>
    <div class="actions"><button class="btn" id="sv_cancel">Cancel</button><button class="btn primary" id="sv_ok">Save service</button></div>`, () => {
    $('#sv_name').focus(); $('#sv_cancel').onclick = closeModal;
    $('#sv_ok').onclick = (e) => busy(e.currentTarget, async () => {
      await api(s.id ? `/services/${s.id}` : '/services', { method: s.id ? 'PUT' : 'POST', body: { name: $('#sv_name').value, description: $('#sv_desc').value, price: toPaise($('#sv_price').value), unit: $('#sv_unit').value, activity: $('#sv_act').value } });
      closeModal(); toast('Service saved.', 'good'); after && after();
    });
  });
}
async function pageServices() {
  view(`<div class="page-head"><div><h1>My services</h1><div class="sub">Your price list. Optional — you can always type a custom line on an invoice.</div></div><button class="btn primary" id="add">+ New service</button></div><div class="card flush" id="list"></div>`);
  const draw = async () => {
    const rows = await api('/services');
    $('#list').innerHTML = rows.length ? `<table><thead><tr><th>Service</th><th class="hide-m">Type of work</th><th class="right">Price</th><th></th></tr></thead><tbody>${rows.map((s) => `<tr>
      <td><b>${esc(s.name)}</b><div class="small muted">${esc(s.description.slice(0, 80))}</div></td><td class="hide-m">${esc(s.activity || '—')}</td>
      <td class="right nowrap"><b>${inr(s.price)}</b>${s.unit ? `<span class="muted"> / ${esc(s.unit)}</span>` : ''}</td>
      <td class="right nowrap"><button class="btn ghost" data-e="${s.id}">Edit</button><button class="btn ghost danger" data-d="${s.id}">Remove</button></td></tr>`).join('')}</tbody></table>`
      : empty('🛠️', 'No services saved yet', 'Add things like “LinkedIn Management — ₹20,000 / month” so you never retype them.', '<button class="btn primary" id="add2">+ New service</button>');
    $$('[data-e]').forEach((b) => b.onclick = () => serviceModal(rows.find((r) => r.id === +b.dataset.e), draw));
    $$('[data-d]').forEach((b) => b.onclick = async () => { if (await confirmBox('Remove this service?', 'Old invoices are not affected.', 'Remove', true)) { await api(`/services/${b.dataset.d}`, { method: 'DELETE' }); draw(); } });
    const a2 = $('#add2'); if (a2) a2.onclick = () => serviceModal(null, draw);
  };
  $('#add').onclick = () => serviceModal(null, draw); draw();
}

// =====================================================================
// REPEAT BILLING
// =====================================================================
const EVERY = { 1: 'month', 3: '3 months', 6: '6 months', 12: 'year' };
const dayText = (d) => (d === 0 ? 'last day' : ordinal(d));
async function pageRecurring() {
  const rows = await api('/recurring');
  view(`<div class="page-head"><div><h1>Repeat billing</h1><div class="sub">Set it once. The invoice is created — and emailed — on your chosen date, every time.</div></div><a class="btn primary" href="#/recurring/new">+ Set up repeat billing</a></div>
    ${rows.length ? `<div class="grid">${rows.map((r) => `<div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><h2 style="margin-bottom:2px"><a href="#/recurring/${r.id}" style="color:var(--ink)">${esc(r.customer_name)}</a> ${r.active ? '' : '<span class="chip draft">Paused</span>'}${!r.active && !r.next_run ? ' <span class="chip paid">Finished</span>' : ''}</h2>
        <div class="muted">${inr(r.total)} every ${EVERY[r.every_months]} on the ${dayText(r.day_of_month)} · ${r.auto_send ? 'emailed automatically' : 'not emailed (you send it)'}</div>
        <div class="small" style="margin-top:6px">${r.active && r.next_run ? `Next invoice: <b>${nice(r.next_run)}</b>` : r.next_run ? `Would next run on ${nice(r.next_run)} if resumed` : 'No more invoices scheduled'}${r.last_run ? ` · last: ${nice(r.last_run)}` : ''}</div></div>
      <div class="row"><button class="btn" data-run="${r.id}" ${r.next_run ? '' : 'disabled'}>Create one now</button><button class="btn" data-tg="${r.id}">${r.active ? 'Pause' : 'Resume'}</button><a class="btn" href="#/recurring/${r.id}">Edit</a></div></div></div>`).join('')}</div>`
      : `<div class="card">${empty('🔁', 'No repeat billing yet', 'Perfect for monthly retainers. Pick a customer, an amount and a date — we do the rest.', '<a class="btn primary" href="#/recurring/new">+ Set up repeat billing</a>')}</div>`}`);
  $$('[data-tg]').forEach((b) => b.onclick = () => busy(b, async () => { await api(`/recurring/${b.dataset.tg}/toggle`, { method: 'POST' }); route(); }));
  $$('[data-run]').forEach((b) => b.onclick = async () => {
    const r = rows.find((x) => x.id === +b.dataset.run);
    if (!(await confirmBox('Create the next invoice now?', `This creates today's invoice for ${esc(r.customer_name)} (${inr(r.total)})${r.auto_send ? ' and emails it' : ''}, then moves the schedule forward.`, 'Create now'))) return;
    busy(b, async () => { const x = await api(`/recurring/${r.id}/run-now`, { method: 'POST' }); if (x.email) toast(x.email.message, x.email.ok ? 'good' : 'bad'); location.hash = `#/invoice/${x.invoiceId}`; });
  });
}

async function pageRecurringForm(editId, q = {}) {
  const [customers, services, signers, s, ex] = await Promise.all([api('/customers'), api('/services'), api('/signers'), loadSettings(), editId ? api('/recurring').then((l) => l.find((x) => x.id === editId)) : null]);
  const r = ex || { customer_id: +q.customer || '', items: [], every_months: 1, day_of_month: 30, start_date: todayStr(), end_date: '', terms_days: s.default_terms_days, reference: '', period_mode: 'this', auto_send: 1, signer: '' };
  const dayOpts = [...Array.from({ length: 31 }, (_, i) => i + 1), 0].map((d) => `<option value="${d}" ${d === r.day_of_month ? 'selected' : ''}>${d === 0 ? 'Last day of the month' : ordinal(d)}</option>`).join('');
  view(`<div class="page-head"><div><a href="#/recurring" class="small">← Repeat billing</a><h1 style="margin-top:6px">${ex ? 'Edit repeat billing' : 'Set up repeat billing'}</h1></div></div>
    <div class="grid" style="max-width:820px">
      <div class="card"><h2>1 · Who and what?</h2>
        <div class="field"><select id="customer"><option value="">Choose a customer…</option>${customers.map((c) => `<option value="${c.id}" ${c.id === r.customer_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><div class="hint" id="custHint"></div></div>
        <div id="items"></div></div>
      <div class="card"><h2>2 · When?</h2>
        <div class="cols">
          <div class="field"><label>Repeat every</label><select id="every">${Object.entries(EVERY).map(([k, v]) => `<option value="${k}" ${+k === r.every_months ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field"><label>On this day</label><select id="day">${dayOpts}</select><div class="hint">Short months use their last day (e.g. 30th → 28th Feb).</div></div>
          <div class="field"><label>Starting from</label><input type="date" id="start" value="${r.start_date}"></div>
          <div class="field"><label>Stop after <span class="muted">(optional)</span></label><input type="date" id="end" value="${r.end_date || ''}"></div>
        </div>
        <div class="sentence" id="sentence"></div></div>
      <div class="card"><h2>3 · How should the invoice look?</h2>
        <div class="cols">
          <div class="field"><label>Customer should pay within</label><div class="money-in"><input type="number" id="terms" min="0" value="${r.terms_days}" style="padding-left:12px;padding-right:50px"><span style="left:auto;right:12px">days</span></div></div>
          <div class="field"><label>The invoice covers</label><select id="pmode"><option value="this" ${r.period_mode === 'this' ? 'selected' : ''}>The month of the invoice date</option><option value="next" ${r.period_mode === 'next' ? 'selected' : ''}>The month after (billed in advance)</option><option value="previous" ${r.period_mode === 'previous' ? 'selected' : ''}>The month before (billed in arrears)</option></select></div>
        </div>
        <div class="field"><label>Reference on invoice</label><input id="ref" value="${esc(r.reference)}" placeholder="{service} – {period}"><div class="hint">Leave blank for the default, e.g. “LinkedIn Management – October 2026”. You can use {service}, {period}, {month}, {year}.</div></div>
        ${signerPicker(signers, r.signer)}
        <label class="check"><input type="checkbox" id="auto" ${r.auto_send ? 'checked' : ''}> Email the invoice to the customer automatically</label>
        <div class="hint small muted" style="margin:6px 0 0 26px" id="autoHint"></div>
      </div>
      <div class="row"><button class="btn primary big" id="save">${ex ? 'Save changes' : 'Start repeat billing'}</button><a class="btn" href="#/recurring">Cancel</a>
        ${ex ? '<button class="btn danger" id="del" style="margin-left:auto">Delete schedule</button>' : ''}</div>
    </div>`);

  bindSignerPreview();
  const editor = itemsEditor($('#items'), services, r.items);
  const firstRun = () => {
    const start = $('#start').value; if (!start) return ''; const day = +$('#day').value, every = +$('#every').value;
    const sd = pd(start); const mk = (add) => { const d = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth() + add, 1)); const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(day === 0 ? last : Math.min(day, last)); return fd(d); };
    let c = mk(0); if (c < start) c = mk(every); return c;
  };
  const refresh = () => {
    const c = customers.find((x) => x.id === +$('#customer').value);
    const total = editor.subtotal(), fr = firstRun();
    $('#sentence').innerHTML = `${total ? inr(total) : 'The invoice'} will be billed${c ? ' to <b>' + esc(c.name) + '</b>' : ''} every <b>${EVERY[$('#every').value]}</b> on the <b>${dayText(+$('#day').value)}</b>${$('#auto').checked ? ' and emailed automatically' : ''}.${fr ? ` First invoice: <b>${niceLong(fr)}</b>.` : ''}`;
    $('#custHint').innerHTML = c && !c.email ? '<span style="color:var(--warn)">⚠️ This customer has no email saved, so automatic emails cannot be sent.</span>' : '';
    $('#autoHint').textContent = $('#auto').checked && !s.smtp_host ? 'Email is not connected yet — go to Settings → Email. Invoices will still be created on time.' : '';
  };
  editor.onChange(refresh); ['customer', 'every', 'day', 'start', 'end', 'auto'].forEach((id) => $('#' + id).addEventListener('input', refresh)); refresh();

  $('#save').onclick = (e) => busy(e.currentTarget, async () => {
    const body = { customer_id: +$('#customer').value, items: editor.get(), every_months: +$('#every').value, day_of_month: +$('#day').value, start_date: $('#start').value,
      end_date: $('#end').value || null, terms_days: parseInt($('#terms').value, 10), period_mode: $('#pmode').value, reference: $('#ref').value, auto_send: $('#auto').checked, signer: $('#signer').value };
    if (!body.signer) throw new Error('Please choose who signs these invoices.');
    await api(ex ? `/recurring/${editId}` : '/recurring', { method: ex ? 'PUT' : 'POST', body });
    toast('Repeat billing saved.', 'good'); location.hash = '#/recurring';
  });
  const del = $('#del'); if (del) del.onclick = async () => { if (await confirmBox('Delete this schedule?', 'No more invoices will be created. Invoices already made are kept.', 'Delete', true)) { await api(`/recurring/${editId}`, { method: 'DELETE' }); location.hash = '#/recurring'; } };
}

// =====================================================================
// REPORTS
// =====================================================================
async function pageReports() {
  const y = new Date().getFullYear(), m = new Date().getMonth() + 1; const fyStart = m >= 4 ? y : y - 1;
  let from = `${fyStart}-04-01`, to = `${fyStart + 1}-03-31`;
  view(`<div class="page-head"><div><h1>Reports</h1><div class="sub">How much you have invoiced, and from whom.</div></div>
    <div class="row"><a class="btn" href="${BASE}/api/export/invoices.csv">⬇️ Invoices (Excel/CSV)</a><a class="btn" href="${BASE}/api/export/payments.csv">⬇️ Payments (CSV)</a></div></div>
    <div class="row" style="margin-bottom:16px"><div><label>From</label><input type="date" id="from" value="${from}"></div><div><label>To</label><input type="date" id="to" value="${to}"></div></div>
    <p class="small muted">Share the two downloads with your CA — they contain everything needed for your books.</p><div id="out"></div>`);
  const bars = (rows, total) => rows.length ? rows.map((r) => `<div class="barrow"><span>${esc(r.label)}</span><div class="bar-wrap"><div class="bar" style="width:${Math.max(2, (r.amount / (rows[0].amount || 1)) * 100)}%"></div></div><b class="right">${inr(r.amount)}</b></div>`).join('') : '<p class="muted">No data for this period.</p>';
  const draw = async () => {
    from = $('#from').value; to = $('#to').value;
    const d = await api(`/reports/revenue?from=${from}&to=${to}`);
    $('#out').innerHTML = `<div class="card" style="margin-bottom:16px"><div class="muted small">Total invoiced (before tax)</div><div class="big-total">${inr(d.total)}</div></div>
      <div class="grid g2"><div class="card"><h2>By type of work</h2>${bars(d.byActivity)}</div><div class="card"><h2>By customer</h2>${bars(d.byCustomer)}</div></div>
      <div class="card" style="margin-top:16px"><h2>By month</h2>${bars(d.byMonth.map((x) => ({ ...x, label: MONTHS_LONG[+x.label.slice(5) - 1] + ' ' + x.label.slice(0, 4) })))}</div>`;
  };
  $('#from').onchange = draw; $('#to').onchange = draw; draw();
}

// =====================================================================
// SETTINGS
// =====================================================================
async function pageSettings(m, q) {
  const s = await loadSettings(); let tab = q.tab || 'business'; const pending = {};
  const field = (k, label, { type = 'text', hint = '', ph = '', area = false } = {}) =>
    `<div class="field"><label>${label}</label>${area ? `<textarea data-k="${k}" placeholder="${esc(ph)}">${esc(s[k])}</textarea>` : `<input data-k="${k}" type="${type}" value="${esc(s[k])}" placeholder="${esc(ph)}">`}${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
  const check = (k, label) => `<label class="check"><input type="checkbox" data-k="${k}" ${s[k] ? 'checked' : ''}> ${label}</label>`;
  const fyNow = (() => { const d = new Date(), y = d.getFullYear(), st = d.getMonth() >= 3 ? y : y - 1; return `${pad2(st % 100)}-${pad2((st + 1) % 100)}`; })();
  const panes = {
    business: () => `<h2>Your business</h2><p class="muted">These appear at the top of every invoice.</p>
      ${field('business_name', 'Business name')}${field('business_address', 'Address', { area: true })}
      <div class="cols">${field('business_email', 'Email')}${field('business_phone', 'Phone')}${field('business_pan', 'PAN', { hint: 'Optional' })}${field('business_llpin', 'LLPIN / registration no.', { hint: 'Optional' })}</div>
      ${field('payment_details', 'How customers should pay you', { area: true, ph: 'e.g. UPI: name@bank\nAccount: ..., IFSC: ...', hint: 'Shown on invoices and in emails. Type your real details only.' })}
      <div class="cols">${field('business_website', 'Website (invoice footer)')}${field('business_tagline', 'Tagline (invoice footer)')}</div>
      ${field('invoice_thanks', 'Thank-you message', { area: true, hint: 'Printed next to the signature.' })}
      ${field('invoice_terms', 'Terms & conditions', { area: true, hint: 'One point per line. You can use {terms_days}, {business_email} and {business_phone}. The signature is chosen on each invoice.' })}`,
    invoicing: () => `<h2>Invoice numbers &amp; payment time</h2>
      <div class="cols">${field('invoice_prefix', 'Invoice prefix', { hint: 'Letters/numbers only.' })}${field('invoice_pad', 'Number length', { type: 'number', hint: '3 → 001, 002…' })}${field('default_terms_days', 'Usual payment time (days)', { type: 'number' })}</div>
      <div class="sentence" id="numEx"></div>
      <p class="small muted" style="margin-top:10px">Numbers go up by one automatically, restart at 001 each financial year (April–March), and are never reused — even if you void an invoice.</p>`,
    tax: () => `<h2>Tax (GST)</h2>
      <div class="notice info" style="display:block">Leave this <b>off</b> if you are not registered for GST. Invoices will then say GST is not applicable and will not be called “Tax Invoice”. If you register later, ask your CA for the right rate and wording first.</div>
      ${check('gst_enabled', 'I am registered for GST — add GST to my invoices')}
      <div style="margin-top:14px">${field('gst_rate', 'GST rate (%)', { type: 'number', hint: 'One simple rate on the whole invoice. Detailed splits (CGST/SGST/IGST) are not included.' })}${field('business_gstin', 'Your GSTIN')}</div>
      ${field('gst_note', 'Note printed when GST is off', { area: true })}`,
    team: () => '<h2>Team</h2><p class="muted">Loading…</p>',
    email: () => `<h2>Send invoices by email</h2>
      <div class="notice info" style="display:block"><b>Quick help:</b> For Gmail use server <code>smtp.gmail.com</code>, port <code>587</code>, your Gmail address, and an <b>App Password</b> (Google Account → Security → 2-Step Verification → App passwords). For Outlook use <code>smtp.office365.com</code>, port 587. Zoho/GoDaddy/Hostinger give you these details in their email settings.</div>
      <div class="cols">${field('smtp_host', 'Mail server', { ph: 'smtp.gmail.com' })}${field('smtp_port', 'Port', { type: 'number' })}${field('smtp_user', 'Email address / username')}${field('smtp_pass', 'Password / App password', { type: 'password' })}</div>
      <div class="cols">${field('from_name', 'Sender name', { ph: s.business_name })}${field('from_email', 'Sender email', { ph: 'Same as username', hint: 'Must be allowed by your mail provider.' })}</div>
      ${check('smtp_secure', 'Use secure connection on port 465 (leave off for 587)')}
      <div class="row" style="margin-top:16px"><input id="testTo" placeholder="Send a test to…" style="max-width:260px" value="${esc(s.business_email)}"><button class="btn" id="testBtn">Send test email</button></div>
      <hr style="border:none;border-top:1px solid var(--line);margin:22px 0">
      <h2>Email wording</h2><p class="small muted">You can use: {customer_name} {invoice_number} {amount} {due_date} {reference} {business_name} {payment_details}</p>
      ${field('email_subject', 'Subject')}${field('email_body', 'Message', { area: true })}
      ${check('reminders_enabled', 'Send polite payment reminders automatically (3 days before, on the due date, and 7 days late)')}
      <details style="margin-top:12px"><summary>Reminder wording</summary>${field('reminder_subject', 'Subject')}${field('reminder_body', 'Message', { area: true })}</details>
      <p style="margin-top:14px"><a href="#" id="hist">View email history</a></p>`,
  };
  const names = { business: 'Business', invoicing: 'Invoice numbers', tax: 'Tax', email: 'Email', team: 'Team' };
  const draw = () => {
    view(`<div class="page-head"><div><h1>Settings</h1><div class="sub">Set up once, then forget about it.</div></div></div>
      <div class="tabs">${Object.entries(names).map(([k, l]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="card" style="max-width:780px">${panes[tab]()}${tab === 'team' ? '' : '<div class="row" style="margin-top:18px"><button class="btn primary" id="save">Save changes</button></div>'}</div>`);
    $$('.tabs button').forEach((b) => b.onclick = () => { collect(); tab = b.dataset.t; draw(); });
    if (tab === 'team') { drawTeam($('.card')); return; }
    $('#save').onclick = (e) => busy(e.currentTarget, async () => { Object.assign(s, await api('/settings', { method: 'PUT', body: collect() })); await loadSettings(); toast('Saved.', 'good'); draw(); });
    const ex = $('#numEx'), upd = () => { if (ex) { collect(); ex.innerHTML = `Your invoices will be numbered like <b>${esc(s.invoice_prefix)}/${fyNow}/${String(1).padStart(+s.invoice_pad || 3, '0')}</b>`; } };
    $$('[data-k]').forEach((el) => el.addEventListener('input', upd)); upd();
    const tb = $('#testBtn'); if (tb) tb.onclick = (e) => busy(e.currentTarget, async () => { Object.assign(s, await api('/settings', { method: 'PUT', body: collect() })); const r = await api('/settings/test-email', { method: 'POST', body: { to: $('#testTo').value } }); toast(r.message, r.ok ? 'good' : 'bad'); });
    const h = $('#hist'); if (h) h.onclick = async (ev) => {
      ev.preventDefault(); const rows = await api('/emails');
      modal(`<h2>Email history</h2>${rows.length ? `<table><tbody>${rows.slice(0, 30).map((r) => `<tr><td>${r.status === 'sent' ? '✅' : '⚠️'}</td><td>${esc(r.to_addr)}<div class="small muted">${esc(r.subject)}</div>${r.error ? `<div class="small" style="color:var(--bad)">${esc(r.error)}</div>` : ''}</td><td class="small muted">${esc(r.created_at.slice(0, 16))}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nothing sent yet.</p>'}<div class="actions"><button class="btn" id="cn">Close</button></div>`, () => $('#cn').onclick = closeModal);
    };
  };
  function collect() {
    $$('[data-k]').forEach((el) => { pending[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; s[el.dataset.k] = pending[el.dataset.k]; });
    return { ...pending };
  }
  draw();
}

// =====================================================================
// SIGN IN, ACCOUNT & TEAM
// =====================================================================
let ME = null, GOOGLE_ON = false;
const ROLE_LABEL = { super_admin: 'Super admin — can do everything', ca: 'CA — reports & CSV exports only' };

function showAuth(_unused = false, google = GOOGLE_ON) {
  GOOGLE_ON = google;
  ME = null; document.body.classList.add('authing');
  const box = $('#auth'); box.hidden = false;
  box.innerHTML = `<div class="card"><div class="logo">₹</div>
    <h1>Sign in</h1>
    <p class="muted">Sign in with the Google account you were invited with.</p>
    ${google ? `<a class="btn primary big" href="${BASE}/api/auth/google" style="width:100%;gap:10px"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.4-4.8 7.1l7.6 5.9c4.4-4.1 7-10.1 7-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.600 2.600 10.800l7.900-6.100z"/><path fill="#34A853" d="M24 48c6.300 0 11.600-2.100 15.500-5.700l-7.600-5.900c-2.100 1.400-4.800 2.300-7.900 2.300-6.300 0-11.600-4-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/></svg> Continue with Google</a>` : '<div class="notice bad">Google sign-in is not set up on this server yet.</div>'}
    <div class="notice bad" id="aerr" hidden style="margin-top:14px"></div></div>`;
  const le = new URLSearchParams(location.search).get('login_error');
  if (le) { $('#aerr').hidden = false; $('#aerr').textContent = le; history.replaceState(null, '', location.pathname + location.hash); }
}

async function enter(user) {
  ME = user; document.body.classList.remove('authing'); $('#auth').hidden = true;
  const isCA = user.role === 'ca';
  $$('#nav a').forEach((a) => { a.hidden = isCA && a.dataset.p !== 'reports'; });
  $('.side .new').hidden = isCA;
  $('#acct').innerHTML = `<div class="who">${esc(user.name)}</div><div class="role">${user.role === 'super_admin' ? 'Super admin' : 'CA (view reports)'}</div>
    <div class="row" style="gap:6px"><button class="btn" id="logout">Sign out</button></div>`;
  $('#logout').onclick = async () => { await api('/auth/logout', { method: 'POST' }); location.hash = '#/'; showAuth(); };
  try { await loadSettings(); } catch { /* not fatal */ }
  if (isCA && !location.hash.startsWith('#/reports')) location.hash = '#/reports';
  route();
}

function userModal(u, after) {
  u = u || {};
  modal(`<h2>${u.id ? 'Edit ' + esc(u.name) : 'Add a team member'}</h2>
    <div class="field"><label>Name</label><input id="un" value="${esc(u.name)}"></div>
    <div class="field"><label>Email (they sign in with this)</label><input id="ue" type="email" value="${esc(u.email)}" ${u.id ? 'disabled' : ''}></div>
    <div class="field"><label>What can they do?</label><select id="ur">${Object.entries(ROLE_LABEL).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    ${u.id ? `<label class="check"><input type="checkbox" id="ua" ${u.active ? 'checked' : ''}> Account is active (untick to block sign-in)</label>` : ''}
    <div class="actions"><button class="btn" id="cn">Cancel</button><button class="btn primary" id="ok">Save</button></div>`, () => {
    $('#cn').onclick = closeModal;
    $('#ok').onclick = (e) => busy(e.currentTarget, async () => {
      const body = { name: $('#un').value, role: $('#ur').value };
      if (u.id) body.active = $('#ua').checked; else { body.email = $('#ue').value; }
      await api(u.id ? `/users/${u.id}` : '/users', { method: u.id ? 'PUT' : 'POST', body });
      closeModal(); toast('Saved.', 'good'); after();
    });
  });
}
async function drawTeam(card) {
  const users = await api('/users');
  card.innerHTML = `<div class="row" style="justify-content:space-between"><h2 style="margin:0">Team</h2><button class="btn primary" id="addu">+ Add team member</button></div>
    <p class="muted small" style="margin-top:6px"><b>Admin</b> can do everything. <b>CA</b> can only open Reports and download CSV exports.</p>
    <table><tbody>${users.map((u) => `<tr><td><b>${esc(u.name)}</b>${u.id === ME.id ? ' <span class="muted">(you)</span>' : ''}<div class="small muted">${esc(u.email)}</div></td>
      <td>${u.role === 'super_admin' ? '<span class="chip unpaid">Super admin</span>' : '<span class="chip warn">CA</span>'} ${u.active ? '' : '<span class="chip draft">Blocked</span>'}</td>
      <td class="right"><button class="btn ghost" data-u="${u.id}">Edit</button></td></tr>`).join('')}</tbody></table>`;
  $('#addu').onclick = () => userModal(null, () => drawTeam(card));
  $$('[data-u]', card).forEach((b) => b.onclick = () => userModal(users.find((x) => x.id === +b.dataset.u), () => drawTeam(card)));
}

// ---------- boot ----------
(async () => {
  try {
    const r = await api('/auth/me');
    GOOGLE_ON = !!r.google;
    if (r.user) await enter(r.user); else showAuth(false, r.google);
  } catch (e) { document.body.innerHTML = `<div class="notice bad" style="margin:30px">${esc(e.message)}</div>`; }
})();
