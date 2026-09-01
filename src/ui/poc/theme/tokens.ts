/** Otto Engage–aligned category tokens (prototype mirror). */
export type NodeCategory = 'entry' | 'action' | 'logic' | 'exit'

export const CATEGORY_CHIP = {
  entry: { bg: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Entry' },
  action: { bg: 'bg-blue-500', badge: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Action' },
  logic: { bg: 'bg-purple-500', badge: 'text-purple-700 bg-purple-50 border-purple-200', label: 'Logic' },
  exit: { bg: 'bg-slate-500', badge: 'text-slate-700 bg-slate-100 border-slate-200', label: 'Exit' },
} as const

export const CATEGORY_STYLES = {
  entry: { header: 'bg-emerald-500', dot: 'bg-emerald-500', ring: 'ring-emerald-400' },
  action: { header: 'bg-blue-500', dot: 'bg-blue-500', ring: 'ring-blue-400' },
  logic: { header: 'bg-purple-500', dot: 'bg-purple-500', ring: 'ring-purple-400' },
  exit: { header: 'bg-slate-500', dot: 'bg-slate-500', ring: 'ring-slate-400' },
} as const

export const EXECUTION_STATUS_STYLES = {
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  idle: 'bg-slate-100 text-slate-600 border-slate-200',
} as const
