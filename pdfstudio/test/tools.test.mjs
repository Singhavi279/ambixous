import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import zlib from "node:zlib"
import { fileURLToPath } from "node:url"
import * as PDFLib from "@cantoo/pdf-lib"
import fontkit from "@cantoo/fontkit"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import { setFontLoader } from "../js/pdf-fonts.js"
import * as tools from "../js/pdf-tools.js"

const fontsDirectory = fileURLToPath(new URL("../fonts/", import.meta.url))
setFontLoader(async name => new Uint8Array(fs.readFileSync(fontsDirectory + name)))

// A document whose pages are told apart by their width (100, 200, 300 ...).
async function numberedDocument(count, firstWidth = 100) {
  const doc = await PDFLib.PDFDocument.create()
  for (let i = 0; i < count; i++) doc.addPage([firstWidth * (i + 1), 400])
  return doc.save()
}
const widths = async bytes => (await PDFLib.PDFDocument.load(bytes)).getPages().map(page => page.getWidth())

async function pageTexts(bytes) {
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise
  const out = []
  for (let i = 1; i <= document.numPages; i++) out.push((await (await document.getPage(i)).getTextContent()).items.map(item => item.str).join(""))
  return out
}

test("page ranges accept singles, ranges and open ends, and reject nonsense with a clear message", () => {
  assert.deepEqual(tools.parsePageRanges("1-3, 5, 8-", 9), [[0, 1, 2], [4], [7, 8]])
  assert.deepEqual(tools.parsePageRanges("-2", 5), [[0, 1]])
  assert.deepEqual(tools.flattenRanges(tools.parsePageRanges("1-3,2-4", 6)), [0, 1, 2, 3])
  assert.throws(() => tools.parsePageRanges("0", 3), /outside this document/)
  assert.throws(() => tools.parsePageRanges("4", 3), /outside this document/)
  assert.throws(() => tools.parsePageRanges("3-1", 5), /backwards/)
  assert.throws(() => tools.parsePageRanges("abc", 5), /not a page or range/)
  assert.throws(() => tools.parsePageRanges("", 5), /Enter the pages/)
})

test("merge keeps every page in order across files", async () => {
  const merged = await tools.mergePdfs(PDFLib, [{ bytes: await numberedDocument(2) }, { bytes: await numberedDocument(3, 1000) }])
  assert.deepEqual(await widths(merged), [100, 200, 1000, 2000, 3000])
  const single = await numberedDocument(1)
  await assert.rejects(() => tools.mergePdfs(PDFLib, [{ bytes: single }]), /at least two/)
})

test("arrange reorders, deletes, duplicates and rotates pages", async () => {
  const source = await numberedDocument(4)
  const out = await tools.arrangePages(PDFLib, source, [{ from: 3, rotate: 0 }, { from: 0, rotate: 90 }, { from: 0, rotate: 0 }])
  assert.deepEqual(await widths(out), [400, 100, 100])
  const doc = await PDFLib.PDFDocument.load(out)
  assert.deepEqual(doc.getPages().map(page => page.getRotation().angle), [0, 90, 0])
  await assert.rejects(() => tools.arrangePages(PDFLib, source, []), /at least one page/)
})

test("split by ranges, every N pages and one file per page", async () => {
  const source = await numberedDocument(5)
  const ranges = await tools.splitPdf(PDFLib, source, { mode: "ranges", ranges: "1-2, 5", baseName: "doc" })
  assert.deepEqual(ranges.map(file => file.name), ["doc-pages-1-2.pdf", "doc-page-5.pdf"])
  assert.deepEqual(await widths(ranges[0].bytes), [100, 200])
  const every = await tools.splitPdf(PDFLib, source, { mode: "every", count: 2 })
  assert.deepEqual(await Promise.all(every.map(async file => (await widths(file.bytes)).length)), [2, 2, 1])
  const each = await tools.splitPdf(PDFLib, source, { mode: "each" })
  assert.equal(each.length, 5)
})

