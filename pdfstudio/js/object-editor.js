/* =============================================
   PDF Studio — editing the objects already in a PDF

   Every line of text and every image on the page becomes a live object:
   click text to edit it in place, drag anything to move it, press Delete to
   remove it. On export the original glyphs and images are removed from the
   page's drawing instructions (see pdf-content.js); only content that cannot be
   removed safely is covered instead.
   ============================================= */
import {
    setPdfLib, analyzePage, matchRun, styleForRun, buildPatchedScopes, commitPatchedScopes, mul, findContentInRects,
} from './pdf-content.js';
import {
    TextEmbedder, CSS_FAMILY, FAMILY_LABELS, baselineRatio, ensureWebFont,
} from './pdf-fonts.js';
import { planSurgicalEdit, planStyledPieces } from './text-edit-plan.js';
import { openPdfDocument } from './pdfjs-config.js';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const DRAG_THRESHOLD = 4;
const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 300;

const rgbToHex = (r, g, b) => `#${[r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
function hexToRgb01(hex) {
    const clean = String(hex || '#000000').replace('#', '').padEnd(6, '0');
    return [0, 2, 4].map(i => (parseInt(clean.slice(i, i + 2), 16) || 0) / 255);
}

// ---------------------------------------------
// Building text lines from PDF.js output
// ---------------------------------------------
function guessStyle(style) {
    const name = String(style?.fontFamily || '').toLowerCase();
    const mono = /mono|courier|consol|menlo/.test(name);
    const serif = !mono && ((/serif/.test(name) && !/sans/.test(name)) || /times|georgia|garamond|palatino|cambria|book/.test(name));
    return {
        family: mono ? 'mono' : serif ? 'serif' : 'sans',
        bold: /bold|black|heavy/.test(name), italic: /italic|oblique/.test(name), color: null,
    };
}

/**
 * Groups PDF.js text items into editable lines: items on one baseline with
 * small gaps become a single run. Wide gaps (table columns) stay separate.
 */
export function buildRuns(content) {
    const styles = content.styles || {};
    const raw = [];
    content.items.forEach((item, index) => {
        if (!item.str || !item.str.trim() || !item.transform) return;
        const style = styles[item.fontName];
        if (style?.vertical) return;
        const [a, b, c, d, e, f] = item.transform;
        const size = Math.hypot(c, d) || Math.hypot(a, b);
        if (!(size > 0.5) || !(item.width >= 0)) return;
        raw.push({ index, str: item.str, x: e, y: f, width: item.width, size, angle: Math.atan2(b, a), style });
    });

    const buckets = [];
    for (const item of raw) {
        let bucket = buckets.find(candidate => Math.abs(Math.atan2(Math.sin(candidate.angle - item.angle), Math.cos(candidate.angle - item.angle))) < 0.03);
        if (!bucket) { bucket = { angle: item.angle, items: [] }; buckets.push(bucket); }
        bucket.items.push(item);
    }

    const runs = [];
    for (const bucket of buckets) {
        const cos = Math.cos(bucket.angle);
        const sin = Math.sin(bucket.angle);
        for (const item of bucket.items) {
            item.along = item.x * cos + item.y * sin;
            item.perp = -item.x * sin + item.y * cos;
        }
        bucket.items.sort((p, q) => q.perp - p.perp);
        const lines = [];
        for (const item of bucket.items) {
            const line = lines[lines.length - 1];
            if (line && Math.abs(line.perp - item.perp) <= 0.3 * Math.min(line.size, item.size)) line.items.push(item);
            else lines.push({ perp: item.perp, size: item.size, items: [item] });
        }
        for (const line of lines) {
            line.items.sort((p, q) => p.along - q.along);
            let current = null;
            for (const item of line.items) {
                const gap = current ? item.along - current.end : 0;
                const ratio = current ? Math.max(item.size, current.size) / Math.min(item.size, current.size) : 1;
                if (current && gap <= Math.max(item.size, current.size) && gap >= -0.6 * Math.min(item.size, current.size) && ratio <= 1.2) {
                    const needSpace = gap > 0.12 * item.size && !/\s$/.test(current.text) && !/^\s/.test(item.str);
                    if (needSpace) current.segments.push({ text: ' ', start: current.end - current.first.along, width: 0, synthetic: true });
                    current.text += (needSpace ? ' ' : '') + item.str;
                    current.segments.push({ text: item.str, start: item.along - current.first.along, width: item.width, synthetic: false });
                    current.end = Math.max(current.end, item.along + item.width);
                    current.items.push(item);
                } else {
                    current = {
                        first: item, text: item.str, end: item.along + item.width, size: item.size, items: [item], angle: bucket.angle,
                        segments: [{ text: item.str, start: 0, width: item.width, synthetic: false }],
                    };
                    runs.push(current);
                }
            }
        }
    }

    return runs.map(run => {
        const dominant = run.items.slice().sort((p, q) => q.str.length - p.str.length)[0];
        const indexes = run.items.map(item => item.index);
        return {
            id: `r${Math.min(...indexes)}`,
            text: run.text.replace(/\s+$/, ''),
            fullText: run.text,
            segments: run.segments,
            x: run.first.x, y: run.first.y,
            width: Math.max(run.end - run.first.along, 0.5),
            fontSize: dominant.size, angle: run.angle,
            ascent: clamp(dominant.style?.ascent ?? 0.9, 0.75, 1.0),
            descent: clamp(-(dominant.style?.descent ?? -0.2), 0.15, 0.35),
            guess: guessStyle(dominant.style),
        };
    }).filter(run => run.text.trim());
}

// ---------------------------------------------
// Editor
// ---------------------------------------------
export function createObjectEditor({ state, dom, showToast, saveHistory }) {
    let ui = null;
    let renderToken = 0;
    let analysisCache = { bytes: null, docPromise: null, pages: new Map() };
    let toolbar = null;
    // While the pointer is on the toolbar, a blur in the text must not dismiss it.
    let toolbarBusy = false;

    // ----- analysis ------------------------------------------------------
    function getAnalysis(pageNum) {
        setPdfLib(window.PDFLib);
        if (analysisCache.bytes !== state.pdfBytes) {
            const bytes = state.pdfBytes;
            analysisCache = {
                bytes,
                docPromise: window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false }).catch(() => null),
                pages: new Map(),
            };
        }
        const cache = analysisCache;
        if (!cache.pages.has(pageNum)) {
            cache.pages.set(pageNum, cache.docPromise.then(doc => (doc ? analyzePage(doc, pageNum - 1) : null)).catch(() => null));
        }
        return cache.pages.get(pageNum);
    }

    // ----- state helpers ---------------------------------------------------
    const textEntries = pageNum => state.modifiedText[pageNum] || {};
    const imageEntries = pageNum => state.modifiedImages[pageNum] || {};

    function toScreen(x, y) { return ui.viewport.convertToViewportPoint(x, y); }
    function toPage(x, y) { return ui.viewport.convertToPdfPoint(x, y); }

    function sampleRegion(rect, mode) {
        const canvas = state.rasterCanvas;
        if (!canvas) return null;
        try {
            const context = canvas.getContext('2d', { willReadFrequently: true });
            const x0 = clamp(Math.floor(rect.left), 0, canvas.width - 1);
            const y0 = clamp(Math.floor(rect.top), 0, canvas.height - 1);
            const x1 = clamp(Math.ceil(rect.right), x0 + 1, canvas.width);
            const y1 = clamp(Math.ceil(rect.bottom), y0 + 1, canvas.height);
            if (mode === 'background') {
                const points = [];
                const margin = 3;
                const midY = (y0 + y1) / 2;
                const midX = (x0 + x1) / 2;
                [[x0 - margin, midY], [x1 + margin, midY], [midX, y0 - margin], [midX, y1 + margin],
                    [x0 - margin, y0 - margin], [x1 + margin, y1 + margin]].forEach(([px, py]) => {
                    if (px >= 0 && py >= 0 && px < canvas.width && py < canvas.height) {
                        const data = context.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
                        if (data[3] > 0) points.push(data);
                    }
                });
                if (!points.length) return '#ffffff';
                const total = points.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0]);
                return rgbToHex(total[0] / points.length, total[1] / points.length, total[2] / points.length);
            }
            const data = context.getImageData(x0, y0, x1 - x0, y1 - y0).data;
            const background = sampleRegion(rect, 'background');
            const [br, bg, bb] = hexToRgb01(background).map(v => v * 255);
            const buckets = new Map();
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 180) continue;
                if (Math.hypot(data[i] - br, data[i + 1] - bg, data[i + 2] - bb) < 60) continue;
                const key = [data[i], data[i + 1], data[i + 2]].map(v => Math.round(v / 24) * 24).join(',');
                buckets.set(key, (buckets.get(key) || 0) + 1);
            }
            const winner = [...buckets.entries()].sort((p, q) => q[1] - p[1])[0];
            return winner ? rgbToHex(...winner[0].split(',').map(Number)) : '#000000';
        } catch {
            return mode === 'background' ? '#ffffff' : '#000000';
        }
    }

    // ----- geometry ---------------------------------------------------------
    // Places a baseline-anchored box: (x, y) is the text origin in page space.
    function place(element, { x, y, angle }, widthUser, ascent, descent) {
        const p = toScreen(x, y);
        const q = toScreen(x + Math.cos(angle), y + Math.sin(angle));
        const rotation = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const scale = ui.viewport.scale;
        const top = ascent * scale;
        element.style.left = `${p[0]}px`;
        element.style.top = `${p[1] - top}px`;
        element.style.width = widthUser == null ? 'max-content' : `${widthUser * scale}px`;
        element.style.height = `${(ascent + descent) * scale}px`;
        element.style.transformOrigin = `0 ${top}px`;
        element.style.transform = Math.abs(rotation) > 1e-4 ? `rotate(${rotation}rad)` : '';
    }

    function screenRectOfBox(element) {
        const wrapper = dom.pdfPageWrapper.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return { left: rect.left - wrapper.left, top: rect.top - wrapper.top, right: rect.right - wrapper.left, bottom: rect.bottom - wrapper.top };
    }

    // ----- rendering --------------------------------------------------------
    async function render({ page, viewport, pageNum }) {
        const token = ++renderToken;
        deselect();
        dom.textLayer.replaceChildren();
        ui = { pageNum, viewport, runs: new Map(), images: new Map(), selection: null, editing: null, previews: new Map() };
        ensureToolbar();
        let content;
        try { content = await page.getTextContent(); } catch { content = { items: [], styles: {} }; }
        if (token !== renderToken) return;
        ensureWebFont('sans', false, false);

        const covers = document.createDocumentFragment();
        const boxes = document.createDocumentFragment();
        for (const run of buildRuns(content)) {
            ui.runs.set(run.id, { data: run, cover: null, box: null, text: null });
            const record = ui.runs.get(run.id);
            record.cover = document.createElement('div');
            record.cover.className = 'pdf-cover';
            record.cover.hidden = true;
            covers.appendChild(record.cover);
            createRunBox(record);
            boxes.appendChild(record.box);
        }
        dom.textLayer.append(covers, boxes);
        ui.runs.forEach(record => refreshRun(record));

        getAnalysis(pageNum).then(analysis => {
            if (token !== renderToken || !analysis || analysis.failed) return;
            ui.analysis = analysis;
            ui.runs.forEach(record => {
                const style = styleForRun(analysis, { x: record.data.x, y: record.data.y, width: record.data.width, fontSize: record.data.fontSize, angle: record.data.angle });
                if (style) record.data.docStyle = style;
            });
            // Stacking, bottom to top: grouped graphics, shapes, then pictures, all beneath the text.
            const stacking = { form: 0, path: 1, image: 2, 'inline-image': 2 };
            const covers = document.createDocumentFragment();
            const boxes = document.createDocumentFragment();
            analysis.images.filter(object => !object.unsafe).sort((p, q) => stacking[p.kind] - stacking[q.kind]).forEach(object => {
                const record = { data: object, cover: null, box: null };
                ui.images.set(object.id, record);
                record.cover = document.createElement('div');
                record.cover.className = 'pdf-cover';
                record.cover.hidden = true;
                covers.append(record.cover);
                createImageBox(record);
                boxes.append(record.box);
            });
            dom.textLayer.prepend(covers, boxes);
            ui.images.forEach(record => refreshImage(record));
        });
    }

    function defaultsFor(record) {
        const doc = record.data.docStyle;
        const guess = record.data.guess;
        return {
            family: doc?.family || guess.family,
            bold: doc ? Boolean(doc.bold) : guess.bold,
            italic: doc ? Boolean(doc.italic) : guess.italic,
            color: doc?.color || null,
            fontSize: record.data.fontSize,
        };
    }

    function ensureTextEntry(record) {
        const run = record.data;
        const pageEntries = (state.modifiedText[ui.pageNum] ||= {});
        if (!pageEntries[run.id]) {
            const defaults = defaultsFor(record);
            const scale = ui.viewport.scale;
            const origin = toScreen(run.x, run.y);
            const originalRect = {
                left: origin[0], right: origin[0] + run.width * scale,
                top: origin[1] - run.ascent * run.fontSize * scale, bottom: origin[1] + run.descent * run.fontSize * scale,
            };
            const color = defaults.color || sampleRegion(originalRect, 'foreground');
            pageEntries[run.id] = {
                runId: run.id, originalText: run.text, newText: run.text, deleted: false,
                orig: {
                    x: run.x, y: run.y, width: run.width, fontSize: run.fontSize, angle: run.angle, ascent: run.ascent, descent: run.descent,
                    segments: run.segments, fullText: run.fullText,
                },
                x: run.x, y: run.y, fontSize: defaults.fontSize, family: defaults.family, bold: defaults.bold, italic: defaults.italic,
                color, bg: sampleRegion(originalRect, 'background'),
                base: { family: defaults.family, bold: defaults.bold, italic: defaults.italic, fontSize: defaults.fontSize, color },
            };
        }
        return pageEntries[run.id];
    }

    function isPristine(entry) {
        return !entry.deleted && entry.newText === entry.originalText
            && Math.abs(entry.x - entry.orig.x) < 0.01 && Math.abs(entry.y - entry.orig.y) < 0.01
            && entry.family === entry.base.family && entry.bold === entry.base.bold && entry.italic === entry.base.italic
            && entry.color === entry.base.color && Math.abs(entry.fontSize - entry.base.fontSize) < 0.01;
    }

    function dropEntryIfPristine(record) {
        const entries = state.modifiedText[ui.pageNum];
        const entry = entries?.[record.data.id];
        if (entry && isPristine(entry)) {
            delete entries[record.data.id];
            if (!Object.keys(entries).length) delete state.modifiedText[ui.pageNum];
        }
    }

    function createRunBox(record) {
        const box = document.createElement('div');
        box.className = 'pdf-run';
        box.dataset.run = record.data.id;
        const text = document.createElement('span');
        text.className = 'pdf-run-text';
        box.appendChild(text);
        record.box = box;
        record.text = text;
        box.addEventListener('pointerdown', event => onRunPointerDown(event, record));
        box.addEventListener('keydown', event => onRunKeyDown(event, record));
        text.addEventListener('input', () => onRunInput(record));
        text.addEventListener('blur', () => { if (ui.editing === record) commitEdit(record); });
        text.addEventListener('paste', event => {
            event.preventDefault();
            const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/[\r\n]+/g, ' ');
            document.execCommand('insertText', false, pasted);
        });
    }

    // Brings one run's DOM (box, text, cover) in line with its saved entry.
    function refreshRun(record) {
        const run = record.data;
        const entry = textEntries(ui.pageNum)[run.id];
        const editing = ui.editing === record;
        const modified = Boolean(entry) && !isPristine(entry);
        const scale = ui.viewport.scale;
        record.box.classList.toggle('modified', modified && !entry.deleted);
        record.box.classList.toggle('deleted', Boolean(entry?.deleted));
        record.box.classList.toggle('editing', editing);
        record.box.classList.toggle('selected', ui.selection?.record === record);

        if (!entry || isPristine(entry) && !editing) {
            place(record.box, run, run.width, run.ascent * run.fontSize, run.descent * run.fontSize);
            record.text.style.display = 'none';
            record.cover.hidden = true;
            return;
        }

        const family = entry.family;
        const fontPx = entry.fontSize * scale;
        const ascent = run.ascent * entry.fontSize;
        const descent = run.descent * entry.fontSize;
        place(record.box, { x: entry.x, y: entry.y, angle: run.angle }, null, ascent, descent);
        record.text.style.display = 'block';
        record.text.style.fontFamily = CSS_FAMILY[family];
        record.text.style.fontSize = `${fontPx}px`;
        record.text.style.fontWeight = entry.bold ? '700' : '400';
        record.text.style.fontStyle = entry.italic ? 'italic' : 'normal';
        record.text.style.color = entry.color;
        record.text.style.top = `${ascent * scale - baselineRatio(family) * fontPx}px`;
        if (!editing && record.text.textContent !== entry.newText) record.text.textContent = entry.newText;
        fitBoxToText(record);

        // Cover the original pixels (screen preview only; the exported file has them removed).
        record.cover.hidden = false;
        place(record.cover, { x: entry.orig.x, y: entry.orig.y, angle: entry.orig.angle }, entry.orig.width + 0.15 * entry.orig.fontSize, (entry.orig.ascent + 0.04) * entry.orig.fontSize, (entry.orig.descent + 0.04) * entry.orig.fontSize);
        record.cover.style.marginLeft = `${-0.05 * entry.orig.fontSize * scale}px`;
        record.cover.style.background = entry.bg;
    }

    // The text span is absolutely positioned, so give its box the span's measured width.
    function fitBoxToText(record) {
        const measured = record.text.offsetWidth;
        const minimum = Math.max(record.data.width * ui.viewport.scale * 0.2, 12);
        record.box.style.width = `${Math.max(measured + 2, minimum)}px`;
    }

    // ----- interaction: text -------------------------------------------------
    function onRunPointerDown(event, record) {
        if (event.button !== 0 || ui.editing === record) return;
        const entry = textEntries(ui.pageNum)[record.data.id];
        if (entry?.deleted) return;
        event.preventDefault();
        event.stopPropagation();
        commitActiveEdit();
        select({ kind: 'run', record });

        const start = { x: event.clientX, y: event.clientY };
        const startPage = toPage(event.clientX - dom.pdfPageWrapper.getBoundingClientRect().left, event.clientY - dom.pdfPageWrapper.getBoundingClientRect().top);
        let origin = null;
        let dragging = false;
        const wrapper = dom.pdfPageWrapper.getBoundingClientRect();

        const onMove = move => {
            const dx = move.clientX - start.x;
            const dy = move.clientY - start.y;
            if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            if (!dragging) {
                dragging = true;
                const created = ensureTextEntry(record);
                origin = { x: created.x, y: created.y };
                record.box.classList.add('dragging');
            }
            const here = toPage(move.clientX - wrapper.left, move.clientY - wrapper.top);
            const current = ensureTextEntry(record);
            current.x = origin.x + (here[0] - startPage[0]);
            current.y = origin.y + (here[1] - startPage[1]);
            refreshRun(record);
            positionToolbar();
        };
        const onUp = up => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            record.box.classList.remove('dragging');
            if (dragging) {
                dropEntryIfPristine(record);
                refreshRun(record);
                saveHistory();
            } else {
                startEdit(record, { x: up.clientX, y: up.clientY });
            }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    // Editing must begin in the same tick as the click: keystrokes arrive immediately and would be lost.
    // The font loads in the background and the line is re-laid-out when it is ready.
    function startEdit(record, point) {
        if (ui.editing === record) return;
        commitActiveEdit();
        const entry = ensureTextEntry(record);
        if (entry.deleted) return;
        ensureWebFont(entry.family, entry.bold, entry.italic).then(() => {
            if (ui?.runs.get(record.data.id) === record) refreshRun(record);
        });
        ui.editing = record;
        record.editStart = { text: entry.newText };
        record.text.textContent = entry.newText;
        refreshRun(record);
        record.text.contentEditable = 'true';
        record.text.spellcheck = false;
        record.text.focus();
        const selection = window.getSelection();
        let range = null;
        if (point && document.caretPositionFromPoint) {
            const position = document.caretPositionFromPoint(point.x, point.y);
            if (position && record.text.contains(position.offsetNode)) {
                range = document.createRange();
                range.setStart(position.offsetNode, position.offset);
            }
        } else if (point && document.caretRangeFromPoint) {
            const candidate = document.caretRangeFromPoint(point.x, point.y);
            if (candidate && record.text.contains(candidate.startContainer)) range = candidate;
        }
        if (!range) { range = document.createRange(); range.selectNodeContents(record.text); range.collapse(false); }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        updateToolbar();
        positionToolbar();
    }

    function onRunInput(record) {
        const entry = ensureTextEntry(record);
        entry.newText = record.text.textContent.replace(/[\r\n]+/g, ' ');
        fitBoxToText(record);
        positionToolbar();
    }

    function onRunKeyDown(event, record) {
        if (ui.editing !== record) return;
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); record.text.blur(); }
        else if (event.key === 'Escape') {
            event.preventDefault();
            const entry = ensureTextEntry(record);
            entry.newText = record.editStart.text;
            record.text.textContent = entry.newText;
            record.text.blur();
        }
    }

    function commitActiveEdit() {
        if (ui?.editing) commitEdit(ui.editing);
    }

    function commitEdit(record) {
        if (ui.editing !== record) return;
        ui.editing = null;
        record.text.contentEditable = 'false';
        window.getSelection()?.removeAllRanges();
        const entry = ensureTextEntry(record);
        const text = record.text.textContent.replace(/[\r\n]+/g, ' ');
        if (!text.trim()) {
            entry.deleted = true;
            entry.newText = '';
            showToast('Text deleted', 'info');
        } else {
            entry.newText = text;
        }
        const changed = entry.deleted || text !== record.editStart.text;
        dropEntryIfPristine(record);
        refreshRun(record);
        if (changed) saveHistory();
        if (!state.modifiedText[ui.pageNum]?.[record.data.id]) record.text.style.display = 'none';
        // Finishing an edit puts the line down; the toolbar returns when it is clicked again.
        if (entry.deleted || !toolbarBusy) deselect();
        else updateToolbar();
    }

    function deleteRun(record) {
        commitActiveEdit();
        const entry = ensureTextEntry(record);
        entry.deleted = true;
        entry.newText = '';
        refreshRun(record);
        deselect();
        saveHistory();
        showToast('Text deleted', 'info');
    }

    // ----- interaction: images -----------------------------------------------
    function createImageBox(record) {
        const box = document.createElement('div');
        const isPicture = record.data.kind === 'image' || record.data.kind === 'inline-image';
        box.className = `pdf-object ${isPicture ? 'pdf-image' : 'pdf-vector'}`;
        box.dataset.image = record.data.id;
        box.title = objectLabel(record);
        const handles = [];
        if (isAxisAligned(record.data.ctm)) {
            ['nw', 'ne', 'sw', 'se'].forEach(corner => {
                const handle = document.createElement('div');
                handle.className = `pdf-handle ${corner}`;
                handle.addEventListener('pointerdown', event => onImageResizeStart(event, record, corner));
                box.appendChild(handle);
                handles.push(handle);
            });
        }
        record.box = box;
        box.addEventListener('pointerdown', event => onImagePointerDown(event, record));
    }

    const objectLabel = record => ({ image: 'Image', 'inline-image': 'Image', path: 'Shape', form: 'Graphic' }[record.data.kind] || 'Object');
    const isAxisAligned = ctm => Math.abs(ctm[1]) < 1e-6 && Math.abs(ctm[2]) < 1e-6;

    function currentImageBox(record) {
        return imageEntries(ui.pageNum)[record.data.id]?.bbox || record.data.bbox;
    }

    function refreshImage(record) {
        const entry = imageEntries(ui.pageNum)[record.data.id];
        const bbox = currentImageBox(record);
        const a = toScreen(bbox[0], bbox[1]);
        const b = toScreen(bbox[2], bbox[3]);
        const left = Math.min(a[0], b[0]);
        const top = Math.min(a[1], b[1]);
        const width = Math.abs(a[0] - b[0]);
        const height = Math.abs(a[1] - b[1]);
        // Thin rules and tiny shapes still need something to grab.
        const grab = 14;
        const boxWidth = Math.max(width, grab);
        const boxHeight = Math.max(height, grab);
        Object.assign(record.box.style, {
            left: `${left - (boxWidth - width) / 2}px`, top: `${top - (boxHeight - height) / 2}px`,
            width: `${boxWidth}px`, height: `${boxHeight}px`,
        });
        record.box.classList.toggle('selected', ui.selection?.record === record);
        record.box.classList.toggle('deleted', Boolean(entry?.deleted));
        record.box.classList.toggle('modified', Boolean(entry) && !entry.deleted);

        const moved = Boolean(entry);
        record.cover.hidden = !moved;
        if (moved) {
            const o1 = toScreen(record.data.bbox[0], record.data.bbox[1]);
            const o2 = toScreen(record.data.bbox[2], record.data.bbox[3]);
            Object.assign(record.cover.style, {
                left: `${Math.min(o1[0], o2[0]) - 1}px`, top: `${Math.min(o1[1], o2[1]) - 1}px`,
                width: `${Math.abs(o1[0] - o2[0]) + 2}px`, height: `${Math.abs(o1[1] - o2[1]) + 2}px`,
                transform: '', background: entry.bg,
            });
        }
        let preview = record.box.querySelector('canvas.pdf-image-preview');
        if (moved && !entry.deleted) {
            if (!preview) {
                preview = capturePreview(record);
                if (preview) record.box.prepend(preview);
            }
        } else if (preview) {
            preview.remove();
        }
    }

    function capturePreview(record) {
        const canvas = state.rasterCanvas;
        if (!canvas) return null;
        const o1 = toScreen(record.data.bbox[0], record.data.bbox[1]);
        const o2 = toScreen(record.data.bbox[2], record.data.bbox[3]);
        const sx = clamp(Math.floor(Math.min(o1[0], o2[0])), 0, canvas.width - 1);
        const sy = clamp(Math.floor(Math.min(o1[1], o2[1])), 0, canvas.height - 1);
        const sw = clamp(Math.ceil(Math.abs(o1[0] - o2[0])), 1, canvas.width - sx);
        const sh = clamp(Math.ceil(Math.abs(o1[1] - o2[1])), 1, canvas.height - sy);
        const preview = document.createElement('canvas');
        preview.className = 'pdf-image-preview';
        preview.width = sw;
        preview.height = sh;
        preview.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        return preview;
    }

    function ensureImageEntry(record) {
        const entries = (state.modifiedImages[ui.pageNum] ||= {});
        if (!entries[record.data.id]) {
            const o1 = toScreen(record.data.bbox[0], record.data.bbox[1]);
            const o2 = toScreen(record.data.bbox[2], record.data.bbox[3]);
            entries[record.data.id] = {
                imageId: record.data.id, deleted: false,
                orig: { bbox: [...record.data.bbox], ctm: [...record.data.ctm] },
                bbox: [...record.data.bbox],
                bg: sampleRegion({ left: Math.min(o1[0], o2[0]), top: Math.min(o1[1], o2[1]), right: Math.max(o1[0], o2[0]), bottom: Math.max(o1[1], o2[1]) }, 'background'),
            };
        }
        return entries[record.data.id];
    }

    function dropImageEntryIfPristine(record) {
        const entries = state.modifiedImages[ui.pageNum];
        const entry = entries?.[record.data.id];
        if (entry && !entry.deleted && entry.bbox.every((value, i) => Math.abs(value - entry.orig.bbox[i]) < 0.01)) {
            delete entries[record.data.id];
            if (!Object.keys(entries).length) delete state.modifiedImages[ui.pageNum];
        }
    }

    function onImagePointerDown(event, record) {
        if (event.button !== 0 || event.target.classList.contains('pdf-handle')) return;
        if (imageEntries(ui.pageNum)[record.data.id]?.deleted) return;
        event.preventDefault();
        event.stopPropagation();
        commitActiveEdit();
        select({ kind: 'image', record });
        const wrapper = dom.pdfPageWrapper.getBoundingClientRect();
        const startPage = toPage(event.clientX - wrapper.left, event.clientY - wrapper.top);
        const startBox = [...currentImageBox(record)];
        let dragging = false;
        const start = { x: event.clientX, y: event.clientY };
        const onMove = move => {
            if (!dragging && Math.hypot(move.clientX - start.x, move.clientY - start.y) < DRAG_THRESHOLD) return;
            dragging = true;
            const here = toPage(move.clientX - wrapper.left, move.clientY - wrapper.top);
            const dx = here[0] - startPage[0];
            const dy = here[1] - startPage[1];
            const entry = ensureImageEntry(record);
            entry.bbox = [startBox[0] + dx, startBox[1] + dy, startBox[2] + dx, startBox[3] + dy];
            refreshImage(record);
            positionToolbar();
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            if (dragging) { dropImageEntryIfPristine(record); refreshImage(record); saveHistory(); }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    function onImageResizeStart(event, record, corner) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        select({ kind: 'image', record });
        const wrapper = dom.pdfPageWrapper.getBoundingClientRect();
        const a = toScreen(currentImageBox(record)[0], currentImageBox(record)[1]);
        const b = toScreen(currentImageBox(record)[2], currentImageBox(record)[3]);
        const rect = { left: Math.min(a[0], b[0]), top: Math.min(a[1], b[1]), right: Math.max(a[0], b[0]), bottom: Math.max(a[1], b[1]) };
        const ratio = (rect.right - rect.left) / Math.max(rect.bottom - rect.top, 1);
        const anchor = {
            x: corner.includes('w') ? rect.right : rect.left,
            y: corner.includes('n') ? rect.bottom : rect.top,
        };
        const onMove = move => {
            const px = move.clientX - wrapper.left;
            const py = move.clientY - wrapper.top;
            let width = Math.max(Math.abs(px - anchor.x), 12);
            let height = width / ratio;
            if (!move.shiftKey && Math.abs(py - anchor.y) > height) { height = Math.abs(py - anchor.y); width = height * ratio; }
            const x = corner.includes('w') ? anchor.x - width : anchor.x;
            const y = corner.includes('n') ? anchor.y - height : anchor.y;
            const p1 = toPage(x, y);
            const p2 = toPage(x + width, y + height);
            const entry = ensureImageEntry(record);
            entry.bbox = [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1])];
            refreshImage(record);
            positionToolbar();
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            dropImageEntryIfPristine(record);
            refreshImage(record);
            saveHistory();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    function deleteImage(record) {
        const entry = ensureImageEntry(record);
        entry.deleted = true;
        refreshImage(record);
        deselect();
        saveHistory();
        showToast(`${objectLabel(record)} deleted`, 'info');
    }

    // ----- selection & toolbar -----------------------------------------------
    function select(selection) {
        if (ui.selection && ui.selection.record !== selection.record) {
            const previous = ui.selection;
            ui.selection = null;
            if (previous.kind === 'run') refreshRun(previous.record); else refreshImage(previous.record);
        }
        ui.selection = selection;
        if (selection.kind === 'run') refreshRun(selection.record); else refreshImage(selection.record);
        updateToolbar();
        positionToolbar();
    }

    function deselect() {
        if (!ui) return;
        commitActiveEdit();
        const previous = ui.selection;
        ui.selection = null;
        if (previous) {
            if (previous.kind === 'run') refreshRun(previous.record); else refreshImage(previous.record);
        }
        if (toolbar) toolbar.hidden = true;
    }

    function ensureToolbar() {
        if (toolbar && toolbar.isConnected) return;
        toolbar = document.createElement('div');
        toolbar.className = 'object-toolbar';
        toolbar.hidden = true;
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Selected object');
        toolbar.innerHTML = `
            <div class="ot-text-controls">
                <select class="ot-family" aria-label="Font">${Object.entries(FAMILY_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>
                <button type="button" class="ot-btn ot-size-dec" aria-label="Smaller text" title="Smaller">&minus;</button>
                <input type="number" class="ot-size" min="${MIN_FONT_SIZE}" max="${MAX_FONT_SIZE}" step="0.5" aria-label="Font size">
                <button type="button" class="ot-btn ot-size-inc" aria-label="Larger text" title="Larger">+</button>
                <button type="button" class="ot-btn ot-bold" aria-label="Bold" title="Bold"><i class="fas fa-bold" aria-hidden="true"></i></button>
                <button type="button" class="ot-btn ot-italic" aria-label="Italic" title="Italic"><i class="fas fa-italic" aria-hidden="true"></i></button>
                <input type="color" class="ot-color" aria-label="Text color" title="Text color">
            </div>
            <span class="ot-label"></span>
            <button type="button" class="ot-btn ot-delete" aria-label="Delete" title="Delete (Del)"><i class="fas fa-trash" aria-hidden="true"></i></button>`;
        dom.pdfPageWrapper.appendChild(toolbar);
        // Buttons must not steal focus from the line being edited.
        toolbar.addEventListener('pointerdown', event => {
            event.stopPropagation();
            toolbarBusy = true;
            clearTimeout(ensureToolbar.timer);
            ensureToolbar.timer = setTimeout(() => { toolbarBusy = false; }, 600);
            if (!event.target.closest('select, input')) event.preventDefault();
        });
        const change = mutate => {
            const selection = ui?.selection;
            if (selection?.kind !== 'run') return;
            const entry = ensureTextEntry(selection.record);
            mutate(entry);
            entry.fontSize = clamp(entry.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE);
            ensureWebFont(entry.family, entry.bold, entry.italic).then(() => refreshRun(selection.record));
            refreshRun(selection.record);
            dropEntryIfPristine(selection.record);
            updateToolbar();
            positionToolbar();
            saveHistory();
        };
        toolbar.querySelector('.ot-family').addEventListener('change', event => change(entry => { entry.family = event.target.value; }));
        toolbar.querySelector('.ot-size').addEventListener('change', event => change(entry => {
            const value = Number.parseFloat(event.target.value);
            if (Number.isFinite(value)) entry.fontSize = value;
        }));
        toolbar.querySelector('.ot-size-dec').addEventListener('click', () => change(entry => { entry.fontSize = Math.max(MIN_FONT_SIZE, entry.fontSize - (entry.fontSize > 24 ? 2 : 1)); }));
        toolbar.querySelector('.ot-size-inc').addEventListener('click', () => change(entry => { entry.fontSize += entry.fontSize >= 24 ? 2 : 1; }));
        toolbar.querySelector('.ot-bold').addEventListener('click', () => change(entry => { entry.bold = !entry.bold; }));
        toolbar.querySelector('.ot-italic').addEventListener('click', () => change(entry => { entry.italic = !entry.italic; }));
        toolbar.querySelector('.ot-color').addEventListener('input', event => {
            const selection = ui?.selection;
            if (selection?.kind !== 'run') return;
            ensureTextEntry(selection.record).color = event.target.value;
            refreshRun(selection.record);
        });
        toolbar.querySelector('.ot-color').addEventListener('change', () => {
            if (ui?.selection?.kind === 'run') { dropEntryIfPristine(ui.selection.record); saveHistory(); }
        });
        toolbar.querySelector('.ot-delete').addEventListener('click', () => {
            const selection = ui?.selection;
            if (!selection) return;
            if (selection.kind === 'run') deleteRun(selection.record); else deleteImage(selection.record);
        });
    }

    function updateToolbar() {
        const selection = ui?.selection;
        if (!toolbar || !selection) return;
        toolbar.hidden = false;
        const isRun = selection.kind === 'run';
        toolbar.querySelector('.ot-text-controls').hidden = !isRun;
        toolbar.querySelector('.ot-label').textContent = isRun ? '' : objectLabel(selection.record);
        toolbar.querySelector('.ot-label').hidden = isRun;
        if (!isRun) return;
        const run = selection.record;
        const entry = textEntries(ui.pageNum)[run.data.id];
        const values = entry || { ...defaultsFor(run), color: defaultsFor(run).color || '#000000' };
        toolbar.querySelector('.ot-family').value = values.family;
        toolbar.querySelector('.ot-size').value = (Math.round(values.fontSize * 2) / 2).toString();
        toolbar.querySelector('.ot-bold').classList.toggle('active', Boolean(values.bold));
        toolbar.querySelector('.ot-italic').classList.toggle('active', Boolean(values.italic));
        toolbar.querySelector('.ot-color').value = /^#[0-9a-f]{6}$/i.test(values.color || '') ? values.color : '#000000';
    }

    function positionToolbar() {
        const selection = ui?.selection;
        if (!toolbar || !selection || toolbar.hidden) return;
        const element = selection.record.box;
        const rect = screenRectOfBox(element);
        const height = toolbar.offsetHeight || 40;
        const width = toolbar.offsetWidth || 320;
        let top = rect.top - height - 8;
        if (top < 4) top = rect.bottom + 8;
        const maxLeft = Math.max(4, dom.pdfPageWrapper.clientWidth - width - 4);
        toolbar.style.left = `${clamp(rect.left, 4, maxLeft)}px`;
        toolbar.style.top = `${top}px`;
    }

    // ----- keyboard ------------------------------------------------------------
    function handleKeyDown(event) {
        if (!ui?.selection) return false;
        const editable = event.target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName);
        if (editable) return false;
        const { kind, record } = ui.selection;
        if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            if (kind === 'run') deleteRun(record); else deleteImage(record);
            return true;
        }
        if (event.key === 'Escape') { deselect(); return true; }
        if (event.key === 'Enter' && kind === 'run') { event.preventDefault(); startEdit(record, null); return true; }
        const step = event.shiftKey ? 10 : 1;
        const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (arrows[event.key]) {
            event.preventDefault();
            const [dx, dy] = arrows[event.key];
            const here = toPage(0, 0);
            const there = toPage(dx, dy);
            const deltaX = there[0] - here[0];
            const deltaY = there[1] - here[1];
            if (kind === 'run') {
                const entry = ensureTextEntry(record);
                entry.x += deltaX; entry.y += deltaY;
                refreshRun(record);
            } else {
                const entry = ensureImageEntry(record);
                entry.bbox = [entry.bbox[0] + deltaX, entry.bbox[1] + deltaY, entry.bbox[2] + deltaX, entry.bbox[3] + deltaY];
                refreshImage(record);
            }
            positionToolbar();
            clearTimeout(handleKeyDown.timer);
            handleKeyDown.timer = setTimeout(() => saveHistory(), 400);
            return true;
        }
        return false;
    }

    // Clicking empty page space clears the selection.
    dom.textLayer.addEventListener('pointerdown', event => {
        if (event.target === dom.textLayer) deselect();
    });

    // ----- export ------------------------------------------------------------------
    const entryKey = (pageNum, entry) => `${pageNum}:${entry.runId}`;
    const isTextOnlyEdit = entry => !entry.deleted && entry.newText !== entry.originalText
        && Math.abs(entry.x - entry.orig.x) < 0.01 && Math.abs(entry.y - entry.orig.y) < 0.01
        && entry.family === entry.base.family && entry.bold === entry.base.bold && entry.italic === entry.base.italic
        && entry.color === entry.base.color && Math.abs(entry.fontSize - entry.base.fontSize) < 0.01;

    const isStyleUnchanged = entry => entry.family === entry.base.family && entry.bold === entry.base.bold
        && entry.italic === entry.base.italic && entry.color === entry.base.color
        && Math.abs(entry.fontSize - entry.base.fontSize) < 0.01;

    function mergeSpec(target, id, source) {
        if (!target.has(id)) target.set(id, { removed: new Set(), keepAdvance: true, insertions: new Map() });
        const spec = target.get(id);
        source.removed.forEach(glyph => spec.removed.add(glyph));
        source.insertions.forEach((gap, index) => spec.insertions.set(index, (spec.insertions.get(index) || 0) + gap));
    }

    /**
     * Phase 1: remove original text and move or delete images in the page content.
     * `levels` maps a line to how cautious to be: 0 = surgical, 1 = replace the whole line,
     * 2 = cover it (used only when verification shows the safer modes did not work).
     */
    async function applyContentEdits(pdfDoc, { fontkit, levels = new Map(), regions = new Map() } = {}) {
        const plan = { items: [], warnings: [], embedder: null, covered: 0, pages: new Set(), blockedPages: new Set() };
        setPdfLib(window.PDFLib);
        const pages = new Set([...Object.keys(state.modifiedText), ...Object.keys(state.modifiedImages), ...regions.keys()].map(Number));
        const embedder = new TextEmbedder(pdfDoc, window.PDFLib, fontkit);
        plan.embedder = embedder;
        const measure = (text, style, size) => embedder.widthOf(text, style, size);

        for (const pageNum of [...pages].sort((a, b) => a - b)) {
            if (pageNum < 1 || pageNum > pdfDoc.getPageCount()) continue;
            const analysis = await analyzePage(pdfDoc, pageNum - 1);
            const glyphEdits = new Map();
            const deleteImages = new Set();
            const imageMatrices = new Map();
            for (const entry of Object.values(state.modifiedText[pageNum] || {})) {
                const key = entryKey(pageNum, entry);
                const level = levels.get(key) || 0;
                const item = { key, pageNum, entry, mode: 'whole', inserts: [], reason: null };
                plan.items.push(item);
                plan.pages.add(pageNum);
                const match = analysis.failed ? null : matchRun(analysis, entry.orig);
                if (!match?.safe || level >= 2) {
                    item.mode = 'cover';
                    item.reason = analysis.failed ? 'page could not be analyzed' : (match?.reason || 'verification failed');
                    continue;
                }
                if (level === 0 && isTextOnlyEdit(entry)) {
                    const surgical = await planSurgicalEdit({ analysis, entry, match, measure });
                    if (surgical.ok) {
                        item.mode = 'surgical';
                        item.inserts = surgical.inserts;
                        item.removedText = surgical.removedText;
                        for (const [id, spec] of surgical.glyphEdits) mergeSpec(glyphEdits, id, spec);
                        continue;
                    }
                    item.reason = surgical.reason;
                }
                for (const [id, glyphs] of match.removals) mergeSpec(glyphEdits, id, { removed: glyphs, insertions: new Map() });
                // Keep each character's original bold / italic / colour when the user did not restyle the line.
                if (!entry.deleted && entry.newText && isStyleUnchanged(entry)) item.pieces = planStyledPieces({ analysis, entry, match });
            }
            for (const entry of Object.values(state.modifiedImages[pageNum] || {})) {
                const image = analysis.images.find(candidate => candidate.id === entry.imageId);
                const matches = image && !image.unsafe && image.bbox.every((value, i) => Math.abs(value - entry.orig.bbox[i]) < 2);
                if (!matches) { plan.warnings.push(`An image on page ${pageNum} could not be edited because it is part of shared content.`); continue; }
                if (entry.deleted) { deleteImages.add(image.id); continue; }
                const [ox0, oy0, ox1, oy1] = entry.orig.bbox;
                const [nx0, ny0, nx1, ny1] = entry.bbox;
                const sx = (nx1 - nx0) / Math.max(ox1 - ox0, 1e-6);
                const sy = (ny1 - ny0) / Math.max(oy1 - oy0, 1e-6);
                imageMatrices.set(image.id, mul(image.ctm, [sx, 0, 0, sy, nx0 - sx * ox0, ny0 - sy * oy0]));
            }
            // Whiteout and redaction boxes erase what is under them instead of only painting over it.
            for (const region of regions.get(pageNum) || []) {
                if (analysis.failed) { plan.blockedPages.add(pageNum); continue; }
                const found = findContentInRects(analysis, [region.rect], region.mode);
                for (const [id, spec] of found.glyphEdits) mergeSpec(glyphEdits, id, spec);
                found.imageIds.forEach(id => deleteImages.add(id));
                if (found.blocked.length) plan.blockedPages.add(pageNum);
            }
            if (glyphEdits.size || deleteImages.size || imageMatrices.size) {
                commitPatchedScopes(pdfDoc, analysis, buildPatchedScopes(analysis, { glyphEdits, deleteImages, imageMatrices }));
            }
        }
        return plan;
    }

    /** Phase 2: cover what could not be removed and draw the new text. */
    async function drawEditedText(pdfDoc, plan) {
        const PDFLib = window.PDFLib;
        const pages = pdfDoc.getPages();
        for (const item of plan.items.filter(candidate => candidate.mode === 'cover')) {
            console.info(`[PDF Studio] covered instead of removed (page ${item.pageNum}, "${item.entry.originalText.slice(0, 30)}"): ${item.reason}`);
            plan.covered++;
            const { orig } = item.entry;
            const cos = Math.cos(orig.angle);
            const sin = Math.sin(orig.angle);
            const padX = orig.fontSize * 0.06;
            const bottom = (orig.descent + 0.04) * orig.fontSize;
            const [r, g, b] = hexToRgb01(item.entry.bg);
            pages[item.pageNum - 1].drawRectangle({
                x: orig.x - padX * cos + bottom * sin, y: orig.y - padX * sin - bottom * cos,
                width: orig.width + padX * 2 + orig.fontSize * 0.1, height: (orig.ascent + orig.descent + 0.08) * orig.fontSize,
                color: PDFLib.rgb(r, g, b), rotate: PDFLib.degrees((orig.angle * 180) / Math.PI),
            });
        }
        const missing = new Set();
        for (const item of plan.items) {
            const { entry } = item;
            item.drawn = '';
            if (entry.deleted) continue;
            const page = pages[item.pageNum - 1];
            const angle = entry.orig.angle;
            let calls;
            if (item.mode === 'surgical') calls = item.inserts;
            else if (item.pieces) {
                // Styled pieces sit one after another along the original baseline.
                calls = [];
                let offset = 0;
                for (const piece of item.pieces) {
                    calls.push({
                        ...piece, x: entry.x + offset * Math.cos(angle), y: entry.y + offset * Math.sin(angle), angle,
                    });
                    offset += await plan.embedder.widthOf(piece.text, piece, piece.size);
                }
            } else {
                calls = entry.newText ? [{
                    text: entry.newText, x: entry.x, y: entry.y, size: entry.fontSize, family: entry.family, bold: entry.bold,
                    italic: entry.italic, color: entry.color, angle,
                }] : [];
            }
            for (const call of calls) {
                const [r, g, b] = hexToRgb01(call.color);
                const result = await plan.embedder.drawText(page, call.text, {
                    x: call.x, y: call.y, size: call.size, family: call.family, bold: call.bold, italic: call.italic,
                    color: PDFLib.rgb(r, g, b), angle: call.angle,
                });
                item.drawn += result.drawn;
                result.missing.forEach(char => missing.add(char));
            }
        }
        if (missing.size) plan.warnings.push(`Some characters are not in the built-in fonts and were replaced with "?": ${[...missing].join(' ')}`);
        return plan;
    }

    /**
     * Phase 3: re-read the result and confirm each edited page now holds exactly the
     * original characters, minus the text that was replaced, plus the new text.
     * Returns the keys of lines that must be retried in a safer mode.
     */
    async function verifyEdits(pdfDoc, plan) {
        const textPages = [...plan.pages];
        if (!textPages.length || !plan.items.length) return [];
        const strip = text => Array.from(text.replace(/\s+/g, ''));
        const tally = (map, text, sign) => strip(text).forEach(ch => map.set(ch, (map.get(ch) || 0) + sign));
        const itemsOf = async doc => Object.fromEntries(await Promise.all(textPages.map(async pageNum =>
            [pageNum, (await (await doc.getPage(pageNum)).getTextContent()).items.map(item => item.str).join('')])));
        const failed = [];
        let verifier = null;
        try {
            const before = await itemsOf(state.pdf);
            verifier = await openPdfDocument({ data: await pdfDoc.save({ updateFieldAppearances: false }) }).promise;
            const after = await itemsOf(verifier);
            for (const pageNum of textPages) {
                const expected = new Map();
                tally(expected, before[pageNum], 1);
                const pageItems = plan.items.filter(item => item.pageNum === pageNum);
                for (const item of pageItems) {
                    if (item.mode === 'surgical') tally(expected, item.removedText, -1);
                    else if (item.mode !== 'cover') tally(expected, item.entry.orig.fullText ?? item.entry.originalText, -1);
                    tally(expected, item.drawn, 1);
                }
                const actual = new Map();
                tally(actual, after[pageNum], 1);
                let difference = 0;
                const details = [];
                for (const [ch, count] of expected) {
                    const gap = count - (actual.get(ch) || 0);
                    if (gap) { difference += Math.abs(gap); details.push(`${ch}:${gap > 0 ? 'missing' : 'extra'}${Math.abs(gap)}`); }
                }
                for (const [ch, count] of actual) if (!expected.has(ch)) { difference += count; details.push(`${ch}:extra${count}`); }
                if (difference > 0) {
                    console.info(`[PDF Studio] page ${pageNum} text did not verify (${details.join(' ')}); retrying more cautiously`);
                    pageItems.filter(item => item.mode !== 'cover').forEach(item => failed.push(item.key));
                }
            }
        } catch (error) {
            console.warn('Could not verify the edited text.', error);
            plan.items.filter(item => item.mode !== 'cover').forEach(item => failed.push(item.key));
        } finally {
            verifier?.destroy();
        }
        return failed;
    }

    return {
        render, deselect, handleKeyDown, applyContentEdits, drawEditedText, verifyEdits,
        get hasSelection() { return Boolean(ui?.selection); },
    };
}
