import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react'
import { useEffect, type MouseEvent } from 'react'
import { NodeRuntimeStatus, type PortType } from '../../engine/graph/enums'
import { resolveNodePorts } from '../../engine/registry/resolvePorts'
import type { Registry } from '../../engine/registry/registry'
import { canConnectToInput } from '../canvas/connectionValidation'
import { useConnectionDrag } from '../canvas/ConnectionDragContext'
import type { WorkflowNodeData } from '../canvas/adapters'
import { StatusChip } from '../poc/components/ui'
import {
  WORKFLOW_NODE_WIDTH_PX,
  getNodeVisual,
  portTypeBadgeClass,
  portTypeLabel,
  resolveNodeDisplayLabel,
} from '../poc/nodes/nodeDisplay'

function nodeStatusTone(
  status?: NodeRuntimeStatus,
): 'waiting' | 'running' | 'completed' | 'failed' {
  switch (status) {
    case NodeRuntimeStatus.Running:
      return 'running'
    case NodeRuntimeStatus.Completed:
      return 'completed'
    case NodeRuntimeStatus.Failed:
      return 'failed'
    default:
      return 'waiting'
  }
}

function PortTypeBadge({ portType }: { portType: PortType }) {
  return (
    <span className={`workflow-port-badge ${portTypeBadgeClass(portType)}`}>
      {portTypeLabel(portType)}
    </span>
  )
}

function inputHandleClass(
  connectable: boolean,
  compatible: boolean,
  dragging: boolean,
): string {
  const classes = ['workflow-handle-in']
  if (dragging) {
    classes.push(compatible ? 'workflow-handle-compatible' : 'workflow-handle-blocked')
  } else if (!connectable) {
    classes.push('workflow-handle-blocked')
  }
  return classes.join(' ')
}

export function createWorkflowNodeType(registry: Registry) {
  return function WorkflowNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
    const definition = registry.get(data.nodeType)
    const resolved = definition
      ? resolveNodePorts(definition, data.configuration)
      : { inputSchema: {}, outputSchema: {} }
    const inputPorts = Object.keys(resolved.inputSchema)
    const outputPorts = Object.keys(resolved.outputSchema)
    const portRows = Math.max(inputPorts.length, outputPorts.length)
    const visual = getNodeVisual(data.nodeType)
    const display = resolveNodeDisplayLabel(data.nodeType, data.label, data.configuration)
    const selected = data.selected === true
    const status = data.status ?? NodeRuntimeStatus.Waiting
    const connectionDrag = useConnectionDrag()
    const dragging = connectionDrag !== null
    const updateNodeInternals = useUpdateNodeInternals()
    const twoColumns = inputPorts.length > 0 && outputPorts.length > 0

    useEffect(() => {
      updateNodeInternals(id)
    }, [id, inputPorts.length, outputPorts.length, data.configuration, updateNodeInternals])

    const openConfig = (event: MouseEvent) => {
      event.stopPropagation()
      data.onOpenConfig(id)
    }

    const statusRing =
      status === NodeRuntimeStatus.Running
        ? 'ring-2 ring-blue-400 border-blue-400'
        : status === NodeRuntimeStatus.Completed
          ? 'ring-1 ring-emerald-300 border-emerald-300'
          : status === NodeRuntimeStatus.Failed
            ? 'ring-2 ring-rose-400 border-rose-300'
            : selected
              ? `ring-2 ${visual.ring} border-slate-300`
              : 'border-slate-200 hover:border-slate-300'

    return (
      <div
        className={`workflow-node-card relative rounded-lg border bg-white shadow-sm transition ${statusRing}`}
        style={{ width: WORKFLOW_NODE_WIDTH_PX }}
      >
        <div className={`h-1.5 rounded-t-lg ${visual.header}`} />

        <div className="workflow-node-body flex items-start gap-3 pb-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${visual.dot} text-sm text-white`}
          >
            {visual.glyph}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[13px] font-semibold leading-tight text-slate-800">
                {display.title}
              </p>
              <button
                type="button"
                className="workflow-node-configure nodrag nopan nowheel"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={openConfig}
              >
                Configure
              </button>
            </div>
            {display.subtitle ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                {display.subtitle}
              </p>
            ) : (
              <p className="mt-1 truncate text-[11px] text-slate-500">{visual.shortLabel}</p>
            )}
            <div className="mt-1.5">
              <StatusChip label={status} tone={nodeStatusTone(status)} />
            </div>
          </div>
        </div>

        {portRows > 0 ? (
          <div
            className={`workflow-node-ports-section ${twoColumns ? 'workflow-node-ports-grid' : 'workflow-node-ports-single'}`}
          >
            {inputPorts.length > 0 ? (
              <div className="workflow-node-ports-col-in">
                <div className="workflow-node-ports-header-in">← Inputs</div>
                {inputPorts.map((port) => {
                  const portType = resolved.inputSchema[port]
                  const compatible = canConnectToInput(connectionDrag, id, portType)
                  const connectable = !dragging || compatible
                  return (
                    <div key={port} className="workflow-node-port-in-row">
                      <Handle
                        type="target"
                        position={Position.Left}
                        id={port}
                        isConnectable={connectable}
                        className={inputHandleClass(connectable, compatible, dragging)}
                        title={`Input: ${port} (${portTypeLabel(portType)})`}
                      />
                      <span className="workflow-port-name" title={port}>
                        {port}
                      </span>
                      <PortTypeBadge portType={portType} />
                    </div>
                  )
                })}
              </div>
            ) : null}

            {outputPorts.length > 0 ? (
              <div className="workflow-node-ports-col-out">
                <div className="workflow-node-ports-header-out">Outputs →</div>
                {outputPorts.map((port) => {
                  const portType = resolved.outputSchema[port]
                  const isSource =
                    connectionDrag?.nodeId === id &&
                    connectionDrag.handleId === port &&
                    connectionDrag.handleType === 'source'
                  return (
                    <div key={port} className="workflow-node-port-out-row">
                      <PortTypeBadge portType={portType} />
                      <span className="workflow-port-name" title={port}>
                        {port}
                      </span>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={port}
                        className={`workflow-handle-out ${isSource ? 'workflow-handle-active' : ''}`}
                        title={`Output: ${port} (${portTypeLabel(portType)})`}
                      />
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }
}
