const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

test('browser signup uses native POST and the provider success redirect', async t => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'));
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/images/')) { res.writeHead(204); return res.end(); }
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  });
  t.after(() => browser.close());

  for (const width of [1280, 390]) {
    for (const outcome of ['accepted', 'forbidden', 'activation', 'stalled', 'blocked-navigation']) {
      await t.test(`${width}px ${outcome}`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        try {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
          let submissions = 0;
          await page.route('**/api/notify', () => assert.fail('Signup must not use the blocked Vercel relay'));
          await page.route('https://formsubmit.co/**', async route => {
            const request = route.request();
            submissions++;
            assert.equal(request.url(), 'https://formsubmit.co/spinningplatespress@icloud.com');
            assert.equal(request.method(), 'POST');
            assert.equal(request.isNavigationRequest(), true);
            assert.match(request.headers()['content-type'], /application\/x-www-form-urlencoded/);
            const fields = new URLSearchParams(request.postData());
            assert.equal(fields.get('email'), 'reader@example.com');
            assert.equal(fields.get('_replyto'), 'reader@example.com');
            assert.equal(fields.get('_subject'), 'New sign-up for Power to the People');
            assert.equal(fields.get('_captcha'), 'false');
            assert.equal(fields.get('_next'), origin + '/?source=test&signup=success#signup');
            if (outcome === 'stalled') return; // Leave navigation pending.
            if (outcome === 'accepted') {
              await route.fulfill({ status: 303, headers: { Location: fields.get('_next') }, body: '' });
            } else {
              await route.fulfill({ status: outcome === 'forbidden' ? 403 : 200, contentType: 'text/html', body: '<h1>Provider: ' + outcome + '</h1>' });
            }
          });
          await page.goto(origin + '/?source=test');
          assert.equal(await page.locator('#thanks').isVisible(), false);
          await page.locator('#email').fill('invalid');
          await page.locator('#submit-btn').click();
          assert.match(await page.locator('#email-error').innerText(), /valid email/);
          assert.equal(submissions, 0);
          await page.locator('#email').fill('  reader@example.com  ');
          if (outcome === 'stalled') await page.clock.install();
          if (outcome === 'blocked-navigation') {
            await page.evaluate(() => {
              HTMLFormElement.prototype.submit = function () { throw new Error('Navigation blocked'); };
            });
          }
          await page.evaluate(() => {
            const form = document.getElementById('notify-form');
            form.dispatchEvent(new Event('submit', { cancelable: true }));
            if (document.querySelector('#submit-btn').disabled) form.dispatchEvent(new Event('submit', { cancelable: true }));
          });
          if (outcome === 'accepted') {
            await page.locator('#thanks').waitFor({ state: 'visible' });
            assert.match(await page.locator('#thanks').innerText(), /thank you for signing up!/i);
            assert.match(await page.locator('#thanks').innerText(), /November 2026/);
            assert.equal(await page.locator('#email-error').isVisible(), false);
            assert.equal(await page.locator('#notify-form').isVisible(), false);
            assert.equal(page.url(), origin + '/?source=test#signup');
            await page.reload();
            assert.equal(await page.locator('#notify-form').isVisible(), true);
          } else if (outcome === 'stalled' || outcome === 'blocked-navigation') {
            if (outcome === 'stalled') await page.clock.fastForward(16000);
            await page.locator('#email-error').waitFor({ state: 'visible' });
            assert.equal(await page.locator('#submit-btn').isEnabled(), true);
            assert.notEqual(await page.locator('#submit-btn').innerText(), 'Sending…');
            assert.equal(await page.locator('#notify-form').getAttribute('aria-busy'), null);
            assert.equal(await page.locator('#thanks').isVisible(), false);
            assert.match(await page.locator('#email-error a').getAttribute('href'), /^mailto:spinningplatespress@icloud.com/);
            assert.match(await page.locator('#email-error a').getAttribute('href'), /reader%40example.com/);
          } else {
            await page.waitForURL('https://formsubmit.co/**');
            assert.match(await page.locator('h1').innerText(), new RegExp(outcome));
            assert.equal(await page.locator('#thanks').count(), 0);
            await page.goBack();
            await page.locator('#submit-btn').waitFor({ state: 'visible' });
            assert.equal(await page.locator('#submit-btn').isEnabled(), true);
          }
          assert.equal(submissions, outcome === 'blocked-navigation' ? 0 : 1, 'Never send duplicate email requests');
          assert.deepEqual(errors, []);
        } finally {
          await page.close();
        }
      });
    }
  }
});
