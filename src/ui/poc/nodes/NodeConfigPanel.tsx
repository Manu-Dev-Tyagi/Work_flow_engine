import { resolveNodePorts } from '../../../engine/registry/resolvePorts'
import { DebouncedTextField } from '../../nodes/DebouncedTextField'
import { PortType } from '../../../engine/graph/enums'
import { portTypeBadgeClass, portTypeLabel } from '../nodes/nodeDisplay'
import type { Registry } from '../../../engine/registry/registry'
import type { WorkflowNodeData } from '../../canvas/adapters'
import { GetEventContainerTemplateConfig } from '../../nodes/GetEventContainerTemplateConfig'
import { GetEventTemplateConfig } from '../../nodes/GetEventTemplateConfig'
import { CreateEventContainerConfig } from '../../nodes/CreateEventContainerConfig'
import { CreateEventConfig } from '../../nodes/CreateEventConfig'
import { FindEventContainerConfig } from '../../nodes/FindEventContainerConfig'
import { ObjectFromKeysConfig } from '../../nodes/ObjectFromKeysConfig'
import { NodeType } from '../../../engine/graph/enums'

type Props = {
  nodeId: string
  data: WorkflowNodeData
  registry: Registry
}

export function NodeConfigPanel({ nodeId, data, registry }: Props) {
  const definition = registry.get(data.nodeType)
  const resolved = definition
    ? resolveNodePorts(definition, data.configuration)
    : { inputSchema: {}, outputSchema: {} }
  const configSchema = definition?.configurationSchema ?? {}
  const inputPorts = Object.keys(resolved.inputSchema)
  const outputPorts = Object.keys(resolved.outputSchema)

  const renderConfig = () => {
    switch (data.nodeType) {
      case NodeType.GetEventTemplate:
        return (
          <GetEventTemplateConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigBatchChange={data.onConfigBatchChange}
          />
        )
      case NodeType.GetEventContainerTemplate:
        return (
          <GetEventContainerTemplateConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigBatchChange={data.onConfigBatchChange}
          />
        )
      case NodeType.CreateEventContainer:
        return (
          <CreateEventContainerConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigBatchChange={data.onConfigBatchChange}
          />
        )
      case NodeType.CreateEvent:
        return (
          <CreateEventConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigBatchChange={data.onConfigBatchChange}
          />
        )
      case NodeType.FindEventContainer:
        return (
          <FindEventContainerConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigBatchChange={data.onConfigBatchChange}
          />
        )
      case NodeType.ObjectFromKeys:
        return (
          <ObjectFromKeysConfig
            nodeId={nodeId}
            configuration={data.configuration}
            onConfigChange={data.onConfigChange}
          />
        )
      default:
        return Object.entries(configSchema).map(([key, portType]) => {
          if (portType === PortType.Object) {
            const value = data.configuration[key]
            const json =
              value && typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : '{}'
            return (
              <div key={key} className="workflow-config-field">
                <label htmlFor={`${nodeId}-${key}`}>{key}</label>
                <textarea
                  id={`${nodeId}-${key}`}
                  className="min-h-[72px] rounded-md border border-slate-200 p-2.5 font-mono text-[11px]"
                  defaultValue={json}
                  spellCheck={false}
                  onBlur={(event) => {
                    try {
                      const parsed = JSON.parse(event.currentTarget.value) as unknown
                      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        data.onConfigChange(nodeId, key, parsed)
                      }
                    } catch {
                      // keep previous value on invalid JSON
                    }
                  }}
                />
              </div>
            )
          }
          return (
            <div key={key} className="workflow-config-field">
              <label htmlFor={`${nodeId}-${key}`}>{key}</label>
              <DebouncedTextField
                name={`${nodeId}-${key}`}
                type={portType === PortType.Number ? 'number' : 'text'}
                committedValue={String(data.configuration[key] ?? '')}
                onCommit={(raw) => {
                  const value =
                    portType === PortType.Number ? (raw === '' ? 0 : Number(raw)) : raw
                  data.onConfigChange(nodeId, key, value)
                }}
              />
            </div>
          )
        })
    }
  }

  return (
    <div>
      <section className="workflow-config-section">
        <h3 className="workflow-config-section-title">Configuration</h3>
        <div className="grid gap-3">{renderConfig()}</div>
      </section>

      {(inputPorts.length > 0 || outputPorts.length > 0) && (
        <section className="workflow-config-section">
          <h3 className="workflow-config-section-title">Ports</h3>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Connect <strong>outputs → inputs</strong> with matching types only.{' '}
            <span className={`workflow-port-badge ${portTypeBadgeClass(PortType.String)}`}>
              string
            </span>{' '}
            <span className={`workflow-port-badge ${portTypeBadgeClass(PortType.Number)}`}>
              number
            </span>{' '}
            <span className={`workflow-port-badge ${portTypeBadgeClass(PortType.Object)}`}>
              object
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="grid gap-1.5">
              <span className="font-medium text-slate-700">← Inputs</span>
              {inputPorts.length === 0 ? (
                <span className="text-slate-400">None</span>
              ) : (
                inputPorts.map((port) => (
                  <span key={port} className="flex items-center gap-1.5">
                    <span>{port}</span>
                    <span
                      className={`workflow-port-badge ${portTypeBadgeClass(resolved.inputSchema[port])}`}
                    >
                      {portTypeLabel(resolved.inputSchema[port])}
                    </span>
                  </span>
                ))
              )}
            </div>
            <div className="grid gap-1.5">
              <span className="font-medium text-emerald-700">Outputs →</span>
              {outputPorts.length === 0 ? (
                <span className="text-slate-400">None</span>
              ) : (
                outputPorts.map((port) => (
                  <span key={port} className="flex items-center justify-end gap-1.5">
                    <span
                      className={`workflow-port-badge ${portTypeBadgeClass(resolved.outputSchema[port])}`}
                    >
                      {portTypeLabel(resolved.outputSchema[port])}
                    </span>
                    <span>{port}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {data.lastOutput ? (
        <section className="workflow-config-section">
          <h3 className="workflow-config-section-title">Last output</h3>
          <pre className="max-h-48 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700">
            {JSON.stringify(data.lastOutput, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  )
}
