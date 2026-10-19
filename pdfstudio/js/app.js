/* =============================================
   PDF Studio — Professional PDF Editor v3.0
   ============================================= */
import { openPdfDocument } from './pdfjs-config.js';
import { opfsStore } from './opfs-store.js';
import { createObjectEditor } from './object-editor.js';
import { createToolsUI, TOOL_CARDS } from './tools-ui.js';
import { drawPageElements } from './elements-export.js';
import { CSS_FAMILY, familyKeyFor } from './pdf-fonts.js';
import { flattenPages } from './pdf-tools.js';

// =============================================
// App State
// =============================================
const state = {
    pdf: null,
    pdfBytes: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 1.0,
    activeTool: 'select',
    activeAnnotateMode: 'highlight',
    activeShapeMode: 'rectangle',
    activeFormMode: 'text-field',
    whiteoutMode: 'white',   // 'white' paints over; 'redact' paints black and removes what is underneath
    
    // History for undo/redo
    history: [],
    historyIndex: -1,
    dirty: false,
    
    // Elements per page
    elements: {},  // pageNum -> array of element data
    
    // Drawing state
    isDrawing: false,
    drawStart: null,
    
    // Signature
    signatureData: null,
    signatureFont: "'Dancing Script', cursive",
    
    // Properties
    textProps: {
        fontFamily: 'Helvetica',
        fontSize: 12,
        bold: false,
        italic: false,
        color: '#000000'
    },
    shapeProps: {
        strokeColor: '#1a56db',
        fillColor: '#ffffff',
        strokeWidth: 2,
        opacity: 100
    },
    annotateProps: {
        color: '#ffe066',
        size: 3
    },
    
    // Freehand
    freehandPaths: {},  // pageNum -> array of path data
    currentPath: null,
    
    // Link placement
    pendingLink: null,
    pendingComment: null,
    
    // Page rotations
    pageRotations: {},  // pageNum -> degrees
    
    // Existing text editing
    modifiedText: {},     // pageNum -> { runId -> edited / moved / deleted line of existing text }
    modifiedImages: {},   // pageNum -> { imageId -> moved / resized / deleted existing image }
    assets: new Map(),
    assetIdsBySource: new Map(),
    assetSequence: 0,
    renderRevision: 0,
    loadRevision: 0,
    loadingTask: null,
    renderTask: null,
    thumbnailObserver: null,
    rasterCanvas: null,
    editSerial: 0,   // bumps on every change to the document or its edits (invalidates cached exports)
};

// =============================================
// DOM References
// =============================================
const dom = {
    landingScreen: document.getElementById('landing-screen'),
    editorScreen: document.getElementById('editor-screen'),
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    uploadBtn: document.getElementById('upload-btn'),
    
    pdfCanvas: document.getElementById('pdf-canvas'),
    pdfContainer: document.getElementById('pdf-container'),
    pdfPageWrapper: document.getElementById('pdf-page-wrapper'),
    annotationLayer: document.getElementById('annotation-layer'),
    textLayer: document.getElementById('text-layer'),
    
    pageIndicator: document.getElementById('page-indicator'),
    totalPagesEl: document.getElementById('total-pages'),
    zoomLevel: document.getElementById('zoom-level'),
    
    pageThumbnails: document.getElementById('page-thumbnails'),
    sidebar: document.getElementById('sidebar'),
    
    propertiesBar: document.getElementById('properties-bar'),
    propsText: document.getElementById('props-text'),
    propsShape: document.getElementById('props-shape'),
    propsAnnotate: document.getElementById('props-annotate'),
    propsWhiteout: document.getElementById('props-whiteout'),
    propsLinks: document.getElementById('props-links'),
    
    toastContainer: document.getElementById('toast-container'),
    
    // Modals
    signatureModal: document.getElementById('signature-modal'),
    linkModal: document.getElementById('link-modal'),
    commentModal: document.getElementById('comment-modal'),
    npsModal: document.getElementById('nps-modal'),
    npsScale: document.getElementById('nps-scale'),
    npsReasons: document.getElementById('nps-reasons'),
    npsStatus: document.getElementById('nps-status'),
    npsSubmit: document.getElementById('nps-submit'),
    
    sigCanvas: document.getElementById('sig-canvas'),
    imageUploadInput: document.getElementById('image-upload-input'),
};

// Existing text and images on the page (click to edit, drag to move, Delete to remove).
const objectEditor = createObjectEditor({ state, dom, showToast, saveHistory });

// Document tools (merge, split, organize, convert, protect, watermark, ...).
let exportCache = null;
const toolsUI = createToolsUI({
    hasOpenDocument: () => Boolean(state.pdf && state.pdfBytes) && !dom.editorScreen.classList.contains('hidden'),
    getCurrentPdf: async () => {
        // Exporting is slow, so reuse the result until something about the document changes.
        if (!exportCache || exportCache.serial !== state.editSerial) {
            const serial = state.editSerial;
            exportCache = { serial, bytes: await exportPdfBytes() };
        }
        return { name: state.fileName || 'document.pdf', bytes: exportCache.bytes };
    },
    openInEditor: async (bytes, name) => loadPDF(new File([bytes], name, { type: 'application/pdf' })),
});

// =============================================
// Initialize
// =============================================
async function init() {
    state.rasterCanvas = dom.pdfCanvas;

    setupFileUpload();
    setupToolbar();
    setupDropdowns();
    setupProperties();
    setupPageControls();
    setupAnnotationLayer();
    setupModals();
    setupKeyboard();
    setupSidebar();
    setupNps();
    setupToolsEntryPoints();
    selectTool('select');
}

