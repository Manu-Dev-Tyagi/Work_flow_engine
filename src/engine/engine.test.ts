import { describe, expect, it, vi, afterEach } from 'vitest'
import { createId } from '../engine/graph/ids'
import { NodeType, PortType, ValidationErrorCode, WorkflowStatus } from '../engine/graph/enums'
import { createRegistry } from '../engine/registry/registry'
import { compileGraph } from '../engine/compiler/compileGraph'
import { validateGraph } from '../engine/validation/validateGraph'
import { portsCompatible } from '../engine/validation/ports'
import { runWorkflow } from '../engine/runWorkflow'
import {
  cyclicGraph,
  FIXTURE_IDS,
  missingInputGraph,
  typeMismatchGraph,
  validNumberPipeline,
} from '../fixtures/graphs'
import {
  additionDefinition,
  apiRequestDefinition,
  generateNumberDefinition,
  generateStringDefinition,
  registerAll,
} from '../nodes'
import { getByPath, addCountToEveryObject } from '../nodes/apiRequest'
import type { Graph } from '../engine/graph/types'

function registryWithAll() {
  const registry = createRegistry()
  registerAll(registry)
  return registry
}

describe('ids', () => {
  it('createId returns a UUID string', () => {
    const id = createId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})

describe('registry and nodes', () => {
  it('looks up registered node definitions by NodeType', () => {
    const registry = registryWithAll()
    expect(registry.get(NodeType.Addition)?.type).toBe(NodeType.Addition)
    expect(registry.get(NodeType.GenerateNumber)?.outputSchema.a).toBe(PortType.Number)
    expect(registry.get(NodeType.ApiRequest)?.outputSchema.data).toBe(PortType.Object)
    expect(registry.get(NodeType.ApiRequest)?.outputSchema.count).toBe(PortType.Number)
  })

  it('executes each node in isolation', async () => {
    expect(
      await generateNumberDefinition.execute({ configuration: { a: 7 }, input: {} }),
    ).toEqual({ a: 7 })
    expect(
      await additionDefinition.execute({ configuration: {}, input: { a: 2, b: 3 } }),
    ).toEqual({ sum: 5 })
    expect(
      await generateStringDefinition.execute({
        configuration: { a: 'hi' },
        input: {},
      }),
    ).toEqual({ a: 'hi' })
  })
})

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getByPath resolves nested fields', () => {
    const data = [{ name: 'Leanne', address: { city: 'Gwenborough' } }]
    expect(getByPath(data, '0.name')).toBe('Leanne')
    expect(getByPath(data, '0.address.city')).toBe('Gwenborough')
  })

  it('addCountToEveryObject adds count key on each object', () => {
    const users = [
      { name: 'A', email: 'a@x.com' },
      { name: 'B', email: 'b@x.com' },
    ]
    expect(addCountToEveryObject(users)).toEqual([
      { name: 'A', email: 'a@x.com', count: 1 },
      { name: 'B', email: 'b@x.com', count: 2 },
    ])
  })

  it('fetches JSON, adds per-object count, projects name/loc', async () => {
    const payload = [
      { id: 1, name: 'Leanne Graham', address: { city: 'Gwenborough' } },
      { id: 2, name: 'Ervin Howell', address: { city: 'Wisokyburgh' } },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => payload,
      })),
    )

    const result = await apiRequestDefinition.execute({
      configuration: {
        url: 'https://example.com/users',
        countPath: '0.count',
        namePath: '0.name',
        locPath: '0.address.city',
      },
      input: {},
    })

    expect(result.count).toBe(1)
    expect(result.name).toBe('Leanne Graham')
    expect(result.loc).toBe('Gwenborough')
    expect(result.data).toEqual([
      { ...payload[0], count: 1 },
      { ...payload[1], count: 2 },
    ])
    expect((result.data as Record<string, unknown>[])[0].count).toBe(1)
    expect((result.data as Record<string, unknown>[])[1].count).toBe(2)
  })

  it('runs in a graph and exposes typed ports', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { id: 1, name: 'A', address: { city: 'X' } },
          { id: 2, name: 'B', address: { city: 'Y' } },
        ],
      })),
    )

    const apiId = createId()
    const graph: Graph = {
      id: createId(),
      nodes: [
        {
          id: apiId,
          type: NodeType.ApiRequest,
          position: { x: 0, y: 0 },
          configuration: {
            url: 'https://example.com/users',
            countPath: '1.count',
            namePath: '0.name',
            locPath: '0.address.city',
          },
        },
      ],
      edges: [],
    }

    const ctx = await runWorkflow(graph, registryWithAll())
    expect(ctx.status).toBe(WorkflowStatus.Completed)
    expect(ctx.results[apiId]?.output.name).toBe('A')
    expect(ctx.results[apiId]?.output.count).toBe(2)
    expect(ctx.results[apiId]?.output.data).toEqual([
      { id: 1, name: 'A', address: { city: 'X' }, count: 1 },
      { id: 2, name: 'B', address: { city: 'Y' }, count: 2 },
    ])
  })
})

