/**
 * Smoke tests — los golden paths del playground.
 *
 * Reglas:
 *  - Cada test se sostiene solo. Si uno falla, los demás siguen corriendo.
 *  - Apuntan a comportamiento observable (texto visible, navegación), no a detalles de DOM.
 *  - No tocan red externa salvo el caso `dns-lookup` que aprovecha la API real.
 *  - No prueban OAuth real — eso requiere credenciales y se valida en staging.
 */
import { expect, test } from '@playwright/test';

const ALL_TOOL_NAMES = [
    'Payload Lab',
    'Type Checker',
    'JWT Decode',
    'DNS Inspector',
    'Certificate Expiry',
    'Object to Types',
    'Random String Generator',
    'Object Comparator',
    'Site Checker',
    'Snippets Shelf',
];

test.describe('Home', () => {
    test('renderiza el hero con la nueva copy', async ({ page }) => {
        await page.goto('/es');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('patio de juegos');
    });

    test('CTA primaria lleva al workbench', async ({ page }) => {
        await page.goto('/es');
        await page.getByRole('link', { name: /Abrir Workbench/i }).first().click();
        await expect(page).toHaveURL(/\/es\/workbench\/?$/);
    });

    test('preview JWT del hero muestra payload decodificado', async ({ page }) => {
        await page.goto('/es');
        // El example token incluye "maintainer-42" como sub.
        await expect(page.getByText('"sub":')).toBeVisible();
        await expect(page.getByText('maintainer-42')).toBeVisible();
    });
});

test.describe('Header', () => {
    test('muestra los links de nav y el botón de iniciar sesión', async ({ page }) => {
        await page.goto('/es');
        const header = page.locator('header').first();
        await expect(header.getByRole('link', { name: /^Workbench$/ })).toBeVisible();
        await expect(header.getByRole('link', { name: /^Pinouts$/ })).toBeVisible();
        await expect(header.getByRole('link', { name: /^Calculadoras$/ })).toBeVisible();
        await expect(header.getByRole('link', { name: /Iniciar sesión/i })).toBeVisible();
    });
});

test.describe('Workbench', () => {
    test('landing lista todas las tools', async ({ page }) => {
        await page.goto('/es/workbench');
        await expect(page.getByRole('heading', { name: 'Workbench', level: 1 })).toBeVisible();
        for (const name of ALL_TOOL_NAMES) {
            await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        }
    });

    test('section page de validación muestra sus tools', async ({ page }) => {
        await page.goto('/es/workbench/sections/validation');
        await expect(page.getByRole('heading', { name: 'Validación', level: 1 })).toBeVisible();
        await expect(page.getByText('Payload Lab').first()).toBeVisible();
        await expect(page.getByText('JWT Decode').first()).toBeVisible();
        await expect(page.getByText('DNS Inspector').first()).toBeVisible();
    });

    test('JWT decode decodifica un token de ejemplo', async ({ page }) => {
        await page.goto('/es/workbench/jwt-decode');
        await expect(page.getByText('maintainer-42')).toBeVisible();
        await expect(page.getByText('HS256').first()).toBeVisible();
    });

    test('Random string genera valores al cargar', async ({ page }) => {
        await page.goto('/es/workbench/random-string');
        // Esperamos al menos un valor monoespaciado en la lista de resultados.
        await expect(page.locator('text=/[A-Za-z0-9]{16,}/').first()).toBeVisible({ timeout: 10_000 });
    });

    test('Snippets: agregar y persistir tras reload', async ({ page }) => {
        await page.goto('/es/workbench/snippets');

        const titleInput = page.getByPlaceholder('Título del snippet');
        const bodyInput = page.getByPlaceholder(/comando, una receta, un payload/i);

        await titleInput.fill('Smoke test snippet');
        await bodyInput.fill('echo hello world');
        await page.getByRole('button', { name: 'Guardar snippet' }).click();

        await expect(page.getByText('Smoke test snippet')).toBeVisible();
        await expect(page.getByText('echo hello world')).toBeVisible();

        await page.reload();
        await expect(page.getByText('Smoke test snippet')).toBeVisible();
        await expect(page.getByText('echo hello world')).toBeVisible();

        // Limpiá para no acumular estado entre corridas locales.
        await page.evaluate(() => window.localStorage.removeItem('hios-workbench-snippets'));
    });
});

test.describe('API /api/auth/me', () => {
    test('devuelve user null cuando no hay sesión', async ({ request }) => {
        const res = await request.get('/api/auth/me');
        expect(res.status()).toBe(200);
        const data = (await res.json()) as { user: unknown };
        expect(data.user).toBeNull();
    });
});

test.describe('Theme settings', () => {
    test('cambiar preset aplica accent y persiste tras reload', async ({ page }) => {
        await page.goto('/es/workbench/settings');
        await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();

        await page.locator('[data-preset-id="cyan"]').click();

        // Esperamos a que la CSS variable se haya actualizado a cyan.
        await page.waitForFunction(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() ===
            '#0ea5e9',
        );

        await page.reload();
        // Tras reload el useEffect del ThemeProvider la reaplica desde localStorage. Esperamos.
        await page.waitForFunction(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() ===
            '#0ea5e9',
        );

        await page.evaluate(() => window.localStorage.removeItem('hios-theme-config'));
    });

    test('hex custom valida y aplica', async ({ page }) => {
        await page.goto('/es/workbench/settings');
        await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();

        const hexInput = page.getByTestId('accent-hex-input');
        await hexInput.fill('#22c55e');
        await hexInput.press('Enter');

        await page.waitForFunction(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase() ===
            '#22c55e',
        );

        // Hex inválido NO aplica y muestra error
        await hexInput.fill('not-a-hex');
        await hexInput.press('Enter');
        await expect(page.getByText(/Formato inválido/i)).toBeVisible();
        const accentAfterInvalid = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
        );
        expect(accentAfterInvalid.toLowerCase()).toBe('#22c55e');

        await page.evaluate(() => window.localStorage.removeItem('hios-theme-config'));
    });
});

test.describe('Páginas secundarias', () => {
    test('Pinouts carga', async ({ page }) => {
        await page.goto('/es/pinouts');
        await expect(page.getByRole('heading', { name: /Pinouts/i }).first()).toBeVisible();
    });

    test('Calculadoras carga', async ({ page }) => {
        await page.goto('/es/calculators');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });
});
