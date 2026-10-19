import test from "node:test"
import assert from "node:assert/strict"
import PDFKit from "pdfkit"
import * as PDFLib from "@cantoo/pdf-lib"
import {
  setPdfLib, parseContent, analyzePage, matchRun, buildPatchedScopes, commitPatchedScopes, mul, isChain, findContentInRects,
} from "../js/pdf-content.js"
import { planSurgicalEdit, planStyledPieces } from "../js/text-edit-plan.js"

setPdfLib(PDFLib)
const decoder = new TextDecoder("latin1")

async function standardFontDocument() {
  const doc = await PDFLib.PDFDocument.create()
  const regular = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const bold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  page.drawText("Sample Heading", { x: 50, y: 780, size: 24, font: bold })
  page.drawText("The quick brown fox jumps over the lazy dog.", { x: 50, y: 740, size: 14, font: regular })
  page.drawText("Invoice total: $1,250.00", { x: 50, y: 710, size: 14, font: regular })
  return PDFLib.PDFDocument.load(await doc.save())
}

function pdfkitBytes(draw) {
  return new Promise(resolve => {
    const chunks = []
    const doc = new PDFKit({ size: "A4", compress: false })
    doc.on("data", chunk => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    draw(doc)
    doc.end()
  })
}

const runOf = show => ({ x: show.x, y: show.y, width: show.width, fontSize: show.sizeUser, angle: show.angle })
const textOf = analysis => analysis.shows.map(show => decoder.decode(show.bytes)).join("|")

test("tokenizer keeps byte ranges, escapes, hex strings, arrays and inline images", () => {
  const source = "q 1 0 0 1 10 20 cm % comment\nBT /F1 12 Tf (a\\(b\\)\\101) Tj <4142> Tj [(x) -120 (y)] TJ ET\nBI /W 1 /H 1 /CS /G ID \u0000ÿ EI\nQ"
  const bytes = Uint8Array.from(Buffer.from(source, "latin1"))
  const ops = parseContent(bytes)
  assert.deepEqual(ops.map(op => op.op), ["q", "cm", "BT", "Tf", "Tj", "Tj", "TJ", "ET", "BI", "Q"])
  const first = ops.find(op => op.op === "Tj")
  assert.equal(decoder.decode(first.args[0].b), "a(b)A")
  assert.equal(decoder.decode(bytes.subarray(first.args[0].s, first.args[0].e)), "(a\\(b\\)\\101)")
  const inline = ops.find(op => op.op === "BI")
  assert.equal(decoder.decode(bytes.subarray(inline.s, inline.s + 2)), "BI")
  assert.equal(decoder.decode(bytes.subarray(inline.e - 2, inline.e)), "EI", "the inline image is skipped as one unit")
})

test("analysis finds every line of text with correct position, size and width", async () => {
  const analysis = await analyzePage(await standardFontDocument(), 0)
  assert.equal(analysis.failed, false)
  assert.equal(analysis.shows.length, 3)
  const heading = analysis.shows[0]
  assert.ok(Math.abs(heading.x - 50) < 0.01 && Math.abs(heading.y - 780) < 0.01)
  assert.ok(Math.abs(heading.sizeUser - 24) < 0.01)
  assert.ok(heading.width > 150 && heading.width < 200)
  assert.equal(heading.font.bold, true)
})

test("removing a line deletes its glyphs and leaves everything else exactly where it was", async () => {
  const doc = await standardFontDocument()
  const analysis = await analyzePage(doc, 0)
  const target = analysis.shows[1]
  const match = matchRun(analysis, runOf(target))
  assert.equal(match.safe, true)
  commitPatchedScopes(doc, analysis, buildPatchedScopes(analysis, { removals: match.removals }))
  const saved = await PDFLib.PDFDocument.load(await doc.save({ useObjectStreams: false }))
  const after = await analyzePage(saved, 0)
  const text = textOf(after)
  assert.ok(!text.includes("quick brown"), "removed text must not survive")
  assert.ok(text.includes("Sample Heading") && text.includes("Invoice total"))
  for (const original of [analysis.shows[0], analysis.shows[2]]) {
    const same = after.shows.find(show => Math.abs(show.x - original.x) < 0.01 && Math.abs(show.y - original.y) < 0.01)
    assert.ok(same, "untouched line keeps its position")
  }
  // The replaced content stream must not linger in the file as an unreferenced object.
  for (const [, object] of saved.context.enumerateIndirectObjects()) {
    if (object instanceof PDFLib.PDFRawStream) {
      const contents = decoder.decode(PDFLib.decodePDFRawStream(object).decode())
      assert.ok(!contents.includes("quick brown"), "no stream may still contain the removed text")
    }
  }
})

test("removal works glyph by glyph inside a kerned TJ array without disturbing the rest", async () => {
  const bytes = await pdfkitBytes(doc => doc.font("Helvetica-Bold").fontSize(24).text("Invoice #1042", 50, 60))
  const doc = await PDFLib.PDFDocument.load(bytes)
  const analysis = await analyzePage(doc, 0)
  const line = analysis.shows.filter(show => Math.abs(show.y - analysis.shows[0].y) < 1)
  const origin = line[0]
  const run = { x: origin.x, y: origin.y, width: line.reduce((end, show) => Math.max(end, show.x - origin.x + show.width), 0), fontSize: origin.sizeUser, angle: 0 }
  const match = matchRun(analysis, run)
  assert.equal(match.safe, true)
  // Remove only "Invoice" (the first seven glyphs); keep " #1042".
  const keep = match.glyphs.slice(7)
  const removals = new Map()
  match.glyphs.slice(0, 7).forEach(glyph => {
    if (!removals.has(glyph.showId)) removals.set(glyph.showId, new Set())
    removals.get(glyph.showId).add(glyph.index)
  })
  commitPatchedScopes(doc, analysis, buildPatchedScopes(analysis, { removals }))
  const after = await analyzePage(await PDFLib.PDFDocument.load(await doc.save()), 0)
  assert.equal(textOf(after).replace(/\|/g, ""), " #1042")
  const survivor = after.shows[0]
  assert.ok(Math.abs(survivor.x - (origin.x + keep[0].start)) < 0.05, "surviving glyphs stay at their original x")
})

test("surgical plan shifts the tail by the width difference and restores what follows", async () => {
  const doc = await standardFontDocument()
  const analysis = await analyzePage(doc, 0)
  const target = analysis.shows[1]
  const run = runOf(target)
  const match = matchRun(analysis, run)
  const entry = {
    originalText: "The quick brown fox jumps over the lazy dog.",
    newText: "The quick brown fox jumps over the sleepy dog.",
    color: "#000000",
    orig: { ...run, segments: [{ text: "The quick brown fox jumps over the lazy dog.", start: 0, width: run.width, synthetic: false }], fullText: "The quick brown fox jumps over the lazy dog." },
  }
  const plan = await planSurgicalEdit({ analysis, entry, match, measure: async (text, style, size) => text.length * size * 0.5 })
  assert.equal(plan.ok, true)
  assert.equal(plan.removedText, "laz")
  assert.equal(plan.inserts[0].text, "sleep")
  const spec = [...plan.glyphEdits.values()][0]
  assert.equal(spec.removed.size, 3)
  const gaps = [...spec.insertions.values()]
  assert.equal(gaps.length, 2)
  assert.ok(Math.abs(gaps[0] + gaps[1]) < 1e-9, "the closing gap cancels the first so later text is unaffected")
})

test("styled pieces keep each character's original style when text changes", async () => {
  const bytes = await pdfkitBytes(doc => {
    doc.font("Helvetica").fontSize(12).text("plain ", 50, 60, { continued: true })
    doc.font("Helvetica-Bold").text("bold", { continued: true })
    doc.font("Helvetica").text(" end")
  })
  const doc = await PDFLib.PDFDocument.load(bytes)
  const analysis = await analyzePage(doc, 0)
  const first = analysis.shows[0]
  const width = analysis.shows.filter(show => Math.abs(show.y - first.y) < 1).reduce((end, show) => Math.max(end, show.x - first.x + show.width), 0)
  const run = { x: first.x, y: first.y, width, fontSize: first.sizeUser, angle: 0 }
  const match = matchRun(analysis, run)
  const original = "plain bold end"
  const entry = {
    originalText: original, newText: "plain BOLD end", color: "#000000",
    orig: { ...run, segments: [{ text: original, start: 0, width, synthetic: false }], fullText: original },
  }
  const pieces = planStyledPieces({ analysis, entry, match })
  assert.ok(pieces, "a one-to-one glyph map exists")
  assert.deepEqual(pieces.map(piece => [piece.text, piece.bold]), [["plain ", false], ["BOLD", true], [" end", false]])
})

test("images can be moved, resized and deleted without touching text", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64"))
  const image = await doc.embedPng(png)
  const page = doc.addPage([400, 400])
  page.drawText("caption", { x: 20, y: 300, size: 12, font })
  page.drawImage(image, { x: 40, y: 100, width: 80, height: 60 })
  const reloaded = await PDFLib.PDFDocument.load(await doc.save())
  const analysis = await analyzePage(reloaded, 0)
  assert.equal(analysis.images.length, 1)
  const [x0, y0, x1, y1] = analysis.images[0].bbox
  assert.deepEqual([x0, y0, x1, y1].map(Math.round), [40, 100, 120, 160])

  // Move by (+100, +50).
  commitPatchedScopes(reloaded, analysis, buildPatchedScopes(analysis, {
    imageMatrices: new Map([[analysis.images[0].id, mul(analysis.images[0].ctm, [1, 0, 0, 1, 100, 50])]]),
  }))
  const afterMove = await analyzePage(await PDFLib.PDFDocument.load(await reloaded.save()), 0)
  assert.deepEqual(afterMove.images[0].bbox.map(Math.round), [140, 150, 220, 210])
  assert.equal(afterMove.shows.length, 1, "text is untouched")

  // Resize to double size, keeping the lower-left corner in place.
  const resizeDoc = await PDFLib.PDFDocument.load(await doc.save())
  const resizeAnalysis = await analyzePage(resizeDoc, 0)
  commitPatchedScopes(resizeDoc, resizeAnalysis, buildPatchedScopes(resizeAnalysis, {
    imageMatrices: new Map([[resizeAnalysis.images[0].id, mul(resizeAnalysis.images[0].ctm, [2, 0, 0, 2, -x0, -y0])]]),
  }))
  const afterResize = await analyzePage(await PDFLib.PDFDocument.load(await resizeDoc.save()), 0)
  assert.deepEqual(afterResize.images[0].bbox.map(Math.round), [40, 100, 200, 220])

  const again = await PDFLib.PDFDocument.load(await doc.save())
  const fresh = await analyzePage(again, 0)
  commitPatchedScopes(again, fresh, buildPatchedScopes(fresh, { deleteImages: new Set([fresh.images[0].id]) }))
  const gone = await analyzePage(await PDFLib.PDFDocument.load(await again.save()), 0)
  assert.equal(gone.images.length, 0)
  assert.equal(gone.shows.length, 1)
})

