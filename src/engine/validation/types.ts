import type { ValidationErrorCode } from '../graph/enums'
import type { EdgeId, NodeId } from '../graph/ids'

export type ValidationError = {
  code: ValidationErrorCode
  message: string
  nodeId?: NodeId
  edgeId?: EdgeId
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] }
