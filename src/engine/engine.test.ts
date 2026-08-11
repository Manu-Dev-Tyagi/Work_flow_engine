import { describe, expect, it } from 'vitest'
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
  generateNumberDefinition,
  generateStringDefinition,
  registerAll,
} from '../nodes'

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
