import { createContext, useContext } from 'react'
import type { PortType } from '../../engine/graph/enums'

export type ConnectionDragState = {
  nodeId: string
  handleId: string
  handleType: 'source' | 'target'
  portType: PortType
} | null

const ConnectionDragContext = createContext<ConnectionDragState>(null)

export const ConnectionDragProvider = ConnectionDragContext.Provider

export function useConnectionDrag(): ConnectionDragState {
  return useContext(ConnectionDragContext)
}