describe('validation', () => {
  it('accepts a valid number pipeline', () => {
    const result = validateGraph(validNumberPipeline, registryWithAll())
    expect(result.ok).toBe(true)
  })

  it('rejects cycles', () => {
    const result = validateGraph(cyclicGraph, registryWithAll())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === ValidationErrorCode.CycleDetected)).toBe(
        true,
      )
    }
  })

  it('rejects type mismatches', () => {
    const result = validateGraph(typeMismatchGraph, registryWithAll())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const mismatch = result.errors.find(
        (e) => e.code === ValidationErrorCode.TypeMismatch,
      )
      expect(mismatch?.message).toContain('expected number')
      expect(mismatch?.message).toContain('received string')
    }
  })

  it('rejects missing required inputs', () => {
    const result = validateGraph(missingInputGraph, registryWithAll())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.code === ValidationErrorCode.MissingRequiredInput),
      ).toBe(true)
    }
  })

  it('portsCompatible is the shared type check', () => {
    expect(portsCompatible(PortType.Number, PortType.Number)).toBe(true)
    expect(portsCompatible(PortType.String, PortType.Number)).toBe(false)
    expect(portsCompatible(PortType.Object, PortType.Object)).toBe(true)
    expect(portsCompatible(PortType.Object, PortType.Number)).toBe(false)
  })
})

describe('compiler', () => {
  it('produces topological order with sources before consumers', () => {
    const compiled = compileGraph(validNumberPipeline)
    const additionIndex = compiled.executionOrder.indexOf(FIXTURE_IDS.addition)
    const genAIndex = compiled.executionOrder.indexOf(FIXTURE_IDS.genA)
    const genBIndex = compiled.executionOrder.indexOf(FIXTURE_IDS.genB)
    expect(genAIndex).toBeLessThan(additionIndex)
    expect(genBIndex).toBeLessThan(additionIndex)
  })
})

describe('runWorkflow', () => {
  it('executes the valid pipeline and stores edge values', async () => {
    const ctx = await runWorkflow(validNumberPipeline, registryWithAll())
    expect(ctx.status).toBe(WorkflowStatus.Completed)
    expect(ctx.results[FIXTURE_IDS.addition]?.output).toEqual({ sum: 15 })
    expect(ctx.edgeValues[FIXTURE_IDS.edgeA]).toBe(5)
    expect(ctx.edgeValues[FIXTURE_IDS.edgeB]).toBe(10)
    expect(ctx.logs.length).toBeGreaterThan(0)
  })

  it('does not execute invalid graphs', async () => {
    const ctx = await runWorkflow(typeMismatchGraph, registryWithAll())
    expect(ctx.status).toBe(WorkflowStatus.Failed)
    expect(ctx.error?.code).toBe(ValidationErrorCode.TypeMismatch)
    expect(Object.keys(ctx.results)).toHaveLength(0)
  })
})
