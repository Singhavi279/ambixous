const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { parseDate, SIGNERS } = require('./lib');

// cwd-based so fonts/images still resolve when the code is bundled into the Next.js build.
const cwd = process.cwd();
const pkgDir = (pkg) => [path.join(cwd, 'node_modules'), path.join(cwd, '..', 'node_modules'), path.join(__dirname, '..', '..', 'node_modules')]
  .map((d) => path.join(d, '@fontsource', pkg, 'files')).find((d) => fs.existsSync(d)) || path.join(cwd, 'node_modules', '@fontsource', pkg, 'files');
const FONT_DIR = pkgDir('noto-sans');
const SCRIPT_DIR = pkgDir('dancing-script');
const ASSET_DIRS = [path.join(cwd, 'invoxa', 'server', 'assets'), path.join(cwd, 'server', 'assets'), path.join(__dirname, 'assets')];
const asset = (name) => ASSET_DIRS.map((d) => path.join(d, name)).find((p) => fs.existsSync(p));
const F = {
  reg: path.join(FONT_DIR, 'noto-sans-latin-400-normal.woff'),
  bold: path.join(FONT_DIR, 'noto-sans-latin-700-normal.woff'),
  rupee: path.join(FONT_DIR, 'noto-sans-latin-ext-400-normal.woff'),
  rupeeBold: path.join(FONT_DIR, 'noto-sans-latin-ext-700-normal.woff'),
  script: path.join(SCRIPT_DIR, 'dancing-script-latin-700-normal.woff'),
};

