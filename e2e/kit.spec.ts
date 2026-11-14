import { expect, test } from '@playwright/test';

test('/kit shows the components under both themes without sideways scroll', async ({ page }) => {
  await page.goto('/kit');
  await expect(page.locator('.oc.oc--a')).toBeVisible();
  await expect(page.locator('.oc.oc--b')).toBeVisible();
  await expect(page.locator('.oc--a .oc-panel').first()).toBeVisible();
  await expect(page.locator('.oc--b .oc-pass').first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
