import { NodeType, PortType } from '../../../engine/graph/enums'
import { getPaletteMeta } from '../shell/nodePalette'
import { CATEGORY_STYLES } from '../theme/tokens'

export type NodeVisual = {
  shortLabel: string
  header: string
  dot: string
  ring: string
  glyph: string
}

const DEFAULT_STYLE = CATEGORY_STYLES.action

export function getNodeVisual(nodeType: NodeType): NodeVisual {
  const meta = getPaletteMeta(nodeType)
  const style = meta ? CATEGORY_STYLES[meta.category] : DEFAULT_STYLE
  return {
    shortLabel: meta?.description ?? 'Node',
    header: style.header,
    dot: style.dot,
    ring: style.ring,
    glyph: meta?.glyph ?? '•',
  }
}

export function resolveNodeDisplayLabel(
  nodeType: NodeType,
  label: string,
  configuration: Record<string, unknown>,
): { title: string; subtitle?: string } {
  if (nodeType === NodeType.GetEventTemplate && configuration.templateDisplayName) {
    return {
      title: 'Get Event Template',
      subtitle: String(configuration.templateDisplayName),
    }
  }
  if (nodeType === NodeType.GetEventContainerTemplate && configuration.templateDisplayName) {
    return {
      title: 'Get Container Template',
      subtitle: String(configuration.templateDisplayName),
    }
  }
  if (nodeType === NodeType.CreateEventContainer && configuration.organizationalUnitDisplayName) {
    return {
      title: 'Create Event Container',
      subtitle: String(configuration.organizationalUnitDisplayName),
    }
  }
  if (nodeType === NodeType.FindEventContainer && configuration.matchColumnDisplayName) {
    return {
      title: 'Find Event Container',
      subtitle: `Match: ${String(configuration.matchColumnDisplayName)}`,
    }
  }
  return { title: label }
}

/** Otto Engage journey node width */
export const WORKFLOW_NODE_WIDTH_PX = 260

export const WORKFLOW_NODE_ANCHOR = { x: WORKFLOW_NODE_WIDTH_PX / 2, y: 48 }

export function portTypeLabel(portType: PortType | string): string {
  switch (portType) {
    case PortType.String:
      return 'string'
    case PortType.Number:
      return 'number'
    case PortType.Object:
      return 'object'
    default:
      return String(portType)
  }
}

export function portTypeBadgeClass(portType: PortType | string): string {
  switch (portType) {
    case PortType.String:
    case 'string':
      return 'workflow-port-badge-string'
    case PortType.Number:
    case 'number':
      return 'workflow-port-badge-number'
    case PortType.Object:
    case 'object':
      return 'workflow-port-badge-object'
    default:
      return 'workflow-port-badge-string'
  }
}

