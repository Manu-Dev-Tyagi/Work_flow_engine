import { NodeType } from '../../engine/graph/enums'
import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { parseCachedContainerTemplate } from '../../integrations/vesta/columns'
import type { OttopilotEventContainerTemplate } from '../../integrations/vesta/types'

export type WiredContainerTemplate = {
  templateId: string | null
  templateDisplayName: string | null
  cachedContainerTemplate: OttopilotEventContainerTemplate | null
  sourceNodeId: string | null
}

function templateFromSourceRun(
  execution: ExecutionContext | null | undefined,
  sourceNodeId: string,
): OttopilotEventContainerTemplate | null {
  const output = execution?.results[sourceNodeId]?.output
  if (!output) return null
  return (
    parseCachedContainerTemplate(output.template) ??
    parseCachedContainerTemplate(output)
  )
}

/** Container template from a wired Get Event Container Template node. */
export function resolveWiredGetContainerTemplate(
  graph: Graph,
  consumerNodeId: string,
  execution?: ExecutionContext | null,
): WiredContainerTemplate {
  const templateEdge = graph.edges.find(
    (edge) => edge.target.nodeId === consumerNodeId && edge.target.port === 'templateId',
  )
  if (!templateEdge) {
    return {
      templateId: null,
      templateDisplayName: null,
      cachedContainerTemplate: null,
      sourceNodeId: null,
    }
  }

  const sourceNode = graph.nodes.find((node) => node.id === templateEdge.source.nodeId)
  if (!sourceNode || sourceNode.type !== NodeType.GetEventContainerTemplate) {
    return {
      templateId: null,
      templateDisplayName: null,
      cachedContainerTemplate: null,
      sourceNodeId: null,
    }
  }

  const templateId = String(sourceNode.configuration.templateId ?? '').trim() || null
  const templateDisplayName = String(sourceNode.configuration.templateDisplayName ?? '').trim() || null
  const configuredTemplate = parseCachedContainerTemplate(
    sourceNode.configuration.cachedContainerTemplate,
  )
  const runtimeTemplate = templateFromSourceRun(execution, sourceNode.id)
  const cachedContainerTemplate = pickRicherTemplate(configuredTemplate, runtimeTemplate)

  return {
    templateId,
    templateDisplayName,
    cachedContainerTemplate,
    sourceNodeId: sourceNode.id,
  }
}

function pickRicherTemplate(
  configured: OttopilotEventContainerTemplate | null,
  runtime: OttopilotEventContainerTemplate | null,
): OttopilotEventContainerTemplate | null {
  if (!configured) return runtime
  if (!runtime) return configured
  const configuredCount = configured.additionalColumns?.length ?? 0
  const runtimeCount = runtime.additionalColumns?.length ?? 0
  return runtimeCount >= configuredCount ? runtime : configured
}
