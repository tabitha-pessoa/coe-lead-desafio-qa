import { test, expect } from "@playwright/test";
const base = process.env.CATALOG_URL ?? "http://localhost:8081";

test.describe("Catalog API", () => {
  test("CAT-01 returns all fields for an individual product lookup", async ({
    request,
  }) => {
    const response = await request.get(`${base}/api/v1/products/PROD-001`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("PROD-001");
    expect(body.name).toBe("Notebook Dell Inspiron 15");
    expect(body.status).toBe("ATIVO");
    expect(body.currentPrice.value).toBe(3500);
    expect(body.currentPrice.currency).toBe("BRL");
    expect(Date.parse(body.currentPrice.validFrom)).not.toBeNaN();
  });

  test("CAT-02 returns all product fields for a batch and identifies unknown IDs", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/products/prices`, {
      data: { productIds: ["PROD-001", "PROD-002", "UNKNOWN-ID"] },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const notebook = body.prices.find(
      (product: { productId: string }) => product.productId === "PROD-001",
    );
    const mouse = body.prices.find(
      (product: { productId: string }) => product.productId === "PROD-002",
    );
    expect(notebook).toMatchObject({
      name: "Notebook Dell Inspiron 15",
      status: "ATIVO",
      currentPrice: { value: 3500, currency: "BRL" },
    });
    expect(mouse).toMatchObject({
      name: "Mouse Logitech MX Master 3S",
      status: "ATIVO",
      currentPrice: { value: 499.9, currency: "BRL" },
    });
    expect(body.notFound).toContain("UNKNOWN-ID");
  });

  test("CAT-03 returns current product state when no price window is active", async ({
    request,
  }) => {
    const response = await request.post(`${base}/api/v1/products/prices`, {
      data: { productIds: ["PROD-004", "PROD-005", "PROD-006"] },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const byId = new Map(
      body.prices.map((product: { productId: string }) => [
        product.productId,
        product,
      ]),
    );
    expect(byId.get("PROD-004")).toMatchObject({
      status: "INATIVO",
      currentPrice: { value: 1200, currency: "BRL" },
    });
    expect(byId.get("PROD-005")).toMatchObject({
      status: "ATIVO",
      currentPrice: null,
    });
    expect(byId.get("PROD-006")).toMatchObject({
      status: "ATIVO",
      currentPrice: null,
    });
  });

  test("CAT-04 returns an error envelope and request id for an unknown individual ID", async ({
    request,
  }) => {
    const response = await request.get(
      `${base}/api/v1/products/DOES-NOT-EXIST`,
      { headers: { "X-Request-Id": "qa-catalog-not-found-001" } },
    );
    expect(response.status()).toBe(404);
    expect(response.headers()["x-request-id"]).toBe("qa-catalog-not-found-001");
    const body = await response.json();
    expect(body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  for (const [label, productIds] of [
    ["empty list", []],
    ["blank ID", ["PROD-001", "  "]],
    [
      "more than the maximum of 50 IDs",
      Array.from({ length: 51 }, (_, index) => `PROD-${index}`),
    ],
  ] as const) {
    test(`CAT-05 rejects a batch request with ${label}`, async ({
      request,
    }) => {
      const response = await request.post(`${base}/api/v1/products/prices`, {
        data: { productIds },
      });
      expect(response.status()).toBe(400);
      expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
    });
  }
});
