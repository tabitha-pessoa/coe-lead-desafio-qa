import { test, expect } from "@playwright/test";

const mockCatalogPrice = async (route: import("@playwright/test").Route) => {
  const { productIds } = route.request().postDataJSON() as {
    productIds: string[];
  };
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      prices: productIds.map((productId) => ({
        productId,
        name: `Product ${productId}`,
        status: "ATIVO",
        currentPrice: {
          value: 10,
          currency: "BRL",
          validFrom: "2025-01-01T00:00:00Z",
          validTo: null,
        },
      })),
      notFound: [],
    }),
  });
};

async function openOrderForm(page: import("@playwright/test").Page) {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.route("**/api/catalog/prices", mockCatalogPrice);
  await page.goto("/orders/new");
}

test("ORD-RULE-01 accepts quantities 1 and 999 and rejects 0 and 1000", async ({
  page,
}) => {
  await openOrderForm(page);
  const productId = page.locator("#item-product-id");
  const quantity = page.locator("#item-quantity");
  const add = page.getByRole("button", { name: "Adicionar produto" });

  for (const invalid of ["0", "1000"]) {
    await productId.fill(`INVALID-${invalid}`);
    await quantity.fill(invalid);
    await add.click();
    await expect(quantity).toHaveClass(/is-invalid/);
    await expect(
      page.getByRole("row").filter({ hasText: `INVALID-${invalid}` }),
    ).toHaveCount(0);
  }

  for (const valid of ["1", "999"]) {
    await productId.fill(`VALID-${valid}`);
    await quantity.fill(valid);
    await add.click();
    await expect(
      page.getByRole("row").filter({ hasText: `VALID-${valid}` }),
    ).toBeVisible();
  }
});

test("ORD-RULE-02 rejects letters and special characters in the quantity field", async ({
  page,
}) => {
  await openOrderForm(page);
  const productId = page.locator("#item-product-id");
  const quantity = page.locator("#item-quantity");
  const add = page.getByRole("button", { name: "Adicionar produto" });
  let catalogCalls = 0;
  await page.route("**/api/catalog/prices", async (route) => {
    catalogCalls += 1;
    await mockCatalogPrice(route);
  });

  await productId.fill("INVALID-letters");
  await quantity.fill("");
  await quantity.pressSequentially("letters");
  await add.click();
  await expect(quantity).toHaveClass(/is-invalid/);

  await productId.fill("INVALID-exponent");
  await quantity.fill("1e2");
  await add.click();
  const exponentItem = page
    .getByRole("row")
    .filter({ hasText: "INVALID-exponent" });
  await expect(exponentItem).toHaveCount(0);
  expect(catalogCalls).toBe(0);
});

test("ORD-RULE-03 refuses adding the same product twice", async ({ page }) => {
  await openOrderForm(page);
  const productId = page.locator("#item-product-id");
  const quantity = page.locator("#item-quantity");
  const add = page.getByRole("button", { name: "Adicionar produto" });

  await productId.fill("DUPLICATE-ITEM");
  await quantity.fill("1");
  await add.click();
  await expect(
    page.getByRole("row").filter({ hasText: "DUPLICATE-ITEM" }),
  ).toHaveCount(1);

  await productId.fill("DUPLICATE-ITEM");
  await quantity.fill("2");
  await add.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "DUPLICATE-ITEM" }),
  ).toHaveCount(1);
});

test("ORD-RULE-04 accepts 100 distinct items and prevents adding item 101", async ({
  page,
}) => {
  await openOrderForm(page);
  const productId = page.locator("#item-product-id");
  const add = page.getByRole("button", { name: "Adicionar produto" });

  for (let index = 1; index <= 100; index += 1) {
    await productId.fill(`ITEM-${index}`);
    await add.click();
    await expect(
      page.getByRole("row").filter({ hasText: `ITEM-${index}` }),
    ).toBeVisible();
  }
  await expect(page.getByRole("row")).toHaveCount(101);

  await productId.fill("ITEM-101");
  await add.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(101);
});
