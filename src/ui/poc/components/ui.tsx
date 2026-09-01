import type { ReactNode } from 'react'
import { CATEGORY_CHIP } from '../theme/tokens'

type StatusChipProps = {
  label: string
  tone: keyof typeof import('../theme/tokens').EXECUTION_STATUS_STYLES
}

export function StatusChip({ label, tone }: StatusChipProps) {
  const toneClass =
    tone === 'running'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : tone === 'waiting'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : tone === 'completed'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : tone === 'failed'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${toneClass}`}>
      {label}
    </span>
  )
}

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  )
}

export function PaletteItemButton({
  glyph,
  category,
  label,
  description,
  onClick,
}: {
  glyph: string
  category: keyof typeof CATEGORY_CHIP
  label: string
  description: string
  onClick: () => void
}) {
  const chip = CATEGORY_CHIP[category]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:shadow-sm"
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chip.bg} text-sm font-medium text-white`}
      >
        {glyph}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-slate-800">{label}</div>
        <div className="truncate text-[10.5px] text-slate-500">{description}</div>
      </div>
    </button>
  )
}
