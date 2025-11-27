// @ts-check
const { test, expect } = require('@playwright/test');

test('scan google.com and verify results', async ({ page }) => {
  // 1. Visit the client application
  // We assume the client is running on localhost:3000
  await page.goto('http://localhost:3000');

  // 2. Enter URL to scan
  const urlInput = page.getByPlaceholder('Enter URL to scan');
  await urlInput.fill('google.com');

  // 3. Click Scan button
  const scanButton = page.getByRole('button', { name: 'Scan' });
  await scanButton.click();

  // 4. Wait for results
  // The app shows "Scan Result for google.com" when done
  // It might take a while, so we increase timeout
  await expect(page.getByText('Scan Result for google.com')).toBeVisible({ timeout: 60000 });

  // 5. Verify elements
  // Verify screenshot is present
  const screenshot = page.locator('.screenshot img');
  await expect(screenshot).toBeVisible();

  // Verify some security headers section is present
  await expect(page.getByText('Security Headers')).toBeVisible();

  // 6. Take a screenshot of the app
  await page.screenshot({ path: 'scan-results.png', fullPage: true });
});
