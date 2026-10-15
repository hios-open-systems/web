import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`project STL opens in the built-in viewer at ${width}px`, async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /^https?:/.test(request.url()) &&
        new URL(request.url()).origin !== new URL(baseURL!).origin
      ) {
        externalRequests.push(request.url());
      }
    });
    await page.goto("/es/projects/pad");
    const preview = page
      .getByRole("button", { name: /Ver en 3D$/ })
      .first();
    await preview.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("canvas")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Pausar giro" }),
    ).toBeVisible({ timeout: 30000 });
    await dialog.getByRole("button", { name: "Pausar giro" }).click();
    await expect(
      dialog.getByRole("button", { name: "Girar", exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Reencuadrar" }).click();
    await expect(
      dialog.getByRole("link", { name: /Descargar$/ }),
    ).toHaveAttribute("href", /\.stl$/i);
    expect(context.pages()).toHaveLength(1);
    expect(externalRequests).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/project-stl-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await preview.click();
    await expect(
      dialog.getByRole("button", { name: "Pausar giro" }),
    ).toBeVisible();
  });
}
