import { test, expect } from "@playwright/test";

test("ORD-01/04/05 creates an order, calculates item/subtotal and shows authoritative detail", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/orders/new");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator("#client-name").fill("QA SDD User");
  await page.locator("#client-document").fill("12345678901");
  await page.locator("#client-email").fill("qa.sdd@example.com");
  await page.locator("#item-product-id").fill("PROD-001");
  await page.locator("#item-quantity").fill("2");
  await page.getByRole("button", { name: "Adicionar produto" }).click();
  const itemRow = page.getByRole("row").filter({ hasText: "PROD-001" });
  await expect(itemRow).toBeVisible();
  await expect(itemRow).toContainText("7.000,00");
  await expect(
    page.locator(".card").filter({ hasText: "Resumo" }),
  ).toContainText("7.000,00");

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/orders"),
  );
  await page.getByRole("button", { name: "Criar pedido" }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const createdOrder = await createResponse.json();
  expect(createdOrder).toMatchObject({
    subtotal: 7000,
    discount: 700,
    total: 6300,
    status: "CRIADO",
    client: {
      name: "QA SDD User",
      document: "12345678901",
      email: "qa.sdd@example.com",
    },
    items: [
      {
        productId: "PROD-001",
        productName: "Notebook Dell Inspiron 15",
        quantity: 2,
        unitPrice: 3500,
        lineTotal: 7000,
      },
    ],
  });
  expect(Date.parse(createdOrder.createdAt)).not.toBeNaN();
  await expect(page).toHaveURL(new RegExp(`/orders/${createdOrder.id}$`));
  await expect(page.locator("body")).toContainText("QA SDD User");
  await expect(page.locator("body")).toContainText("6.300,00");
  await expect(page.locator("body")).toContainText("700,00");
  await expect(page.locator("body")).toContainText("Notebook Dell Inspiron 15");
  await expect(page.locator("body")).toContainText("7.000,00");
  const createdDate = await page
    .getByText("Data de criação")
    .locator("xpath=following-sibling::dd[1]")
    .textContent();
  const expectedDate = await page.evaluate(
    (date) =>
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
        new Date(date),
      ),
    createdOrder.createdAt,
  );
  expect(createdDate).toContain(expectedDate);
});

test("ORD-02 blocks an empty order and marks all required fields", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/orders/new");
  await page.getByRole("button", { name: "Criar pedido" }).click();
  await expect(page.locator("#client-name")).toHaveClass(/is-invalid/);
  await expect(page.locator("#client-document")).toHaveClass(/is-invalid/);
  await expect(page.locator("#client-email")).toHaveClass(/is-invalid/);
  await expect(page).toHaveURL(/\/orders\/new$/);
});

const invalidClientFields = [
  { label: "missing name", selector: "#client-name", value: "" },
  { label: "blank name", selector: "#client-name", value: "   " },
  { label: "missing document", selector: "#client-document", value: "" },
  { label: "blank document", selector: "#client-document", value: "   " },
  { label: "missing email", selector: "#client-email", value: "" },
  {
    label: "malformed email",
    selector: "#client-email",
    value: "invalid-email",
  },
];

for (const field of invalidClientFields) {
  test(`ORD-02 blocks invalid ${field.label} and does not submit`, async ({
    page,
  }) => {
    let orderPosts = 0;
    await page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        orderPosts += 1;
      }
      await route.continue();
    });
    await page.addInitScript(() =>
      localStorage.setItem("app-language", "pt-BR"),
    );
    await page.goto("/orders/new");
    await page.locator("#client-name").fill("Valid Client");
    await page.locator("#client-document").fill("12345678901");
    await page.locator("#client-email").fill("valid@example.com");
    await page.locator(field.selector).fill(field.value);
    await page.locator("#item-product-id").fill("PROD-001");
    await page.getByRole("button", { name: "Adicionar produto" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "PROD-001" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page.locator(field.selector)).toHaveClass(/is-invalid/);
    await expect(page).toHaveURL(/\/orders\/new$/);
    expect(orderPosts).toBe(0);
  });
}

