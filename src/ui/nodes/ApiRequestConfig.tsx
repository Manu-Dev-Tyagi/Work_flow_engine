import { useRef, useState } from 'react'
import { DebouncedTextField } from './DebouncedTextField'

const COMMIT_MS = 250

type Props = {
  nodeId: string
  configuration: Record<string, unknown>
  onConfigChange: (nodeId: string, key: string, value: unknown) => void
}

export function ApiRequestConfig({ nodeId, configuration, onConfigChange }: Props) {
  const committed = String(configuration.sampleBody ?? '')
  const [draft, setDraft] = useState(committed)
  const [seenCommitted, setSeenCommitted] = useState(committed)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const endpointUrl = String(configuration.endpointUrl ?? '')
  const httpMethod = String(configuration.httpMethod ?? 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET'
  const matchField = String(configuration.matchField ?? 'contactNumber')

  if (committed !== seenCommitted) {
    setSeenCommitted(committed)
    if (draft === seenCommitted) {
      setDraft(committed)
    }
  }

  const commitBody = (raw: string) => {
    if (raw === committed) return
    onConfigChange(nodeId, 'sampleBody', raw)
  }

  return (
    <div className="nodrag nopan nowheel grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-600">API endpoint URL</span>
        <DebouncedTextField
          name={`${nodeId}-endpointUrl`}
          committedValue={endpointUrl}
          placeholder="https://api.example.com/leads"
          onCommit={(raw) => onConfigChange(nodeId, 'endpointUrl', raw)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-600">HTTP method</span>
        <select
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          value={httpMethod}
          onChange={(event) => onConfigChange(nodeId, 'httpMethod', event.currentTarget.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-600">Match field</span>
        <DebouncedTextField
          name={`${nodeId}-matchField`}
          committedValue={matchField}
          placeholder="contactNumber"
          onCommit={(raw) => onConfigChange(nodeId, 'matchField', raw)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-600">
          {endpointUrl.trim() ? 'Request JSON (POST body / fallback)' : 'Request JSON (trigger body)'}
        </span>
        <textarea
          className="min-h-[120px] rounded-md border border-slate-200 bg-white p-2.5 font-mono text-[11px] leading-snug focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          value={draft}
          spellCheck={false}
          onChange={(event) => {
            const raw = event.currentTarget.value
            setDraft(raw)
            if (timerRef.current !== undefined) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
              timerRef.current = undefined
              commitBody(raw)
            }, COMMIT_MS)
          }}
          onBlur={() => {
            if (timerRef.current !== undefined) {
              clearTimeout(timerRef.current)
              timerRef.current = undefined
            }
            commitBody(draft)
          }}
        />
      </label>

      <p className="text-[11px] leading-relaxed text-slate-500">
        On <strong>Run</strong>: if an endpoint URL is set, the node fetches it and uses the JSON
        response as <code className="text-[10px]">body</code>. Otherwise it uses the request JSON
        above. Outputs <code className="text-[10px]">body</code> and{' '}
        <code className="text-[10px]">matchValue</code>.
      </p>
    </div>
  )
}
