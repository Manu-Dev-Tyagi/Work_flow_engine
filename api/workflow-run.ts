import type { IncomingMessage, ServerResponse } from 'node:http'
import { runWorkflow } from '../src/engine/runWorkflow'
import { createRegistry } from '../src/engine/registry/registry'
import { registerAll } from '../src/nodes'
import type { Graph } from '../src/engine/graph/types'
import { readBody } from './lib/readBody'

const registry = createRegistry()
registerAll(registry)

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  let payload: { graph?: Graph; trigger?: Record<string, unknown> }
  try {
    payload = JSON.parse(await readBody(req)) as { graph?: Graph; trigger?: Record<string, unknown> }
  } catch {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }))
    return
  }

  if (!payload.graph?.nodes || !payload.graph?.edges) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ success: false, error: 'Body must include graph.nodes and graph.edges' }))
    return
  }

  const ctx = await runWorkflow(payload.graph, registry, {
    triggerPayload: payload.trigger,
    stepDelayMs: 0,
  })

  if (!ctx.httpResponse) {
    res.statusCode = ctx.status === 'completed' ? 500 : 400
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        success: false,
        error: ctx.error?.message ?? 'Workflow finished without http.respond',
        status: ctx.status,
      }),
    )
    return
  }

  res.statusCode = ctx.httpResponse.status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ success: true, data: ctx.httpResponse.body }))
}