// =============================================
// Document tools entry points
// =============================================
function setupToolsEntryPoints() {
    document.getElementById('open-tools')?.addEventListener('click', () => toolsUI.open('organize'));
    const grid = document.getElementById('landing-tools');
    if (!grid) return;
    for (const [id, icon, label] of TOOL_CARDS) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'feature-card tool-card';
        card.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span></span>`;
        card.querySelector('span').textContent = label;
        card.addEventListener('click', () => toolsUI.open(id));
        grid.append(card);
    }
}

// =============================================
// File Upload
// =============================================
function setupFileUpload() {
    // Click to upload
    dom.uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.fileInput.click();
    });
    
    dom.uploadZone.addEventListener('click', () => {
        dom.fileInput.click();
    });
    
    // File selected
    dom.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
            loadPDF(file);
        }
    });
    
    // Drag and drop
    dom.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.uploadZone.classList.add('drag-over');
    });
    
    dom.uploadZone.addEventListener('dragleave', () => {
        dom.uploadZone.classList.remove('drag-over');
    });
    
    dom.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
            loadPDF(file);
        } else {
            showToast('Please drop a PDF file', 'error');
        }
    });
    
    // Restore the last document from OPFS without a network request.
    opfsStore.restore().then(file => {
        if (file && state.loadRevision === 0 && !state.pdf) loadPDF(file, { persist: false });
    })
        .catch(err => console.warn('No OPFS document restored:', err));
}

// =============================================
// PDF Loading
// =============================================
async function loadPDF(file, { persist = true } = {}) {
    const loadRevision = ++state.loadRevision;
    showLoading('Loading PDF...');
    state.loadingTask?.destroy();
    
    try {
        if (persist) opfsStore.save(file).catch(err => console.warn('OPFS persistence failed:', err));
        const arrayBuffer = await file.arrayBuffer();
        if (loadRevision !== state.loadRevision) return;
        const pdfBytes = new Uint8Array(arrayBuffer);
        state.fileName = file.name || 'document.pdf';
        
        const loadingTask = openPdfDocument({ data: pdfBytes.slice() });
        state.loadingTask = loadingTask;
        const pdf = await loadingTask.promise;
        if (loadRevision !== state.loadRevision) {
            await pdf.destroy();
            return;
        }
        const previousPdf = state.pdf;
        state.pdfBytes = pdfBytes;
        state.pdf = pdf;
        state.totalPages = pdf.numPages;
        state.currentPage = 1;
        state.elements = {};
        state.freehandPaths = {};
        state.history = [];
        state.historyIndex = -1;
        state.dirty = false;
        state.editSerial++;
        state.pageRotations = {};
        state.modifiedText = {};
        state.modifiedImages = {};
        state.assets.clear();
        state.assetIdsBySource.clear();
        state.assetSequence = 0;
        previousPdf?.destroy().catch(() => {});
        saveHistory(false);
        
        // Switch to editor view
        dom.landingScreen.classList.add('hidden');
        dom.editorScreen.classList.remove('hidden');
        
        // Render
        await renderPage(state.currentPage);
        await renderThumbnails();
        updatePageControls();
        
        if (loadRevision !== state.loadRevision) return;
        hideLoading();
        showToast(`Loaded "${file.name}" (${state.totalPages} pages)`, 'success');
    } catch (err) {
        if (loadRevision !== state.loadRevision) return;
        hideLoading();
        showToast('Failed to load PDF: ' + err.message, 'error');
        console.error(err);
    } finally {
        if (state.loadingTask && loadRevision === state.loadRevision) state.loadingTask = null;
    }
}

// =============================================
// PDF Rendering
// =============================================

/** The rotation a page is shown at: its own /Rotate from the file plus any turn made in the editor. */
function displayRotation(page, pageNum) {
    return (((page.rotate || 0) + (state.pageRotations[pageNum] || 0)) % 360 + 360) % 360;
}

async function renderPage(pageNum) {
    if (!state.pdf) return;
    const revision = ++state.renderRevision;
    const page = await state.pdf.getPage(pageNum);
    if (revision !== state.renderRevision) return;
    const rotation = displayRotation(page, pageNum);
    const viewport = page.getViewport({ scale: state.zoom * 1.5, rotation });
    
    // Render into a detached canvas so rapid page/zoom changes never contend for
    // the same PDF.js canvas. The finished frame is then presented by GPU or 2D.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    
    dom.pdfPageWrapper.style.width = viewport.width + 'px';
    dom.pdfPageWrapper.style.height = viewport.height + 'px';
    
    state.renderTask?.cancel();
    const renderTask = page.render({ canvasContext: ctx, viewport });
    state.renderTask = renderTask;
    try {
        await renderTask.promise;
    } catch (error) {
        if (error?.name === 'RenderingCancelledException') return;
        throw error;
    } finally {
        if (state.renderTask === renderTask) state.renderTask = null;
    }
    if (revision !== state.renderRevision) return;
    state.rasterCanvas = canvas;
    dom.pdfCanvas.width = canvas.width;
    dom.pdfCanvas.height = canvas.height;
    const displayContext = dom.pdfCanvas.getContext('2d');
    displayContext.clearRect(0, 0, canvas.width, canvas.height);
    displayContext.drawImage(canvas, 0, 0);
    
    // Render annotations first. Existing-text replacement masks live in the
    // annotation layer and must be added after this clear-and-rebuild step.
    renderElements(pageNum);
    renderFreehandPaths(pageNum);

    // Existing text and images become editable objects beneath the annotation layer.
    await objectEditor.render({ page, viewport, pageNum });
    if (revision !== state.renderRevision) return;
}

// PERF-01 FIX: parallel thumbnail rendering using Promise.all + IntersectionObserver lazy rendering
async function renderThumbnails() {
    state.thumbnailObserver?.disconnect();
    state.thumbnailObserver = null;
    dom.pageThumbnails.innerHTML = '';
    const sourcePdf = state.pdf;
    const thumbScale = 0.2;
    
    // Build all placeholder DOM nodes first (instant)
    const items = [];
    for (let i = 1; i <= state.totalPages; i++) {
        const item = document.createElement('div');
        item.className = 'thumbnail-item' + (i === state.currentPage ? ' active' : '');
        item.dataset.page = i;
        
        const canvas = document.createElement('canvas');
        canvas.className = 'thumb-canvas';
        
        const label = document.createElement('div');
        label.className = 'thumbnail-label';
        label.textContent = i;
        
        const actions = document.createElement('div');
        actions.className = 'thumbnail-actions';
        
        if (state.totalPages > 1) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'thumb-action-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
            deleteBtn.title = `Delete page ${i}`;
            deleteBtn.setAttribute('aria-label', `Delete page ${i}`);
            const pageNum = i; // capture for closure
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePage(pageNum);
            });
            actions.appendChild(deleteBtn);
        }
        
        item.appendChild(canvas);
        item.appendChild(label);
        item.appendChild(actions);
        
        const pageNum = i;
        item.addEventListener('click', () => goToPage(pageNum));
        
        dom.pageThumbnails.appendChild(item);
        items.push({ item, canvas, pageNum: i });
    }
    
    // Use IntersectionObserver to render thumbnails lazily as they scroll into view
    const itemByElement = new WeakMap(items.map(entry => [entry.item, entry]));
    let remaining = items.length;
    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const { canvas, pageNum } = itemByElement.get(entry.target) || {};
            if (!canvas || canvas.dataset.rendered) continue;
            
            try {
                if (sourcePdf !== state.pdf) return;
                const page = await sourcePdf.getPage(pageNum);
                const rotation = displayRotation(page, pageNum);
                const viewport = page.getViewport({ scale: thumbScale, rotation });
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                canvas.dataset.rendered = '1';
            } catch {/* ignore failed thumbnail */ }
            finally {
                observer.unobserve(entry.target);
                remaining--;
                if (remaining === 0) {
                    observer.disconnect();
                    if (state.thumbnailObserver === observer) state.thumbnailObserver = null;
                }
            }
        }
    }, { root: dom.pageThumbnails, rootMargin: '100px' });
    state.thumbnailObserver = observer;
    items.forEach(({ item }) => observer.observe(item));
}

function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > state.totalPages) return;
    state.currentPage = pageNum;
    renderPage(pageNum);
    updatePageControls();
    
    // Update thumbnail active state
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.page) === pageNum);
    });
}

function updatePageControls() {
    dom.pageIndicator.textContent = state.currentPage;
    dom.totalPagesEl.textContent = state.totalPages;
    if (document.activeElement !== dom.zoomLevel) {
        dom.zoomLevel.value = String(Math.round(state.zoom * 100));
    }
}

// =============================================
// Toolbar
// =============================================
function setupToolbar() {
    // Tool buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            
            if (tool === 'undo') {
                undo();
                return;
            }
            if (tool === 'redo') {
                redo();
                return;
            }
            
            // Handle dropdown toggle for tools with dropdowns
            if (btn.classList.contains('has-dropdown')) {
                const dropdown = document.getElementById('dropdown-' + tool);
                closeAllDropdowns();
                if (dropdown) {
                    const rect = btn.getBoundingClientRect();
                    dropdown.style.left = rect.left + 'px';
                    dropdown.classList.toggle('show');
                }
            } else {
                closeAllDropdowns();
            }
            
            selectTool(tool);
        });
    });
    
    // Back to home
    document.getElementById('back-to-home').addEventListener('click', async () => {
        if (state.dirty && !await customConfirm('Go back to home? Unsaved changes will be lost.')) return;
        state.renderRevision++;
        state.renderTask?.cancel();
        state.thumbnailObserver?.disconnect();
        const pdf = state.pdf;
        state.pdf = null;
        pdf?.destroy().catch(() => {});
        dom.editorScreen.classList.add('hidden');
        dom.landingScreen.classList.remove('hidden');
    });
    
    // Save button
    document.getElementById('save-btn').addEventListener('click', savePDF);
}

function selectTool(tool) {
    state.activeTool = tool;
    
    // Update active button
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        if (btn.dataset.tool !== 'undo' && btn.dataset.tool !== 'redo') {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        }
    });
    
    // Update annotation layer cursor
    const layer = dom.annotationLayer;
    layer.className = 'annotation-layer';
    
    if (['select', 'text', 'links', 'forms', 'images', 'sign', 'whiteout', 'shapes', 'annotate', 'object-capture'].includes(tool)) {
        layer.classList.add('active');
    }
    if (tool === 'select') {
        layer.classList.add('select-mode');
    }
    if (tool === 'text') {
        layer.classList.add('text-mode');
    }
    
    // Existing text and images are directly editable in the Select and Text tools. The
    // annotation layer steps aside there so clicks reach them; other tools draw on it.
    const objectMode = tool === 'select' || tool === 'text';
    layer.classList.toggle('passthrough', objectMode);
    if (dom.textLayer) {
        dom.textLayer.classList.toggle('interactive', objectMode);
        dom.textLayer.classList.toggle('text-mode', tool === 'text');
    }
    if (!objectMode) objectEditor.deselect();
    
    // Show relevant properties
    showProperties(tool);
    
    // Handle freehand canvas
    const freehandCanvas = document.querySelector('.freehand-canvas');
    if (freehandCanvas) {
        freehandCanvas.classList.toggle('active', tool === 'annotate' && state.activeAnnotateMode === 'freehand');
    }
}

function showProperties(tool) {
    document.getElementById('whiteout-mode')?.classList.toggle('hidden', tool !== 'whiteout');
    // Hide all prop groups
    [dom.propsText, dom.propsShape, dom.propsAnnotate, dom.propsWhiteout, dom.propsLinks].forEach(p => {
        p.classList.add('hidden');
    });
    
    switch (tool) {
        case 'select':
            dom.propsWhiteout.classList.remove('hidden');
            dom.propsWhiteout.querySelector('.prop-hint').innerHTML = '<i class="fas fa-mouse-pointer" aria-hidden="true"></i> Click any text to edit it. Drag text, images and shapes to move them. Press Delete to remove.';
            break;
        case 'text':
            dom.propsText.classList.remove('hidden');
            break;
        case 'shapes':
            dom.propsShape.classList.remove('hidden');
            break;
        case 'annotate':
            dom.propsAnnotate.classList.remove('hidden');
            break;
        case 'whiteout':
            dom.propsWhiteout.classList.remove('hidden');
            dom.propsWhiteout.querySelector('.prop-hint').innerHTML = state.whiteoutMode === 'redact'
                ? '<i class="fas fa-user-secret" aria-hidden="true"></i> Drag over anything to black it out. The text and images underneath are removed for good.'
                : '<i class="fas fa-info-circle" aria-hidden="true"></i> Drag over anything to cover it. Text underneath is erased from the file.';
            break;
        case 'object-capture':
            dom.propsWhiteout.classList.remove('hidden');
            dom.propsWhiteout.querySelector('.prop-hint').innerHTML = '<i class="fas fa-crop-simple" aria-hidden="true"></i> Drag tightly around an image or graphic, then move or resize it';
            break;
        case 'links':
            dom.propsLinks.classList.remove('hidden');
            break;
    }
}

// =============================================
// Dropdowns
// =============================================
function setupDropdowns() {
    // Annotate dropdown
    document.querySelectorAll('#dropdown-annotate .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            state.activeAnnotateMode = item.dataset.action;
            document.querySelectorAll('#dropdown-annotate .dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            closeAllDropdowns();
            
            if (item.dataset.action === 'freehand') {
                ensureFreehandCanvas();
            }
            
            if (item.dataset.action === 'comment') {
                // Will be handled in annotation layer click
            }
        });
    });
    
    // Shapes dropdown
    document.querySelectorAll('#dropdown-shapes .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            state.activeShapeMode = item.dataset.action;
            document.querySelectorAll('#dropdown-shapes .dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            closeAllDropdowns();
        });
    });
    
    // Forms dropdown
    document.querySelectorAll('#dropdown-forms .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            state.activeFormMode = item.dataset.action;
            closeAllDropdowns();
        });
    });
    
    // Images dropdown
    document.querySelectorAll('#dropdown-images .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.action === 'upload-image') {
                dom.imageUploadInput.click();
            } else if (item.dataset.action === 'from-clipboard') {
                pasteImageFromClipboard();
            } else if (item.dataset.action === 'capture-object') {
                selectTool('object-capture');
                showToast('Drag a tight box around an existing image or graphic', 'info');
            }
            closeAllDropdowns();
        });
    });
    
    // Sign dropdown
    document.querySelectorAll('#dropdown-sign .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            closeAllDropdowns();
            if (item.dataset.action === 'draw-signature') {
                openSignatureModal('draw');
            } else if (item.dataset.action === 'type-signature') {
                openSignatureModal('type');
            } else if (item.dataset.action === 'upload-signature') {
                openSignatureModal('upload');
            }
        });
    });
    
    // Image upload handler
    dom.imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                addImageToPage(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
        dom.imageUploadInput.value = '';
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.has-dropdown') && !e.target.closest('.dropdown-menu')) {
            closeAllDropdowns();
        }
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
}

// =============================================
// Properties
// =============================================
function setupProperties() {
    // Text properties
    document.getElementById('font-family').addEventListener('change', (e) => {
        state.textProps.fontFamily = e.target.value;
    });
    
    document.getElementById('font-size').addEventListener('change', (e) => {
        state.textProps.fontSize = parseInt(e.target.value);
    });
    
    document.getElementById('bold-btn').addEventListener('click', function() {
        state.textProps.bold = !state.textProps.bold;
        this.classList.toggle('active');
    });
    
    document.getElementById('italic-btn').addEventListener('click', function() {
        state.textProps.italic = !state.textProps.italic;
        this.classList.toggle('active');
    });
    
    document.getElementById('text-color').addEventListener('input', (e) => {
        state.textProps.color = e.target.value;
    });
    
    // Shape properties
    document.getElementById('stroke-color').addEventListener('input', (e) => {
        state.shapeProps.strokeColor = e.target.value;
    });
    
    document.getElementById('fill-color').addEventListener('input', (e) => {
        state.shapeProps.fillColor = e.target.value;
    });
    
    document.getElementById('stroke-width').addEventListener('input', (e) => {
        state.shapeProps.strokeWidth = parseInt(e.target.value);
        document.getElementById('stroke-width-val').textContent = e.target.value + 'px';
    });
    
    document.getElementById('shape-opacity').addEventListener('input', (e) => {
        state.shapeProps.opacity = parseInt(e.target.value);
        document.getElementById('opacity-val').textContent = e.target.value + '%';
    });
    
    // Whiteout / redact
    document.querySelectorAll('#whiteout-mode [data-mode]').forEach(button => {
        button.addEventListener('click', () => {
            state.whiteoutMode = button.dataset.mode;
            document.querySelectorAll('#whiteout-mode [data-mode]').forEach(other => {
                other.classList.toggle('active', other === button);
                other.setAttribute('aria-pressed', String(other === button));
            });
            showProperties('whiteout');
        });
    });
    
    // Annotate properties
    document.getElementById('annotate-color').addEventListener('input', (e) => {
        state.annotateProps.color = e.target.value;
    });
    
    document.getElementById('annotate-size').addEventListener('input', (e) => {
        state.annotateProps.size = parseInt(e.target.value);
        document.getElementById('annotate-size-val').textContent = e.target.value + 'px';
    });
}

// =============================================
// Page Controls
// =============================================
/** Elements are stored in screen pixels at the current zoom, so a zoom change rescales them. */
function scaleEditorGeometry(elementsByPage, pathsByPage, ratio) {
    Object.values(elementsByPage).forEach(list => {
        list.forEach(el => {
            for (const key of ['x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'fontSize']) {
                if (el[key] !== undefined) el[key] *= ratio;
            }
        });
    });
    Object.values(pathsByPage).forEach(list => {
        list.forEach(path => {
            path.size *= ratio;
            path.points.forEach(point => { point.x *= ratio; point.y *= ratio; });
        });
    });
}

function setZoom(newZoom) {
    newZoom = Math.min(4, Math.max(0.25, Number(newZoom)));
    if (!Number.isFinite(newZoom)) return;
    if (newZoom === state.zoom) return;
    const ratio = newZoom / state.zoom;
    state.zoom = newZoom;
    
    // Scale all elements so they stay aligned to the PDF
    scaleEditorGeometry(state.elements, state.freehandPaths, ratio);
    
    renderPage(state.currentPage);
    updatePageControls();
}

function setupPageControls() {
    const applyZoomInput = () => {
        const percentage = Number.parseFloat(dom.zoomLevel.value);
        if (!Number.isFinite(percentage)) {
            dom.zoomLevel.value = String(Math.round(state.zoom * 100));
            return;
        }
        setZoom(percentage / 100);
        dom.zoomLevel.value = String(Math.round(state.zoom * 100));
    };

    dom.zoomLevel.addEventListener('change', applyZoomInput);
    dom.zoomLevel.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyZoomInput();
            dom.zoomLevel.blur();
        }
        if (event.key === 'Escape') {
            dom.zoomLevel.value = String(Math.round(state.zoom * 100));
            dom.zoomLevel.blur();
        }
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
        setZoom(Math.min(state.zoom + 0.25, 4));
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        setZoom(Math.max(state.zoom - 0.25, 0.25));
    });
    
    document.getElementById('zoom-fit').addEventListener('click', () => {
        // Fit to container width
        if (!state.pdf) return;
        state.pdf.getPage(state.currentPage).then(page => {
            const viewport = page.getViewport({ scale: 1, rotation: displayRotation(page, state.currentPage) });
            const containerWidth = dom.pdfContainer.clientWidth - 48;
            setZoom(containerWidth / (viewport.width * 1.5));
        });
    });
    
    document.getElementById('rotate-left').addEventListener('click', () => {
        const page = state.currentPage;
        state.editSerial++;
        state.pageRotations[page] = ((state.pageRotations[page] || 0) - 90) % 360;
        renderPage(page);
        renderThumbnails();
        state.dirty = true;
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        const page = state.currentPage;
        state.editSerial++;
        state.pageRotations[page] = ((state.pageRotations[page] || 0) + 90) % 360;
        renderPage(page);
        renderThumbnails();
        state.dirty = true;
    });
    
    document.getElementById('insert-page-inline').addEventListener('click', () => {
        insertBlankPage(state.currentPage);
    });
    
    document.getElementById('add-page-btn').addEventListener('click', () => {
        insertBlankPage(state.totalPages);
    });
    
    // PERF-03 FIX: Debounce zoom re-render so rapid scroll/wheel events don't fire dozens of renders
    let _zoomTimer = null;
    const debouncedRender = (newZoom) => {
        clearTimeout(_zoomTimer);
        _zoomTimer = setTimeout(() => {
            setZoom(newZoom);
        }, 80);
    };
    
    dom.pdfContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            let newZoom;
            if (e.deltaY < 0) {
                newZoom = Math.min(state.zoom + 0.1, 4);
            } else {
                newZoom = Math.max(state.zoom - 0.1, 0.25);
            }
            debouncedRender(newZoom);
        }
    }, { passive: false });
}

async function insertBlankPage(afterPage) {
    if (!state.pdfBytes) return;
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(state.pdfBytes);
        pdfDoc.insertPage(afterPage, [612, 792]); // Letter size
        
        const modifiedBytes = await pdfDoc.save();
        state.pdfBytes = new Uint8Array(modifiedBytes);
        
        const pdf = await openPdfDocument({ data: state.pdfBytes.slice() }).promise;
        const previousPdf = state.pdf;
        state.pdf = pdf;
        state.totalPages = pdf.numPages;
        state.dirty = true;
        previousPdf?.destroy().catch(() => {});
        
        // BUG-05 FIX: shift all element/text page keys > afterPage up by 1
        state.elements     = remapPageKeys(state.elements, afterPage, +1);
        state.modifiedText = remapPageKeys(state.modifiedText, afterPage, +1);
        state.modifiedImages = remapPageKeys(state.modifiedImages, afterPage, +1);
        state.freehandPaths = remapPageKeys(state.freehandPaths, afterPage, +1);
        state.pageRotations = remapPageKeys(state.pageRotations, afterPage, +1);
        resetHistory();
        
        goToPage(afterPage + 1);
        await renderThumbnails();
        updatePageControls();
        showToast('Blank page inserted (undo history starts fresh after page changes)', 'success');
    } catch (err) {
        showToast('Failed to insert page: ' + err.message, 'error');
    }
}

async function deletePage(pageNum) {
    if (state.totalPages <= 1) {
        showToast('Cannot delete the only page', 'error');
        return;
    }
    
    const confirmed = await customConfirm(`Delete page ${pageNum}?`);
    if (!confirmed) return;
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(state.pdfBytes);
        pdfDoc.removePage(pageNum - 1);
        
        const modifiedBytes = await pdfDoc.save();
        state.pdfBytes = new Uint8Array(modifiedBytes);
        
        const pdf = await openPdfDocument({ data: state.pdfBytes.slice() }).promise;
        const previousPdf = state.pdf;
        state.pdf = pdf;
        state.totalPages = pdf.numPages;
        state.dirty = true;
        previousPdf?.destroy().catch(() => {});
        
        // BUG-04 FIX: remap all page-keyed state dictionaries
        state.elements      = remapPageKeys(state.elements, pageNum, 0);
        state.modifiedText  = remapPageKeys(state.modifiedText, pageNum, 0);
        state.modifiedImages = remapPageKeys(state.modifiedImages, pageNum, 0);
        state.freehandPaths = remapPageKeys(state.freehandPaths, pageNum, 0);
        state.pageRotations = remapPageKeys(state.pageRotations, pageNum, 0);
        resetHistory();
        
        if (state.currentPage > state.totalPages) {
            state.currentPage = state.totalPages;
        }
        
        await renderPage(state.currentPage);
        await renderThumbnails();
        updatePageControls();
        showToast(`Page ${pageNum} deleted (undo history starts fresh after page changes)`, 'success');
    } catch (err) {
        showToast('Failed to delete page: ' + err.message, 'error');
    }
}

/**
 * Remap page-keyed dictionaries after insert or delete.
 * @param {Object} dict  - { pageNum: any }
 * @param {number} pivot - the affected page number
 * @param {number} dir   - +1 = insert (shift keys > pivot up), 0 = delete (drop pivot, shift keys > pivot down)
 */
function remapPageKeys(dict, pivot, dir) {
    const newDict = {};
    for (const [k, v] of Object.entries(dict)) {
        const n = parseInt(k, 10);
        if (dir === 0) {
            // deletion: drop the deleted page, shift pages after it down
            if (n === pivot) continue;
            newDict[n > pivot ? n - 1 : n] = v;
        } else {
            // insertion: shift pages after the pivot up
            newDict[n > pivot ? n + 1 : n] = v;
        }
    }
    return newDict;
}

// =============================================
// Annotation Layer
// =============================================
function setupAnnotationLayer() {
    const layer = dom.annotationLayer;
    
    layer.addEventListener('mousedown', onLayerMouseDown);
    layer.addEventListener('mousemove', onLayerMouseMove);
    layer.addEventListener('mouseup', onLayerMouseUp);
    layer.addEventListener('click', onLayerClick);
    
    // RESP-01 FIX: Touch event support for mobile/tablet
    layer.addEventListener('touchstart',  onLayerTouchStart,  { passive: false });
    layer.addEventListener('touchmove',   onLayerTouchMove,   { passive: false });
    layer.addEventListener('touchend',    onLayerTouchEnd,    { passive: false });
    layer.addEventListener('touchcancel', onLayerTouchEnd,    { passive: false });

    // In the Select and Text tools the text layer (below this one) receives empty-space input.
    const objectLayer = dom.textLayer;
    objectLayer.addEventListener('mousedown', onLayerMouseDown);
    objectLayer.addEventListener('mousemove', onLayerMouseMove);
    objectLayer.addEventListener('mouseup', onLayerMouseUp);
    objectLayer.addEventListener('click', onLayerClick);
    objectLayer.addEventListener('touchstart',  onLayerTouchStart,  { passive: false });
    objectLayer.addEventListener('touchmove',   onLayerTouchMove,   { passive: false });
    objectLayer.addEventListener('touchend',    onLayerTouchEnd,    { passive: false });
    objectLayer.addEventListener('touchcancel', onLayerTouchEnd,    { passive: false });

    // Place dropped image files at the exact drop point on the current page.
    dom.pdfPageWrapper.addEventListener('dragover', event => {
        const hasImage = [...event.dataTransfer.items].some(item => item.kind === 'file' && item.type.startsWith('image/'));
        if (!hasImage) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        dom.pdfPageWrapper.classList.add('image-drop-active');
    });
    dom.pdfPageWrapper.addEventListener('dragleave', event => {
        if (!dom.pdfPageWrapper.contains(event.relatedTarget)) dom.pdfPageWrapper.classList.remove('image-drop-active');
    });
    dom.pdfPageWrapper.addEventListener('drop', event => {
        const file = [...event.dataTransfer.files].find(candidate => candidate.type.startsWith('image/'));
        if (!file) return;
        event.preventDefault();
        dom.pdfPageWrapper.classList.remove('image-drop-active');
        const rect = dom.pdfPageWrapper.getBoundingClientRect();
        const dropX = event.clientX - rect.left;
        const dropY = event.clientY - rect.top;
        const reader = new FileReader();
        reader.onload = loadEvent => addImageToPage(loadEvent.target.result, dropX, dropY, true);
        reader.readAsDataURL(file);
    });
}

const isPageSurface = target => target === dom.annotationLayer || target === dom.textLayer;

function onLayerClick(e) {
    if (!isPageSurface(e.target)) return;
    
    const rect = dom.annotationLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    switch (state.activeTool) {
        case 'text':
            addTextElement(x, y);
            break;
        case 'links':
            openLinkModal(x, y);
            break;
        case 'forms':
            addFormElement(x, y);
            break;
        case 'annotate':
            if (state.activeAnnotateMode === 'comment') {
                openCommentModal(x, y);
            }
            break;
    }
}

function onLayerMouseDown(e) {
    if (!isPageSurface(e.target)) return;

    // Clicking or beginning a new marquee on empty page space clears selection.
    document.querySelectorAll('.edit-element.selected').forEach(element => element.classList.remove('selected'));
    
    const rect = dom.annotationLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (['whiteout', 'shapes', 'object-capture'].includes(state.activeTool) ||
        (state.activeTool === 'annotate' && ['highlight', 'underline', 'strikethrough'].includes(state.activeAnnotateMode))) {
        state.isDrawing = true;
        state.drawStart = { x, y };
        
        // Create preview element
        if (state.activeTool === 'object-capture') {
            createDrawPreview('object-capture', x, y);
        } else if (state.activeTool === 'whiteout') {
            createDrawPreview('whiteout', x, y);
        } else if (state.activeTool === 'shapes') {
            createDrawPreview(state.activeShapeMode, x, y);
        } else {
            createDrawPreview(state.activeAnnotateMode, x, y);
        }
    }
}

function onLayerMouseMove(e) {
    if (!state.isDrawing || !state.drawStart) return;
    
    const rect = dom.annotationLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateDrawPreview(x, y);
}

function onLayerMouseUp(e) {
    if (!state.isDrawing || !state.drawStart) return;
    
    const rect = dom.annotationLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    state.isDrawing = false;
    finalizeDrawing(state.drawStart.x, state.drawStart.y, x, y);
    removeDrawPreview();
    state.drawStart = null;
}

// =============================================
// Touch Event Handlers (RESP-01 FIX)
// =============================================
function getLayerCoords(clientX, clientY) {
    const rect = dom.annotationLayer.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function onLayerTouchStart(e) {
    if (e.touches.length !== 1 || !isPageSurface(e.target)) return;
    e.preventDefault();
    const { x, y } = getLayerCoords(e.touches[0].clientX, e.touches[0].clientY);
    // Simulate mousedown
    const synth = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target, preventDefault: () => {} };
    if (['whiteout', 'shapes', 'object-capture'].includes(state.activeTool) ||
        (state.activeTool === 'annotate' && ['highlight', 'underline', 'strikethrough'].includes(state.activeAnnotateMode))) {
        state.isDrawing = true;
        state.drawStart = { x, y };
        if (state.activeTool === 'object-capture') createDrawPreview('object-capture', x, y);
        else if (state.activeTool === 'whiteout') createDrawPreview('whiteout', x, y);
        else if (state.activeTool === 'shapes') createDrawPreview(state.activeShapeMode, x, y);
        else createDrawPreview(state.activeAnnotateMode, x, y);
    }
}

function onLayerTouchMove(e) {
    if (e.touches.length !== 1 || !state.isDrawing) return;
    e.preventDefault();
    const { x, y } = getLayerCoords(e.touches[0].clientX, e.touches[0].clientY);
    if (state.isDrawing && state.drawStart) updateDrawPreview(x, y);
}

function onLayerTouchEnd(e) {
    if (!state.isDrawing || !state.drawStart) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const { x, y } = getLayerCoords(touch.clientX, touch.clientY);
    state.isDrawing = false;
    finalizeDrawing(state.drawStart.x, state.drawStart.y, x, y);
    removeDrawPreview();
    state.drawStart = null;
}

// =============================================
// Draw Preview
// =============================================
let drawPreviewEl = null;

function createDrawPreview(type, x, y) {
    removeDrawPreview();
    
    if (['rectangle', 'circle', 'line', 'arrow'].includes(type)) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('shape-svg');
        svg.id = 'draw-preview';
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '15';
        dom.annotationLayer.appendChild(svg);
        drawPreviewEl = svg;
    } else {
        const div = document.createElement('div');
        div.id = 'draw-preview';
        div.style.position = 'absolute';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '15';
        
        if (type === 'whiteout') {
            div.style.background = 'white';
            div.style.border = '1px dashed #ccc';
        } else if (type === 'object-capture') {
            div.style.background = 'rgba(180, 255, 0, 0.08)';
            div.style.border = '2px dashed #b4ff00';
        } else {
            div.style.background = state.annotateProps.color;
            div.style.opacity = '0.35';
            div.style.borderRadius = '2px';
        }
        
        dom.annotationLayer.appendChild(div);
        drawPreviewEl = div;
    }
}

function updateDrawPreview(x, y) {
    if (!drawPreviewEl || !state.drawStart) return;
    
    const sx = state.drawStart.x;
    const sy = state.drawStart.y;
    
    if (drawPreviewEl.tagName === 'svg' || drawPreviewEl.tagName === 'SVG') {
        drawPreviewEl.innerHTML = '';
        const shapeType = state.activeShapeMode;
        
        if (shapeType === 'rectangle') {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', Math.min(sx, x));
            rect.setAttribute('y', Math.min(sy, y));
            rect.setAttribute('width', Math.abs(x - sx));
            rect.setAttribute('height', Math.abs(y - sy));
            rect.setAttribute('stroke', state.shapeProps.strokeColor);
            rect.setAttribute('fill', state.shapeProps.fillColor);
            rect.setAttribute('stroke-width', state.shapeProps.strokeWidth);
            rect.setAttribute('opacity', state.shapeProps.opacity / 100);
            drawPreviewEl.appendChild(rect);
        } else if (shapeType === 'circle') {
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('cx', (sx + x) / 2);
            ellipse.setAttribute('cy', (sy + y) / 2);
            ellipse.setAttribute('rx', Math.abs(x - sx) / 2);
            ellipse.setAttribute('ry', Math.abs(y - sy) / 2);
            ellipse.setAttribute('stroke', state.shapeProps.strokeColor);
            ellipse.setAttribute('fill', state.shapeProps.fillColor);
            ellipse.setAttribute('stroke-width', state.shapeProps.strokeWidth);
            ellipse.setAttribute('opacity', state.shapeProps.opacity / 100);
            drawPreviewEl.appendChild(ellipse);
        } else if (shapeType === 'line') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sx);
            line.setAttribute('y1', sy);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', state.shapeProps.strokeColor);
            line.setAttribute('stroke-width', state.shapeProps.strokeWidth);
            line.setAttribute('opacity', state.shapeProps.opacity / 100);
            drawPreviewEl.appendChild(line);
        } else if (shapeType === 'arrow') {
            // Arrow with marker
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'preview-arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '10');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', state.shapeProps.strokeColor);
            marker.appendChild(polygon);
            defs.appendChild(marker);
            drawPreviewEl.appendChild(defs);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sx);
            line.setAttribute('y1', sy);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', state.shapeProps.strokeColor);
            line.setAttribute('stroke-width', state.shapeProps.strokeWidth);
            line.setAttribute('marker-end', 'url(#preview-arrowhead)');
            line.setAttribute('opacity', state.shapeProps.opacity / 100);
            drawPreviewEl.appendChild(line);
        }
    } else {
        const left = Math.min(sx, x);
        const top = Math.min(sy, y);
        const width = Math.abs(x - sx);
        const height = Math.abs(y - sy);
        
        drawPreviewEl.style.left = left + 'px';
        drawPreviewEl.style.top = top + 'px';
        drawPreviewEl.style.width = width + 'px';
        drawPreviewEl.style.height = height + 'px';
    }
}

function removeDrawPreview() {
    const preview = document.getElementById('draw-preview');
    if (preview) preview.remove();
    drawPreviewEl = null;
}

function finalizeDrawing(x1, y1, x2, y2) {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    if (width < 5 && height < 5) return; // Too small
    
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const page = state.currentPage;
    
    if (state.activeTool === 'whiteout') {
        addElement(page, {
            type: 'whiteout',
            x: left, y: top,
            width, height,
            ...(state.whiteoutMode === 'redact' ? { color: '#000000', redact: true } : {})
        });
    } else if (state.activeTool === 'object-capture' || state.activeTool === 'select') {
        captureExistingObject(left, top, width, height);
        return;
    } else if (state.activeTool === 'shapes') {
        addElement(page, {
            type: 'shape',
            shapeType: state.activeShapeMode,
            x1, y1, x2, y2,
            strokeColor: state.shapeProps.strokeColor,
            fillColor: state.shapeProps.fillColor,
            strokeWidth: state.shapeProps.strokeWidth,
            opacity: state.shapeProps.opacity
        });
    } else if (state.activeTool === 'annotate') {
        addElement(page, {
            type: 'annotation',
            annotationType: state.activeAnnotateMode,
            x: left, y: top,
            width, height,
            color: state.annotateProps.color
        });
    }
    
    renderElements(page);
    saveHistory();
}

// =============================================
// Elements Management
// =============================================
function addElement(pageNum, elementData) {
    if (!state.elements[pageNum]) {
        state.elements[pageNum] = [];
    }
    elementData.id = 'el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    state.elements[pageNum].push(elementData);
    return elementData;
}

function removeElement(pageNum, elementId) {
    if (!state.elements[pageNum]) return;
    state.elements[pageNum] = state.elements[pageNum].filter(el => el.id !== elementId);
    renderElements(pageNum);
    saveHistory();
}

function renderElements(pageNum) {
    // Clear annotation layer (keep freehand canvas)
    const freehandCanvas = dom.annotationLayer.querySelector('.freehand-canvas');
    dom.annotationLayer.innerHTML = '';
    if (freehandCanvas) dom.annotationLayer.appendChild(freehandCanvas);
    
    const elements = state.elements[pageNum] || [];
    
    elements.forEach(el => {
        const domEl = createDomElement(el);
        if (domEl) {
            dom.annotationLayer.appendChild(domEl);
        }
    });
}

function createDomElement(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'edit-element';
    wrapper.dataset.id = data.id;
    
    // Delete button
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-handle';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeElement(state.currentPage, data.id);
    });
    
    // Drag handle
    const dragBtn = document.createElement('div');
    dragBtn.className = 'drag-handle';
    dragBtn.innerHTML = '<i class="fas fa-arrows-alt"></i>';
    // No click listener needed, mousedown bubbles up to the wrapper and makeDraggable handles it
    
    switch (data.type) {
        case 'text': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            
            const textEl = document.createElement('div');
            textEl.className = 'edit-text';
            textEl.contentEditable = true;
            textEl.textContent = data.text || 'Type here...';
            textEl.style.fontFamily = CSS_FAMILY[familyKeyFor(data.fontFamily)];
            textEl.style.fontSize = (data.fontSize || 12) + 'px';
            textEl.style.fontWeight = data.bold ? 'bold' : 'normal';
            textEl.style.fontStyle = data.italic ? 'italic' : 'normal';
            textEl.style.color = data.color || '#000000';
            
            // innerText keeps line breaks, which the saved PDF reproduces.
            textEl.addEventListener('input', () => {
                data.text = textEl.innerText.replace(/\n$/, '');
            });
            
            textEl.addEventListener('blur', () => {
                data.text = textEl.innerText.replace(/\n$/, '');
                saveHistory();
            });
            
            wrapper.appendChild(textEl);
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'image': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            wrapper.style.width = (data.width || 200) + 'px';
            wrapper.style.height = data.height ? data.height + 'px' : 'auto';
            
            const img = document.createElement('img');
            img.className = 'edit-image';
            img.src = resolveAssetSource(data);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.draggable = false;
            
            wrapper.appendChild(img);
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            addResizeHandles(wrapper, data);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'signature': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            
            if (data.sigType === 'drawn' || data.sigType === 'uploaded') {
                wrapper.style.width = (data.width || 200) + 'px';
                const img = document.createElement('img');
                img.className = 'edit-image';
                img.src = resolveAssetSource(data);
                img.style.width = '100%';
                img.draggable = false;
                wrapper.appendChild(img);
            } else {
                const textEl = document.createElement('div');
                textEl.style.fontFamily = data.font;
                textEl.style.fontSize = '36px';
                textEl.style.color = '#000';
                textEl.textContent = data.text;
                wrapper.appendChild(textEl);
            }
            
            wrapper.appendChild(deleteBtn);
            addResizeHandles(wrapper, data);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'link': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            
            const linkEl = document.createElement('a');
            linkEl.className = 'edit-link';
            linkEl.textContent = data.displayText || 'Link';
            // SEC-02: Always re-sanitize stored URL at render time
            const safeHref = sanitizeUrl(data.url);
            if (safeHref) {
                linkEl.href = safeHref;
                linkEl.target = '_blank';
                linkEl.rel = 'noopener noreferrer'; // prevent tab-napping
            } else {
                linkEl.removeAttribute('href');
                linkEl.style.cursor = 'default';
            }
            
            wrapper.appendChild(linkEl);
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'comment': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            
            const commentEl = document.createElement('div');
            commentEl.className = 'edit-comment';
            commentEl.innerHTML = '<i class="fas fa-comment"></i>';
            
            const tooltip = document.createElement('div');
            tooltip.className = 'comment-tooltip';
            tooltip.textContent = data.text;
            commentEl.appendChild(tooltip);
            
            wrapper.appendChild(commentEl);
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'whiteout': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            wrapper.style.width = data.width + 'px';
            wrapper.style.height = data.height + 'px';
            wrapper.style.background = data.color || '#ffffff';
            wrapper.classList.add('whiteout-rect');
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            addResizeHandles(wrapper, data);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'shape': {
            const minX = Math.min(data.x1, data.x2);
            const minY = Math.min(data.y1, data.y2);
            const w = Math.abs(data.x2 - data.x1);
            const h = Math.abs(data.y2 - data.y1);
            
            wrapper.style.left = minX + 'px';
            wrapper.style.top = minY + 'px';
            wrapper.style.width = w + 'px';
            wrapper.style.height = h + 'px';
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.overflow = 'visible';
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
            
            if (data.shapeType === 'rectangle') {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', 0);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', w);
                rect.setAttribute('height', h);
                rect.setAttribute('stroke', data.strokeColor);
                rect.setAttribute('fill', data.fillColor);
                rect.setAttribute('stroke-width', data.strokeWidth);
                rect.setAttribute('opacity', data.opacity / 100);
                svg.appendChild(rect);
            } else if (data.shapeType === 'circle') {
                const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                ellipse.setAttribute('cx', w / 2);
                ellipse.setAttribute('cy', h / 2);
                ellipse.setAttribute('rx', w / 2);
                ellipse.setAttribute('ry', h / 2);
                ellipse.setAttribute('stroke', data.strokeColor);
                ellipse.setAttribute('fill', data.fillColor);
                ellipse.setAttribute('stroke-width', data.strokeWidth);
                ellipse.setAttribute('opacity', data.opacity / 100);
                svg.appendChild(ellipse);
            } else if (data.shapeType === 'line') {
                const relX1 = data.x1 - minX;
                const relY1 = data.y1 - minY;
                const relX2 = data.x2 - minX;
                const relY2 = data.y2 - minY;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', relX1);
                line.setAttribute('y1', relY1);
                line.setAttribute('x2', relX2);
                line.setAttribute('y2', relY2);
                line.setAttribute('stroke', data.strokeColor);
                line.setAttribute('stroke-width', data.strokeWidth);
                line.setAttribute('opacity', data.opacity / 100);
                svg.appendChild(line);
            } else if (data.shapeType === 'arrow') {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', 'arrowhead-' + data.id);
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '7');
                marker.setAttribute('refX', '10');
                marker.setAttribute('refY', '3.5');
                marker.setAttribute('orient', 'auto');
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                polygon.setAttribute('fill', data.strokeColor);
                marker.appendChild(polygon);
                defs.appendChild(marker);
                svg.appendChild(defs);
                
                const relX1 = data.x1 - minX;
                const relY1 = data.y1 - minY;
                const relX2 = data.x2 - minX;
                const relY2 = data.y2 - minY;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', relX1);
                line.setAttribute('y1', relY1);
                line.setAttribute('x2', relX2);
                line.setAttribute('y2', relY2);
                line.setAttribute('stroke', data.strokeColor);
                line.setAttribute('stroke-width', data.strokeWidth);
                line.setAttribute('marker-end', `url(#arrowhead-${data.id})`);
                line.setAttribute('opacity', data.opacity / 100);
                svg.appendChild(line);
            }
            
            wrapper.appendChild(svg);
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'annotation': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            wrapper.style.width = data.width + 'px';
            wrapper.style.height = data.height + 'px';
            wrapper.style.background = data.color;
            wrapper.style.opacity = '0.35';
            wrapper.style.borderRadius = '2px';
            wrapper.classList.add('highlight-overlay');
            
            if (data.annotationType === 'underline') {
                wrapper.style.background = 'transparent';
                wrapper.style.borderBottom = `3px solid ${data.color}`;
                wrapper.style.opacity = '0.7';
            } else if (data.annotationType === 'strikethrough') {
                wrapper.style.background = 'transparent';
                wrapper.style.opacity = '1';
                const line = document.createElement('div');
                line.style.position = 'absolute';
                line.style.top = '50%';
                line.style.left = '0';
                line.style.right = '0';
                line.style.height = '2px';
                line.style.background = data.color;
                wrapper.appendChild(line);
            }
            
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
        
        case 'form': {
            wrapper.style.left = data.x + 'px';
            wrapper.style.top = data.y + 'px';
            
            if (data.formType === 'text-field') {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-text-field';
                input.placeholder = 'Text field';
                wrapper.appendChild(input);
            } else if (data.formType === 'checkbox') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-checkbox';
                wrapper.appendChild(input);
            } else if (data.formType === 'radio') {
                const input = document.createElement('input');
                input.type = 'radio';
                input.className = 'form-radio';
                input.name = 'radio-group-' + Date.now();
                wrapper.appendChild(input);
            } else if (data.formType === 'dropdown-field') {
                const select = document.createElement('select');
                select.className = 'form-text-field';
                select.innerHTML = '<option>Option 1</option><option>Option 2</option><option>Option 3</option>';
                wrapper.appendChild(select);
            }
            
            wrapper.appendChild(dragBtn);
            wrapper.appendChild(deleteBtn);
            makeDraggable(wrapper, data);
            break;
        }
    }
    
    return wrapper;
}

