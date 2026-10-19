// Browser tests: drive the real editor with Playwright and check the PDFs it saves.
//
// They need a Chromium. Set PDFSTUDIO_BROWSER to a Chrome/Chromium executable, or install one with
// `npx playwright install chromium`. With no browser available the whole file is skipped.
import test, { before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"
import * as PDFLib from "@cantoo/pdf-lib"
import { setPdfLib, analyzePage } from "../js/pdf-content.js"
import PDFKit from "pdfkit"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import { createServer } from "../../scripts/serve-pdfstudio.mjs"

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pdfstudio-e2e-"))
let browser
let server
let baseUrl
let skipReason = null
const fixtures = {}

async function launchBrowser() {
  const attempts = [
    () => chromium.launch({ executablePath: process.env.PDFSTUDIO_BROWSER }),
    () => chromium.launch(),
    () => chromium.launch({ channel: "chrome" }),
  ]
  for (const [index, attempt] of attempts.entries()) {
    if (index === 0 && !process.env.PDFSTUDIO_BROWSER) continue
    try { return await attempt() } catch { /* try the next one */ }
  }
  return null
}

const write = (name, bytes) => { const file = path.join(temporary, name); fs.writeFileSync(file, bytes); return file }

async function pdfkitDocument(draw) {
  return new Promise(resolve => {
    const chunks = []
    const doc = new PDFKit({ size: "A4", compress: false })
    doc.on("data", chunk => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    draw(doc)
    doc.end()
  })
}

before(async () => {
  browser = await launchBrowser()
  if (!browser) { skipReason = "no Chromium available (set PDFSTUDIO_BROWSER or run `npx playwright install chromium`)"; return }
  server = createServer()
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}/`

  // Plain document with standard fonts.
  const plain = await PDFLib.PDFDocument.create()
  const regular = await plain.embedFont(PDFLib.StandardFonts.Helvetica)
  const bold = await plain.embedFont(PDFLib.StandardFonts.HelveticaBold)
  for (let i = 1; i <= 3; i++) {
    const page = plain.addPage([595, 842])
    page.drawText(`Sample page ${i}`, { x: 50, y: 780, size: 24, font: bold })
    page.drawText("The quick brown fox jumps over the lazy dog.", { x: 50, y: 740, size: 14, font: regular })
    page.drawText("Invoice total: $1,250.00", { x: 50, y: 710, size: 14, font: regular })
  }
  fixtures.plain = write("plain.pdf", await plain.save())

  // Pages with their own /Rotate.
  const rotated = await PDFLib.PDFDocument.create()
  const rotatedFont = await rotated.embedFont(PDFLib.StandardFonts.Helvetica)
  const sideways = rotated.addPage([400, 300])
  sideways.setRotation(PDFLib.degrees(90))
  sideways.drawText("Rotated page", { x: 40, y: 240, size: 22, font: rotatedFont })
  fixtures.rotated = write("rotated.pdf", await rotated.save())

  // A document printed by Chrome itself: mixed styles, an image, and characters beyond ASCII.
  const printer = await browser.newPage()
  await printer.setContent(`<body style="font-family:Georgia,serif;padding:40px"><h1 style="color:#c0392b">Quarterly Report</h1>
    <p>Revenue grew by <b>12.5%</b> compared to the previous quarter, driven by <i>strong</i> demand.</p>
    <table border=1 cellpadding=6><tr><td>Item</td><td>₹ 1,250.00</td></tr></table>
    <img width=80 height=80 src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"></body>`)
  fixtures.printed = write("printed.pdf", Buffer.from(await printer.pdf({ format: "A4" })))
  await printer.close()

  fixtures.kerned = write("kerned.pdf", await pdfkitDocument(doc => doc.font("Helvetica-Bold").fontSize(24).text("Invoice #1042", 50, 60)))
})

after(async () => {
  await browser?.close()
  server?.close()
  fs.rmSync(temporary, { recursive: true, force: true })
})

async function openEditor(file, viewport = { width: 1500, height: 950 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true })
  const page = await context.newPage()
  const problems = []
  page.on("pageerror", error => problems.push(error.message))
  await page.goto(baseUrl)
  await page.setInputFiles("input[type=file]", file)
  await page.waitForSelector(".pdf-run, .pdf-image", { timeout: 30000 })
  await page.waitForTimeout(1200)
  return { page, context, problems }
}

