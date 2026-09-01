import { useState } from 'react'

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
}

function formatOverrides(configuration: Record<string, unknown>): string {
  const overrides = configuration.existingContainerFieldOverrides
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return '{}'
  }
  return JSON.stringify(overrides, null, 2)
}

function parseOverrides(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '{}') {
    return {}
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function CreateEventConfig({ nodeId, configuration, onConfigBatchChange }: Props) {
  const committed = formatOverrides(configuration)
  const [draft, setDraft] = useState(committed)
  const [seenCommitted, setSeenCommitted] = useState(committed)
  const [parseError, setParseError] = useState<string | null>(null)

  if (committed !== seenCommitted) {
    setSeenCommitted(committed)
    if (draft === seenCommitted) {
      setDraft(committed)
    }
  }

  const overrides = configuration.existingContainerFieldOverrides
  const overrideEntries =
    overrides && typeof overrides === 'object' && !Array.isArray(overrides)
      ? Object.entries(overrides as Record<string, unknown>)
      : []

  const commit = (raw: string) => {
    const parsed = parseOverrides(raw)
    if (parsed === null) {
      setParseError('Invalid JSON — use an object like { "enquiryStatus": "…" }')
      return
    }
    setParseError(null)
    onConfigBatchChange(nodeId, { existingContainerFieldOverrides: parsed })
  }

  return (
    <div className="nodrag nopan nowheel grid gap-3">
      <p className="text-[11px] leading-relaxed text-slate-600">
        Used on the <strong>repeat-lead path</strong> when an existing journey container is wired
        in. Column values are copied from that container, then these overrides are applied (keys
        match template column port names, e.g. <code className="text-[10px]">enquiryStatus</code>
        ).
      </p>

      {overrideEntries.length > 0 ? (
        <div className="grid gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Active overrides
          </span>
          {overrideEntries.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[auto_1fr] gap-2 text-xs text-slate-700">
              <span className="font-medium text-slate-800">{key}</span>
              <span className="truncate font-mono text-[10px] text-slate-600" title={String(value)}>
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">No overrides — event uses copied column values as-is.</p>
      )}

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-600">Existing container field overrides (JSON)</span>
        <textarea
          className="min-h-[96px] rounded-md border border-slate-200 p-2.5 font-mono text-[11px] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          value={draft}
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.currentTarget.value)
            setParseError(null)
          }}
          onBlur={() => commit(draft)}
        />
      </label>
      {parseError ? <p className="text-[11px] text-rose-600">{parseError}</p> : null}
    </div>
  )
}
