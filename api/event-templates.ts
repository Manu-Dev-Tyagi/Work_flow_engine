import type { IncomingMessage, ServerResponse } from 'node:http'

const UPSTREAM =
  'https://dev.intellsys.ai/sub-system/pluto/ottopilot/event-templates/get'

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString() || '{}'
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  const response = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {
      Authorization: String(req.headers.authorization ?? ''),
      'Content-Type': 'application/json',
      'X-Workspace-Id': String(req.headers['x-workspace-id'] ?? ''),
    },
    body: await readBody(req),
  })

  const text = await response.text()
  res.statusCode = response.status
  res.setHeader('content-type', response.headers.get('content-type') ?? 'application/json')
  res.end(text)
}
