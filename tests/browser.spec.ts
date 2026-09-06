import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const winDemo = async (page: import('@playwright/test').Page) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /split/i }).click();
  await page.getByRole('button', { name: /split/i }).click();
  await page.getByRole('button', { name: /read \+ split/i }).click();
};

test('@claim:demo-isolation keeps sample progress separate from a real practice run', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start three rounds/i }).click();
  await page.getByRole('button', { name: /split/i }).click();
  const realAfterFirstRound = await page.evaluate(() => localStorage.getItem('signal-school:run'));
  await page.goto('/demo');
  await expect(page.getByLabel('Demo status')).toContainText('sample data, nothing is saved');
  await page.getByRole('button', { name: /split/i }).click();
  const isolated = await page.evaluate(() => ({ real: localStorage.getItem('signal-school:run'), demo: localStorage.getItem('demo:signal-school:run') }));
  expect(isolated.real).toBe(realAfterFirstRound);
  expect(isolated.demo).not.toBe(isolated.real);
});

test('@claim:keyboard-routes chooses a route with number keys', async ({ page }) => {
  await page.goto('/demo');
  await page.keyboard.press('1');
  await expect(page.getByText('Round 2 of 3')).toBeVisible();
});

test('@claim:settings-persist keeps the motion setting after reload', async ({ page }) => {
  await page.goto('/demo');
  const motion = page.getByRole('button', { name: /motion: standard/i });
  await motion.click();
  await expect(page.getByRole('button', { name: /motion: reduced/i })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: /motion: reduced/i })).toHaveAttribute('aria-pressed', 'true');
});

test('@claim:demo-no-external-requests makes no cross-origin request during a sample run', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await winDemo(page);
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:browser-end-screen shows a completed run and restarts it', async ({ page }) => {
  await winDemo(page);
  await expect(page.getByRole('heading', { name: 'Six signals delivered' })).toBeVisible();
  await expect(page.locator('.debrief')).toContainText('queue');
  await page.getByRole('button', { name: /run this topology again/i }).click();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await expect(page.getByText('0 of 6 signals delivered.')).not.toBeVisible();
});

test('@claim:accessibility-basics has no serious or critical axe violations', async ({ page }) => {
  await page.goto('/demo');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || '')).map((violation) => violation.id)).toEqual([]);
});

test('@claim:route-titles sets titles for demo, legal pages, and the designed 404', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Signal School');
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Signal School');
  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — Signal School');
  await page.goto('/not-a-route');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('@claim:scenario-set-content shows twelve additional topology cards', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.scenario-cards li');
  await expect(cards).toHaveCount(12);
  expect(await cards.allTextContents()).toEqual(expect.arrayContaining(['Glass Causeway', 'Echo Station']));
});
