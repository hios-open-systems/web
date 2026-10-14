import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function contents(download: import('@playwright/test').Download) {
  return readFile((await download.path())!);
}
test('CSV converts, downloads and rejects mixed JSON tables', async ({ page }) => {
  await page.goto('/es/workbench/csv-json');
  await page.locator('main textarea').fill('name,age\nAna,25');
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect(JSON.parse((await contents(await jsonDownload)).toString())).toEqual([{name:'Ana',age:'25'}]);
  await page.getByText('JSON → CSV', { exact: true }).click();
  await expect(page.locator('main textarea')).toHaveValue(/Ana/);
  await page.locator('main textarea').fill('[[1,true,null],["dos",2,3]]');
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await contents(await csvDownload)).toString()).toBe('1,true,\ndos,2,3');
  await page.locator('main textarea').fill('[1,{"x":2}]');
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('notes save on quick navigation, export and confirm deletion', async ({ page }) => {
  await page.goto('/es/workbench/notes');
  await page.locator('main textarea').fill('# Último cambio');
  await page.reload();
  await expect(page.locator('main textarea')).toHaveValue('# Último cambio');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar .md' }).click();
  expect((await contents(await download)).toString()).toBe('# Último cambio');
  await page.getByRole('button', { name: /^Eliminar:/ }).first().click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('main textarea')).toHaveValue('# Último cambio');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('notes report unavailable storage without blocking download', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); }; });
  await page.goto('/es/workbench/notes');
  await expect(page.getByRole('status').filter({hasText:'No se pudo guardar'})).toBeVisible();
  await expect(page.getByRole('button', {name:'Descargar .md'})).toBeEnabled();
});

test('Mermaid cannot download stale diagrams', async ({ page }) => {
  await page.goto('/es/workbench/mermaid');
  const download = page.getByRole('button', { name: /SVG/ });
  await expect(download).toBeEnabled({timeout:20000});
  await page.locator('main textarea').fill('not a valid diagram');
  await expect(download).toBeDisabled();
  await expect(page.getByTestId('mermaid-preview')).toHaveCount(0);
  await page.locator('main textarea').fill('graph TD\n A-->B');
  await expect(download).toBeEnabled({timeout:20000});
  const event = page.waitForEvent('download');
  await download.click();
  expect((await contents(await event)).toString()).toContain('<svg');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('image preview and genuine format downloads work on mobile', async ({ page }) => {
  await page.goto('/es/workbench/image-convert');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 40;
    canvas.getContext('2d')!.fillRect(0, 0, 40, 40);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({
    name:'test.png',mimeType:'image/png',
    buffer:Buffer.from(png,'base64')
  });
  await expect(page.getByRole('img',{name:'test.png',exact:true})).toBeVisible();
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'JPG',exact:true}).click();
  const bytes=await contents(await event);
  expect(bytes.subarray(0,2)).toEqual(Buffer.from([255,216]));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Limpiar',exact:true}).click();
  await expect(page.locator('input[type=file]')).toBeAttached();
});

test('audio preview and WAV/MP3 downloads contain audio', async ({ page }) => {
  const frames=4410, wav=Buffer.alloc(44+frames*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
  wav.write('data',36);wav.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++)wav.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/44100)*12000),44+i*2);
  await page.goto('/es/workbench/audio-convert');
  await page.locator('input[type=file]').setInputFiles({name:'tone.wav',mimeType:'audio/wav',buffer:wav});
  await expect(page.locator('audio')).toBeVisible();
  for(const name of ['WAV','MP3']){
    const event=page.waitForEvent('download');
    await page.getByRole('button',{name,exact:true}).click();
    expect((await contents(await event)).length).toBeGreaterThan(100);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('failed preset saves keep the dialog and entered name', async ({ page }) => {
  await page.goto('/es/workbench/csv-json');
  await page.getByRole('button', {name:'Guardar configuración',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('Mi tabla');
  await page.evaluate(() => { IDBObjectStore.prototype.put = () => { throw new Error('Disk full'); }; });
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox')).toHaveValue('Mi tabla');
  await expect(dialog.getByRole('alert')).toBeVisible();
});

test('whiteboard exports a reopenable scene and restores it on reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('hios-excalidraw-scene')) return;
    localStorage.setItem('hios-excalidraw-scene', JSON.stringify({
      version:1,files:{},appState:{viewBackgroundColor:'#ffffff'},
      elements:[{id:'rectangle-test',type:'rectangle',x:100,y:100,width:100,height:60,angle:0,
        strokeColor:'#000000',backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,
        strokeStyle:'solid',roughness:1,opacity:100,groupIds:[],frameId:null,roundness:null,
        seed:1,version:1,versionNonce:1,isDeleted:false,boundElements:null,updated:1,link:null,locked:false}]
    }));
  });
  await page.goto('/es/workbench/excalidraw');
  await expect(page.locator('.excalidraw canvas').first()).toBeVisible({timeout:20000});
  const button=page.getByRole('button',{name:/Descargar escena/});
  const event=page.waitForEvent('download');
  await button.click();
  const download=await event;
  expect(download.suggestedFilename()).toBe('hios-diagram.excalidraw');
  const scene=JSON.parse((await contents(download)).toString());
  expect(scene.type).toBe('excalidraw');
  expect(scene.elements[0].id).toBe('rectangle-test');
  await page.reload();
  await expect(page.locator('.excalidraw canvas').first()).toBeVisible({timeout:20000});
  await expect(button).toBeEnabled();
});
