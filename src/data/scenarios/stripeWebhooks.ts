import type { TestScenario } from '../../types'

export const stripeWebhookScenarios: TestScenario[] = [
  {
    id: 'stripe-webhook-endpoint-down',
    title: 'Webhook endpoint stopped receiving events',
    description: "Delivery attempts are failing silently — customer's endpoint isn't responding or is returning a non-2xx status. Stripe will retry but eventually stop.",
    platform: 'Stripe',
    method: 'POST',
    url: 'https://httpbin.org/status/503',
    headers: {
      Authorization: 'Bearer sk_test_demo_key',
      'Content-Type': 'application/json',
    },
    apiVersion: '2024-06-20',
    logEndpoint: '/v1/webhook_endpoints',
    category: 'B2B',
    environment: 'production',
    notes: {
      checks: [
        'Check webhook delivery logs for failed delivery attempts — look at the error code and response body returned by their endpoint.',
        'Confirm their endpoint URL is still correct and publicly reachable — not localhost or a private IP.',
        'Ask if their SSL certificate has changed recently — an expired or mismatched cert will cause delivery failures.',
        'Ask about recent firewall or infra changes on their side that may be blocking inbound requests from Stripe IPs.',
      ],
      likelyCause: "Their endpoint is failing to respond — timeout, wrong status code, or cert issue — so deliveries are failing silently.",
      toCustomer: "I can see delivery attempts are failing on our side with [error]. Can you confirm your endpoint is still live and returning a 2xx response? A common cause is the endpoint timing out or a change to your server's SSL certificate.",
    },
  },
]
