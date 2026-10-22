import { test, expect } from "@playwright/test";
const base = process.env.ORDER_URL ?? "http://localhost:8080";
const client = {
  name: "QA Automation",
  document: "12345678901",
  email: "qa.automation@example.com",
};
const validOrder = () => ({
  client: { ...client },
  items: [{ productId: "PROD-001", quantity: 1 }],
});

test.describe("Orders API", () => {
  test("ORD-01/04 creates an order with authoritative totals, status, date and product snapshot", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/orders`, {
      data: validOrder(),
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("CRIADO");
    expect(body.items[0].productName).toBe("Notebook Dell Inspiron 15");
    expect(body.items[0].productId).toBe("PROD-001");
    expect(body.items[0].unitPrice).toBe(3500);
    expect(body.items[0].quantity).toBe(1);
    expect(body.items[0].lineTotal).toBe(3500);
    expect(body.subtotal).toBe(3500);
    expect(body.discount).toBe(350);
    expect(body.total).toBe(3150);
    expect(Date.parse(body.createdAt)).not.toBeNaN();
    expect(response.headers().location).toContain(body.id);

    const detail = await request.get(`${base}/api/v1/orders/${body.id}`);
    expect(detail.status()).toBe(200);
    const persistedOrder = await detail.json();
    expect(persistedOrder).toMatchObject({
      id: body.id,
      client: body.client,
      items: body.items,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      status: body.status,
    });
    expect(
      Math.abs(
        Date.parse(persistedOrder.createdAt) - Date.parse(body.createdAt),
      ),
    ).toBeLessThan(1);
  });

  test("ORD-04 computes subtotal, discount and total for multiple items", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/orders`, {
      data: {
        client,
        items: [
          { productId: "PROD-001", quantity: 2 },
          { productId: "PROD-002", quantity: 1 },
        ],
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(
      body.items.map((item: { lineTotal: number }) => item.lineTotal),
    ).toEqual([7000, 499.9]);
    expect(body.subtotal).toBe(7499.9);
    expect(body.discount).toBe(749.99);
    expect(body.total).toBe(6749.91);
  });

  test("ORD-03 rejects duplicate product IDs with 400 and validation envelope", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/orders`, {
      data: {
        client,
        items: [
          { productId: "PROD-001", quantity: 1 },
          { productId: "PROD-001", quantity: 2 },
        ],
      },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  const invalidClients = [
    ["missing name", { document: client.document, email: client.email }],
    ["blank name", { ...client, name: "   " }],
    ["name exceeding 120 characters", { ...client, name: "N".repeat(121) }],
    ["missing document", { name: client.name, email: client.email }],
    ["blank document", { ...client, document: "   " }],
    [
      "document exceeding 20 characters",
      { ...client, document: "1".repeat(21) },
    ],
    ["missing email", { name: client.name, document: client.document }],
    ["malformed email", { ...client, email: "not-an-email" }],
    [
      "email exceeding 120 characters",
      { ...client, email: `${"a".repeat(109)}@example.com` },
    ],
  ] as const;

  for (const [label, invalidClient] of invalidClients) {
    test(`ORD-02 rejects ${label}`, async ({ request }) => {
      const response = await request.post(`${base}/api/v1/orders`, {
        data: { ...validOrder(), client: invalidClient },
      });
      expect(response.status()).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });
  }

  for (const quantity of [0, 1000]) {
    test(`ORD-03 rejects quantity ${quantity}`, async ({ request }) => {
      const response = await request.post(`${base}/api/v1/orders`, {
        data: { ...validOrder(), items: [{ productId: "PROD-001", quantity }] },
      });
      expect(response.status()).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });
  }

  for (const [productId, expectedCode] of [
    ["UNKNOWN-PRODUCT", "PRODUCT_NOT_FOUND"],
    ["PROD-004", "PRODUCT_INACTIVE"],
    ["PROD-005", "NO_CURRENT_PRICE"],
    ["PROD-006", "NO_CURRENT_PRICE"],
  ]) {
    test(`ORD-03 rejects ${productId} with ${expectedCode}`, async ({
      request,
    }) => {
      const response = await request.post(`${base}/api/v1/orders`, {
        data: { ...validOrder(), items: [{ productId, quantity: 1 }] },
      });
      expect(response.status()).toBe(422);
      expect((await response.json()).error.code).toBe(expectedCode);
    });
  }

  test("ORD-05 rejects empty item lists and malformed order payloads", async ({
    request,
  }) => {
    const emptyItems = await request.post(`${base}/api/v1/orders`, {
      data: { ...validOrder(), items: [] },
    });
    expect(emptyItems.status()).toBe(400);
    expect((await emptyItems.json()).error.code).toBe("VALIDATION_ERROR");

    const emptyBody = await request.post(`${base}/api/v1/orders`, { data: {} });
    expect(emptyBody.status()).toBe(400);
    expect((await emptyBody.json()).error.code).toBe("VALIDATION_ERROR");
  });

  test("ORD-05 returns a paginated order with monetary fields and creation date", async ({
    request,
  }) => {
    const response = await request.get(
      `${base}/api/v1/orders?page=0&size=20&status=CRIADO`,
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("content");
    expect(body.page).toBe(0);
    expect(body.size).toBe(20);
    expect(Array.isArray(body.content)).toBeTruthy();
    if (body.content.length > 0) {
      const order = body.content[0];
      expect(order).toMatchObject({
        subtotal: expect.any(Number),
        discount: expect.any(Number),
        total: expect.any(Number),
        status: "CRIADO",
      });
      expect(Date.parse(order.createdAt)).not.toBeNaN();
    }
  });
});
