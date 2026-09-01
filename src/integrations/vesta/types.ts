/** Simplified Ottopilot types aligned with Vesta vos-types. */

export type Uuid = string

export const PhysicalColumnSourceType = '87d5c3f4-7b66-484f-8053-d1213f6b9093'
export const ResolverColumnSourceType = '83a3fd2b-e99e-4527-a5f2-2f522470e17a'

export type OttopilotEventTemplateColumnSource =
  | { type: typeof PhysicalColumnSourceType; required: boolean; unique: boolean }
  | { type: typeof ResolverColumnSourceType; sql: string }

export type OttopilotEventTemplateAdditionalColumn = {
  id: Uuid
  displayName: string
  type: Uuid
  source: OttopilotEventTemplateColumnSource
  configuration?: {
    options?: Array<{ id: Uuid; displayName: string }>
  }
}

export type OttopilotEventTemplateConfiguration = {
  defaultDisposition?: Uuid
  dispositions?: Array<{ id: Uuid; displayName: string }>
  [key: string]: unknown
}

export type OttopilotEventTemplate = {
  id: Uuid
  displayName: string
  description: string | null
  eventContainerTemplateId: Uuid
  revisionId: Uuid
  status: Uuid
  additionalColumns: OttopilotEventTemplateAdditionalColumn[]
  configuration: OttopilotEventTemplateConfiguration
  createdAt?: string
  createdBy?: Uuid
  updatedAt?: string
  updatedBy?: Uuid
}

export type OttopilotApiContext = {
  baseUrl: string
  workspaceId: Uuid
  accessToken: string
}
