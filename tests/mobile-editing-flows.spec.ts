import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function noOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('cron rejects zero steps and bad ranges, then recovers', async ({ page }) => {
  await page.goto('/es/workbench/cron');
  const input=page.getByRole('textbox');
  for(const value of ['*/0 * * * *','99 * * * *','1-99 * * * *','1x * * * *']){
    await input.fill(value);
    await expect(page.getByText(/Expresión inválida/)).toBeVisible();
    await expect(page.getByRole('button',{name:'Copiar expresión',exact:true})).toBeDisabled();
  }
  await page.getByRole('button',{name:'Cada 5 minutos',exact:true}).click();
  await expect(input).toHaveValue('*/5 * * * *');
  await expect(page.getByRole('button',{name:'Copiar expresión',exact:true})).toBeEnabled();
  await input.fill('0 0 31 2 *');
  await expect(page.getByRole('status')).toContainText('366 días');
  await noOverflow(page);
});
test('color normalizes shorthand and reports invalid HEX', async ({ page }) => {
  await page.goto('/es/workbench/color');
  await page.getByRole('textbox',{name:'HEX',exact:true}).fill('#abc');
  await expect(page.getByText('#aabbcc',{exact:true})).toBeVisible();
  await expect(page.locator('input[type=color]')).toHaveValue('#aabbcc');
  await page.getByRole('textbox',{name:'HEX',exact:true}).fill('#12345');
  await expect(page.getByText(/Usá 3 o 6 dígitos HEX/)).toBeVisible();
  await page.getByRole('button',{name:'#ef4444',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'HEX',exact:true})).toHaveValue('#ef4444');
  await expect(page.getByText('rgb(239, 68, 68)',{exact:true})).toBeVisible();
  await noOverflow(page);
});
test('regex supports empty replacement downloads and invalid pattern recovery', async ({ page }) => {
  await page.goto('/es/workbench/regex');
  await page.getByRole('textbox',{name:'Ingresá el patrón…',exact:true}).fill('[0-9]+');
  await page.getByRole('textbox',{name:'Texto de prueba',exact:true}).fill('a123b456');
  await page.getByRole('switch',{name:'Reemplazar (vacío elimina coincidencias)',exact:true}).click();
  await expect(page.locator('pre').filter({hasText:'ab'})).toBeVisible();
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar resultado',exact:true}).click();
  expect(await readFile((await (await event).path())!,'utf8')).toBe('ab');
  await page.getByRole('textbox',{name:'Ingresá el patrón…',exact:true}).fill('[');
  await expect(page.getByText('Patrón inválido',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Descargar resultado',exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:'Ingresá el patrón…',exact:true}).fill('[a-z]');
  await expect(page.getByRole('button',{name:'Descargar resultado',exact:true})).toBeVisible();
  await noOverflow(page);
});
test('diff reports partial comparisons without claiming identical texts', async ({ page }) => {
  await page.goto('/es/workbench/text-diff');
  const prefix=Array(1100).fill('same').join('\n');
  await page.getByRole('textbox',{name:'Original',exact:true}).fill(prefix+'\nA');
  await page.getByRole('textbox',{name:'Modificado',exact:true}).fill(prefix+'\nB');
  await expect(page.getByText('Sin diferencias en la parte analizada. El resto del texto no se comparó.')).toBeVisible();
  await expect(page.getByText('Los dos textos son idénticos',{exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:'Original',exact:true}).fill('old');
  await page.getByRole('textbox',{name:'Modificado',exact:true}).fill('new');
  await page.getByRole('button',{name:'Intercambiar textos',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Original',exact:true})).toHaveValue('new');
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar comparación',exact:true}).click();
  const text=await readFile((await (await event).path())!,'utf8');
  expect(text).toContain('-new');expect(text).toContain('+old');
  await noOverflow(page);
});

test('regex saves and restores enabled empty replacement', async ({ page }) => {
  await page.goto('/es/workbench/regex');
  await page.getByRole('textbox',{name:'Ingresá el patrón…',exact:true}).fill('[0-9]+');
  await page.getByRole('textbox',{name:'Texto de prueba',exact:true}).fill('a123b');
  await page.getByRole('switch',{name:'Reemplazar (vacío elimina coincidencias)',exact:true}).click();
  await page.getByRole('button',{name:'Guardar configuración',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Borrar números');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.goto('/es/workbench/spaces');
  await page.getByRole('button',{name:'Abrir',exact:true}).click();
  await expect(page.getByRole('switch',{name:'Reemplazar (vacío elimina coincidencias)',exact:true})).toBeChecked();
  await expect(page.locator('pre').filter({hasText:'ab'})).toBeVisible();
});

test('timestamp preset restores milliseconds and its input', async ({ page }) => {
  await page.goto('/es/workbench/timestamp');
  await page.getByLabel('Unidad del timestamp',{exact:true}).first().click();
  await page.getByTitle('Milisegundos',{exact:true}).click();
  await page.getByRole('textbox').fill('1000');
  await page.getByRole('button',{name:'Guardar configuración',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Milisegundos');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.goto('/es/workbench/spaces');
  await page.getByRole('button',{name:'Abrir',exact:true}).click();
  await expect(page.getByRole('textbox')).toHaveValue('1000');
  await expect(page.getByText('1970-01-01T00:00:01.000Z',{exact:true})).toBeVisible();
});
