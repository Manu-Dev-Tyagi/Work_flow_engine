import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = {
  statusCode: number
}

type Input = {
  body: Record<string, unknown>
}

type Output = Record<string, never>

export const httpRespondDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.HttpRespond,
  label: 'HTTP Respond',
  configurationSchema: {
    statusCode: PortType.Number,
  },
  inputSchema: {
    body: PortType.Object,
  },
  outputSchema: {},
  execute: ({ configuration, input, run }) => {
    if (!run?.setHttpResponse) {
      throw new Error('HTTP Respond: no HTTP run context (use Run with trigger JSON or API)')
    }
    const body = input.body
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('HTTP Respond: body input must be an object')
    }
    const status = Number(configuration.statusCode ?? 200)
    run.setHttpResponse({
      status: Number.isFinite(status) ? status : 200,
      body,
    })
    return {}
  },
}
