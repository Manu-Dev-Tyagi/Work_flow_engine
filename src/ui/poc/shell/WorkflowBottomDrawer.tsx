import { useEffect, useState, type ReactNode } from 'react'
import { StatusChip } from '../components/ui'

type Props = {
  children: ReactNode
  isRunning: boolean
  hasExecution: boolean
}

/** Bottom execution panel — mirrors ottoengage SimulationDrawer tone. */
export function WorkflowBottomDrawer({ children, isRunning, hasExecution }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hasExecution || isRunning) setOpen(true)
  }, [hasExecution, isRunning])

  if (!open) {
    return (
      <div className="flex h-10 shrink-0 items-center justify-between rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
        <span className="text-xs font-semibold text-slate-700">Execution</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Show panel
        </button>
      </div>
    )
  }

  return (
    <section className="flex max-h-[min(42vh,520px)] min-h-[180px] shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Execution</span>
          {isRunning ? <StatusChip label="Running" tone="running" /> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Hide panel
        </button>
      </header>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="workflow-execution-body">{children}</div>
      </div>
    </section>
  )
}
