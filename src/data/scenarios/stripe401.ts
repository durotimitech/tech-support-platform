import type { TestScenario } from '../../types'

export const stripe401Scenarios: TestScenario[] = [
  {
    id: 'stripe-401-no-key',
    title: 'No API Key',
    description: 'Request sent with no Authorization header. Stripe requires Bearer token auth on every request.',
    platform: 'Stripe',
    method: 'GET',
    url: 'https://api.stripe.com/v1/charges',
    headers: {},
    apiVersion: '2024-06-20',
    category: 'B2B',
    environment: 'production',
  },
  {
    id: 'stripe-401-bad-key',
    title: 'Bad API Key',
    description: 'Request sent with a malformed or revoked API key. Stripe validates the key format and looks it up.',
    platform: 'Stripe',
    method: 'GET',
    url: 'https://api.stripe.com/v1/charges',
    headers: {
      Authorization: 'Bearer sk_test_invalid_key_abc123xyz',
    },
    apiVersion: '2024-06-20',
    category: 'B2B',
    environment: 'production',
  },
]
