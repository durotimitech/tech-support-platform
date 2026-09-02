import type { ApiLog, Platform, Category, HttpMethod, Environment } from '../types'

const PLATFORMS: Platform[] = ['Stripe', 'Airbnb', 'Shopify', 'Twilio', 'Zendesk', 'HubSpot']
const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const CATEGORIES: Category[] = ['B2B', 'B2C']
const ENVIRONMENTS: Environment[] = ['production', 'sandbox']

const ENDPOINTS: Record<Platform, string[]> = {
  Stripe: [
    '/v1/customers', '/v1/charges', '/v1/payment_intents', '/v1/subscriptions',
    '/v1/invoices', '/v1/refunds', '/v1/products', '/v1/prices',
    '/v1/payment_methods', '/v1/events',
  ],
  Airbnb: [
    '/v2/listings', '/v2/reservations', '/v2/messages', '/v2/reviews',
    '/v2/users', '/v2/calendar', '/v2/pricing',
  ],
  Shopify: [
    '/admin/api/orders.json', '/admin/api/products.json', '/admin/api/customers.json',
    '/admin/api/inventory_items.json', '/admin/api/fulfillments.json',
    '/admin/api/discounts.json', '/admin/api/webhooks.json',
  ],
  Twilio: [
    '/2010-04-01/Accounts/messages', '/2010-04-01/Accounts/calls',
    '/2010-04-01/Accounts/recordings', '/2010-04-01/Accounts/notifications',
  ],
  Zendesk: [
    '/api/v2/tickets', '/api/v2/users', '/api/v2/organizations',
    '/api/v2/macros', '/api/v2/views', '/api/v2/triggers',
  ],
  HubSpot: [
    '/crm/v3/objects/contacts', '/crm/v3/objects/deals', '/crm/v3/objects/companies',
    '/crm/v3/objects/tickets', '/marketing/v3/emails', '/cms/v3/pages',
  ],
}

const ORGS = [
  'Acme Corp', 'VaultPay', 'StayEasy Ltd', 'Merch World', 'PingApp Inc',
  'Helpora', 'GrowthLabs', 'TravelNow', 'ShipFast', 'NovaTech',
  'BlueSky Ventures', 'Ironclad Systems', 'Cascade Labs', 'Driftwood Co',
]

const API_VERSIONS: Record<Platform, string> = {
  Stripe:   '2024-06-20',
  Airbnb:   'v2',
  Shopify:  '2024-01',
  Twilio:   '2010-04-01',
  Zendesk:  'v2',
  HubSpot:  'v3',
}

// Weighted toward 200 to simulate a healthy prod environment
const STATUS_POOL = [
  200, 200, 200, 200, 200, 200, 200,
  201, 201, 201,
  204,
  400,
  401,
  404,
  422,
  429,
  500,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomLog(anchorTimestamp: string): ApiLog {
  const platform = pick(PLATFORMS)
  const statusCode = pick(STATUS_POOL)
  const isError = statusCode >= 400

  const errorMap: Record<number, { code: string; message: string }> = {
    400: { code: 'parameter_invalid', message: 'Invalid parameter value.' },
    401: { code: 'api_key_invalid', message: 'No such API key.' },
    404: { code: 'resource_not_found', message: 'No such resource exists.' },
    422: { code: 'unprocessable_entity', message: 'Required field missing.' },
    429: { code: 'rate_limit', message: 'Too many requests.' },
    500: { code: 'server_error', message: 'An unexpected error occurred.' },
  }

  // Scatter timestamp within ±30 seconds of anchor
  const offset = rand(-30000, 30000)
  const ts = new Date(new Date(anchorTimestamp).getTime() + offset).toISOString()

  return {
    id: crypto.randomUUID(),
    requestId: 'req_' + Math.random().toString(36).slice(2, 12),
    timestamp: ts,
    method: pick(METHODS),
    endpoint: pick(ENDPOINTS[platform]),
    statusCode,
    responseTime: rand(40, 900),
    platform,
    category: pick(CATEGORIES),
    organization: pick(ORGS),
    environment: pick(ENVIRONMENTS),
    apiVersion: API_VERSIONS[platform],
    ...(isError && errorMap[statusCode]
      ? { errorCode: errorMap[statusCode].code, errorMessage: errorMap[statusCode].message }
      : {}),
  }
}

export function generateNoiseForRun(anchorTimestamp: string, count = 10): ApiLog[] {
  return Array.from({ length: count }, () => generateRandomLog(anchorTimestamp))
}
