/* =============================================
   PDF Studio — document tools

   Merge, split, reorder, convert, protect, watermark, number and tidy PDFs.
   Everything is a pure function over bytes, so it runs in the browser (and in
   the tests) with no server involved.
   ============================================= */
import { TextEmbedder } from './pdf-fonts.js';
import { openPdfDocument } from './pdfjs-config.js';

export class ToolError extends Error {
    constructor(message, code = 'invalid') {
        super(message);
        this.code = code;
    }
}

// ---------------------------------------------
// Page ranges: "1-3, 5, 8-" -> [[0,1,2],[4],[7,8,...]]
// ---------------------------------------------
export function parsePageRanges(input, pageCount) {
    const groups = [];
    // "1 - 3" means the range 1-3, so spaces around a dash are not separators.
    const parts = String(input || '').replace(/\s*-\s*/g, '-').split(/[,;\s]+/).filter(Boolean);
    if (!parts.length) throw new ToolError('Enter the pages you want, for example 1-3, 5, 8-');
    for (const part of parts) {
        const match = (part !== '-' && /^(\d*)-(\d*)$/.exec(part)) || /^(\d+)$/.exec(part);
        if (!match) throw new ToolError(`"${part}" is not a page or range.`);
        let start;
        let end;
        if (match.length === 2) { start = end = Number(match[1]); }
        else {
            start = match[1] === '' ? 1 : Number(match[1]);
            end = match[2] === '' ? pageCount : Number(match[2]);
        }
        if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
            throw new ToolError(`"${part}" is outside this document, which has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
        }
        if (start > end) throw new ToolError(`"${part}" runs backwards.`);
        groups.push(Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i));
    }
    return groups;
}

/** File names derived from user input go into ZIP entries and downloads, so strip path and control characters. */
export const safeFileName = name => String(name || 'document').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '_').slice(0, 120) || 'document';

export const flattenRanges = groups => [...new Set(groups.flat())].sort((a, b) => a - b);

// ---------------------------------------------
// Loading
// ---------------------------------------------
export async function loadPdf(PDFLib, bytes, password) {
    try {
        return await PDFLib.PDFDocument.load(bytes, password === undefined ? {} : { password });
    } catch (error) {
        // pdf-lib says "encrypted" when no password was given and "Password incorrect" when one was wrong.
        if (error?.name === 'EncryptedPDFError' || /encrypted|password/i.test(error?.message || '')) {
            throw new ToolError(password ? 'That password is not correct.' : 'This PDF is password protected.', 'password-required');
        }
        throw new ToolError(`Could not read this PDF: ${error.message}`);
    }
}

export async function describePdf(PDFLib, bytes, password) {
    const doc = await loadPdf(PDFLib, bytes, password);
    return {
        pageCount: doc.getPageCount(),
        title: doc.getTitle() || '', author: doc.getAuthor() || '', subject: doc.getSubject() || '',
        keywords: doc.getKeywords() || '',
    };
}

// ---------------------------------------------
// Merge / split / reorder
// ---------------------------------------------
export async function mergePdfs(PDFLib, inputs) {
    if (inputs.length < 2) throw new ToolError('Add at least two PDFs to merge.');
    const output = await PDFLib.PDFDocument.create();
    for (const input of inputs) {
        const source = await loadPdf(PDFLib, input.bytes, input.password);
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach(page => output.addPage(page));
    }
    return output.save();
}

/**
 * plan: [{ from: sourcePageIndex, rotate: degrees to add }] in output order.
 * Pages may repeat (duplicate) or be left out (delete / extract).
 */
export async function arrangePages(PDFLib, bytes, plan, password) {
    if (!plan.length) throw new ToolError('Keep at least one page.');
    const source = await loadPdf(PDFLib, bytes, password);
    return arrangeFrom(PDFLib, source, plan);
}

// One copyPages call, so fonts and images shared by several pages are copied once (and duplicates share them).
async function arrangeFrom(PDFLib, source, plan) {
    const output = await PDFLib.PDFDocument.create();
    const copies = await output.copyPages(source, plan.map(step => step.from));
    copies.forEach((page, index) => {
        const { rotate } = plan[index];
        if (rotate) page.setRotation(PDFLib.degrees(((page.getRotation().angle + rotate) % 360 + 360) % 360));
        output.addPage(page);
    });
    return output.save();
}

export const extractPages = (PDFLib, bytes, indices, password) =>
    arrangePages(PDFLib, bytes, indices.map(from => ({ from, rotate: 0 })), password);

/** mode: 'ranges' (use `ranges`), 'every' (every `count` pages), 'each' (one file per page). */
export async function splitPdf(PDFLib, bytes, { mode, ranges, count, baseName: rawName = 'document', password }) {
    const baseName = safeFileName(rawName);
    const source = await loadPdf(PDFLib, bytes, password);
    const total = source.getPageCount();
    let groups;
    if (mode === 'each') groups = Array.from({ length: total }, (_, i) => [i]);
    else if (mode === 'every') {
        const size = Math.max(1, Math.floor(Number(count) || 1));
        groups = [];
        for (let start = 0; start < total; start += size) groups.push(Array.from({ length: Math.min(size, total - start) }, (_, i) => start + i));
    } else groups = parsePageRanges(ranges, total);
    if (groups.length > 500) throw new ToolError('That would create more than 500 files.');
    const files = [];
    for (const group of groups) {
        const label = group.length === 1 ? `page-${group[0] + 1}` : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`;
        files.push({ name: `${baseName}-${label}.pdf`, bytes: await arrangeFrom(PDFLib, source, group.map(from => ({ from, rotate: 0 }))), type: 'application/pdf' });
    }
    return files;
}

// ---------------------------------------------
// Images <-> PDF
// ---------------------------------------------
export function sniffImageType(bytes) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
    return null;
}

