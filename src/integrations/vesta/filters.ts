import type { ComplexFilter } from './types'

export function buildEqualsFilter(column: string, value: unknown): ComplexFilter {
  return {
    filters: [{ column, operator: 'equals', value }],
    logic: 'AND',
  }
}
