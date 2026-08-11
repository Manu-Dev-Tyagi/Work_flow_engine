import type { Registry } from '../engine/registry/registry'
import { additionDefinition } from './addition'
import { apiRequestDefinition } from './apiRequest'
import { concatenationDefinition } from './concatenation'
import { generateNumberDefinition } from './generateNumber'
import { generateStringDefinition } from './generateString'

export function registerAll(registry: Registry): void {
  registry.register(generateNumberDefinition)
  registry.register(additionDefinition)
  registry.register(generateStringDefinition)
  registry.register(concatenationDefinition)
  registry.register(apiRequestDefinition)
}

export {
  additionDefinition,
  apiRequestDefinition,
  concatenationDefinition,
  generateNumberDefinition,
  generateStringDefinition,
}
