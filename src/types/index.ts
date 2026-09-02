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
