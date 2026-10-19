import { expect, type Page } from '@playwright/test';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import de from '../../messages/de.json';
import it from '../../messages/it.json';
import { inspectMobileLayout } from './mobile-layout';

export const guideMessages = { en, es, de, it };
export type GuideLocale = keyof typeof guideMessages;
export type GuideId = 'pad' | 'btdac' | 'speaker';

async function selectTab(page: Page, name: string) {
  await page.getByRole('tablist').scrollIntoViewIfNeeded();
  const tab = page.getByRole('tab', { name, exact: true });
  const clipped = await tab.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const wrap = element.closest('.ant-tabs-nav-wrap')!.getBoundingClientRect();
    return rect.left < wrap.left || rect.right > wrap.right;
  });
  if (clipped) {
    await page.getByRole('tablist').locator('button[aria-haspopup="listbox"]').click();
    await page.getByRole('option', { name, exact: true }).click();
  } else await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** SVG text does not wrap with CSS; detect clipping in diagram coordinates. */
export async function checkDiagramText(page: Page) {
  const errors = await page.locator('[role="tabpanel"]:visible svg[role="img"]').evaluateAll(svgs => svgs.flatMap(svg => {
    const view = (svg as SVGSVGElement).viewBox.baseVal;
    const texts = [...svg.querySelectorAll('text')];
    return texts.flatMap(text => {
      const b = text.getBBox();
      return b.x < view.x - 1 || b.y < view.y - 1 || b.x + b.width > view.x + view.width + 1 || b.y + b.height > view.y + view.height + 1
        ? [text.textContent] : [];
    });
  }));
  expect(errors, 'SVG labels stay within their diagram').toEqual([]);
}

export async function exerciseGuide(page: Page, locale: GuideLocale, id: GuideId, mobile = false) {
  const messages = guideMessages[locale];
  const copy = messages.WiringGuideContent[id];
  const ui = messages.WiringGuide.ui;
  const tab = (key: keyof typeof messages.WiringGuide.tabs) => selectTab(page, messages.WiringGuide.tabs[key]);
  await page.goto(`/${locale}/pinouts/${id}`);
  await expect(page.getByText(copy.meta_subtitle, { exact: true })).toBeVisible();
  await expect(page.locator('[data-guide-note]')).toContainText(copy.meta_note);
  await expect(page.getByText(ui.systemIntro, { exact: true })).toBeVisible();
  await checkDiagramText(page);
  if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  await tab('pines');
  const search = page.getByRole('textbox', { name: ui.search });
  await search.fill('no-such-pin');
  await expect(page.getByText(ui.empty, { exact: true })).toBeVisible();
  await search.fill(id === 'pad' ? '48' : id === 'btdac' ? '27' : '34');
  await expect(page.locator('tbody tr').last()).toContainText(id === 'pad' ? copy['pin_48_name' as keyof typeof copy] : id === 'btdac' ? 'I2S BCK' : 'VBAT ADC');
  await search.fill('');
  if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  if (id === 'pad') {
    await tab('botones');
    await expect(page.getByText(ui.buses.replace('{cols}', '5').replace('{rows}', '2'), { exact: true })).toBeVisible();
    await checkDiagramText(page);
    if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  }
  if (id !== 'btdac') {
    await tab('parlantes');
    await expect(page.locator('[data-max98357-lab] [data-divider-readout]')).toContainText('1.087 V');
    if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  }
  await tab('conexiones');
  for (const detail of await page.locator('details').all()) {
    if (await detail.getAttribute('open') === null) await detail.locator('summary').click();
  }
  await expect(page.locator('details').first()).toContainText(copy.section_0_t);
  if (id === 'pad') await expect(page.locator('pre').nth(1)).toContainText('|>|');
  if (id === 'speaker') await expect(page.locator('details').first()).toContainText('8.4V');
  if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  await tab('check');
  await expect(page.getByRole('checkbox').first()).toHaveAccessibleName(copy.check_0);
  await page.getByRole('checkbox').first().check();
  if (mobile) expect(await page.evaluate(inspectMobileLayout)).toEqual([]);
  // Locale-independent IDs preserve progress without transferring it to another project.
  const nextLocale = locale === 'en' ? 'de' : 'en';
  await page.goto(`/${nextLocale}/pinouts/${id}`);
  await selectTab(page, guideMessages[nextLocale].WiringGuide.tabs.check);
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByRole('checkbox').first()).toHaveAccessibleName(guideMessages[nextLocale].WiringGuideContent[id].check_0);
}
