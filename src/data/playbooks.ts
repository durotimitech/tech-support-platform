export interface Playbook {
  title: string
  checks: string[]
  likelyCause: string
  toCustomer: string
}

// Look up by errorCode first, fall back to statusCode string
const playbooks: Record<string, Playbook> = {
  // ── Billing ──────────────────────────────────────────────────────────
  invoice_double_usage: {
    title: 'Invoice Showing Double Usage',
    checks: [
      'Pull the raw usage events for the billing period — look for duplicate event IDs or timestamps that are suspiciously close together.',
      'Check for duplicate event ingestion: are usage records being submitted from two integration points (e.g. both server and a webhook handler)?',
      'Check if retry logic is firing without idempotency keys — a failed request that retries can create two usage records.',
      'Compare the invoice line items against the expected usage source of truth for that period.',
    ],
    likelyCause: 'Duplicate events sent to the API, or a double-counting bug in how usage was aggregated — often caused by retry logic without idempotency keys.',
    toCustomer: "I'm looking into the raw usage events behind this invoice now. If I find duplicates, I'll confirm the cause — this can happen if usage events are submitted twice, sometimes due to retry logic without idempotency keys.",
  },

  // ── Webhooks ─────────────────────────────────────────────────────────
  webhook_endpoint_down: {
    title: 'Webhook Endpoint Stopped Receiving Events',
    checks: [
      'Check webhook delivery logs for failed delivery attempts — look at the error code and response body returned by their endpoint.',
      'Confirm their endpoint URL is still correct and publicly reachable — not localhost or a private IP.',
      'Ask if their SSL certificate has changed recently — an expired or mismatched cert will cause delivery failures.',
      'Ask about recent firewall or infra changes on their side that may be blocking inbound requests from Stripe IPs.',
    ],
    likelyCause: "Their endpoint is failing to respond — timeout, wrong status code, or cert issue — so deliveries are failing silently.",
    toCustomer: "I can see delivery attempts are failing on our side with [error]. Can you confirm your endpoint is still live and returning a 2xx response? A common cause is the endpoint timing out or a change to your server's SSL certificate.",
  },

  // ── 401 ─────────────────────────────────────────────────────────────
  api_key_invalid: {
    title: 'Invalid API Key',
    checks: [
      'Confirm the key being used matches what\'s in their Stripe dashboard under Developers → API keys.',
      'Check if the key was recently rolled or revoked — a new key would have been generated.',
      'Verify they\'re using the correct key type: secret key (sk_) for server-side, publishable key (pk_) for client-side.',
      'Confirm they\'re hitting the right environment — test keys (sk_test_) won\'t work in live mode and vice versa.',
    ],
    likelyCause: 'The API key in the request has been revoked, rotated, or is from the wrong environment.',
    toCustomer: 'The key you\'re using is no longer valid. Please go to Developers → API keys in your Stripe dashboard, confirm the active key, and update your integration. If you recently rotated keys, make sure the new key is deployed everywhere.',
  },
  missing_api_key: {
    title: 'Missing API Key',
    checks: [
      'Confirm the Authorization header is being sent with every request.',
      'Check for environment variable misconfiguration — the key may not be loading correctly in their deployment.',
      'Look for a recent deployment or config change that may have dropped the header.',
    ],
    likelyCause: 'No Authorization header was sent. This is usually a misconfigured environment variable or a missing header in the HTTP client.',
    toCustomer: 'Your request isn\'t including an API key. Make sure your Authorization header is set to "Bearer YOUR_SECRET_KEY" on every request. This is often caused by an environment variable not being set correctly in your deployment environment.',
  },

  // ── 429 ─────────────────────────────────────────────────────────────
  rate_limit: {
    title: 'Rate Limit Exceeded',
    checks: [
      'Check if their request volume has spiked — look at the traffic graph around the time it started.',
      'Ask if any new integrations, cron jobs, or team members recently started making API calls.',
      'Review their current usage against their rate limit tier.',
      'Check if they\'re retrying failed requests without backoff — this compounds the problem.',
    ],
    likelyCause: 'Their request rate has exceeded the limit for their account tier — either usage increased or a background process is hammering the API.',
    toCustomer: 'You\'re currently exceeding your rate limit of X requests/minute. I can see your volume increased around [time]. I\'d recommend adding retry logic with exponential backoff to handle this gracefully, and we can discuss raising your limit if this is expected ongoing volume.',
  },

  // ── 404 ─────────────────────────────────────────────────────────────
  resource_not_found: {
    title: 'Resource Not Found',
    checks: [
      'Verify the resource ID in the request — copy-paste errors are common.',
      'Check if the resource was deleted or archived.',
      'Confirm the resource belongs to the account making the request — cross-account lookups will 404.',
      'Check the API version — some resource types were introduced in later versions.',
    ],
    likelyCause: 'The ID in the request doesn\'t match any resource on this account, or the resource was deleted.',
    toCustomer: 'The resource ID in your request doesn\'t exist on this account. Double-check the ID, confirm it hasn\'t been deleted, and make sure you\'re looking it up from the correct account.',
  },

  // ── 422 ─────────────────────────────────────────────────────────────
  unprocessable_entity: {
    title: 'Unprocessable Request',
    checks: [
      'Review the request body — check for missing required fields or invalid values.',
      'Validate field types: strings vs integers, correct date formats, enum values.',
      'Check the API version — field names and requirements can change between versions.',
      'Look at the specific error message in the response body for the exact field causing the issue.',
    ],
    likelyCause: 'The request body is syntactically valid but contains invalid or missing field values.',
    toCustomer: 'Your request was received but couldn\'t be processed — [specific field] has an invalid value. Please check the API reference for the required format and try again.',
  },

  // ── 500 ─────────────────────────────────────────────────────────────
  webhook_delivery_failed: {
    title: 'Webhook Delivery Failure',
    checks: [
      'Check if the customer\'s endpoint is returning a 2xx response within 30 seconds.',
      'Verify the endpoint URL is correct and publicly accessible — not localhost.',
      'Check for SSL certificate issues on the destination server.',
      'Look at the webhook attempt logs in the Stripe dashboard for the exact error.',
      'Ask if there were any recent infrastructure changes or firewall rule updates.',
    ],
    likelyCause: 'Stripe can\'t reach the customer\'s endpoint, or the endpoint is timing out or returning an error status.',
    toCustomer: 'Stripe is unable to deliver events to your webhook endpoint. Please verify the endpoint URL is publicly accessible, returns a 200 within 30 seconds, and has a valid SSL certificate. You can view failed attempts and retry them from Developers → Webhooks in your dashboard.',
  },

  // ── Fallback by status code ──────────────────────────────────────────
  '400': {
    title: 'Bad Request — Payload Issue',
    checks: [
      'Get the exact request body and the full error response — 400s usually include a message field explaining what\'s wrong.',
      'Compare the payload against the required fields in the API docs for that endpoint.',
      'Check field types: a string where an integer is expected (or vice versa) will 400.',
      'Look for invalid enum values — e.g. an unrecognised currency code or status string.',
    ],
    likelyCause: 'Missing required field, wrong data type, or invalid value in the request body.',
    toCustomer: 'Can you share the exact request body and the full error message you\'re getting back? 400 errors usually include specifics — for example it might say a required field is missing or a value doesn\'t match the expected format.',
  },
  '401': {
    title: 'Authentication Failed',
    checks: [
      'Check that the Authorization header is present and correctly formatted as "Bearer <key>".',
      'Confirm the API key is active and not revoked.',
      'Verify the key matches the environment (test vs live).',
    ],
    likelyCause: 'The request failed authentication — either the key is missing, revoked, or from the wrong environment.',
    toCustomer: 'Your request couldn\'t be authenticated. Please verify your API key is correct, active, and matches the environment you\'re working in.',
  },
  '429': {
    title: 'Rate Limit Exceeded',
    checks: [
      'Check if their request volume has spiked recently.',
      'Ask if any new background jobs or retries are running.',
      'Review their usage against their rate limit tier.',
    ],
    likelyCause: 'Too many requests were sent in a short window.',
    toCustomer: 'You\'ve hit the rate limit for your account. Implement exponential backoff in your retry logic and contact us if you need your limit reviewed.',
  },
  '404': {
    title: 'Resource Not Found',
    checks: [
      'Verify the resource ID is correct.',
      'Check if the resource was recently deleted.',
      'Confirm the request is being made on the correct account.',
    ],
    likelyCause: 'The requested resource doesn\'t exist or has been deleted.',
    toCustomer: 'The resource you\'re requesting doesn\'t exist on this account. Please verify the ID and ensure the resource hasn\'t been deleted.',
  },
  '422': {
    title: 'Validation Error',
    checks: [
      'Review the error message in the response for the specific field causing the issue.',
      'Check required fields and data types against the API docs.',
    ],
    likelyCause: 'The request body contains invalid or missing fields.',
    toCustomer: 'Your request contains invalid data. Check the error details in the response and review the API reference for required field formats.',
  },
  '500': {
    title: 'Server Error',
    checks: [
      'Check the platform\'s status page for any active incidents.',
      'Confirm the request payload isn\'t malformed.',
      'Try the request again — transient 500s are common.',
      'If persistent, capture the request ID from the response for escalation.',
    ],
    likelyCause: 'An unexpected error occurred on the platform\'s side.',
    toCustomer: 'There\'s an error on our end. Please try again shortly. If the issue persists, share the request ID from the response and we\'ll investigate.',
  },
}

export function getPlaybook(statusCode: number, errorCode?: string): Playbook | null {
  if (errorCode && playbooks[errorCode]) return playbooks[errorCode]
  return playbooks[String(statusCode)] ?? null
}
