import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import { asJsonString, getByPath } from '../utilities/jsonPath'

type Config = {
  /** JSON used when Run has no trigger payload (canvas / toolbar testing). */
  sampleBody: string
  /** Dot-path into the body for Find Event Container matchValue (default: contactNumber). */
  matchField: string
}

type Input = Record<string, never>

type Output = {
  body: Record<string, unknown>
  matchValue: string
}

function parseSampleBody(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  if (!trimmed) return {}
  const parsed = JSON.parse(trimmed) as unknown
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('API Request: sampleBody must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

/**
 * Inbound HTTP / webhook payload for workflow runs.
 * Outputs the full JSON body plus matchValue for container lookup.
 */
export const apiRequestDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.ApiRequest,
  label: 'API Request',
  configurationSchema: {
    sampleBody: PortType.String,
    matchField: PortType.String,
  },
  inputSchema: {},
  outputSchema: {
    body: PortType.Object,
    matchValue: PortType.String,
  },
  execute: ({ configuration, run }) => {
    const body = run?.triggerPayload ?? parseSampleBody(String(configuration.sampleBody ?? '{}'))
    const matchField = String(configuration.matchField ?? 'contactNumber').trim() || 'contactNumber'
    return {
      body,
      matchValue: asJsonString(getByPath(body, matchField)),
    }
  },
}
