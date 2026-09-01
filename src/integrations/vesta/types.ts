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
  source?: OttopilotEventTemplateColumnSource
  configuration?: {
    options?: Array<{ id: Uuid; displayName: string }>
  }
}

export type OttopilotEventContainerTemplate = {
  id: Uuid
  displayName: string
  additionalColumns: OttopilotEventTemplateAdditionalColumn[]
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

export type OttopilotEventContainer = {
  id: Uuid
  templateId: Uuid
  revisionId: Uuid
  disposition: Uuid
  status: Uuid
  organizationalUnitId: Uuid
  additionalColumnValues: Record<Uuid, unknown>
  createdAt: string
  createdBy: Uuid
  updatedAt: string
  updatedBy: Uuid
}

export const OrganizationalUnitStatusActive = 'f39cd914-b2c4-476f-8be4-6fffecb4f812'
export const OrganizationalUnitTemplateStatusActive = 'b335555a-0e77-43de-b19e-770adc38bc5e'

export type OttopilotOrganizationalUnit = {
  id: Uuid
  templateId: Uuid
  parentId: Uuid | null
  status: Uuid
  workspaceId: Uuid
  additionalColumnValues: Record<Uuid, unknown>
  createdAt?: string
  createdBy?: Uuid
  updatedAt?: string
  updatedBy?: Uuid
}

export type OttopilotOrganizationalUnitTemplate = {
  id: Uuid
  displayName: string
  instanceDisplayNameTemplate: string
  status: Uuid
  parentId: Uuid | null
  workspaceId: Uuid
  additionalColumns: Array<{
    id: Uuid
    displayName: string
    type: Uuid
    configuration?: Record<string, unknown>
  }>
  configuration?: Record<string, unknown>
  description?: string | null
  createdAt?: string
  createdBy?: Uuid
  updatedAt?: string
  updatedBy?: Uuid
}

export type SimpleFilter = {
  column: string
  operator: string
  value: unknown
}

export type ComplexFilter = {
  filters: Array<ComplexFilter | SimpleFilter>
  logic: 'AND' | 'OR'
}