const NAVY = '#0b1f4d', TEXT = '#1f2a44', GREY = '#5b667a', LINE = '#c9d3e6', SOFT = '#eef3fb', SOFT2 = '#e1ebfa', BORDER = '#d3deef', ACCENT = '#2f5bea';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const shortDate = (s) => { const d = parseDate(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const rangeShort = (a, b) => (a.slice(0, 4) === b.slice(0, 4) ? `${dayMon(a)} – ${shortDate(b)}` : `${shortDate(a)} – ${shortDate(b)}`);
const monthLabel = (a, b) => {
  const x = parseDate(a), y = parseDate(b);
  const same = x.getUTCFullYear() === y.getUTCFullYear();
  if (same && x.getUTCMonth() === y.getUTCMonth()) return `${MON[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  return same ? `${MON[x.getUTCMonth()]} – ${MON[y.getUTCMonth()]} ${x.getUTCFullYear()}` : `${MON[x.getUTCMonth()]} ${x.getUTCFullYear()} – ${MON[y.getUTCMonth()]} ${y.getUTCFullYear()}`;
};
const dayMon = (s) => { const d = parseDate(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };

// 2500000 paise -> "25,000.00" (Indian digit grouping, always two decimals)
function num2(paise) {
  const neg = paise < 0, p = Math.abs(paise);
  const r = String(Math.floor(p / 100)), f = String(p % 100).padStart(2, '0');
  const last3 = r.slice(-3), rest = r.slice(0, -3);
  return `${neg ? '-' : ''}${rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3}.${f}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function below100(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
function below1000(n) { return (n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? below100(n % 100) : ''); }
function wordsIndian(n) {
  if (n === 0) return 'Zero';
  const parts = [];
  for (const [div, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']]) {
    if (n >= div) { parts.push(below1000(Math.floor(n / div)) + ' ' + name); n %= div; }
  }
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}
const rupeesInWords = (paise) => {
  const r = Math.floor(paise / 100), p = paise % 100;
  return `Rupees ${wordsIndian(r)}${p ? ` and ${below100(p)} Paise` : ''} Only`;
};

// Builds an A4 invoice PDF and resolves with a Buffer.
function invoicePdf(inv, s) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Invoice ${inv.number || 'Draft'}`, Author: s.business_name } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    for (const [k, v] of Object.entries(F)) doc.registerFont(k, v);

    const PW = doc.page.width, PH = doc.page.height;
    const L = 42, R = PW - 42, W = R - L;

    const t = (str, x, y, o = {}) => {
      doc.fillColor(o.color || TEXT).font(o.font || (o.bold ? 'bold' : 'reg')).fontSize(o.size || 9.5);
      doc.text(str, x, y, { width: o.width, align: o.align, lineBreak: o.width !== undefined, lineGap: o.gap ?? 1.5, characterSpacing: o.spacing || 0 });
    };
    const h = (str, width, o = {}) => doc.font(o.bold ? 'bold' : 'reg').fontSize(o.size || 9.5).heightOfString(str, { width, lineGap: o.gap ?? 1.5 });
    const box = (x, y, w, hh, fill = SOFT, stroke = BORDER, r = 6) => {
      doc.roundedRect(x, y, w, hh, r).fillAndStroke(fill, stroke);
    };
    const hline = (y, x1 = L, x2 = R, color = LINE, w = 0.8) => doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(w).stroke();
    // Amount with the rupee sign, right-aligned at x=right.
    const money = (paise, right, y, { bold = false, size = 10, color = TEXT } = {}) => {
      const txt = num2(paise);
      doc.fillColor(color).font(bold ? 'bold' : 'reg').fontSize(size);
      const w = doc.widthOfString(txt);
      doc.text(txt, right - w, y, { lineBreak: false });
      doc.font(bold ? 'rupeeBold' : 'rupee').fontSize(size);
      doc.text('₹', right - w - doc.widthOfString('₹') - 1, y, { lineBreak: false });
    };

    // ---------------- header ----------------
    const logo = asset('logo.png');
    if (logo) doc.image(logo, L, 36, { width: 168 });
    const cap = 'INNOVATIONS LLP';
    doc.font('bold').fontSize(7.5);
    const capSpacing = (164 - doc.widthOfString(cap)) / (cap.length - 1);
    t(cap, L + 2, 36 + 168 * 202 / 859 + 7, { size: 7.5, bold: true, color: NAVY, spacing: capSpacing });

    const rx = 340, rw = R - rx;
    let ry = 38;
    t(s.business_name, rx, ry, { bold: true, size: 11.5, color: NAVY, width: rw }); ry += 17;
    for (const line of [s.business_llpin && `LLPIN: ${s.business_llpin}`, s.business_pan && `PAN: ${s.business_pan}`, s.gst_enabled && s.business_gstin && `GSTIN: ${s.business_gstin}`].filter(Boolean)) {
      t(line, rx, ry, { size: 9, width: rw }); ry += 13;
    }
    const addr = String(s.business_address || '').replace(new RegExp('^' + s.business_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',?\\s*', 'i'), '').trim();
    if (addr) { ry += 3; t(addr, rx, ry, { size: 9, width: rw, color: TEXT, gap: 2 }); ry += h(addr, rw, { size: 9, gap: 2 }); }
    let y = Math.max(ry, 36 + 168 * 202 / 859 + 22) + 6;
    hline(y);

    // ---------------- title, bill to, meta ----------------
    y += 18;
    const top = y;
    t(inv.status === 'draft' ? 'DRAFT INVOICE' : (s.gst_enabled ? 'TAX INVOICE' : 'INVOICE'), L, y, { bold: true, size: 28, color: NAVY });
    t('For Services Rendered', L, y + 34, { size: 11.5, color: TEXT });
    if (inv.status === 'void') t('VOID', L + 190, y + 8, { bold: true, size: 16, color: '#b42318' });

    let by = y + 62;
    t('Bill To', L, by, { bold: true, size: 10.5, color: NAVY }); by += 17;
    t(inv.customer_name, L, by, { bold: true, size: 12.5, color: NAVY, width: 260 }); by += h(inv.customer_name, 260, { bold: true, size: 12.5 }) + 4;
    // Customer email is intentionally never printed on the invoice.
    const custLines = [inv.customer_address, inv.customer_gstin && `GSTIN: ${inv.customer_gstin}`, inv.customer_phone && `Phone: ${inv.customer_phone}`].filter(Boolean);
    for (const c of custLines) { t(c, L, by, { size: 9.5, width: 260, gap: 2 }); by += h(c, 260, { size: 9.5, gap: 2 }) + 3; }

    const mx = 322, mw = R - mx, lw = 88;
    const meta = [['Invoice No.', inv.number || 'Not issued yet'], ['Invoice Date', shortDate(inv.issue_date)],
      ['Due Date', shortDate(inv.due_date), inv.terms_days > 0 ? `(${inv.terms_days} Calendar Days)` : '(Due on receipt)'],
      ['Payment Terms', inv.terms_days === 0 ? 'Due on receipt' : `${inv.terms_days} Calendar Days`]];
    if (inv.reference) meta.push(['Reference', inv.reference]);
    if (inv.period_start && inv.period_end) meta.push(['Service Period', rangeShort(inv.period_start, inv.period_end)]);
    const vw = mw - lw - 28;
    const rowH = meta.map(([, v, sub]) => Math.max(24, h(v, vw, { size: 9.5 }) + (sub ? 12 : 0) + 12));
    const mh = rowH.reduce((a, b) => a + b, 0);
    box(mx, top - 4, mw, mh + 4);
    let my = top;
    meta.forEach(([k, v, sub], i) => {
      t(k, mx + 14, my + 6, { bold: true, size: 9, color: NAVY });
      t(v, mx + 14 + lw, my + 6, { size: 9.5, width: vw });
      if (sub) t(sub, mx + 14 + lw, my + 6 + h(v, vw, { size: 9.5 }) + 1, { size: 8.5, color: ACCENT });
      my += rowH[i];
      if (i < meta.length - 1) hline(my - 1, mx + 12, mx + mw - 12, BORDER, 0.6);
    });
    y = Math.max(by, top - 4 + mh + 4) + 16;

    // ---------------- items table ----------------
    const cols = [{ k: 'n', w: 28 }, { k: 'd', w: 216 }, { k: 'p', w: 74 }, { k: 'q', w: 38 }, { k: 'r', w: 70 }, { k: 'a', w: W - 28 - 216 - 74 - 38 - 70 }];
    let cx = L; for (const c of cols) { c.x = cx; cx += c.w; }
    const colOf = (k) => cols.find((c) => c.k === k);
    const header = () => {
      doc.roundedRect(L, y, W, 26, 5).fill(NAVY);
      const hd = (k, txt, align) => t(txt, colOf(k).x + 6, y + 8.5, { bold: true, size: 8.5, color: '#fff', width: colOf(k).w - 12, align });
      hd('n', '#', 'center'); hd('d', 'Description'); hd('p', 'Period', 'center'); hd('q', 'Qty', 'center'); hd('r', 'Rate (INR)', 'right'); hd('a', 'Amount (INR)', 'right');
      y += 26;
    };
    header();
    const hasPeriod = inv.period_start && inv.period_end;
    inv.items.forEach((it, i) => {
      const dw = colOf('d').w - 18;
      const titleH = h(it.description, dw, { bold: true, size: 10 });
      const detH = it.details ? h(it.details, dw, { size: 8.8, gap: 2 }) + 3 : 0;
      const rh = Math.max(44, titleH + detH + 20);
      if (y + rh > PH - 250) { doc.addPage(); y = 50; header(); }
      doc.rect(L, y, W, rh).fill('#fff');
      const cy = y + 11;
      t(String(i + 1), colOf('n').x, cy, { bold: true, size: 9.5, width: colOf('n').w, align: 'center' });
      t(it.description, colOf('d').x + 9, cy, { bold: true, size: 10, color: NAVY, width: dw });
      if (it.details) t(it.details, colOf('d').x + 9, cy + titleH + 3, { size: 8.8, color: TEXT, width: dw, gap: 2 });
      if (hasPeriod) {
        const pw = colOf('p').w - 12;
        t(monthLabel(inv.period_start, inv.period_end), colOf('p').x + 6, cy, { bold: true, size: 9, width: pw, align: 'center' });
        t(`(${dayMon(inv.period_start)} – ${dayMon(inv.period_end)})`, colOf('p').x + 6, cy + 13, { size: 7.8, color: GREY, width: pw, align: 'center' });
      } else t('—', colOf('p').x, cy, { size: 9.5, color: GREY, width: colOf('p').w, align: 'center' });
      t(String(it.qty), colOf('q').x, cy, { size: 9.5, width: colOf('q').w, align: 'center' });
      if (it.unit) t(it.unit, colOf('q').x, cy + 13, { size: 7.8, color: GREY, width: colOf('q').w, align: 'center' });
      t(num2(it.rate), colOf('r').x + 4, cy, { size: 9.5, width: colOf('r').w - 12, align: 'right' });
      t(num2(it.amount), colOf('a').x + 4, cy, { bold: true, size: 9.5, width: colOf('a').w - 14, align: 'right' });
      // light grid like the reference
      for (const c of cols.slice(1)) doc.moveTo(c.x, y).lineTo(c.x, y + rh).strokeColor(BORDER).lineWidth(0.6).stroke();
      doc.moveTo(L, y).lineTo(L, y + rh).moveTo(R, y).lineTo(R, y + rh).strokeColor(BORDER).lineWidth(0.6).stroke();
      y += rh;
      hline(y, L, R, BORDER, 0.6);
    });
    y += 18;

    // ---------------- payment details (left) + totals (right) ----------------
    if (y > PH - (inv.show_upi && s.upi_id ? 440 : 330)) { doc.addPage(); y = 50; }
    const lx = L, lwid = 262, tx = 322, twid = R - tx;
    let ly = y, ty = y;

    if (s.payment_details) {
      t('Payment Details', lx, ly, { bold: true, size: 12, color: NAVY }); ly += 20;
      const rows = String(s.payment_details || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = l.match(/^([^:]{1,30}):\s*(.+)$/);
        return m ? { k: m[1], v: m[2] } : { v: l };
      });
      const keyW = 78, valW = lwid - 24 - keyW;
      const ph = 38 + rows.reduce((a, r) => a + Math.max(14, h(r.v, r.k ? valW : lwid - 24, { size: 9 }) + 3), 0);
      box(lx, ly, lwid, ph);
      t('Bank Transfer', lx + 14, ly + 13, { bold: true, size: 10, color: NAVY });
      let py = ly + 32;
      for (const r of rows) {
        if (r.k) { t(r.k, lx + 14, py, { size: 8.6, color: GREY }); t(r.v, lx + 14 + keyW, py, { size: 9, width: valW }); }
        else t(r.v, lx + 14, py, { size: 9, width: lwid - 28 });
        py += Math.max(14, h(r.v, r.k ? valW : lwid - 28, { size: 9 }) + 3);
      }
      ly += ph;
    }

    // optional UPI QR card (only when chosen on the invoice)
    const qr = inv.show_upi && s.upi_id && asset('upi-qr.png');
    if (qr) {
      if (s.payment_details) ly += 10; else { t('Payment Details', lx, ly, { bold: true, size: 12, color: NAVY }); ly += 20; }
      const qh = 112;
      box(lx, ly, lwid, qh);
      doc.image(qr, lx + 12, ly + 12, { fit: [88, 88] });
      t('Scan & Pay', lx + 114, ly + 24, { bold: true, size: 11, color: NAVY });
      t('Pay by any UPI app', lx + 114, ly + 41, { size: 8.6, color: GREY, width: lwid - 126 });
      t('UPI ID', lx + 114, ly + 62, { size: 8.2, color: GREY });
      t(s.upi_id, lx + 114, ly + 74, { bold: true, size: 7.8, width: lwid - 118 });
      ly += qh;
    }

    // totals card
    const lines = [['Subtotal', inv.subtotal]];
    if (inv.discount) lines.push(['Discount', -inv.discount]);
    const gstOn = s.gst_enabled || inv.tax_rate > 0;
    if (gstOn) lines.push([`GST @ ${inv.tax_rate}%`, inv.tax]); else lines.push(['GST', null]);
    const topH = lines.length * 26 + 6;
    const totH = 58;
    const recvH = inv.status === 'issued' && inv.paid > 0 ? 50 : 0;
    box(tx, ty, twid, topH + totH + recvH);
    let r0 = ty + 10;
    for (const [label, val] of lines) {
      t(label, tx + 16, r0 + 2, { bold: true, size: 9.5, color: NAVY });
      if (val === null) { t('Not Applicable', tx + 62, r0 + 2.5, { size: 9, color: GREY }); t('—', tx + 16, r0 + 2.5, { size: 9.5, color: GREY, width: twid - 32, align: 'right' }); }
      else money(val, tx + twid - 16, r0 + 1.5, { size: 9.5 });
      r0 += 26;
    }
    doc.roundedRect(tx + 1, ty + topH, twid - 2, totH, 5).fill(SOFT2);
    t('Total Payable', tx + 16, ty + topH + 13, { bold: true, size: 12, color: NAVY });
    money(inv.total, tx + twid - 16, ty + topH + 11, { bold: true, size: 16, color: NAVY });
    t(`(${rupeesInWords(inv.total)})`, tx + 16, ty + topH + 37, { size: 8.5, color: GREY, width: twid - 32 });
    if (recvH) {
      const ry2 = ty + topH + totH + 9;
      t('Received', tx + 16, ry2, { size: 9.5, color: GREY }); money(inv.paid, tx + twid - 16, ry2, { size: 9.5 });
      t('Balance due', tx + 16, ry2 + 20, { bold: true, size: 9.5, color: NAVY }); money(inv.balance, tx + twid - 16, ry2 + 20, { bold: true, size: 10, color: NAVY });
    }
    ty += topH + totH + recvH + 10;

    // notes (GST note / customer note) as info cards
    const notes = [];
    if (!s.gst_enabled && s.gst_note) notes.push(s.gst_note);
    if (inv.notes) notes.push(inv.notes);
    for (const n of notes) {
      const nh = Math.max(36, h(n, twid - 66, { size: 9 }) + 18);
      box(tx, ty, twid, nh);
      doc.circle(tx + 26, ty + nh / 2, 9).fill(NAVY);
      t('i', tx + 17, ty + nh / 2 - 5.5, { bold: true, size: 10, color: '#fff', width: 18, align: 'center' });
      t(n, tx + 46, ty + 10, { size: 9, width: twid - 62, gap: 2 });
      ty += nh + 6;
    }

    // ---------------- terms (left) + thanks & signature (right) ----------------
    y = Math.max(ly, ty) + 14;
    const terms = String(s.invoice_terms || '').split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => l.replace(/\{terms_days\}/g, String(inv.terms_days)).replace(/\{business_email\}/g, s.business_email || '').replace(/\{business_phone\}/g, s.business_phone || ''));
    const sigH = 132;
    if (y + sigH > PH - 54) { doc.addPage(); y = 50; }
    let tyy = y;
    if (terms.length) {
      t('Terms & Conditions', L, tyy, { bold: true, size: 12, color: NAVY }); tyy += 19;
      terms.forEach((line, i) => {
        t(`${i + 1}.`, L, tyy, { size: 8.6, color: TEXT });
        t(line, L + 15, tyy, { size: 8.6, width: 245, gap: 2 });
        tyy += h(line, 245, { size: 8.6, gap: 2 }) + 4;
      });
    }
    let sy = y;
    t('Thank you!', tx, sy - 4, { font: 'script', size: 22, color: NAVY });
    if (s.invoice_thanks) { t(s.invoice_thanks, tx, sy + 28, { size: 9, color: GREY, width: twid, gap: 2 }); }
    sy += 28 + (s.invoice_thanks ? h(s.invoice_thanks, twid, { size: 9, gap: 2 }) : 0) + 8;
    const signer = SIGNERS[inv.signer];
    const sigImg = signer && asset(signer.file);
    if (sigImg) doc.image(sigImg, tx, sy, { fit: [120, 46] });
    sy += 50;
    t('Authorised Signatory', tx, sy, { bold: true, size: 10, color: NAVY });
    t(s.business_name, tx, sy + 14, { size: 9, color: ACCENT });

    // ---------------- footer ----------------
    const fy = PH - 44;
    hline(fy, L, R);
    const foot = [s.business_website, s.business_email, s.business_phone && `+91 ${String(s.business_phone).replace(/^\+?91[\s-]?/, '')}`].filter(Boolean);
    let fx = L;
    foot.forEach((item) => { t(item, fx, fy + 14, { size: 8.5, color: TEXT }); fx += doc.widthOfString(item) + 34; });
    if (s.business_tagline) t(s.business_tagline, R - 220, fy + 14, { size: 8.5, color: GREY, width: 220, align: 'right' });

    doc.end();
  });
}

module.exports = { invoicePdf };
