import { expect, test } from "@playwright/test";

for (const [slug, endpoint] of [
  ["dns-lookup", "dns"],
  ["certificate-check", "certificate"],
  ["whois-rdap", "rdap"],
]) {
  test(`${slug} requires explicit external consent and execution`, async ({
    page,
  }) => {
    const requests: string[] = [];
    await page.route(`**/api/workbench/${endpoint}?**`, (route) => {
      requests.push(route.request().url());
      return route.fulfill({ status: 400, json: { error: "Test response" } });
    });
    await page.goto(`/es/workbench/${slug}`);
    const consent = page.getByRole("checkbox", { name: /Autorizo enviar/ });
    await expect(consent).toBeVisible();
    const run = page
      .getByRole("button", {
        name: /Consultar|Inspeccionar|Revisar certificado/,
      })
      .first();
    await run.click();
    expect(requests).toEqual([]);
    await consent.check();
    await page.getByRole("button", { name: /Ejemplo|Cargar ejemplo/i }).click();
    expect(requests).toEqual([]);
    await run.click();
    await expect.poll(() => requests.length).toBe(1);
  });
}

test("drawing editor loads self-hosted fonts without third-party requests", async ({
  page,
  baseURL,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      new URL(request.url()).origin !== new URL(baseURL!).origin
    )
      external.push(request.url());
  });
  await page.goto("/es/workbench/excalidraw");
  await expect(page.locator(".excalidraw canvas").first()).toBeVisible();
  await page.keyboard.press("t");
  await page
    .locator(".excalidraw canvas")
    .last()
    .click({ position: { x: 250, y: 250 } });
  await page.keyboard.type("Local fonts");
  await page.keyboard.press("Escape");
  expect(external).toEqual([]);
});
