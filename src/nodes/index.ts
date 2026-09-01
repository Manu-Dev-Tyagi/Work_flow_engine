import type { Registry } from '../engine/registry/registry'
import { additionDefinition } from './addition'
import { apiRequestDefinition } from './apiRequest'
import { concatenationDefinition } from './concatenation'
import { generateNumberDefinition } from './generateNumber'
import { generateStringDefinition } from './generateString'
import { createEventContainerDefinition } from './createEventContainer'
import { createEventDefinition } from './createEvent'
import { findEventContainerDefinition } from './findEventContainer'
import { httpRespondDefinition } from './httpRespond'
import { mergeStringDefinition } from './mergeString'
import { objectFromKeysDefinition } from './objectFromKeys'
import { switchEmptyDefinition } from './switchEmpty'
import { getEventContainerTemplateDefinition } from './getEventContainerTemplate'
import { getEventTemplateDefinition } from './getEventTemplate'

export function registerAll(registry: Registry): void {
  registry.register(generateNumberDefinition)
  registry.register(additionDefinition)
  registry.register(generateStringDefinition)
  registry.register(concatenationDefinition)
  registry.register(apiRequestDefinition)
  registry.register(getEventTemplateDefinition)
  registry.register(getEventContainerTemplateDefinition)
  registry.register(createEventDefinition)
  registry.register(findEventContainerDefinition)
  registry.register(createEventContainerDefinition)
  registry.register(switchEmptyDefinition)
  registry.register(mergeStringDefinition)
  registry.register(httpRespondDefinition)
  registry.register(objectFromKeysDefinition)
}

export {
  additionDefinition,
  apiRequestDefinition,
  concatenationDefinition,
  createEventDefinition,
  createEventContainerDefinition,
  findEventContainerDefinition,
  mergeStringDefinition,
  httpRespondDefinition,
  objectFromKeysDefinition,
  switchEmptyDefinition,
  generateNumberDefinition,
  generateStringDefinition,
  getEventTemplateDefinition,
  getEventContainerTemplateDefinition,
}
