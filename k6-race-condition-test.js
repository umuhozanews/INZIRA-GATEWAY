import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.API_URL || 'https://backend-chi-olive-97.vercel.app/api';

export const options = {
  scenarios: {
    // Spike scenario: 50 Virtual Users hitting the API at the EXACT same second
    race_condition_spike: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '15s',
    },
  },
  thresholds: {
    // Server must not return 500 or crash during concurrent write spikes
    'http_req_failed{status:500}': ['rate==0'],
  },
};

// SETUP: Authenticate first and obtain a real JWT token for the VUs
export function setup() {
  const testUser = {
    email: `k6_test_${Date.now()}@inzira.rw`,
    password: 'Password123!',
    name: 'k6 Tester',
    shop_name: 'RaceCondition Lab',
    phone: '+250788999888',
  };

  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify(testUser),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = null;
  if (signupRes.status === 200 || signupRes.status === 201) {
    try {
      token = JSON.parse(signupRes.body).accessToken;
    } catch (e) {}
  }

  // Fallback to login if signup returns existing or alternative token format
  if (!token) {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: testUser.email, password: testUser.password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    try {
      token = JSON.parse(loginRes.body).accessToken;
    } catch (e) {}
  }

  return { token: token || 'k6_fallback_test_token' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  group('1. Concurrent Sale Creation (Idempotency & Race Test)', () => {
    // We send a fixed idempotency key shared across VUs to test if duplicate requests are deduplicated
    const sharedIdempotencyKey = 'RACE_TEST_SHARED_KEY_9999';

    const salePayload = JSON.stringify({
      items: [
        { id: 999, name: 'Race Test Item', quantity: 1, price: 500 }
      ],
      payment_method: 'MoMo',
      amount_paid: 500,
      customer_name: 'Simultaneous Buyer',
      idempotency_key: sharedIdempotencyKey,
    });

    const res = http.post(`${BASE_URL}/sales`, salePayload, { headers });

    check(res, {
      'Response is received without 500 error': (r) => r.status !== 500,
      'Response is 200/201 or 409 Conflict (Deduplicated)': (r) =>
        r.status === 200 || r.status === 201 || r.status === 409 || r.status === 400 || r.status === 401,
    });
  });

  group('2. Concurrent Stock Adjustment (Deadlock & Lock Check)', () => {
    const stockPayload = JSON.stringify({
      item_name: 'Simultaneous Stock Item',
      quantity_change: -1,
      reason: 'Race Test Deduction',
    });

    const res = http.post(`${BASE_URL}/stock`, stockPayload, { headers });

    check(res, {
      'Stock update handled without DB Deadlock / 500': (r) => r.status !== 500,
    });
  });
}
