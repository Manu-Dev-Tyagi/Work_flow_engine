import type { IncomingMessage, ServerResponse } from 'node:http'
import { getVestaBaseUrl } from './lib/vestaBaseUrl'
import { readBody } from './lib/readBody'

const API_PREFIX = '/api/vesta'
const PLUTO_PREFIX = '/sub-system/pluto'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.url ?? '/', `http://${host}`)
  if (!url.pathname.startsWith(API_PREFIX)) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const plutoPath = url.pathname.slice(API_PREFIX.length) || '/'
  const upstream = `${getVestaBaseUrl()}${PLUTO_PREFIX}${plutoPath}${url.search}`

  const response = await fetch(upstream, {
    method: req.method,
    headers: {
      Authorization: String(req.headers.authorization ?? ''),
      'Content-Type': 'application/json',
      'X-Workspace-Id': String(req.headers['x-workspace-id'] ?? ''),
    },
    body: req.method === 'POST' ? await readBody(req) : undefined,
  })

  const text = await response.text()
  res.statusCode = response.status
  res.setHeader('content-type', response.headers.get('content-type') ?? 'application/json')
  res.end(text)
}
