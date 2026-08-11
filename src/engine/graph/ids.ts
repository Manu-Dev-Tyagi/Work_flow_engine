export type GraphId = string
export type NodeId = string
export type EdgeId = string

/** Creates a UUID for graph / node / edge entity ids. */
export function createId(): string {
  return crypto.randomUUID()
}
