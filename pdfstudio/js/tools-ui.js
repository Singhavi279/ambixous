/* =============================================
   PDF Studio — the Tools dialog

   One dialog hosts every document tool. From the landing page it works on files
   you choose; from the editor it works on the open document with your edits applied.
   ============================================= */
import * as tools from './pdf-tools.js';
import { openPdfDocument } from './pdfjs-config.js';

const h = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'html') node.innerHTML = value;
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (key in node && key !== 'list') node[key] = value;
        else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) if (child !== undefined && child !== null && child !== false) node.append(child);
    return node;
};

const formatSize = bytes => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
const baseName = name => String(name || 'document').replace(/\.[^.]+$/, '');

function download(name, bytes, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const link = h('a', { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const readFile = async file => new Uint8Array(await file.arrayBuffer());

// Browsers decode more image types than PDF can embed directly; normalise to PNG when needed.
async function toEmbeddableImage(file) {
    const bytes = await readFile(file);
    if (tools.sniffImageType(bytes)) return { name: file.name, bytes };
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return { name: file.name, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

const TOOL_GROUPS = [
    ['Organize', ['merge', 'split', 'organize', 'crop']],
    ['Convert', ['images', 'topng']],
    ['Security', ['protect', 'unlock']],
    ['Enhance', ['watermark', 'numbers', 'metadata', 'optimize']],
];

export const TOOL_CARDS = [
    ['merge', 'fa-object-group', 'Merge PDFs'],
    ['split', 'fa-scissors', 'Split PDF'],
    ['organize', 'fa-table-cells-large', 'Organize pages'],
    ['images', 'fa-file-image', 'Images to PDF'],
    ['topng', 'fa-images', 'PDF to images'],
    ['protect', 'fa-lock', 'Protect with password'],
    ['unlock', 'fa-unlock', 'Unlock PDF'],
    ['watermark', 'fa-droplet', 'Add watermark'],
    ['numbers', 'fa-list-ol', 'Page numbers'],
];

export function createToolsUI(env) {
    let overlay = null;
    let panel = null;
    let rail = null;
    let session = null;
    let opener = null;
    let renderToken = 0;

    const PDFLib = () => window.PDFLib;

    // ----- shell -----------------------------------------------------------
    function ensureShell() {
        if (overlay) return;
        rail = h('nav', { class: 'tools-rail', 'aria-label': 'PDF tools' });
        panel = h('section', { class: 'tools-panel', 'aria-live': 'polite' });
        const close = h('button', { class: 'modal-close', type: 'button', 'aria-label': 'Close tools', onClick: closeDialog, html: '<i class="fas fa-times" aria-hidden="true"></i>' });
        overlay = h('div', { class: 'modal-overlay tools-overlay hidden', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'PDF tools' },
            h('div', { class: 'modal tools-modal' },
                h('div', { class: 'modal-header' }, h('h3', { text: 'PDF tools' }), close),
                h('div', { class: 'tools-body' }, rail, panel)));
        overlay.addEventListener('mousedown', event => { if (event.target === overlay) closeDialog(); });
        overlay.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeDialog(); } });
        document.body.append(overlay);

        for (const [group, ids] of TOOL_GROUPS) {
            rail.append(h('p', { class: 'tools-group', text: group }));
            for (const id of ids) {
                const [, icon, label] = TOOL_LIST.find(entry => entry[0] === id);
                rail.append(h('button', { class: 'tools-rail-btn', type: 'button', dataset: { tool: id }, onClick: () => select(id) },
                    h('i', { class: `fas ${icon}`, 'aria-hidden': 'true' }), h('span', { text: label })));
            }
        }
    }

    function openDialog(toolId) {
        ensureShell();
        opener = document.activeElement;
        overlay.classList.remove('hidden');
        select(toolId || 'merge');
    }

    function closeDialog() {
        if (!overlay) return;
        renderToken++;
        overlay.classList.add('hidden');
        session = null;
        panel.replaceChildren();
        opener?.focus?.();
    }

    async function select(toolId) {
        const definition = TOOLS[toolId];
        const token = ++renderToken;
        rail.querySelectorAll('.tools-rail-btn').forEach(button => button.classList.toggle('active', button.dataset.tool === toolId));
        session = { toolId, definition, input: null, files: [], values: {}, token };
        panel.replaceChildren(h('div', { class: 'tools-intro' }, h('h4', { text: definition.title }), h('p', { text: definition.blurb })));
        await definition.mount(session, panel);
        if (token === renderToken) panel.querySelector('button, input, select')?.focus?.({ preventScroll: true });
    }

    // ----- shared widgets ----------------------------------------------------
    const status = () => panel.querySelector('.tools-status') || panel.appendChild(h('div', { class: 'tools-status', role: 'status' }));
    function say(message, kind = 'info') {
        const box = status();
        box.className = `tools-status ${kind}`;
        box.textContent = message;
        box.hidden = !message;
    }

    function resultBlock(files, { openable } = {}) {
        panel.querySelector('.tools-results')?.remove();
        const list = h('div', { class: 'tools-results' }, h('h4', { text: files.length > 1 ? `${files.length} files ready` : 'Ready' }));
        for (const file of files.slice(0, 12)) {
            list.append(h('div', { class: 'tools-result-row' },
                h('span', { class: 'tools-result-name', text: file.name }), h('span', { class: 'tools-result-size', text: formatSize(file.bytes.length) }),
                h('button', { class: 'btn-secondary', type: 'button', text: 'Download', onClick: () => download(file.name, file.bytes, file.type) })));
        }
        if (files.length > 12) list.append(h('p', { class: 'tools-hint', text: `…and ${files.length - 12} more in the ZIP.` }));
        const actions = h('div', { class: 'tools-actions' });
        if (files.length > 1) {
            actions.append(h('button', { class: 'btn-primary', type: 'button', text: 'Download all as ZIP', onClick: () => {
                download(`${baseName(files[0].name).replace(/-(page|pages)-.*$/, '')}-files.zip`, tools.createZip(files), 'application/zip');
            } }));
        } else {
            actions.append(h('button', { class: 'btn-primary', type: 'button', text: 'Download', onClick: () => download(files[0].name, files[0].bytes, files[0].type) }));
        }
        if (openable && files.length === 1 && files[0].type === 'application/pdf') {
            actions.append(h('button', { class: 'btn-secondary', type: 'button', text: 'Open in editor', onClick: async () => { closeDialog(); await env.openInEditor(files[0].bytes, files[0].name); } }));
        }
        list.append(actions);
        panel.append(list);
        list.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    async function busy(label, work) {
        const button = panel.querySelector('.tools-run');
        const original = button?.textContent;
        if (button) { button.disabled = true; button.textContent = label; }
        say('');
        try { return await work(); }
        catch (error) {
            if (error?.code === 'password-required') { say(error.message + ' Enter the password below and try again.', 'error'); showPasswordField(); }
            else say(error?.message || 'Something went wrong.', 'error');
            if (!(error instanceof tools.ToolError)) console.warn('[PDF Studio tools]', error);
            return null;
        } finally {
            if (button) { button.disabled = false; button.textContent = original; }
        }
    }

    function showPasswordField() {
        if (panel.querySelector('.tools-password')) return;
        const field = h('label', { class: 'tools-field tools-password' }, h('span', { text: 'PDF password' }),
            h('input', {
                type: 'password', autocomplete: 'off',
                onInput: event => { if (session.input) session.input.password = event.target.value; },
                // Checking the password reads the file again, which unlocks the page count and thumbnails.
                onChange: async event => {
                    if (!session?.input?.locked) return;
                    session.input.password = event.target.value;
                    await session.setInput(session.input);
                },
            }));
        panel.querySelector('.tools-input')?.append(field);
        field.querySelector('input').focus();
    }

    // The "which PDF" block shared by single-document tools.
    async function mountSingleInput(sessionRef) {
        const holder = h('div', { class: 'tools-input' });
        panel.append(holder);
        const describe = async () => {
            holder.replaceChildren();
            if (!sessionRef.input) {
                holder.append(h('div', { class: 'tools-drop', tabIndex: 0, role: 'button', 'aria-label': 'Choose a PDF',
                    onClick: () => picker.click(), onKeydown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); picker.click(); } } },
                    h('i', { class: 'fas fa-file-pdf', 'aria-hidden': 'true' }), h('span', { text: 'Choose a PDF, or drop one here' })));
                return;
            }
            const { input } = sessionRef;
            holder.append(h('div', { class: 'tools-file' },
                h('i', { class: 'fas fa-file-pdf', 'aria-hidden': 'true' }),
                h('div', {}, h('strong', { text: input.name }), h('small', { text: input.locked ? 'Password protected' : `${input.info?.pageCount ?? '?'} pages · ${formatSize(input.bytes.length)}${input.source === 'editor' ? ' · open in editor, edits included' : ''}` })),
                h('button', { class: 'btn-secondary', type: 'button', text: 'Change', onClick: () => picker.click() })));
            if (input.locked) showPasswordField();
        };
        const picker = h('input', { type: 'file', accept: '.pdf,application/pdf', class: 'hidden', onChange: async event => {
            const file = event.target.files[0];
            event.target.value = '';
            if (file) await setInput({ name: file.name, bytes: await readFile(file), source: 'file' });
        } });
        panel.append(picker);
        holder.addEventListener('dragover', event => { event.preventDefault(); holder.classList.add('over'); });
        holder.addEventListener('dragleave', () => holder.classList.remove('over'));
        holder.addEventListener('drop', async event => {
            event.preventDefault();
            holder.classList.remove('over');
            const file = [...event.dataTransfer.files].find(candidate => /pdf$/i.test(candidate.type) || /\.pdf$/i.test(candidate.name));
            if (file) await setInput({ name: file.name, bytes: await readFile(file), source: 'file' });
        });
        const setInput = async input => {
            sessionRef.input = input;
            input.locked = false;
            say('');
            try { input.info = await tools.describePdf(PDFLib(), input.bytes, input.password); }
            catch (error) {
                if (error.code === 'password-required') {
                    input.locked = true;
                    if (input.password) say(error.message, 'error');
                } else { sessionRef.input = null; say(error.message, 'error'); }
            }
            if (sessionRef.token !== renderToken) return;
            await describe();
            sessionRef.onInput?.(sessionRef.input);
        };
        sessionRef.setInput = setInput;
        // Resolves once the open document (if any) has been prepared, so Run never races it.
        sessionRef.requireInput = async () => {
            await sessionRef.pending;
            if (!sessionRef.input) throw new tools.ToolError('Choose a PDF first.');
            return sessionRef.input;
        };
        await describe();
        if (env.hasOpenDocument() && sessionRef.token === renderToken) {
            const preparing = h('p', { class: 'tools-hint', text: 'Preparing the open document…' });
            holder.append(preparing);
            sessionRef.pending = env.getCurrentPdf()
                .then(async current => {
                    if (current && sessionRef.token === renderToken && !sessionRef.input) await setInput({ ...current, source: 'editor' });
                })
                .catch(error => console.warn(error))
                .finally(() => preparing.remove());
        }
        return sessionRef.token === renderToken;
    }

    const field = (label, control, hint) => h('label', { class: 'tools-field' }, h('span', { text: label }), control, hint && h('small', { text: hint }));
    const select$ = (options, value, onChange) => h('select', { onChange: event => onChange(event.target.value) },
        options.map(([optionValue, text]) => h('option', { value: optionValue, text, selected: optionValue === value })));
    const runButton = (label, handler) => h('div', { class: 'tools-actions' }, h('button', { class: 'btn-primary tools-run', type: 'button', text: label, onClick: handler }));
    const note = text => h('p', { class: 'tools-hint', text });

    const pdfFile = (name, bytes) => ({ name, bytes: new Uint8Array(bytes), type: 'application/pdf' });

    // ----- the tools ---------------------------------------------------------
    const TOOLS = {
        merge: {
            title: 'Merge PDFs',
            blurb: 'Combine several PDFs into one. Drag to reorder.',
            async mount(sessionRef) {
                const entries = (sessionRef.entries = []);
                const list = h('div', { class: 'tools-list' });
                const picker = h('input', { type: 'file', accept: '.pdf,application/pdf', multiple: true, class: 'hidden', onChange: async event => {
                    for (const file of event.target.files) entries.push({ name: file.name, bytes: await readFile(file), id: crypto.randomUUID() });
                    event.target.value = '';
                    await refresh();
                } });
                const refresh = async () => {
                    list.replaceChildren();
                    for (const entry of entries) {
                        if (!entry.info && !entry.locked) {
                            try { entry.info = await tools.describePdf(PDFLib(), entry.bytes, entry.password); }
                            catch (error) { if (error.code === 'password-required') entry.locked = true; else { entries.splice(entries.indexOf(entry), 1); say(`${entry.name}: ${error.message}`, 'error'); continue; } }
                        }
                        const row = h('div', { class: 'tools-row', draggable: true, dataset: { id: entry.id } },
                            h('i', { class: 'fas fa-grip-vertical tools-grip', 'aria-hidden': 'true' }),
                            h('div', { class: 'tools-row-main' }, h('strong', { text: entry.name }), h('small', { text: entry.locked ? 'Password protected' : `${entry.info.pageCount} pages · ${formatSize(entry.bytes.length)}` })),
                            entry.locked && h('input', { type: 'password', placeholder: 'Password', 'aria-label': `Password for ${entry.name}`, onChange: async event => { entry.password = event.target.value; try { entry.info = await tools.describePdf(PDFLib(), entry.bytes, entry.password); entry.locked = false; say(''); await refresh(); } catch (error) { say(error.message, 'error'); } } }),
                            h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': `Move ${entry.name} up`, onClick: () => move(entry, -1), html: '<i class="fas fa-arrow-up" aria-hidden="true"></i>' }),
                            h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': `Move ${entry.name} down`, onClick: () => move(entry, 1), html: '<i class="fas fa-arrow-down" aria-hidden="true"></i>' }),
                            h('button', { class: 'tools-icon-btn danger', type: 'button', 'aria-label': `Remove ${entry.name}`, onClick: async () => { entries.splice(entries.indexOf(entry), 1); await refresh(); }, html: '<i class="fas fa-trash" aria-hidden="true"></i>' }));
                        row.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', entry.id); row.classList.add('dragging'); });
                        row.addEventListener('dragend', () => row.classList.remove('dragging'));
                        row.addEventListener('dragover', event => event.preventDefault());
                        row.addEventListener('drop', async event => {
                            event.preventDefault();
                            const from = entries.findIndex(candidate => candidate.id === event.dataTransfer.getData('text/plain'));
                            const to = entries.indexOf(entry);
                            if (from < 0 || from === to) return;
                            entries.splice(to, 0, entries.splice(from, 1)[0]);
                            await refresh();
                        });
                        list.append(row);
                    }
                    if (!entries.length) list.append(h('p', { class: 'tools-empty', text: 'No PDFs yet. Add the files you want to combine.' }));
                };
                const move = async (entry, delta) => {
                    const index = entries.indexOf(entry);
                    const target = index + delta;
                    if (target < 0 || target >= entries.length) return;
                    entries.splice(target, 0, entries.splice(index, 1)[0]);
                    await refresh();
                };
                panel.append(list, picker, h('div', { class: 'tools-actions' },
                    h('button', { class: 'btn-secondary', type: 'button', text: 'Add PDFs', onClick: () => picker.click() }),
                    env.hasOpenDocument() && h('button', { class: 'btn-secondary', type: 'button', text: 'Add the open document', onClick: async () => {
                        const current = await env.getCurrentPdf();
                        if (current) { entries.push({ ...current, id: crypto.randomUUID() }); await refresh(); }
                    } })));
                panel.append(runButton('Merge PDFs', async () => {
                    const output = await busy('Merging…', async () => tools.mergePdfs(PDFLib(), entries.map(entry => ({ bytes: entry.bytes, password: entry.password }))));
                    if (output) { resultBlock([pdfFile('merged.pdf', output)], { openable: true }); say(''); }
                }));
                await refresh();
            },
        },

        split: {
            title: 'Split PDF',
            blurb: 'Cut a PDF into separate files by page range, every N pages, or one file per page.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { mode: 'ranges', ranges: '', count: 2 });
                if (!(await mountSingleInput(sessionRef))) return;
                const ranges = field('Page ranges', h('input', { type: 'text', placeholder: 'e.g. 1-3, 5, 8-', onInput: event => { values.ranges = event.target.value; } }), 'Each range becomes its own PDF.');
                const count = field('Pages per file', h('input', { type: 'number', min: 1, value: 2, onInput: event => { values.count = event.target.value; } }));
                const refreshFields = () => { ranges.hidden = values.mode !== 'ranges'; count.hidden = values.mode !== 'every'; };
                panel.append(field('Split by', select$([['ranges', 'Page ranges'], ['every', 'Every N pages'], ['each', 'Every page']], values.mode, value => { values.mode = value; refreshFields(); })), ranges, count);
                refreshFields();
                panel.append(runButton('Split PDF', async () => {
                    const files = await busy('Splitting…', async () => {
                        const input = await sessionRef.requireInput();
                        return tools.splitPdf(PDFLib(), input.bytes, { ...values, baseName: baseName(input.name), password: input.password });
                    });
                    if (files) resultBlock(files);
                }));
            },
        },

        organize: {
            title: 'Organize pages',
            blurb: 'Reorder by dragging, rotate, duplicate or delete pages, or keep only the ones you select.',
            async mount(sessionRef) {
                if (!(await mountSingleInput(sessionRef))) return;
                const grid = h('div', { class: 'tools-pages' });
                const thumbs = new Map();
                let items = [];
                let nextId = 0;
                let pdfjsDocument = null;
                const selection = new Set();
                const draw = () => {
                    grid.replaceChildren();
                    items.forEach((item, position) => {
                        const image = h('img', { alt: `Page ${item.from + 1}`, draggable: false, style: `transform: rotate(${item.rotate}deg)` });
                        if (thumbs.has(item.from)) image.src = thumbs.get(item.from);
                        const card = h('div', { class: `tools-page${selection.has(item.id) ? ' selected' : ''}`, draggable: true },
                            h('div', { class: 'tools-page-thumb' }, image),
                            h('div', { class: 'tools-page-bar' },
                                h('label', { class: 'tools-check', title: 'Select page' }, h('input', { type: 'checkbox', checked: selection.has(item.id), 'aria-label': `Select page ${position + 1}`, onChange: event => { if (event.target.checked) selection.add(item.id); else selection.delete(item.id); card.classList.toggle('selected', event.target.checked); } }), h('span', { text: String(position + 1) })),
                                h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': 'Rotate left', title: 'Rotate left', onClick: () => { item.rotate = (item.rotate + 270) % 360; draw(); }, html: '<i class="fas fa-rotate-left" aria-hidden="true"></i>' }),
                                h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': 'Rotate right', title: 'Rotate right', onClick: () => { item.rotate = (item.rotate + 90) % 360; draw(); }, html: '<i class="fas fa-rotate-right" aria-hidden="true"></i>' }),
                                h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': 'Duplicate page', title: 'Duplicate', onClick: () => { items.splice(position + 1, 0, { ...item, id: nextId++ }); draw(); }, html: '<i class="fas fa-copy" aria-hidden="true"></i>' }),
                                h('button', { class: 'tools-icon-btn danger', type: 'button', 'aria-label': 'Delete page', title: 'Delete', onClick: () => { items.splice(position, 1); selection.delete(item.id); draw(); }, html: '<i class="fas fa-trash" aria-hidden="true"></i>' })));
                        card.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', String(item.id)); card.classList.add('dragging'); });
                        card.addEventListener('dragend', () => card.classList.remove('dragging'));
                        card.addEventListener('dragover', event => event.preventDefault());
                        card.addEventListener('drop', event => {
                            event.preventDefault();
                            const from = items.findIndex(candidate => String(candidate.id) === event.dataTransfer.getData('text/plain'));
                            if (from < 0 || from === position) return;
                            items.splice(position, 0, items.splice(from, 1)[0]);
                            draw();
                        });
                        grid.append(card);
                    });
                    if (!items.length) grid.append(h('p', { class: 'tools-empty', text: 'Choose a PDF to see its pages.' }));
                };
                const load = async input => {
                    items = [];
                    selection.clear();
                    thumbs.clear();
                    grid.replaceChildren();
                    if (!input || input.locked) { draw(); return; }
                    items = Array.from({ length: input.info.pageCount }, (_, from) => ({ from, rotate: 0, id: nextId++ }));
                    draw();
                    const token = sessionRef.token;
                    try {
                        pdfjsDocument = await openPdfDocument({ data: input.bytes.slice(), password: input.password }).promise;
                        for (let index = 0; index < pdfjsDocument.numPages && token === renderToken; index++) {
                            const page = await pdfjsDocument.getPage(index + 1);
                            const viewport = page.getViewport({ scale: 150 / Math.max(page.getViewport({ scale: 1 }).width, page.getViewport({ scale: 1 }).height) });
                            const canvas = document.createElement('canvas');
                            canvas.width = Math.ceil(viewport.width);
                            canvas.height = Math.ceil(viewport.height);
                            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                            thumbs.set(index, canvas.toDataURL('image/jpeg', 0.7));
                            grid.querySelectorAll('.tools-page-thumb img').forEach((image, position) => { if (items[position]?.from === index) image.src = thumbs.get(index); });
                        }
                    } catch (error) { console.warn('Thumbnails unavailable', error); }
                };
                sessionRef.onInput = load;
                const toolbar = h('div', { class: 'tools-actions tools-actions-start' },
                    h('button', { class: 'btn-secondary', type: 'button', text: 'Select all', onClick: () => { items.forEach(item => selection.add(item.id)); draw(); } }),
                    h('button', { class: 'btn-secondary', type: 'button', text: 'Select none', onClick: () => { selection.clear(); draw(); } }),
                    h('button', { class: 'btn-secondary', type: 'button', text: 'Delete selected', onClick: () => { items = items.filter(item => !selection.has(item.id)); selection.clear(); draw(); } }));
                panel.append(toolbar, grid);
                panel.append(h('div', { class: 'tools-actions' },
                    h('button', { class: 'btn-secondary tools-run-extract', type: 'button', text: 'Keep only selected', onClick: async () => {
                        const chosen = items.filter(item => selection.has(item.id));
                        if (!chosen.length) { say('Select the pages you want to keep first.', 'error'); return; }
                        const output = await busy('Working…', async () => tools.arrangePages(PDFLib(), (await sessionRef.requireInput()).bytes, chosen.map(item => ({ from: item.from, rotate: item.rotate })), sessionRef.input.password));
                        if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-selection.pdf`, output)], { openable: true });
                    } }),
                    h('button', { class: 'btn-primary tools-run', type: 'button', text: 'Save arrangement', onClick: async () => {
                        const output = await busy('Saving…', async () => tools.arrangePages(PDFLib(), (await sessionRef.requireInput()).bytes, items.map(item => ({ from: item.from, rotate: item.rotate })), sessionRef.input.password));
                        if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-organized.pdf`, output)], { openable: true });
                    } })));
                if (sessionRef.input) await load(sessionRef.input);
            },
        },

        crop: {
            title: 'Crop pages',
            blurb: 'Trim margins from every page, or only the pages you choose.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { top: 0, right: 0, bottom: 0, left: 0, pages: '' });
                if (!(await mountSingleInput(sessionRef))) return;
                const number = key => h('input', { type: 'number', min: 0, step: 1, value: 0, onInput: event => { values[key] = Number(event.target.value) || 0; } });
                panel.append(h('div', { class: 'tools-grid2' }, field('Top (mm)', number('top')), field('Bottom (mm)', number('bottom')), field('Left (mm)', number('left')), field('Right (mm)', number('right'))),
                    field('Pages (optional)', h('input', { type: 'text', placeholder: 'All pages', onInput: event => { values.pages = event.target.value; } }), 'For example 1-3, 6'));
                panel.append(runButton('Crop PDF', async () => {
                    const output = await busy('Cropping…', async () => {
                        const input = await sessionRef.requireInput();
                        const mm = 72 / 25.4;
                        return tools.cropPages(PDFLib(), input.bytes, { top: values.top * mm, right: values.right * mm, bottom: values.bottom * mm, left: values.left * mm, pages: values.pages, password: input.password });
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-cropped.pdf`, output)], { openable: true });
                }));
            },
        },

        images: {
            title: 'Images to PDF',
            blurb: 'Turn JPG, PNG, WebP or other images into a PDF, one image per page. Drag to reorder.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { pageSize: 'a4', margin: 0 });
                const entries = [];
                const list = h('div', { class: 'tools-list' });
                const picker = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'hidden', onChange: async event => {
                    for (const file of event.target.files) {
                        try { entries.push({ ...(await toEmbeddableImage(file)), id: crypto.randomUUID(), url: URL.createObjectURL(file) }); }
                        catch { say(`${file.name} could not be read as an image.`, 'error'); }
                    }
                    event.target.value = '';
                    refresh();
                } });
                const refresh = () => {
                    list.replaceChildren();
                    entries.forEach((entry, index) => {
                        const row = h('div', { class: 'tools-row', draggable: true },
                            h('i', { class: 'fas fa-grip-vertical tools-grip', 'aria-hidden': 'true' }),
                            h('img', { class: 'tools-row-thumb', src: entry.url, alt: '' }),
                            h('div', { class: 'tools-row-main' }, h('strong', { text: entry.name }), h('small', { text: formatSize(entry.bytes.length) })),
                            h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': 'Move up', onClick: () => { if (index) { entries.splice(index - 1, 0, entries.splice(index, 1)[0]); refresh(); } }, html: '<i class="fas fa-arrow-up" aria-hidden="true"></i>' }),
                            h('button', { class: 'tools-icon-btn', type: 'button', 'aria-label': 'Move down', onClick: () => { if (index < entries.length - 1) { entries.splice(index + 1, 0, entries.splice(index, 1)[0]); refresh(); } }, html: '<i class="fas fa-arrow-down" aria-hidden="true"></i>' }),
                            h('button', { class: 'tools-icon-btn danger', type: 'button', 'aria-label': 'Remove', onClick: () => { URL.revokeObjectURL(entry.url); entries.splice(index, 1); refresh(); }, html: '<i class="fas fa-trash" aria-hidden="true"></i>' }));
                        row.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', entry.id); });
                        row.addEventListener('dragover', event => event.preventDefault());
                        row.addEventListener('drop', event => {
                            event.preventDefault();
                            const from = entries.findIndex(candidate => candidate.id === event.dataTransfer.getData('text/plain'));
                            if (from >= 0 && from !== index) { entries.splice(index, 0, entries.splice(from, 1)[0]); refresh(); }
                        });
                        list.append(row);
                    });
                    if (!entries.length) list.append(h('p', { class: 'tools-empty', text: 'No images yet.' }));
                };
                panel.append(list, picker, h('div', { class: 'tools-actions tools-actions-start' }, h('button', { class: 'btn-secondary', type: 'button', text: 'Add images', onClick: () => picker.click() })));
                panel.append(h('div', { class: 'tools-grid2' },
                    field('Page size', select$([['a4', 'A4'], ['letter', 'US Letter'], ['fit', 'Same as image']], values.pageSize, value => { values.pageSize = value; })),
                    field('Margin (pt)', h('input', { type: 'number', min: 0, max: 200, value: 0, onInput: event => { values.margin = Number(event.target.value) || 0; } }))));
                panel.append(runButton('Create PDF', async () => {
                    const output = await busy('Creating…', async () => tools.imagesToPdf(PDFLib(), entries, values));
                    if (output) resultBlock([pdfFile('images.pdf', output)], { openable: true });
                }));
                refresh();
            },
        },

        topng: {
            title: 'PDF to images',
            blurb: 'Save every page as a PNG or JPG. Choose the resolution that suits you.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { format: 'png', dpi: 150, pages: '' });
                if (!(await mountSingleInput(sessionRef))) return;
                panel.append(h('div', { class: 'tools-grid2' },
                    field('Format', select$([['png', 'PNG (sharp, larger)'], ['jpeg', 'JPG (smaller)']], values.format, value => { values.format = value; })),
                    field('Resolution', select$([['72', '72 dpi (screen)'], ['150', '150 dpi (good)'], ['300', '300 dpi (print)']], '150', value => { values.dpi = Number(value); }))),
                    field('Pages (optional)', h('input', { type: 'text', placeholder: 'All pages', onInput: event => { values.pages = event.target.value; } }), 'For example 1-3, 6'));
                panel.append(runButton('Convert', async () => {
                    const files = await busy('Rendering pages…', async () => {
                        const input = await sessionRef.requireInput();
                        const document = await openPdfDocument({ data: input.bytes.slice(), password: input.password }).promise;
                        const indices = values.pages ? tools.flattenRanges(tools.parsePageRanges(values.pages, document.numPages)) : undefined;
                        return tools.pdfToImages(document, { format: values.format, dpi: values.dpi, pages: indices, baseName: baseName(input.name) });
                    });
                    if (files) resultBlock(files);
                }));
            },
        },

        protect: {
            title: 'Protect with a password',
            blurb: 'Encrypt a PDF with AES-256. Anyone opening it needs the password. This happens entirely on your device.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { userPassword: '', ownerPassword: '', permissions: { printing: true, copying: true, modifying: true } });
                if (!(await mountSingleInput(sessionRef))) return;
                const check = (label, key) => h('label', { class: 'tools-check-row' }, h('input', { type: 'checkbox', checked: true, onChange: event => { values.permissions[key] = event.target.checked; } }), h('span', { text: label }));
                panel.append(field('Password to open', h('input', { type: 'password', autocomplete: 'new-password', onInput: event => { values.userPassword = event.target.value; } })),
                    field('Owner password (optional)', h('input', { type: 'password', autocomplete: 'new-password', onInput: event => { values.ownerPassword = event.target.value; } }), 'Needed to change the restrictions below. Defaults to the open password.'),
                    h('fieldset', { class: 'tools-fieldset' }, h('legend', { text: 'Allow' }), check('Printing', 'printing'), check('Copying text and images', 'copying'), check('Editing and assembling pages', 'modifying')),
                    note('Keep the password safe. It cannot be recovered, and Ambixous never sees it.'));
                panel.append(runButton('Protect PDF', async () => {
                    const output = await busy('Encrypting…', async () => {
                        const input = await sessionRef.requireInput();
                        return tools.protectPdf(PDFLib(), input.bytes, { ...values, password: input.password });
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-protected.pdf`, output)]);
                }));
            },
        },

        unlock: {
            title: 'Unlock a PDF',
            blurb: 'Remove the password from a PDF you have the password for.',
            async mount(sessionRef) {
                if (!(await mountSingleInput(sessionRef))) return;
                panel.append(note('You need the password. Unlocking copies the pages into a new file, so bookmarks and form fields may not carry over.'));
                panel.append(runButton('Unlock PDF', async () => {
                    const output = await busy('Unlocking…', async () => {
                        const input = await sessionRef.requireInput();
                        if (input.locked && !input.password) { showPasswordField(); throw new tools.ToolError('Enter the password to unlock this PDF.'); }
                        return tools.unlockPdf(PDFLib(), input.bytes, input.password ?? '');
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-unlocked.pdf`, output)], { openable: true });
                }));
            },
        },

        watermark: {
            title: 'Add a watermark',
            blurb: 'Stamp text or an image across your pages, with adjustable opacity and angle.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { kind: 'text', text: 'CONFIDENTIAL', fontFamily: 'sans', size: 64, color: '#888888', opacity: 0.25, rotation: 45, layout: 'center', pages: '', image: null });
                if (!(await mountSingleInput(sessionRef))) return;
                const textFields = h('div', { class: 'tools-stack' },
                    field('Text', h('input', { type: 'text', value: values.text, onInput: event => { values.text = event.target.value; } })),
                    h('div', { class: 'tools-grid2' },
                        field('Font', select$([['sans', 'Sans'], ['serif', 'Serif'], ['mono', 'Mono']], 'sans', value => { values.fontFamily = value; })),
                        field('Size', h('input', { type: 'number', min: 8, max: 300, value: values.size, onInput: event => { values.size = Number(event.target.value) || 64; } })),
                        field('Colour', h('input', { type: 'color', value: values.color, onInput: event => { values.color = event.target.value; } }))));
                const imageFields = h('div', { class: 'tools-stack', hidden: true },
                    field('Image', h('input', { type: 'file', accept: 'image/*', onChange: async event => { const file = event.target.files[0]; values.image = file ? await toEmbeddableImage(file) : null; } })),
                    field('Size (% of page)', h('input', { type: 'number', min: 5, max: 100, value: 50, onInput: event => { values.imageSize = Number(event.target.value) || 50; } })));
                panel.append(field('Watermark type', select$([['text', 'Text'], ['image', 'Image']], 'text', value => { values.kind = value; textFields.hidden = value !== 'text'; imageFields.hidden = value !== 'image'; })), textFields, imageFields,
                    h('div', { class: 'tools-grid2' },
                        field('Opacity', h('input', { type: 'range', min: 5, max: 100, value: 25, onInput: event => { values.opacity = Number(event.target.value) / 100; } })),
                        field('Angle (°)', h('input', { type: 'number', min: -180, max: 180, value: 45, onInput: event => { values.rotation = Number(event.target.value) || 0; } })),
                        field('Layout', select$([['center', 'Centered'], ['tile', 'Repeated']], 'center', value => { values.layout = value; })),
                        field('Pages (optional)', h('input', { type: 'text', placeholder: 'All pages', onInput: event => { values.pages = event.target.value; } }))));
                panel.append(runButton('Add watermark', async () => {
                    const output = await busy('Stamping…', async () => {
                        const input = await sessionRef.requireInput();
                        const options = { ...values, password: input.password };
                        if (values.kind === 'image') {
                            if (!values.image) throw new tools.ToolError('Choose a watermark image.');
                            options.size = values.imageSize ?? 50;
                        } else options.image = null;
                        return tools.addWatermark(PDFLib(), window.fontkit, input.bytes, options);
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-watermarked.pdf`, output)], { openable: true });
                }));
            },
        },

        numbers: {
            title: 'Page numbers',
            blurb: 'Add page numbers to your document. Use {n} for the number and {total} for the page count.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { format: '{n}', position: 'bottom-center', size: 11, start: 1, skipFirst: false, color: '#333333', pages: '', fontFamily: 'sans' });
                if (!(await mountSingleInput(sessionRef))) return;
                const format = h('input', { type: 'text', value: '{n}', onInput: event => { values.format = event.target.value; } });
                panel.append(field('Style', select$([['{n}', '1, 2, 3'], ['Page {n}', 'Page 1'], ['Page {n} of {total}', 'Page 1 of 10'], ['- {n} -', '- 1 -']], '{n}', value => { values.format = value; format.value = value; })),
                    field('Custom format', format),
                    h('div', { class: 'tools-grid2' },
                        field('Position', select$([['bottom-center', 'Bottom centre'], ['bottom-right', 'Bottom right'], ['bottom-left', 'Bottom left'], ['top-center', 'Top centre'], ['top-right', 'Top right'], ['top-left', 'Top left']], 'bottom-center', value => { values.position = value; })),
                        field('Size', h('input', { type: 'number', min: 6, max: 48, value: 11, onInput: event => { values.size = Number(event.target.value) || 11; } })),
                        field('Start at', h('input', { type: 'number', value: 1, onInput: event => { values.start = Number(event.target.value) || 1; } })),
                        field('Colour', h('input', { type: 'color', value: '#333333', onInput: event => { values.color = event.target.value; } }))),
                    field('Pages (optional)', h('input', { type: 'text', placeholder: 'All pages', onInput: event => { values.pages = event.target.value; } })),
                    h('label', { class: 'tools-check-row' }, h('input', { type: 'checkbox', onChange: event => { values.skipFirst = event.target.checked; } }), h('span', { text: 'Skip the first page (cover)' })));
                panel.append(runButton('Add page numbers', async () => {
                    const output = await busy('Numbering…', async () => {
                        const input = await sessionRef.requireInput();
                        return tools.addPageNumbers(PDFLib(), window.fontkit, input.bytes, { ...values, password: input.password });
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-numbered.pdf`, output)], { openable: true });
                }));
            },
        },

        metadata: {
            title: 'Document properties',
            blurb: 'Edit the title, author, subject and keywords stored inside the PDF.',
            async mount(sessionRef) {
                const values = sessionRef.values;
                Object.assign(values, { title: '', author: '', subject: '', keywords: '' });
                const inputs = {};
                const control = (key, label) => (inputs[key] = h('input', { type: 'text', onInput: event => { values[key] = event.target.value; } }));
                if (!(await mountSingleInput(sessionRef))) return;
                panel.append(field('Title', control('title')), field('Author', control('author')), field('Subject', control('subject')), field('Keywords', control('keywords'), 'Separate with commas'));
                sessionRef.onInput = input => {
                    if (!input?.info) return;
                    for (const key of ['title', 'author', 'subject', 'keywords']) { values[key] = input.info[key]; inputs[key].value = input.info[key]; }
                };
                sessionRef.onInput(sessionRef.input);
                panel.append(runButton('Save properties', async () => {
                    const output = await busy('Saving…', async () => {
                        const input = await sessionRef.requireInput();
                        return tools.setMetadata(PDFLib(), input.bytes, values, input.password);
                    });
                    if (output) resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-properties.pdf`, output)], { openable: true });
                }));
            },
        },

        optimize: {
            title: 'Optimize file size',
            blurb: 'Rebuild the PDF from its pages so unused data is dropped. Text and images are not recompressed, so the saving depends on how the file was made.',
            async mount(sessionRef) {
                if (!(await mountSingleInput(sessionRef))) return;
                panel.append(runButton('Optimize', async () => {
                    const output = await busy('Optimizing…', async () => {
                        const input = await sessionRef.requireInput();
                        return tools.optimizePdf(PDFLib(), input.bytes, input.password);
                    });
                    if (!output) return;
                    const before = sessionRef.input.bytes.length;
                    say(output.length < before ? `Reduced from ${formatSize(before)} to ${formatSize(output.length)}.` : `This file is already compact (${formatSize(before)}); nothing to remove.`, 'success');
                    resultBlock([pdfFile(`${baseName(sessionRef.input.name)}-optimized.pdf`, output)], { openable: true });
                }));
            },
        },
    };

    const TOOL_LIST = [
        ['merge', 'fa-object-group', 'Merge'], ['split', 'fa-scissors', 'Split'], ['organize', 'fa-table-cells-large', 'Organize pages'], ['crop', 'fa-crop', 'Crop pages'],
        ['images', 'fa-file-image', 'Images to PDF'], ['topng', 'fa-images', 'PDF to images'],
        ['protect', 'fa-lock', 'Protect'], ['unlock', 'fa-unlock', 'Unlock'],
        ['watermark', 'fa-droplet', 'Watermark'], ['numbers', 'fa-list-ol', 'Page numbers'], ['metadata', 'fa-circle-info', 'Properties'], ['optimize', 'fa-compress', 'Optimize size'],
    ];

    return { open: openDialog, close: closeDialog };
}