test("text inside a form drawn more than once is flagged unsafe instead of edited", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const page = doc.addPage([300, 300])
  const form = doc.context.register(doc.context.stream("BT /F0 12 Tf 10 10 Td (Shared header) Tj ET", {
    Type: "XObject", Subtype: "Form", BBox: [0, 0, 200, 40], Resources: { Font: { F0: font.ref } },
  }))
  page.node.setXObject(PDFLib.PDFName.of("Fm1"), form)
  const draw = PDFLib.PDFOperator.of("Do", [PDFLib.PDFName.of("Fm1")])
  page.pushOperators(
    PDFLib.pushGraphicsState(), PDFLib.concatTransformationMatrix(1, 0, 0, 1, 20, 200), draw, PDFLib.popGraphicsState(),
    PDFLib.pushGraphicsState(), PDFLib.concatTransformationMatrix(1, 0, 0, 1, 20, 100), draw, PDFLib.popGraphicsState(),
  )
  const analysis = await analyzePage(await PDFLib.PDFDocument.load(await doc.save()), 0)
  assert.equal(analysis.shows.length, 2)
  analysis.shows.forEach(show => assert.equal(show.unsafe, "shared form"))
  const match = matchRun(analysis, runOf(analysis.shows[0]))
  assert.equal(match.safe, false)
  assert.equal(match.reason, "shared form")
})

