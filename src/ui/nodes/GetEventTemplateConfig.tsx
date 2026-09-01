import { useState } from 'react'
import Button from '@atlaskit/button/new'
import SectionMessage from '@atlaskit/section-message'
import Spinner from '@atlaskit/spinner'
import { fetchEventTemplates } from '../../integrations/vesta/eventTemplatesApi'
import { getVestaAccessToken, getVestaWorkspaceId } from '../../integrations/vesta/config'
import type { OttopilotEventTemplate } from '../../integrations/vesta/types'
import { getPhysicalColumns } from '../../integrations/vesta/columns'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
}

function shortId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 8)}…`
}

export function GetEventTemplateConfig({
  nodeId,
  configuration,
  onConfigBatchChange,
}: Props) {
  const [templates, setTemplates] = useState<OttopilotEventTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const templateId = String(configuration.templateId ?? '')
  const cachedTemplate = configuration.cachedTemplate as OttopilotEventTemplate | null
  const hasCredentials = Boolean(getVestaWorkspaceId() && getVestaAccessToken())

  const handleFetchTemplates = async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await fetchEventTemplates()
      const active = list.filter((t) => t.displayName)
      setTemplates(active)
      if (templateId) {
        const selected = active.find((t) => t.id === templateId)
        if (selected) {
          onConfigBatchChange(nodeId, {
            cachedTemplate: selected,
            templateDisplayName: selected.displayName,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (id: string) => {
    const selected = templates.find((t) => t.id === id)
    if (!selected) {
      onConfigBatchChange(nodeId, {
        templateId: '',
        templateDisplayName: '',
        cachedTemplate: null,
      })
      return
    }
    onConfigBatchChange(nodeId, {
      templateId: selected.id,
      templateDisplayName: selected.displayName,
      cachedTemplate: selected,
    })
  }

  const physicalCount = cachedTemplate ? getPhysicalColumns(cachedTemplate).length : 0

  return (
    <div className="nodrag nopan nowheel grid gap-2">
      {!hasCredentials ? (
        <SectionMessage appearance="warning">
          <p className="text-xs">
            Set <code>VITE_VESTA_WORKSPACE_ID</code> and <code>VITE_VESTA_ACCESS_TOKEN</code> in
            your <code>.env</code> file (see <code>.env.example</code>).
          </p>
        </SectionMessage>
      ) : null}

      <span className="nodrag nopan nowheel">
        <Button
          appearance="primary"
          spacing="compact"
          onClick={() => void handleFetchTemplates()}
          isDisabled={loading || !hasCredentials}
        >
          {loading ? <Spinner size="small" /> : 'Load templates'}
        </Button>
      </span>

      {error ? (
        <SectionMessage appearance="error">
          <p className="text-xs">{error}</p>
        </SectionMessage>
      ) : null}

      {templates.length > 0 ? (
        <label className="nodrag nopan nowheel grid gap-1 text-xs text-slate-600">
          <span>Event template</span>
          <select
            className="nodrag nopan nowheel rounded border border-slate-300 px-2 py-1 text-xs"
            value={templateId}
            onChange={(e) => handleSelectTemplate(e.currentTarget.value)}
          >
            <option value="">Select a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName} ({shortId(t.id)})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {cachedTemplate ? (
        <div className="rounded bg-slate-50 p-2 text-[10px] text-slate-600">
          <div>
            <strong>{cachedTemplate.displayName}</strong>
          </div>
          <div>ID: {cachedTemplate.id}</div>
          <div>Revision: {shortId(cachedTemplate.revisionId)}</div>
          <div>{physicalCount} physical column port(s)</div>
        </div>
      ) : null}
    </div>
  )
}
