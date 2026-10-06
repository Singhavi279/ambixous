import type { NextRequest } from "next/server"
import type { AddressInfo } from "node:net"

// Invoxa's API is an Express app (invoxa/server). This route runs it inside the Next.js deployment:
// the app listens on a private loopback port and each request is forwarded to it.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

process.env.INVOXA_BASE_PATH = "/invoxa"

let serverPort: Promise<number> | undefined

function startServer(): Promise<number> {
  if (!serverPort) {
    serverPort = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { open } = require("../../../../invoxa/server/db")
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createApp } = require("../../../../invoxa/server/index")
      const app = createApp(await open())
      return new Promise<number>((resolve, reject) => {
        const server = app.listen(0, "127.0.0.1", () => resolve((server.address() as AddressInfo).port))
        server.once("error", reject)
      })
    })()
    serverPort.catch(() => {
      serverPort = undefined
    })
  }
  return serverPort
}

async function handle(request: NextRequest): Promise<Response> {
  let port: number
  try {
    port = await startServer()
  } catch (error) {
    console.error("Invoxa failed to start", error)
    return Response.json({ error: "The app could not start. Please try again in a minute." }, { status: 500 })
  }

  const url = new URL(request.url)
  const target = `http://127.0.0.1:${port}${url.pathname.replace(/^\/invoxa/, "")}${url.search}`
  const headers = new Headers()
  for (const name of ["cookie", "content-type", "authorization", "accept", "x-forwarded-for"]) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  })

  const out = new Headers()
  for (const name of ["content-type", "content-disposition", "location", "cache-control"]) {
    const value = upstream.headers.get(name)
    if (value) out.set(name, value)
  }
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie)
  out.set("x-robots-tag", "noindex")
  return new Response(upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: out,
  })
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE }
