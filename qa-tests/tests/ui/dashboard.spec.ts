import { test, expect } from "@playwright/test";

test("DASH-01 shows API-derived order indicators and working shortcuts", async ({
  page,
}) => {
  await page.route("**/api/orders**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [
          {
            id: "10000000-0000-4000-8000-000000000001",
            client: {
              name: "Client One",
              document: "123",
              email: "one@example.com",
            },
            items: [],
            subtotal: 100,
            discount: 0,
            total: 100,
            status: "CRIADO",
            createdAt: "2026-10-21T12:00:00Z",
          },
          {
            id: "10000000-0000-4000-8000-000000000002",
            client: {
              name: "Client Two",
              document: "456",
              email: "two@example.com",
            },
            items: [],
            subtotal: 300,
            discount: 50,
            total: 250,
            status: "CRIADO",
            createdAt: "2026-10-20T12:00:00Z",
          },
        ],
        page: 0,
        size: 100,
        totalElements: 7,
        totalPages: 1,
      }),
    });
  });

  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
  await expect(
    page.locator(".card").filter({ hasText: "Total de pedidos" }),
  ).toContainText("7");
  await expect(
    page
      .locator(".card")
      .filter({ hasText: "Pedidos por status (carregados)" }),
  ).toContainText("2");
  await expect(
    page
      .locator(".card")
      .filter({ hasText: "Valor total (pedidos carregados)" }),
  ).toContainText(/R\$\s*350,00/);

  await expect(
    page.getByRole("link", { name: "Criar pedido" }),
  ).toHaveAttribute("href", "/orders/new");
  await expect(page.getByRole("link", { name: "Ver pedidos" })).toHaveAttribute(
    "href",
    "/orders",
  );
  await expect(
    page.getByRole("link", { name: "Consultar catálogo" }),
  ).toHaveAttribute("href", "/catalog");
});
