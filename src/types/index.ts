export type Platform = 'Stripe' | 'Airbnb' | 'Shopify' | 'Twilio' | 'Zendesk' | 'HubSpot'
export type Category = 'B2B' | 'B2C'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Environment = 'production' | 'sandbox'

export interface ApiLog {
  id: string
  requestId: string
  timestamp: string
  method: HttpMethod
  endpoint: string
  statusCode: number
  responseTime: number
  platform: Platform
  category: Category
  organization: string
  environment: Environment
  apiVersion: string
  errorCode?: string
  errorMessage?: string
}

export interface TestScenario {
  id: string
  title: string
  description: string
  platform: Platform
  method: HttpMethod
  url: string
  headers: Record<string, string>
  apiVersion: string
  category: Category
  environment: Environment
  notes?: {
    checks: string[]
    likelyCause: string
    toCustomer: string
  }
}

export type AccountPlan = 'basic' | 'standard' | 'pro' | 'enterprise'
export type AccountStatus = 'active' | 'suspended' | 'rate_limited'

export interface RateLimits {
  requestsPerSecond: number
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
}

export interface Account {
  id: string
  name: string
  organization: string
  platform: Platform
  category: Category
  environment: Environment
  plan: AccountPlan
  status: AccountStatus
  rateLimits: RateLimits
  currentUsage: {
    today: number
    thisHour: number
    thisMinute: number
  }
  createdAt: string
  apiVersion: string
}

export interface RunResult {
  scenarioId: string
  statusCode: number
  responseTime: number
  responseBody: unknown
  requestId: string
  timestamp: string
  error?: string
}
