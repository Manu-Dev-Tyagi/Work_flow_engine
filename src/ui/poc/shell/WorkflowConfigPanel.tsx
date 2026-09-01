import type { Registry } from '../../../engine/registry/registry'
import type { WorkflowNodeData } from '../../canvas/adapters'
import { NodeConfigPanel } from '../nodes/NodeConfigPanel'
import { getPaletteMeta } from '../shell/nodePalette'
import { CATEGORY_CHIP } from '../theme/tokens'
import { resolveNodeDisplayLabel } from '../nodes/nodeDisplay'

type Props = {
  nodeId: string
  nodeData: WorkflowNodeData
  registry: Registry
  onClose: () => void
  onDelete: () => void
}

export function WorkflowConfigPanel({ nodeId, nodeData, registry, onClose, onDelete }: Props) {
  const definition = registry.get(nodeData.nodeType)
  const meta = getPaletteMeta(nodeData.nodeType)
  const chip = CATEGORY_CHIP[meta?.category ?? 'action']
  const display = resolveNodeDisplayLabel(
    nodeData.nodeType,
    nodeData.label,
    nodeData.configuration,
  )

  return (
    <aside className="workflow-config-panel flex h-full w-96 shrink-0 flex-col border-l border-slate-200 bg-white">
      <header className="workflow-config-header border-b border-slate-100">
        <div className="mb-1.5 flex items-start gap-3">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chip.bg} text-sm text-white`}
          >
            {meta?.glyph ?? '•'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-400">
              {chip.label} · {definition?.label ?? nodeData.nodeType}
            </div>
            <div className="mt-1 truncate text-sm font-semibold leading-tight text-slate-800">
              {display.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-1 text-lg leading-none text-slate-400 hover:text-slate-700"
            title="Close"
          >
            ×
          </button>
        </div>
        {display.subtitle ? (
          <p className="text-[11px] leading-relaxed text-slate-500">{display.subtitle}</p>
        ) : meta?.description ? (
          <p className="text-[11px] leading-relaxed text-slate-500">{meta.description}</p>
        ) : null}
      </header>

      <div className="workflow-config-body scroll-thin flex-1 overflow-y-auto">
        <NodeConfigPanel nodeId={nodeId} data={nodeData} registry={registry} />
      </div>

      <footer className="workflow-config-footer flex items-center justify-end gap-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">⌫ Delete on canvas</span>
        <button type="button" onClick={onDelete} className="workflow-btn-danger-sm">
          Delete node
        </button>
      </footer>
    </aside>
  )
}
