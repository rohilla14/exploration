import { timingSafeEqual } from 'crypto';

function credentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

function safeEqualString(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Keep the comparison work similar when lengths differ.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * HTTP Basic Auth for the admin panel. Fail closed when env creds are missing.
 * @type {import('express').RequestHandler}
 */
export function requireAdminAuth(req, res, next) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn(
      '[admin-auth] ADMIN_USERNAME and/or ADMIN_PASSWORD are not set — refusing admin access (fail closed).'
    );
    res.status(503).send('Admin panel is not configured.');
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    res.status(401).send('Authentication required');
    return;
  }

  const provided = header.slice('Basic '.length).trim();
  const expected = Buffer.from(`${username}:${password}`).toString('base64');

  if (!safeEqualString(provided, expected)) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    res.status(401).send('Authentication required');
    return;
  }

  next();
}

export { credentialsConfigured };
