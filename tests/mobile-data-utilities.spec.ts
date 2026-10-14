import { expect, test } from '@playwright/test';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
async function noOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('URL editor preserves percent values, encoded credentials and repeated parameters', async ({ page }) => {
  await page.goto('/es/workbench/url-parser');
  const input=page.getByRole('textbox',{name:'Pegá una URL…',exact:true});
  await input.fill('https://a%40b:p%25@example.com/?x=%25&x=%2520&=blank#end');
  await expect(page.getByRole('cell',{name:'%',exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'%20',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Editar parámetros',exact:true}).click();
  await page.getByRole('button',{name:'Aplicar',exact:true}).click();
  await expect(input).toHaveValue('https://a%40b:p%25@example.com/?x=%25&x=%2520&=blank#end');
  await noOverflow(page);
});
test('URL parameters can be created from scratch and abandoned without changing the URL', async ({ page }) => {
  await page.goto('/es/workbench/url-parser');
  const input=page.getByRole('textbox',{name:'Pegá una URL…',exact:true});
  await input.fill('https://example.com/path#end');
  await page.getByRole('button',{name:'Editar parámetros',exact:true}).click();
  await page.getByRole('button',{name:/Agregar parámetro/}).click();
  await page.getByRole('textbox',{name:'Clave 1',exact:true}).fill('q');
  await page.getByRole('textbox',{name:'Valor 1',exact:true}).fill('hello world');
  await noOverflow(page);
  await page.getByRole('button',{name:'Aplicar',exact:true}).click();
  await expect(input).toHaveValue('https://example.com/path?q=hello+world#end');
  await page.getByRole('button',{name:'Editar parámetros',exact:true}).click();
  await page.getByRole('textbox',{name:'Valor 1',exact:true}).fill('discard me');
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await expect(input).toHaveValue('https://example.com/path?q=hello+world#end');
});
test('hash computes empty input and hides stale results during slow calculations', async ({ page }) => {
  await page.addInitScript(()=>{
    const original=SubtleCrypto.prototype.digest;
    SubtleCrypto.prototype.digest=async function(...args: Parameters<SubtleCrypto['digest']>){
      await new Promise(resolve=>setTimeout(resolve,500));
      return original.apply(this,args);
    };
  });
  await page.goto('/es/workbench/hash-digest');
  await page.getByRole('textbox',{name:'Entrada',exact:true}).fill('abc');
  await expect(page.getByText(createHash('sha256').update('abc').digest('hex'),{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Entrada',exact:true}).fill('new');
  await expect(page.getByRole('button',{name:/Copiar SHA/})).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Calculando…');
  await page.getByRole('button',{name:'Limpiar',exact:true}).click();
  await expect(page.getByText(createHash('sha256').update('').digest('hex'),{exact:true})).toBeVisible();
  await noOverflow(page);
});
test('hash reports Web Crypto errors', async ({ page })=>{
  await page.addInitScript(()=>{SubtleCrypto.prototype.digest=async()=>{throw new Error('unavailable');};});
  await page.goto('/es/workbench/hash-digest');
  await expect(page.getByRole('status')).toContainText('No se pudo calcular');
  await expect(page.getByRole('button',{name:/Copiar SHA/})).toHaveCount(0);
});
test('HMAC accepts empty messages, exposes missing keys and restores SHA-1 presets', async ({ page }) => {
  await page.goto('/es/workbench/hmac');
  const secret=page.getByLabel('Clave secreta',{exact:true});
  await secret.fill('test-key');
  await page.getByRole('textbox',{name:'Mensaje',exact:true}).fill('');
  await expect(page.getByText(createHmac('sha256','test-key').update('').digest('hex'),{exact:true})).toBeVisible();
  await secret.fill('');
  await expect(page.getByRole('status')).toContainText('Ingresá una clave');
  await secret.fill('test-key');
  await page.getByText('SHA-1',{exact:true}).click();
  await page.getByRole('button',{name:'Guardar configuración',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.goto('/es/workbench/spaces');
  await page.getByRole('button',{name:'Abrir',exact:true}).click();
  await expect(page.getByText(createHmac('sha1','test-key').update('').digest('hex'),{exact:true})).toBeVisible();
  await noOverflow(page);
});
test('random strings handle an empty alphabet and download the displayed values', async ({ page }) => {
  await page.goto('/es/workbench/random-string');
  for(const name of ['Mayúsculas','Minúsculas','Números'])await page.getByRole('checkbox',{name,exact:true}).uncheck();
  await expect(page.getByText('Elegí al menos un grupo de caracteres')).toBeVisible();
  await expect(page.getByRole('button',{name:/Generar/,exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'Números',exact:true}).check();
  await page.getByRole('spinbutton',{name:'Longitud',exact:true}).fill('12');
  const rows=page.locator('[class*="generatedValue"]');
  await expect(rows).toHaveCount(4);
  await expect(rows.first()).toHaveText(/^\d{12}$/);
  const values=await rows.allTextContents();
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar .txt',exact:true}).click();
  expect((await readFile((await (await event).path())!,'utf8')).split('\n')).toEqual(values);
  await noOverflow(page);
});
