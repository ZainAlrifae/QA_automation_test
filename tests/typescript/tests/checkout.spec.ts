import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Checkout functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.click('#login-button');
    await page.fill('#username', process.env.USERNAME || '');
    await page.fill('#password', process.env.PASSWORD || '');
    await page.click('#submit-login');
  });

  test('should complete checkout process successfully', async ({ page }) => {
    // Add item to cart
    await page.goto('/products');
    await page.click('#add-to-cart-button');
    
    // Go to cart
    await page.click('#cart-icon');
    
    // Proceed to checkout
    await page.click('#checkout-button');
    
    // Fill shipping information
    await page.fill('#shipping-name', 'John Doe');
    await page.fill('#shipping-address', '123 Test St');
    await page.fill('#shipping-city', 'Test City');
    await page.fill('#shipping-zip', '12345');
    await page.click('#continue-button');
    
    // Confirm order
    await page.click('#confirm-order-button');
    
    // Check for order confirmation
    await expect(page.locator('#order-confirmation')).toBeVisible();
    await expect(page.locator('#order-confirmation')).toContainText('Thank you for your order!');
  });

  test('should show error when required fields are missing', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('#continue-button');
    
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Please fill in all required fields');
  });
});