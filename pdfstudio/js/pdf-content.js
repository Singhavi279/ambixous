/* =============================================
   PDF Studio — content-stream analysis and surgery

   A PDF page is a program of drawing operators. This module reads that program,
   records where every piece of text and every image is drawn, and can rewrite
   the program to delete or move them. That is what lets PDF Studio remove the
   original text instead of only painting a box over it.

   Anything the analyzer cannot prove it understands is flagged `unsafe`, and
   the caller falls back to covering the area.
   ============================================= */

let L = null;
export function setPdfLib(lib) { L = lib; }

// ---------------------------------------------
// Matrices — [a b c d e f], row vectors: p' = p × M
// ---------------------------------------------
const IDENT = [1, 0, 0, 1, 0, 0];
export const mul = (m, n) => [
    m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5],
];
const invert = m => {
    const det = m[0] * m[3] - m[1] * m[2];
    if (!det || !Number.isFinite(det)) return null;
    return [
        m[3] / det, -m[1] / det, -m[2] / det, m[0] / det,
        (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det,
    ];
};
const applyMatrix = (m, x, y) => [x * m[0] + y * m[2] + m[4], x * m[1] + y * m[3] + m[5]];

// ---------------------------------------------
// Tokenizer
// ---------------------------------------------
const WS = new Uint8Array(256);
[0, 9, 10, 12, 13, 32].forEach(code => { WS[code] = 1; });
const DELIM = new Uint8Array(256);
[40, 41, 60, 62, 91, 93, 123, 125, 47, 37].forEach(code => { DELIM[code] = 1; });
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;

function skipSpace(st) {
    const { buf } = st;
    while (st.pos < buf.length) {
        const c = buf[st.pos];
        if (WS[c]) st.pos++;
        else if (c === 37) { while (st.pos < buf.length && buf[st.pos] !== 10 && buf[st.pos] !== 13) st.pos++; }
        else break;
    }
}

function readLiteralString(st) {
    const { buf } = st;
    const start = st.pos;
    st.pos++;
    const bytes = [];
    let depth = 1;
    while (st.pos < buf.length && depth > 0) {
        let c = buf[st.pos++];
        if (c === 92) {
            c = buf[st.pos++];
            if (c === 110) bytes.push(10);
            else if (c === 114) bytes.push(13);
            else if (c === 116) bytes.push(9);
            else if (c === 98) bytes.push(8);
            else if (c === 102) bytes.push(12);
            else if (c >= 48 && c <= 55) {
                let value = c - 48;
                for (let i = 0; i < 2 && buf[st.pos] >= 48 && buf[st.pos] <= 55; i++) value = value * 8 + (buf[st.pos++] - 48);
                bytes.push(value & 255);
            } else if (c === 13) { if (buf[st.pos] === 10) st.pos++; }
            else if (c === 10) { /* line continuation */ }
            else if (c !== undefined) bytes.push(c);
        } else if (c === 40) { depth++; bytes.push(c); }
        else if (c === 41) { depth--; if (depth > 0) bytes.push(c); }
        else bytes.push(c);
    }
    return { k: 'str', b: Uint8Array.from(bytes), s: start, e: st.pos };
}

function readHexString(st) {
    const { buf } = st;
    const start = st.pos;
    st.pos++;
    const nibbles = [];
    while (st.pos < buf.length && buf[st.pos] !== 62) {
        const c = buf[st.pos++];
        let v = -1;
        if (c >= 48 && c <= 57) v = c - 48;
        else if (c >= 65 && c <= 70) v = c - 55;
        else if (c >= 97 && c <= 102) v = c - 87;
        if (v >= 0) nibbles.push(v);
    }
    st.pos++;
    if (nibbles.length % 2) nibbles.push(0);
    const bytes = new Uint8Array(nibbles.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = nibbles[2 * i] * 16 + nibbles[2 * i + 1];
    return { k: 'str', b: bytes, s: start, e: st.pos };
}

function readObject(st) {
    skipSpace(st);
    const { buf } = st;
    if (st.pos >= buf.length) return null;
    const start = st.pos;
    const c = buf[st.pos];
    if (c === 47) {
        st.pos++;
        let name = '';
        while (st.pos < buf.length && !WS[buf[st.pos]] && !DELIM[buf[st.pos]]) {
            let ch = buf[st.pos++];
            if (ch === 35 && st.pos + 1 < buf.length) {
                const hex = String.fromCharCode(buf[st.pos], buf[st.pos + 1]);
                if (/^[0-9a-fA-F]{2}$/.test(hex)) { ch = parseInt(hex, 16); st.pos += 2; }
            }
            name += String.fromCharCode(ch);
        }
        return { k: 'name', v: name, s: start, e: st.pos };
    }
    if (c === 40) return readLiteralString(st);
    if (c === 60) {
        if (buf[st.pos + 1] === 60) {
            st.pos += 2;
            let depth = 1;
            while (st.pos < buf.length && depth > 0) {
                skipSpace(st);
                if (buf[st.pos] === 62 && buf[st.pos + 1] === 62) { st.pos += 2; depth--; continue; }
                if (buf[st.pos] === 60 && buf[st.pos + 1] === 60) { st.pos += 2; depth++; continue; }
                if (!readObject(st)) break;
            }
            return { k: 'dict', s: start, e: st.pos };
        }
        return readHexString(st);
    }
    if (c === 91) {
        st.pos++;
        const items = [];
        for (;;) {
            skipSpace(st);
            if (st.pos >= buf.length) break;
            if (buf[st.pos] === 93) { st.pos++; break; }
            const item = readObject(st);
            if (!item) break;
            items.push(item);
        }
        return { k: 'arr', items, s: start, e: st.pos };
    }
    if (DELIM[c]) { st.pos++; return { k: 'stray', s: start, e: st.pos }; }
    while (st.pos < buf.length && !WS[buf[st.pos]] && !DELIM[buf[st.pos]]) st.pos++;
    const text = String.fromCharCode(...buf.subarray(start, st.pos));
    if (NUMBER.test(text)) return { k: 'num', v: parseFloat(text), s: start, e: st.pos };
    if (text === 'true' || text === 'false' || text === 'null') return { k: 'kw', v: text, s: start, e: st.pos };
    return { k: 'op', v: text, s: start, e: st.pos };
}

function skipInlineImage(st, dictTokens) {
    const { buf } = st;
    if (WS[buf[st.pos]]) {
        if (buf[st.pos] === 13 && buf[st.pos + 1] === 10) st.pos += 2; else st.pos++;
    }
    const dataStart = st.pos;
    for (let i = dataStart; i < buf.length - 1; i++) {
        if (buf[i] !== 69 || buf[i + 1] !== 73) continue; // "EI"
        if (i > dataStart && !WS[buf[i - 1]]) continue;
        if (i + 2 < buf.length && !WS[buf[i + 2]]) continue;
        let plausible = true;
        for (let j = i + 2; j < Math.min(buf.length, i + 14); j++) {
            const byte = buf[j];
            if (byte > 127 || (byte < 32 && !WS[byte])) { plausible = false; break; }
        }
        if (!plausible) continue;
        st.pos = i + 2;
        return dictTokens;
    }
    st.pos = buf.length;
    return dictTokens;
}

export function parseContent(buf) {
    const st = { buf, pos: 0 };
    const ops = [];
    let operands = [];
    for (;;) {
        const token = readObject(st);
        if (!token) break;
        if (token.k === 'stray') continue;
        if (token.k !== 'op') { operands.push(token); continue; }
        if (token.v === 'BI') {
            const dictTokens = [];
            for (;;) {
                const t = readObject(st);
                if (!t || (t.k === 'op' && t.v === 'ID')) break;
                dictTokens.push(t);
            }
            skipInlineImage(st, dictTokens);
            ops.push({ op: 'BI', args: dictTokens, s: token.s, e: st.pos });
            operands = [];
            continue;
        }
        ops.push({ op: token.v, args: operands, s: operands.length ? operands[0].s : token.s, e: token.e });
        operands = [];
    }
    return ops;
}

// ---------------------------------------------
// PDF object helpers
// ---------------------------------------------
const nameOf = object => (object instanceof L.PDFName ? object.decodeText() : null);
const numberOf = object => (object && typeof object.asNumber === 'function' ? object.asNumber() : null);

function getEntry(dict, key) {
    if (!dict || typeof dict.get !== 'function') return undefined;
    const raw = dict.get(L.PDFName.of(key));
    return raw === undefined ? undefined : dict.context.lookup(raw);
}
const getRawEntry = (dict, key) => (dict && typeof dict.get === 'function' ? dict.get(L.PDFName.of(key)) : undefined);

function asDict(object) {
    if (!object) return null;
    if (object instanceof L.PDFDict) return object;
    if (object.dict instanceof L.PDFDict) return object.dict;
    return null;
}

function arrayNumbers(array) {
    if (!(array instanceof L.PDFArray)) return null;
    const out = [];
    for (let i = 0; i < array.size(); i++) {
        const value = numberOf(array.context.lookup(array.get(i)));
        if (value === null) return null;
        out.push(value);
    }
    return out;
}

function streamBytes(stream) {
    if (stream instanceof L.PDFRawStream) return L.decodePDFRawStream(stream).decode();
    if (typeof stream.getUnencodedContents === 'function') return stream.getUnencodedContents();
    return stream.getContents();
}

// ---------------------------------------------
// Fonts
// ---------------------------------------------
let standardWidthsPromise = null;
const STANDARD_NAMES = [
    [/^(courier|couriernew)(-|,|$)?.*bold.*(oblique|italic)/i, 'Courier-BoldOblique'],
    [/^(courier|couriernew).*bold/i, 'Courier-Bold'],
    [/^(courier|couriernew).*(oblique|italic)/i, 'Courier-Oblique'],
    [/^(courier|couriernew)/i, 'Courier'],
    [/^(helvetica|arial)(mt)?.*bold.*(oblique|italic)/i, 'Helvetica-BoldOblique'],
    [/^(helvetica|arial)(mt)?.*bold/i, 'Helvetica-Bold'],
    [/^(helvetica|arial)(mt)?.*(oblique|italic)/i, 'Helvetica-Oblique'],
    [/^(helvetica|arial)/i, 'Helvetica'],
    [/^times.*bold.*(italic|oblique)/i, 'Times-BoldItalic'],
    [/^times.*bold/i, 'Times-Bold'],
    [/^times.*(italic|oblique)/i, 'Times-Italic'],
    [/^times/i, 'Times-Roman'],
];

function standardFontName(baseFont) {
    for (const [pattern, name] of STANDARD_NAMES) if (pattern.test(baseFont)) return name;
    return null;
}

function getStandardMeasurer(standardName) {
    if (!standardWidthsPromise) {
        standardWidthsPromise = L.PDFDocument.create().then(doc => ({ doc, fonts: new Map() }));
    }
    return standardWidthsPromise.then(({ doc, fonts }) => {
        if (!fonts.has(standardName)) fonts.set(standardName, doc.embedStandardFont(standardName));
        const font = fonts.get(standardName);
        const cache = new Map();
        return code => {
            if (cache.has(code)) return cache.get(code);
            let width = 0;
            try { width = font.widthOfTextAtSize(String.fromCharCode(code), 1000); } catch { width = 0; }
            cache.set(code, width);
            return width;
        };
    });
}

function classifyFont(baseFont, descriptor) {
    const flags = numberOf(getEntry(descriptor, 'Flags')) || 0;
    const name = baseFont || '';
    const bold = /bold|black|heavy|demi|semibold/i.test(name) || (flags & 262144) !== 0
        || (numberOf(getEntry(descriptor, 'FontWeight')) || 400) >= 600;
    const italic = /italic|oblique|ital$|-it$/i.test(name) || (flags & 64) !== 0
        || Math.abs(numberOf(getEntry(descriptor, 'ItalicAngle')) || 0) > 1;
    const mono = /courier|mono|consolas|menlo|typewriter|fixed|cousine/i.test(name) || (flags & 1) !== 0;
    const sans = /sans|arial|helvetica|calibri|verdana|tahoma|segoe|roboto|inter|open|noto|arimo/i.test(name);
    const serif = !sans && (/times|georgia|garamond|palatino|serif|minion|cambria|roman|book|tinos|charter|caslon/i.test(name)
        || (flags & 2) !== 0);
    return { bold, italic, family: mono ? 'mono' : serif ? 'serif' : 'sans' };
}

const fontCache = new WeakMap();

async function buildFontInfo(fontDict) {
    const subtype = nameOf(getEntry(fontDict, 'Subtype'));
    const rawBase = nameOf(getEntry(fontDict, 'BaseFont')) || '';
    const baseFont = rawBase.replace(/^[A-Z]{6}\+/, '');
    const info = {
        subtype, baseFont, codeBytes: 1, supported: true, reason: null,
        width: () => 0, family: 'sans', bold: false, italic: false,
    };
    let descriptor = asDict(getEntry(fontDict, 'FontDescriptor'));

    if (subtype === 'Type0') {
        info.codeBytes = 2;
        const encoding = getEntry(fontDict, 'Encoding');
        const encodingName = nameOf(encoding);
        if (encodingName === 'Identity-V') { info.supported = false; info.reason = 'vertical writing'; }
        else if (encodingName !== 'Identity-H') { info.supported = false; info.reason = 'custom character map'; }
        const descendants = getEntry(fontDict, 'DescendantFonts');
        const descendant = descendants instanceof L.PDFArray && descendants.size()
            ? asDict(descendants.context.lookup(descendants.get(0))) : null;
        if (!descendant) { info.supported = false; info.reason = 'missing descendant font'; return info; }
        descriptor = asDict(getEntry(descendant, 'FontDescriptor')) || descriptor;
        const dw = numberOf(getEntry(descendant, 'DW')) ?? 1000;
        const widths = new Map();
        const w = getEntry(descendant, 'W');
        if (w instanceof L.PDFArray) {
            const items = [];
            for (let i = 0; i < w.size(); i++) items.push(w.context.lookup(w.get(i)));
            for (let i = 0; i < items.length;) {
                const first = numberOf(items[i]);
                const second = items[i + 1];
                if (second instanceof L.PDFArray) {
                    for (let j = 0; j < second.size(); j++) widths.set(first + j, numberOf(second.context.lookup(second.get(j))) ?? dw);
                    i += 2;
                } else {
                    const last = numberOf(second);
                    const width = numberOf(items[i + 2]) ?? dw;
                    if (first !== null && last !== null && last - first < 70000) for (let c = first; c <= last; c++) widths.set(c, width);
                    i += 3;
                }
            }
        }
        info.width = code => widths.get(code) ?? dw;
    } else if (subtype === 'Type3') {
        const matrix = arrayNumbers(getEntry(fontDict, 'FontMatrix')) || [0.001, 0, 0, 0.001, 0, 0];
        const first = numberOf(getEntry(fontDict, 'FirstChar')) || 0;
        const widths = arrayNumbers(getEntry(fontDict, 'Widths')) || [];
        info.width = code => (widths[code - first] ?? 0) * matrix[0] * 1000;
    } else if (subtype === 'Type1' || subtype === 'TrueType' || subtype === 'MMType1') {
        const first = numberOf(getEntry(fontDict, 'FirstChar'));
        const widths = arrayNumbers(getEntry(fontDict, 'Widths'));
        const missing = numberOf(getEntry(descriptor, 'MissingWidth')) || 0;
        if (widths && first !== null) {
            info.width = code => widths[code - first] ?? missing;
        } else {
            const standard = standardFontName(baseFont);
            const encoding = getEntry(fontDict, 'Encoding');
            if (!standard || /symbol|dingbats/i.test(baseFont)) {
                info.supported = false; info.reason = 'no width table';
            } else if (encoding instanceof L.PDFDict && getEntry(encoding, 'Differences')) {
                info.supported = false; info.reason = 'custom encoding';
            } else {
                info.width = await getStandardMeasurer(standard);
            }
        }
    } else {
        info.supported = false;
        info.reason = `unsupported font type ${subtype}`;
    }
    Object.assign(info, classifyFont(baseFont, descriptor));
    return info;
}

async function fontInfoFor(fontDict) {
    if (!fontCache.has(fontDict)) fontCache.set(fontDict, buildFontInfo(fontDict));
    return fontCache.get(fontDict);
}

// ---------------------------------------------
// Colours
// ---------------------------------------------
const hex2 = v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
const rgbHex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const cmykHex = (c, m, y, k) => rgbHex((1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k));

function colorFromOperands(args, space) {
    const values = args.filter(token => token.k === 'num').map(token => token.v);
    if (space === 'DeviceGray' || space === 'CalGray') return values.length === 1 ? rgbHex(values[0], values[0], values[0]) : null;
    if (space === 'DeviceRGB' || space === 'CalRGB') return values.length === 3 ? rgbHex(...values) : null;
    if (space === 'DeviceCMYK') return values.length === 4 ? cmykHex(...values) : null;
    return null;
}

function resolveColorSpace(resources, name) {
    if (['DeviceGray', 'DeviceRGB', 'DeviceCMYK', 'Pattern'].includes(name)) return name;
    const dict = asDict(getEntry(resources, 'ColorSpace'));
    const entry = dict ? getEntry(dict, name) : null;
    if (entry instanceof L.PDFName) return entry.decodeText();
    if (entry instanceof L.PDFArray && entry.size()) {
        const kind = nameOf(entry.context.lookup(entry.get(0)));
        if (kind === 'ICCBased' && entry.size() > 1) {
            const profile = entry.context.lookup(entry.get(1));
            const components = numberOf(getEntry(asDict(profile), 'N'));
            return components === 1 ? 'DeviceGray' : components === 3 ? 'DeviceRGB' : components === 4 ? 'DeviceCMYK' : null;
        }
        if (kind === 'CalRGB' || kind === 'CalGray') return kind;
    }
    return null;
}

// ---------------------------------------------
// Analysis
// ---------------------------------------------
const MAX_FORM_DEPTH = 6;

function newGraphicsState() {
    return {
        ctm: IDENT, lw: 1, tc: 0, tw: 0, th: 1, tl: 0, font: null, fontName: null, size: 0, rise: 0, render: 0,
        fill: '#000000', fillSpace: 'DeviceGray',
    };
}

function lookupPageContents(pdfDoc, pageNode) {
    const contents = pageNode.Contents();
    const refs = [];
    const streams = [];
    if (!contents) return { streams, refs };
    if (contents instanceof L.PDFArray) {
        for (let i = 0; i < contents.size(); i++) {
            const raw = contents.get(i);
            const stream = pdfDoc.context.lookup(raw);
            if (stream) { streams.push(stream); refs.push(raw instanceof L.PDFRef ? raw : null); }
        }
    } else {
        streams.push(contents);
        const raw = pageNode.get(L.PDFName.of('Contents'));
        refs.push(raw instanceof L.PDFRef ? raw : null);
    }
    return { streams, refs };
}

function concatBytes(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0) + Math.max(0, chunks.length - 1);
    const out = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk, index) => {
        out.set(chunk, offset);
        offset += chunk.length;
        if (index < chunks.length - 1) out[offset++] = 10;
    });
    return out;
}

