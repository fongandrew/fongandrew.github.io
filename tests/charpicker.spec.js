// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Character Picker', () => {
	test.beforeEach(async ({ page }) => {
		// Clear localStorage before each test
		await page.goto('/tools/charpicker.html');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
	});

	test('loads with default characters', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		// Check that default characters are displayed
		const charButtons = page.locator('[data-testid="char-grid"] button');
		await expect(charButtons).toHaveCount(18); // Default character count

		// Check that first few expected characters are present
		await expect(charButtons.first()).toContainText('…');
		await expect(charButtons.nth(1)).toContainText("‘");
		await expect(charButtons.nth(2)).toContainText("’");
	});

	test('can copy character to clipboard', async ({ page, context }) => {
		await page.goto('/tools/charpicker.html');

		// Click the first character (ellipsis)
		const firstButton = page.locator('[data-testid="char-grid"] button').first();
		await firstButton.click();

		// Check that feedback appears
		const feedback = page.locator('[data-testid="feedback"]');
		await expect(feedback).toHaveClass(/show/);

		// Check that button shows copied state
		await expect(firstButton).toHaveClass(/copied/);

		// Check that character was copied to clipboard
		const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardContent).toBe('…');

		// Wait for feedback to disappear
		await expect(feedback).not.toHaveClass(/show/, { timeout: 3000 });
		await expect(firstButton).not.toHaveClass(/copied/, { timeout: 2000 });
	});

	test('search filter works correctly', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		const searchInput = page.locator('input[type="search"]');
		const charButtons = page.locator('[data-testid="char-grid"] button');

		// Initially should show all characters
		await expect(charButtons).toHaveCount(18);

		// Search for "quote"
		await searchInput.fill('quote');
		await expect(charButtons).toHaveCount(4); // Should show 4 quote characters

		// Search for "dash"
		await searchInput.fill('dash');
		await expect(charButtons).toHaveCount(2); // Should show 2 dash characters

		// Search for specific character
		await searchInput.fill('©');
		await expect(charButtons).toHaveCount(1);
		await expect(charButtons.first()).toContainText('©');

		// Clear search
		await searchInput.fill('');
		await expect(charButtons).toHaveCount(18); // Back to all characters
	});

	test('can enter configuration mode', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		const configButton = page.getByText('Configure');
		const configForm = page.locator('[data-testid="config-form"]');
		const charGrid = page.locator('[data-testid="char-grid"]');
		const searchInput = page.locator('input[type="search"]');
		const configTextarea = page.locator('form textarea');

		// Initially in selection mode
		await expect(configForm).toBeHidden();
		await expect(charGrid).toBeVisible();
		await expect(searchInput).toBeVisible();

		// Click configure button
		await configButton.click();

		// Should switch to edit mode
		await expect(configForm).toBeVisible();
		await expect(charGrid).toBeHidden();
		await expect(configButton).toBeHidden();
		await expect(searchInput).toBeHidden();

		// Textarea should be focused and contain default characters
		await expect(configTextarea).toBeFocused();
		const textareaContent = await configTextarea.inputValue();
		expect(textareaContent).toContain('… Ellipsis');
		expect(textareaContent).toContain("‘ Left single quote");
	});

	test('can save new configuration', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		// Enter configuration mode
		await page.locator('#configButton').click();

		const configTextarea = page.locator('form textarea');
		const saveButton = page.locator('form button[type="submit"]');
		const charButtons = page.locator('[data-testid="char-grid"] button');

		// Set custom characters
		const customChars = '★ Star\n♥ Heart\n☀ Sun';
		await configTextarea.fill(customChars);

		// Save configuration
		await saveButton.click();

		// Should return to selection mode with new characters
		await expect(page.locator('[data-testid="config-form"]')).toBeHidden();
		await expect(page.locator('[data-testid="char-grid"]')).toBeVisible();
		await expect(charButtons).toHaveCount(3);

		// Check that custom characters are displayed
		await expect(charButtons.nth(0)).toContainText('★');
		await expect(charButtons.nth(1)).toContainText('♥');
		await expect(charButtons.nth(2)).toContainText('☀');
	});

	test('can reset to default configuration', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		// Enter configuration mode
		await page.getByText('Configure').click();

		const configTextarea = page.locator('form textarea');
		const resetButton = page.getByText('Reset');

		// Modify the textarea
		await configTextarea.fill('★ Custom Star');

		// Click reset button
		await resetButton.click();

		// Should restore default content
		const textareaContent = await configTextarea.inputValue();
		expect(textareaContent).toContain('… Ellipsis');
		expect(textareaContent).toContain("‘ Left single quote");
		expect(textareaContent).not.toContain('★ Custom Star');
	});

	test('can cancel configuration changes', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		const configButton = page.getByText('Configure')
		const configTextarea = page.locator('form textarea');
		const cancelButton = page.getByText('Cancel')
		const charButtons = page.locator('[data-testid="char-grid"] button');

		// Enter configuration mode
		await configButton.click();

		// Modify the textarea
		await configTextarea.fill('★ Custom Star');

		// Click cancel button
		await cancelButton.click();

		// Should return to selection mode without changes
		await expect(page.locator('[data-testid="config-form"]')).toBeHidden();
		await expect(page.locator('[data-testid="char-grid"]')).toBeVisible();
		await expect(charButtons).toHaveCount(18); // Original count
	});

	test('persists configuration in localStorage', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		// Enter configuration mode and save custom characters
		await page.getByText('Configure').click();
		const customChars = '★ Star\n♥ Heart';
		await page.locator('#configTextarea').fill(customChars);
		await page.locator('form button[type="submit"]').click();

		// Reload the page
		await page.reload();

		// Should load with saved characters
		const charButtons = page.locator('[data-testid="char-grid"] button');
		await expect(charButtons).toHaveCount(2);
		await expect(charButtons.nth(0)).toContainText('★');
		await expect(charButtons.nth(1)).toContainText('♥');
	});

	test('search input gets focus when returning from config mode', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		const searchInput = page.locator('input[type="search"]');
		const configButton = page.getByText('Configure')
		const cancelButton = page.getByText('Cancel')

		// Enter configuration mode
		await configButton.click();

		// Cancel and return to selection mode
		await cancelButton.click();

		// Search input should be focused
		await expect(searchInput).toBeFocused();
	});

	test('works on mobile viewports', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/tools/charpicker.html');

		// Should still display character grid
		const charButtons = page.locator('[data-testid="char-grid"] button');
		await expect(charButtons).toHaveCount(18);

		// Grid should be responsive (check that it's using CSS grid)
		const charGrid = page.locator('[data-testid="char-grid"]');
		const gridStyle = await charGrid.evaluate(el => getComputedStyle(el).display);
		expect(gridStyle).toBe('grid');

		// Configuration should still work
		await page.getByText('Configure').click();
		await expect(page.locator('[data-testid="config-form"]')).toBeVisible();
	});

	test('supports keyboard navigation', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		// Tab to first character button
		await page.keyboard.press('Tab'); // Skip search input
		await page.keyboard.press('Tab'); // First character button

		// Should be able to activate with Enter or Space
		const firstButton = page.locator('[data-testid="char-grid"] button').first();
		await expect(firstButton).toBeFocused();

		// Press Enter to copy character
		await page.keyboard.press('Enter');
		await expect(page.locator('[data-testid="feedback"]')).toHaveClass(/show/);
	});

	test('provides screen reader announcements', async ({ page }) => {
		await page.goto('/tools/charpicker.html');

		const srAnnouncements = page.locator('[aria-live]');
		const firstButton = page.locator('[data-testid="char-grid"] button').first();

		// Click first character
		await firstButton.click();

		// Should announce to screen readers
		await expect(srAnnouncements).toContainText('Copy Ellipsis: … copied to clipboard');

		// Announcement should clear after timeout
		await expect(srAnnouncements).toBeEmpty({ timeout: 4000 });
	});
});