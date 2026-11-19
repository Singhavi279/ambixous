// Regression test on real-world PDFs that are NOT committed (they hold personal data).
//
//   PDFSTUDIO_REAL_PDFS="/path/a.pdf:/path/b.pdf" PDFSTUDIO_BROWSER=/path/to/chrome npm run test:pdfstudio
//
// For each file it edits one text line, deletes one image, saves, and then renders the original and the
// saved page side by side: outside the two edited spots, every pixel must match. That is the check that
// catches "the editor erased things I did not touch" (backgrounds, banners, tables, logos).
import test, { before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import { createServer } from "../../scripts/serve-pdfstudio.mjs"

const files = (process.env.PDFSTUDIO_REAL_PDFS || "").split(":").filter(f => f && fs.existsSync(f))
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pdfstudio-real-"))
let browser, server, baseUrl

before(async () => {
  if (!files.length) return
  browser = await chromium.launch(process.env.PDFSTUDIO_BROWSER ? { executablePath: process.env.PDFSTUDIO_BROWSER } : {})
  server = createServer()
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}/`
})
after(async () => { await browser?.close(); server?.close() })

async function open(file) {
  const context = await browser.newContext({ viewport: { width: 1500, height: 1100 }, acceptDownloads: true })
  const page = await context.newPage()
  const problems = []
  page.on("pageerror", error => problems.push(error.message))
  page.on("console", m => { if (process.env.PDFSTUDIO_DEBUG && /PDF Studio/.test(m.text())) console.log("  [app]", m.text()) })
  await page.goto(baseUrl)
  await page.setInputFiles("input[type=file]", file)
  await page.waitForSelector(".pdf-run, .pdf-image", { timeout: 30000 })
  await page.waitForTimeout(1500)
  return { page, context, problems }
}

/** Page 1 as drawn on the editor canvas, plus where the canvas sits on screen. */
const snapshot = page => page.evaluate(() => {
  const canvas = document.getElementById("pdf-canvas")
  const rect = canvas.getBoundingClientRect()
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
  return { width: canvas.width, height: canvas.height, left: rect.left, top: rect.top, scale: canvas.width / rect.width, data: Array.from(data) }
})

/** Page text in reading order (top to bottom, left to right) with whitespace removed, so split runs still match. */
async function pageText(bytes, n = 1) {
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise
  const items = (await (await document.getPage(n)).getTextContent()).items.filter(item => item.str.trim())
  items.sort((a, b) => (Math.abs(a.transform[5] - b.transform[5]) > 3 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4]))
  return items.map(item => item.str).join("").replace(/\s+/g, "")
}

for (const file of files.length ? files : [null]) {
  test(`real PDF ${file ? path.basename(file) : "(none configured)"}: edit + delete touch only what was edited`, async t => {
    if (!file) { t.skip("set PDFSTUDIO_REAL_PDFS to run"); return }
    const { page, context, problems } = await open(file)
    const before = await snapshot(page)

    // Pick a mid-length line of text and the most square image (QR codes, logos, icons).
    // Runs carry no text until opened, so pick a mid-width line below the page header by position.
    const runs = await page.locator(".pdf-run").evaluateAll(nodes => nodes.map((n, i) => ({ i, ...n.getBoundingClientRect().toJSON() })))
    const top = Math.min(...runs.map(r => r.top))
    const target = runs.filter(r => r.width >= 80 && r.width <= 220 && r.top > top + 100).sort((a, b) => a.top - b.top || a.left - b.left)[0]
    assert.ok(target, "found an editable line")
    const images = await page.locator(".pdf-image").evaluateAll(nodes => nodes.map((n, i) => ({ i, ...n.getBoundingClientRect().toJSON() })))
    const image = images.filter(r => r.width > 30 && r.height > 30).sort((a, b) => Math.abs(1 - a.width / a.height) - Math.abs(1 - b.width / b.height))[0]

    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
    await page.waitForTimeout(300)
    target.text = (await page.evaluate(() => document.activeElement?.innerText || document.activeElement?.value || "")).trim()
    assert.ok(target.text.length > 2, "the clicked line opened for editing")
    await page.keyboard.press("ControlOrMeta+a")
    const replacement = "Edited by regression test"
    await page.keyboard.type(replacement)
    await page.keyboard.press("Enter")
    await page.waitForTimeout(400)
    const edited = [{ ...target, width: Math.max(target.width, 260) }]
    if (image) {
      await page.locator(".pdf-image").nth(image.i).click()
      await page.click(".ot-delete")
      edited.push(image)
    }

    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 90000 }), page.click("#save-btn")])
    const output = path.join(temporary, `out-${Date.now()}.pdf`)
    await download.saveAs(output)
    const bytes = fs.readFileSync(output)
    const text = await pageText(bytes)
    const squash = value => value.replace(/\s+/g, "")
    assert.ok(text.includes(squash(replacement)), "new text is in the file")
    const count = (haystack, needle) => haystack.split(needle).length - 1
    const original = await pageText(fs.readFileSync(file))
    assert.equal(count(text, squash(target.text)), count(original, squash(target.text)) - 1, `old text "${target.text}" is gone from the file, not just covered`)

    const reopened = await open(output)
    const after = await snapshot(reopened.page)
    assert.equal(after.width, before.width, "same render size")
    // Compare every pixel outside the edited spots (padded a little for anti-aliasing).
    const pad = 6
    const masks = edited.map(r => ({
      x0: (r.x - before.left) * before.scale - pad, y0: (r.y - before.top) * before.scale - pad,
      x1: (r.x + r.width - before.left) * before.scale + pad, y1: (r.y + r.height - before.top) * before.scale + pad,
    }))
    let changed = 0
    for (let y = 0; y < before.height; y += 2) {
      for (let x = 0; x < before.width; x += 2) {
        if (masks.some(m => x >= m.x0 && x <= m.x1 && y >= m.y0 && y <= m.y1)) continue
        const i = (y * before.width + x) * 4
        if (Math.abs(before.data[i] - after.data[i]) + Math.abs(before.data[i + 1] - after.data[i + 1]) + Math.abs(before.data[i + 2] - after.data[i + 2]) > 60) changed++
      }
    }
    const sampled = (before.width / 2) * (before.height / 2)
    assert.ok(changed / sampled < 0.001, `${changed} pixels changed outside the edited spots (${(100 * changed / sampled).toFixed(2)}%)`)
    assert.deepEqual([...problems, ...reopened.problems], [])
    await context.close(); await reopened.context.close()
  })
}
