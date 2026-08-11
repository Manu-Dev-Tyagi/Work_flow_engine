/** Fixed vocabularies for the dataflow engine. String enums keep Graph JSON readable. */

export enum PortType {
  Number = 'number',
  String = 'string',
  Object = 'object',
}

export enum NodeType {
  GenerateNumber = 'generateNumber',
  Addition = 'addition',
  GenerateString = 'generateString',
  Concatenation = 'concatenation',
  ApiRequest = 'apiRequest',
}

export enum WorkflowStatus {
  Idle = 'idle',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export enum NodeRuntimeStatus {
  Waiting = 'waiting',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export enum ValidationErrorCode {
  UnknownNodeType = 'UNKNOWN_NODE_TYPE',
  MissingNode = 'MISSING_NODE',
  CycleDetected = 'CYCLE_DETECTED',
  TypeMismatch = 'TYPE_MISMATCH',
  MissingRequiredInput = 'MISSING_REQUIRED_INPUT',
  DuplicateInputConnection = 'DUPLICATE_INPUT_CONNECTION',
  UnknownPort = 'UNKNOWN_PORT',
}

export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}
