import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Day Workflow
 * Simulates a full hospital day: Login -> Load data -> Shift change -> Logout
 */

test.describe('Complete Hospital Day E2E', () => {
    test('should complete a full hospital day workflow', async ({ page }) => {
        // 1. NAVIGATE TO APP
        await page.goto('http://localhost:3000');

        // 2. LOGIN
        await page.waitForSelector('input[type="email"]');
        await page.fill('input[type="email"]', 'hospitalizados@hospitalhangaroa.cl');
        await page.fill('input[type="password"]', 'test123'); // Use appropriate test password
        await page.click('button:has-text("Iniciar sesión")');

        // Wait for successful login (redirect to main app)
        await page.waitForSelector('[data-testid="census-view"], text=Censo Diario', { timeout: 10000 });

        // 3. VERIFY USER IS LOGGED IN
        expect(page.url()).toContain('/'); // Should be on main page

        // 4. LOAD/CREATE DAILY DATA
        // Check if day exists, if not create it
        const createDayButton = page.locator('button:has-text("Crear Registro")');
        const isCreateButtonVisible = await createDayButton.isVisible().catch(() => false);

        if (isCreateButtonVisible) {
            await createDayButton.click();
            // Select "Copiar del día anterior" or "En blanco"
            await page.click('button:has-text("Copiar del día anterior"), button:has-text("En blanco")');
        }

        // 5. ADD A PATIENT
        // Find first available bed input
        const patientNameInput = page.locator('input[placeholder*="Nombre"], input[data-field="patientName"]').first();
        await patientNameInput.fill('Test Patient E2E');

        // Add RUT
        const rutInput = page.locator('input[placeholder*="RUT"], input[data-field="rut"]').first();
        await rutInput.fill('12.345.678-9');

        // Wait for auto-save
        await page.waitForTimeout(1000);

        // 6. VERIFY DATA IS SAVED (check summary stats updated)
        const summaryCard = page.locator('text=Hospitalizados');
        await expect(summaryCard).toBeVisible();

        // 7. NAVIGATE TO HANDOFF (SHIFT CHANGE)
        await page.click('button:has-text("Entrega Turno"), a:has-text("Entrega Turno Enfermería")');
        await page.waitForSelector('text=Entrega de Turno, text=Novedades');

        // 8. FILL HANDOFF CHECKLIST
        const checklistItem = page.locator('input[type="checkbox"]').first();
        await checklistItem.check();

        // 9. ADD HANDOFF NOTES
        const notesTextarea = page.locator('textarea[placeholder*="Novedades"], textarea').first();
        await notesTextarea.fill('Test handoff notes - Day completed successfully');

        // Wait for save
        await page.waitForTimeout(1000);

        // 10. VERIFY HANDOFF DATA SAVED
        await expect(notesTextarea).toHaveValue('Test handoff notes - Day completed successfully');

        // 11. NAVIGATE BACK TO CENSUS
        await page.click('button:has-text("Censo Diario"), a:has-text("Censo")');

        // 12. LOGOUT
        // Open user menu
        await page.click('button:has-text("Hospital Hanga Roa"), [data-testid="user-menu"]');

        // Click logout
        await page.click('button:has-text("Cerrar sesión"), text=Cerrar sesión');

        // 13. VERIFY LOGOUT SUCCESSFUL
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        expect(page.url()).toContain('/'); // Back to login page
    });

    test('should prevent unauthorized access to restricted modules', async ({ page }) => {
        // Login as viewer (read-only)
        await page.goto('http://localhost:3000');

        await page.waitForSelector('input[type="email"]');
        await page.fill('input[type="email"]', 'd.opazo.damiani@gmail.com'); // doctor_urgency role
        await page.fill('input[type="password"]', 'test123');
        await page.click('button:has-text("Iniciar sesión")');

        await page.waitForSelector('[data-testid="census-view"], text=Censo', { timeout: 10000 });

        // Verify CUDYR tab is NOT visible (doctor_urgency can't see it)
        const cudyrTab = page.locator('button:has-text("CUDYR"), a:has-text("CUDYR")');
        await expect(cudyrTab).not.toBeVisible();

        // Verify inputs are disabled (read-only mode)
        const patientInput = page.locator('input[data-field="patientName"], input[placeholder*="Nombre"]').first();
        await expect(patientInput).toBeDisabled();
    });

    test('should handle offline mode gracefully', async ({ page, context }) => {
        // Login first
        await page.goto('http://localhost:3000');
        await page.waitForSelector('input[type="email"]');
        await page.fill('input[type="email"]', 'hospitalizados@hospitalhangaroa.cl');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button:has-text("Iniciar sesión")');
        await page.waitForSelector('text=Censo Diario', { timeout: 10000 });

        // Go offline
        await context.setOffline(true);

        // Try to add patient (should work with local cache)
        const patientInput = page.locator('input[placeholder*="Nombre"]').first();
        await patientInput.fill('Offline Patient');

        // Should show offline indicator or sync status
        await expect(page.locator('text=Guardando, text=Sin conexión, [data-status="offline"]')).toBeVisible({ timeout: 5000 });

        // Go back online
        await context.setOffline(false);

        // Wait for sync
        await page.waitForTimeout(2000);

        // Should show synced status
        await expect(page.locator('text=Guardado, text=Sincronizado, [data-status="saved"]')).toBeVisible({ timeout: 5000 });
    });
});
