# POC UI shell (temporary)

Mirrors **`ottoengage--prototype`** layout and styling. Replace when embedded in Vesta.

| Prototype | This repo (`src/ui/poc/`) |
|-----------|--------------------------|
| `Palette.jsx` | `shell/WorkflowSidebar.tsx` |
| `ConfigPanel.jsx` | `shell/WorkflowConfigPanel.tsx` |
| `JourneyNode.jsx` | `nodes/nodeDisplay.ts` + `ui/nodes/WorkflowNode.tsx` |
| `SimulationDrawer.jsx` | `shell/WorkflowBottomDrawer.tsx` |
| `shared/ui.jsx` | `components/ui.tsx` |
| `index.css` tokens | `theme/tokens.ts` + `index.css` |

**Hard boundary:** only edit files under `src/ui/poc/` and thin wiring in `App.tsx`. Never touch `src/engine/`, node execute logic, or Vesta APIs.