const formUsageCache = new WeakMap();

// How many places reference each Form XObject. Editing a form that is drawn more
// than once would change every copy, so such forms are never edited in place.
function computeFormUsage(pdfDoc) {
    if (formUsageCache.has(pdfDoc)) return formUsageCache.get(pdfDoc);
    const usage = new Map();
    const seenPerPage = new Set();
    const visit = (resources, pageKey, depth) => {
        const xobjects = asDict(getEntry(resources, 'XObject'));
        if (!xobjects || depth > MAX_FORM_DEPTH) return;
        for (const [, raw] of xobjects.entries()) {
            const object = pdfDoc.context.lookup(raw);
            const dict = asDict(object);
            if (!dict || nameOf(getEntry(dict, 'Subtype')) !== 'Form') continue;
            const key = raw instanceof L.PDFRef ? raw.tag : null;
            if (!key) continue;
            usage.set(key, (usage.get(key) || 0) + 1);
            const marker = `${pageKey}|${key}`;
            if (seenPerPage.has(marker)) continue;
            seenPerPage.add(marker);
            visit(asDict(getEntry(dict, 'Resources')), pageKey, depth + 1);
        }
    };
    pdfDoc.getPages().forEach((page, index) => visit(page.node.Resources(), index, 0));
    formUsageCache.set(pdfDoc, usage);
    return usage;
}

