import Button from '@atlaskit/button/new'
import Heading from '@atlaskit/heading'
import { NodeType } from '../../engine/graph/enums'
import type { Registry } from '../../engine/registry/registry'

type Props = {
  registry: Registry
  onAddNode: (type: NodeType) => void
  onRun: () => void
  onSave: () => void
  onLoad: () => void
  isRunning: boolean
}

export function ToolbarPanel({
  registry,
  onAddNode,
  onRun,
  onSave,
  onLoad,
  isRunning,
}: Props) {
  return (
    <aside className="grid grid-rows-[auto_1fr_auto] gap-4 border-r border-slate-200 bg-white p-4">
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
        <Button appearance="primary" onClick={onRun} isDisabled={isRunning}>
          {isRunning ? 'Running…' : 'Run'}
        </Button>
        <Button appearance="default" onClick={onSave}>
          Save graph
        </Button>
        <Button appearance="default" onClick={onLoad}>
          Load graph
        </Button>
      </div>
    </aside>
  )
}