const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

/** images: [{ bytes }] (JPEG or PNG). pageSize: 'fit' | 'a4' | 'letter'. */
export async function imagesToPdf(PDFLib, images, { pageSize = 'a4', margin = 0, landscapeWhenWide = true } = {}) {
    if (!images.length) throw new ToolError('Add at least one image.');
    const output = await PDFLib.PDFDocument.create();
    for (const [index, input] of images.entries()) {
        const type = sniffImageType(input.bytes);
        if (!type) throw new ToolError(`Image ${index + 1} is not a JPEG or PNG.`);
        const image = type === 'jpeg' ? await output.embedJpg(input.bytes) : await output.embedPng(input.bytes);
        let width = image.width;
        let height = image.height;
        let page;
        if (pageSize === 'fit') {
            const scale = Math.min(1, 842 / Math.max(width, height));
            width *= scale; height *= scale;
            page = output.addPage([width + margin * 2, height + margin * 2]);
        } else {
            let [pageWidth, pageHeight] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
            if (landscapeWhenWide && width > height) [pageWidth, pageHeight] = [pageHeight, pageWidth];
            page = output.addPage([pageWidth, pageHeight]);
            const scale = Math.min((pageWidth - margin * 2) / width, (pageHeight - margin * 2) / height);
            width *= scale; height *= scale;
        }
        const { width: pageWidth, height: pageHeight } = page.getSize();
        page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    }
    return output.save();
}

/** Browser only. Renders pages with PDF.js; returns [{ name, bytes, type }]. */
export async function pdfToImages(pdfjsDoc, { format = 'png', dpi = 150, quality = 0.92, pages, baseName: rawName = 'page' }) {
    const baseName = safeFileName(rawName);
    const indices = pages || Array.from({ length: pdfjsDoc.numPages }, (_, i) => i);
    const files = [];
    for (const index of indices) {
        const page = await pdfjsDoc.getPage(index + 1);
        const viewport = page.getViewport({ scale: dpi / 72 });
        if (viewport.width * viewport.height > 120e6) throw new ToolError('That resolution is too large for this page. Try a lower DPI.');
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (format === 'jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); }
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, format === 'jpeg' ? 'image/jpeg' : 'image/png', quality));
        files.push({
            name: `${baseName}-${index + 1}.${format === 'jpeg' ? 'jpg' : 'png'}`,
            bytes: new Uint8Array(await blob.arrayBuffer()), type: blob.type,
        });
        canvas.width = canvas.height = 0;
    }
    return files;
}

