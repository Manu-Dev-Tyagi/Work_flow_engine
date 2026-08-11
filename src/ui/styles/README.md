# Workflow Execution Engine

Typed dataflow DAG engine with a thin React Flow + Atlassian Design System UI.

## Stack

- TypeScript engine: validate → compile → execute
- React Flow canvas (graph editing only)
- Atlaskit components for chrome
- Tailwind CSS for app shell layout (CSS Grid, no flex)

## Scripts

```bash
npm test      # engine unit tests
npm run dev   # UI
npm run build
```

## Architecture

`Graph JSON` → `validateGraph` → `compileGraph` → `execute` → `ExecutionContext`

UI only edits Graph JSON and calls `runWorkflow(graph, registry)`.
