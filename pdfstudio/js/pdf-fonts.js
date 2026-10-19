/* =============================================
   PDF Studio — fonts for new and edited text

   Three metric-compatible families ship with the app (Arimo ≈ Helvetica/Arial,
   Tinos ≈ Times, Cousine ≈ Courier). Each is split into a Latin file and a
   Latin-extended file, so a character outside the first falls through to the
   second. The same files drive the on-screen editor and the exported PDF.
   ============================================= */

const FILE_BASE = { sans: 'arimo', serif: 'tinos', mono: 'cousine' };
export const FAMILY_LABELS = { sans: 'Sans', serif: 'Serif', mono: 'Mono' };
export const CSS_FAMILY = {
    sans: '"PDFStudio Sans", Arial, Helvetica, sans-serif',
    serif: '"PDFStudio Serif", "Times New Roman", Times, serif',
    mono: '"PDFStudio Mono", "Courier New", Courier, monospace',
};
const SUBSETS = ['latin', 'latin-ext'];

/** Maps any font name (Helvetica, Times-Roman, Georgia, Courier New, ...) to one of the bundled families. */
export function familyKeyFor(name) {
    const lower = String(name || '').toLowerCase();
    if (/courier|mono|consol|menlo/.test(lower)) return 'mono';
    if (!/sans/.test(lower) && /times|georgia|serif|garamond|palatino|cambria|book/.test(lower)) return 'serif';
    return 'sans';
}

const fileName = (family, subset, bold, italic) =>
    `${FILE_BASE[family]}-${subset}-${bold ? 700 : 400}-${italic ? 'italic' : 'normal'}.ttf`;

const fontUrl = name => new URL(`../fonts/${name}`, import.meta.url);

const bytesCache = new Map();
let fontLoader = name => fetch(fontUrl(name)).then(response => {
    if (!response.ok) throw new Error(`Could not load font ${name}`);
    return response.arrayBuffer();
}).then(buffer => new Uint8Array(buffer));

/** Lets a non-browser host (tests) supply font bytes. */
export function setFontLoader(loader) { fontLoader = loader; bytesCache.clear(); }

function loadBytes(name) {
    if (!bytesCache.has(name)) bytesCache.set(name, fontLoader(name));
    return bytesCache.get(name);
}

/** Makes sure the browser has the web fonts for a style before measuring or editing. */
export async function ensureWebFont(family, bold, italic) {
    if (!document.fonts?.load) return;
    const css = `${italic ? 'italic ' : ''}${bold ? 700 : 400} 16px ${CSS_FAMILY[family]}`;
    try { await document.fonts.load(css, 'AaÉ₹'); } catch { /* the fallback stack still renders */ }
    baselineCache.delete(family);
}

const baselineCache = new Map();
/**
 * Distance from the top of a `line-height: 1` box to the text baseline, as a
 * fraction of the font size. Needed to put edited text exactly on the original baseline.
 */
export function baselineRatio(family) {
    if (baselineCache.has(family)) return baselineCache.get(family);
    let ratio = 0.85;
    try {
        const context = document.createElement('canvas').getContext('2d');
        context.font = `100px ${CSS_FAMILY[family]}`;
        const metrics = context.measureText('Hxg');
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        if (ascent && descent) ratio = ((100 - (ascent + descent)) / 2 + ascent) / 100;
    } catch { /* keep the default */ }
    baselineCache.set(family, ratio);
    return ratio;
}

/**
 * Draws text into a pdf-lib document with the bundled fonts. One instance per
 * document so each font file is embedded (and subset) at most once.
 */
export class TextEmbedder {
    constructor(pdfDoc, PDFLib, fontkit) {
        this.pdfDoc = pdfDoc;
        this.PDFLib = PDFLib;
        this.fontkit = fontkit;
        this.embedded = new Map();
        this.coverage = new Map();
        pdfDoc.registerFontkit(fontkit);
    }

    async characterSet(name) {
        if (!this.coverage.has(name)) {
            this.coverage.set(name, loadBytes(name).then(bytes => {
                const parsed = this.fontkit.create(bytes);
                return code => parsed.hasGlyphForCodePoint(code);
            }));
        }
        return this.coverage.get(name);
    }

    async embed(name) {
        if (!this.embedded.has(name)) {
            this.embedded.set(name, loadBytes(name).then(bytes => this.pdfDoc.embedFont(bytes, { subset: true })));
        }
        return this.embedded.get(name);
    }

    /** Splits text into runs that each use one font file. Unsupported characters become "?". */
    async segment(text, { family, bold, italic }) {
        const files = SUBSETS.map(subset => fileName(family, subset, bold, italic));
        const checks = await Promise.all(files.map(name => this.characterSet(name)));
        const segments = [];
        const missing = new Set();
        for (const char of Array.from(text.replace(/[\u0000-\u001f\u007f]/g, ' '))) {
            const code = char.codePointAt(0);
            let index = checks.findIndex(has => has(code));
            let output = char;
            if (index < 0) {
                missing.add(char);
                output = '?';
                index = 0;
            }
            const last = segments[segments.length - 1];
            if (last && last.file === files[index]) last.text += output;
            else segments.push({ file: files[index], text: output });
        }
        return { segments, missing: [...missing] };
    }

    async widthOf(text, style, size) {
        const { segments } = await this.segment(text, style);
        let total = 0;
        for (const segment of segments) total += (await this.embed(segment.file)).widthOfTextAtSize(segment.text, size);
        return total;
    }

    /** Draws a baseline-anchored line of text. `angle` is in radians, counter-clockwise. */
    async drawText(page, text, { x, y, size, family = 'sans', bold = false, italic = false, color, angle = 0, opacity }) {
        const { segments, missing } = await this.segment(text, { family, bold, italic });
        const { degrees } = this.PDFLib;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        let offset = 0;
        let drawn = '';
        for (const segment of segments) {
            drawn += segment.text;
            const font = await this.embed(segment.file);
            page.drawText(segment.text, {
                x: x + offset * cos, y: y + offset * sin, size, font, color,
                rotate: degrees((angle * 180) / Math.PI), opacity,
            });
            offset += font.widthOfTextAtSize(segment.text, size);
        }
        return { width: offset, missing, drawn };
    }
}
