import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function noOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('negative numbers survive base changes and large integers fit mobile', async ({ page }) => {
  await page.goto('/es/workbench/number-base');
  const input=page.locator('main input').last();
  await input.fill('-255');
  await page.getByRole('button',{name:'swap Hex',exact:true}).click();
  await expect(input).toHaveValue('-FF');
  await expect(page.getByText('Valor inválido para esta base')).toHaveCount(0);
  await input.fill('-0xFF');
  await page.getByRole('button',{name:'swap Decimal',exact:true}).click();
  await expect(input).toHaveValue('-255');
  await input.fill('1208925819614629174706176');
  await expect(page.getByText('88 bits',{exact:true})).toBeVisible();
  await noOverflow(page);
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));
  await page.getByRole('button',{name:'Copiar Hex',exact:true}).click();
  await expect(page.getByText('No se pudo copiar',{exact:true})).toBeVisible();
});
test('timestamps accept epoch, negatives and explicit milliseconds', async ({ page }) => {
  await page.goto('/es/workbench/timestamp');
  const input=page.getByRole('textbox');
  await input.fill('0');
  await expect(page.getByText('1970-01-01T00:00:00.000Z',{exact:true})).toBeVisible();
  await input.fill('-1');
  await expect(page.getByText('1969-12-31T23:59:59.000Z',{exact:true})).toBeVisible();
  await page.getByLabel('Unidad del timestamp',{exact:true}).first().click();
  await page.getByTitle('Milisegundos',{exact:true}).click();
  await input.fill('1000');
  await expect(page.getByText('1970-01-01T00:00:01.000Z',{exact:true})).toBeVisible();
  await noOverflow(page);
});
test('encoder reverses the result and recovers from invalid input', async ({ page }) => {
  await page.goto('/es/workbench/encoder');
  await page.getByRole('textbox').fill('Hola 👋');
  await page.getByRole('button',{name:'Invertir dirección',exact:true}).click();
  await expect(page.getByRole('textbox')).toHaveValue('SG9sYSDwn5GL');
  await expect(page.locator('pre').filter({hasText:'Hola 👋'})).toBeVisible();
  await page.getByRole('textbox').fill('%%%');
  await expect(page.getByText('Entrada inválida para este modo',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Invertir dirección',exact:true})).toBeDisabled();
  await page.getByRole('textbox').fill('SG9sYQ==');
  await expect(page.locator('pre').filter({hasText:'Hola'})).toBeVisible();
  await noOverflow(page);
});
test('image Base64 reports damaged files then exports valid content', async ({ page }) => {
  await page.goto('/es/workbench/image-base64');
  await page.locator('input[type=file]').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not a png')});
  await expect(page.getByText('No se pudo abrir la imagen. Probá con otro archivo.')).toBeVisible();
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=40;return c.toDataURL().split(',')[1];});
  await page.locator('input[type=file]').setInputFiles({name:'a-very-long-name-to-check-that-metadata-wraps-on-mobile.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar Base64 only',exact:true}).click();
  const download=await event;
  expect(await readFile((await download.path())!,'utf8')).toBe(png);
  await noOverflow(page);
  await page.getByRole('button',{name:'Limpiar',exact:true}).click();
  await expect(page.locator('input[type=file]')).toBeAttached();
});
test('identifier downloads preserve the generated list', async ({ page }) => {
  await page.goto('/es/workbench/uuid-ulid');
  await expect(page.locator('[class*="generatedValue"]')).toHaveCount(5);
  const values=await page.locator('[class*="generatedValue"]').allTextContents();
  expect(values).toHaveLength(5);
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar .txt',exact:true}).click();
  const download=await event;
  expect((await readFile((await download.path())!,'utf8')).split('\n')).toEqual(values);
  await noOverflow(page);
});
