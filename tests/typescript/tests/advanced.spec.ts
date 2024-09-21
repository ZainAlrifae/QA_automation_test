import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Advanced functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.click('#login-button');
    await page.fill('#username', process.env.USERNAME || '');
    await page.fill('#password', process.env.PASSWORD || '');
    await page.click('#submit-login');
  });

  test('should perform a complex search and filter operation', async ({ page }) => {
    await page.goto('/products');
    
    // Perform a search
    await page.fill('#search-input', 'laptop');
    await page.click('#search-button');
    
    // Apply filters
    await page.selectOption('#brand-filter', 'Dell');
    await page.check('#in-stock-filter');
    await page.fill('#min-price', '500');
    await page.fill('#max-price', '1500');
    await page.click('#apply-filters');
    
    // Verify search results
    const resultCount = await page.locator('.product-card').count();
    expect(resultCount).toBeGreaterThan(0);
    
    // Verify each result matches the criteria
    for (let i = 0; i < resultCount; i++) {
      const productCard = page.locator('.product-card').nth(i);
      await expect(productCard.locator('.product-name')).toContainText('laptop', { ignoreCase: true });
      await expect(productCard.locator('.product-brand')).toHaveText('Dell');
      await expect(productCard.locator('.product-stock')).toHaveText('In Stock');
      const price = await productCard.locator('.product-price').innerText();
      const priceValue = parseFloat(price.replace('$', ''));
      expect(priceValue).toBeGreaterThanOrEqual(500);
      expect(priceValue).toBeLessThanOrEqual(1500);
    }
  });

  test('should handle a multi-step form submission with validation', async ({ page }) => {
    await page.goto('/profile/edit');
    
    // Step 1: Personal Information
    await page.fill('#first-name', 'John');
    await page.fill('#last-name', 'Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.click('#next-step');
    
    // Step 2: Address
    await page.fill('#street', '123 Main St');
    await page.fill('#city', 'Anytown');
    await page.fill('#zip', '12345');
    await page.selectOption('#country', 'United States');
    await page.click('#next-step');
    
    // Step 3: Preferences
    await page.check('#newsletter-opt-in');
    await page.selectOption('#preferred-language', 'English');
    
    // Submit form
    await page.click('#submit-profile');
    
    // Verify success message
    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#success-message')).toHaveText('Profile updated successfully');
    
    // Verify data persistence
    await page.goto('/profile');
    await expect(page.locator('#profile-name')).toHaveText('John Doe');
    await expect(page.locator('#profile-email')).toHaveText('john.doe@example.com');
    await expect(page.locator('#profile-address')).toContainText('123 Main St, Anytown, 12345, United States');
    await expect(page.locator('#profile-preferences')).toContainText('Newsletter: Subscribed');
    await expect(page.locator('#profile-preferences')).toContainText('Language: English');
  });

  test('should handle real-time updates and websocket communication', async ({ page }) => {
    await page.goto('/live-feed');
    
    // Wait for websocket connection
    await page.waitForSelector('#connection-status.connected');
    
    // Simulate sending a message
    await page.fill('#message-input', 'Hello, World!');
    await page.click('#send-message');
    
    // Verify message appears in the feed
    await expect(page.locator('.message-bubble').last()).toContainText('Hello, World!');
    
    // Simulate receiving a message
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: { user: 'System', message: 'Test message received' }
      }));
    });
    
    // Verify received message appears in the feed
    await expect(page.locator('.message-bubble').last()).toContainText('Test message received');
    
    // Test real-time updates
    const messageCountBefore = await page.locator('.message-bubble').count();
    
    // Simulate multiple rapid messages
    for (let i = 0; i < 5; i++) {
      await page.evaluate((i) => {
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: { user: 'System', message: `Rapid message ${i + 1}` }
        }));
      }, i);
    }
    
    // Verify all messages are displayed without page reload
    await expect(async () => {
      const messageCountAfter = await page.locator('.message-bubble').count();
      expect(messageCountAfter).toBe(messageCountBefore + 5);
    }).toPass();
    
    // Verify the last message
    await expect(page.locator('.message-bubble').last()).toContainText('Rapid message 5');
  });
});