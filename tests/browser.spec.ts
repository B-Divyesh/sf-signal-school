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
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  const reset = await page.evaluate(() => ({ real: localStorage.getItem('signal-school:run'), demo: JSON.parse(localStorage.getItem('demo:signal-school:run') || '{}') }));
  expect(reset.real).toBe(realAfterFirstRound);
  expect(reset.demo).toMatchObject({ phase: 'active', roundIndex: 0, delivered: 0 });
});

test('@claim:keyboard-routes chooses a route with number keys', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /split/i }).click();
  await expect(page.getByText('Round 2 of 3')).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.getByText('Round 3 of 3')).toBeVisible();
});

test('@claim:privacy-by-default starts a sample without a profile or cross-origin tracking assets', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));

  await page.goto('/demo');
  await expect(page.getByLabel('Demo status')).toContainText('sample data, nothing is saved');
  await expect(page.locator('input, select, textarea')).toHaveCount(0);
  await winDemo(page);

  expect([...origins]).toEqual([new URL(page.url()).origin]);
});

test('@claim:sample-ready opens a populated three-round board with labelled practice teammates', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByLabel('Demo status')).toBeVisible();
  await expect(page.locator('.storm-board')).toBeVisible();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await expect(page.locator('.intel').getByText('Practice teammates', { exact: true })).toBeVisible();
  await expect(page.locator('.route-choices .route-choice')).toHaveCount(3);
});

test('@claim:local-practice keeps a real practice run in this browser across reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start three rounds/i }).click();
  await page.getByRole('button', { name: /split/i }).click();
  await page.reload();

  await expect(page.getByText('Round 2 of 3')).toBeVisible();
  const savedRun = await page.evaluate(() => JSON.parse(localStorage.getItem('signal-school:run') || 'null'));
  expect(savedRun).toMatchObject({ phase: 'active', roundIndex: 1, delivered: 2 });
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

test('@claim:game-not-course ends with a game result and debrief instead of a grading or credential step', async ({ page }) => {
  await winDemo(page);

  await expect(page.getByRole('heading', { name: 'Six signals delivered' })).toBeVisible();
  await expect(page.locator('.debrief')).toBeVisible();
  await expect(page.locator('input, select, textarea')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /grade|certificate|submit work/i })).toHaveCount(0);
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
  await expect(page).toHaveTitle('Page not found — Signal School');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('@claim:scenario-set-content shows twelve additional topology cards with rotating role views', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.scenario-cards li');
  await expect(cards).toHaveCount(12);
  expect(await page.locator('.scenario-cards li > b').allTextContents()).toEqual(expect.arrayContaining(['Glass Causeway', 'Echo Station']));
  expect(new Set(await cards.evaluateAll((items) => items.map((item) => item.getAttribute('data-role-view'))))).toEqual(new Set(['Signal keeper', 'Harbor clerk', 'Weather reader', 'Relay runner']));
});

test('@claim:scenario-set-unavailable keeps the twelve built-in cards visible without a checkout path before registration', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.scenario-cards li')).toHaveCount(12);
  await page.getByRole('link', { name: /read the offer terms/i }).click();
  await expect(page.getByRole('heading', { name: 'Terms' })).toBeVisible();
  await expect(page.locator('a, button').filter({ hasText: /buy|checkout|activate/i })).toHaveCount(0);
});

test('@claim:leave-room clears the saved room session so reload does not reconnect', async ({ page }) => {
  await page.goto('/');
  const createForm = page.locator('[data-form="create-room"]');
  await createForm.getByLabel('Your name').fill('Ari');
  await createForm.getByRole('button', { name: 'Create room' }).click();
  await expect(page.getByRole('heading', { name: /Room [A-Z0-9]{6}/ })).toBeVisible();

  await page.getByRole('button', { name: 'Leave room' }).click();
  await expect(page.locator('[data-form="create-room"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-form="create-room"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('signal-school:room-session'))).toBeNull();
});

test('header section links reach their named landing sections from each legal page', async ({ page }) => {
  for (const route of ['/privacy', '/terms']) {
    await page.goto(route);
    await page.getByRole('link', { name: 'How to play' }).click();
    await expect(page).toHaveURL(/\/#how-to-play$/);
    await expect(page.getByRole('heading', { name: 'How a run works' })).toBeInViewport();

    await page.goto(route);
    await page.getByRole('link', { name: 'Scenario set' }).click();
    await expect(page).toHaveURL(/\/#scenario-set$/);
    await expect(page.getByRole('heading', { name: 'Twelve more topologies' })).toBeInViewport();
  }
});

test('the phone demo shows a usable relay board in its first viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This layout check is specific to the 390px phone project.');
  await page.goto('/demo');
  const board = await page.locator('.storm-board').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom, viewport: window.innerHeight };
  });
  expect(board.top).toBeLessThan(board.viewport);
  expect(Math.min(board.bottom, board.viewport) - board.top).toBeGreaterThan(140);
});

