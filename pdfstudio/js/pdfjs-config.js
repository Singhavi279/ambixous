/* PDF.js is served from vendor/ together with its standard fonts and CJK character maps,
   so rendering is consistent and works offline. */
const vendor = new URL('../vendor/', import.meta.url);

const assets = {
    standardFontDataUrl: new URL('standard_fonts/', vendor).href,
    cMapUrl: new URL('cmaps/', vendor).href,
    cMapPacked: true,
};

let configured = false;

/** Opens a document with PDF.js using the bundled worker and font data. */
export function openPdfDocument(source) {
    const lib = window.pdfjsLib;
    if (!configured) {
        lib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', vendor).href;
        configured = true;
    }
    return lib.getDocument({ ...source, ...assets });
}