test("erasing a region removes the text and images under it for real, and nothing else", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64"))
  const image = await doc.embedPng(png)
  const page = doc.addPage([400, 400])
  page.drawText("keep this line", { x: 20, y: 350, size: 14, font })
  page.drawText("SECRET ACCOUNT 12345", { x: 20, y: 300, size: 14, font })
  page.drawImage(image, { x: 250, y: 290, width: 60, height: 40 })
  const reloaded = await PDFLib.PDFDocument.load(await doc.save())
  const analysis = await analyzePage(reloaded, 0)

  // A box over the middle of the secret line (it only touches "ACCOUNT"), and the corner of the image.
  const region = [{ x0: 90, y0: 295, x1: 140, y1: 320 }, { x0: 300, y0: 320, x1: 330, y1: 340 }]
  const centre = findContentInRects(analysis, region, "center")
  assert.equal(centre.imageIds.size, 0, "a partly covered image survives a plain whiteout")
  const touch = findContentInRects(analysis, region, "touch")
  assert.equal(touch.imageIds.size, 1, "redaction removes any image it touches")
  assert.equal(touch.blocked.length, 0)

  commitPatchedScopes(reloaded, analysis, buildPatchedScopes(analysis, { glyphEdits: touch.glyphEdits, deleteImages: touch.imageIds }))
  const after = await analyzePage(await PDFLib.PDFDocument.load(await reloaded.save({ useObjectStreams: false })), 0)
  const visible = textOf(after).replace(/\|/g, "")
  assert.ok(visible.includes("keep this line"))
  assert.ok(!visible.includes("ACCOUNT"), "the covered word is gone from the file")
  assert.ok(visible.includes("SECRET") && visible.includes("12345"), "text outside the box is untouched")
  assert.equal(after.images.length, 0)
})