/**
 * Reads one page and returns everything the editor needs to know about its
 * text and images, plus the data required to rewrite the page later.
 */
export async function analyzePage(pdfDoc, pageIndex) {
    const page = pdfDoc.getPages()[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const analysis = { pageIndex, shows: [], images: [], scopes: [], failed: false, pdfDoc, formDo: {}, objectCounter: 0, pageArea: pageWidth * pageHeight };
    let formUsage;
    try {
        formUsage = computeFormUsage(pdfDoc);
        const { streams, refs } = lookupPageContents(pdfDoc, page.node);
        const buf = concatBytes(streams.map(streamBytes));
        const scope = {
            id: 0, kind: 'page', buf, ops: parseContent(buf), refs, streams, ref: null,
            resources: page.node.Resources(), formKey: null,
        };
        analysis.scopes.push(scope);
        await walkScope(analysis, scope, newGraphicsState(), 0, formUsage, new Set());
        // A form drawn several times is one object: editing it would change every copy.
        const reused = new Set(analysis.scopes.filter(s => s.formKey && analysis.formDo[s.formKey] > 1).map(s => s.id));
        for (const item of [...analysis.shows, ...analysis.images]) if (reused.has(item.scope)) item.unsafe = item.unsafe || 'shared form';
        pruneVectorObjects(analysis);
    } catch (error) {
        analysis.failed = true;
        analysis.error = error;
    }
    return analysis;
}

async function walkScope(analysis, scope, initialState, depth, formUsage, activeForms) {
    const { ops, resources } = scope;
    let gs = { ...initialState };
    const stack = [];
    let tm = IDENT;
    let tlm = IDENT;
    // A show is "chained" when the pen was not repositioned since the previous show, so
    // anything inserted before it shifts it (and everything after it) along the line.
    let penMoved = true;
    let lastShow = null;
    // Path being built: where it started in the operator list, its points, and whether it will clip.
    let pathFirst = -1;
    let pathPoints = [];
    let clipNext = false;
    const fontsByName = new Map();

    const resolveFont = async name => {
        if (fontsByName.has(name)) return fontsByName.get(name);
        const fonts = asDict(getEntry(resources, 'Font'));
        const dict = fonts ? asDict(getEntry(fonts, name)) : null;
        const info = dict ? await fontInfoFor(dict) : null;
        fontsByName.set(name, info);
        return info;
    };

    const advanceFor = (bytes, info) => {
        const glyphTx = [];
        let total = 0;
        const step = info.codeBytes;
        for (let i = 0; i + step <= bytes.length; i += step) {
            const code = step === 2 ? (bytes[i] << 8) | bytes[i + 1] : bytes[i];
            const width = info.width(code) / 1000;
            const tx = (width * gs.size + gs.tc + (step === 1 && code === 32 ? gs.tw : 0)) * gs.th;
            glyphTx.push(tx);
            total += tx;
        }
        return { tx: total, glyphTx, glyphs: glyphTx.length };
    };

    const moveText = (tx, ty) => { tlm = mul([1, 0, 0, 1, tx, ty], tlm); tm = tlm; };

    const recordShow = async (opIndex, bytesToken, kind, elemIndex) => {
        const info = gs.fontName ? await resolveFont(gs.fontName) : null;
        const bytes = bytesToken.b;
        const m = mul(tm, gs.ctm);
        const record = {
            id: `s${analysis.shows.length}`, scope: scope.id, opIndex, kind, elemIndex,
            range: [bytesToken.s, bytesToken.e],
            x: applyMatrix(m, 0, gs.rise)[0], y: applyMatrix(m, 0, gs.rise)[1],
            width: 0, tx: 0, glyphs: 0,
            angle: Math.atan2(m[1], m[0]),
            sizeUser: Math.abs(gs.size) * Math.hypot(m[2], m[3]),
            textSize: gs.size, th: gs.th, fontName: gs.fontName, font: info,
            color: gs.fillSpace === 'Pattern' ? null : gs.fill, render: gs.render, unsafe: null,
        };
        if (!info) record.unsafe = 'font not found';
        else if (!info.supported) record.unsafe = info.reason;
        record.chained = !penMoved && lastShow !== null;
        record.prev = record.chained ? lastShow.id : null;
        if (record.unsafe) {
            analysis.shows.push(record);
            lastShow = record;
            penMoved = true;
            return record;
        }
        const { tx, glyphTx, glyphs } = advanceFor(bytes, info);
        record.tx = tx;
        record.glyphs = glyphs;
        record.glyphTx = glyphTx;
        record.bytes = bytes;
        record.scale = Math.hypot(m[0], m[1]);
        record.width = Math.abs(tx) * record.scale;
        if (scope.kind === 'form') {
            if (scope.formKey === null || (formUsage.get(scope.formKey) || 0) > 1) record.unsafe = 'shared form';
        }
        analysis.shows.push(record);
        tm = mul([1, 0, 0, 1, tx, 0], tm);
        lastShow = record;
        penMoved = false;
        return record;
    };

    for (let opIndex = 0; opIndex < ops.length; opIndex++) {
        const op = ops[opIndex];
        const a = op.args;
        const num = index => (a[index] && a[index].k === 'num' ? a[index].v : 0);
        switch (op.op) {
            case 'q': stack.push({ ...gs }); break;
            case 'Q': if (stack.length) gs = stack.pop(); break;
            case 'cm': if (a.length >= 6) gs.ctm = mul([num(0), num(1), num(2), num(3), num(4), num(5)], gs.ctm); break;
            case 'BT': tm = IDENT; tlm = IDENT; penMoved = true; break;
            case 'ET': penMoved = true; break;
            case 'Tc': gs.tc = num(0); break;
            case 'Tw': gs.tw = num(0); break;
            case 'Tz': gs.th = num(0) / 100; break;
            case 'TL': gs.tl = num(0); break;
            case 'Tr': gs.render = num(0); break;
            case 'Ts': gs.rise = num(0); break;
            case 'Tf':
                gs.fontName = a[0] && a[0].k === 'name' ? a[0].v : null;
                gs.size = num(1);
                break;
            case 'Td': moveText(num(0), num(1)); penMoved = true; break;
            case 'TD': gs.tl = -num(1); moveText(num(0), num(1)); penMoved = true; break;
            case 'Tm': tlm = [num(0), num(1), num(2), num(3), num(4), num(5)]; tm = tlm; penMoved = true; break;
            case 'T*': moveText(0, -gs.tl); penMoved = true; break;
            case 'Tj': {
                const token = a[a.length - 1];
                if (token && token.k === 'str') await recordShow(opIndex, token, 'Tj', 0);
                break;
            }
            case "'": {
                moveText(0, -gs.tl);
                penMoved = true;
                const token = a[a.length - 1];
                if (token && token.k === 'str') await recordShow(opIndex, token, "'", 0);
                break;
            }
            case '"': {
                gs.tw = num(0); gs.tc = num(1);
                moveText(0, -gs.tl);
                penMoved = true;
                const token = a[a.length - 1];
                if (token && token.k === 'str') await recordShow(opIndex, token, '"', 0);
                break;
            }
            case 'TJ': {
                const array = a[a.length - 1];
                if (!array || array.k !== 'arr') break;
                for (let i = 0; i < array.items.length; i++) {
                    const item = array.items[i];
                    if (item.k === 'str') await recordShow(opIndex, item, 'TJ', i);
                    else if (item.k === 'num') tm = mul([1, 0, 0, 1, (-item.v / 1000) * gs.size * gs.th, 0], tm);
                }
                break;
            }
            case 'g': gs.fill = colorFromOperands(a, 'DeviceGray'); gs.fillSpace = 'DeviceGray'; break;
            case 'rg': gs.fill = colorFromOperands(a, 'DeviceRGB'); gs.fillSpace = 'DeviceRGB'; break;
            case 'k': gs.fill = colorFromOperands(a, 'DeviceCMYK'); gs.fillSpace = 'DeviceCMYK'; break;
            case 'cs': {
                const name = a[0] && a[0].k === 'name' ? a[0].v : null;
                gs.fillSpace = name ? resolveColorSpace(resources, name) : null;
                gs.fill = gs.fillSpace === 'DeviceGray' ? '#000000' : gs.fillSpace === 'DeviceRGB' ? '#000000'
                    : gs.fillSpace === 'DeviceCMYK' ? '#000000' : null;
                break;
            }
            case 'sc': case 'scn':
                gs.fill = gs.fillSpace === 'Pattern' ? null : colorFromOperands(a, gs.fillSpace);
                break;
            case 'w': gs.lw = num(0); break;
            case 'm': case 'l':
                if (pathFirst < 0) pathFirst = opIndex;
                pathPoints.push([num(0), num(1)]);
                break;
            case 'c':
                if (pathFirst < 0) pathFirst = opIndex;
                pathPoints.push([num(0), num(1)], [num(2), num(3)], [num(4), num(5)]);
                break;
            case 'v': case 'y':
                if (pathFirst < 0) pathFirst = opIndex;
                pathPoints.push([num(0), num(1)], [num(2), num(3)]);
                break;
            case 're':
                if (pathFirst < 0) pathFirst = opIndex;
                pathPoints.push([num(0), num(1)], [num(0) + num(2), num(1)], [num(0) + num(2), num(1) + num(3)], [num(0), num(1) + num(3)]);
                break;
            case 'W': case 'W*': clipNext = true; break;
            case 'S': case 's': case 'f': case 'F': case 'f*': case 'B': case 'B*': case 'b': case 'b*': case 'n': {
                if (pathFirst >= 0 && pathPoints.length && !clipNext && op.op !== 'n') {
                    const stroked = ['S', 's', 'B', 'B*', 'b', 'b*'].includes(op.op);
                    const points = pathPoints.map(([x, y]) => applyMatrix(gs.ctm, x, y));
                    const reach = stroked ? (gs.lw * Math.hypot(gs.ctm[0], gs.ctm[1])) / 2 : 0;
                    const xs = points.map(point => point[0]);
                    const ys = points.map(point => point[1]);
                    recordObject(analysis, scope, 'v', opIndex, gs.ctm, [Math.min(...xs) - reach, Math.min(...ys) - reach, Math.max(...xs) + reach, Math.max(...ys) + reach],
                        { kind: 'path', ops: { first: pathFirst, paint: opIndex } });
                }
                pathFirst = -1;
                pathPoints = [];
                clipNext = false;
                break;
            }
            case 'Do': {
                const name = a[0] && a[0].k === 'name' ? a[0].v : null;
                if (!name) break;
                const xobjects = asDict(getEntry(resources, 'XObject'));
                const raw = xobjects ? getRawEntry(xobjects, name) : undefined;
                const object = raw === undefined ? null : analysis.pdfDoc.context.lookup(raw);
                const dict = asDict(object);
                if (!dict) break;
                const subtype = nameOf(getEntry(dict, 'Subtype'));
                if (subtype === 'Image') {
                    recordImage(analysis, scope, opIndex, gs.ctm, {
                        kind: 'image', name,
                        pixelWidth: numberOf(getEntry(dict, 'Width')), pixelHeight: numberOf(getEntry(dict, 'Height')),
                        isMask: getEntry(dict, 'ImageMask')?.toString?.() === 'true',
                    });
                } else if (subtype === 'Form' && depth < MAX_FORM_DEPTH) {
                    const key = raw instanceof L.PDFRef ? raw.tag : null;
                    if (key && activeForms.has(key)) break;
                    const matrix = arrayNumbers(getEntry(dict, 'Matrix')) || IDENT;
                    let formBytes;
                    try { formBytes = streamBytes(object); } catch { break; }
                    analysis.formDo[key] = (analysis.formDo[key] || 0) + 1;
                    const child = {
                        id: analysis.scopes.length, kind: 'form', buf: formBytes, ops: parseContent(formBytes),
                        ref: raw instanceof L.PDFRef ? raw : null, stream: object, formKey: key,
                        resources: asDict(getEntry(dict, 'Resources')) || resources,
                    };
                    analysis.scopes.push(child);
                    if (key) activeForms.add(key);
                    const showsBefore = analysis.shows.length;
                    const objectsBefore = analysis.images.length;
                    await walkScope(analysis, child, { ...gs, ctm: mul(matrix, gs.ctm) }, depth + 1, formUsage, activeForms);
                    if (key) activeForms.delete(key);
                    // A form with no text (a logo, a figure) is one object: select and move it whole instead of
                    // its parts. A form with text keeps its parts individually editable.
                    const box = arrayNumbers(getEntry(dict, 'BBox'));
                    if (analysis.shows.length === showsBefore && box && box.length === 4) {
                        const corners = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]]
                            .map(([x, y]) => applyMatrix(mul(matrix, gs.ctm), x, y));
                        const xs = corners.map(point => point[0]);
                        const ys = corners.map(point => point[1]);
                        const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
                        if ((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) <= analysis.pageArea * 0.85) {
                            analysis.images.length = objectsBefore;
                            recordObject(analysis, scope, 'f', opIndex, gs.ctm, bbox, { kind: 'form', name });
                        }
                    }
                }
                break;
            }
            case 'BI': {
                const dict = {};
                for (let i = 0; i + 1 < a.length; i += 2) if (a[i].k === 'name') dict[a[i].v] = a[i + 1];
                recordImage(analysis, scope, opIndex, gs.ctm, {
                    kind: 'inline-image', name: null,
                    pixelWidth: dict.W?.v ?? dict.Width?.v ?? null, pixelHeight: dict.H?.v ?? dict.Height?.v ?? null,
                });
                break;
            }
            default: break;
        }
    }
}

