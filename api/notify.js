// Vercel's same-origin endpoint: the browser never needs CORS access to
// FormSubmit. Keep the recipient fixed so this cannot become an open relay.
module.exports = async function notify(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    // Deployment check only: this does not submit an address or send email.
    return res.status(200).json({ service: 'notify', version: 2 });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = null; }
  }
  const email = body && typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, code: 'invalid_email' });
  }
  if (body['bot-field']) return res.status(200).json({ ok: true });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://formsubmit.co/ajax/spinningplatespress@icloud.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        email,
        _subject: 'New sign-up for Power to the People',
        _replyto: email,
        _template: 'table',
        _captcha: 'false',
        _url: 'https://www.spinningplatespress.co.nz/'
      })
    });
    let result;
    try {
      result = await response.json();
    } catch (_) {
      console.warn('notify: relay returned non-JSON', { status: response.status });
      return res.status(502).json({ ok: false, code: 'relay_invalid_response' });
    }
    if (response.ok && result && (result.success === true || result.success === 'true')) {
      return res.status(200).json({ ok: true });
    }
    if (result && /activat/i.test(result.message || result.error || '')) {
      console.warn('notify: relay activation required', { status: response.status });
      return res.status(503).json({ ok: false, code: 'activation' });
    }
    console.warn('notify: relay rejected request', { status: response.status });
    return res.status(502).json({ ok: false, code: 'relay_rejected' });
  } catch (error) {
    // Do not retry: the relay may already have delivered the email. Do not
    // expose subscriber addresses or upstream response bodies in logs.
    console.warn('notify: relay request unconfirmed', { type: error.name });
    return res.status(502).json({ ok: false, code: 'unconfirmed' });
  } finally {
    clearTimeout(timer);
  }
};
