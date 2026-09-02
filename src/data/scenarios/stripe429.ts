import type { TestScenario } from '../../types'

export const stripe429Scenarios: TestScenario[] = [
  {
    id: 'stripe-429-rate-limit',
    title: 'Rate Limit Exceeded',
    description: 'Worked fine yesterday, now 429 on every request. Customer has hit Stripe\'s request rate limit.',
    platform: 'Stripe',
    method: 'GET',
    url: 'https://httpbin.org/status/429',
    headers: {
      Authorization: 'Bearer sk_test_demo_key',
      'Stripe-Version': '2024-06-20',
    },
    apiVersion: '2024-06-20',
    category: 'B2B',
    environment: 'production',
    notes: {
      checks: [
        'Has their request volume spiked recently? Check their traffic graph around the time it started.',
        'Any rate-limit changes on their end — new integration, new team member, a cron job gone wrong?',
        'Check their account\'s current usage against their rate limit tier.',
      ],
      likelyCause: "They've hit a rate limit — either their usage increased or a limit was tightened on their plan.",
      toCustomer: "You're currently exceeding your rate limit of X requests/minute. I can see your volume increased around [time] — I'd recommend adding retry logic with exponential backoff, and we can discuss raising your limit if this is expected ongoing volume.",
    },
  },
]
