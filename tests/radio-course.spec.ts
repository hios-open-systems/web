import { expect, test } from '@playwright/test';
import es from '../messages/es.json';

const COURSE = '/es/radio';
const LESSON_BASE = `${COURSE}/lecciones`;
const LESSONS = ['voltage', 'current', 'resistance', 'ohm', 'series', 'parallel', 'power', 'measurement', 'practice'] as const;
const RESOURCES = ['bands', 'laboratory', 'glossary', 'sources'] as const;

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { user: null } }));
});

test('course home is an index and lessons have their own content, URLs and navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(COURSE);
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  const home = page.getByTestId('radio-course-home');
  await expect(home).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electricidad para radioaficionados');
  await expect(page.getByTestId('radio-lesson-list').getByRole('link')).toHaveCount(9);
  await expect(page.getByTestId('radio-resource-list').getByRole('link')).toHaveCount(4);
  await expect(home.locator('[data-concept]')).toHaveCount(0);
  await expect(page.getByTestId('dc-circuit-lab')).toHaveCount(0);
  await expect(page.getByTestId('radio-glossary')).toHaveCount(0);

  await page.getByRole('button', { name: es.RadioCourse.start, exact: true }).click();
  await expect(page).toHaveURL(`${LESSON_BASE}/voltage`);
  await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages.voltage.title);
  const content = page.locator('[data-radio-lesson]');
  await expect(content.locator('[data-concept]')).toHaveCount(1);
  await expect(content.locator('[data-concept="voltage"]')).toBeVisible();
  await expect(content).toContainText(es.RadioBasics.concepts.voltage.definition);
  await expect(content).not.toContainText(es.RadioBasics.concepts.current.definition);
  await expect(content).not.toContainText(es.RadioBasics.concepts.resistance.definition);
  const navigation = page.getByRole('navigation', { name: es.RadioCourse.navigation, exact: true }).first();
  for (const id of [...LESSONS, ...RESOURCES]) {
    await expect(navigation.locator(`a[href="${LESSON_BASE}/${id}"]`)).toHaveCount(1);
  }

  await page.getByRole('link', { name: /Siguiente.*Corriente/ }).click();
  await expect(page).toHaveURL(`${LESSON_BASE}/current`);
  await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages.current.title);
  await expect(content.locator('[data-concept="current"]')).toBeVisible();
  await expect(content.locator('[data-concept="voltage"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await expect(page).toHaveURL(`${LESSON_BASE}/current`);
  await expect(page.locator('[data-radio-page="current"]')).toBeVisible();
  await expect(navigation).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${LESSON_BASE}/voltage`);
  await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages.voltage.title);
  await page.getByRole('link', { name: es.RadioCourse.backToCourse, exact: true }).first().click();
  await expect(page).toHaveURL(COURSE);
  await expect(home).toBeVisible();
  expect(errors).toEqual([]);
});

test('series and parallel are separate lessons with scoped worked examples', async ({ page }) => {
  await page.goto(`${LESSON_BASE}/series`);
  const content = page.locator('[data-radio-lesson]');
  await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages.series.title);
  await expect(content).toContainText(es.RadioBasics.connections.seriesBody);
  await expect(content).not.toContainText(es.RadioBasics.connections.parallelBody);
  await expect(content).toContainText('40 mA');
  await expect(content.locator('#parallel')).toHaveCount(0);
  await expect(page.getByTestId('dc-circuit-lab')).toHaveCount(0);
  await page.getByRole('link', { name: /Siguiente.*Circuitos en paralelo/ }).click();
  await expect(page).toHaveURL(`${LESSON_BASE}/parallel`);
  await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages.parallel.title);
  await expect(content).toContainText(es.RadioBasics.connections.parallelBody);
  await expect(content).not.toContainText(es.RadioBasics.connections.seriesBody);
  await expect(content).toContainText('180 mA');
  await expect(content.locator('#series')).toHaveCount(0);
});

for (const lesson of ['resistance', 'ohm', 'power', 'measurement'] as const) {
  test(`${lesson} is directly addressable as a standalone lesson`, async ({ page }) => {
    await page.goto(`${LESSON_BASE}/${lesson}`);
    await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages[lesson].title);
    await expect(page.locator(`[data-radio-page="${lesson}"] [data-radio-lesson]`)).toBeVisible();
    await expect(page.getByTestId('dc-circuit-lab')).toHaveCount(0);
    await expect(page.getByTestId('radio-glossary')).toHaveCount(0);
  });
}

test('lesson metadata points to its own route and invalid chapters return 404', async ({ page, request }) => {
  await page.goto(`${LESSON_BASE}/voltage`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es\/radio\/lecciones\/voltage$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/radio\/lecciones\/voltage$/);
  await expect(page).toHaveTitle(new RegExp(es.RadioCourse.pages.voltage.title));
  expect((await request.get(`${LESSON_BASE}/not-a-chapter`)).status()).toBe(404);
  expect((await request.get('/es/workbench/ohms-law/voltage')).status()).toBe(404);
});

test('legacy chapter bookmarks resolve to the corresponding standalone page', async ({ page }) => {
  const bookmarks = { concepts: 'voltage', ohm: 'ohm', connections: 'series', laboratory: 'laboratory', power: 'power', practice: 'practice', glossary: 'glossary' };
  for (const [hash, chapter] of Object.entries(bookmarks)) {
    await page.goto(`${COURSE}#${hash}`);
    await expect(page).toHaveURL(`${LESSON_BASE}/${chapter}`);
    await expect(page.locator(`[data-radio-page="${chapter}"]`)).toBeVisible();
  }
});

test('reference resources do not display lesson previous or next controls', async ({ page }) => {
  for (const resource of RESOURCES) {
    await page.goto(`${LESSON_BASE}/${resource}`);
    await expect(page.locator('#radio-page-title')).toHaveText(es.RadioCourse.pages[resource].title);
    await expect(page.getByRole('link', { name: /^Anterior/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Siguiente/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: es.RadioCourse.backToCourse, exact: true }).first()).toBeVisible();
  }
});

test('the course keeps the official program and its chapter references accessible', async ({ page }) => {
  await page.goto(COURSE);
  await page.locator(`a[href="${COURSE}/programa"]`).first().click();
  await expect(page).toHaveURL(`${COURSE}/programa`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Radioaficionado, de cero a la licencia');
  await expect(page.locator(`a[href="${COURSE}/a-electricidad"]`).first()).toBeVisible();
  await page.locator(`a[href="${COURSE}/morse"]`).first().click();
  await expect(page).toHaveURL(`${COURSE}/morse`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Código Morse');
});

test('old course URLs redirect to the recovered index and standalone lessons', async ({ page, request }) => {
  const oldBase = '/es/workbench/radio-basics';
  for (const [oldPath, destination] of [
    [oldBase, COURSE],
    [`${oldBase}/voltage`, `${LESSON_BASE}/voltage`],
    [`${oldBase}/bands`, `${LESSON_BASE}/bands`],
  ]) {
    const response = await request.get(oldPath, { maxRedirects: 0 });
    expect([307, 308]).toContain(response.status());
    expect(new URL(response.headers().location, response.url()).pathname).toBe(destination);
    await page.goto(oldPath);
    await expect(page).toHaveURL(destination);
  }
  await expect(page.getByTestId('radio-band-spectrum')).toBeVisible();
});
