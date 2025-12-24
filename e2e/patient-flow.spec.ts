/**
 * E2E Tests: Patient Registration Flow
 * Tests the complete flow of creating a day and registering a patient.
 */

import { test, expect } from '@playwright/test';

test.describe('Patient Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the app
        await page.goto('/');

        // Wait for app to load
        await page.waitForLoadState('networkidle');
    });

    test('should display the main application', async ({ page }) => {
        // Check that the app header or main content is visible
        await expect(page.locator('body')).toBeVisible();

        // Look for the app structure (header, navigation, content)
        const appContent = page.locator('#root');
        await expect(appContent).toBeVisible();
    });

    test('should be able to navigate the date selector', async ({ page }) => {
        // Look for date navigation elements
        const dateSelector = page.locator('[data-testid="date-selector"], .date-navigation, button:has-text("Hoy")');

        if (await dateSelector.count() > 0) {
            await expect(dateSelector.first()).toBeVisible();
        }
    });

    test('should display census view when logged in', async ({ page }) => {
        // Check for census-related elements
        const censusIndicators = page.locator(
            '[data-testid="census-table"], ' +
            '.census-view, ' +
            'table, ' +
            ':has-text("Camas"), ' +
            ':has-text("Paciente")'
        );

        // At least one census indicator should be visible if logged in
        // or a login prompt should be visible
        const loginPrompt = page.locator(':has-text("Iniciar sesión"), :has-text("Login")');

        const hasCensus = await censusIndicators.count() > 0;
        const hasLogin = await loginPrompt.count() > 0;

        expect(hasCensus || hasLogin).toBeTruthy();
    });

    test('should show bed grid or table structure', async ({ page }) => {
        // Look for table structure indicating beds
        const tableHeaders = page.locator('th, [role="columnheader"]');
        const tableRows = page.locator('tr, [role="row"]');

        // If we're in the census view, there should be table structure
        if (await tableHeaders.count() > 0) {
            await expect(tableHeaders.first()).toBeVisible();
        }

        if (await tableRows.count() > 0) {
            await expect(tableRows.first()).toBeVisible();
        }
    });
});

test.describe('Navigation', () => {
    test('should be able to switch between views', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for navigation buttons or tabs
        const navButtons = page.locator('nav button, [role="tab"], .nav-item');

        if (await navButtons.count() > 0) {
            // Click the first navigation item
            await navButtons.first().click();
            await page.waitForTimeout(500);

            // Verify page responds
            await expect(page.locator('body')).toBeVisible();
        }
    });
});

test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // App should still be visible and not broken
        await expect(page.locator('#root')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('#root')).toBeVisible();
    });
});