function recordImage(analysis, scope, opIndex, ctm, extra) {
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => applyMatrix(ctm, x, y));
    const xs = corners.map(point => point[0]);
    const ys = corners.map(point => point[1]);
    recordObject(analysis, scope, 'i', opIndex, ctm, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], extra);
}

/** Registers something the user can select, move or delete: an image, a painted path, or a drawn form. */
function recordObject(analysis, scope, prefix, opIndex, ctm, bbox, extra) {
    if (bbox[2] - bbox[0] < 1 && bbox[3] - bbox[1] < 1) return;
    if (prefix === 'i' && (bbox[2] - bbox[0] < 1 || bbox[3] - bbox[1] < 1)) return;
    const record = {
        id: `${prefix}${analysis.objectCounter++}`, scope: scope.id, opIndex, ctm, bbox, ...extra,
        unsafe: scope.kind === 'form' && (scope.formKey === null || (computeFormUsage(analysis.pdfDoc).get(scope.formKey) || 0) > 1)
            ? 'shared form' : null,
    };
    analysis.images.push(record);
}

const MAX_VECTOR_OBJECTS = 300;

// Pages can hold thousands of paths (charts, maps, outlined text). Keep the ones a person would grab.
function pruneVectorObjects(analysis) {
    const vectors = [];
    for (const object of analysis.images) {
        if (object.kind !== 'path') continue;
        const width = object.bbox[2] - object.bbox[0];
        const height = object.bbox[3] - object.bbox[1];
        const long = Math.max(width, height);
        const thin = Math.min(width, height) < 3;
        if (width * height > analysis.pageArea * 0.85) continue;          // the page background
        if (long < 8 || (!thin && width * height < 36)) continue;         // specks and outlined glyph parts
        vectors.push(object);
    }
    vectors.sort((p, q) => (q.bbox[2] - q.bbox[0]) * (q.bbox[3] - q.bbox[1]) - (p.bbox[2] - p.bbox[0]) * (p.bbox[3] - p.bbox[1]));
    const kept = new Set(vectors.slice(0, MAX_VECTOR_OBJECTS));
    analysis.images = analysis.images.filter(object => object.kind !== 'path' || kept.has(object));
}

