import Button from '@atlaskit/button/new'
import Heading from '@atlaskit/heading'
import type { Registry } from '../../engine/registry/registry'
import type { NodeType } from '../../engine/graph/enums'

type Props = {
  registry: Registry
  onAddNode: (type: NodeType) => void
  onRun: () => void
  onSave: () => void
  onLoad: () => void
  onLoadTemplate: () => void
  onClear: () => void
  isRunning: boolean
  triggerJson: string
  onTriggerJsonChange: (value: string) => void
}

export function ToolbarPanel({
  registry,
  onAddNode,
  onRun,
  onSave,
  onLoad,
  onLoadTemplate,
  onClear,
  isRunning,
  triggerJson,
  onTriggerJsonChange,
}: Props) {
  return (
    <aside className="grid grid-rows-[auto_1fr_auto] gap-4 overflow-auto border-r border-slate-200 bg-white p-4">
      <Heading size="medium">Workflow Engine</Heading>

      <div className="grid gap-2 content-start">
        <Heading size="xsmall">Add node</Heading>
        {registry.list().map((definition) => (
          <Button
            key={definition.type}
            appearance="default"
            onClick={() => onAddNode(definition.type)}
          >
            {definition.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-2">
        <label className="grid gap-1 text-xs text-slate-600">
          <span>HTTP trigger JSON — Testing Workflow Engine (Run / API)</span>
          <textarea
            className="min-h-[88px] rounded border border-slate-300 p-2 font-mono text-[10px]"
            value={triggerJson}
            onChange={(e) => onTriggerJsonChange(e.currentTarget.value)}
            spellCheck={false}
          />
        </label>
        <Button appearance="primary" onClick={onRun} isDisabled={isRunning}>
          {isRunning ? 'Running…' : 'Run'}
        </Button>
        <Button appearance="default" onClick={onSave}>
          Save graph
        </Button>
        <Button appearance="default" onClick={onLoadTemplate} isDisabled={isRunning}>
          Load template: Lead create
        </Button>
        <Button appearance="default" onClick={onLoad}>
          Load graph
        </Button>
        <Button appearance="danger" onClick={onClear} isDisabled={isRunning}>
          Clear canvas
        </Button>
      </div>
    </aside>
  )
}