// =============================================
// Draggable & Resizable
// =============================================
function makeDraggable(element, data) {
    const onStart = (e) => {
        if (e.target.closest('.delete-handle') || e.target.closest('.resize-handle') ||
            e.target.classList.contains('edit-text') || e.target.tagName === 'INPUT' ||
            e.target.tagName === 'SELECT' || e.target.tagName === 'A') return;
        
        let isDragging = true;
        
        // Support both touch and mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const startX = clientX;
        const startY = clientY;
        const origX = parseFloat(element.style.left) || 0;
        const origY = parseFloat(element.style.top) || 0;
        
        // For shapes, we need to shift x1,y1,x2,y2
        const isShape = data.type === 'shape';
        const origX1 = data.x1;
        const origY1 = data.y1;
        const origX2 = data.x2;
        const origY2 = data.y2;
        
        selectEditElement(element);
        
        // Only prevent default for mouse events to avoid blocking touch scrolling if not moving
        if (!e.touches) e.preventDefault();
        
        const onMove = (ev) => {
            if (!isDragging) return;
            const currentX = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const currentY = ev.touches ? ev.touches[0].clientY : ev.clientY;
            
            // Adjust dx, dy for zoom level if canvas is zoomed (note: if wrapper is actual size, zoom scaling might not be needed for screen pixels vs DOM pixels, but we scale it by zoom if the user meant scaled coordinates)
            // Wait, wrapper DOM is actual size. So 1 screen pixel = 1 DOM pixel.
            const dx = currentX - startX;
            const dy = currentY - startY;
            
            element.style.left = (origX + dx) + 'px';
            element.style.top  = (origY + dy) + 'px';
            
            if (isShape) {
                data.x1 = origX1 + dx;
                data.y1 = origY1 + dy;
                data.x2 = origX2 + dx;
                data.y2 = origY2 + dy;
            } else {
                data.x = origX + dx;
                data.y = origY + dy;
            }
            
            if (ev.touches) ev.preventDefault(); // Prevent scrolling while dragging
        };
        
        const onUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            document.removeEventListener('touchcancel', onUp);
            
            saveHistory();
        };
        
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        document.addEventListener('touchcancel', onUp);
    };

    element.addEventListener('mousedown', onStart);
    element.addEventListener('touchstart', onStart, { passive: false });
}