// ---------------------------------------------
// Security
// ---------------------------------------------
export async function protectPdf(PDFLib, bytes, { userPassword, ownerPassword, permissions = {}, password }) {
    if (!userPassword && !ownerPassword) throw new ToolError('Enter a password.');
    const doc = await loadPdf(PDFLib, bytes, password);
    doc.encrypt({
        userPassword: userPassword || '',
        ownerPassword: ownerPassword || userPassword,
        permissions: {
            printing: permissions.printing === false ? false : 'highResolution',
            modifying: permissions.modifying !== false, copying: permissions.copying !== false,
            annotating: permissions.annotating !== false, fillingForms: permissions.fillingForms !== false,
            contentAccessibility: true, documentAssembly: permissions.modifying !== false,
        },
    });
    return doc.save();
}

/** Copying the pages is the only reliable way to drop the encryption from a decrypted document. */
export async function unlockPdf(PDFLib, bytes, password) {
    const source = await loadPdf(PDFLib, bytes, password ?? '');
    const output = await PDFLib.PDFDocument.create();
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
    output.setTitle(source.getTitle() || '');
    output.setAuthor(source.getAuthor() || '');
    output.setSubject(source.getSubject() || '');
    return output.save();
}

// ---------------------------------------------
// Drawing on every page: watermark and page numbers
// ---------------------------------------------
const hexToRgb = (PDFLib, hex) => {
    const clean = String(hex || '#000000').replace('#', '').padEnd(6, '0');
    return PDFLib.rgb(...[0, 2, 4].map(i => (parseInt(clean.slice(i, i + 2), 16) || 0) / 255));
};

function pagesToDraw(doc, rangeText) {
    const total = doc.getPageCount();
    return rangeText ? flattenRanges(parsePageRanges(rangeText, total)) : Array.from({ length: total }, (_, i) => i);
}

/**
 * The page as a viewer shows it: its displayed size, and how to turn a point in that upright frame
 * (origin bottom-left) into page coordinates. Honours the crop box and the page's own /Rotate, so
 * things drawn "at the bottom" really are at the bottom of what you see.
 */
function displayFrame(page) {
    const box = page.getCropBox ? page.getCropBox() : page.getMediaBox();
    const rotation = ((page.getRotation().angle % 360) + 360) % 360;
    const { width: W, height: H } = box;
    const sideways = rotation === 90 || rotation === 270;
    const toPage = (x, y) => {
        if (rotation === 90) return [box.x + (W - y), box.y + x];
        if (rotation === 180) return [box.x + (W - x), box.y + (H - y)];
        if (rotation === 270) return [box.x + y, box.y + (H - x)];
        return [box.x + x, box.y + y];
    };
    return { width: sideways ? H : W, height: sideways ? W : H, rotation, toPage };
}

/**
 * options: { text | image: {bytes}, fontFamily, bold, size, color, opacity, rotation, layout: 'center'|'tile', pages }
 */