async function saveWith(page) {
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#save-btn")])
  const file = path.join(temporary, `out-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`)
  await download.saveAs(file)
  return fs.readFileSync(file)
}

// Text per page in reading order (top to bottom, left to right), not drawing order: a surgical edit
// draws its replacement at the end of the page's instructions, but it sits where the old text was.
async function textOf(bytes) {
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise
  const pages = []
  for (let i = 1; i <= document.numPages; i++) {
    const items = (await (await document.getPage(i)).getTextContent()).items.filter(item => item.str.trim())
    items.sort((a, b) => (Math.abs(a.transform[5] - b.transform[5]) > 3 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]))
    pages.push(items.map(item => item.str).join(" "))
  }
  return pages
}
const squash = text => text.replace(/\s+/g, "")

const runBox = (page, index) => page.locator(".pdf-run").nth(index).boundingBox()
const drag = async (page, x0, y0, x1, y1) => {
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  await page.mouse.move(x1, y1, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(250)
}
const skipIfNoBrowser = t => { if (skipReason) { t.skip(skipReason); return true } return false }

test("clicking text edits it in place and the original is removed from the saved file", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context, problems } = await openEditor(fixtures.plain)
  const box = await runBox(page, 1)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("A completely different sentence.")
  await page.keyboard.press("Enter")
  const [first] = await textOf(await saveWith(page))
  assert.ok(first.includes("A completely different sentence"))
  assert.ok(!first.includes("quick brown"), "the replaced text must be gone from the file, not just covered")
  assert.ok(first.includes("Invoice total"), "other lines are untouched")
  assert.deepEqual(problems, [])
  await context.close()
})

test("a one-character change keeps the surrounding bold and italic of a mixed-style line", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.printed)
  const paragraph = await runBox(page, 1)
  await page.mouse.click(paragraph.x + 20, paragraph.y + paragraph.height / 2)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("Revenue grew by 42.5% compared to the previous quarter, driven by strong demand.")
  await page.keyboard.press("Enter")
  const output = await saveWith(page)
  const [text] = await textOf(output)
  assert.ok(squash(text).includes("Revenuegrewby42.5%comparedtothepreviousquarter,drivenbystrongdemand."), `got: ${text}`)
  assert.ok(!squash(text).includes("12.5%"))
  // Surgical editing leaves the original glyph runs alone: the line is not one re-typeset block.
  const document = await pdfjs.getDocument({ data: new Uint8Array(output), verbosity: 0 }).promise
  const items = (await (await document.getPage(1)).getTextContent()).items.filter(item => item.str.trim())
  const fonts = new Set(items.map(item => item.fontName))
  assert.ok(fonts.size >= 3, "bold, italic and regular glyph runs are still separate fonts")
  await context.close()
})

test("dragging moves a line, and undo and redo restore it", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.plain)
  const before = await runBox(page, 2)
  await drag(page, before.x + 30, before.y + before.height / 2, before.x + 130, before.y + 110)
  const moved = await runBox(page, 2)
  assert.ok(Math.abs(moved.x - before.x - 100) < 3 && moved.y > before.y + 80)
  await page.click("#tool-undo")
  await page.waitForTimeout(700)
  assert.ok(Math.abs((await runBox(page, 2)).x - before.x) < 2)
  await page.click("[data-tool=redo]")
  await page.waitForTimeout(700)
  assert.ok(Math.abs((await runBox(page, 2)).x - moved.x) < 2)
  await context.close()
})

