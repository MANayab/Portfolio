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