// ---------------------------------------------
// Matching a text line (as reported by PDF.js) to the drawing operations
// ---------------------------------------------

/**
 * `run` describes one line of text in page user space:
 *   { x, y, width, fontSize, angle }   (origin on the baseline, y up)
 * Finds the glyphs that draw it. `safe: false` means the caller must cover the
 * text instead of removing it. On success `removals` maps a show id to the set
 * of glyph indexes inside that show that belong to the run.
 */
export function matchRun(analysis, run) {
    const cos = Math.cos(run.angle || 0);
    const sin = Math.sin(run.angle || 0);
    const fontSize = Math.max(run.fontSize, 1);
    const verticalTolerance = fontSize * 0.35;
    const edge = fontSize * 0.02;
    const removals = new Map();
    const hits = [];
    const glyphs = [];
    let coveredWidth = 0;
    let unsafeReason = null;

    for (const show of analysis.shows) {
        if (show.render === 3) continue;
        const dx = show.x - run.x;
        const dy = show.y - run.y;
        const across = -dx * sin + dy * cos;
        if (Math.abs(across) > verticalTolerance) continue;
        if (Math.abs(show.sizeUser - fontSize) > fontSize * 0.25) continue;
        const startAlong = dx * cos + dy * sin;
        if (startAlong > run.width + fontSize || startAlong + show.width < -fontSize) continue;
        if (show.unsafe) { unsafeReason = unsafeReason || show.unsafe; continue; }

        const picked = new Set();
        let cursor = startAlong;
        let first = null;
        let last = null;
        show.glyphTx.forEach((tx, index) => {
            const advance = tx * show.scale;
            const center = cursor + advance / 2;
            if (center >= -edge && center <= run.width + edge) {
                picked.add(index);
                glyphs.push({ showId: show.id, index, start: cursor, advance, tx, center, showStart: startAlong });
                coveredWidth += Math.abs(advance);
                if (first === null) first = cursor;
                last = cursor + advance;
            }
            cursor += advance;
        });
        if (!picked.size) continue;
        removals.set(show.id, picked);
        hits.push({ show, picked, first, last });
    }

    glyphs.sort((p, q) => p.start - q.start);
    const result = { removals, glyphs, ids: [...removals.keys()], safe: false, reason: null, style: null };
    if (!hits.length) { result.reason = unsafeReason || 'no matching drawing operation'; return result; }
    if (unsafeReason) { result.reason = unsafeReason; return result; }
    if (coveredWidth < run.width * 0.8) { result.reason = 'could not account for the whole line'; return result; }
    if (coveredWidth > run.width + fontSize * 0.8) { result.reason = 'drawing operation covers more than the line'; return result; }

    result.safe = true;
    const dominant = hits.slice().sort((p, q) => q.picked.size - p.picked.size)[0].show;
    result.style = {
        baseFont: dominant.font?.baseFont || '', family: dominant.font?.family || 'sans',
        bold: Boolean(dominant.font?.bold), italic: Boolean(dominant.font?.italic), color: dominant.color,
    };
    return result;
}

