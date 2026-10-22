import { test, expect } from "@playwright/test";

test("CAT-01 individual lookup displays name, current price, currency and status", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/catalog");
  await page.locator("#catalog-ids").fill("PROD-001");
  await page.locator('form button[type="submit"]').click();
  const row = page.getByRole("row").filter({ hasText: "PROD-001" });
  await expect(row).toBeVisible();
  await expect(row.locator("td").nth(1)).toHaveText(
    "Notebook Dell Inspiron 15",
  );
  await expect(row.locator("td").nth(2)).toContainText(/3\.500,00/);
  await expect(row.locator("td").nth(3)).toHaveText("BRL");
  await expect(row.locator("td").nth(4)).toContainText("Ativo");
});

test("CAT-02 batch lookup displays every product field and reports unknown IDs", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/catalog");
  await page.locator("#catalog-ids").fill("PROD-001, PROD-002 UNKNOWN-ID");
  await page.locator('form button[type="submit"]').click();

  const notebook = page.getByRole("row").filter({ hasText: "PROD-001" });
  const mouse = page.getByRole("row").filter({ hasText: "PROD-002" });
  await expect(notebook.locator("td").nth(1)).toHaveText(
    "Notebook Dell Inspiron 15",
  );
  await expect(notebook.locator("td").nth(2)).toContainText(/3\.500,00/);
  await expect(notebook.locator("td").nth(3)).toHaveText("BRL");
  await expect(notebook.locator("td").nth(4)).toContainText("Ativo");
  await expect(mouse.locator("td").nth(1)).toHaveText(
    "Mouse Logitech MX Master 3S",
  );
  await expect(mouse.locator("td").nth(2)).toContainText(/499,90/);
  await expect(mouse.locator("td").nth(3)).toHaveText("BRL");
  await expect(mouse.locator("td").nth(4)).toContainText("Ativo");
  await expect(page.getByRole("alert")).toContainText("UNKNOWN-ID");
});

test("CAT-03 empty and whitespace-only searches show validation without calling the API", async ({
  page,
}) => {
  let catalogCalls = 0;
  await page.route("**/api/catalog/**", async (route) => {
    catalogCalls += 1;
    await route.continue();
  });
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/catalog");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("#catalog-ids")).toHaveClass(/is-invalid/);
  await expect(page.getByText("Campo obrigatório")).toBeVisible();

  await page.locator("#catalog-ids").fill(" , ;  ");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("#catalog-ids")).toHaveClass(/is-invalid/);
  await expect(page.getByText("Campo obrigatório")).toBeVisible();
  expect(catalogCalls).toBe(0);
});

test("CAT-04 individually querying an unknown ID shows a visible error", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/catalog");
  await page.locator("#catalog-ids").fill("UNKNOWN-ID");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Produto não encontrado");
});

test("CAT-05 rejects more than 50 IDs before making a request", async ({
  page,
}) => {
  let catalogCalls = 0;
  await page.route("**/api/catalog/**", async (route) => {
    catalogCalls += 1;
    await route.continue();
  });
  await page.addInitScript(() => localStorage.setItem("app-language", "pt-BR"));
  await page.goto("/catalog");
  await page
    .locator("#catalog-ids")
    .fill(Array.from({ length: 51 }, (_, index) => `ID-${index}`).join(","));
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("50 IDs");
  expect(catalogCalls).toBe(0);
});
