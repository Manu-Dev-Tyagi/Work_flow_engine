import type { NodeType } from '../graph/enums'
import type { AnyNodeDefinition, NodeDefinition } from './types'

export class Registry {
  private readonly definitions = new Map<NodeType, AnyNodeDefinition>()

  register<C extends Record<string, unknown>, I extends Record<string, unknown>, O extends Record<string, unknown>>(
    definition: NodeDefinition<C, I, O>,
  ): void {
    this.definitions.set(definition.type, definition as unknown as AnyNodeDefinition)
  }

  get(type: NodeType): AnyNodeDefinition | undefined {
    return this.definitions.get(type)
  }

  has(type: NodeType): boolean {
    return this.definitions.has(type)
  }

  list(): AnyNodeDefinition[] {
    return [...this.definitions.values()]
  }
}

export function createRegistry(): Registry {
  return new Registry()
}
