/* =============================================
   PDF Studio — Professional PDF Editor v3.0 (God-Tier)
   Enterprise Edition — WebGPU & Local LLM Integration
   ============================================= */
import { WebGPURenderer } from './webgpu-renderer.js';
import { opfsStore } from './opfs-store.js';

// LIB-01 FIX: Configure PDF.js v4.9.155 worker (jsDelivr, ES module aware)
// pdfjsLib is loaded via <script type="module"> in index.html but also exposed globally
const PDFJS_VERSION = '4.9.155';
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.mjs`;
} else {
    // Fallback: wait for module to load then configure
    window.addEventListener('load', () => {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.mjs`;
        }
    });
}

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
    modifiedText: {},     // pageNum -> { index -> { originalText, newText, transform, fontName, ... } }
    pageTextItems: {},    // pageNum -> array of extracted text item data
    documentIndexed: false,
    assets: new Map(),
    assetIdsBySource: new Map(),
    assetSequence: 0,
    workerRequests: new Map(),
    renderRevision: 0,
    loadRevision: 0,
    indexRevision: 0,
    loadingTask: null,
    renderTask: null,
    thumbnailObserver: null,
    rasterCanvas: null,
    sharedState: null,
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
    
    sigCanvas: document.getElementById('sig-canvas'),
    imageUploadInput: document.getElementById('image-upload-input'),
    aiSidebar: document.getElementById('ai-sidebar'),
    aiMessages: document.getElementById('ai-messages'),
    aiInput: document.getElementById('ai-input'),
};

// =============================================
// Initialize
// =============================================
async function init() {
    // Document analysis stays in a worker so indexing never blocks editing.
    state.wasmWorker = new Worker('js/wasm-worker.js');
    state.wasmWorker.onmessage = (e) => {
        const pending = state.workerRequests.get(e.data.id);
        if (!pending) return;
        state.workerRequests.delete(e.data.id);
        clearTimeout(pending.timer);
        if (e.data.status === 'success') pending.resolve(e.data.data);
        else pending.reject(new Error(e.data.error || 'Worker request failed'));
    };
    state.wasmWorker.onerror = err => {
        for (const pending of state.workerRequests.values()) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Document worker unavailable'));
        }
        state.workerRequests.clear();
        console.error('Document worker error:', err);
    };
    
    // WebGPU progressively enhances presentation; Canvas 2D remains a reliable fallback.
    state.gpuRenderer = new WebGPURenderer(dom.pdfCanvas);
    const gpuActive = await state.gpuRenderer.init();
    state.rasterCanvas = gpuActive ? document.createElement('canvas') : dom.pdfCanvas;

    setupFileUpload();
    setupToolbar();
    setupDropdowns();
    setupProperties();
    setupPageControls();
    setupAnnotationLayer();
    setupModals();
    setupKeyboard();
    setupSidebar();
    selectTool('select');
    setupAssistant();
    updateCapabilityStatus(gpuActive);
}

