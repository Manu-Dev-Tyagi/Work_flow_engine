import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import { asJsonString, getByPath } from '../utilities/jsonPath'

type Config = {
  /** When set, Run fetches this URL and uses the JSON response as the trigger body. */
  endpointUrl: string
  httpMethod: 'GET' | 'POST'
  /** JSON body for POST, or fallback trigger when endpointUrl is empty. */
  sampleBody: string
  /** Dot-path into the body for Find Event Container matchValue. */
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

function parseResponseBody(parsed: unknown): Record<string, unknown> {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('API Request: response must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

export async function fetchTriggerBody(
  url: string,
  method: 'GET' | 'POST',
  sampleBody: string,
): Promise<Record<string, unknown>> {
  const init: RequestInit = { method }
  if (method === 'POST') {
    const trimmed = sampleBody.trim()
    if (trimmed) {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = trimmed
    }
  }

  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error(`API Request: could not reach ${url}`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `API Request failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const parsed = (await response.json()) as unknown
  return parseResponseBody(parsed)
}

/**
 * Inbound HTTP / webhook trigger. Outputs body + matchValue for downstream Vesta nodes.
 */
export const apiRequestDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.ApiRequest,
  label: 'API Request',
  configurationSchema: {
    endpointUrl: PortType.String,
    httpMethod: PortType.String,
    sampleBody: PortType.String,
    matchField: PortType.String,
  },
  inputSchema: {},
  outputSchema: {
    body: PortType.Object,
    matchValue: PortType.String,
  },
  execute: async ({ configuration, run }) => {
    const endpointUrl = String(configuration.endpointUrl ?? '').trim()
    const httpMethod =
      String(configuration.httpMethod ?? 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET'
    const matchField = String(configuration.matchField ?? 'contactNumber').trim() || 'contactNumber'

    let body: Record<string, unknown>
    if (run?.triggerPayload) {
      body = run.triggerPayload
    } else if (endpointUrl) {
      body = await fetchTriggerBody(
        endpointUrl,
        httpMethod,
        String(configuration.sampleBody ?? ''),
      )
    } else {
      body = parseSampleBody(String(configuration.sampleBody ?? '{}'))
    }

    return {
      body,
      matchValue: asJsonString(getByPath(body, matchField)),
    }
  },
}
