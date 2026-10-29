const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const baseUrl = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173/';
  const out = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [
      { name: '390', width: 390, height: 844 },
      { name: '768', width: 768, height: 1024 },
      { name: '1440', width: 1440, height: 1000 }
    ]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      // Manual-style keyboard assertions complement axe's automated rules.
      const mainTabIndex = await page.locator('main#main').getAttribute('tabindex');
      if (mainTabIndex !== '-1') throw new Error('Skip-link target main#main must be programmatically focusable with tabindex="-1".');
      await page.keyboard.press('Tab');
      if (!(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')))) {
        throw new Error('First Tab must focus the visible-on-focus skip link.');
      }
      if (viewport.width <= 900) {
        await page.keyboard.press('Tab'); // brand
        await page.keyboard.press('Tab'); // menu toggle
        const toggleFocused = await page.evaluate(() => document.activeElement?.id === 'navToggle');
        if (!toggleFocused) throw new Error(`Expected mobile navigation toggle in keyboard order at ${viewport.width}px.`);
        await page.keyboard.press('Tab');
        const closedMenuLinkFocused = await page.evaluate(() => document.activeElement?.closest('#siteNav') !== null);
        if (closedMenuLinkFocused) throw new Error(`Collapsed navigation links must not be keyboard-focusable at ${viewport.width}px.`);
        await page.locator('#navToggle').focus();
        await page.keyboard.press('Enter');
        if (await page.locator('#navToggle').getAttribute('aria-expanded') !== 'true') throw new Error('Enter must open the mobile navigation and update aria-expanded.');
        await page.keyboard.press('Tab');
        if (!(await page.evaluate(() => document.activeElement?.closest('#siteNav a') !== null))) {
          throw new Error('The first navigation link should be reachable after opening the mobile menu.');
        }
      }

      await page.locator('.skip-link').focus();
      await page.keyboard.press('Enter');
      if (!(await page.evaluate(() => document.activeElement?.id === 'main'))) {
        throw new Error(`Activating the skip link must move focus to main#main at ${viewport.width}px.`);
      }

      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      const summary = {
        viewport: viewport.name,
        passes: scan.passes.length,
        violations: scan.violations.map(v => ({
          id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
          nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary }))
        }))
      };
      results.push(summary);
      console.log(JSON.stringify({ viewport: summary.viewport, passes: summary.passes, violations: summary.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })) }));
      await context.close();
    }
    fs.writeFileSync(path.join(out, 'axe-accessibility-results.json'), JSON.stringify(results, null, 2));
    const serious = results.flatMap(r => r.violations).filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (serious.length) {
      console.error('Critical/serious accessibility violations found. See artifacts/axe-accessibility-results.json.');
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
