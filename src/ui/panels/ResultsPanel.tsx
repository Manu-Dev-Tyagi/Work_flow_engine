import Heading from '@atlaskit/heading'
import Lozenge from '@atlaskit/lozenge'
import SectionMessage from '@atlaskit/section-message'
import Spinner from '@atlaskit/spinner'
import {
  NodeRuntimeStatus,
  WorkflowStatus,
} from '../../engine/graph/enums'
import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import type { ConnectionMessage } from '../state/graphStore'

type Props = {
  graph: Graph
  execution: ExecutionContext | null
  connectionMessage: ConnectionMessage
  isRunning: boolean
}

function workflowAppearance(
  status: WorkflowStatus,
): 'default' | 'inprogress' | 'success' | 'removed' {
  switch (status) {
    case WorkflowStatus.Running:
      return 'inprogress'
    case WorkflowStatus.Completed:
      return 'success'
    case WorkflowStatus.Failed:
      return 'removed'
    default:
      return 'default'
  }
}

export function ResultsPanel({
  graph,
  execution,
  connectionMessage,
  isRunning,
}: Props) {
  return (
    <aside className="grid grid-rows-[auto_auto_1fr] gap-3 overflow-auto border-l border-slate-200 bg-white p-4">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Heading size="small">Execution</Heading>
        {isRunning ? <Spinner size="small" /> : null}
        {execution ? (
          <Lozenge appearance={workflowAppearance(execution.status)}>
            {execution.status}
          </Lozenge>
        ) : (
          <Lozenge>idle</Lozenge>
        )}
      </div>

      {connectionMessage ? (
        <SectionMessage title={connectionMessage.code} appearance="warning">
          <p>{connectionMessage.message}</p>
        </SectionMessage>
      ) : null}

      {execution?.error ? (
        <SectionMessage title={execution.error.code ?? 'Error'} appearance="error">
          <p>{execution.error.message}</p>
        </SectionMessage>
      ) : null}

      <div className="grid gap-3 content-start">
        {execution?.executionOrder.length ? (
          <div className="grid gap-1">
            <Heading size="xsmall">Order</Heading>
            <ol className="list-decimal pl-5 text-sm text-slate-700">
              {execution.executionOrder.map((nodeId, index) => {
                const node = graph.nodes.find((n) => n.id === nodeId)
                return (
                  <li key={nodeId}>
                    {index + 1}. {node?.type ?? nodeId}
                  </li>
                )
              })}
            </ol>
          </div>
        ) : null}

        {graph.nodes.map((node) => {
          const result = execution?.results[node.id]
          const status =
            execution?.nodeStatuses[node.id] ?? NodeRuntimeStatus.Waiting
          return (
            <div
              key={node.id}
              className="grid gap-1 rounded border border-slate-200 p-2 text-sm"
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <strong>{node.type}</strong>
                <Lozenge
                  appearance={
                    status === NodeRuntimeStatus.Completed
                      ? 'success'
                      : status === NodeRuntimeStatus.Running
                        ? 'inprogress'
                        : status === NodeRuntimeStatus.Failed
                          ? 'removed'
                          : 'default'
                  }
                >
                  {status}
                </Lozenge>
              </div>
              {result ? (
                <>
                  <div>
                    <span className="text-xs text-slate-500">Input</span>
                    <pre className="overflow-auto bg-slate-50 p-1 text-[11px]">
                      {JSON.stringify(result.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Output</span>
                    <pre className="overflow-auto bg-slate-50 p-1 text-[11px]">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>
                  <div className="text-xs text-slate-500">
                    Duration: {result.durationMs.toFixed(2)}ms
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">No result yet</p>
              )}
            </div>
          )
        })}

        {execution && Object.keys(execution.edgeValues).length > 0 ? (
          <div className="grid gap-1">
            <Heading size="xsmall">Edge values</Heading>
            <pre className="overflow-auto rounded bg-slate-50 p-2 text-[11px]">
              {JSON.stringify(execution.edgeValues, null, 2)}
            </pre>
          </div>
        ) : null}

        {!execution && graph.nodes.length === 0 ? (
          <SectionMessage title="Empty graph">
            <p>Add nodes from the left palette, connect ports, then Run.</p>
          </SectionMessage>
        ) : null}
      </div>
    </aside>
  )
}
