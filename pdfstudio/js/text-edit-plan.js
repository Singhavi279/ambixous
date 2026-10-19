/* =============================================
   PDF Studio — planning a surgical text edit

   Instead of re-typesetting a whole line, find the characters that actually
   changed, remove only those glyphs from the page, draw the replacement in the
   gap, and shift the rest of the line to follow. Every untouched character keeps
   the original font, kerning and colour.

   Returns { ok: false, reason } whenever the edit cannot be done this way with
   confidence; the caller then falls back to replacing the whole line.
   ============================================= */
import { isChain } from './pdf-content.js';

const chars = text => Array.from(text);


/**
 * Pairs every character of the line with the glyph that draws it (null for spaces
 * that PDF.js inserted between items). Only succeeds when the pairing is provably
 * one-to-one, so it can never silently misalign text and glyphs.
 */
function mapSlots(entry, match) {
    const { orig } = entry;
    if (!match.safe || !match.glyphs.length) return { reason: 'no glyph map' };
    if (!orig.segments?.length) return { reason: 'no segment map' };
    const fontSize = Math.max(orig.fontSize, 1);
    const slots = [];
    for (const segment of orig.segments) {
        const segmentChars = chars(segment.text);
        if (segment.synthetic) { segmentChars.forEach(() => slots.push(null)); continue; }
        const tolerance = fontSize * 0.04;
        const inside = match.glyphs.filter(glyph => glyph.center >= segment.start - tolerance
            && glyph.center <= segment.start + segment.width + tolerance);
        if (inside.length !== segmentChars.length) return { reason: 'characters do not match glyphs one-to-one' };
        inside.forEach(glyph => slots.push(glyph));
    }
    if (slots.length < chars(orig.fullText ?? entry.originalText).length) return { reason: 'glyph map shorter than text' };
    return { slots, fontSize };
}

/**
 * Re-typesets a whole line while keeping each character's own look. Characters that
 * survive the edit keep their original font style, colour and size; inserted ones
 * borrow from their neighbour. Returns an ordered list of styled pieces, or null when
 * the line cannot be mapped (the caller then uses one uniform style).
 */