test("images become pages, and a non-image is refused", async () => {
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64"))
  const a4 = await tools.imagesToPdf(PDFLib, [{ bytes: png }, { bytes: png }], { pageSize: "a4" })
  assert.deepEqual((await widths(a4)).map(Math.round), [595, 595])
  const fit = await tools.imagesToPdf(PDFLib, [{ bytes: png }], { pageSize: "fit" })
  assert.deepEqual((await widths(fit)).map(Math.round), [10])
  await assert.rejects(() => tools.imagesToPdf(PDFLib, [{ bytes: new Uint8Array([1, 2, 3]) }]), /not a JPEG or PNG/)
})

test("protect encrypts, the wrong password is refused, unlock removes the encryption", async () => {
  const source = await numberedDocument(2)
  const locked = await tools.protectPdf(PDFLib, source, { userPassword: "open-sesame", ownerPassword: "owner" })
  await assert.rejects(() => tools.describePdf(PDFLib, locked), error => error.code === "password-required")
  await assert.rejects(() => tools.unlockPdf(PDFLib, locked, "nope"), error => error.code === "password-required" && /not correct/.test(error.message))
  const unlocked = await tools.unlockPdf(PDFLib, locked, "open-sesame")
  assert.deepEqual(await widths(unlocked), [100, 200], "opens with no password and keeps its pages")
  await assert.rejects(() => tools.protectPdf(PDFLib, source, {}), /Enter a password/)
})

test("watermark and page numbers draw real, extractable text with unicode support", async () => {
  const source = await numberedDocument(3, 300)
  const marked = await tools.addWatermark(PDFLib, fontkit, source, { text: "CONFIDENTIAL ₹", opacity: 0.3, rotation: 45, pages: "1,3" })
  const watermarkTexts = await pageTexts(marked)
  assert.ok(watermarkTexts[0].includes("CONFIDENTIAL") && watermarkTexts[2].includes("CONFIDENTIAL"))
  assert.equal(watermarkTexts[1], "", "pages outside the range are untouched")

  const numbered = await tools.addPageNumbers(PDFLib, fontkit, source, { format: "Page {n} of {total}", position: "bottom-right", start: 5, skipFirst: true })
  const numberTexts = await pageTexts(numbered)
  assert.equal(numberTexts[0], "")
  assert.equal(numberTexts[1].trim(), "Page 5 of 3")
  assert.equal(numberTexts[2].trim(), "Page 6 of 3")
  await assert.rejects(() => tools.addWatermark(PDFLib, fontkit, source, { text: "  " }), /Enter the watermark text/)
})

test("metadata, crop and optimize", async () => {
  const source = await numberedDocument(2, 300)
  const described = await tools.describePdf(PDFLib, await tools.setMetadata(PDFLib, source, { title: "Quarterly", author: "Ada", subject: "S", keywords: "a, b" }))
  assert.equal(described.title, "Quarterly")
  assert.equal(described.author, "Ada")
  assert.ok(described.keywords.includes("a"))
  const cropped = await PDFLib.PDFDocument.load(await tools.cropPages(PDFLib, source, { top: 10, bottom: 10, left: 20, right: 20, pages: "1" }))
  assert.deepEqual([cropped.getPage(0).getWidth(), cropped.getPage(0).getHeight(), cropped.getPage(1).getWidth()], [260, 380, 600])
  await assert.rejects(() => tools.cropPages(PDFLib, source, { left: 200, right: 200 }), /too small/)
  const optimized = await tools.optimizePdf(PDFLib, source)
  assert.equal((await widths(optimized)).length, 2)
  assert.ok(optimized.length <= source.length)
})

