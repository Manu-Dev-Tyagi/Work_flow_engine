import { useState } from 'react'
import Button from '@atlaskit/button/new'
import SectionMessage from '@atlaskit/section-message'
import Spinner from '@atlaskit/spinner'
import {
  fetchOrganizationalUnitDirectory,
  formatOrganizationalUnitLabel,
} from '../../integrations/vesta/organizationalUnitsApi'
import { getVestaAccessToken, getVestaWorkspaceId } from '../../integrations/vesta/config'
import type {
  OttopilotOrganizationalUnit,
  OttopilotOrganizationalUnitTemplate,
} from '../../integrations/vesta/types'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
}

function shortId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 8)}…`
}

export function CreateEventContainerConfig({ nodeId, configuration, onConfigBatchChange }: Props) {
  const [units, setUnits] = useState<OttopilotOrganizationalUnit[]>([])
  const [templates, setTemplates] = useState<OttopilotOrganizationalUnitTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const organizationalUnitId = String(configuration.organizationalUnitId ?? '')
  const organizationalUnitDisplayName = String(configuration.organizationalUnitDisplayName ?? '')
  const hasCredentials = Boolean(getVestaWorkspaceId() && getVestaAccessToken())

  const handleLoadUnits = async () => {
    setError(null)
    setLoading(true)
    try {
      const directory = await fetchOrganizationalUnitDirectory()
      setUnits(directory.units)
      setTemplates(directory.templates)
      if (organizationalUnitId) {
        const selected = directory.units.find((unit) => unit.id === organizationalUnitId)
        if (selected) {
          onConfigBatchChange(nodeId, {
            organizationalUnitDisplayName: formatOrganizationalUnitLabel(
              selected,
              directory.templates,
            ),
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUnit = (id: string) => {
    const selected = units.find((unit) => unit.id === id)
    if (!selected) {
      onConfigBatchChange(nodeId, {
        organizationalUnitId: '',
        organizationalUnitDisplayName: '',
      })
      return
    }
    onConfigBatchChange(nodeId, {
      organizationalUnitId: selected.id,
      organizationalUnitDisplayName: formatOrganizationalUnitLabel(selected, templates),
    })
  }

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
          onClick={() => void handleLoadUnits()}
          isDisabled={loading || !hasCredentials}
        >
          {loading ? <Spinner size="small" /> : 'Load organizational units'}
        </Button>
      </span>

      {error ? (
        <SectionMessage appearance="error">
          <p className="text-xs">{error}</p>
        </SectionMessage>
      ) : null}

      {units.length > 0 ? (
        <label className="nodrag nopan nowheel grid gap-1 text-xs text-slate-600">
          <span>Organizational unit</span>
          <select
            className="nodrag nopan nowheel rounded border border-slate-300 px-2 py-1 text-xs"
            value={organizationalUnitId}
            onChange={(e) => handleSelectUnit(e.currentTarget.value)}
          >
            <option value="">Select an organizational unit…</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {formatOrganizationalUnitLabel(unit, templates)} ({shortId(unit.id)})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {organizationalUnitId ? (
        <div className="rounded bg-slate-50 p-2 text-[10px] text-slate-600">
          <div>
            <strong>{organizationalUnitDisplayName || organizationalUnitId}</strong>
          </div>
          <div>ID: {organizationalUnitId}</div>
        </div>
      ) : null}
    </div>
  )
}
