const { test } = require('node:test');
const assert = require('node:assert/strict');
const notify = require('../api/notify');

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('sign-up endpoint', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let requests;
  const run = async (reply, request = { method: 'POST', body: { email: ' reader@example.com ' } }) => {
    requests = [];
    global.fetch = async (url, options) => {
      requests.push({ url, options });
      if (reply instanceof Error) throw reply;
      return new Response(typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body), {
        status: reply.status || 200,
        headers: { 'Content-Type': reply.type || 'application/json' }
      });
    };
    const res = response();
    await notify(request, res);
    return res;
  };

  for (const success of [true, 'true']) {
    await t.test(`accepted ${typeof success} response shows success and sends once`, async () => {
      const res = await run({ body: { success, message: 'Form submitted successfully.' } });
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, { ok: true });
      assert.equal(res.headers['Cache-Control'], 'no-store');
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, 'https://formsubmit.co/ajax/spinningplatespress@icloud.com');
      const body = JSON.parse(requests[0].options.body);
      assert.equal(body.email, 'reader@example.com');
      assert.equal(body._replyto, body.email);
    });
  }

  for (const value of [false, 'false', undefined]) {
    await t.test(`rejected or missing success flag (${value}) never shows thanks`, async () => {
      const res = await run({ body: { success: value } });
      assert.equal(res.statusCode, 502);
      assert.equal(res.body.ok, false);
    });
  }

  await t.test('activation required is distinct from acceptance', async () => {
    const res = await run({ body: { success: false, message: 'Please activate your form.' } });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'activation');
  });

  await t.test('HTTP error cannot become success from a body flag', async () => {
    const res = await run({ status: 500, body: { success: true } });
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, false);
  });

  for (const reply of [{ body: '<html>Unavailable</html>', type: 'text/html' }, new Error('Connection lost'), new DOMException('Timed out', 'AbortError')]) {
    await t.test(`unconfirmed delivery (${reply.message || 'non-JSON'}) is not retried`, async () => {
      const res = await run(reply);
      assert.equal(res.statusCode, 502);
      assert.deepEqual(res.body, { ok: false, code: reply instanceof Error ? 'unconfirmed' : 'relay_invalid_response' });
      assert.equal(requests.length, 1);
    });
  }

  await t.test('invalid email and malformed JSON never reach the relay', async () => {
    for (const body of [{ email: 'not-an-email' }, { email: ['reader@example.com'] }, null, '{broken']) {
      const res = await run({}, { method: 'POST', body });
      assert.equal(res.statusCode, 400);
      assert.equal(requests.length, 0);
    }
  });

  await t.test('honeypot drops spam without emailing', async () => {
    const res = await run({}, { method: 'POST', body: { email: 'bot@example.com', 'bot-field': 'spam' } });
    assert.deepEqual(res.body, { ok: true });
    assert.equal(requests.length, 0);
  });

  await t.test('GET requests cannot trigger email', async () => {
    const res = await run({}, { method: 'GET' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { service: 'notify', version: 2 });
    assert.equal(requests.length, 0);
  });

  await t.test('unsupported methods cannot trigger email', async () => {
    const res = await run({}, { method: 'DELETE' });
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, 'GET, POST');
    assert.equal(requests.length, 0);
  });
});