test("moving an inline image keeps its binary data byte for byte", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const page = doc.addPage([200, 200])
  const header = Buffer.from("q 50 0 0 50 20 20 cm\nBI /W 2 /H 2 /CS /G /BPC 8 ID ", "latin1")
  const data = Buffer.from([0x00, 0x80, 0x9f, 0xe9, 0xff, 0x7f])
  const footer = Buffer.from("\nEI Q\n", "latin1")
  page.node.set(PDFLib.PDFName.of("Contents"), doc.context.register(doc.context.stream(Buffer.concat([header, data, footer]))))
  const reloaded = await PDFLib.PDFDocument.load(await doc.save())
  const analysis = await analyzePage(reloaded, 0)
  assert.equal(analysis.images.length, 1)
  assert.equal(analysis.images[0].kind, "inline-image")
  commitPatchedScopes(reloaded, analysis, buildPatchedScopes(analysis, {
    imageMatrices: new Map([[analysis.images[0].id, mul(analysis.images[0].ctm, [1, 0, 0, 1, 40, 10])]]),
  }))
  const after = await PDFLib.PDFDocument.load(await reloaded.save({ useObjectStreams: false }))
  const [stream] = after.getPage(0).node.Contents() instanceof PDFLib.PDFArray ? [after.context.lookup(after.getPage(0).node.Contents().get(0))] : [after.getPage(0).node.Contents()]
  const bytes = Buffer.from(PDFLib.decodePDFRawStream(stream).decode())
  assert.ok(bytes.includes(data), "the raw image bytes are unchanged")
  const moved = await analyzePage(after, 0)
  assert.deepEqual(moved.images[0].bbox.map(Math.round), [60, 30, 110, 80])
})

