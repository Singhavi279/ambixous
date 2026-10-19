/* =============================================
   PDF Studio — writing the things you added into the PDF

   Everything the editor lets you place (text, signatures, images, shapes, highlights,
   links, comments, form fields, freehand drawing) becomes real PDF content here.
   Positions come from the on-screen viewport, so a page that is rotated (including one
   that was rotated in the original file) gets everything in the right place and upright.
   ============================================= */
import { baselineRatio, familyKeyFor } from './pdf-fonts.js';

// Sizes of the on-screen controls that have no stored size (see styles.css).
const LINK_FONT_PX = 14;
const LINK_PADDING = { x: 4, y: 2 };
const COMMENT_PX = 28;
const FORM = { textWidth: 160, textHeight: 28, box: 18 };
const TYPED_SIGNATURE_PX = 36;
const TEXT_PADDING = { x: 4, y: 2 };
const TEXT_LINE_HEIGHT = 1.2;

const hexToRgb = (PDFLib, hex) => {
    const clean = String(hex || '#000000').replace('#', '').padEnd(6, '0');
    const channel = index => (parseInt(clean.slice(index, index + 2), 16) || 0) / 255;
    return PDFLib.rgb(channel(0), channel(2), channel(4));
};

async function renderTextImage(text, fontFamily, px, color) {
    if (document.fonts?.load) { try { await document.fonts.load(`${px}px ${fontFamily}`, text); } catch { /* fall back */ } }
    const supersample = 3;
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `${px}px ${fontFamily}`;
    const width = Math.ceil(probe.measureText(text).width) + 8;
    const height = Math.ceil(px * 1.5);
    const canvas = document.createElement('canvas');
    canvas.width = width * supersample;
    canvas.height = height * supersample;
    const context = canvas.getContext('2d');
    context.scale(supersample, supersample);
    context.font = `${px}px ${fontFamily}`;
    context.fillStyle = color;
    context.textBaseline = 'alphabetic';
    context.fillText(text, 4, px * 1.1);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

/**
 * context: {
 *   PDFLib, pdfDoc, embedder (TextEmbedder), page (pdf-lib page), viewport (pdf.js, as displayed),
 *   elements, freehandPaths, resolveAssetSource(element), embedImage(source)
 * }
 */
export async function drawPageElements(context) {
    const { PDFLib, pdfDoc, embedder, page, viewport, elements = [], freehandPaths = [] } = context;
    const { rgb, degrees, LineCapStyle } = PDFLib;
    const scale = viewport.scale;
    const turn = ((viewport.rotation % 360) + 360) % 360;
    const rotate = degrees(turn);
    const point = (x, y) => viewport.convertToPdfPoint(x, y);
    const warnings = [];

    // Axis-aligned rectangle from screen coordinates (top-left origin).
    const rectOf = (x, y, width, height) => {
        const [x1, y1] = point(x, y);
        const [x2, y2] = point(x + width, y + height);
        return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
    };
    // Upright content (text, images): origin at the screen bottom-left, rotated to stay upright.
    const uprightBox = (x, y, width, height) => {
        const [ox, oy] = point(x, y + height);
        return { x: ox, y: oy, width: width / scale, height: height / scale, rotate };
    };
    const thickness = pixels => Math.max(0.1, pixels / scale);
    const angleRad = (turn * Math.PI) / 180;
    const along = (distance) => [Math.cos(angleRad) * distance, Math.sin(angleRad) * distance];

    const form = { value: null };
    const getForm = () => (form.value ||= pdfDoc.getForm());
    const addAnnotation = dictionary => {
        const ref = pdfDoc.context.register(pdfDoc.context.obj(dictionary));
        page.node.addAnnot(ref);
    };
    const rectArray = r => [r.x, r.y, r.x + r.width, r.y + r.height];
    // A document that already has fields (from an earlier save) must not get a clashing name.
    let takenNames = null;
    const fieldName = prefix => {
        takenNames ||= new Set(getForm().getFields().map(field => field.getName()));
        let counter = 1;
        while (takenNames.has(`${prefix}_${counter}`)) counter++;
        const name = `${prefix}_${counter}`;
        takenNames.add(name);
        return name;
    };

    // Draws one line of text with its baseline-left corner at a screen position.
    const drawLine = async (text, screenX, screenBaseline, { family, bold, italic, size, color }) => {
        const [ox, oy] = point(screenX, screenBaseline);
        return embedder.drawText(page, text, { x: ox, y: oy, size, family, bold, italic, color, angle: angleRad });
    };

    for (const el of elements) {
        try {
            if (el.type === 'text' && el.text) {
                const family = familyKeyFor(el.fontFamily);
                const pixels = el.fontSize || 12;
                const size = pixels / scale;
                const lines = String(el.text).split(/\r?\n/);
                const ratio = baselineRatio(family) + (TEXT_LINE_HEIGHT - 1) / 2;
                for (let i = 0; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    await drawLine(lines[i], el.x + TEXT_PADDING.x, el.y + TEXT_PADDING.y + (ratio + i * TEXT_LINE_HEIGHT) * pixels, {
                        family, bold: Boolean(el.bold), italic: Boolean(el.italic), size, color: hexToRgb(PDFLib, el.color),
                    });
                }
            }

            if (el.type === 'whiteout') {
                page.drawRectangle({ ...rectOf(el.x, el.y, el.width, el.height), color: el.color ? hexToRgb(PDFLib, el.color) : rgb(1, 1, 1) });
            }

            if (el.type === 'shape') {
                const stroke = hexToRgb(PDFLib, el.strokeColor);
                const fill = hexToRgb(PDFLib, el.fillColor);
                const opacity = (el.opacity ?? 100) / 100;
                const borderWidth = thickness(el.strokeWidth || 2);
                if (el.shapeType === 'rectangle') {
                    page.drawRectangle({
                        ...rectOf(Math.min(el.x1, el.x2), Math.min(el.y1, el.y2), Math.abs(el.x2 - el.x1), Math.abs(el.y2 - el.y1)),
                        borderColor: stroke, color: fill, borderWidth, opacity, borderOpacity: opacity,
                    });
                } else if (el.shapeType === 'circle') {
                    const box = rectOf(Math.min(el.x1, el.x2), Math.min(el.y1, el.y2), Math.abs(el.x2 - el.x1), Math.abs(el.y2 - el.y1));
                    page.drawEllipse({
                        x: box.x + box.width / 2, y: box.y + box.height / 2, xScale: box.width / 2, yScale: box.height / 2,
                        borderColor: stroke, color: fill, borderWidth, opacity, borderOpacity: opacity,
                    });
                } else if (el.shapeType === 'line' || el.shapeType === 'arrow') {
                    const [sx, sy] = point(el.x1, el.y1);
                    const [ex, ey] = point(el.x2, el.y2);
                    const length = Math.hypot(ex - sx, ey - sy);
                    const headLength = Math.min(length * 0.6, 10 * (el.strokeWidth || 2) / scale);
                    const heading = Math.atan2(ey - sy, ex - sx);
                    const shaftEnd = el.shapeType === 'arrow' && length > 1
                        ? { x: ex - Math.cos(heading) * headLength * 0.9, y: ey - Math.sin(heading) * headLength * 0.9 } : { x: ex, y: ey };
                    page.drawLine({ start: { x: sx, y: sy }, end: shaftEnd, thickness: borderWidth, color: stroke, opacity, lineCap: LineCapStyle.Butt });
                    if (el.shapeType === 'arrow' && length > 1) {
                        const half = headLength * 0.35;
                        const baseX = ex - Math.cos(heading) * headLength;
                        const baseY = ey - Math.sin(heading) * headLength;
                        const path = `M ${ex} ${-ey} L ${baseX - Math.sin(heading) * half} ${-(baseY + Math.cos(heading) * half)} L ${baseX + Math.sin(heading) * half} ${-(baseY - Math.cos(heading) * half)} Z`;
                        page.drawSvgPath(path, { x: 0, y: 0, color: stroke, opacity, borderWidth: 0 });
                    }
                }
            }

            if (el.type === 'annotation') {
                const color = hexToRgb(PDFLib, el.color);
                if (el.annotationType === 'highlight') {
                    page.drawRectangle({ ...rectOf(el.x, el.y, el.width, el.height), color, opacity: 0.35 });
                } else {
                    const y = el.annotationType === 'underline' ? el.y + el.height : el.y + el.height / 2;
                    const [sx, sy] = point(el.x, y);
                    const [ex, ey] = point(el.x + el.width, y);
                    page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: thickness(2), color });
                }
            }

            if (el.type === 'image' || (el.type === 'signature' && (el.sigType === 'drawn' || el.sigType === 'uploaded'))) {
                const source = context.resolveAssetSource(el);
                if (source) {
                    const image = await context.embedImage(source);
                    const width = el.width || 200;
                    const height = el.height || (image.height / image.width) * width;
                    page.drawImage(image, uprightBox(el.x, el.y, width, height));
                }
            }

            if (el.type === 'signature' && el.sigType === 'typed' && el.text) {
                const rendered = await renderTextImage(el.text, el.font || 'cursive', TYPED_SIGNATURE_PX, '#000000');
                const image = await pdfDoc.embedPng(rendered.bytes);
                page.drawImage(image, uprightBox(el.x, el.y, rendered.width, rendered.height));
            }

            if (el.type === 'link') {
                const label = el.displayText || el.url || 'Link';
                const family = 'sans';
                const size = LINK_FONT_PX / scale;
                const width = await embedder.widthOf(label, { family, bold: false, italic: false }, LINK_FONT_PX);
                const baseline = el.y + LINK_PADDING.y + baselineRatio(family) * LINK_FONT_PX;
                await drawLine(label, el.x + LINK_PADDING.x, baseline, { family, bold: false, italic: false, size, color: rgb(0.1, 0.34, 0.86) });
                const [ux, uy] = point(el.x + LINK_PADDING.x, baseline + 2);
                const [vx, vy] = along(width / scale);
                page.drawLine({ start: { x: ux, y: uy }, end: { x: ux + vx, y: uy + vy }, thickness: thickness(1), color: rgb(0.1, 0.34, 0.86) });
                const box = rectOf(el.x, el.y, width + LINK_PADDING.x * 2, LINK_FONT_PX * 1.5);
                const target = context.sanitizeUrl ? context.sanitizeUrl(el.url) : el.url;
                if (target) {
                    addAnnotation({
                        Type: 'Annot', Subtype: 'Link', Rect: rectArray(box), Border: [0, 0, 0], F: 4,
                        A: { Type: 'Action', S: 'URI', URI: PDFLib.PDFString.of(target) },
                    });
                }
            }

            if (el.type === 'comment') {
                addAnnotation({
                    Type: 'Annot', Subtype: 'Text', Rect: rectArray(rectOf(el.x, el.y, COMMENT_PX, COMMENT_PX)),
                    Contents: PDFLib.PDFHexString.fromText(el.text || ''), Name: 'Comment', Open: false, F: 28, C: [1, 0.78, 0.2],
                });
            }

            if (el.type === 'form') {
                // pdf-lib rotates the widget's own rectangle, so give it the upright size and corner (like an image).
                const place = (width, height) => uprightBox(el.x, el.y, width, height);
                if (el.formType === 'text-field') {
                    const field = getForm().createTextField(fieldName('text'));
                    field.addToPage(page, { ...place(FORM.textWidth, FORM.textHeight), borderWidth: 1, borderColor: rgb(0.65, 0.65, 0.65), backgroundColor: rgb(0.996, 0.996, 0.996) });
                } else if (el.formType === 'checkbox') {
                    const field = getForm().createCheckBox(fieldName('check'));
                    field.addToPage(page, { ...place(FORM.box, FORM.box), borderWidth: 1, borderColor: rgb(0.4, 0.4, 0.4) });
                } else if (el.formType === 'radio') {
                    const group = getForm().createRadioGroup(fieldName('radio'));
                    group.addOptionToPage('Choice', page, { ...place(FORM.box, FORM.box), borderWidth: 1, borderColor: rgb(0.4, 0.4, 0.4) });
                } else if (el.formType === 'dropdown-field') {
                    const field = getForm().createDropdown(fieldName('dropdown'));
                    field.addOptions(['Option 1', 'Option 2', 'Option 3']);
                    field.addToPage(page, { ...place(FORM.textWidth, FORM.textHeight), borderWidth: 1, borderColor: rgb(0.65, 0.65, 0.65), backgroundColor: rgb(0.996, 0.996, 0.996) });
                }
            }
        } catch (error) {
            console.warn(`Could not write a ${el.type} element into the PDF.`, error);
            warnings.push(`A ${el.type} could not be saved.`);
        }
    }

    for (const path of freehandPaths) {
        if (path.points.length < 2) continue;
        const color = hexToRgb(PDFLib, path.color);
        for (let i = 0; i < path.points.length - 1; i++) {
            const [sx, sy] = point(path.points[i].x, path.points[i].y);
            const [ex, ey] = point(path.points[i + 1].x, path.points[i + 1].y);
            page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: thickness(path.size), color, lineCap: LineCapStyle.Round });
        }
    }
    return warnings;
}
