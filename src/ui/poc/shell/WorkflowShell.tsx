import type { ReactNode } from 'react'

type Props = {
  sidebar: ReactNode
  workspace: ReactNode
  configPanel?: ReactNode
}

/**
 * Otto Engage layout: palette | canvas+drawer | optional config panel.
 */
export function WorkflowShell({ sidebar, workspace, configPanel }: Props) {
  return (
    <div className="workflow-shell">
      <div className="workflow-shell-main">
        {sidebar}
        <div className="workflow-shell-workspace">{workspace}</div>
        {configPanel}
      </div>
    </div>
  )
}
