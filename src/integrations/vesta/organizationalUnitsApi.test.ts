import { describe, expect, it, vi, afterEach } from 'vitest'
import { plutoPaths } from './config'
import {
  fetchOrganizationalUnits,
  formatOrganizationalUnitLabel,
} from './organizationalUnitsApi'
import {
  OrganizationalUnitStatusActive,
  OrganizationalUnitTemplateStatusActive,
} from './types'

const DIRECT_VALUE = '👉fcb46858-4d6e-4afe-bc11-3cd88c580335👆'

describe('formatOrganizationalUnitLabel', () => {
  it('resolves label from OU template instanceDisplayNameTemplate', () => {
    expect(
      formatOrganizationalUnitLabel(
        {
          id: 'ou-1',
          templateId: 'tpl-pincode',
          parentId: null,
          status: OrganizationalUnitStatusActive,
          workspaceId: 'ws-1',
          additionalColumnValues: {
            'col-pincode': '560001',
            'col-city': 'Bangalore',
          },
        },
        [
          {
            id: 'tpl-pincode',
            displayName: 'Pincode OU',
            instanceDisplayNameTemplate: `${DIRECT_VALUE}col-pincode👈`,
            status: OrganizationalUnitTemplateStatusActive,
            parentId: null,
            workspaceId: 'ws-1',
            additionalColumns: [],
          },
        ],
      ),
    ).toBe('560001')
  })

  it('falls back to first column value when template is missing', () => {
    expect(
      formatOrganizationalUnitLabel({
        id: 'ou-1',
        templateId: 'tpl-1',
        parentId: null,
        status: OrganizationalUnitStatusActive,
        workspaceId: 'ws-1',
        additionalColumnValues: { 'col-name': 'Store A' },
      }),
    ).toBe('Store A')
  })
})

describe('fetchOrganizationalUnits', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches active organizational units via cacheable GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'ou-1',
            templateId: 'tpl-1',
            parentId: null,
            status: OrganizationalUnitStatusActive,
            workspaceId: 'ws-1',
            additionalColumnValues: { 'col-name': 'Store A' },
          },
          {
            id: 'ou-archived',
            templateId: 'tpl-1',
            parentId: null,
            status: 'archived-status',
            workspaceId: 'ws-1',
            additionalColumnValues: {},
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const units = await fetchOrganizationalUnits()
    expect(units).toHaveLength(1)
    expect(units[0]?.id).toBe('ou-1')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(plutoPaths.organizationalUnitsGetAll)
    expect(url).toContain('body=')
    expect(init.method).toBe('GET')
  })
})