/**
 * True when every show from `firstId` to `lastId` (in drawing order) continues the
 * pen position of the one before it, so a gap inserted in the first shifts the rest.
 */
export function isChain(analysis, firstId, lastId) {
    const first = analysis.shows.findIndex(show => show.id === firstId);
    const last = analysis.shows.findIndex(show => show.id === lastId);
    if (first < 0 || last < first) return false;
    for (let i = first + 1; i <= last; i++) {
        if (!analysis.shows[i].chained || analysis.shows[i].prev !== analysis.shows[i - 1].id) return false;
    }
    return true;
}

/** Best-effort style lookup that does not require a safe match (used for font/colour hints). */
export function styleForRun(analysis, run) {
    const match = matchRun(analysis, run);
    if (match.style) return match.style;
    const nearby = analysis.shows.find(show => show.font && Math.abs(show.y - run.y) < run.fontSize * 0.35
        && Math.abs(show.x - run.x) < run.width);
    return nearby ? {
        baseFont: nearby.font.baseFont, family: nearby.font.family, bold: Boolean(nearby.font.bold),
        italic: Boolean(nearby.font.italic), color: nearby.color,
    } : null;
}

// ---------------------------------------------
// Rewriting
// ---------------------------------------------
const encoder = new TextEncoder();
const fmt = value => {
    const text = (Math.round(value * 1000) / 1000).toString();
    return text === '-0' ? '0' : text;
};

