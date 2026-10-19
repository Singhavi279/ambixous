# PDF Studio

A free, private PDF editor and toolkit that runs entirely in the browser. Nothing is uploaded: files are
read, edited and saved on your own device. Live at <https://ambixous.in/pdfstudio>.

## What it does

**Edit what is already in the PDF**
- Click any line of text to edit it in place, drag it to move it, press Delete to remove it.
- Edits are surgical. Characters you did not touch keep their original font, kerning and colour; only the
  changed characters are replaced, and the rest of the line shifts to follow.
- The original text is removed from the file, not painted over. Anything that cannot be removed safely
  falls back to a cover, and you are told when that happens.
- Existing images, shapes, rules and text-free logos can be selected, moved, resized and deleted.
- Whiteout erases the text underneath. Redact blacks out and permanently removes text and images (pages
  where something cannot be removed are flattened to a picture so nothing can be recovered).

**Add to the PDF**
- Text (bundled sans, serif and mono fonts, full Latin and Latin-extended including ₹ and €),
  signatures (drawn, typed, uploaded), images, shapes, highlights, freehand drawing.
- Links (real URI annotations), comments (real note annotations), form fields (real AcroForm fields).
- Pages that are rotated in the original file display and export correctly.

**Document tools** (open from the Tools button, or from the landing page)
Merge, split, organize pages (reorder, rotate, duplicate, delete, extract), crop, images to PDF,
PDF to images, password protect (AES-256), unlock, watermark, page numbers, document properties, optimize.

## How the editing works

A PDF page is a small program of drawing instructions. PDF Studio reads that program
(`js/pdf-content.js`), records where every glyph and image is drawn, and rewrites it:

| Module | Job |
| --- | --- |
| `js/pdf-content.js` | Tokenizes content streams, tracks text and graphics state, finds text and images, and removes or moves them. Anything it cannot prove it understands is flagged `unsafe` instead of edited. |
| `js/text-edit-plan.js` | Works out the smallest change for a text edit, keeps each character's original style, and decides when a line can be shifted in place. |
| `js/object-editor.js` | The interactive layer: click to edit, drag, delete, formatting bar, export phases and verification. |
| `js/elements-export.js` | Writes everything you added into the PDF, aware of page rotation. |
| `js/pdf-fonts.js` | Loads the bundled fonts for the screen and embeds them into saved files. |
| `js/pdf-tools.js`, `js/tools-ui.js` | The document tools and their dialog. |

Saving is verified: the exporter re-reads its own output and checks that each edited page holds the
original characters, minus what was replaced, plus the new text. A line that does not add up is retried
in a more cautious mode (surgical, then whole line, then cover).

### Known limits
- Editing is per line, not per paragraph. A paragraph that wraps is several lines, edited one at a time.
- Fonts with custom encodings and no width table, vertical writing, and shared form XObjects are covered
  rather than edited.
- On very busy vector pages (maps, charts) only the 300 largest shapes are selectable; page-sized backgrounds and tiny specks never are. Use the Objects tool to capture any region as a movable picture.
- New or changed characters use the bundled fonts, so they may not match an exotic original typeface.

## Develop

```bash
npm install
npm run pdfstudio        # dev server at http://127.0.0.1:4173
npm run test:pdfstudio   # engine and tools tests
npm run build            # copies the app and its libraries into public/pdfstudio, then builds the site
```

The libraries the browser loads (PDF.js, `@cantoo/pdf-lib`, `@cantoo/fontkit`, with PDF.js's standard
fonts and character maps) are copied from `node_modules` into `vendor/` by `scripts/pdfstudio-vendor.mjs`;
there are no CDN dependencies for the core. Fonts for edited text are in `fonts/` and are regenerated with
`scripts/vendor-pdfstudio-fonts.mjs`.

## Privacy

PDF contents stay in the browser. The application does not upload opened documents to a server.
Anonymous NPS responses are requested only after a successful download and stored in
`data/pdfstudionps.json` on the `pdfstudio-nps-data` branch. They contain the score, selected reason,
timestamp, page and edit counts, and feature categories. PDF contents, IP addresses and browser
identifiers are never saved.

## Licences

Arimo, Tinos and Cousine (SIL Open Font License 1.1, see `fonts/LICENSE-*.txt`), PDF.js (Apache-2.0),
pdf-lib and fontkit (MIT).
