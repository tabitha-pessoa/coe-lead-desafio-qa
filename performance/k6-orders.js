import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const ORDER_URL = __ENV.ORDER_URL || 'http://localhost:8080';
const CATALOG_URL = __ENV.CATALOG_URL || 'http://localhost:8081';
const PROFILE = __ENV.K6_PROFILE || 'smoke';
const INCLUDE_ORDER_CREATION = __ENV.PERF_ENABLE_ORDER_CREATION === 'true';

if (!['smoke', 'load', 'stress', 'soak'].includes(PROFILE)) {
  throw new Error(`Unsupported K6_PROFILE "${PROFILE}". Use smoke, load, stress, or soak.`);
}

const list20Errors = new Rate('orders_list_20_errors');
const list100Errors = new Rate('orders_list_100_errors');
const catalogErrors = new Rate('catalog_single_errors');
const batchErrors = new Rate('catalog_batch_errors');
const createErrors = new Rate('order_create_errors');

function arrivalScenario(rate) {
  if (PROFILE === 'load') {
    return {
      executor: 'ramping-arrival-rate',
      startRate: Math.min(2, rate),
      timeUnit: '1s',
      preAllocatedVUs: 5,
      maxVUs: 20,
      stages: [
        { duration: '1m', target: rate },
        { duration: '3m', target: rate },
        { duration: '1m', target: 0 },
      ],
    };
  }

  if (PROFILE === 'stress') {
    return {
      executor: 'ramping-arrival-rate',
      startRate: Math.min(2, rate),
      timeUnit: '1s',
      preAllocatedVUs: 5,
      maxVUs: 50,
      stages: [
        { duration: '1m', target: rate },
        { duration: '2m', target: rate * 2 },
        { duration: '1m', target: rate * 3 },
        { duration: '1m', target: 0 },
      ],
    };
  }

  if (PROFILE === 'soak') {
    return {
      executor: 'ramping-arrival-rate',
      startRate: rate,
      timeUnit: '1s',
      preAllocatedVUs: 5,
      maxVUs: 20,
      stages: [
        { duration: '30m', target: rate },
        { duration: '1s', target: 0 },
      ],
    };
  }

  return {
    executor: 'ramping-arrival-rate',
    startRate: 1,
    timeUnit: '1s',
    preAllocatedVUs: 2,
    maxVUs: 10,
    stages: [
      { duration: '30s', target: 1 },
      { duration: '60s', target: 1 },
      { duration: '30s', target: 0 },
    ],
  };
}

function rateFor(smokeRate, loadRate, stressRate, soakRate) {
  if (PROFILE === 'load') return loadRate;
  if (PROFILE === 'stress') return stressRate;
  if (PROFILE === 'soak') return soakRate;
  return smokeRate;
}

const scenarios = {
  orders_list_20: {
    ...arrivalScenario(rateFor(1, 5, 10, 1)),
    exec: 'listOrders',
  },
  orders_list_100: {
    ...arrivalScenario(rateFor(1, 5, 10, 1)),
    exec: 'listOrders100',
  },
  catalog_single: {
    ...arrivalScenario(rateFor(1, 5, 10, 1)),
    exec: 'getProduct',
  },
  catalog_batch: {
    ...arrivalScenario(rateFor(1, 2, 5, 1)),
    exec: 'getProductBatch',
  },
};

if (INCLUDE_ORDER_CREATION) {
  scenarios.order_create = {
    ...arrivalScenario(rateFor(1, 1, 2, 1)),
    exec: 'createOrder',
  };
}

const thresholds = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  dropped_iterations: ['count==0'],
  'http_req_duration{scenario:orders_list_20}': ['p(95)<800'],
  'http_req_duration{scenario:orders_list_100}': ['p(95)<800'],
  'http_req_duration{scenario:catalog_single}': ['p(95)<800'],
  'http_req_duration{scenario:catalog_batch}': ['p(95)<800'],
  orders_list_20_errors: ['rate<0.01'],
  orders_list_100_errors: ['rate<0.01'],
  catalog_single_errors: ['rate<0.01'],
  catalog_batch_errors: ['rate<0.01'],
};