function selectEditElement(element) {
    document.querySelectorAll('.edit-element.selected').forEach(selected => {
        if (selected !== element) selected.classList.remove('selected');
    });
    element.classList.add('selected');
}

function addResizeHandles(element, data) {
    const handles = ['se', 'sw', 'ne', 'nw'];
    
    handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        
        let isResizing = false;
        let startX, startY, origW, origH, origLeft, origTop;
        
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            selectEditElement(element);
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            origW = element.offsetWidth;
            origH = element.offsetHeight;
            origLeft = parseFloat(element.style.left);
            origTop = parseFloat(element.style.top);
            
            const onMove = (ev) => {
                if (!isResizing) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                
                let newW = origW, newH = origH;
                let newLeft = origLeft, newTop = origTop;
                
                if (pos.includes('e')) newW = Math.max(30, origW + dx);
                if (pos.includes('w')) {
                    newW = Math.max(30, origW - dx);
                    newLeft = origLeft + dx;
                }
                if (pos.includes('s')) newH = Math.max(20, origH + dy);
                if (pos.includes('n')) {
                    newH = Math.max(20, origH - dy);
                    newTop = origTop + dy;
                }
                
                element.style.width = newW + 'px';
                element.style.height = newH + 'px';
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                data.width = newW;
                data.height = newH;
                data.x = newLeft;
                data.y = newTop;
            };
            
            const onUp = () => {
                isResizing = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                saveHistory();
            };
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        
        element.appendChild(handle);
    });
}