function callWorker(action, payload = {}) {
    return new Promise((resolve, reject) => {
        const id = `${Date.now()}-${Math.random()}`;
        const timer = setTimeout(() => {
            if (!state.workerRequests.has(id)) return;
            state.workerRequests.delete(id);
            reject(new Error('Document worker timed out'));
        }, 30000);
        state.workerRequests.set(id, { resolve, reject, timer });
        state.wasmWorker.postMessage({ action, payload, id });
    });
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
        
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
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
        state.pageRotations = {};
        state.modifiedText = {};
        state.pageTextItems = {};
        state.documentIndexed = false;
        state.assets.clear();
        state.assetIdsBySource.clear();
        state.assetSequence = 0;
        state.indexRevision = loadRevision;
        const assistantIntro = dom.aiMessages.querySelector('.assistant');
        if (assistantIntro) assistantIntro.textContent = 'Indexing this PDF locally…';
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
        indexDocument(loadRevision).catch(err => console.warn('Document indexing failed:', err));
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
async function renderPage(pageNum) {
    if (!state.pdf) return;
    const revision = ++state.renderRevision;
    const page = await state.pdf.getPage(pageNum);
    if (revision !== state.renderRevision) return;
    const rotation = (state.pageRotations[pageNum] || 0);
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
    if (state.gpuRenderer?.isInitialized) {
        await state.gpuRenderer.renderSource(canvas);
    } else {
        dom.pdfCanvas.width = canvas.width;
        dom.pdfCanvas.height = canvas.height;
        const displayContext = dom.pdfCanvas.getContext('2d');
        displayContext.clearRect(0, 0, canvas.width, canvas.height);
        displayContext.drawImage(canvas, 0, 0);
    }
    
    // Render text layer for editing existing content
    await renderTextLayer(page, viewport, pageNum);
    if (revision !== state.renderRevision) return;
    
    // Render annotation elements for this page
    renderElements(pageNum);
    renderFreehandPaths(pageNum);
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
                const rotation = (state.pageRotations[pageNum] || 0);
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
    dom.zoomLevel.textContent = Math.round(state.zoom * 100) + '%';
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
        state.indexRevision++;
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
    
    // Toggle text layer interactivity - only when Text tool is selected
    if (dom.textLayer) {
        dom.textLayer.classList.toggle('interactive', tool === 'text');
    }
    
    // Show relevant properties
    showProperties(tool);
    
    // Handle freehand canvas
    const freehandCanvas = document.querySelector('.freehand-canvas');
    if (freehandCanvas) {
        freehandCanvas.classList.toggle('active', tool === 'annotate' && state.activeAnnotateMode === 'freehand');
    }
}

function showProperties(tool) {
    // Hide all prop groups
    [dom.propsText, dom.propsShape, dom.propsAnnotate, dom.propsWhiteout, dom.propsLinks].forEach(p => {
        p.classList.add('hidden');
    });
    
    switch (tool) {
        case 'select':
            dom.propsWhiteout.classList.remove('hidden');
            dom.propsWhiteout.querySelector('.prop-hint').innerHTML = '<i class="fas fa-mouse-pointer" aria-hidden="true"></i> Drag around a flattened logo or graphic to make it movable';
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
            dom.propsWhiteout.querySelector('.prop-hint').innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i> Click and drag on the PDF to white out an area';
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
function setZoom(newZoom) {
    if (newZoom === state.zoom) return;
    const ratio = newZoom / state.zoom;
    state.zoom = newZoom;
    
    // Scale all elements so they stay aligned to the PDF
    Object.keys(state.elements).forEach(pageNum => {
        state.elements[pageNum].forEach(el => {
            if (el.x !== undefined) el.x *= ratio;
            if (el.y !== undefined) el.y *= ratio;
            if (el.width !== undefined) el.width *= ratio;
            if (el.height !== undefined) el.height *= ratio;
            if (el.x1 !== undefined) el.x1 *= ratio;
            if (el.y1 !== undefined) el.y1 *= ratio;
            if (el.x2 !== undefined) el.x2 *= ratio;
            if (el.y2 !== undefined) el.y2 *= ratio;
            if (el.fontSize !== undefined) el.fontSize *= ratio;
        });
    });
    
    Object.keys(state.freehandPaths).forEach(pageNum => {
        state.freehandPaths[pageNum].forEach(path => {
            path.size *= ratio;
            path.points.forEach(pt => {
                pt.x *= ratio;
                pt.y *= ratio;
            });
        });
    });
    
    renderPage(state.currentPage);
    updatePageControls();
}

function setupPageControls() {
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
            const viewport = page.getViewport({ scale: 1 });
            const containerWidth = dom.pdfContainer.clientWidth - 48;
            setZoom(containerWidth / (viewport.width * 1.5));
        });
    });
    
    document.getElementById('rotate-left').addEventListener('click', () => {
        const page = state.currentPage;
        state.pageRotations[page] = ((state.pageRotations[page] || 0) - 90) % 360;
        renderPage(page);
        renderThumbnails();
        state.dirty = true;
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        const page = state.currentPage;
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
        
        const pdf = await pdfjsLib.getDocument({ data: state.pdfBytes.slice() }).promise;
        const previousPdf = state.pdf;
        state.pdf = pdf;
        state.totalPages = pdf.numPages;
        state.dirty = true;
        previousPdf?.destroy().catch(() => {});
        
        // BUG-05 FIX: shift all element/text page keys > afterPage up by 1
        state.elements     = remapPageKeys(state.elements, afterPage, +1);
        state.modifiedText = remapPageKeys(state.modifiedText, afterPage, +1);
        state.freehandPaths = remapPageKeys(state.freehandPaths, afterPage, +1);
        state.pageRotations = remapPageKeys(state.pageRotations, afterPage, +1);
        
        goToPage(afterPage + 1);
        await renderThumbnails();
        updatePageControls();
        state.documentIndexed = false;
        indexDocument(++state.indexRevision).catch(err => console.warn('Document indexing failed:', err));
        showToast('Blank page inserted', 'success');
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
        
        const pdf = await pdfjsLib.getDocument({ data: state.pdfBytes.slice() }).promise;
        const previousPdf = state.pdf;
        state.pdf = pdf;
        state.totalPages = pdf.numPages;
        state.dirty = true;
        previousPdf?.destroy().catch(() => {});
        
        // BUG-04 FIX: remap all page-keyed state dictionaries
        state.elements      = remapPageKeys(state.elements, pageNum, 0);
        state.modifiedText  = remapPageKeys(state.modifiedText, pageNum, 0);
        state.freehandPaths = remapPageKeys(state.freehandPaths, pageNum, 0);
        state.pageRotations = remapPageKeys(state.pageRotations, pageNum, 0);
        
        if (state.currentPage > state.totalPages) {
            state.currentPage = state.totalPages;
        }
        
        await renderPage(state.currentPage);
        await renderThumbnails();
        updatePageControls();
        state.documentIndexed = false;
        indexDocument(++state.indexRevision).catch(err => console.warn('Document indexing failed:', err));
        showToast(`Page ${pageNum} deleted`, 'success');
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

function onLayerClick(e) {
    if (e.target !== dom.annotationLayer) return;
    
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
    if (e.target !== dom.annotationLayer) return;

    // Clicking or beginning a new marquee on empty page space clears selection.
    document.querySelectorAll('.edit-element.selected').forEach(element => element.classList.remove('selected'));
    
    const rect = dom.annotationLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (['select', 'whiteout', 'shapes', 'object-capture'].includes(state.activeTool) ||
        (state.activeTool === 'annotate' && ['highlight', 'underline', 'strikethrough'].includes(state.activeAnnotateMode))) {
        state.isDrawing = true;
        state.drawStart = { x, y };
        
        // Create preview element
        if (state.activeTool === 'select' || state.activeTool === 'object-capture') {
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
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const { x, y } = getLayerCoords(e.touches[0].clientX, e.touches[0].clientY);
    // Simulate mousedown
    const synth = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target, preventDefault: () => {} };
    if (['select', 'whiteout', 'shapes', 'object-capture'].includes(state.activeTool) ||
        (state.activeTool === 'annotate' && ['highlight', 'underline', 'strikethrough'].includes(state.activeAnnotateMode))) {
        state.isDrawing = true;
        state.drawStart = { x, y };
        if (state.activeTool === 'select' || state.activeTool === 'object-capture') createDrawPreview('object-capture', x, y);
        else if (state.activeTool === 'whiteout') createDrawPreview('whiteout', x, y);
        else if (state.activeTool === 'shapes') createDrawPreview(state.activeShapeMode, x, y);
        else createDrawPreview(state.activeAnnotateMode, x, y);
    }
}

function onLayerTouchMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const { x, y } = getLayerCoords(e.touches[0].clientX, e.touches[0].clientY);
    if (state.isDrawing && state.drawStart) updateDrawPreview(x, y);
}

function onLayerTouchEnd(e) {
    e.preventDefault();
    if (!state.isDrawing || !state.drawStart) return;
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
            width, height
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
            textEl.style.fontFamily = data.fontFamily || 'Helvetica';
            textEl.style.fontSize = (data.fontSize || 12) + 'px';
            textEl.style.fontWeight = data.bold ? 'bold' : 'normal';
            textEl.style.fontStyle = data.italic ? 'italic' : 'normal';
            textEl.style.color = data.color || '#000000';
            
            textEl.addEventListener('input', () => {
                data.text = textEl.textContent;
            });
            
            textEl.addEventListener('blur', () => {
                data.text = textEl.textContent;
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

function addImageToPage(src, dropX = 50, dropY = 50, centerOnPoint = false) {
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
                overlay.classList.add('hidden');
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
// Private document assistant
// =============================================
function setupAssistant() {
    const toggle = document.getElementById('toggle-ai');
    const setOpen = open => {
        dom.aiSidebar.classList.toggle('collapsed', !open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(dom.aiSidebar.classList.contains('collapsed')));
    document.getElementById('close-ai').addEventListener('click', () => setOpen(false));
    document.getElementById('ai-form').addEventListener('submit', async event => {
        event.preventDefault();
        const question = dom.aiInput.value.trim();
        if (!question || !state.pdf) return;
        dom.aiInput.value = '';
        appendAiMessage(question, 'user');
        await runAssistantRequest('ASK_DOCUMENT', { question });
    });
    dom.aiInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            document.getElementById('ai-form').requestSubmit();
        }
    });
    document.getElementById('ai-summarize').addEventListener('click', () => runAssistantRequest('SUMMARIZE'));
    document.getElementById('ai-scan-pii').addEventListener('click', scanSensitiveData);
}

async function updateCapabilityStatus(gpuActive) {
    setStatus('status-gpu', gpuActive, gpuActive ? 'WebGPU active' : 'Canvas fallback');
    setStatus('status-storage', opfsStore.supported, opfsStore.supported ? 'OPFS active' : 'Session storage');
    try {
        state.sharedState = globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'
            ? new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 4) : null;
        const info = await callWorker('INIT_ENGINE', { sharedState: state.sharedState });
        setStatus('status-memory', true, info.sharedMemory ? 'Shared memory ready' : 'Worker isolated');
    } catch { setStatus('status-memory', false, 'Worker unavailable'); }
}

function setStatus(id, active, label) {
    const element = document.getElementById(id);
    element.classList.toggle('active', active);
    element.classList.toggle('fallback', !active);
    element.lastChild.textContent = ` ${label}`;
}

async function indexDocument(revision = state.indexRevision) {
    const sourcePdf = state.pdf;
    const indexed = new Array(sourcePdf.numPages);
    const batchSize = 4;
    for (let start = 1; start <= sourcePdf.numPages; start += batchSize) {
        if (revision !== state.indexRevision || sourcePdf !== state.pdf) return;
        const pageNumbers = Array.from(
            { length: Math.min(batchSize, sourcePdf.numPages - start + 1) },
            (_, index) => start + index
        );
        const batch = await Promise.all(pageNumbers.map(async pageNum => {
            const page = await sourcePdf.getPage(pageNum);
            const content = await page.getTextContent();
            return { page: pageNum, text: content.items.map(item => item.str).join(' ') };
        }));
        batch.forEach(entry => { indexed[entry.page - 1] = entry; });
        if (globalThis.scheduler?.yield) await globalThis.scheduler.yield();
        else await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (revision !== state.indexRevision || sourcePdf !== state.pdf) return;
    await callWorker('INDEX_DOCUMENT', { pages: indexed });
    if (revision !== state.indexRevision || sourcePdf !== state.pdf) return;
    state.documentIndexed = true;
    const intro = dom.aiMessages.querySelector('.assistant');
    if (intro) intro.textContent = `Ready. I indexed ${indexed.length} page${indexed.length === 1 ? '' : 's'} locally. Ask about a clause, amount, date, name, or topic.`;
}

async function runAssistantRequest(action, payload = {}) {
    if (!state.documentIndexed) {
        appendAiMessage('I’m still indexing this PDF. Please try again in a moment.', 'assistant');
        return;
    }
    const pending = appendAiMessage('Searching this document…', 'assistant pending');
    try {
        const result = await callWorker(action, payload);
        pending.remove();
        appendAiMessage(result.text, 'assistant', result.sources);
    } catch (error) {
        pending.remove();
        appendAiMessage(`I couldn’t complete that request: ${error.message}`, 'assistant error');
    }
}

function appendAiMessage(text, classes, sources = []) {
    const message = document.createElement('div');
    message.className = `ai-message ${classes}`;
    const body = document.createElement('div');
    body.textContent = text;
    message.appendChild(body);
    if (sources.length) {
        const sourceRow = document.createElement('div');
        sourceRow.className = 'ai-sources';
        [...new Set(sources)].forEach(page => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `Page ${page}`;
            button.addEventListener('click', () => goToPage(page));
            sourceRow.appendChild(button);
        });
        message.appendChild(sourceRow);
    }
    dom.aiMessages.appendChild(message);
    dom.aiMessages.scrollTop = dom.aiMessages.scrollHeight;
    return message;
}

async function scanSensitiveData() {
    if (!state.documentIndexed) return runAssistantRequest('ASK_DOCUMENT', { question: 'sensitive personal information' });
    const pending = appendAiMessage('Scanning locally for sensitive data…', 'assistant pending');
    try {
        const matches = await callWorker('SCAN_PII');
        pending.remove();
        if (!matches.length) {
            appendAiMessage('No common email addresses, phone numbers, Social Security numbers, or payment-card patterns were found.', 'assistant');
            return;
        }
        const summary = matches.reduce((counts, item) => { counts[item.kind] = (counts[item.kind] || 0) + 1; return counts; }, {});
        const message = appendAiMessage(Object.entries(summary).map(([kind, count]) => `${count} ${kind}${count === 1 ? '' : 's'}`).join(' · '), 'assistant', matches.map(x => x.page));
        const redact = document.createElement('button');
        redact.type = 'button'; redact.className = 'ai-redact-btn';
        redact.innerHTML = '<i class="fas fa-eraser"></i> Apply whiteout redactions';
        redact.addEventListener('click', async () => {
            redact.disabled = true; redact.textContent = 'Applying redactions…';
            const count = await applyPiiRedactions(matches);
            redact.textContent = `${count} redactions applied`;
            showToast(`${count} sensitive text matches covered. Review before saving.`, 'success');
        });
        message.appendChild(redact);
    } catch (error) {
        pending.remove(); appendAiMessage(`Scan failed: ${error.message}`, 'assistant error');
    }
}

async function applyPiiRedactions(matches) {
    let count = 0;
    const byPage = new Map();
    matches.forEach(match => byPage.set(match.page, [...(byPage.get(match.page) || []), match.value]));
    for (const [pageNum, values] of byPage) {
        const page = await state.pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.zoom * 1.5, rotation: state.pageRotations[pageNum] || 0 });
        const content = await page.getTextContent();
        for (const item of content.items) {
            if (!values.some(value => item.str.includes(value))) continue;
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            const height = Math.max(8, Math.hypot(tx[0], tx[1]));
            addElement(pageNum, { type: 'whiteout', x: tx[4] - 2, y: tx[5] - height - 2, width: Math.max(12, item.width * viewport.scale + 4), height: height + 4 });
            count++;
        }
    }
    saveHistory();
    renderElements(state.currentPage);
    return count;
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
        if (e.key === 'ArrowLeft' && !e.target.isContentEditable) {
            goToPage(state.currentPage - 1);
        }
        if (e.key === 'ArrowRight' && !e.target.isContentEditable) {
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
    const snapshot = {
        elements: cloneEditorData(state.elements),
        freehandPaths: cloneEditorData(state.freehandPaths),
        modifiedText: cloneEditorData(state.modifiedText)
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

function undo() {
    if (state.historyIndex <= 0) {
        showToast('Nothing to undo', 'info');
        return;
    }
    
    state.historyIndex--;
    const snapshot = state.history[state.historyIndex];
    state.elements = cloneEditorData(snapshot.elements);
    state.freehandPaths = cloneEditorData(snapshot.freehandPaths);
    state.modifiedText = cloneEditorData(snapshot.modifiedText || {});
    
    renderPage(state.currentPage);
    showToast('Undone', 'info');
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showToast('Nothing to redo', 'info');
        return;
    }
    
    state.historyIndex++;
    const snapshot = state.history[state.historyIndex];
    state.elements = cloneEditorData(snapshot.elements);
    state.freehandPaths = cloneEditorData(snapshot.freehandPaths);
    state.modifiedText = cloneEditorData(snapshot.modifiedText || {});
    
    renderPage(state.currentPage);
    showToast('Redone', 'info');
}

// =============================================
// Save PDF
// =============================================
async function savePDF() {
    if (!state.pdfBytes) {
        showToast('No PDF loaded', 'error');
        return;
    }
    
    showLoading('Generating PDF...');
    
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(state.pdfBytes);
        const pages = pdfDoc.getPages();
        const fontCache = new Map();
        const imageCache = new Map();
        const getFont = async fontName => {
            if (!fontCache.has(fontName)) fontCache.set(fontName, pdfDoc.embedFont(fontName));
            return fontCache.get(fontName);
        };
        const getImage = async source => {
            if (!imageCache.has(source)) {
                const embedded = source.includes('image/png') || source.includes('data:image/png')
                    ? pdfDoc.embedPng(source)
                    : pdfDoc.embedJpg(source).catch(() => pdfDoc.embedPng(source));
                imageCache.set(source, embedded);
            }
            return imageCache.get(source);
        };
        const displayScale = state.zoom * 1.5;
        const scaleX = 1 / displayScale;
        const scaleY = 1 / displayScale;
        const helveticaFont = await getFont(PDFLib.StandardFonts.Helvetica);
        
        const editedPageNumbers = new Set([
            ...Object.keys(state.elements),
            ...Object.keys(state.freehandPaths)
        ].map(Number));

        // Process each page's elements and freehand paths.
        for (const pageNum of [...editedPageNumbers].sort((a, b) => a - b)) {
            if (pageNum < 1 || pageNum > pages.length) continue;
            const elements = state.elements[pageNum] || [];
            const page = pages[pageNum - 1];
            const { width: pWidth, height: pHeight } = page.getSize();
            
            for (const el of elements) {
                try {
                    if (el.type === 'text' && el.text) {
                        // BUG-02 FIX: correct formula — divide by zoom*scale only
                        const fontSize = Math.max(6, (el.fontSize || 12) / (state.zoom * 1.5));
                        
                        page.drawText(el.text, {
                            x: el.x * scaleX,
                            y: pHeight - (el.y * scaleY) - (fontSize * scaleY),
                            size: fontSize,
                            font: helveticaFont,
                            color: hexToRgb(el.color || '#000000'),
                        });
                    }
                    
                    if (el.type === 'whiteout') {
                        page.drawRectangle({
                            x: el.x * scaleX,
                            y: pHeight - (el.y * scaleY) - (el.height * scaleY),
                            width: el.width * scaleX,
                            height: el.height * scaleY,
                            color: el.color ? hexToRgb(el.color) : PDFLib.rgb(1, 1, 1),
                        });
                    }
                    
                    if (el.type === 'shape') {
                        const strokeColor = hexToRgb(el.strokeColor);
                        const fillColor = hexToRgb(el.fillColor);
                        const opacity = (el.opacity || 100) / 100;
                        
                        if (el.shapeType === 'rectangle') {
                            const x = Math.min(el.x1, el.x2) * scaleX;
                            const y = pHeight - Math.max(el.y1, el.y2) * scaleY;
                            const w = Math.abs(el.x2 - el.x1) * scaleX;
                            const h = Math.abs(el.y2 - el.y1) * scaleY;
                            
                            page.drawRectangle({
                                x, y, width: w, height: h,
                                borderColor: strokeColor,
                                color: fillColor,
                                borderWidth: el.strokeWidth || 2,
                                opacity,
                            });
                        }
                        
                        if (el.shapeType === 'circle') {
                            const cx = ((el.x1 + el.x2) / 2) * scaleX;
                            const cy = pHeight - ((el.y1 + el.y2) / 2) * scaleY;
                            const rx = (Math.abs(el.x2 - el.x1) / 2) * scaleX;
                            const ry = (Math.abs(el.y2 - el.y1) / 2) * scaleY;
                            
                            page.drawEllipse({
                                x: cx, y: cy,
                                xScale: rx, yScale: ry,
                                borderColor: strokeColor,
                                color: fillColor,
                                borderWidth: el.strokeWidth || 2,
                                opacity,
                            });
                        }
                        
                        if (el.shapeType === 'line' || el.shapeType === 'arrow') {
                            page.drawLine({
                                start: { x: el.x1 * scaleX, y: pHeight - el.y1 * scaleY },
                                end: { x: el.x2 * scaleX, y: pHeight - el.y2 * scaleY },
                                thickness: el.strokeWidth || 2,
                                color: strokeColor,
                                opacity,
                            });
                        }
                    }
                    
                    if (el.type === 'annotation') {
                        const color = hexToRgb(el.color);
                        
                        if (el.annotationType === 'highlight') {
                            page.drawRectangle({
                                x: el.x * scaleX,
                                y: pHeight - (el.y * scaleY) - (el.height * scaleY),
                                width: el.width * scaleX,
                                height: el.height * scaleY,
                                color,
                                opacity: 0.35,
                            });
                        } else if (el.annotationType === 'underline') {
                            page.drawLine({
                                start: { x: el.x * scaleX, y: pHeight - (el.y + el.height) * scaleY },
                                end: { x: (el.x + el.width) * scaleX, y: pHeight - (el.y + el.height) * scaleY },
                                thickness: 2,
                                color,
                            });
                        } else if (el.annotationType === 'strikethrough') {
                            const midY = pHeight - (el.y + el.height / 2) * scaleY;
                            page.drawLine({
                                start: { x: el.x * scaleX, y: midY },
                                end: { x: (el.x + el.width) * scaleX, y: midY },
                                thickness: 2,
                                color,
                            });
                        }
                    }
                    
                    if (el.type === 'image' || (el.type === 'signature' && (el.sigType === 'drawn' || el.sigType === 'uploaded'))) {
                        const source = resolveAssetSource(el);
                        if (source) {
                            const image = await getImage(source);
                            
                            const imgWidth = (el.width || 200) * scaleX;
                            const imgHeight = el.height
                                ? el.height * scaleY
                                : (image.height / image.width * imgWidth);
                            
                            page.drawImage(image, {
                                x: el.x * scaleX,
                                y: pHeight - el.y * scaleY - imgHeight,
                                width: imgWidth,
                                height: imgHeight,
                            });
                        }
                    }
                    
                    if (el.type === 'signature' && el.sigType === 'typed') {
                        page.drawText(el.text || '', {
                            x: el.x * scaleX,
                            y: pHeight - el.y * scaleY - 30,
                            size: 28 * scaleX,
                            font: helveticaFont,
                            color: PDFLib.rgb(0, 0, 0),
                        });
                    }
                } catch (elErr) {
                    console.warn('Failed to embed element:', elErr);
                }
            }
            
            // Draw freehand paths
            const paths = state.freehandPaths[pageNum] || [];
            for (const path of paths) {
                if (path.points.length < 2) continue;
                const color = hexToRgb(path.color);
                
                for (let i = 0; i < path.points.length - 1; i++) {
                    page.drawLine({
                        start: {
                            x: path.points[i].x * scaleX,
                            y: pHeight - path.points[i].y * scaleY
                        },
                        end: {
                            x: path.points[i + 1].x * scaleX,
                            y: pHeight - path.points[i + 1].y * scaleY
                        },
                        thickness: path.size * scaleX,
                        color,
                    });
                }
            }
        }
        
        // Process modified existing text (whiteout original + draw new)
        for (const [pageNumStr, modifications] of Object.entries(state.modifiedText)) {
            const pageNum = parseInt(pageNumStr);
            if (pageNum < 1 || pageNum > pages.length) continue;
            
            const page = pages[pageNum - 1];
            const { width: pWidth, height: pHeight } = page.getSize();
            
            for (const [indexStr, mod] of Object.entries(modifications)) {
                try {
                    const fontSize = Math.abs(mod.pdfFontSize) || 12;
                    const x = mod.pdfX;
                    const y = mod.pdfY;
                    
                    // Determine font for measuring
                    let fontEnum = PDFLib.StandardFonts.Helvetica;
                    if (mod.fontName) {
                        const fn = mod.fontName.toLowerCase();
                        if (fn.includes('bold') && fn.includes('italic')) fontEnum = PDFLib.StandardFonts.HelveticaBoldOblique;
                        else if (fn.includes('bold')) fontEnum = PDFLib.StandardFonts.HelveticaBold;
                        else if (fn.includes('italic') || fn.includes('oblique')) fontEnum = PDFLib.StandardFonts.HelveticaOblique;
                        else if (fn.includes('times') || fn.includes('serif')) {
                            if (fn.includes('bold')) fontEnum = PDFLib.StandardFonts.TimesRomanBold;
                            else fontEnum = PDFLib.StandardFonts.TimesRoman;
                        }
                        else if (fn.includes('courier') || fn.includes('mono')) {
                            if (fn.includes('bold')) fontEnum = PDFLib.StandardFonts.CourierBold;
                            else fontEnum = PDFLib.StandardFonts.Courier;
                        }
                    }
                    
                    const font = await getFont(fontEnum);
                    
                    // Measure original text width for whiteout
                    const origWidth = font.widthOfTextAtSize(mod.originalText, fontSize);
                    
                    const origX = mod.origPdfX !== undefined ? mod.origPdfX : mod.pdfX;
                    const origY = mod.origPdfY !== undefined ? mod.origPdfY : mod.pdfY;
                    
                    const bgColor = mod.bgColor 
                        ? PDFLib.rgb(mod.bgColor.r / 255, mod.bgColor.g / 255, mod.bgColor.b / 255) 
                        : PDFLib.rgb(1, 1, 1);
                        
                    // Whiteout original text area with padding
                    page.drawRectangle({
                        x: origX - 1,
                        y: origY - fontSize * 0.25,
                        width: origWidth + 4,
                        height: fontSize * 1.3,
                        color: bgColor,
                    });
                    
                    // Draw modified text at same position
                    const textColor = mod.color ? hexToRgb(mod.color) : PDFLib.rgb(0, 0, 0);
                    page.drawText(mod.newText, {
                        x: x,
                        y: y,
                        size: fontSize,
                        font,
                        color: textColor,
                    });
                } catch (modErr) {
                    console.warn('Failed to embed modified text:', modErr);
                }
            }
        }
        
        // Apply rotations
        for (const [pageNumStr, rotation] of Object.entries(state.pageRotations)) {
            const pageNum = parseInt(pageNumStr);
            if (pageNum >= 1 && pageNum <= pages.length && rotation !== 0) {
                pages[pageNum - 1].setRotation(PDFLib.degrees(rotation));
            }
        }
        
        const savedBytes = await pdfDoc.save();
        
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
    } catch (err) {
        hideLoading();
        showToast('Failed to save PDF: ' + err.message, 'error');
        console.error(err);
    }
}

function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return PDFLib.rgb(0, 0, 0);
    const clean = hex.replace('#', '').padEnd(6, '0');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return PDFLib.rgb(
        isNaN(r) ? 0 : r,
        isNaN(g) ? 0 : g,
        isNaN(b) ? 0 : b
    );
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
async function renderTextLayer(page, viewport, pageNum) {
    const textLayerDiv = dom.textLayer;
    if (!textLayerDiv) return;
    
    textLayerDiv.innerHTML = '';
    state.pageTextItems[pageNum] = [];
    
    // Toggle interactive class based on active tool
    textLayerDiv.classList.toggle('interactive', state.activeTool === 'text');
    
    let textContent;
    try {
        textContent = await page.getTextContent();
    } catch (err) {
        console.warn('Could not extract text content:', err);
        return;
    }
    
    const groupedItems = [];
    let currentGroup = null;
    
    // Sort items by Y (top to bottom) and then X (left to right) to ensure correct reading order
    const sortedItems = textContent.items
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(x => x.item.str && x.item.str.trim() !== '')
        .sort((a, b) => {
            const yDiff = b.item.transform[5] - a.item.transform[5];
            if (Math.abs(yDiff) > 2) return yDiff;
            return a.item.transform[4] - b.item.transform[4];
        });
        
    sortedItems.forEach(({ item, originalIndex }) => {
        const pdfX = item.transform[4];
        const pdfY = item.transform[5];
        const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
        const itemWidth = (item.width && item.width > 0) ? item.width : (item.str.length * fontSize * 0.5);
        
        if (!currentGroup) {
            currentGroup = {
                ...item,
                str: item.str,
                minX: pdfX,
                maxX: pdfX + itemWidth,
                originalIndex: originalIndex
            };
            return;
        }
        
        const yDiff = Math.abs(pdfY - currentGroup.transform[5]);
        const xGap = pdfX - currentGroup.maxX;
        
        // Group if on same line and close to each other
        if (yDiff < fontSize * 0.3 && xGap < fontSize * 2 && xGap > -fontSize * 2) {
            if (xGap > fontSize * 0.35) { // increased threshold to prevent spaces between kerning letters
                currentGroup.str += ' ' + item.str;
            } else {
                currentGroup.str += item.str;
            }
            currentGroup.maxX = Math.max(currentGroup.maxX, pdfX + itemWidth);
            currentGroup.width = currentGroup.maxX - currentGroup.minX;
        } else {
            groupedItems.push(currentGroup);
            currentGroup = {
                ...item,
                str: item.str,
                minX: pdfX,
                maxX: pdfX + itemWidth,
                width: itemWidth,
                originalIndex: originalIndex
            };
        }
    });
    if (currentGroup) groupedItems.push(currentGroup);
    
    groupedItems.forEach((item) => {
        const index = item.originalIndex;
        if (!item.str || !item.str.trim()) return;
        
        // Transform item coordinates from PDF space to screen/canvas space
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        
        // Font height in screen pixels
        const fontHeight = Math.hypot(tx[0], tx[1]);
        
        // Screen position (tx[4] = x, tx[5] = baseline y)
        const screenX = tx[4];
        const screenY = tx[5] - fontHeight; // top of text
        
        // PDF coordinates for saving
        const pdfFontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
        const pdfX = item.transform[4];
        const pdfY = item.transform[5];
        
        // Store item data
        const itemData = {
            index,
            originalText: item.str,
            currentText: item.str,
            transform: [...item.transform],
            fontName: item.fontName,
            screenX,
            screenY,
            fontSize: fontHeight,
            pdfX,
            pdfY,
            origPdfX: pdfX,
            origPdfY: pdfY,
            pdfFontSize,
            modified: false,
        };
        
        // Check if this item was previously modified
        if (state.modifiedText[pageNum] && state.modifiedText[pageNum][index]) {
            const mod = state.modifiedText[pageNum][index];
            itemData.currentText = mod.newText;
            itemData.pdfX = mod.pdfX;
            itemData.pdfY = mod.pdfY;
            itemData.origPdfX = mod.origPdfX !== undefined ? mod.origPdfX : pdfX;
            itemData.origPdfY = mod.origPdfY !== undefined ? mod.origPdfY : pdfY;
            itemData.modified = true;
            itemData.color = mod.color || '#000000';
            
            // Recompute screen position from PDF offsets
            const diffX = itemData.pdfX - pdfX;
            const diffY = itemData.pdfY - pdfY;
            itemData.screenX = screenX + (diffX * viewport.scale);
            itemData.screenY = screenY - (diffY * viewport.scale); // Screen Y goes down
        }
        
        state.pageTextItems[pageNum].push(itemData);
        
        // Create the text span element
        const span = document.createElement('span');
        span.className = 'text-layer-item' + (itemData.modified ? ' modified' : '');
        span.textContent = itemData.currentText;
        span.dataset.index = index;
        span.dataset.pageNum = pageNum;
        
        // Position and style
        span.style.left = itemData.screenX + 'px';
        span.style.top = itemData.screenY + 'px';
        span.style.fontSize = fontHeight + 'px';
        span.style.fontFamily = mapPdfFont(itemData.fontName);
        if (itemData.color) span.style.setProperty('--moved-text-color', itemData.color);
        if (itemData.fontName && itemData.fontName.toLowerCase().includes('bold')) {
            span.style.fontWeight = 'bold';
        }
        if (itemData.fontName && (itemData.fontName.toLowerCase().includes('italic') || itemData.fontName.toLowerCase().includes('oblique'))) {
            span.style.fontStyle = 'italic';
        }
        
        // Handle scaleX for text width matching
        if (item.width && fontHeight > 0) {
            const scaledWidth = item.width * viewport.scale;
            // Measure actual rendered width to compute scaleX
            span.style.display = 'inline-block';
            // We'll set a CSS scaleX after appending to measure
        }
        
        // Double-click to edit existing text
        span.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            e.preventDefault();
            startEditingText(span, itemData, pageNum);
        });
        
        // Single click also starts editing when text tool is active
        span.addEventListener('click', (e) => {
            if (state.activeTool === 'text') {
                e.stopPropagation();
                e.preventDefault();
                startEditingText(span, itemData, pageNum);
            }
        });
        
        let whiteoutEl = null;
        
        const createWhiteout = () => {
            if (whiteoutEl) return;
            whiteoutEl = document.createElement('div');
            whiteoutEl.className = 'realtime-whiteout';
            whiteoutEl.style.left = screenX + 'px';
            whiteoutEl.style.top = (screenY - fontHeight * 0.1) + 'px';
            whiteoutEl.style.height = (fontHeight * 1.2) + 'px';
            
            // Extract background color from canvas by sampling points around the text
            try {
                const ctx = state.rasterCanvas.getContext('2d', { willReadFrequently: true });
                const actualWidth = span.getBoundingClientRect().width || (fontHeight * 3);
                // Sample 4 points around the text box
                const points = [
                    { x: screenX - 4, y: screenY + fontHeight / 2 },
                    { x: screenX + actualWidth + 4, y: screenY + fontHeight / 2 },
                    { x: screenX + fontHeight / 2, y: screenY - 4 },
                    { x: screenX + fontHeight / 2, y: screenY + fontHeight + 4 }
                ];
                
                let foundBg = null;
                for (const p of points) {
                    const pxX = Math.max(0, Math.floor(p.x));
                    const pxY = Math.max(0, Math.floor(p.y));
                    if (pxX >= dom.pdfCanvas.width || pxY >= dom.pdfCanvas.height) continue;
                    
                    const pixel = ctx.getImageData(pxX, pxY, 1, 1).data;
                    if (pixel[3] > 0) { // non-transparent
                        foundBg = { r: pixel[0], g: pixel[1], b: pixel[2] };
                        break;
                    }
                }
                
                if (foundBg) {
                    whiteoutEl.style.background = `rgb(${foundBg.r}, ${foundBg.g}, ${foundBg.b})`;
                    itemData.bgColor = foundBg;
                }
            } catch(e) { /* ignore */ }
            
            // width will be set after appending since we need actualWidth
            dom.annotationLayer.appendChild(whiteoutEl);
        };
        
        // Make span draggable so existing text can be repositioned
        const makeSpanDraggable = () => {
            let isDragging = false;
            let startX, startY, origLeft, origTop, startPdfX, startPdfY;
            
            const onStart = (e) => {
                if (span.classList.contains('editing') || state.activeTool === 'text') return;
                
                isDragging = true;
                
                const actualWidth = span.getBoundingClientRect().width || (fontHeight * 3);
                
                // Create whiteout dynamically when dragging starts if it doesn't exist
                createWhiteout();
                if (whiteoutEl && !whiteoutEl.style.width) {
                    whiteoutEl.style.width = actualWidth + 'px';
                }
                itemData.color = itemData.color || sampleForegroundColor(screenX, screenY, actualWidth, fontHeight, itemData.bgColor);
                span.style.setProperty('--moved-text-color', itemData.color);
                
                startX = e.touches ? e.touches[0].clientX : e.clientX;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                origLeft = parseFloat(span.style.left) || 0;
                origTop = parseFloat(span.style.top) || 0;
                startPdfX = itemData.pdfX;
                startPdfY = itemData.pdfY;
                
                if (!e.touches) e.preventDefault();
                
                document.addEventListener('mousemove', onMove);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('mouseup', onUp);
                document.addEventListener('touchend', onUp);
                document.addEventListener('touchcancel', onUp);
            };
            
            const onMove = (ev) => {
                if (!isDragging) return;
                
                // Make it visible immediately during drag
                if (!span.classList.contains('modified')) {
                    span.classList.add('modified');
                }
                
                const currentX = ev.touches ? ev.touches[0].clientX : ev.clientX;
                const currentY = ev.touches ? ev.touches[0].clientY : ev.clientY;
                const dx = currentX - startX;
                const dy = currentY - startY;
                
                span.style.left = (origLeft + dx) + 'px';
                span.style.top = (origTop + dy) + 'px';
                
                itemData.pdfX = startPdfX + (dx / viewport.scale);
                itemData.pdfY = startPdfY - (dy / viewport.scale);
                
                if (ev.touches) ev.preventDefault();
            };
            
            const onUp = () => {
                if (!isDragging) return;
                isDragging = false;
                
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchend', onUp);
                document.removeEventListener('touchcancel', onUp);
                
                if (parseFloat(span.style.left) !== origLeft || parseFloat(span.style.top) !== origTop) {
                    itemData.modified = true;
                    span.classList.add('modified');
                    if (!state.modifiedText[pageNum]) state.modifiedText[pageNum] = {};
                    state.modifiedText[pageNum][itemData.index] = {
                        originalText: itemData.originalText,
                        newText: itemData.currentText,
                        transform: itemData.transform,
                        fontName: itemData.fontName,
                        pdfX: itemData.pdfX,
                        pdfY: itemData.pdfY,
                        origPdfX: itemData.origPdfX,
                        origPdfY: itemData.origPdfY,
                        pdfFontSize: itemData.pdfFontSize,
                        bgColor: itemData.bgColor,
                        color: itemData.color,
                    };
                    saveHistory();
                }
            };
            
            span.addEventListener('mousedown', onStart);
            span.addEventListener('touchstart', onStart, { passive: false });
        };
        
        makeSpanDraggable();
        
        textLayerDiv.appendChild(span);
        
        // Adjust width scaling to match rendered PDF text
        if (item.width && item.width > 0) {
            const targetWidth = item.width * viewport.scale;
            const actualWidth = span.getBoundingClientRect().width;
            if (actualWidth > 0 && Math.abs(targetWidth - actualWidth) > 2) {
                const scaleX = targetWidth / actualWidth;
                span.style.transform = `scaleX(${scaleX})`;
            }
        }
        
        // If it was modified prior to rendering, create the whiteout immediately
        if (itemData.modified) {
            createWhiteout();
            // Since it might be scaled, we use the original targetWidth for the whiteout if available
            whiteoutEl.style.width = ((item.width ? item.width * viewport.scale : span.getBoundingClientRect().width) + 2) + 'px';
        }
    });
}