function sliceText(buf, start, end) {
    return new TextDecoder('latin1').decode(buf.subarray(start, end));
}

/**
 * edits: {
 *   removals: Map<showId, Set<glyphIndex>>,   // from matchRun(); later text keeps its position
 *   glyphEdits: Map<showId, { removed:Set<glyphIndex>, keepAdvance:boolean, insertions:Map<glyphIndex, gapTx> }>,
 *   deleteImages: Set<imageId>,
 *   imageMatrices: Map<imageId, [a,b,c,d,e,f]>   // new placement matrix in page space
 * }
 * Returns { scopeId -> Uint8Array } for every scope that changed.
 */
export function buildPatchedScopes(analysis, edits) {
    const removals = edits.removals || new Map();
    const deleteImages = edits.deleteImages || new Set();
    const imageMatrices = edits.imageMatrices || new Map();
    const perScope = new Map();
    const addEdit = (scopeId, edit) => {
        if (!perScope.has(scopeId)) perScope.set(scopeId, []);
        perScope.get(scopeId).push(edit);
    };

    const showsById = new Map(analysis.shows.map(show => [show.id, show]));
    // `removals` (whole lines) keep their advance so later text stays put; `glyphEdits` give
    // full control: surviving glyphs stay, removed ones vanish, and gaps are inserted by index.
    const specs = new Map();
    for (const [id, removed] of removals) specs.set(id, { removed, keepAdvance: true, insertions: new Map() });
    for (const [id, spec] of (edits.glyphEdits || new Map())) specs.set(id, spec);
    const showsByOp = new Map();
    for (const [id, spec] of specs) {
        const show = showsById.get(id);
        if (!show || (!spec.removed.size && !spec.insertions.size)) continue;
        const key = `${show.scope}:${show.opIndex}`;
        if (!showsByOp.has(key)) showsByOp.set(key, []);
        showsByOp.get(key).push({ show, spec });
    }
    // Turns one string into a TJ element list: surviving glyphs stay as strings and every
    // removed or inserted span becomes a numeric gap that positions what follows.
    const rebuildElements = ({ show, spec }) => {
        const step = show.font.codeBytes;
        const divisor = show.textSize * show.th;
        const items = [];
        let kept = [];
        let gap = 0;
        const flushKept = () => {
            if (!kept.length) return;
            items.push(`<${kept.map(byte => byte.toString(16).padStart(2, '0')).join('')}>`);
            kept = [];
        };
        const flushGap = () => {
            if (gap === 0) return;
            items.push(fmt(Math.abs(divisor) < 1e-9 ? 0 : (-gap * 1000) / divisor));
            gap = 0;
        };
        for (let index = 0; index <= show.glyphTx.length; index++) {
            const inserted = spec.insertions.get(index);
            if (inserted) { flushKept(); gap += inserted; }
            if (index === show.glyphTx.length) break;
            if (spec.removed.has(index)) {
                flushKept();
                if (spec.keepAdvance) gap += show.glyphTx[index];
            } else {
                flushGap();
                for (let b = 0; b < step; b++) kept.push(show.bytes[index * step + b]);
            }
        }
        flushKept();
        flushGap();
        return items.join(' ');
    };
    for (const [key, entries] of showsByOp) {
        const [scopeId, opIndex] = key.split(':').map(Number);
        const scope = analysis.scopes[scopeId];
        const op = scope.ops[opIndex];
        if (op.op === 'TJ') {
            for (const entry of entries) addEdit(scopeId, { s: entry.show.range[0], e: entry.show.range[1], text: ` ${rebuildElements(entry)} ` });
        } else {
            const adjustment = `[${rebuildElements(entries[0])}] TJ`;
            let replacement;
            if (op.op === "'") replacement = `T* ${adjustment}`;
            else if (op.op === '"') {
                const aw = sliceText(scope.buf, op.args[0].s, op.args[0].e);
                const ac = sliceText(scope.buf, op.args[1].s, op.args[1].e);
                replacement = `${aw} Tw ${ac} Tc T* ${adjustment}`;
            } else replacement = adjustment;
            addEdit(scopeId, { s: op.s, e: op.e, text: ` ${replacement} ` });
        }
    }

    for (const image of analysis.images) {
        const scope = analysis.scopes[image.scope];
        if (image.kind === 'path') {
            const first = scope.ops[image.ops.first];
            const paint = scope.ops[image.ops.paint];
            if (deleteImages.has(image.id)) {
                // Ending the path without painting it discards it; any clipping already set stays.
                addEdit(image.scope, { s: paint.s, e: paint.e, text: ' n ' });
            } else if (imageMatrices.has(image.id)) {
                const inverse = invert(image.ctm);
                if (!inverse) continue;
                const delta = mul(imageMatrices.get(image.id), inverse);
                addEdit(image.scope, { s: first.s, e: first.s, text: ` q ${delta.map(fmt).join(' ')} cm ` });
                addEdit(image.scope, { s: paint.e, e: paint.e, text: ' Q ' });
            }
            continue;
        }
        const op = scope.ops[image.opIndex];
        if (deleteImages.has(image.id)) {
            addEdit(image.scope, { s: op.s, e: op.e, text: ' ' });
        } else if (imageMatrices.has(image.id)) {
            const inverse = invert(image.ctm);
            if (!inverse) continue;
            const delta = mul(imageMatrices.get(image.id), inverse);
            // The original operator (an inline image carries raw binary data) is copied as bytes, never as text.
            const head = encoder.encode(` q ${delta.map(fmt).join(' ')} cm `);
            const original = scope.buf.subarray(op.s, op.e);
            const tail = encoder.encode(' Q ');
            const bytes = new Uint8Array(head.length + original.length + tail.length);
            bytes.set(head, 0);
            bytes.set(original, head.length);
            bytes.set(tail, head.length + original.length);
            addEdit(image.scope, { s: op.s, e: op.e, bytes });
        }
    }

    const patched = new Map();
    for (const [scopeId, list] of perScope) {
        const { buf } = analysis.scopes[scopeId];
        list.sort((p, q) => p.s - q.s);
        const parts = [];
        let cursor = 0;
        for (const edit of list) {
            if (edit.s < cursor) continue;
            parts.push(buf.subarray(cursor, edit.s), edit.bytes || encoder.encode(edit.text));
            cursor = edit.e;
        }
        parts.push(buf.subarray(cursor));
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const part of parts) { out.set(part, offset); offset += part.length; }
        patched.set(scopeId, out);
    }
    return patched;
}

