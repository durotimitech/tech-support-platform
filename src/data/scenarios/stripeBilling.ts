import type { TestScenario } from '../../types'

export const stripeBillingScenarios: TestScenario[] = [
  {
    id: 'stripe-billing-double-usage',
    title: 'Invoice showing double the usage',
    description: 'Customer reports their invoice total is roughly 2× what they expected. Likely duplicate event ingestion or double-counting across two integration points.',
    platform: 'Stripe',
    method: 'GET',
    url: 'https://httpbin.org/json',
    headers: {
      Authorization: 'Bearer sk_test_demo_key',
    },
    runCount: 2,
    logEndpoint: '/v1/invoices',
    apiVersion: '2024-06-20',
    category: 'B2B',
    environment: 'production',
    notes: {
      checks: [
        'Pull the raw usage events for the billing period — look for duplicate event IDs or timestamps that are suspiciously close together.',
        'Check for duplicate event ingestion: are usage records being submitted from two integration points (e.g. both server and a webhook handler)?',
        'Check if retry logic is firing without idempotency keys — a failed request that retries can create two usage records.',
        'Compare the invoice line items against the expected usage source of truth for that period.',
      ],
      likelyCause: 'Duplicate events sent to the API, or a double-counting bug in how usage was aggregated — often caused by retry logic without idempotency keys.',
      toCustomer: "I'm looking into the raw usage events behind this invoice now. If I find duplicates, I'll confirm the cause — this can happen if usage events are submitted twice, sometimes due to retry logic without idempotency keys.",
    },
  },
]