export async function addWatermark(PDFLib, fontkit, bytes, options) {
    const doc = await loadPdf(PDFLib, bytes, options.password);
    const indices = pagesToDraw(doc, options.pages);
    const opacity = Math.min(1, Math.max(0.02, options.opacity ?? 0.25));
    const turn = options.rotation ?? 45;
    const radians = (turn * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let embedImage = null;
    if (options.image) {
        const type = sniffImageType(options.image.bytes);
        if (!type) throw new ToolError('The watermark image must be a JPEG or PNG.');
        embedImage = type === 'jpeg' ? await doc.embedJpg(options.image.bytes) : await doc.embedPng(options.image.bytes);
    } else if (!options.text?.trim()) throw new ToolError('Enter the watermark text.');
    const embedder = embedImage ? null : new TextEmbedder(doc, PDFLib, fontkit);
    const style = { family: options.fontFamily || 'sans', bold: options.bold !== false, italic: false };

    for (const index of indices) {
        const page = doc.getPage(index);
        const frame = displayFrame(page);
        const { width, height } = frame;
        let markWidth;
        let markHeight;
        const textSize = options.size ?? Math.max(24, Math.min(width, height) / 8);
        if (embedImage) {
            const scale = (options.size ?? 50) / 100 * Math.min(width, height) / Math.max(embedImage.width, embedImage.height) * 1.4;
            markWidth = embedImage.width * scale;
            markHeight = embedImage.height * scale;
        } else {
            markWidth = await embedder.widthOf(options.text, style, textSize);
            markHeight = textSize * 0.72;
        }
        const centres = [];
        if (options.layout === 'tile') {
            const stepX = markWidth * 1.6 + 40;
            const stepY = markHeight * 4 + 40;
            for (let row = -1; row * stepY < height + stepY; row++) {
                for (let column = -1; column * stepX < width + stepX; column++) centres.push([column * stepX + (Math.abs(row) % 2) * stepX / 2, row * stepY]);
            }
        } else centres.push([width / 2, height / 2]);

        for (const [cx, cy] of centres) {
            // Origin of the mark in the upright, displayed frame, then into page coordinates.
            const [x, y] = frame.toPage(cx - (markWidth / 2) * cos + (markHeight / 2) * sin, cy - (markWidth / 2) * sin - (markHeight / 2) * cos);
            const pageTurn = turn + frame.rotation;
            if (embedImage) {
                page.drawImage(embedImage, { x, y, width: markWidth, height: markHeight, rotate: PDFLib.degrees(pageTurn), opacity });
            } else {
                await embedder.drawText(page, options.text, {
                    x, y, size: textSize, ...style, color: hexToRgb(PDFLib, options.color || '#888888'),
                    angle: (pageTurn * Math.PI) / 180, opacity,
                });
            }
        }
    }
    return doc.save();
}

/**
 * options: { format: 'Page {n} of {total}', position: 'bottom-center' | 'top-right' | ..., size, margin, start,
 *            color, fontFamily, skipFirst, pages }
 */
export async function addPageNumbers(PDFLib, fontkit, bytes, options = {}) {
    const doc = await loadPdf(PDFLib, bytes, options.password);
    const indices = pagesToDraw(doc, options.pages);
    const total = doc.getPageCount();
    const size = options.size ?? 11;
    const margin = options.margin ?? 28;
    const format = options.format || '{n}';
    const [vertical, horizontal] = (options.position || 'bottom-center').split('-');
    const embedder = new TextEmbedder(doc, PDFLib, fontkit);
    const style = { family: options.fontFamily || 'sans', bold: false, italic: false };
    const first = options.start ?? 1;
    let counter = 0;
    for (const index of indices) {
        if (options.skipFirst && index === 0) continue;
        const page = doc.getPage(index);
        const frame = displayFrame(page);
        const label = format.replace(/\{n\}/g, String(first + counter)).replace(/\{total\}/g, String(total));
        counter++;
        const textWidth = await embedder.widthOf(label, style, size);
        const x = horizontal === 'left' ? margin : horizontal === 'right' ? frame.width - margin - textWidth : (frame.width - textWidth) / 2;
        const y = vertical === 'top' ? frame.height - margin - size * 0.72 : margin;
        const [pageX, pageY] = frame.toPage(x, y);
        await embedder.drawText(page, label, {
            x: pageX, y: pageY, size, ...style, color: hexToRgb(PDFLib, options.color || '#333333'),
            angle: (frame.rotation * Math.PI) / 180,
        });
    }
    return doc.save();
}

// ---------------------------------------------
// Tidying
// ---------------------------------------------
export async function setMetadata(PDFLib, bytes, values, password) {
    const doc = await loadPdf(PDFLib, bytes, password);
    doc.setTitle(values.title || '');
    doc.setAuthor(values.author || '');
    doc.setSubject(values.subject || '');
    doc.setKeywords((values.keywords || '').split(/\s*,\s*/).filter(Boolean));
    return doc.save();
}

/** Margins in points trimmed from the edges as displayed, on every selected page. */
export async function cropPages(PDFLib, bytes, { top = 0, right = 0, bottom = 0, left = 0, pages, password }) {
    const doc = await loadPdf(PDFLib, bytes, password);
    for (const index of pagesToDraw(doc, pages)) {
        const page = doc.getPage(index);
        const frame = displayFrame(page);
        if (frame.width - left - right < 20 || frame.height - top - bottom < 20) throw new ToolError(`Page ${index + 1} would be too small after cropping.`);
        const [x1, y1] = frame.toPage(left, bottom);
        const [x2, y2] = frame.toPage(frame.width - right, frame.height - top);
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        page.setCropBox(x, y, width, height);
        page.setMediaBox(x, y, width, height);
    }
    return doc.save();
}

/** Rebuilds the file from its pages, dropping anything no page uses. Honest about the saving. */
export async function optimizePdf(PDFLib, bytes, password) {
    const source = await loadPdf(PDFLib, bytes, password);
    const output = await PDFLib.PDFDocument.create();
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
    ['Title', 'Author', 'Subject'].forEach(key => {
        const value = source[`get${key}`]();
        if (value) output[`set${key}`](value);
    });
    const result = await output.save({ useObjectStreams: true });
    return result.length < bytes.length ? result : new Uint8Array(bytes);
}

/**
 * Replaces pages with pictures of themselves. Used when something under a redaction cannot be
 * removed from the page's content: a picture holds no hidden text, so nothing can leak.
 * Browser only (renders with PDF.js).
 */
export async function flattenPages(PDFLib, bytes, indices, { dpi = 200, quality = 0.9 } = {}) {
    const rendered = await openPdfDocument({ data: bytes.slice() }).promise;
    const doc = await PDFLib.PDFDocument.load(bytes);
    for (const index of [...indices].sort((a, b) => a - b)) {
        const page = await rendered.getPage(index + 1);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: dpi / 72 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        const image = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        const flat = doc.insertPage(index, [natural.width, natural.height]);
        flat.drawImage(image, { x: 0, y: 0, width: natural.width, height: natural.height });
        doc.removePage(index + 1);
        canvas.width = canvas.height = 0;
    }
    await rendered.destroy();
    return doc.save();
}

// ---------------------------------------------
// ZIP (stored, no compression) so several outputs can be one download
// ---------------------------------------------
const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

export function createZip(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const file of files) {
        const name = encoder.encode(file.name);
        const crc = crc32(file.bytes);
        const header = new DataView(new ArrayBuffer(30));
        header.setUint32(0, 0x04034b50, true);
        header.setUint16(4, 20, true);
        header.setUint16(6, 0x0800, true);
        header.setUint16(10, dosTime, true);
        header.setUint16(12, dosDate, true);
        header.setUint32(14, crc, true);
        header.setUint32(18, file.bytes.length, true);
        header.setUint32(22, file.bytes.length, true);
        header.setUint16(26, name.length, true);
        chunks.push(new Uint8Array(header.buffer), name, file.bytes);
        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, 0x0800, true);
        entry.setUint16(12, dosTime, true);
        entry.setUint16(14, dosDate, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, file.bytes.length, true);
        entry.setUint32(24, file.bytes.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);
        central.push(new Uint8Array(entry.buffer), name);
        offset += 30 + name.length + file.bytes.length;
    }
    const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let cursor = 0;
    for (const part of parts) { out.set(part, cursor); cursor += part.length; }
    return out;
}
