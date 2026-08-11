import { NodeType } from '../engine/graph/enums'
import type { Graph } from '../engine/graph/types'

/** Fixed UUIDs for stable test assertions. */
export const FIXTURE_IDS = {
  graphValid: '11111111-1111-4111-8111-111111111111',
  graphCycle: '22222222-2222-4222-8222-222222222222',
  graphTypeMismatch: '33333333-3333-4333-8333-333333333333',
  graphMissingInput: '44444444-4444-4444-8444-444444444444',
  genA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  genB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  addition: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  genString: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  edgeA: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  edgeB: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  edgeCycle: '12121212-1212-4121-8121-121212121212',
  edgeType: '13131313-1313-4131-8131-131313131313',
} as const

/** Valid: generateNumber(5) + generateNumber(10) → addition → sum 15 */
export const validNumberPipeline: Graph = {
  id: FIXTURE_IDS.graphValid,
  nodes: [
    {
      id: FIXTURE_IDS.genA,
      type: NodeType.GenerateNumber,
      position: { x: 0, y: 0 },
      configuration: { a: 5 },
    },
    {
      id: FIXTURE_IDS.genB,
      type: NodeType.GenerateNumber,
      position: { x: 0, y: 120 },
      configuration: { a: 10 },
    },
    {
      id: FIXTURE_IDS.addition,
      type: NodeType.Addition,
      position: { x: 240, y: 60 },
      configuration: {},
    },
  ],
  edges: [
    {
      id: FIXTURE_IDS.edgeA,
      source: { nodeId: FIXTURE_IDS.genA, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'a' },
    },
    {
      id: FIXTURE_IDS.edgeB,
      source: { nodeId: FIXTURE_IDS.genB, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'b' },
    },
  ],
}

/** Invalid: A → B → A cycle */
export const cyclicGraph: Graph = {
  id: FIXTURE_IDS.graphCycle,
  nodes: [
    {
      id: FIXTURE_IDS.genA,
      type: NodeType.GenerateNumber,
      position: { x: 0, y: 0 },
      configuration: { a: 1 },
    },
    {
      id: FIXTURE_IDS.addition,
      type: NodeType.Addition,
      position: { x: 200, y: 0 },
      configuration: {},
    },
  ],
  edges: [
    {
      id: FIXTURE_IDS.edgeA,
      source: { nodeId: FIXTURE_IDS.genA, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'a' },
    },
    {
      id: FIXTURE_IDS.edgeCycle,
      source: { nodeId: FIXTURE_IDS.addition, port: 'sum' },
      target: { nodeId: FIXTURE_IDS.genA, port: 'a' },
    },
  ],
}

/** Invalid: generateString → addition.a and addition.b (string into number) */
export const typeMismatchGraph: Graph = {
  id: FIXTURE_IDS.graphTypeMismatch,
  nodes: [
    {
      id: FIXTURE_IDS.genString,
      type: NodeType.GenerateString,
      position: { x: 0, y: 0 },
      configuration: { a: 'hello' },
    },
    {
      id: FIXTURE_IDS.genB,
      type: NodeType.GenerateString,
      position: { x: 0, y: 120 },
      configuration: { a: 'world' },
    },
    {
      id: FIXTURE_IDS.addition,
      type: NodeType.Addition,
      position: { x: 240, y: 60 },
      configuration: {},
    },
  ],
  edges: [
    {
      id: FIXTURE_IDS.edgeType,
      source: { nodeId: FIXTURE_IDS.genString, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'a' },
    },
    {
      id: FIXTURE_IDS.edgeB,
      source: { nodeId: FIXTURE_IDS.genB, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'b' },
    },
  ],
}

/** Invalid: addition missing required input b */
export const missingInputGraph: Graph = {
  id: FIXTURE_IDS.graphMissingInput,
  nodes: [
    {
      id: FIXTURE_IDS.genA,
      type: NodeType.GenerateNumber,
      position: { x: 0, y: 0 },
      configuration: { a: 5 },
    },
    {
      id: FIXTURE_IDS.addition,
      type: NodeType.Addition,
      position: { x: 240, y: 0 },
      configuration: {},
    },
  ],
  edges: [
    {
      id: FIXTURE_IDS.edgeA,
      source: { nodeId: FIXTURE_IDS.genA, port: 'a' },
      target: { nodeId: FIXTURE_IDS.addition, port: 'a' },
    },
  ],
}
