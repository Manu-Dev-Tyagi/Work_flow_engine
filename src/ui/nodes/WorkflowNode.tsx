import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Button from '@atlaskit/button/new'
import TextField from '@atlaskit/textfield'
import Lozenge from '@atlaskit/lozenge'
import Heading from '@atlaskit/heading'
import { NodeRuntimeStatus, PortType } from '../../engine/graph/enums'
import type { Registry } from '../../engine/registry/registry'
import type { WorkflowNodeData } from '../canvas/adapters'

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
    default:
      return 'default'
  }
}

export function createWorkflowNodeType(registry: Registry) {
  return function WorkflowNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
    const definition = registry.get(data.nodeType)
    const inputSchema = definition?.inputSchema ?? {}
    const outputSchema = definition?.outputSchema ?? {}
    const configSchema = definition?.configurationSchema ?? {}

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
          <Heading size="xsmall">{data.label}</Heading>
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

        <div className="grid gap-2 px-3 py-2">
          {Object.entries(configSchema).map(([key, portType]) => (
            <label key={key} className="grid gap-1 text-xs text-slate-600">
              <span>config.{key}</span>
              <TextField
                name={`${id}-${key}`}
                isCompact
                type={portType === PortType.Number ? 'number' : 'text'}
                value={String(data.configuration[key] ?? '')}
                onChange={(e) => {
                  const raw = e.currentTarget.value
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
          ))}

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