// =============================================
// Add Elements
// =============================================
function addTextElement(x, y) {
    const data = addElement(state.currentPage, {
        type: 'text',
        x, y,
        text: '',
        fontFamily: state.textProps.fontFamily,
        fontSize: state.textProps.fontSize,
        bold: state.textProps.bold,
        italic: state.textProps.italic,
        color: state.textProps.color
    });
    
    renderElements(state.currentPage);
    
    // Focus the new text element
    setTimeout(() => {
        const el = document.querySelector(`[data-id="${data.id}"] .edit-text`);
        if (el) {
            el.focus();
            el.textContent = '';
        }
    }, 50);
    
    saveHistory();
}

function registerAsset(source) {
    const existing = state.assetIdsBySource.get(source);
    if (existing) return existing;
    const id = `asset-${++state.assetSequence}`;
    state.assets.set(id, source);
    state.assetIdsBySource.set(source, id);
    return id;
}

function resolveAssetSource(element) {
    return element.assetId ? state.assets.get(element.assetId) : element.src;
}

// PDF can embed PNG and JPEG directly; anything else the browser can show (WebP, GIF, SVG, ...) is converted.
async function toEmbeddableDataUrl(source) {
    if (/^data:image\/(png|jpe?g)[;,]/i.test(source)) return source;
    const image = await new Promise((resolve, reject) => {
        const loaded = new Image();
        loaded.onload = () => resolve(loaded);
        loaded.onerror = reject;
        loaded.src = source;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || 400;
    canvas.height = image.naturalHeight || 300;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

async function addImageToPage(src, dropX = 50, dropY = 50, centerOnPoint = false) {
    try { src = await toEmbeddableDataUrl(src); }
    catch { showToast('That image could not be read', 'error'); return; }
    const img = new Image();
    img.onload = () => {
        const maxWidth = 300;
        const ratio = img.width / img.height;
        const width = Math.min(img.width, maxWidth);
        const height = width / ratio;
        
        const requestedX = centerOnPoint ? dropX - width / 2 : dropX;
        const requestedY = centerOnPoint ? dropY - height / 2 : dropY;
        const x = Math.max(0, Math.min(requestedX, Math.max(0, dom.pdfCanvas.width - width)));
        const y = Math.max(0, Math.min(requestedY, Math.max(0, dom.pdfCanvas.height - height)));
        const data = addElement(state.currentPage, {
            type: 'image',
            x, y,
            width, height,
            assetId: registerAsset(src)
        });
        
        renderElements(state.currentPage);
        saveHistory();
        requestAnimationFrame(() => {
            const element = document.querySelector(`[data-id="${data.id}"]`);
            if (element) selectEditElement(element);
        });
        showToast(centerOnPoint ? 'Image dropped onto the page' : 'Image added', 'success');
    };
    img.src = src;
}

// Converts any rendered PDF region into a movable PNG, removes a uniform edge
// background, and paints the original location with its sampled background color.
function captureExistingObject(x, y, width, height) {
    const source = state.rasterCanvas;
    if (!source) return;
    const sx = Math.max(0, Math.floor(x));
    const sy = Math.max(0, Math.floor(y));
    const sw = Math.min(Math.ceil(width), source.width - sx);
    const sh = Math.min(Math.ceil(height), source.height - sy);
    if (sw < 3 || sh < 3) return;

    const pixels = source.getContext('2d', { willReadFrequently: true }).getImageData(sx, sy, sw, sh);
    const rgba = pixels.data;
    const corners = [0, (sw - 1) * 4, ((sh - 1) * sw) * 4, ((sh * sw) - 1) * 4];
    const background = corners.reduce((sum, index) => {
        sum.r += rgba[index]; sum.g += rgba[index + 1]; sum.b += rgba[index + 2]; return sum;
    }, { r: 0, g: 0, b: 0 });
    background.r = Math.round(background.r / 4);
    background.g = Math.round(background.g / 4);
    background.b = Math.round(background.b / 4);

    const cornersAgree = corners.every(index => colorDistance(
        { r: rgba[index], g: rgba[index + 1], b: rgba[index + 2] }, background
    ) < 42);
    if (cornersAgree) {
        for (let index = 0; index < rgba.length; index += 4) {
            const distance = colorDistance({ r: rgba[index], g: rgba[index + 1], b: rgba[index + 2] }, background);
            if (distance < 24) rgba[index + 3] = 0;
            else if (distance < 45) rgba[index + 3] = Math.round(255 * (distance - 24) / 21);
        }
    }

    const extracted = document.createElement('canvas');
    extracted.width = sw;
    extracted.height = sh;
    extracted.getContext('2d').putImageData(pixels, 0, 0);
    addElement(state.currentPage, {
        type: 'whiteout', x: sx, y: sy, width: sw, height: sh,
        color: rgbToHex(background.r, background.g, background.b)
    });
    const image = addElement(state.currentPage, {
        type: 'image', x: sx, y: sy, width: sw, height: sh,
        assetId: registerAsset(extracted.toDataURL('image/png')), extracted: true
    });
    renderElements(state.currentPage);
    saveHistory();
    requestAnimationFrame(() => {
        const element = document.querySelector(`[data-id="${image.id}"]`);
        if (element) selectEditElement(element);
    });
    showToast('Object extracted — drag or resize it', 'success');
    selectTool('select');
}

function colorDistance(a, b) {
    return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function rgbToHex(r, g, b) {
    return `#${[r, g, b].map(value => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('')}`;
}

function addFormElement(x, y) {
    addElement(state.currentPage, {
        type: 'form',
        formType: state.activeFormMode,
        x, y
    });
    
    renderElements(state.currentPage);
    saveHistory();
}

async function pasteImageFromClipboard() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    const blob = await item.getType(type);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        addImageToPage(e.target.result);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }
        showToast('No image found in clipboard', 'error');
    } catch (err) {
        showToast('Could not read clipboard. Try uploading instead.', 'error');
    }
}

// =============================================
// Freehand Drawing
// =============================================
function ensureFreehandCanvas() {
    let canvas = dom.annotationLayer.querySelector('.freehand-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'freehand-canvas active';
        canvas.width = dom.pdfCanvas.width;
        canvas.height = dom.pdfCanvas.height;
        dom.annotationLayer.appendChild(canvas);
        
        setupFreehandDrawing(canvas);
    } else {
        canvas.classList.add('active');
    }
}

function setupFreehandDrawing(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false;
    
    canvas.addEventListener('mousedown', (e) => {
        if (state.activeTool !== 'annotate' || state.activeAnnotateMode !== 'freehand') return;
        
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        state.currentPath = {
            points: [{ x, y }],
            color: state.annotateProps.color,
            size: state.annotateProps.size * 1.5
        };
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = state.annotateProps.color;
        ctx.lineWidth = state.annotateProps.size * 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        state.currentPath.points.push({ x, y });
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    canvas.addEventListener('mouseup', () => {
        if (!drawing) return;
        drawing = false;
        
        if (state.currentPath && state.currentPath.points.length > 1) {
            if (!state.freehandPaths[state.currentPage]) {
                state.freehandPaths[state.currentPage] = [];
            }
            state.freehandPaths[state.currentPage].push(state.currentPath);
            saveHistory();
        }
        state.currentPath = null;
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            drawing = false;
            if (state.currentPath && state.currentPath.points.length > 1) {
                if (!state.freehandPaths[state.currentPage]) {
                    state.freehandPaths[state.currentPage] = [];
                }
                state.freehandPaths[state.currentPage].push(state.currentPath);
            }
            state.currentPath = null;
        }
    });
}

function renderFreehandPaths(pageNum) {
    const canvas = dom.annotationLayer.querySelector('.freehand-canvas');
    if (!canvas) return;
    
    canvas.width = dom.pdfCanvas.width;
    canvas.height = dom.pdfCanvas.height;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const paths = state.freehandPaths[pageNum] || [];
    
    paths.forEach(path => {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
    });
}

// =============================================
// Signature Modal
// =============================================
function setupModals() {
    // Signature Modal
    const sigCtx = dom.sigCanvas.getContext('2d');
    let sigDrawing = false;
    
    dom.sigCanvas.addEventListener('mousedown', (e) => {
        sigDrawing = true;
        const rect = dom.sigCanvas.getBoundingClientRect();
        sigCtx.beginPath();
        sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        sigCtx.strokeStyle = '#000';
        sigCtx.lineWidth = 2;
        sigCtx.lineCap = 'round';
    });
    
    dom.sigCanvas.addEventListener('mousemove', (e) => {
        if (!sigDrawing) return;
        const rect = dom.sigCanvas.getBoundingClientRect();
        sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        sigCtx.stroke();
    });
    
    dom.sigCanvas.addEventListener('mouseup', () => sigDrawing = false);
    dom.sigCanvas.addEventListener('mouseleave', () => sigDrawing = false);
    
    // Clear signature
    document.getElementById('sig-clear').addEventListener('click', () => {
        sigCtx.clearRect(0, 0, dom.sigCanvas.width, dom.sigCanvas.height);
    });
    
    // Signature tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sig-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('sig-' + tab.dataset.tab).classList.add('active');
        });
    });
    
    // Signature fonts
    document.querySelectorAll('.sig-font').forEach(font => {
        font.addEventListener('click', () => {
            document.querySelectorAll('.sig-font').forEach(f => f.classList.remove('active'));
            font.classList.add('active');
            state.signatureFont = font.dataset.font;
            const input = document.getElementById('sig-text-input');
            input.style.fontFamily = font.dataset.font;
        });
    });
    
    // Signature upload
    document.getElementById('sig-upload-zone').addEventListener('click', () => {
        document.getElementById('sig-file-input').click();
    });
    
    document.getElementById('sig-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                state.signatureData = { type: 'uploaded', src: ev.target.result };
                showToast('Signature image loaded', 'success');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Apply signature — BUG-03 FIX: check canvas is not blank before applying
    document.getElementById('sig-apply').addEventListener('click', () => {
        const activeTab = document.querySelector('.modal-tab.active').dataset.tab;
        
        if (activeTab === 'draw') {
            // Check if canvas is empty
            const imgData = dom.sigCanvas.getContext('2d')
                .getImageData(0, 0, dom.sigCanvas.width, dom.sigCanvas.height).data;
            const isBlank = !imgData.some(ch => ch !== 0);
            if (isBlank) {
                showToast('Please draw your signature first', 'error');
                return;
            }
            const dataUrl = dom.sigCanvas.toDataURL('image/png');
            addElement(state.currentPage, {
                type: 'signature',
                sigType: 'drawn',
                x: 100, y: 100,
                width: 200,
                assetId: registerAsset(dataUrl)
            });
        } else if (activeTab === 'type') {
            const text = document.getElementById('sig-text-input').value;
            if (!text.trim()) {
                showToast('Please type your signature', 'error');
                return;
            }
            addElement(state.currentPage, {
                type: 'signature',
                sigType: 'typed',
                x: 100, y: 100,
                text: text,
                font: state.signatureFont
            });
        } else if (activeTab === 'upload') {
            if (!state.signatureData) {
                showToast('Please upload a signature image', 'error');
                return;
            }
            addElement(state.currentPage, {
                type: 'signature',
                sigType: 'uploaded',
                x: 100, y: 100,
                width: 200,
                assetId: registerAsset(state.signatureData.src)
            });
        }
        
        renderElements(state.currentPage);
        saveHistory();
        closeModal('signature-modal');
        showToast('Signature added', 'success');
    });
    
    // Modal close buttons
    document.getElementById('sig-modal-close').addEventListener('click', () => closeModal('signature-modal'));
    document.getElementById('sig-cancel').addEventListener('click', () => closeModal('signature-modal'));
    
    // Link Modal
    document.getElementById('link-apply').addEventListener('click', () => {
        const text = document.getElementById('link-text').value.trim() || 'Click here';
        const rawUrl = document.getElementById('link-url').value.trim();
        
        if (!rawUrl) {
            showToast('Please enter a URL', 'error');
            return;
        }
        
        const safeUrl = sanitizeUrl(rawUrl);
        if (!safeUrl) {
            showToast('Invalid or disallowed URL. Only http/https/mailto are permitted.', 'error');
            return;
        }
        
        if (state.pendingLink) {
            addElement(state.currentPage, {
                type: 'link',
                x: state.pendingLink.x,
                y: state.pendingLink.y,
                displayText: text,
                url: safeUrl
            });
            
            renderElements(state.currentPage);
            saveHistory();
            state.pendingLink = null;
        }
        
        closeModal('link-modal');
        showToast('Link added', 'success');
    });
    
    document.getElementById('link-modal-close').addEventListener('click', () => closeModal('link-modal'));
    document.getElementById('link-cancel').addEventListener('click', () => closeModal('link-modal'));
    
    // Comment Modal
    document.getElementById('comment-apply').addEventListener('click', () => {
        const text = document.getElementById('comment-text').value;
        
        if (!text.trim()) {
            showToast('Please enter a comment', 'error');
            return;
        }
        
        if (state.pendingComment) {
            addElement(state.currentPage, {
                type: 'comment',
                x: state.pendingComment.x,
                y: state.pendingComment.y,
                text: text
            });
            
            renderElements(state.currentPage);
            saveHistory();
            state.pendingComment = null;
        }
        
        closeModal('comment-modal');
        showToast('Comment added', 'success');
    });
    
    document.getElementById('comment-modal-close').addEventListener('click', () => closeModal('comment-modal'));
    document.getElementById('comment-cancel').addEventListener('click', () => closeModal('comment-modal'));
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // The confirmation dialog must settle its promise; closing it silently would leave a stale answer.
                if (overlay.id === 'confirm-modal') document.getElementById('confirm-cancel').click();
                else overlay.classList.add('hidden');
            }
        });
    });
}

