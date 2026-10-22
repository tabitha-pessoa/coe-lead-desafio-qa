import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const base = process.env.ORDER_URL ?? "http://localhost:8080";
const client = {
  name: "Business Rules QA",
  document: "98765432100",
  email: "business.rules@example.com",
};

const orderWith = (items: Array<{ productId: string; quantity: unknown }>) => ({
  client,
  items,
});

async function expectErrorEnvelope(
  response: Awaited<
    ReturnType<import("@playwright/test").APIRequestContext["post"]>
  >,
  code: string,
  requestId: string,
) {
  expect(response.headers()["x-request-id"]).toBe(requestId);
  const body = await response.json();
  expect(body).toMatchObject({
    error: {
      code,
      message: expect.any(String),
      details: expect.any(Array),
    },
    requestId,
  });
}

test.describe("Order API business rules", () => {
  test("accepts quantities 1 and 999 and calculates their item snapshots", async ({
    request,
  }) => {
    for (const quantity of [1, 999]) {
      const response = await request.post(`${base}/api/v1/orders`, {
        data: orderWith([{ productId: "PROD-001", quantity }]),
      });
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.items[0]).toMatchObject({
        productId: "PROD-001",
        productName: "Notebook Dell Inspiron 15",
        unitPrice: 3500,
        quantity,
        lineTotal: 3500 * quantity,
      });
      expect(body.status).toBe("CRIADO");
    }
  });

  test("ignores client-supplied product price and order totals", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/orders`, {
      data: {
        ...orderWith([{ productId: "PROD-001", quantity: 1 }]),
        items: [
          {
            productId: "PROD-001",
            quantity: 1,
            productName: "Forged product",
            unitPrice: 0.01,
            lineTotal: 0.01,
          },
        ],
        subtotal: 0.01,
        discount: 0,
        total: 0.01,
      },
    });
    expect(response.status()).toBe(201);
    const order = await response.json();
    expect(order.items[0]).toMatchObject({
      productId: "PROD-001",
      productName: "Notebook Dell Inspiron 15",
      unitPrice: 3500,
      lineTotal: 3500,
    });
    expect(order).toMatchObject({
      subtotal: 3500,
      discount: 350,
      total: 3150,
      status: "CRIADO",
    });
  });

  for (const [label, quantity] of [
    ["zero", 0],
    ["letters", "letters"],
    ["special characters", "!@#$"],
    ["1000", 1000],
  ] as const) {
    test(`rejects quantity ${label} with an error envelope and request ID`, async ({
      request,
    }) => {
      const requestId = `qa-quantity-${label.replaceAll(" ", "-")}`;
      const response = await request.post(`${base}/api/v1/orders`, {
        data: orderWith([{ productId: "PROD-001", quantity }]),
        headers: { "X-Request-Id": requestId },
      });
      expect(response.status()).toBe(400);
      await expectErrorEnvelope(response, "VALIDATION_ERROR", requestId);
    });
  }

  test("rejects 101 items before calling the catalog", async ({ request }) => {
    const items = Array.from({ length: 101 }, (_, index) => ({
      productId: `UNIQUE-${index}`,
      quantity: 1,
    }));
    const requestId = "qa-order-101-items";
    const response = await request.post(`${base}/api/v1/orders`, {
      data: orderWith(items),
      headers: { "X-Request-Id": requestId },
    });
    expect(response.status()).toBe(400);
    await expectErrorEnvelope(response, "VALIDATION_ERROR", requestId);
  });

  test("processes 100 distinct items without treating the catalog's batch cap as a client error", async ({
    request,
  }) => {
    const items = Array.from({ length: 100 }, (_, index) => ({
      productId: `UNKNOWN-${index}`,
      quantity: 1,
    }));
    const response = await request.post(`${base}/api/v1/orders`, {
      data: orderWith(items),
    });
    const body = await response.json();
    expect({
      status: response.status(),
      code: body.error.code,
    }).toEqual({ status: 422, code: "PRODUCT_NOT_FOUND" });
  });

  test("rejects duplicate products and does not persist a partial order", async ({
    request,
  }) => {
    const before = await request.get(`${base}/api/v1/orders?size=1`);
    expect(before.status()).toBe(200);
    const initialCount = (await before.json()).totalElements;
    const requestId = "qa-duplicate-product";
    const response = await request.post(`${base}/api/v1/orders`, {
      data: orderWith([
        { productId: "PROD-001", quantity: 1 },
        { productId: "PROD-001", quantity: 2 },
      ]),
      headers: { "X-Request-Id": requestId },
    });
    expect(response.status()).toBe(400);
    await expectErrorEnvelope(response, "VALIDATION_ERROR", requestId);

    const after = await request.get(`${base}/api/v1/orders?size=1`);
    expect((await after.json()).totalElements).toBe(initialCount);
  });

  for (const [productId, code] of [
    ["UNKNOWN-PRODUCT", "PRODUCT_NOT_FOUND"],
    ["PROD-004", "PRODUCT_INACTIVE"],
    ["PROD-005", "NO_CURRENT_PRICE"],
  ]) {
    test(`rejects ${productId} without persisting an order`, async ({
      request,
    }) => {
      const before = await request.get(`${base}/api/v1/orders?size=1`);
      const initialCount = (await before.json()).totalElements;
      const requestId = `qa-reject-${productId.toLowerCase()}`;
      const response = await request.post(`${base}/api/v1/orders`, {
        data: orderWith([
          { productId: "PROD-001", quantity: 1 },
          { productId, quantity: 1 },
        ]),
        headers: { "X-Request-Id": requestId },
      });
      expect(response.status()).toBe(422);
      await expectErrorEnvelope(response, code, requestId);

      const after = await request.get(`${base}/api/v1/orders?size=1`);
      expect((await after.json()).totalElements).toBe(initialCount);
    });
  }

  test("selects the current price window and exposes future/expired windows as no price", async ({
    request,
  }) => {
    const current = await request.get(
      `${process.env.CATALOG_URL ?? "http://localhost:8081"}/api/v1/products/PROD-003`,
    );
    expect(current.status()).toBe(200);
    expect(await current.json()).toMatchObject({
      id: "PROD-003",
      currentPrice: {
        value: 649.9,
        currency: "BRL",
        validFrom: "2025-06-01T00:00:00Z",
        validTo: null,
      },
    });

    for (const productId of ["PROD-005", "PROD-006"]) {
      const response = await request.get(
        `${process.env.CATALOG_URL ?? "http://localhost:8081"}/api/v1/products/${productId}`,
      );
      expect(response.status()).toBe(200);
      expect((await response.json()).currentPrice).toBeNull();
    }
  });

  test("applies the active discount at 1000, not at 999.99, with HALF_UP rounding", async ({
    request,
  }) => {
    const repoRoot = resolve(process.cwd(), "..");
    const setSeedProductPrice = (value: string) => {
      execFileSync(
        "docker",
        [
          "compose",
          "exec",
          "-T",
          "mongo",
          "mongosh",
          "--quiet",
          "catalog",
          "--eval",
          `db.products.updateOne({_id:"PROD-001"},{$set:{"prices.0.value":NumberDecimal("${value}")}})`,
        ],
        { cwd: repoRoot, stdio: "pipe" },
      );
    };
    const setDiscountRuleActive = (active: boolean) => {
      execFileSync(
        "docker",
        [
          "compose",
          "exec",
          "-T",
          "postgres",
          "psql",
          "-U",
          "orders",
          "-d",
          "orders",
          "-c",
          `UPDATE discount_rule SET active = ${active}`,
        ],
        { cwd: repoRoot, stdio: "pipe" },
      );
    };
    let roundedOrderId = "";

    try {
      for (const [price, expectedDiscount] of [
        ["999.99", 0],
        ["1000.00", 100],
        ["1000.05", 100.01],
      ] as const) {
        setSeedProductPrice(price);
        const response = await request.post(`${base}/api/v1/orders`, {
          data: orderWith([{ productId: "PROD-001", quantity: 1 }]),
        });
        expect(response.status()).toBe(201);
        const order = await response.json();
        expect(order.subtotal).toBe(Number(price));
        expect(order.discount).toBe(expectedDiscount);
        expect(order.total).toBe(Number(price) - expectedDiscount);
        if (price === "1000.05") {
          roundedOrderId = order.id;
        }
      }

      setDiscountRuleActive(false);
      const noRuleResponse = await request.post(`${base}/api/v1/orders`, {
        data: orderWith([{ productId: "PROD-001", quantity: 1 }]),
      });
      expect(noRuleResponse.status()).toBe(201);
      expect((await noRuleResponse.json()).discount).toBe(0);
    } finally {
      setDiscountRuleActive(true);
      setSeedProductPrice("3500.00");
    }

    const snapshot = await request.get(
      `${base}/api/v1/orders/${roundedOrderId}`,
    );
    expect((await snapshot.json()).items[0]).toMatchObject({
      productName: "Notebook Dell Inspiron 15",
      unitPrice: 1000.05,
    });
  });

  test("lists CRIADO orders newest first and supports the documented 100-item page size", async ({
    request,
  }) => {
    const createdIds: string[] = [];
    for (let index = 0; index < 2; index += 1) {
      const create = await request.post(`${base}/api/v1/orders`, {
        data: orderWith([{ productId: "PROD-001", quantity: 1 }]),
      });
      expect(create.status()).toBe(201);
      createdIds.push((await create.json()).id);
    }

    const response = await request.get(
      `${base}/api/v1/orders?page=0&size=100&status=CRIADO`,
    );
    expect(response.status()).toBe(200);
    const page = await response.json();
    expect(page.size).toBe(100);
    expect(page.content[0].id).toBe(createdIds[1]);
    expect(page.content[0].status).toBe("CRIADO");
    expect(page.content[1].id).toBe(createdIds[0]);
  });

  test("rejects an invalid order status filter with the standard error envelope", async ({
    request,
  }) => {
    const requestId = "qa-invalid-order-status";
    const response = await request.get(`${base}/api/v1/orders?status=INVALID`, {
      headers: { "X-Request-Id": requestId },
    });
    expect(response.status()).toBe(400);
    await expectErrorEnvelope(response, "VALIDATION_ERROR", requestId);
  });

  test("generates a request ID for an order error when the client omits it", async ({
    request,
  }) => {
    const response = await request.get(
      `${base}/api/v1/orders/00000000-0000-4000-8000-000000000000`,
    );
    expect(response.status()).toBe(404);
    const headerId = response.headers()["x-request-id"];
    expect(headerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    const body = await response.json();
    expect(body).toMatchObject({
      error: {
        code: "ORDER_NOT_FOUND",
        message: expect.any(String),
        details: expect.any(Array),
      },
      requestId: headerId,
    });
  });

  test("returns PAYLOAD_TOO_LARGE using the standard error envelope", async ({
    request,
  }) => {
    const requestId = "qa-payload-over-1mb";
    const response = await request.post(`${base}/api/v1/orders`, {
      data: JSON.stringify({
        padding: "x".repeat(1024 * 1024),
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
    });
    expect(response.status()).toBe(413);
    await expectErrorEnvelope(response, "PAYLOAD_TOO_LARGE", requestId);
  });

  test("does not reject a request body exactly at the 1 MiB limit as oversized", async ({
    request,
  }) => {
    const targetBytes = 1024 * 1024;
    const emptyPayload = JSON.stringify({ padding: "" });
    const payload = JSON.stringify({
      padding: "x".repeat(targetBytes - Buffer.byteLength(emptyPayload)),
    });
    expect(Buffer.byteLength(payload)).toBe(targetBytes);
    const response = await request.post(`${base}/api/v1/orders`, {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
