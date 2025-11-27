// @ts-check
const { test, expect } = require('@playwright/test');

test('visit google.com and take screenshot', async ({ page }) => {
  await page.goto('https://www.google.com');
  await expect(page).toHaveTitle(/Google/);
  await page.screenshot({ path: 'google.png', fullPage: true });
});