function sampleForegroundColor(x, y, width, height, background = { r: 255, g: 255, b: 255 }) {
    try {
        const canvas = state.rasterCanvas;
        const sx = Math.max(0, Math.floor(x));
        const sy = Math.max(0, Math.floor(y));
        const sw = Math.max(1, Math.min(Math.ceil(width), canvas.width - sx));
        const sh = Math.max(1, Math.min(Math.ceil(height * 1.15), canvas.height - sy));
        const pixels = canvas.getContext('2d', { willReadFrequently: true }).getImageData(sx, sy, sw, sh).data;
        const buckets = new Map();
        for (let index = 0; index < pixels.length; index += 4) {
            const color = { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2] };
            if (pixels[index + 3] < 180 || colorDistance(color, background) < 55) continue;
            const quantized = [color.r, color.g, color.b].map(value => Math.round(value / 24) * 24);
            const key = quantized.join(',');
            buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        const winner = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];
        if (winner) return rgbToHex(...winner[0].split(',').map(Number));
    } catch (error) {
        console.warn('Could not sample original text color:', error);
    }
    return '#000000';
}

function startEditingText(span, itemData, pageNum) {
    // Finish any other items being edited
    document.querySelectorAll('.text-layer-item.editing').forEach(el => {
        if (el !== span) {
            el.contentEditable = 'false';
            el.classList.remove('editing');
        }
    });
    
    if (span.classList.contains('editing')) return; // Already editing
    
    // Make editable
    span.classList.add('editing');
    span.contentEditable = 'true';
    // Remove scaleX transform while editing for natural typing
    span.dataset.origTransform = span.style.transform;
    span.style.transform = 'none';
    span.focus();
    
    // Select all text for easy replacement
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Handle blur → finish editing
    const onBlur = () => {
        finishEditingText(span, itemData, pageNum);
    };
    span.addEventListener('blur', onBlur, { once: true });
    
    // Handle keyboard
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            span.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            span.textContent = itemData.originalText;
            span.blur();
        }
        // Prevent page navigation while editing
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.stopPropagation();
        }
        // Prevent delete handler from removing elements
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.stopPropagation();
        }
    };
    span.addEventListener('keydown', onKeyDown);
    
    // Cleanup keydown listener on blur
    span.addEventListener('blur', () => {
        span.removeEventListener('keydown', onKeyDown);
    }, { once: true });
}

