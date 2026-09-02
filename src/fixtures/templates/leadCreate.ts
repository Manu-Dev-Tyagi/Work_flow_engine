import { NodeType } from '../../engine/graph/enums'
import type { Graph } from '../../engine/graph/types'

/** Stable ids so tests and docs can reference this template. */
export const LEAD_CREATE_TEMPLATE_IDS = {
  graph: 'a1000001-0001-4001-8001-000000000001',
  apiRequest: 'a1000001-0001-4001-8001-000000000011',
  getTemplate: 'a1000001-0001-4001-8001-000000000013',
  getContainerTemplate: 'a1000001-0001-4001-8001-00000000001b',
  findContainer: 'a1000001-0001-4001-8001-000000000014',
  switchEmpty: 'a1000001-0001-4001-8001-000000000015',
  createContainer: 'a1000001-0001-4001-8001-000000000016',
  merge: 'a1000001-0001-4001-8001-000000000017',
  createEvent: 'a1000001-0001-4001-8001-000000000018',
  objectFromKeys: 'a1000001-0001-4001-8001-000000000019',
  httpRespond: 'a1000001-0001-4001-8001-00000000001a',
  eApiFindMatch: 'a1000001-0001-4001-8001-000000000021',
  eApiContainerFields: 'a1000001-0001-4001-8001-000000000022',
  eApiEventFields: 'a1000001-0001-4001-8001-000000000023',
  eTplFindTpl: 'a1000001-0001-4001-8001-000000000024',
  eTplCreateContainerTpl: 'a1000001-0001-4001-8001-000000000025',
  eTplEventTpl: 'a1000001-0001-4001-8001-000000000026',
  eTplEventCols: 'a1000001-0001-4001-8001-000000000027',
  eContainerColsCreate: 'a1000001-0001-4001-8001-000000000028',
  eFindSwitch: 'a1000001-0001-4001-8001-000000000029',
  eSwitchGate: 'a1000001-0001-4001-8001-00000000002a',
  eSwitchMergeA: 'a1000001-0001-4001-8001-00000000002b',
  eCreateContainerMerge: 'a1000001-0001-4001-8001-00000000002c',
  eMergeCreateEvent: 'a1000001-0001-4001-8001-00000000002d',
  eMergeObjectFirst: 'a1000001-0001-4001-8001-00000000002e',
  eEventObjectSecond: 'a1000001-0001-4001-8001-00000000002f',
  eObjectRespond: 'a1000001-0001-4001-8001-000000000030',
  eTplDispositionEvent: 'a1000001-0001-4001-8001-000000000031',
  eTplDispositionContainer: 'a1000001-0001-4001-8001-000000000032',
  eContainerColsEventTpl: 'a1000001-0001-4001-8001-000000000033',
  eContainerTplEventTpl: 'a1000001-0001-4001-8001-000000000034',
  eFindContainerCreateEvent: 'a1000001-0001-4001-8001-000000000035',
  eTplTemplateCreateEvent: 'a1000001-0001-4001-8001-000000000036',
  eContainerTplCreateEvent: 'a1000001-0001-4001-8001-000000000037',
} as const

/**
 * Amaron external lead/create required: contactNumber, customerState, utmPlatform.
 * Journeys NOT NULL columns (generic create) also need leadCategory + leadStatus UUIDs.
 * Keys use camelCase matching Get Event Container Template port names.
 */
export const LEAD_CREATE_TRIGGER_BODY: Record<string, unknown> = {
  contactNumber: '+911234567890',
  /** Required when the event template has a physical "Order ID" column. */
  orderId: 'order-WE-001',
  customerName: 'Testing Workflow Engine',
  customerState: 'Karnataka',
  customerCity: 'Bangalore',
  customerHouseNo: '42 Test Street',
  utmPlatform: 'testing-workflow-engine',
  utmSource: 'organic website',
  utmMedium: 'workflow',
  utmCampaign: 'poc',
  whatsappConsent: 'Yes',
  termsPrivacyConsent: 'Yes',
  leadCategory: '29a96708-c6d5-4f73-b1bb-007516199939',
  leadStatus: 'c93262f3-58fc-4d64-9de9-afed9e3fa561',
  /** Amaron Enquiry event — required NOT NULL (Open on new lead). */
  enquiryStatus: '3641d0ee-f9c3-4e2c-8d33-456164d0f73e',
  /** Amaron Calls event — Call Status (Scheduled). */
  callStatus: 'ce092834-766b-4426-857a-240a60976d3b',
}

/** Amaron enquiry status option UUIDs (vos-types AmaronEnquiryStatusEnum). */
export const AMARON_ENQUIRY_STATUS = {
  OPEN: '3641d0ee-f9c3-4e2c-8d33-456164d0f73e',
  DUPLICATE: 'b7e2cb79-6ef4-4b66-8850-67d064125a7d',
} as const

/** Amaron Call template — Call Status column option UUIDs. */
export const AMARON_CALL_STATUS = {
  SCHEDULED: 'ce092834-766b-4426-857a-240a60976d3b',
  LOGGED: '966c78c7-2364-4db5-b934-8a9c285e57a2',
  CANCELLED: 'd460914b-9f5e-42de-8a90-1f84f2754c6f',
  ARCHIVE: '38023cc9-68b8-440a-8e87-7d7f1f522bd2',
} as const

