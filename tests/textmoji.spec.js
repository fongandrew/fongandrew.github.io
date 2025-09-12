// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Textmoji Generator', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tools/textmoji.html');
	});

	test('loads with default state', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		// Check title
		await expect(page).toHaveTitle('Slack Custom Emoji Generator');

		// Check that canvas preview is visible but empty
		const canvas = page.locator('[aria-label="Generated emoji canvas"]');
		await expect(canvas).toBeVisible();

		// Check that preview text is showing
		const previewText = page.getByText('Type something below!');
		await expect(previewText).toBeVisible();

		// Check that export button is disabled
		const exportBtn = page.getByRole('button', { name: /export for slack/i });
		await expect(exportBtn).toBeDisabled();
	});

	test('color presets work', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const textColor = page.locator('[name="textColor"]');
		const bgColor = page.locator('[name="bgColor"]');

		// Enter text to enable preview
		await textInput.fill('TEST');

		// Click the Teal & White preset button
		const presetButton = page.locator('button:has-text("Teal & White")');
		await presetButton.click();

		// Colors should change to preset values
		await expect(bgColor).toHaveValue('#4ecdc4');
		await expect(textColor).toHaveValue('#ffffff');
	});

	test('export functionality works', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const exportBtn = page.getByRole('button', { name: /export for slack/i });

		// Try to export without text (should show alert)
		await expect(exportBtn).toBeDisabled();

		// Enter text
		await textInput.fill('TEST');
		await expect(exportBtn).toBeEnabled();

		// Set up download promise before clicking
		const downloadPromise = page.waitForEvent('download');

		// Click export button
		await exportBtn.click();

		// Wait for download
		const download = await downloadPromise;

		// Check that download has correct filename pattern
		expect(download.suggestedFilename()).toMatch(/test\.png/i);

		// Wait for download success feedback
		await page.waitForTimeout(500);

		// Check that button shows success state temporarily (using ID since text changes)
		const exportBtnId = page.locator('#exportBtn');
		await expect(exportBtnId).toContainText('✅ Downloaded!', { timeout: 1000 });

		// Button should return to normal state
		await expect(exportBtnId).toContainText('📱 Export for Slack', { timeout: 3000 });
	});

	test('clears preview when text is removed', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const previewText = page.getByText('Type something below!');
		const exportBtn = page.getByRole('button', { name: /export for slack/i });
		const emojiPreview = page.locator('[role="img"][aria-label="Emoji preview"]');

		// Enter text
		await textInput.fill('TEST');
		await expect(previewText).toBeHidden();
		await expect(exportBtn).toBeEnabled();

		// Clear text
		await textInput.fill('');

		// Should return to empty state
		await expect(previewText).toBeVisible();
		await expect(exportBtn).toBeDisabled();
		await expect(emojiPreview).not.toHaveClass(/has-content/);
	});

	test('works on mobile viewports', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/tools/textmoji.html');

		// Should still be functional
		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const exportBtn = page.getByRole('button', { name: /export for slack/i });

		await textInput.fill('MOBILE');
		await expect(exportBtn).toBeEnabled();

		// Controls should still be visible and usable
		const controls = page.getByRole('form', { name: /emoji customization controls/i });
		await expect(controls).toBeVisible();
	});

	test('supports dark mode styles', async ({ page }) => {
		// Set dark mode preference
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/tools/textmoji.html');

		// Check that dark mode styles are applied
		const body = page.locator('body');
		const backgroundColor = await body.evaluate(el => getComputedStyle(el).background);

		// Should have dark gradient background (RGB values for dark colors)
		expect(backgroundColor).toContain('rgb(44, 62, 80)');

		// Container should have dark background
		const container = page.locator('.container');
		const containerBg = await container.evaluate(el => getComputedStyle(el).backgroundColor);
		expect(containerBg).toBe('rgb(30, 30, 30)');
	});

	test('canvas renders text correctly - visual snapshot', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const canvas = page.locator('[aria-label="Generated emoji canvas"]');

		// Enter text with specific styling for consistent snapshot
		await textInput.fill('TEST');
		await page.getByRole('slider', { name: /font size/i }).fill('32');
		await page.getByRole('combobox', { name: /font style/i }).selectOption('Arial Black');
		await page.locator('[name="textColor"]').fill('#ffffff');
		await page.locator('[name="bgColor"]').fill('#ff6b6b');

		// Wait for canvas to update
		await page.waitForTimeout(100);

		// Take screenshot of just the canvas
		await expect(canvas).toHaveScreenshot('textmoji-basic.png');
	});

	test('canvas renders multiline text correctly', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const canvas = page.locator('[aria-label="Generated emoji canvas"]');

		// Enter multiline text with specific styling
		await textInput.fill('LINE 1\nLINE 2\nLINE 3');
		await page.getByRole('slider', { name: /font size/i }).fill('24');
		await page.getByRole('combobox', { name: /font style/i }).selectOption('Arial Black');
		await page.locator('[name="textColor"]').fill('#000000');
		await page.locator('[name="bgColor"]').fill('#ffff00');

		// Wait for canvas to update
		await page.waitForTimeout(100);

		// Take screenshot of multiline canvas
		await expect(canvas).toHaveScreenshot('textmoji-multiline.png');
	});

	test('canvas updates with different font sizes', async ({ page }) => {
		await page.goto('/tools/textmoji.html');

		const textInput = page.getByRole('textbox', { name: /emoji text/i });
		const canvas = page.locator('[aria-label="Generated emoji canvas"]');

		// Set up consistent text and colors
		await textInput.fill('BIG');
		await page.getByRole('combobox', { name: /font style/i }).selectOption('Impact');
		await page.locator('[name="textColor"]').fill('#ffffff');
		await page.locator('[name="bgColor"]').fill('#0000ff');

		// Test large font size
		await page.getByRole('slider', { name: /font size/i }).fill('64');
		await page.waitForTimeout(100);

		await expect(canvas).toHaveScreenshot('textmoji-large-font.png');
	});
});