export function planStyledPieces({ analysis, entry, match }) {
    const mapped = mapSlots(entry, match);
    if (mapped.reason) return null;
    const showsById = new Map(analysis.shows.map(show => [show.id, show]));
    const styleOf = glyph => {
        const show = glyph && showsById.get(glyph.showId);
        if (!show?.font) return null;
        return {
            family: show.font.family, bold: Boolean(show.font.bold), italic: Boolean(show.font.italic),
            size: show.sizeUser, color: show.color || entry.color,
        };
    };
    const text = chars(entry.originalText);
    const next = chars(entry.newText);
    const originalStyles = [];
    let carry = null;
    text.forEach((_, index) => {
        const own = styleOf(mapped.slots[index]);
        if (own) carry = own;
        originalStyles.push(own || carry);
    });
    const leading = originalStyles.find(Boolean);
    if (!leading) return null;
    for (let i = 0; i < originalStyles.length; i++) originalStyles[i] ||= leading;

    let prefix = 0;
    while (prefix < text.length && prefix < next.length && text[prefix] === next[prefix]) prefix++;
    let suffix = 0;
    while (suffix < text.length - prefix && suffix < next.length - prefix
        && text[text.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++;
    const styles = next.map((_, index) => {
        if (index < prefix) return originalStyles[index];
        if (index >= next.length - suffix) return originalStyles[text.length - (next.length - index)];
        // Replaced text keeps the look of what it replaced; a pure insertion borrows from the character before it.
        return text.length - suffix > prefix ? originalStyles[prefix] : originalStyles[Math.max(prefix - 1, 0)];
    });

    const key = style => `${style.family}|${style.bold}|${style.italic}|${style.size.toFixed(2)}|${style.color}`;
    const pieces = [];
    next.forEach((char, index) => {
        const style = styles[index];
        const last = pieces[pieces.length - 1];
        if (last && key(last) === key(style)) last.text += char;
        else pieces.push({ text: char, family: style.family, bold: style.bold, italic: style.italic, size: style.size, color: style.color });
    });
    return pieces;
}

/**
 * entry   — saved edit: { orig: { x, y, width, fontSize, angle, segments }, originalText, newText, color, ... }
 * match   — result of matchRun() for entry.orig (must be safe)
 * measure — async (text, style, size) => advance width in page units
 */
export async function planSurgicalEdit({ analysis, entry, match, measure }) {
    const { orig } = entry;
    const fail = reason => ({ ok: false, reason });
    if (!match.safe || !match.glyphs.length) return fail('no glyph map');
    if (!orig.segments?.length) return fail('no segment map');

    // ---- map every character of the line to the glyph that draws it ----
    const mapped = mapSlots(entry, match);
    if (mapped.reason) return fail(mapped.reason);
    const { slots, fontSize } = mapped;
    const text = chars(entry.originalText);
    const next = chars(entry.newText);

    // ---- smallest changed region ----
    let prefix = 0;
    while (prefix < text.length && prefix < next.length && text[prefix] === next[prefix]) prefix++;
    let suffix = 0;
    while (suffix < text.length - prefix && suffix < next.length - prefix
        && text[text.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++;
    const removedSlots = slots.slice(prefix, text.length - suffix).filter(Boolean);
    const insertedText = next.slice(prefix, next.length - suffix).join('');
    const removedText = text.slice(prefix, text.length - suffix).join('');
    if (!removedSlots.length && !insertedText) return { ok: true, glyphEdits: new Map(), inserts: [], delta: 0, removedText };
    const suffixSlots = slots.slice(text.length - suffix, text.length).filter(Boolean);

    const showsById = new Map(analysis.shows.map(show => [show.id, show]));
    const orderOf = new Map(analysis.shows.map((show, index) => [show.id, index]));

    // ---- where the replacement is drawn, and in what style ----
    let anchor;
    let along;
    if (removedSlots.length) { anchor = removedSlots[0]; along = anchor.start; }
    else if (slots[prefix]) { anchor = slots[prefix]; along = anchor.start; }
    else if (prefix > 0 && slots[prefix - 1]) { anchor = slots[prefix - 1]; along = anchor.start + anchor.advance; }
    else return fail('no anchor glyph');
    const styleGlyph = removedSlots[0] || slots[prefix - 1] || slots[prefix];
    const styleShow = showsById.get(styleGlyph.showId);
    if (!styleShow?.font) return fail('no style source');
    const anchorShow = showsById.get(anchor.showId);
    const cos = Math.cos(orig.angle || 0);
    const sin = Math.sin(orig.angle || 0);
    const offset = along - anchor.showStart;
    const insertStyle = {
        family: styleShow.font.family, bold: Boolean(styleShow.font.bold), italic: Boolean(styleShow.font.italic),
    };
    const insertSize = styleShow.sizeUser;
    const insertWidth = insertedText ? await measure(insertedText, insertStyle, insertSize) : 0;
    // The distance the replacement must make up is measured to the first glyph that survives,
    // so kerning inside the removed span (which stays in the stream) is accounted for.
    const removedAdvance = removedSlots.reduce((sum, glyph) => sum + glyph.advance, 0);
    const firstSurvivor = suffixSlots[0];
    const availableSpan = firstSurvivor && firstSurvivor.start >= along - 1e-6 ? firstSurvivor.start - along : removedAdvance;
    const delta = insertWidth - availableSpan;

    const inserts = insertedText ? [{
        text: insertedText, x: anchorShow.x + offset * cos, y: anchorShow.y + offset * sin, size: insertSize,
        color: styleShow.color || entry.color, angle: orig.angle || 0, ...insertStyle,
    }] : [];

    // ---- edit the page: removed glyphs keep their advance; one net gap shifts the rest ----
    const glyphEdits = new Map();
    const spec = id => {
        if (!glyphEdits.has(id)) glyphEdits.set(id, { removed: new Set(), keepAdvance: true, insertions: new Map() });
        return glyphEdits.get(id);
    };
    removedSlots.forEach(glyph => spec(glyph.showId).removed.add(glyph.index));

    const needsShift = suffixSlots.length > 0 && Math.abs(delta) > fontSize * 0.02;
    if (needsShift) {
        const afterEdit = removedSlots.length ? removedSlots[removedSlots.length - 1] : (slots[prefix - 1] || null);
        const lastSuffix = suffixSlots.reduce((best, glyph) => (orderOf.get(glyph.showId) > orderOf.get(best.showId)
            || (orderOf.get(glyph.showId) === orderOf.get(best.showId) && glyph.index > best.index) ? glyph : best));
        const firstSuffix = suffixSlots[0];
        // The gap goes right after the last changed glyph (or before the first suffix glyph on a pure insertion).
        const gapShow = afterEdit ? showsById.get(afterEdit.showId) : showsById.get(firstSuffix.showId);
        const gapIndex = afterEdit ? afterEdit.index + 1 : firstSuffix.index;
        const suffixShow = showsById.get(lastSuffix.showId);
        if (orderOf.get(gapShow.id) > orderOf.get(suffixShow.id)) return fail('text order differs from drawing order');
        if (!isChain(analysis, gapShow.id, suffixShow.id)) return fail('rest of the line is positioned separately');
        if (gapShow.scale < 1e-6 || suffixShow.scale < 1e-6) return fail('degenerate scale');
        spec(gapShow.id).insertions.set(gapIndex, (spec(gapShow.id).insertions.get(gapIndex) || 0) + delta / gapShow.scale);
        // Cancel the shift after the line so neighbouring cells and columns stay where they were.
        const closeIndex = lastSuffix.index + 1;
        spec(suffixShow.id).insertions.set(closeIndex, (spec(suffixShow.id).insertions.get(closeIndex) || 0) - delta / suffixShow.scale);
    }

    return { ok: true, glyphEdits, inserts, delta, removedText, newWidth: orig.width + delta, cutAlong: firstSurvivor ? firstSurvivor.start : along + removedAdvance };
}
