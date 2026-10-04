# Antigravity PDF Studio

Privacy-first browser PDF editor with WebGPU presentation, OPFS persistence,
worker-based document search, and local editing tools.

## Run locally

```bash
npm start
```

Open `http://127.0.0.1:4173`.

There are no runtime or test-package dependencies to install. The local Node.js
server uses only built-in modules.

## Deploy to Vercel

```bash
npm run build
```

Import the repository into Vercel and deploy it. `vercel.json` configures the
dependency-free build, publishes `dist/`, and applies the isolation and security
headers required by the editor. No dashboard overrides are required.

The resulting deployment contains only `index.html`, `css/`, and `js/`.
`server.js` is for local use and is excluded from the Vercel upload.

For a local production-style server instead, run:

```bash
npm run start:prod
```

Set `HOST` and `PORT` to override its default bind address and port.

## Verification

```bash
npm run check
npm run build
```

PDF contents remain in the browser. The application does not upload opened
documents to an application server.