if (INCLUDE_ORDER_CREATION) {
  thresholds['http_req_duration{scenario:order_create}'] = ['p(95)<800'];
  thresholds.order_create_errors = ['rate<0.01'];
}

export const options = { scenarios, thresholds };

const params = {
  headers: { Accept: 'application/json' },
  tags: { test_type: 'performance' },
};

const batchProductIds = [
  'PROD-001',
  ...Array.from({ length: 49 }, (_, index) => `UNKNOWN-PERF-${index + 1}`),
];

function jsonBody(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function listOrdersWithSize(size, errors) {
  const response = http.get(`${ORDER_URL}/api/v1/orders?page=0&size=${size}&status=CRIADO`, params);
  const body = jsonBody(response);
  const valid = check(response, {
    'orders list returns 200': (r) => r.status === 200,
    [`orders list returns a valid size-${size} page envelope`]: () =>
      body !== null &&
      Array.isArray(body.content) &&
      Number.isInteger(body.page) &&
      body.size === size &&
      Number.isInteger(body.totalElements) &&
      Number.isInteger(body.totalPages),
    [`orders list size-${size} entries expose status and creation time`]: () =>
      body !== null &&
      body.content.every((order) => typeof order.status === 'string' && typeof order.createdAt === 'string'),
  });
  errors.add(!valid);
  sleep(0.1);
}

export function listOrders() {
  listOrdersWithSize(20, list20Errors);
}

export function listOrders100() {
  listOrdersWithSize(100, list100Errors);
}

export function getProduct() {
  const response = http.get(`${CATALOG_URL}/api/v1/products/PROD-001`, params);
  const body = jsonBody(response);
  const valid = check(response, {
    'catalog product returns 200': (r) => r.status === 200,
    'catalog product has expected identity and current price': () =>
      body !== null &&
      body.id === 'PROD-001' &&
      typeof body.name === 'string' &&
      body.status === 'ATIVO' &&
      body.currentPrice !== null &&
      typeof body.currentPrice?.value === 'number' &&
      typeof body.currentPrice?.currency === 'string',
  });
  catalogErrors.add(!valid);
  sleep(0.1);
}

export function getProductBatch() {
  const response = http.post(
    `${CATALOG_URL}/api/v1/products/prices`,
    JSON.stringify({ productIds: batchProductIds }),
    { ...params, headers: { ...params.headers, 'Content-Type': 'application/json' } },
  );
  const body = jsonBody(response);
  const valid = check(response, {
    'catalog batch returns 200': (r) => r.status === 200,
    'catalog batch contains expected products and no missing IDs': () =>
      body !== null &&
      Array.isArray(body.prices) &&
      body.prices.length === 1 &&
      body.prices[0].productId === 'PROD-001' &&
      body.prices[0].status === 'ATIVO' &&
      body.prices[0].currentPrice !== null &&
      Array.isArray(body.notFound) &&
      body.notFound.length === 49,
  });
  batchErrors.add(!valid);
  sleep(0.1);
}

export function createOrder() {
  const iterationId = `${__VU}-${__ITER}-${Date.now()}`;
  const response = http.post(
    `${ORDER_URL}/api/v1/orders`,
    JSON.stringify({
      client: {
        name: 'Performance Test',
        document: `9${String(__VU).padStart(2, '0')}${String(__ITER).padStart(8, '0')}`,
        email: `perf-${iterationId}@example.com`,
      },
      items: [{ productId: 'PROD-001', quantity: 1 }],
    }),
    { ...params, headers: { ...params.headers, 'Content-Type': 'application/json' } },
  );
  const body = jsonBody(response);
  const valid = check(response, {
    'order creation returns 201': (r) => r.status === 201,
    'created order contains computed totals and snapshot': () =>
      body !== null &&
      typeof body.id === 'string' &&
      body.status === 'CRIADO' &&
      Array.isArray(body.items) &&
      body.items.length === 1 &&
      body.items[0].productId === 'PROD-001' &&
      typeof body.items[0].unitPrice === 'number' &&
      typeof body.subtotal === 'number' &&
      typeof body.discount === 'number' &&
      typeof body.total === 'number',
  });
  createErrors.add(!valid);
  sleep(0.1);
}
