import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = {
  url: string
  /** Dot-path to a user's count after enrichment, e.g. "0.count" → 1, "2.count" → 3. */
  countPath: string
  /** Dot-path into JSON for a string field, e.g. "0.name". Empty = "". */
  namePath: string
  /** Dot-path into JSON for a string field, e.g. "0.address.city". Empty = "". */
  locPath: string
}

type Input = Record<string, never>

type Output = {
  /** Selected user's count via countPath (not array length). */
  count: number
  /** API JSON with per-user `count` (1, 2, 3, …) on every object. */
  data: Record<string, unknown> | unknown[]
  name: string
  loc: string
}

/** Add `count` (1-based index) as a key on every object in an array. */
export function addCountToEveryObject(
  data: unknown,
): Record<string, unknown> | unknown[] {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        return {
          ...(item as Record<string, unknown>),
          count: index + 1,
        }
      }
      return { value: item, count: index + 1 }
    })
  }

  if (data !== null && typeof data === 'object') {
    return { ...(data as Record<string, unknown>), count: 1 }
  }

  return { value: data, count: 1 }
}

/** Resolve "a.b.0.c" against a JSON value. */
export function getByPath(data: unknown, path: string): unknown {
  const trimmed = path.trim()
  if (!trimmed) return undefined

  let current: unknown = data
  for (const segment of trimmed.split('.')) {
    if (current === null || current === undefined) return undefined
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) return undefined
      current = current[index]
      continue
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment]
      continue
    }
    return undefined
  }
  return current
}

function asString(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

/**
 * Hits GET, adds per-user `count` on every object, projects count/name/loc via paths.
 */
export const apiRequestDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.ApiRequest,
  label: 'API Request',
  configurationSchema: {
    url: PortType.String,
    countPath: PortType.String,
    namePath: PortType.String,
    locPath: PortType.String,
  },
  inputSchema: {},
  outputSchema: {
    count: PortType.Number,
    data: PortType.Object,
    name: PortType.String,
    loc: PortType.String,
  },
  execute: async ({ configuration }) => {
    const url = configuration.url?.trim()
    if (!url) {
      throw new Error('API Request: url is required')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API Request failed: ${response.status} ${response.statusText}`)
    }

    const raw = (await response.json()) as unknown
    const data = addCountToEveryObject(raw)

    return {
      count: asNumber(getByPath(data, configuration.countPath ?? '0.count')),
      data,
      name: asString(getByPath(data, configuration.namePath ?? '')),
      loc: asString(getByPath(data, configuration.locPath ?? '')),
    }
  },
}
