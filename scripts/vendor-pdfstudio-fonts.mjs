// Vendors the fonts PDF Studio uses for newly typed text into pdfstudio/fonts/.
//
// Arimo, Tinos and Cousine are metric-compatible with Helvetica/Arial, Times and
// Courier (SIL OFL 1.1). They come from the @fontsource packages as WOFF, but the
// PDF embedder needs plain TrueType to subset them, so each file is unwrapped here.
//
//   npm i --no-save @fontsource/arimo @fontsource/tinos @fontsource/cousine
//   node scripts/vendor-pdfstudio-fonts.mjs [path/to/node_modules]
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { fileURLToPath } from "node:url"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const modulesRoot = path.resolve(process.argv[2] || path.join(projectRoot, "node_modules"))
const outputDirectory = path.join(projectRoot, "pdfstudio", "fonts")

const families = ["arimo", "tinos", "cousine"]
const subsets = ["latin", "latin-ext"]
const styles = [
  ["400", "normal"],
  ["700", "normal"],
  ["400", "italic"],
  ["700", "italic"],
]

function woffToSfnt(woff) {
  if (woff.toString("latin1", 0, 4) !== "wOFF") throw new Error("not a WOFF file")
  const flavor = woff.readUInt32BE(4)
  const tableCount = woff.readUInt16BE(12)
  const tables = []
  for (let index = 0; index < tableCount; index++) {
    const entry = 44 + index * 20
    const offset = woff.readUInt32BE(entry + 4)
    const compressedLength = woff.readUInt32BE(entry + 8)
    const originalLength = woff.readUInt32BE(entry + 12)
    const raw = woff.subarray(offset, offset + compressedLength)
    tables.push({
      tag: woff.subarray(entry, entry + 4),
      checksum: woff.readUInt32BE(entry + 16),
      data: compressedLength < originalLength ? zlib.inflateSync(raw) : raw,
    })
  }
  const directoryLength = 12 + tableCount * 16
  let cursor = directoryLength
  tables.forEach(table => {
    table.offset = cursor
    cursor += (table.data.length + 3) & ~3
  })
  const sfnt = Buffer.alloc(cursor)
  let searchRange = 1
  let entrySelector = 0
  while (searchRange * 2 <= tableCount) { searchRange *= 2; entrySelector++ }
  sfnt.writeUInt32BE(flavor, 0)
  sfnt.writeUInt16BE(tableCount, 4)
  sfnt.writeUInt16BE(searchRange * 16, 6)
  sfnt.writeUInt16BE(entrySelector, 8)
  sfnt.writeUInt16BE(tableCount * 16 - searchRange * 16, 10)
  tables.forEach((table, index) => {
    const entry = 12 + index * 16
    table.tag.copy(sfnt, entry)
    sfnt.writeUInt32BE(table.checksum, entry + 4)
    sfnt.writeUInt32BE(table.offset, entry + 8)
    sfnt.writeUInt32BE(table.data.length, entry + 12)
    table.data.copy(sfnt, table.offset)
  })
  return sfnt
}

fs.mkdirSync(outputDirectory, { recursive: true })
let count = 0
for (const family of families) {
  const packageDirectory = path.join(modulesRoot, "@fontsource", family)
  for (const subset of subsets) {
    for (const [weight, style] of styles) {
      const source = path.join(packageDirectory, "files", `${family}-${subset}-${weight}-${style}.woff`)
      const target = path.join(outputDirectory, `${family}-${subset}-${weight}-${style}.ttf`)
      fs.writeFileSync(target, woffToSfnt(fs.readFileSync(source)))
      count++
    }
  }
  fs.copyFileSync(path.join(packageDirectory, "LICENSE"), path.join(outputDirectory, `LICENSE-${family}.txt`))
}
console.log(`Wrote ${count} fonts to ${outputDirectory}`)
