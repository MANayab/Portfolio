const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const out = path.join(process.cwd(), 'artifacts');
  const baseUrl = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173/';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const viewports = [
    { name: '390', width: 390, height: 844 },
    { name: '768', width: 768, height: 1024 },
    { name: '1440', width: 1440, height: 1000 }
  ];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      page.on('pageerror', error => failures.push(`[${viewport.name}px] pageerror: ${error.message}`));
      page.on('console', message => {
        if (message.type() === 'error') failures.push(`[${viewport.name}px] console: ${message.text()}`);
      });
      const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
      assert(response && response.ok(), `HTTP response failed at ${viewport.name}px`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);

      const layout = await page.evaluate(() => {
        const rect = selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
        };
        const css = selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const s = getComputedStyle(el);
          return { display: s.display, fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, gap: s.gap };
        };
        return {
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          header: rect('.site-header'),
          hero: rect('.hero'),
          topline: rect('.dashboard-topline'),
          eyebrow: rect('.dashboard-topline > .eyebrow'),
          build: rect('.dashboard-topline > .mono'),
          status: rect('.status-panel'),
          statusGrid: rect('.status-grid'),
          statusGridStyle: css('.status-grid'),
          statusLabel: rect('.status-grid .status-label'),
          statusValue: rect('.status-grid strong'),
          terminal: rect('.terminal-output'),
          terminalStyle: css('.terminal-output'),
          kpis: rect('.kpi-strip'),
          kpiStyle: css('.kpi-strip'),
          kpiLabel: rect('.kpi span'),
          navToggle: css('.nav-toggle'),
          cssHref: document.querySelector('link[href*="styles.css"]')?.href,
          canonical: document.querySelector('link[rel="canonical"]')?.href
        };
      });
      assert.equal(layout.documentWidth, viewport.width, `Horizontal overflow at ${viewport.name}px: ${layout.documentWidth}px`);
      assert(layout.topline && layout.eyebrow && layout.build, `Dashboard topline missing at ${viewport.name}px`);
      assert(layout.eyebrow.bottom <= layout.build.top + 1 || viewport.width > 720,
        `Build marker overlaps eyebrow at ${viewport.name}px`);
      assert.equal(layout.statusGridStyle.display, 'grid', 'System status grid CSS did not apply');
      assert.equal(layout.kpiStyle.display, 'grid', 'KPI layout CSS did not apply');
      assert.equal(layout.terminalStyle.fontFamily.includes('monospace') || layout.terminalStyle.fontFamily.includes('Plex Mono'), true,
        'Terminal output is not using a monospace font');
      assert.equal(layout.canonical, 'https://manayab.github.io/Portfolio/', 'Canonical URL changed');
      assert(layout.cssHref && layout.cssHref.includes('styles.css?v=20261029-mobile-fix'), 'Cache-busted local stylesheet is not active');
      if (viewport.width <= 900) {
        assert(layout.statusLabel.bottom <= layout.statusValue.top + 1, 'System status label and value are glued together');
        assert(layout.kpiLabel.bottom <= layout.kpis.bottom, 'KPI label is not visible');
        await page.locator('#navToggle').click();
        assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'true', 'Mobile nav did not open');
        assert(await page.locator('#siteNav').evaluate(el => el.classList.contains('is-open')), 'Mobile nav class not applied');
        await page.locator('#navToggle').click();
        assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'false', 'Mobile nav did not close');
      }
      await page.screenshot({ path: path.join(out, `portfolio-${viewport.name}px-viewport.png`), fullPage: false, animations: 'disabled' });
      await page.evaluate(async () => {
        const step = Math.max(320, Math.floor(window.innerHeight * 0.8));
        const maxY = document.documentElement.scrollHeight;
        for (let y = 0; y < maxY; y += step) {
          window.scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 90));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(700);
      const brokenImages = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
      assert.deepEqual(brokenImages, [], `Broken images at ${viewport.name}px: ${brokenImages.join(', ')}`);
      await page.screenshot({ path: path.join(out, `portfolio-${viewport.name}px.png`), fullPage: true, animations: 'disabled' });
      fs.writeFileSync(path.join(out, `metrics-${viewport.name}px.json`), JSON.stringify(layout, null, 2));
      console.log(`PASS ${viewport.name}px: ${JSON.stringify({ documentWidth: layout.documentWidth, hero: layout.hero, status: layout.status, cssHref: layout.cssHref })}`);
      await page.close();
    }

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    reduced.on('pageerror', error => failures.push(`[reduced-motion] pageerror: ${error.message}`));
    const response = await reduced.goto(baseUrl, { waitUntil: 'networkidle' });
    assert(response && response.ok(), 'Reduced-motion page failed to load');
    const motion = await reduced.evaluate(() => ({
      canvasDisplay: getComputedStyle(document.querySelector('.signal-canvas')).display,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      countValues: Array.from(document.querySelectorAll('[data-count]')).map(el => el.textContent.trim())
    }));
    assert.equal(motion.canvasDisplay, 'none', 'Signal canvas is active with reduced motion');
    assert.equal(motion.scrollBehavior, 'auto', 'Smooth scrolling remains active with reduced motion');
    assert(motion.countValues.every(value => value !== '0'), 'Counters remain unpopulated with reduced motion');
    await reduced.screenshot({ path: path.join(out, 'portfolio-390px-reduced-motion.png'), fullPage: true, animations: 'disabled' });
    fs.writeFileSync(path.join(out, 'metrics-reduced-motion.json'), JSON.stringify(motion, null, 2));
    await reduced.close();

    if (failures.length) {
      console.error(failures.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('PASS console/page errors: none');
      console.log('PASS reduced-motion: canvas hidden, smooth scrolling disabled, counters populated');
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
