import { expect, test } from '@playwright/test';

const representativeRoutes = [
    '/es',
    '/es/blog',
    '/es/projects',
    '/es/pinouts',
    '/es/calculators',
    '/es/workbench',
    '/es/workbench/regex',
    '/es/workbench/settings',
    '/es/workbench/feedback',
    '/es/prints',
];

test.describe('responsive shell', () => {
    for (const route of representativeRoutes) {
        test(`${route} does not overflow horizontally`, async ({ page }) => {
            await page.goto(route);
            await expect(page.locator('body')).toBeVisible();

            const dimensions = await page.evaluate(() => ({
                clientWidth: document.documentElement.clientWidth,
                scrollWidth: document.documentElement.scrollWidth,
            }));

            expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
        });
    }

    test('mobile header exposes four clear controls without overlap', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'tablet-768', 'Tablet keeps the desktop navigation contract.');
        await page.goto('/es/blog');

        const header = page.locator('header');
        const interactive = header.locator('a:visible, button:visible');
        await expect(interactive).toHaveCount(4);

        const boxes = await interactive.evaluateAll((elements) => elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        }));

        for (const box of boxes) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
        }
        for (let index = 1; index < boxes.length; index += 1) {
            expect(boxes[index].left).toBeGreaterThanOrEqual(boxes[index - 1].right - 1);
        }
    });

    test('drawer contains secondary actions and preserves locale navigation', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'tablet-768', 'Drawer is a mobile navigation surface.');
        await page.goto('/es/blog');

        await page.getByRole('button', { name: 'Menú' }).click();
        const drawer = page.getByRole('dialog');
        await expect(drawer).toBeVisible();
        await expect(drawer.getByText('Feedback', { exact: false })).toBeVisible();
        await expect(drawer.getByText('Configuración', { exact: true })).toBeVisible();

        const actionHeights = await drawer
            .locator('a:visible, button:visible, [role="combobox"]:visible')
            .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
        for (const height of actionHeights) expect(height).toBeGreaterThanOrEqual(44);

        await drawer.getByRole('link', { name: 'Proyectos' }).click();
        await expect(page).toHaveURL(/\/es\/projects$/);
    });

    test('search remains directly accessible on mobile', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name === 'tablet-768', 'Mobile-only header assertion.');
        await page.goto('/es');
        await page.getByRole('button', { name: 'Buscar' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
    });
});
