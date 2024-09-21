import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Login functionality', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('#login-button');
    await page.fill('#username', process.env.USERNAME || '');
    await page.fill('#password', process.env.PASSWORD || '');
    await page.click('#submit-login');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('#welcome-message')).toContainText(`Welcome, ${process.env.USERNAME}`);
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('#login-button');
    await page.fill('#username', 'invaliduser');
    await page.fill('#password', 'invalidpassword');
    await page.click('#submit-login');
    
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Invalid username or password');
  });
});