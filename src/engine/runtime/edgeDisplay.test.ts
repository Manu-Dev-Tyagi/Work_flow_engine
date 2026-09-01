import { describe, expect, it } from 'vitest'
import { NodeType, PortType } from '../graph/enums'
import { formatEdgeDisplayValue } from './edgeDisplay'

const templateNode = {
  id: 'node-1',
  type: NodeType.GetEventTemplate,
  position: { x: 0, y: 0 },
  configuration: {
    templateId: 'tpl-uuid',
    templateDisplayName: 'Enquiry',
    cachedTemplate: null,
  },
}

describe('formatEdgeDisplayValue', () => {
  it('resolves templateId to display name from output', () => {
    expect(
      formatEdgeDisplayValue({
        sourceNode: templateNode,
        sourcePort: 'templateId',
        portType: PortType.String,
        value: 'tpl-uuid',
        output: { displayName: 'Enquiry', templateId: 'tpl-uuid' },
      }),
    ).toBe('Enquiry')
  })

  it('resolves templateId from node configuration when output has no displayName', () => {
    expect(
      formatEdgeDisplayValue({
        sourceNode: templateNode,
        sourcePort: 'templateId',
        portType: PortType.String,
        value: 'tpl-uuid',
        output: { templateId: 'tpl-uuid' },
      }),
    ).toBe('Enquiry')
  })

  it('shortens opaque UUID strings', () => {
    expect(
      formatEdgeDisplayValue({
        sourceNode: {
          id: 'n',
          type: NodeType.CreateEvent,
          position: { x: 0, y: 0 },
          configuration: {},
        },
        sourcePort: 'eventId',
        portType: PortType.String,
        value: 'b7e2cb79-6ef4-4b66-8850-67d064125a7d',
        output: { eventId: 'b7e2cb79-6ef4-4b66-8850-67d064125a7d' },
      }),
    ).toBe('Event b7e2cb79…')
  })

  it('summarizes column values with select option labels', () => {
    const template = {
      id: 'tpl',
      displayName: 'Enquiry',
      additionalColumns: [
        {
          id: 'status-col',
          displayName: 'Enquiry Status',
          type: 'e010f1f3-3ae3-4e48-96e8-3dfba6b217c9',
          configuration: {
            options: [
              { id: 'open-id', displayName: 'Open' },
              { id: 'dup-id', displayName: 'Duplicate' },
            ],
          },
        },
      ],
    }

    expect(
      formatEdgeDisplayValue({
        sourceNode: templateNode,
        sourcePort: 'columnValues',
        portType: PortType.Object,
        value: { 'status-col': 'dup-id' },
        output: { template, columnValues: { 'status-col': 'dup-id' } },
      }),
    ).toBe('Enquiry Status=Duplicate')
  })

  it('shows not found for empty eventContainerId', () => {
    expect(
      formatEdgeDisplayValue({
        sourceNode: {
          id: 'n',
          type: NodeType.FindEventContainer,
          position: { x: 0, y: 0 },
          configuration: {},
        },
        sourcePort: 'eventContainerId',
        portType: PortType.String,
        value: '',
        output: { eventContainerId: '', container: {} },
      }),
    ).toBe('(not found)')
  })

  it('summarizes trigger body objects by keys', () => {
    expect(
      formatEdgeDisplayValue({
        sourceNode: {
          id: 'n',
          type: NodeType.ApiRequest,
          position: { x: 0, y: 0 },
          configuration: {},
        },
        sourcePort: 'body',
        portType: PortType.Object,
        value: { contactNumber: '+911', customerName: 'Ada' },
        output: { body: { contactNumber: '+911', customerName: 'Ada' } },
      }),
    ).toBe('{contactNumber, customerName}')
  })
})
