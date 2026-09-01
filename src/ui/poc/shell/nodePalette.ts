import { NodeType } from '../../../engine/graph/enums'
import type { NodeCategory } from '../theme/tokens'

export type PaletteNodeMeta = {
  type: NodeType
  category: NodeCategory
  glyph: string
  description: string
}

/** Curated palette — workflow nodes only, Otto Engage grouping. */
export const WORKFLOW_NODE_PALETTE: { group: string; nodes: PaletteNodeMeta[] }[] = [
  {
    group: 'Trigger',
    nodes: [
      {
        type: NodeType.ApiRequest,
        category: 'entry',
        glyph: '⚡',
        description: 'HTTP trigger body + match field',
      },
    ],
  },
  {
    group: 'Vesta templates',
    nodes: [
      {
        type: NodeType.GetEventTemplate,
        category: 'action',
        glyph: '◇',
        description: 'Load event template schema',
      },
      {
        type: NodeType.GetEventContainerTemplate,
        category: 'action',
        glyph: '▣',
        description: 'Load container template schema',
      },
    ],
  },
  {
    group: 'Vesta records',
    nodes: [
      {
        type: NodeType.FindEventContainer,
        category: 'action',
        glyph: '⌕',
        description: 'Find journey by column match',
      },
      {
        type: NodeType.CreateEventContainer,
        category: 'action',
        glyph: '+',
        description: 'Create journey container',
      },
      {
        type: NodeType.CreateEvent,
        category: 'action',
        glyph: '◆',
        description: 'Create enquiry event',
      },
    ],
  },
  {
    group: 'Flow control',
    nodes: [
      {
        type: NodeType.SwitchEmpty,
        category: 'logic',
        glyph: '⑂',
        description: 'Branch on container match',
      },
      {
        type: NodeType.MergeString,
        category: 'logic',
        glyph: '⊕',
        description: 'Coalesce container id paths',
      },
    ],
  },
  {
    group: 'Response',
    nodes: [
      {
        type: NodeType.ObjectFromKeys,
        category: 'logic',
        glyph: '{}',
        description: 'Shape HTTP response JSON',
      },
      {
        type: NodeType.HttpRespond,
        category: 'exit',
        glyph: '↩',
        description: 'Return HTTP response',
      },
    ],
  },
]

const META_BY_TYPE = new Map<NodeType, PaletteNodeMeta>(
  WORKFLOW_NODE_PALETTE.flatMap((section) => section.nodes.map((node) => [node.type, node])),
)

export function getPaletteMeta(type: NodeType): PaletteNodeMeta | undefined {
  return META_BY_TYPE.get(type)
}