test("ORD-03 rejects an empty product ID, non-numeric quantities and whitespace IDs", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/orders/new");
  const productId = page.locator("#item-product-id");
  const quantity = page.locator("#item-quantity");
  const addProduct = page.getByRole("button", { name: "Adicionar produto" });

  await addProduct.click();
  await expect(productId).toHaveClass(/is-invalid/);

  await productId.fill("PROD-001");
  await quantity.fill("");
  await addProduct.click();
  await expect(quantity).toHaveClass(/is-invalid/);
  await expect(
    page.getByRole("row").filter({ hasText: "PROD-001" }),
  ).toHaveCount(0);

  await quantity.fill("1");
  for (const invalidQuantity of ["0", "1000"]) {
    await productId.fill("PROD-001");
    await quantity.fill(invalidQuantity);
    await addProduct.click();
    await expect(quantity).toHaveClass(/is-invalid/);
  }

  await quantity.fill("1");
  await productId.fill("   ");
  await addProduct.click();
  await expect(productId).toHaveClass(/is-invalid/);
  await expect(
    page.getByRole("row").filter({ hasText: "PROD-001" }),
  ).toHaveCount(0);
});

for (const [productId, warning] of [
  ["UNKNOWN-PRODUCT", "Produto não encontrado"],
  ["PROD-004", "Produto inativo no catálogo"],
  ["PROD-005", "Produto sem preço vigente"],
  ["PROD-006", "Produto sem preço vigente"],
]) {
  test(`ORD-03 refuses ${productId} when adding an item`, async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem("app-language", "pt-BR"),
    );
    await page.goto("/orders/new");
    await page.locator("#item-product-id").fill(productId);
    await page.getByRole("button", { name: "Adicionar produto" }).click();
    await expect(page.getByRole("alert")).toContainText(warning);
    await expect(
      page.getByRole("row").filter({ hasText: productId }),
    ).toHaveCount(0);
  });
}

test("ORD-05 lists the created order values and opens its complete detail", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/orders/new");
  await page.locator("#client-name").fill("List QA Client");
  await page.locator("#client-document").fill("12345678901");
  await page.locator("#client-email").fill("list.qa@example.com");
  await page.locator("#item-product-id").fill("PROD-002");
  await page.locator("#item-quantity").fill("3");
  await page.getByRole("button", { name: "Adicionar produto" }).click();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/orders"),
  );
  await page.getByRole("button", { name: "Criar pedido" }).click();
  const createdOrder = await (await responsePromise).json();

  await page.goto("/orders");
  const orderRow = page
    .getByRole("row")
    .filter({ hasText: createdOrder.id.slice(0, 13) });
  await expect(orderRow).toBeVisible();
  await expect(orderRow).toContainText("List QA Client");
  await expect(orderRow).toContainText("1.499,70");
  await expect(orderRow).toContainText("149,97");
  await expect(orderRow).toContainText("1.349,73");
  await expect(orderRow).toContainText("Criado");
  const expectedDate = await page.evaluate(
    (date: string) =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(date)),
    createdOrder.createdAt,
  );
  await expect(orderRow).toContainText(expectedDate.replace(", ", " "));
  await orderRow.getByRole("link", { name: /Visualizar pedido/ }).click();

  await expect(
    page.getByRole("heading", { name: "Detalhes do pedido" }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("List QA Client");
  await expect(page.locator("body")).toContainText(
    "Mouse Logitech MX Master 3S",
  );
  await expect(page.locator("body")).toContainText("1.499,70");
  await expect(page.locator("body")).toContainText("149,97");
  await expect(page.locator("body")).toContainText("1.349,73");
  await expect(page.locator("body")).toContainText("499,90");
});

test("ORD-05 orders list and detail pages load", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Http failure");
});

test("ORD-05 changes pages in the paginated order list", async ({ page }) => {
  const requestedPages: string[] = [];
  await page.route("**/api/orders**", async (route) => {
    const url = new URL(route.request().url());
    requestedPages.push(url.searchParams.get("page") ?? "");
    const pageNumber = Number(url.searchParams.get("page") ?? 0);
    const orderId =
      pageNumber === 0
        ? "20000000-0000-4000-8000-000000000001"
        : "20000000-0000-4000-8000-000000000002";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [
          {
            id: orderId,
            client: {
              name:
                pageNumber === 0 ? "First page client" : "Second page client",
              document: "123",
              email: "page@example.com",
            },
            items: [],
            subtotal: 100,
            discount: 0,
            total: 100,
            status: "CRIADO",
            createdAt: "2026-10-21T12:00:00Z",
          },
        ],
        page: pageNumber,
        size: 20,
        totalElements: 21,
        totalPages: 2,
      }),
    });
  });
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/orders");
  await expect(
    page.getByRole("row").filter({ hasText: "First page client" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Paginação de pedidos" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Second page client" }),
  ).toBeVisible();
  expect(requestedPages).toEqual(["0", "1"]);
});