function openSignatureModal(tab) {
    dom.signatureModal.classList.remove('hidden');
    dom.signatureModal.removeAttribute('aria-hidden');
    
    // Reset
    const sigCtx = dom.sigCanvas.getContext('2d');
    sigCtx.clearRect(0, 0, dom.sigCanvas.width, dom.sigCanvas.height);
    document.getElementById('sig-text-input').value = '';
    
    // Activate the right tab
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sig-tab-content').forEach(c => c.classList.remove('active'));
    
    const tabBtn = document.querySelector(`.modal-tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    document.getElementById('sig-' + tab).classList.add('active');
    trapFocus(dom.signatureModal);
}

function openLinkModal(x, y) {
    state.pendingLink = { x, y };
    document.getElementById('link-text').value = '';
    document.getElementById('link-url').value = '';
    dom.linkModal.classList.remove('hidden');
    dom.linkModal.removeAttribute('aria-hidden');
    trapFocus(dom.linkModal);
}

function openCommentModal(x, y) {
    state.pendingComment = { x, y };
    document.getElementById('comment-text').value = '';
    dom.commentModal.classList.remove('hidden');
    dom.commentModal.removeAttribute('aria-hidden');
    trapFocus(dom.commentModal);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    releaseFocusTrap(modal);
}

// =============================================
// Custom Confirm Modal (CQ-06 FIX)
// =============================================
function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-modal-msg');
        const cancelBtn = document.getElementById('confirm-cancel');
        const applyBtn = document.getElementById('confirm-apply');
        const closeBtn = document.getElementById('confirm-modal-close');
        
        msgEl.textContent = message;
        modal.classList.remove('hidden');
        modal.removeAttribute('aria-hidden');
        trapFocus(modal);
        
        const cleanupAndResolve = (val) => {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            releaseFocusTrap(modal);
            
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            applyBtn.removeEventListener('click', onApply);
            
            resolve(val);
        };
        
        const onCancel = () => cleanupAndResolve(false);
        const onApply = () => cleanupAndResolve(true);
        
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
        applyBtn.addEventListener('click', onApply);
    });
}

// =============================================
// Sidebar
// =============================================
function setupSidebar() {
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        dom.sidebar.classList.toggle('collapsed');
    });
}

// =============================================
// Keyboard Shortcuts
// =============================================
function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Only when editor is visible
        if (dom.editorScreen.classList.contains('hidden')) return;
        
        const isCmd = e.ctrlKey || e.metaKey;
        
        if (isCmd && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        if (isCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
        if (isCmd && e.key === 's') {
            e.preventDefault();
            savePDF();
        }
        
        // Existing text / images own Delete, Escape, Enter and the arrow keys while selected.
        if (objectEditor.handleKeyDown(e)) return;

        // Delete selected element
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selected = document.querySelector('.edit-element.selected');
            if (selected && document.activeElement.tagName !== 'INPUT' &&
                !document.activeElement.isContentEditable) {
                e.preventDefault();
                removeElement(state.currentPage, selected.dataset.id);
                showToast('Selected element deleted', 'info');
            }
        }

        if (e.key === 'Escape') {
            document.querySelectorAll('.edit-element.selected').forEach(element => element.classList.remove('selected'));
        }
        
        // Page navigation
        if (e.key === 'ArrowLeft' && !e.target.isContentEditable && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
            goToPage(state.currentPage - 1);
        }
        if (e.key === 'ArrowRight' && !e.target.isContentEditable && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
            goToPage(state.currentPage + 1);
        }
    });
}

// =============================================
// Focus Trap Utility (A11Y-03 FIX)
// =============================================
function trapFocus(modal) {
    const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';
    const focusable = [...modal.querySelectorAll(FOCUSABLE)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first.focus();
    
    const handler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
    };
    modal.addEventListener('keydown', handler);
    // Store cleanup on the element for later removal
    modal._trapCleanup = () => modal.removeEventListener('keydown', handler);
}

function releaseFocusTrap(modal) {
    if (modal._trapCleanup) { modal._trapCleanup(); delete modal._trapCleanup; }
}

// =============================================
// Undo / Redo
// =============================================
function cloneEditorData(value) {
    return typeof structuredClone === 'function'
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
}

function saveHistory(markDirty = true) {
    state.editSerial++;
    const snapshot = {
        zoom: state.zoom,
        elements: cloneEditorData(state.elements),
        freehandPaths: cloneEditorData(state.freehandPaths),
        modifiedText: cloneEditorData(state.modifiedText),
        modifiedImages: cloneEditorData(state.modifiedImages)
    };
    
    // Remove future states if we're in the middle of history
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    state.historyIndex = state.history.length - 1;
    if (markDirty) state.dirty = true;
    
    // Limit history size
    if (state.history.length > 30) {
        state.history.shift();
        state.historyIndex--;
    }
}

/** Restores a snapshot, converting its screen-pixel geometry from the zoom it was taken at to the current zoom. */
function restoreSnapshot(snapshot) {
    state.editSerial++;
    state.elements = cloneEditorData(snapshot.elements);
    state.freehandPaths = cloneEditorData(snapshot.freehandPaths);
    state.modifiedText = cloneEditorData(snapshot.modifiedText || {});
    state.modifiedImages = cloneEditorData(snapshot.modifiedImages || {});
    const ratio = state.zoom / (snapshot.zoom || state.zoom);
    if (ratio !== 1) scaleEditorGeometry(state.elements, state.freehandPaths, ratio);
}

/** Page insertion and deletion rewrite the document, so earlier snapshots no longer match it. */
function resetHistory() {
    state.history = [];
    state.historyIndex = -1;
    saveHistory(false);
}

function undo() {
    if (state.historyIndex <= 0) {
        showToast('Nothing to undo', 'info');
        return;
    }
    
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
    
    renderPage(state.currentPage);
    showToast('Undone', 'info');
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showToast('Nothing to redo', 'info');
        return;
    }
    
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
    
    renderPage(state.currentPage);
    showToast('Redone', 'info');
}

// =============================================
// Download-time NPS
// =============================================
const NPS_SUBMITTED_AT_KEY = 'pdfstudio-nps-submitted-at';
const NPS_DISMISSED_AT_KEY = 'pdfstudio-nps-dismissed-at';
let selectedNpsScore = null;

function setupNps() {
    if (!dom.npsModal || !dom.npsScale) return;

    for (let score = 0; score <= 10; score++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nps-score';
        button.textContent = String(score);
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-label', `${score} out of 10`);
        button.setAttribute('aria-checked', 'false');
        button.addEventListener('click', () => selectNpsScore(score));
        dom.npsScale.appendChild(button);
    }

    document.getElementById('nps-close').addEventListener('click', () => closeNps(true));
    document.getElementById('nps-skip').addEventListener('click', () => closeNps(true));
    dom.npsSubmit.addEventListener('click', submitNps);
    dom.npsModal.addEventListener('click', event => {
        if (event.target === dom.npsModal) closeNps(true);
    });
}

function selectNpsScore(score) {
    selectedNpsScore = score;
    dom.npsScale.querySelectorAll('.nps-score').forEach((button, index) => {
        const selected = index === score;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(selected));
    });
    dom.npsReasons.classList.remove('hidden');
    dom.npsSubmit.disabled = false;
}

function shouldPromptForNps() {
    try {
        const submittedAt = Number(localStorage.getItem(NPS_SUBMITTED_AT_KEY) || 0);
        const dismissedAt = Number(localStorage.getItem(NPS_DISMISSED_AT_KEY) || 0);
        const now = Date.now();
        return now - submittedAt > 90 * 24 * 60 * 60 * 1000 &&
            now - dismissedAt > 7 * 24 * 60 * 60 * 1000;
    } catch {
        return true;
    }
}

function openNpsAfterDownload() {
    if (!dom.npsModal || !shouldPromptForNps()) return;
    selectedNpsScore = null;
    dom.npsScale.querySelectorAll('.nps-score').forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-checked', 'false');
    });
    dom.npsReasons.classList.add('hidden');
    dom.npsReasons.querySelectorAll('input').forEach(input => { input.checked = false; });
    dom.npsSubmit.disabled = true;
    dom.npsStatus.textContent = '';
    dom.npsModal.classList.remove('hidden');
    dom.npsModal.removeAttribute('aria-hidden');
    trapFocus(dom.npsModal);
    dom.npsScale.querySelector('.nps-score')?.focus();
}

function closeNps(markDismissed = false) {
    if (!dom.npsModal) return;
    if (markDismissed) {
        try { localStorage.setItem(NPS_DISMISSED_AT_KEY, String(Date.now())); } catch { /* storage unavailable */ }
    }
    releaseFocusTrap(dom.npsModal);
    dom.npsModal.classList.add('hidden');
    dom.npsModal.setAttribute('aria-hidden', 'true');
}

async function submitNps() {
    if (selectedNpsScore === null) return;
    dom.npsSubmit.disabled = true;
    dom.npsStatus.textContent = 'Sending anonymous feedback…';

    const reason = dom.npsReasons.querySelector('input[name="nps-reason"]:checked')?.value || null;
    const context = getAnonymousEditingContext();
    const submissionId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
        const response = await fetch('/api/pdfstudio/nps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submissionId,
                score: selectedNpsScore,
                reason,
                ...context,
            }),
        });
        if (!response.ok) throw new Error(`Feedback service returned ${response.status}`);
        try { localStorage.setItem(NPS_SUBMITTED_AT_KEY, String(Date.now())); } catch { /* storage unavailable */ }
        dom.npsStatus.textContent = 'Thank you — your feedback was saved.';
        setTimeout(() => closeNps(false), 900);
    } catch (error) {
        console.warn('NPS submission failed:', error);
        dom.npsStatus.textContent = 'Feedback could not be saved. Please try again.';
        dom.npsSubmit.disabled = false;
    }
}

function getAnonymousEditingContext() {
    const featureSet = new Set();
    let editCount = 0;

    for (const elements of Object.values(state.elements)) {
        for (const element of elements) {
            editCount++;
            const type = element.type === 'object' ? 'object-capture' : element.type;
            if (type) featureSet.add(type);
        }
    }
    for (const paths of Object.values(state.freehandPaths)) {
        if (paths.length) featureSet.add('freehand');
        editCount += paths.length;
    }
    for (const changes of Object.values(state.modifiedText)) {
        const count = Object.keys(changes).length;
        if (count) featureSet.add('existing-text');
        editCount += count;
    }
    for (const changes of Object.values(state.modifiedImages)) {
        const count = Object.keys(changes).length;
        if (count) featureSet.add('existing-image');
        editCount += count;
    }

    return {
        pageCount: state.totalPages || null,
        editCount,
        featuresUsed: [...featureSet],
    };
}

// =============================================
// Save PDF
// =============================================
/** Builds the edited PDF with every pending change applied and returns its bytes. */
async function exportPdfBytes() {
    // Remove the original text and move or delete existing images first, so everything
    // drawn afterwards sits on top of a clean page. The result is re-read and checked; any
    // line that did not come out exactly right is retried in a more cautious mode.
    const levels = new Map();
    const load = () => PDFLib.PDFDocument.load(state.pdfBytes);

    // Dry runs on scratch copies check that every edited line comes out exactly right. (They are
    // separate documents because saving freezes an embedded font's glyphs.)
    if (Object.keys(state.modifiedText).length) {
        for (let attempt = 0; attempt < 2; attempt++) {
            const scratch = await load();
            const trial = await objectEditor.applyContentEdits(scratch, { fontkit: window.fontkit, levels });
            await objectEditor.drawEditedText(scratch, trial);
            const failed = await objectEditor.verifyEdits(scratch, trial);
            if (!failed.length) break;
            failed.forEach(key => levels.set(key, Math.min(2, (levels.get(key) || 0) + 1)));
        }
    }

    // Whiteout / redaction boxes, converted to page space, so the content under them can be erased.
    const regions = new Map();
    for (const [pageKey, list] of Object.entries(state.elements)) {
        const boxes = list.filter(element => element.type === 'whiteout');
        if (!boxes.length) continue;
        const pageNum = Number(pageKey);
        const pdfjsPage = await state.pdf.getPage(pageNum);
        const viewport = pdfjsPage.getViewport({ scale: state.zoom * 1.5, rotation: displayRotation(pdfjsPage, pageNum) });
        regions.set(pageNum, boxes.map(element => {
            const [x1, y1] = viewport.convertToPdfPoint(element.x, element.y);
            const [x2, y2] = viewport.convertToPdfPoint(element.x + element.width, element.y + element.height);
            return { rect: { x0: Math.min(x1, x2), y0: Math.min(y1, y2), x1: Math.max(x1, x2), y1: Math.max(y1, y2) }, mode: element.redact ? 'touch' : 'center' };
        }));
    }

    const pdfDoc = await load();
    const editPlan = await objectEditor.applyContentEdits(pdfDoc, { fontkit: window.fontkit, levels, regions });
    await objectEditor.drawEditedText(pdfDoc, editPlan);
    const pages = pdfDoc.getPages();
    const imageCache = new Map();
    const getImage = source => {
        if (!imageCache.has(source)) {
            imageCache.set(source, source.includes('image/png') || source.includes('data:image/png')
                ? pdfDoc.embedPng(source)
                : pdfDoc.embedJpg(source).catch(() => pdfDoc.embedPng(source)));
        }
        return imageCache.get(source);
    };

    // Everything the user placed on a page (text, signatures, images, shapes, links, comments, fields, drawing).
    const editedPageNumbers = new Set([...Object.keys(state.elements), ...Object.keys(state.freehandPaths)].map(Number));
    for (const pageNum of [...editedPageNumbers].sort((a, b) => a - b)) {
        if (pageNum < 1 || pageNum > pages.length) continue;
        const elements = state.elements[pageNum] || [];
        const paths = state.freehandPaths[pageNum] || [];
        if (!elements.length && !paths.length) continue;
        const pdfjsPage = await state.pdf.getPage(pageNum);
        const viewport = pdfjsPage.getViewport({ scale: state.zoom * 1.5, rotation: displayRotation(pdfjsPage, pageNum) });
        const warnings = await drawPageElements({
            PDFLib, pdfDoc, embedder: editPlan.embedder, page: pages[pageNum - 1], viewport, elements, freehandPaths: paths,
            resolveAssetSource, embedImage: getImage, sanitizeUrl,
        });
        warnings.forEach(message => editPlan.warnings.push(`Page ${pageNum}: ${message}`));
    }
    
    editPlan.warnings.forEach(message => showToast(message, 'info'));
    if (editPlan.covered) {
        showToast(`${editPlan.covered} edited line${editPlan.covered > 1 ? 's were' : ' was'} covered rather than removed, so the original text may still be inside the file.`, 'info');
    }
    
    // Apply rotations
    for (const [pageNumStr, rotation] of Object.entries(state.pageRotations)) {
        const pageNum = parseInt(pageNumStr);
        if (pageNum >= 1 && pageNum <= pages.length && rotation !== 0) {
            const page = pages[pageNum - 1];
            page.setRotation(PDFLib.degrees((((page.getRotation().angle + rotation) % 360) + 360) % 360));
        }
    }
    
    const output = await pdfDoc.save();
    // If anything under a box could not be removed from the page content, turn that page into a picture
    // so the covered text cannot be recovered.
    if (editPlan.blockedPages.size) {
        const redacted = [...editPlan.blockedPages].filter(pageNum => (regions.get(pageNum) || []).some(region => region.mode === 'touch'));
        const plain = [...editPlan.blockedPages].filter(pageNum => !redacted.includes(pageNum));
        if (plain.length) showToast(`Text under a whiteout box on page ${plain.map(n => n).join(', ')} could not be erased, only covered.`, 'info');
        if (redacted.length) {
            showToast(`Page${redacted.length > 1 ? 's' : ''} ${redacted.join(', ')} flattened to a picture so redacted content cannot be recovered.`, 'info');
            return flattenPages(PDFLib, output, redacted.map(n => n - 1));
        }
    }
    return output;
}

async function savePDF() {
    if (!state.pdfBytes) {
        showToast('No PDF loaded', 'error');
        return;
    }
    
    showLoading('Generating PDF...');
    
    try {
        const savedBytes = await exportPdfBytes();
        
        // Download
        const blob = new Blob([savedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edited-document.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        state.dirty = false;
        hideLoading();
        showToast('PDF saved successfully!', 'success');
        // Feedback is requested only after the browser has started the PDF download.
        setTimeout(openNpsAfterDownload, 450);
    } catch (err) {
        hideLoading();
        showToast('Failed to save PDF: ' + err.message, 'error');
        console.error(err);
    }
}

// SEC-02 FIX: URL sanitizer — block javascript:, data:, vbscript: and other dangerous protocols
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    // Block dangerous protocols
    if (/^(javascript|data|vbscript|blob):/i.test(trimmed)) return null;
    // If it's a valid http/https/mailto URL, pass through
    if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
    // If no protocol, assume https
    if (!trimmed.includes('://') && !trimmed.startsWith('//')) {
        return 'https://' + trimmed;
    }
    // Reject anything else (ftp, file, custom schemes etc.)
    return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

// =============================================
// Toast Notifications
// =============================================
// SEC-01 FIX: No innerHTML — build toast entirely with DOM APIs to prevent XSS
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');
    
    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const icon = document.createElement('i');
    icon.className = `fas ${iconMap[type] || 'fa-info-circle'}`;
    icon.setAttribute('aria-hidden', 'true');
    
    const msg = document.createTextNode('\u00a0' + String(message));
    toast.appendChild(icon);
    toast.appendChild(msg);
    dom.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// Loading Overlay
// =============================================
function showLoading(text) {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-text').textContent = text;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

// =============================================
// Text Layer - Edit Existing PDF Content
// =============================================
// =============================================
// Initialize App (deferred for ES module load)
// =============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
