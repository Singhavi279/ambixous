const PDFDocument = require('pdfkit');
const path = require('path');
const { prettyDate, periodLabel, formatINR } = require('./lib');

// cwd-based so it still resolves when the code is bundled into the Next.js build.
const FONT_DIR = path.join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans', 'files');
const F = {
  reg: path.join(FONT_DIR, 'noto-sans-latin-400-normal.woff'),
  bold: path.join(FONT_DIR, 'noto-sans-latin-700-normal.woff'),
  rupee: path.join(FONT_DIR, 'noto-sans-latin-ext-400-normal.woff'),
  rupeeBold: path.join(FONT_DIR, 'noto-sans-latin-ext-700-normal.woff'),
};
const NAVY = '#0f1f3d', GREY = '#667085', LINE = '#e4e7ec', ACCENT = '#2f5bea', SOFT = '#f5f7fb';

// Builds an A4 invoice PDF and resolves with a Buffer.
function invoicePdf(inv, s) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${inv.number || 'Draft'}` } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('reg', F.reg); doc.registerFont('bold', F.bold);
    doc.registerFont('rupee', F.rupee); doc.registerFont('rupeeBold', F.rupeeBold);

    const L = 48, R = doc.page.width - 48, W = R - L;

    // Money drawn right-aligned at x=right, with the ₹ glyph from the font that has it.
    const money = (paise, right, y, { bold = false, size = 10, color = NAVY } = {}) => {
      const txt = formatINR(paise).replace('₹', '');
      doc.fillColor(color).font(bold ? 'bold' : 'reg').fontSize(size);
      const w = doc.widthOfString(txt);
      doc.text(txt, right - w, y, { lineBreak: false });
      doc.font(bold ? 'rupeeBold' : 'rupee').fontSize(size);
      const rw = doc.widthOfString('₹ ');
      doc.text('₹', right - w - rw, y, { lineBreak: false });
    };
    const t = (str, x, y, o = {}) => {
      doc.fillColor(o.color || NAVY).font(o.bold ? 'bold' : 'reg').fontSize(o.size || 10)
        .text(str, x, y, { width: o.width, align: o.align, lineBreak: o.width !== undefined, lineGap: o.gap });
    };

    // ----- header -----
    t(s.business_name.toUpperCase(), L, 48, { bold: true, size: 15, width: 300 });
    const idLines = [s.business_address, s.business_llpin && `LLPIN: ${s.business_llpin}`, s.business_pan && `PAN: ${s.business_pan}`,
      s.gst_enabled && s.business_gstin && `GSTIN: ${s.business_gstin}`,
      [s.business_email, s.business_phone].filter(Boolean).join('  ·  ')].filter(Boolean);
    t(idLines.join('\n'), L, 70, { size: 9, color: GREY, width: 300, gap: 2 });

    const title = inv.status === 'draft' ? 'DRAFT INVOICE' : 'INVOICE';
    t(s.gst_enabled ? 'TAX INVOICE' : title, R - 220, 48, { bold: true, size: 22, color: ACCENT, width: 220, align: 'right' });
    if (inv.status === 'void') t('VOID', R - 220, 78, { bold: true, size: 12, color: '#b42318', width: 220, align: 'right' });

    // ----- meta + bill to -----
    let y = 150;
    doc.moveTo(L, y - 12).lineTo(R, y - 12).strokeColor(LINE).lineWidth(1).stroke();
    t('BILL TO', L, y, { size: 8, bold: true, color: GREY });
    t(inv.customer_name, L, y + 14, { bold: true, size: 11, width: 240 });
    const cust = [inv.customer_address, inv.customer_email, inv.customer_phone, inv.customer_gstin && `GSTIN: ${inv.customer_gstin}`].filter(Boolean).join('\n');
    if (cust) t(cust, L, y + 30, { size: 9, color: GREY, width: 240, gap: 2 });

    const meta = [
      ['Invoice No', inv.number || 'Not issued yet'],
      ['Invoice Date', prettyDate(inv.issue_date)],
      ['Due Date', prettyDate(inv.due_date)],
      ['Payment Terms', inv.terms_days === 0 ? 'Due on receipt' : `${inv.terms_days} Calendar Days`],
    ];
    if (inv.period_start && inv.period_end) meta.push(['Service Period', periodLabel(inv.period_start, inv.period_end)]);
    if (inv.reference) meta.push(['Reference', inv.reference]);
    let my = y;
    for (const [k, v] of meta) {
      t(k, 330, my, { size: 9, color: GREY, width: 90 });
      t(v, 420, my, { size: 9, bold: true, width: R - 420 });
      my += doc.heightOfString(v, { width: R - 420 }) + 6;
    }

    // ----- items table -----
    y = Math.max(my, y + 90) + 20;
    const col = { desc: L + 10, qty: 330, rate: 400, amt: R - 10 };
    doc.rect(L, y, W, 24).fill(SOFT);
    t('DESCRIPTION', col.desc, y + 8, { size: 8, bold: true, color: GREY });
    t('QTY', col.qty, y + 8, { size: 8, bold: true, color: GREY, width: 50, align: 'right' });
    t('RATE', col.rate - 10, y + 8, { size: 8, bold: true, color: GREY, width: 70, align: 'right' });
    t('AMOUNT', col.amt - 80, y + 8, { size: 8, bold: true, color: GREY, width: 80, align: 'right' });
    y += 32;

    for (const it of inv.items) {
      const h = doc.font('reg').fontSize(10).heightOfString(it.description, { width: 270 });
      if (y + h > doc.page.height - 200) { doc.addPage(); y = 60; }
      t(it.description, col.desc, y, { width: 270, gap: 2 });
      t(`${it.qty}${it.unit ? ' ' + it.unit : ''}`, col.qty - 20, y, { width: 70, align: 'right' });
      money(it.rate, col.rate + 50, y);
      money(it.amount, col.amt, y);
      y += Math.max(h, 14) + 12;
      doc.moveTo(L, y - 6).lineTo(R, y - 6).strokeColor(LINE).lineWidth(0.5).stroke();
    }

    // ----- totals -----
    if (y > doc.page.height - 230) { doc.addPage(); y = 60; }
    y += 6;
    const row = (label, paise, o = {}) => {
      t(label, 340, y, { size: o.size || 10, color: o.color || GREY, bold: o.bold });
      if (paise === null) t(o.text, 400, y, { size: 10, align: 'right', width: R - 410 - 0, color: GREY });
      else money(paise, R - 10, y, { bold: o.bold, size: o.size || 10 });
      y += o.gap || 20;
    };
    row('Subtotal', inv.subtotal);
    if (inv.discount) row('Discount', -inv.discount);
    if (s.gst_enabled || inv.tax_rate > 0) row(`GST @ ${inv.tax_rate}%`, inv.tax);
    else row('GST', null, { text: 'Not applicable' });
    doc.moveTo(330, y - 4).lineTo(R, y - 4).strokeColor(NAVY).lineWidth(1).stroke();
    y += 6;
    row('Total payable', inv.total, { bold: true, size: 13, color: NAVY, gap: 24 });
    if (inv.status === 'issued' && inv.paid > 0) {
      row('Received', inv.paid);
      row('Balance due', inv.balance, { bold: true, color: NAVY });
    }

    // ----- notes -----
    y += 14;
    const notes = [];
    if (!s.gst_enabled && s.gst_note) notes.push(s.gst_note);
    if (inv.notes) notes.push(inv.notes);
    if (notes.length) { t(notes.join('\n'), L, y, { size: 9, color: GREY, width: 280, gap: 2 }); }
    if (s.payment_details) {
      const py = y;
      t('HOW TO PAY', 340, py, { size: 8, bold: true, color: GREY });
      t(s.payment_details, 340, py + 13, { size: 9, width: R - 340, gap: 2 });
    }

    // ----- footer -----
    const fy = doc.page.height - 110;
    doc.moveTo(L, fy).lineTo(R, fy).strokeColor(LINE).lineWidth(1).stroke();
    if (s.invoice_footer) t(s.invoice_footer, L, fy + 12, { size: 9, color: GREY, width: 300 });
    t(s.signatory || 'Authorized Signatory', R - 200, fy + 36, { size: 9, bold: true, width: 200, align: 'right' });
    t(s.business_name, R - 200, fy + 49, { size: 9, color: GREY, width: 200, align: 'right' });

    doc.end();
  });
}

module.exports = { invoicePdf };
