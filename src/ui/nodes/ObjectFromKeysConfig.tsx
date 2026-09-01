import { OTTOPILOT_RESPONSE_FIELD_PRESETS } from '../../nodes/objectFromKeys'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigChange: (nodeId: string, key: string, value: unknown) => void
}

function fieldOptions(current: string): string[] {
  const presets = [...OTTOPILOT_RESPONSE_FIELD_PRESETS]
  if (current && !presets.includes(current as (typeof presets)[number])) {
    return [current, ...presets]
  }
  return presets
}

function ResponseKeySelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const options = fieldOptions(value)
  return (
    <label className="nodrag nopan nowheel grid gap-1 text-xs text-slate-600">
      <span>{label}</span>
      <select
        className="nodrag nopan nowheel rounded border border-slate-300 px-2 py-1 text-xs"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      >
        <option value="">Select response property…</option>
        {options.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ObjectFromKeysConfig({ nodeId, configuration, onConfigChange }: Props) {
  const firstKey = String(configuration.firstKey ?? '')
  const secondKey = String(configuration.secondKey ?? '')

  return (
    <div className="nodrag nopan nowheel grid gap-2">
      <p className="text-[10px] text-slate-500">
        Maps wired string inputs to JSON keys on the HTTP response body.
      </p>
      <ResponseKeySelect
        label="First response key"
        value={firstKey}
        onChange={(next) => onConfigChange(nodeId, 'firstKey', next)}
      />
      <ResponseKeySelect
        label="Second response key"
        value={secondKey}
        onChange={(next) => onConfigChange(nodeId, 'secondKey', next)}
      />
    </div>
  )
}
