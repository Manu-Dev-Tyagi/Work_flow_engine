import { useState } from 'react'
import Button from '@atlaskit/button/new'
import SectionMessage from '@atlaskit/section-message'
import Spinner from '@atlaskit/spinner'
import { fetchEventContainerTemplates } from '../../integrations/vesta/eventContainerTemplatesApi'
import { getVestaAccessToken, getVestaWorkspaceId } from '../../integrations/vesta/config'
import type { OttopilotEventContainerTemplate } from '../../integrations/vesta/types'
import { getPhysicalColumns, normalizeContainerTemplate } from '../../integrations/vesta/columns'
import { useWorkflowGraph } from '../graph/GraphContext'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
}

function shortId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 8)}…`
}

function pickTemplate(
  configured: OttopilotEventContainerTemplate | null,
  runtime: OttopilotEventContainerTemplate | null,
): OttopilotEventContainerTemplate | null {
  if (!configured) return runtime
  if (!runtime) return configured
  const configuredCount = getPhysicalColumns(configured).length
  const runtimeCount = getPhysicalColumns(runtime).length
  return runtimeCount >= configuredCount ? runtime : configured
}

export function GetEventContainerTemplateConfig({
  nodeId,
  configuration,
  onConfigBatchChange,
}: Props) {
  const { execution } = useWorkflowGraph()
  const [templates, setTemplates] = useState<OttopilotEventContainerTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const templateId = String(configuration.templateId ?? '')
  const configuredTemplate = normalizeContainerTemplate(configuration.cachedContainerTemplate)
  const runtimeTemplate = normalizeContainerTemplate(execution?.results[nodeId]?.output?.template)
  const cachedContainerTemplate = pickTemplate(configuredTemplate, runtimeTemplate)
  const hasCredentials = Boolean(getVestaWorkspaceId() && getVestaAccessToken())

  const commitTemplate = (template: OttopilotEventContainerTemplate) => {
    onConfigBatchChange(nodeId, {
      templateId: template.id,
      templateDisplayName: template.displayName,
      cachedContainerTemplate: template,
    })
  }

  const handleFetchTemplates = async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await fetchEventContainerTemplates()
      const active = list.filter((template) => template.displayName)
      setTemplates(active)
      if (templateId) {
        const selected = active.find((template) => template.id === templateId)
        if (selected) {
          commitTemplate(selected)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (id: string) => {
    const selected = templates.find((template) => template.id === id)
    if (!selected) {
      onConfigBatchChange(nodeId, {
        templateId: '',
        templateDisplayName: '',
        cachedContainerTemplate: null,
      })
      return
    }
    commitTemplate(selected)
  }

  const physicalCount = cachedContainerTemplate
    ? getPhysicalColumns(cachedContainerTemplate).length
    : 0

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
          <span>Container template</span>
          <select
            className="nodrag nopan nowheel rounded border border-slate-300 px-2 py-1 text-xs"
            value={templateId}
            onChange={(e) => handleSelectTemplate(e.currentTarget.value)}
          >
            <option value="">Select a template…</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.displayName} ({shortId(template.id)})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {cachedContainerTemplate ? (
        <div className="rounded bg-slate-50 p-2 text-[10px] text-slate-600">
          <div>
            <strong>{cachedContainerTemplate.displayName}</strong>
          </div>
          <div>ID: {cachedContainerTemplate.id}</div>
          <div>{physicalCount} physical column port(s)</div>
        </div>
      ) : null}
    </div>
  )
}
