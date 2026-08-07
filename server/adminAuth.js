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
  if (!credentialsConfigured()) {
    console.warn(
      '[admin-auth] ADMIN_USERNAME and/or ADMIN_PASSWORD are not set — refusing admin access (fail closed).'
    );
    res.status(503).send('Admin panel is not configured.');
    return;
  }

  if (!isAdminAuthenticated(req)) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    res.status(401).send('Authentication required');
    return;
  }

  next();
}

/**
 * True when the request carries valid admin Basic Auth credentials.
 * Does not fail closed when env is missing — returns false instead.
 * @param {import('express').Request} req
 */
export function isAdminAuthenticated(req) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return false;

  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) return false;

  const provided = header.slice('Basic '.length).trim();
  const expected = Buffer.from(`${username}:${password}`).toString('base64');
  return safeEqualString(provided, expected);
}

export { credentialsConfigured };
