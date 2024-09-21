import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility Tests', () => {
  test('should load the homepage within performance budget', async ({ page }) => {
    // Enable performance metrics
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    const performanceTimingJson = await page.evaluate(() => JSON.stringify(performance.timing));
    const performanceTiming = JSON.parse(performanceTimingJson);

    // Navigate to the homepage
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();

    // Calculate and assert load time
    const loadTime = endTime - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Assert load time is less than 3 seconds

    // Assert Time to First Byte (TTFB)
    const ttfb = performanceTiming.responseStart - performanceTiming.navigationStart;
    console.log(`Time to First Byte: ${ttfb}ms`);
    expect(ttfb).toBeLessThan(600); // Assert TTFB is less than 600ms

    // Assert First Contentful Paint (FCP)
    const fcpMetrics = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint');
      return fcp.length ? fcp[0].startTime : undefined;
    });
    console.log(`First Contentful Paint: ${fcpMetrics}ms`);
    expect(fcpMetrics).toBeLessThan(1000); // Assert FCP is less than 1 second
  });

  test('should pass basic accessibility tests', async ({ page }) => {
    await page.goto('/');

    const AxeBuilder = require('@axe-core/playwright').default;
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    console.log('Accessibility violations:', accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should maintain performance under load', async ({ page }) => {
    await page.goto('/products');

    const initialLoadTime = await measureLoadTime(page);
    console.log(`Initial load time: ${initialLoadTime}ms`);

    // Simulate rapid user interactions
    for (let i = 0; i < 10; i++) {
      await page.click('#load-more-products');
      await page.waitForSelector(`.product-item-${i * 10 + 10}`);
    }

    const finalLoadTime = await measureLoadTime(page);
    console.log(`Final load time after interactions: ${finalLoadTime}ms`);

    // Assert that performance doesn't degrade significantly under load
    expect(finalLoadTime).toBeLessThan(initialLoadTime * 2);
  });
});

async function measureLoadTime(page) {
  const startTime = Date.now();
  await page.reload();
  const endTime = Date.now();
  return endTime - startTime;
}