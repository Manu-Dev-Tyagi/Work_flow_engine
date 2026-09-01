export const config = { runtime: 'edge' }

const UPSTREAM = 'https://dev.intellsys.ai'

function upstreamUrl(request: Request): string {
  const incoming = new URL(request.url)
  const pathname = incoming.pathname.replace(/^\/api/, '')
  const path = pathname.startsWith('/sub-system') ? pathname : `/sub-system${pathname}`
  return `${UPSTREAM}${path}${incoming.search}`
}

export default async function handler(request: Request): Promise<Response> {
  const headers = new Headers()
  for (const name of ['authorization', 'content-type', 'x-workspace-id', 'accept']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const method = request.method.toUpperCase()
  const response = await fetch(upstreamUrl(request), {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}