test("images can be selected, moved and deleted", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.printed)
  const image = page.locator(".pdf-image").first()
  const start = await image.boundingBox()
  await drag(page, start.x + start.width / 2, start.y + start.height / 2, start.x + start.width / 2 + 120, start.y + start.height / 2 + 30)
  const moved = await image.boundingBox()
  assert.ok(Math.abs(moved.x - start.x - 120) < 3)
  await page.click(".ot-delete")
  const bytes = await saveWith(page)
  const analysis = await PDFLib.PDFDocument.load(bytes)
  assert.equal(analysis.getPageCount(), 1)
  await context.close()
})

test("pages rotated in the file display rotated", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.rotated)
  const size = await page.$eval("#pdf-canvas", canvas => [canvas.width, canvas.height])
  assert.ok(size[1] > size[0], "a landscape page with /Rotate 90 is shown portrait")
  await context.close()
})

test("links, comments and form fields reach the saved PDF as real annotations and fields", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.plain)
  const wrapper = await page.locator("#pdf-page-wrapper").boundingBox()
  await page.click("#tool-links")
  await page.mouse.click(wrapper.x + wrapper.width * 0.6, wrapper.y + wrapper.height * 0.4)
  await page.fill("#link-text", "Visit Ambixous")
  await page.fill("#link-url", "https://ambixous.in")
  await page.click("#link-apply")
  await page.click("#tool-annotate")
  await page.click("#dropdown-annotate [data-action=comment]")
  await page.mouse.click(wrapper.x + wrapper.width * 0.8, wrapper.y + wrapper.height * 0.5)
  await page.fill("#comment-text", "Please review")
  await page.click("#comment-apply")
  await page.click("#tool-forms")
  await page.click("#dropdown-forms [data-action=checkbox]")
  await page.mouse.click(wrapper.x + wrapper.width * 0.3, wrapper.y + wrapper.height * 0.6)
  const saved = await PDFLib.PDFDocument.load(await saveWith(page))
  const annotations = saved.getPage(0).node.Annots()
  const kinds = Array.from({ length: annotations.size() }, (_, i) => saved.context.lookup(annotations.get(i)).get(PDFLib.PDFName.of("Subtype")).toString())
  assert.ok(kinds.includes("/Link") && kinds.includes("/Text") && kinds.includes("/Widget"), `got ${kinds}`)
  assert.equal(saved.getForm().getFields().length, 1)
  await context.close()
})

test("whiteout erases the text under it and redaction removes what it touches", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.plain)
  const lines = await page.$$eval(".pdf-run", elements => elements.map(element => element.getBoundingClientRect().toJSON()))
  await page.click("#tool-whiteout")
  await drag(page, lines[2].x - 6, lines[2].y - 4, lines[2].x + lines[2].width + 6, lines[2].y + lines[2].height + 4)
  await page.click("#whiteout-mode [data-mode=redact]")
  await drag(page, lines[1].x + lines[1].width * 0.35, lines[1].y - 2, lines[1].x + lines[1].width * 0.62, lines[1].y + lines[1].height + 2)
  const [first] = await textOf(await saveWith(page))
  assert.ok(!first.includes("Invoice"), "whiteout removed the line beneath it")
  assert.ok(!first.includes("fox jumps"), "redaction removed the words it touched")
  assert.ok(first.includes("Sample page 1"))
  await context.close()
})

test("tools: merge on the landing page, then organize the open document with its edits included", async t => {
  if (skipIfNoBrowser(t)) return
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true })
  const page = await context.newPage()
  await page.goto(baseUrl)
  await page.click("#landing-tools .tool-card:has-text('Merge PDFs')")
  await page.setInputFiles(".tools-panel input[type=file][multiple]", [fixtures.plain, fixtures.rotated])
  await page.waitForSelector(".tools-row")
  await page.click(".tools-run")
  await page.waitForSelector(".tools-results")
  const [merged] = await Promise.all([page.waitForEvent("download"), page.click(".tools-results .btn-primary")])
  const mergedFile = path.join(temporary, "merged.pdf")
  await merged.saveAs(mergedFile)
  assert.equal((await PDFLib.PDFDocument.load(fs.readFileSync(mergedFile))).getPageCount(), 4)
  await page.keyboard.press("Escape")

  await page.setInputFiles("input[type=file]", fixtures.plain)
  await page.waitForSelector(".pdf-run")
  await page.waitForTimeout(1000)
  const box = await runBox(page, 1)
  await page.mouse.click(box.x + 10, box.y + box.height / 2)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("EDITED FIRST")
  await page.keyboard.press("Enter")
  await page.click("#open-tools")
  await page.waitForSelector(".tools-page", { timeout: 20000 })
  assert.equal(await page.$$eval(".tools-page", cards => cards.length), 3)
  await page.locator(".tools-page").nth(2).locator("button[aria-label='Delete page']").click()
  await page.click(".tools-run")
  await page.waitForSelector(".tools-results")
  const [organized] = await Promise.all([page.waitForEvent("download"), page.click(".tools-results .btn-primary")])
  const organizedFile = path.join(temporary, "organized.pdf")
  await organized.saveAs(organizedFile)
  const pages = await textOf(fs.readFileSync(organizedFile))
  assert.equal(pages.length, 2)
  assert.ok(pages[0].includes("EDITED FIRST"), "the pending edit made it into the tool's input")
  await context.close()
})

test("undo and redo after zooming keep added elements aligned with the page", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.plain)
  const wrapper = await page.locator("#pdf-page-wrapper").boundingBox()
  await page.click("#tool-shapes")
  await drag(page, wrapper.x + 100, wrapper.y + 300, wrapper.x + 300, wrapper.y + 400)
  const shape = page.locator(".edit-element svg").first()
  const before = await shape.boundingBox()
  await page.click("#zoom-in")
  await page.waitForTimeout(1200)
  const zoomed = await shape.boundingBox()
  const factor = zoomed.width / before.width
  assert.ok(factor > 1.1, `zooming in scales the shape (x${factor.toFixed(2)})`)
  await page.click("#tool-undo")
  await page.waitForTimeout(800)
  assert.equal(await page.$$eval(".edit-element svg", shapes => shapes.length), 0)
  await page.click("[data-tool=redo]")
  await page.waitForTimeout(800)
  const restored = await page.locator(".edit-element svg").first().boundingBox()
  assert.ok(Math.abs(restored.width - zoomed.width) < 2, `redo restores the size for the current zoom (${restored.width} vs ${zoomed.width})`)
  await context.close()
})

test("an image type PDF cannot embed directly (SVG) is converted and still saved", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.plain)
  const svg = write("logo.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#e8742f"/></svg>`)
  await page.setInputFiles("#image-upload-input", svg)
  await page.waitForSelector(".edit-element .edit-image")
  const saved = await PDFLib.PDFDocument.load(await saveWith(page))
  setPdfLib(PDFLib)
  const analysis = await analyzePage(saved, 0)
  assert.equal(analysis.images.length, 1, "the converted image is in the saved page")
  await context.close()
})

test("shapes and rules can be selected and deleted too", async t => {
  if (skipIfNoBrowser(t)) return
  const { page, context } = await openEditor(fixtures.printed)
  setPdfLib(PDFLib)
  const originalPaths = (await analyzePage(await PDFLib.PDFDocument.load(fs.readFileSync(fixtures.printed)), 0)).images.filter(object => object.kind === "path").length
  const shapes = await page.$$eval(".pdf-vector", elements => elements.map(element => element.getBoundingClientRect().toJSON()))
  assert.ok(shapes.length >= 4, "the table borders are selectable shapes")
  const biggest = shapes.sort((a, b) => b.width * b.height - a.width * a.height)[0]
  await page.mouse.click(biggest.x + biggest.width / 2, biggest.y + 3)
  assert.equal(await page.textContent(".ot-label"), "Shape")
  await page.click(".ot-delete")
  const saved = await PDFLib.PDFDocument.load(await saveWith(page))
  const remaining = (await analyzePage(saved, 0)).images.filter(object => object.kind === "path").length
  assert.equal(remaining, originalPaths - 1, "exactly the deleted shape is gone from the file")
  assert.ok((await textOf(await saved.save())).join(" ").includes("Quarterly Report"), "text is untouched")
  await context.close()
})
