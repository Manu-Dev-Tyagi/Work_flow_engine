import SectionMessage from '@atlaskit/section-message'
import { getPhysicalColumns } from '../../integrations/vesta/columns'
import { useWorkflowGraph } from '../graph/GraphContext'
import { resolveWiredGetContainerTemplate } from '../graph/resolveWiredValues'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
}

export function FindEventContainerConfig({ nodeId, configuration, onConfigBatchChange }: Props) {
  const { graph, execution } = useWorkflowGraph()
  const wired = resolveWiredGetContainerTemplate(graph, nodeId, execution)
  const columns = getPhysicalColumns(wired.cachedContainerTemplate)

  const matchColumnId = String(configuration.matchColumnId ?? '')

  const handleSelectColumn = (columnId: string) => {
    const column = columns.find((item) => item.id === columnId)
    onConfigBatchChange(nodeId, {
      matchColumnId: columnId,
      matchColumnDisplayName: column?.displayName ?? '',
    })
  }

  return (
    <div className="nodrag nopan nowheel grid gap-2">
      {!wired.templateId ? (
        <SectionMessage appearance="information">
          <p className="text-xs">
            Wire <strong>templateId</strong> from <strong>Get Event Container Template</strong>, then
            load and select a container template on that node.
          </p>
        </SectionMessage>
      ) : columns.length === 0 ? (
        <SectionMessage appearance="warning">
          <p className="text-xs">
            Wired to <strong>{wired.templateDisplayName ?? 'container template'}</strong> — no
            columns found. Re-open Get Event Container Template, click <strong>Load templates</strong>,
            and re-select the template.
          </p>
        </SectionMessage>
      ) : (
        <label className="nodrag nopan nowheel grid gap-1 text-xs text-slate-600">
          <span>Match column</span>
          <select
            className="nodrag nopan nowheel rounded border border-slate-300 px-2 py-1 text-xs"
            value={matchColumnId}
            onChange={(e) => handleSelectColumn(e.currentTarget.value)}
          >
            <option value="">Select column to match on…</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.displayName}
              </option>
            ))}
          </select>
        </label>
      )}

      {matchColumnId ? (
        <p className="text-[10px] text-slate-500">
          Will match on column id: <code>{matchColumnId}</code>
        </p>
      ) : null}
    </div>
  )
}