/**
 * Writes patched scopes back into the document and discards the replaced
 * streams so the removed content is not left behind as unreferenced objects.
 */
export function commitPatchedScopes(pdfDoc, analysis, patched) {
    const context = pdfDoc.context;
    for (const [scopeId, bytes] of patched) {
        const scope = analysis.scopes[scopeId];
        if (scope.kind === 'page') {
            const page = pdfDoc.getPages()[analysis.pageIndex];
            const ref = context.register(context.flateStream(bytes));
            page.node.set(L.PDFName.of('Contents'), ref);
            scope.refs.forEach(oldRef => {
                if (oldRef && !isReferencedElsewhere(pdfDoc, oldRef, analysis.pageIndex)) context.delete(oldRef);
            });
        } else if (scope.ref) {
            const original = scope.stream.dict;
            const dict = {};
            for (const [key, value] of original.entries()) {
                const name = key.decodeText();
                if (['Length', 'Filter', 'DecodeParms', 'F', 'FFilter', 'FDecodeParms', 'DL'].includes(name)) continue;
                dict[name] = value;
            }
            context.assign(scope.ref, context.stream(bytes, dict));
        }
    }
}

function isReferencedElsewhere(pdfDoc, ref, exceptPageIndex) {
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
        if (i === exceptPageIndex) continue;
        const { refs } = lookupPageContents(pdfDoc, pages[i].node);
        if (refs.some(other => other && other.tag === ref.tag)) return true;
    }
    return false;
}

// ---------------------------------------------
// Erasing everything under a region (whiteout and redaction)
// ---------------------------------------------

/**
 * Finds the text and images that lie under `rects` (page space: { x0, y0, x1, y1 }).
 * mode 'center': a glyph goes if its centre is inside, an image only if it is fully inside.
 * mode 'touch':  anything that overlaps goes (redaction).
 * Returns the glyph edits and image ids to remove, plus `blocked`: content under a region
 * that cannot be removed safely (the caller should flatten the page instead).
 */
export function findContentInRects(analysis, rects, mode = 'center') {
    const glyphEdits = new Map();
    const imageIds = new Set();
    const blocked = [];
    const intersects = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    const inside = (point, rect) => point[0] >= rect.x0 && point[0] <= rect.x1 && point[1] >= rect.y0 && point[1] <= rect.y1;

    for (const show of analysis.shows) {
        const cos = Math.cos(show.angle);
        const sin = Math.sin(show.angle);
        const up = show.sizeUser * 0.92;
        const down = show.sizeUser * 0.25;
        // Without a width table the extent of the text is unknown: be conservative.
        if (!show.glyphTx) {
            const reach = Math.max(show.sizeUser * 40, 200);
            const guess = { x0: Math.min(show.x, show.x + cos * reach) - 1, x1: Math.max(show.x, show.x + cos * reach) + 1,
                y0: Math.min(show.y - down, show.y + up) - 1, y1: Math.max(show.y + up, show.y - down) + 1 };
            if (rects.some(rect => intersects(guess, rect))) blocked.push({ kind: 'text', reason: show.unsafe || 'unknown extent' });
            continue;
        }
        let cursor = 0;
        const removed = new Set();
        show.glyphTx.forEach((tx, index) => {
            const advance = tx * show.scale;
            const startX = show.x + cursor * cos;
            const startY = show.y + cursor * sin;
            const endX = startX + advance * cos;
            const endY = startY + advance * sin;
            const xs = [startX - sin * -down, startX - sin * up, endX - sin * -down, endX - sin * up];
            const ys = [startY + cos * -down, startY + cos * up, endY + cos * -down, endY + cos * up];
            const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
            const centre = [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2];
            const hit = rects.some(rect => (mode === 'touch' ? intersects(box, rect) : inside(centre, rect)));
            if (hit) removed.add(index);
            cursor += advance;
        });
        if (!removed.size) continue;
        if (show.unsafe) { blocked.push({ kind: 'text', reason: show.unsafe }); continue; }
        glyphEdits.set(show.id, { removed, keepAdvance: true, insertions: new Map() });
    }

    for (const image of analysis.images) {
        if (image.kind !== 'image' && image.kind !== 'inline-image') continue;
        const box = { x0: image.bbox[0], y0: image.bbox[1], x1: image.bbox[2], y1: image.bbox[3] };
        const hit = rects.some(rect => (mode === 'touch'
            ? intersects(box, rect)
            : box.x0 >= rect.x0 - 0.5 && box.x1 <= rect.x1 + 0.5 && box.y0 >= rect.y0 - 0.5 && box.y1 <= rect.y1 + 0.5));
        if (!hit) continue;
        if (image.unsafe) blocked.push({ kind: 'image', reason: image.unsafe });
        else imageIds.add(image.id);
    }
    return { glyphEdits, imageIds, blocked };
}
