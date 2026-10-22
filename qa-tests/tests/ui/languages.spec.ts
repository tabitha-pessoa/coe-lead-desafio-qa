import { test, expect } from "@playwright/test";

const languages = [
  {
    code: "pt-BR",
    label: "Português",
    dashboard: "Dashboard",
    catalog: "Catálogo",
    order: "Novo pedido",
  },
  {
    code: "en",
    label: "English",
    dashboard: "Dashboard",
    catalog: "Catalog",
    order: "New order",
  },
  {
    code: "es",
    label: "Español",
    dashboard: "Panel",
    catalog: "Catálogo",
    order: "Nuevo pedido",
  },
];

test("LANG-01 renders dashboard, catalog and order form in Portuguese, English and Spanish", async ({
  page,
}) => {
  await page.route("**/api/orders**", async (route) => {
    if (route.request().url().split("?")[0]?.endsWith("/api/orders")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "10000000-0000-4000-8000-000000000001",
        client: {
          name: "Language Client",
          document: "123",
          email: "language@example.com",
        },
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        status: "CRIADO",
        createdAt: "2026-10-21T12:00:00Z",
      }),
    });
  });

  for (const language of languages) {
    await page.goto("/");
    await page.getByRole("button", { name: /idioma|language/i }).click();
    await page
      .getByRole("button", { name: new RegExp(language.label) })
      .click();
    await expect(page.locator("html")).toHaveAttribute("lang", language.code);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      language.dashboard,
    );

    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      language.catalog,
    );

    await page.goto("/orders/new");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      language.order,
    );

    await page.goto("/orders");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      language.code === "en" ? "Orders" : "Pedidos",
    );

    await page.goto("/orders/10000000-0000-4000-8000-000000000001");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      language.code === "pt-BR"
        ? "Detalhes do pedido"
        : language.code === "en"
          ? "Order details"
          : "Detalles del pedido",
    );
  }
});