test("painted shapes are objects that can be moved and deleted, while page-sized backgrounds and specks are not", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const page = doc.addPage([595, 842])
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: PDFLib.rgb(0.97, 0.97, 0.97) })     // background
  page.drawRectangle({ x: 40, y: 100, width: 120, height: 60, color: PDFLib.rgb(0.9, 0.4, 0.2) })       // a box
  page.drawLine({ start: { x: 40, y: 300 }, end: { x: 300, y: 300 }, thickness: 1, color: PDFLib.rgb(0, 0, 0) }) // a rule
  page.drawRectangle({ x: 400, y: 400, width: 2, height: 2, color: PDFLib.rgb(0, 0, 0) })                // a speck
  page.drawText("label", { x: 50, y: 500, size: 12, font })
  const bytes = await doc.save()

  const analysis = await analyzePage(await PDFLib.PDFDocument.load(bytes), 0)
  const kinds = analysis.images.map(object => `${object.kind}:${object.bbox.map(Math.round).join(",")}`)
  assert.equal(analysis.images.length, 2, `box and rule only, got ${kinds}`)
  const box = analysis.images.find(object => Math.abs(object.bbox[0] - 40) < 1 && object.bbox[3] - object.bbox[1] > 50)
  assert.deepEqual(box.bbox.map(Math.round), [40, 100, 160, 160])

  const moved = await PDFLib.PDFDocument.load(bytes)
  const movedAnalysis = await analyzePage(moved, 0)
  const target = movedAnalysis.images.find(object => Math.abs(object.bbox[0] - 40) < 1 && object.bbox[3] - object.bbox[1] > 50)
  commitPatchedScopes(moved, movedAnalysis, buildPatchedScopes(movedAnalysis, {
    imageMatrices: new Map([[target.id, mul(target.ctm, [1, 0, 0, 1, 50, 25])]]),
  }))
  const afterMove = await analyzePage(await PDFLib.PDFDocument.load(await moved.save()), 0)
  assert.ok(afterMove.images.some(object => object.bbox.map(Math.round).join(",") === "90,125,210,185"), "the box moved by (50, 25)")
  assert.ok(afterMove.images.some(object => Math.round(object.bbox[0]) === 40 && Math.round(object.bbox[1]) <= 300), "the rule did not move")
  assert.equal(afterMove.shows.length, 1)

  const erased = await PDFLib.PDFDocument.load(bytes)
  const erasedAnalysis = await analyzePage(erased, 0)
  const doomed = erasedAnalysis.images.find(object => object.bbox[3] - object.bbox[1] > 50)
  commitPatchedScopes(erased, erasedAnalysis, buildPatchedScopes(erasedAnalysis, { deleteImages: new Set([doomed.id]) }))
  const afterDelete = await analyzePage(await PDFLib.PDFDocument.load(await erased.save()), 0)
  assert.equal(afterDelete.images.length, 1, "only the rule is left")
})

test("a form without text is one movable object; a form with text keeps its text editable", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica)
  const page = doc.addPage([400, 400])
  const logo = doc.context.register(doc.context.stream("0.2 0.5 0.9 rg 0 0 40 40 re f 1 1 0 rg 10 10 20 20 re f", {
    Type: "XObject", Subtype: "Form", BBox: [0, 0, 40, 40], Resources: {},
  }))
  const caption = doc.context.register(doc.context.stream("BT /F0 12 Tf 0 0 Td (inside a form) Tj ET", {
    Type: "XObject", Subtype: "Form", BBox: [0, 0, 200, 20], Resources: { Font: { F0: font.ref } },
  }))
  page.node.setXObject(PDFLib.PDFName.of("Logo"), logo)
  page.node.setXObject(PDFLib.PDFName.of("Caption"), caption)
  page.pushOperators(
    PDFLib.pushGraphicsState(), PDFLib.concatTransformationMatrix(1, 0, 0, 1, 100, 200), PDFLib.PDFOperator.of("Do", [PDFLib.PDFName.of("Logo")]), PDFLib.popGraphicsState(),
    PDFLib.pushGraphicsState(), PDFLib.concatTransformationMatrix(1, 0, 0, 1, 100, 100), PDFLib.PDFOperator.of("Do", [PDFLib.PDFName.of("Caption")]), PDFLib.popGraphicsState(),
  )
  const reloaded = await PDFLib.PDFDocument.load(await doc.save())
  const analysis = await analyzePage(reloaded, 0)
  assert.deepEqual(analysis.images.map(object => object.kind), ["form"], "the logo is a single form object; its two rectangles are not separate")
  assert.deepEqual(analysis.images[0].bbox.map(Math.round), [100, 200, 140, 240])
  assert.equal(analysis.shows.length, 1, "the text inside the other form is still found")

  commitPatchedScopes(reloaded, analysis, buildPatchedScopes(analysis, {
    imageMatrices: new Map([[analysis.images[0].id, mul(analysis.images[0].ctm, [1, 0, 0, 1, 60, -30])]]),
  }))
  const after = await analyzePage(await PDFLib.PDFDocument.load(await reloaded.save()), 0)
  assert.deepEqual(after.images[0].bbox.map(Math.round), [160, 170, 200, 210])
})