test("zip files are valid: signatures, sizes, CRCs and contents round-trip", () => {
  const files = [
    { name: "a.txt", bytes: new TextEncoder().encode("hello zip") },
    { name: "folder/b.bin", bytes: Uint8Array.from({ length: 300 }, (_, i) => i % 251) },
  ]
  const zip = Buffer.from(tools.createZip(files))
  const endOffset = zip.length - 22
  assert.equal(zip.readUInt32LE(endOffset), 0x06054b50)
  assert.equal(zip.readUInt16LE(endOffset + 10), 2)
  let cursor = zip.readUInt32LE(endOffset + 16)
  for (const file of files) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50)
    const crc = zip.readUInt32LE(cursor + 16)
    const size = zip.readUInt32LE(cursor + 20)
    const nameLength = zip.readUInt16LE(cursor + 28)
    const localOffset = zip.readUInt32LE(cursor + 42)
    assert.equal(zip.toString("utf8", cursor + 46, cursor + 46 + nameLength), file.name)
    assert.equal(size, file.bytes.length)
    assert.equal(zip.readUInt32LE(localOffset), 0x04034b50)
    const dataStart = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28)
    const data = zip.subarray(dataStart, dataStart + size)
    assert.deepEqual(Uint8Array.from(data), file.bytes)
    if (typeof zlib.crc32 === "function") assert.equal(zlib.crc32(data) >>> 0, crc)
    cursor += 46 + nameLength
  }
})

test("page ranges treat spaces around a dash as part of the range", () => {
  assert.deepEqual(tools.parsePageRanges("1 - 3", 5), [[0, 1, 2]])
  assert.deepEqual(tools.parsePageRanges("1 - 2, 4 -", 5), [[0, 1], [3, 4]])
  assert.throws(() => tools.parsePageRanges("-", 5), /not a page or range/)
})

test("numbers, watermarks and crops follow the page as displayed, even when the page is rotated", async () => {
  const doc = await PDFLib.PDFDocument.create()
  const page = doc.addPage([400, 300])
  page.setRotation(PDFLib.degrees(90))
  const source = await doc.save()

  // Displayed upright the page is 300 wide and 400 tall; "bottom-right" must be its lower-right corner.
  const numbered = await tools.addPageNumbers(PDFLib, fontkit, source, { format: "7", position: "bottom-right", margin: 20, size: 10 })
  const document = await pdfjs.getDocument({ data: new Uint8Array(numbered), verbosity: 0 }).promise
  const viewport = (await document.getPage(1)).getViewport({ scale: 1 })
  assert.deepEqual([viewport.width, viewport.height], [300, 400])
  const item = (await (await document.getPage(1)).getTextContent()).items[0]
  const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5])
  assert.ok(x > 250 && x < 285, `number sits at the right edge as displayed (x=${x})`)
  assert.ok(y > 365 && y < 385, `number sits at the bottom as displayed (y=${y})`)
  const onScreen = pdfjs.Util.transform(viewport.transform, item.transform)
  assert.ok(Math.abs(onScreen[1]) < 1e-6 && Math.abs(onScreen[2]) < 1e-6 && onScreen[0] > 0, "and is upright and unmirrored on screen")

  // Cropping 50pt off the displayed top removes it from the displayed height.
  const cropped = await PDFLib.PDFDocument.load(await tools.cropPages(PDFLib, source, { top: 50 }))
  const box = cropped.getPage(0).getCropBox()
  assert.deepEqual([Math.round(box.width), Math.round(box.height)], [350, 300], "the 400pt-wide edge shrinks by the displayed top margin")
})

test("file names built from user input cannot escape a zip or inject path characters", async () => {
  for (const hostile of ["../../etc/passwd", "a/b\\c.pdf", "..hidden", "bad:name?.pdf", ""]) {
    const cleaned = tools.safeFileName(hostile)
    assert.ok(!/[\\/:*?"<>|]/.test(cleaned) && !cleaned.startsWith("."), `${JSON.stringify(hostile)} -> ${JSON.stringify(cleaned)}`)
  }
  const files = await tools.splitPdf(PDFLib, await numberedDocument(2), { mode: "each", baseName: "../up/../x" })
  assert.ok(files.every(file => !file.name.includes("/") && !file.name.startsWith(".")))
})
