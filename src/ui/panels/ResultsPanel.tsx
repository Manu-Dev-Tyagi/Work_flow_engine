import Heading from '@atlaskit/heading'
import Lozenge from '@atlaskit/lozenge'
import SectionMessage from '@atlaskit/section-message'
import Spinner from '@atlaskit/spinner'
import { NodeRuntimeStatus, WorkflowStatus } from '../../engine/graph/enums'
import type { Registry } from '../../engine/registry/registry'
import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import type { ConnectionMessage } from '../state/graphStore'

type Props = {
  graph: Graph
  registry?: Registry
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

function nodeStatusAppearance(
  status: NodeRuntimeStatus,
): 'default' | 'inprogress' | 'success' | 'removed' {
  switch (status) {
    case NodeRuntimeStatus.Completed:
      return 'success'
    case NodeRuntimeStatus.Running:
      return 'inprogress'
    case NodeRuntimeStatus.Failed:
      return 'removed'
    default:
      return 'default'
  }
}

export function ResultsPanel({
  graph,
  registry,
  execution,
  connectionMessage,
  isRunning,
}: Props) {
  const nodeLabel = (type: Graph['nodes'][number]['type']) =>
    registry?.get(type)?.label ?? type

  const nodeCards = graph.nodes.map((node) => {
    const result = execution?.results[node.id]
    const status = execution?.nodeStatuses[node.id] ?? NodeRuntimeStatus.Waiting

    return (
      <article
        key={node.id}
        className="grid min-w-[260px] max-w-[320px] shrink-0 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <strong className="truncate text-xs">{nodeLabel(node.type)}</strong>
          <Lozenge appearance={nodeStatusAppearance(status)}>{status}</Lozenge>
        </div>
        {result ? (
          <>
            <div className="grid gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Input
              </span>
              <pre className="max-h-24 overflow-auto rounded bg-white p-2 text-[10px]">
                {JSON.stringify(result.input, null, 2)}
              </pre>
            </div>
            <div className="grid gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Output
              </span>
              <pre className="max-h-24 overflow-auto rounded bg-white p-2 text-[10px]">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
            <p className="text-[10px] text-slate-500">{result.durationMs.toFixed(1)} ms</p>
          </>
        ) : status === NodeRuntimeStatus.Skipped ? (
          <p className="text-xs text-slate-500">Skipped (branch not taken)</p>
        ) : (
          <p className="text-xs text-slate-500">No result yet</p>
        )}
      </article>
    )
  })

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        {execution ? (
          <Lozenge appearance={workflowAppearance(execution.status)}>{execution.status}</Lozenge>
        ) : (
          <Lozenge>idle</Lozenge>
        )}
        {isRunning ? <Spinner size="small" /> : null}
      </div>

      {connectionMessage ? (
        <SectionMessage title={connectionMessage.code} appearance="warning">
          <p>{connectionMessage.message}</p>
        </SectionMessage>
      ) : null}

      {execution?.httpResponse ? (
        <SectionMessage title="HTTP response" appearance="success">
          <p className="text-xs">Status {execution.httpResponse.status}</p>
          <pre className="max-h-32 overflow-auto text-[11px]">
            {JSON.stringify(execution.httpResponse.body, null, 2)}
          </pre>
        </SectionMessage>
      ) : null}

      {execution?.error ? (
        <SectionMessage title={execution.error.code ?? 'Error'} appearance="error">
          <p>{execution.error.message}</p>
        </SectionMessage>
      ) : null}

      {execution?.executionOrder.length ? (
        <div className="grid gap-2">
          <Heading size="xsmall">Execution order</Heading>
          <p className="text-xs text-slate-600">
            {execution.executionOrder
              .map((nodeId, index) => {
                const node = graph.nodes.find((n) => n.id === nodeId)
                return `${index + 1}. ${node ? nodeLabel(node.type) : nodeId}`
              })
              .join(' → ')}
          </p>
        </div>
      ) : null}

      {graph.nodes.length > 0 ? (
        <div className="grid gap-3">
          <Heading size="xsmall">Node results</Heading>
          <div className="workflow-execution-cards">{nodeCards}</div>
        </div>
      ) : (
        <SectionMessage title="Empty graph">
          <p>Add nodes from the left palette, connect ports, then Run.</p>
        </SectionMessage>
      )}
    </div>
  )
}