test('@claim:phone-frame-rate keeps the active phone demo within the 60 fps measurement margin', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'The 390px phone project is the stated measurement environment.');
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/demo');
  const frameIntervals = await page.evaluate(async () => new Promise<number[]>((resolve) => {
    const intervals: number[] = [];
    let previous = performance.now();
    const frame = (now: number) => {
      intervals.push(now - previous);
      previous = now;
      if (intervals.length === 120) resolve(intervals);
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }));
  await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const stableFrames = frameIntervals.slice(12).sort((left, right) => left - right);
  const medianInterval = stableFrames[Math.floor(stableFrames.length / 2)];
  expect(1000 / medianInterval).toBeGreaterThanOrEqual(55);
});

test('@claim:online-rooms restores a shared room after a real browser refresh and resolves a run', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  try {
    await host.goto('/');
    const createForm = host.locator('[data-form="create-room"]');
    await createForm.getByLabel('Your name').fill('Ari');
    await createForm.getByRole('button', { name: 'Create room' }).click();
    const roomHeading = host.getByRole('heading', { name: /Room [A-Z0-9]{6}/ });
    await expect(roomHeading).toBeVisible();
    const code = (await roomHeading.textContent())!.replace('Room ', '');

    await guest.goto('/');
    const joinForm = guest.locator('[data-form="join-room"]');
    await joinForm.getByLabel('Room code').fill(code);
    await joinForm.getByLabel('Your name').fill('Bo');
    await joinForm.getByRole('button', { name: 'Join room' }).click();
    await expect(guest.getByRole('heading', { name: `Room ${code}` })).toBeVisible();
    await expect(host.locator('.room-players').getByText('Weather reader', { exact: true })).toBeVisible();
    await expect(guest.locator('.room-panel > p').nth(1)).toContainText('Your role: Weather reader');

    await guest.reload();
    await expect(guest.getByRole('heading', { name: `Room ${code}` })).toBeVisible();
    await expect(guest.locator('.room-panel > p').nth(1)).toContainText('Your role: Weather reader');
    await expect(host.locator('.room-players').getByText('Bo', { exact: true })).toBeVisible();

    await host.getByRole('button', { name: 'Start shared run' }).click();
    for (let round = 0; round < 3; round += 1) {
      await host.locator('.online-choices').getByRole('button', { name: /split/i }).click();
      await guest.locator('.online-choices').getByRole('button', { name: /split/i }).click();
      if (round < 2) await expect(host.getByText(`Round ${round + 2} is open.`)).toBeVisible();
    }
    await expect(guest.getByRole('heading', { name: 'Six signals delivered' })).toBeVisible();
    await host.getByRole('button', { name: 'Restart shared run' }).click();
    await expect(guest.getByText('Waiting for the room host to start.')).toBeVisible();

    await host.getByRole('button', { name: 'Start shared run' }).click();
    for (let round = 0; round < 3; round += 1) {
      await host.locator('.online-choices').getByRole('button', { name: /direct/i }).click();
      await guest.locator('.online-choices').getByRole('button', { name: /direct/i }).click();
      if (round < 2) await expect(host.getByText(`Round ${round + 2} is open.`)).toBeVisible();
    }
    await expect(guest.getByRole('heading', { name: 'Shared run ended' })).toBeVisible();
    await host.getByRole('button', { name: 'Restart shared run' }).click();
    await expect(guest.getByText('Waiting for the room host to start.')).toBeVisible();
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
