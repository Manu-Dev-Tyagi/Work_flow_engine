import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Button from '@atlaskit/button/new'
import { DebouncedTextField } from './DebouncedTextField'
import Lozenge from '@atlaskit/lozenge'
import Heading from '@atlaskit/heading'
import { NodeRuntimeStatus, NodeType, PortType } from '../../engine/graph/enums'
import { resolveNodePorts } from '../../engine/registry/resolvePorts'
import type { Registry } from '../../engine/registry/registry'
import type { WorkflowNodeData } from '../canvas/adapters'
import { GetEventContainerTemplateConfig } from './GetEventContainerTemplateConfig'
import { GetEventTemplateConfig } from './GetEventTemplateConfig'
import { CreateEventContainerConfig } from './CreateEventContainerConfig'
import { FindEventContainerConfig } from './FindEventContainerConfig'
import { ObjectFromKeysConfig } from './ObjectFromKeysConfig'

function statusAppearance(
  status?: NodeRuntimeStatus,
): 'default' | 'inprogress' | 'success' | 'removed' {
  switch (status) {
    case NodeRuntimeStatus.Running:
      return 'inprogress'
    case NodeRuntimeStatus.Completed:
      return 'success'
    case NodeRuntimeStatus.Failed:
      return 'removed'
    case NodeRuntimeStatus.Skipped:
      return 'default'
    default:
      return 'default'
  }
}

export function createWorkflowNodeType(registry: Registry) {
  return function WorkflowNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
    const definition = registry.get(data.nodeType)
    const resolved = definition
      ? resolveNodePorts(definition, data.configuration)
      : { inputSchema: {}, outputSchema: {} }
    const inputSchema = resolved.inputSchema
    const outputSchema = resolved.outputSchema
    const configSchema = definition?.configurationSchema ?? {}
    const isGetEventTemplate = data.nodeType === NodeType.GetEventTemplate
    const isGetEventContainerTemplate = data.nodeType === NodeType.GetEventContainerTemplate
    const isCreateEventContainer = data.nodeType === NodeType.CreateEventContainer
    const isFindEventContainer = data.nodeType === NodeType.FindEventContainer
    const isObjectFromKeys = data.nodeType === NodeType.ObjectFromKeys
    const displayLabel =
      isGetEventTemplate && data.configuration.templateDisplayName
        ? `Get Event Template: ${String(data.configuration.templateDisplayName)}`
        : isGetEventContainerTemplate && data.configuration.templateDisplayName
          ? `Get Event Container Template: ${String(data.configuration.templateDisplayName)}`
          : isCreateEventContainer && data.configuration.organizationalUnitDisplayName
            ? `Create Event Container: ${String(data.configuration.organizationalUnitDisplayName)}`
            : data.label

    return (
      <div
        className={[
          'min-w-[200px] rounded border border-slate-300 bg-white shadow-sm',
          data.status === NodeRuntimeStatus.Running ? 'border-blue-500' : '',
          data.status === NodeRuntimeStatus.Completed ? 'border-emerald-500' : '',
          data.status === NodeRuntimeStatus.Failed ? 'border-red-500' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-slate-200 px-3 py-2">
          <Heading size="xsmall">{displayLabel}</Heading>
          <Lozenge appearance={statusAppearance(data.status)}>
            {data.status ?? NodeRuntimeStatus.Waiting}
          </Lozenge>
          <span className="nodrag nopan">
            <Button
              appearance="danger"
              spacing="compact"
              onClick={(event) => {
                event.stopPropagation()
                data.onDelete(id)
              }}
            >
              Delete
            </Button>
          </span>
        </div>

        <div
          className="nodrag nopan nowheel grid gap-2 px-3 py-2"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {isGetEventTemplate ? (
            <GetEventTemplateConfig
              nodeId={id}
              configuration={data.configuration}
              onConfigBatchChange={data.onConfigBatchChange}
            />
          ) : isGetEventContainerTemplate ? (
            <GetEventContainerTemplateConfig
              nodeId={id}
              configuration={data.configuration}
              onConfigBatchChange={data.onConfigBatchChange}
            />
          ) : isCreateEventContainer ? (
            <CreateEventContainerConfig
              nodeId={id}
              configuration={data.configuration}
              onConfigBatchChange={data.onConfigBatchChange}
            />
          ) : isFindEventContainer ? (
            <FindEventContainerConfig
              nodeId={id}
              configuration={data.configuration}
              onConfigBatchChange={data.onConfigBatchChange}
            />
          ) : isObjectFromKeys ? (
            <ObjectFromKeysConfig
              nodeId={id}
              configuration={data.configuration}
              onConfigChange={data.onConfigChange}
            />
          ) : (
            Object.entries(configSchema).map(([key, portType]) => (
              <label key={key} className="nodrag nopan nowheel grid gap-1 text-xs text-slate-600">
                <span>config.{key}</span>
                <DebouncedTextField
                  name={`${id}-${key}`}
                  type={portType === PortType.Number ? 'number' : 'text'}
                  committedValue={String(data.configuration[key] ?? '')}
                  onCommit={(raw) => {
                    const value =
                      portType === PortType.Number
                        ? raw === ''
                          ? 0
                          : Number(raw)
                        : raw
                    data.onConfigChange(id, key, value)
                  }}
                />
              </label>
            ))
          )}

          {Object.keys(inputSchema).map((port) => (
            <div key={`in-${port}`} className="relative py-1 pl-2 text-xs text-slate-700">
              <Handle
                type="target"
                position={Position.Left}
                id={port}
                className="!bg-slate-600"
                style={{ left: -6 }}
              />
              in: {port} ({inputSchema[port]})
            </div>
          ))}

          {Object.keys(outputSchema).map((port) => (
            <div
              key={`out-${port}`}
              className="relative py-1 pr-2 text-right text-xs text-slate-700"
            >
              out: {port} ({outputSchema[port]})
              <Handle
                type="source"
                position={Position.Right}
                id={port}
                className="!bg-emerald-600"
                style={{ right: -6 }}
              />
            </div>
          ))}

          {data.lastOutput ? (
            <pre className="overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-700">
              {JSON.stringify(data.lastOutput, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    )
  }
}