export const LEAD_CREATE_TRIGGER_JSON = JSON.stringify(LEAD_CREATE_TRIGGER_BODY, null, 2)

/**
 * Cap UC1-style flow: API in → find-or-create Lead → create Enquiry event → HTTP out.
 *
 * Before Run:
 * 1. Get Event Template → Load templates → pick your event template
 * 2. Get Event Container Template → Load templates → pick Journeys
 * 3. Find Event Container → select match column (Contact Number)
 * 4. Create Event Container → Load organizational units → pick OU
 * 5. Toolbar JSON — edit fields to match your trigger payload (camelCase keys)
 *
 * Repeat lead (same contactNumber): Find returns existing Journey; set enquiryStatus (and
 * other event fields) in the API Request JSON — e.g. DUPLICATE status UUID for repeat leads.
 */
export const leadCreateTemplate: Graph = {
  id: LEAD_CREATE_TEMPLATE_IDS.graph,
  nodes: [
    {
      id: LEAD_CREATE_TEMPLATE_IDS.apiRequest,
      type: NodeType.ApiRequest,
      position: { x: 0, y: 120 },
      configuration: {
        sampleBody: LEAD_CREATE_TRIGGER_JSON,
        matchField: 'contactNumber',
      },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.getTemplate,
      type: NodeType.GetEventTemplate,
      position: { x: 0, y: 320 },
      configuration: {
        templateId: '',
        templateDisplayName: '',
        cachedTemplate: null,
      },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate,
      type: NodeType.GetEventContainerTemplate,
      position: { x: 0, y: 480 },
      configuration: {
        templateId: '',
        templateDisplayName: '',
        cachedContainerTemplate: null,
      },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.findContainer,
      type: NodeType.FindEventContainer,
      position: { x: 480, y: 120 },
      configuration: {
        matchColumnId: '',
        matchColumnDisplayName: '',
      },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.switchEmpty,
      type: NodeType.SwitchEmpty,
      position: { x: 720, y: 120 },
      configuration: {},
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.createContainer,
      type: NodeType.CreateEventContainer,
      position: { x: 720, y: 320 },
      configuration: { organizationalUnitId: '', organizationalUnitDisplayName: '' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.merge,
      type: NodeType.MergeString,
      position: { x: 960, y: 120 },
      configuration: {},
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.createEvent,
      type: NodeType.CreateEvent,
      position: { x: 1200, y: 120 },
      configuration: {},
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.objectFromKeys,
      type: NodeType.ObjectFromKeys,
      position: { x: 1440, y: 120 },
      configuration: {
        firstKey: 'eventContainerId',
        secondKey: 'eventId',
      },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.httpRespond,
      type: NodeType.HttpRespond,
      position: { x: 1680, y: 120 },
      configuration: { statusCode: 200 },
    },
  ],
  edges: [
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eApiFindMatch,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.apiRequest, port: 'matchValue' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.findContainer, port: 'matchValue' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eApiContainerFields,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.apiRequest, port: 'body' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'fields' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eApiEventFields,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.apiRequest, port: 'body' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'fields' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eContainerColsEventTpl,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'columnValues' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'containerColumnValues' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eContainerTplEventTpl,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'template' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'containerTemplate' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplFindTpl,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'templateId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.findContainer, port: 'templateId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplCreateContainerTpl,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'templateId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createContainer, port: 'templateId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplEventTpl,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'templateId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'templateId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplEventCols,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'columnValues' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'columnValues' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eContainerColsCreate,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'columnValues' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createContainer, port: 'columnValues' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplDispositionContainer,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'defaultDisposition' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createContainer, port: 'disposition' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eFindSwitch,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.findContainer, port: 'eventContainerId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.switchEmpty, port: 'containerId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eSwitchGate,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.switchEmpty, port: 'whenNotFound' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createContainer, port: 'gate' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eSwitchMergeA,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.switchEmpty, port: 'whenFound' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.merge, port: 'existingId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eCreateContainerMerge,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createContainer, port: 'eventContainerId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.merge, port: 'createdId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eMergeCreateEvent,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.merge, port: 'containerId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'eventContainerId' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eMergeObjectFirst,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.merge, port: 'containerId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.objectFromKeys, port: 'first' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eEventObjectSecond,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'eventId' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.objectFromKeys, port: 'second' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplDispositionEvent,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'defaultDisposition' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'disposition' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eFindContainerCreateEvent,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.findContainer, port: 'container' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'container' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eTplTemplateCreateEvent,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getTemplate, port: 'template' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'eventTemplate' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eContainerTplCreateEvent,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.getContainerTemplate, port: 'template' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.createEvent, port: 'containerTemplate' },
    },
    {
      id: LEAD_CREATE_TEMPLATE_IDS.eObjectRespond,
      source: { nodeId: LEAD_CREATE_TEMPLATE_IDS.objectFromKeys, port: 'object' },
      target: { nodeId: LEAD_CREATE_TEMPLATE_IDS.httpRespond, port: 'body' },
    },
  ],
}
