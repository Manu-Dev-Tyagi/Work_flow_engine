import type { Graph } from '../graph/types'
import type { Registry } from '../registry/registry'
import { validateCycles } from './cycles'
import { validatePorts } from './ports'
import { validateStructural } from './structural'
import type { ValidationResult } from './types'

export function validateGraph(graph: Graph, registry: Registry): ValidationResult {
  const errors = [
    ...validateStructural(graph, registry),
    ...validateCycles(graph),
    ...validatePorts(graph, registry),
  ]

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true }
}
