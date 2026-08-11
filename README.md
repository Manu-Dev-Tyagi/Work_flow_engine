# Workflow Execution Engine

Typed **dataflow DAG** workflow engine with a thin visualization UI.

## What matters

```
Graph JSON → Validation → Compiler → Runtime → ExecutionContext
```

The UI (React Flow + Atlaskit + Tailwind) only edits Graph JSON and renders execution results. It never implements engine logic.

## Run

```bash
npm install
npm test
npm run dev
```

## Demo

1. Add two **Generate Number** nodes (configure values, e.g. 5 and 10)
2. Add **Addition**
3. Connect outputs `a` → addition inputs `a` / `b`
4. Click **Run** — see execution order, edge values, and node I/O
5. Try connecting **Generate String** → **Addition** — blocked as type mismatch

## Layout rules

- Tailwind for shell layout using **CSS Grid** (no `flex` utilities in our layout)
- Atlaskit for buttons, fields, lozenges, section messages, spinner, headings
- React Flow only for the canvas surface
