import type { TestScenario } from '../../types'

export const stripe400Scenarios: TestScenario[] = [
  {
    id: 'stripe-400-bad-payload',
    title: '400 on POST with unclear payload issue',
    description: 'POST request returns 400 with a vague error — customer unsure which field is wrong. Stripe includes a message field in the response that names the exact problem.',
    platform: 'Stripe',
    method: 'POST',
    url: 'https://httpbin.org/status/400',
    headers: {
      Authorization: 'Bearer sk_test_demo_key',
      'Content-Type': 'application/json',
    },
    apiVersion: '2024-06-20',
    category: 'B2B',
    environment: 'production',
    notes: {
      checks: [
        'Get the exact request body and the full error response — 400s usually include a message field explaining what\'s wrong.',
        'Compare the payload against the required fields in the API docs for that endpoint.',
        'Check field types: a string where an integer is expected (or vice versa) will 400.',
        'Look for invalid enum values — e.g. an unrecognised currency code or status string.',
      ],
      likelyCause: 'Missing required field, wrong data type, or invalid value in the request body.',
      toCustomer: 'Can you share the exact request body and the full error message you\'re getting back? 400 errors usually include specifics — for example it might say a required field is missing or a value doesn\'t match the expected format.',
    },
  },
]