function finishEditingText(span, itemData, pageNum) {
    span.contentEditable = 'false';
    span.classList.remove('editing');
    
    if (span.dataset.origTransform) {
        span.style.transform = span.dataset.origTransform;
    }
    
    const newText = span.textContent.trim();
    
    if (newText && newText !== itemData.originalText) {
        // Text was modified
        itemData.currentText = newText;
        itemData.modified = true;
        span.classList.add('modified');
        span.textContent = newText;
        
        // Store the modification for saving
        if (!state.modifiedText[pageNum]) state.modifiedText[pageNum] = {};
        state.modifiedText[pageNum][itemData.index] = {
            originalText: itemData.originalText,
            newText: newText,
            transform: itemData.transform,
            fontName: itemData.fontName,
            pdfX: itemData.pdfX,
            pdfY: itemData.pdfY,
            origPdfX: itemData.origPdfX,
            origPdfY: itemData.origPdfY,
            pdfFontSize: itemData.pdfFontSize,
            bgColor: itemData.bgColor,
            color: itemData.color || '#000000',
        };
        
        saveHistory();
        showToast('Text modified — will be applied on save', 'success');
    } else if (!newText || newText === itemData.originalText) {
        // Reverted or empty → remove modification
        span.textContent = itemData.originalText;
        itemData.currentText = itemData.originalText;
        itemData.modified = false;
        span.classList.remove('modified');
        
        if (state.modifiedText[pageNum]) {
            delete state.modifiedText[pageNum][itemData.index];
            if (Object.keys(state.modifiedText[pageNum]).length === 0) {
                delete state.modifiedText[pageNum];
            }
        }
    }
    
    // Restore scaleX transform
    if (span.dataset.origTransform) {
        // Recompute scale for new text
        span.style.transform = 'none';
        // For modified text, don't re-apply the old scale since content changed
        if (!itemData.modified && span.dataset.origTransform !== 'none') {
            span.style.transform = span.dataset.origTransform;
        }
    }
}

function mapPdfFont(fontName) {
    if (!fontName) return 'Helvetica, Arial, sans-serif';
    const lower = fontName.toLowerCase();
    if (lower.includes('times') || (lower.includes('serif') && !lower.includes('sans'))) {
        return 'Times New Roman, Times, serif';
    }
    if (lower.includes('courier') || lower.includes('mono')) {
        return 'Courier New, Courier, monospace';
    }
    if (lower.includes('arial')) return 'Arial, Helvetica, sans-serif';
    if (lower.includes('georgia')) return 'Georgia, serif';
    if (lower.includes('verdana')) return 'Verdana, sans-serif';
    return 'Helvetica, Arial, sans-serif';
}

// =============================================
// Initialize App (deferred for ES module load)
// =============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
