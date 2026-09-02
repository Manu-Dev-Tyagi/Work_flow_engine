import type { Registry } from '../../../engine/registry/registry'
import type { NodeType } from '../../../engine/graph/enums'
import { WORKFLOW_NODE_PALETTE } from './nodePalette'
import { PanelSection, PaletteItemButton } from '../components/ui'

type Props = {
  registry: Registry
  onAddNode: (type: NodeType) => void
  onRun: () => void
  onSave: () => void
  onLoad: () => void
  onLoadTemplate: () => void
  onClear: () => void
  isRunning: boolean
}

export function WorkflowSidebar({
  registry,
  onAddNode,
  onRun,
  onSave,
  onLoad,
  onLoadTemplate,
  onClear,
  isRunning,
}: Props) {
  return (
    <aside className="workflow-sidebar flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <header className="workflow-sidebar-header border-b border-slate-100">
        <h1 className="text-sm font-semibold text-slate-900">Workflow</h1>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Drag from a <strong className="text-emerald-700">green output</strong> to a{' '}
          <strong className="text-slate-700">slate input</strong> with the{' '}
          <strong>same type badge</strong> (string, number, or object). Configure the API Request
          node for endpoint URL or trigger JSON.
        </p>
      </header>

      <div className="workflow-sidebar-scroll scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-4">
          {WORKFLOW_NODE_PALETTE.map((section) => (
            <PanelSection key={section.group} title={section.group}>
              <div className="grid gap-1.5">
                {section.nodes.map((node) => {
                  const definition = registry.get(node.type)
                  if (!definition) return null
                  return (
                    <PaletteItemButton
                      key={node.type}
                      glyph={node.glyph}
                      category={node.category}
                      label={definition.label}
                      description={node.description}
                      onClick={() => onAddNode(node.type)}
                    />
                  )
                })}
              </div>
            </PanelSection>
          ))}
        </div>
      </div>

      <footer className="workflow-sidebar-footer grid gap-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running…' : 'Run workflow'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onLoad}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Load
          </button>
        </div>
        <button
          type="button"
          onClick={onLoadTemplate}
          disabled={isRunning}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Load: Lead create
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={isRunning}
          className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          Clear canvas
        </button>
      </footer>
    </aside>
  )
}
