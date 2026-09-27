import rateLimit from 'express-rate-limit';
import { requireAdminAuth } from '../adminAuth.js';

const WINDOW_MS = 15 * 60 * 1000;

/**
 * @param {number} defaultMax
 * @param {string} [envName]
 */
export function limiter(defaultMax, envName) {
  return rateLimit({
    windowMs: WINDOW_MS,
    max: (envName && Number(process.env[envName])) || defaultMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  });
}

/** Same limiter, but only counts requests that change data. */
export function writeLimiter(defaultMax, envName) {
  const inner = limiter(defaultMax, envName);
  return (req, res, next) =>
    req.method === 'GET' || req.method === 'HEAD' ? next() : inner(req, res, next);
}

/**
 * Require admin auth for the given HTTP methods (or for every method except the
 * ones in `except`). Optionally restrict to specific request paths.
 * @param {{ methods?: string[], except?: string[], onlyRoot?: boolean }} rule
 */
export function adminFor({ methods, except, onlyRoot = false }) {
  return (req, res, next) => {
    if (onlyRoot && req.path !== '/' && req.path !== '') return next();
    const needsAuth = methods ? methods.includes(req.method) : !except.includes(req.method);
    return needsAuth ? requireAdminAuth(req, res, next) : next();
  };
}

/**
 * Reject request bodies whose string fields exceed the given max lengths.
 * @param {Record<string, number>} maxLengths
 */
export function limitFields(maxLengths) {
  return (req, res, next) => {
    const body = req.body;
    if (body && typeof body === 'object') {
      for (const [field, max] of Object.entries(maxLengths)) {
        const value = body[field];
        if (typeof value === 'string' && value.length > max) {
          res.status(413).json({ error: `${field} is too long (max ${max} characters)` });
          return;
        }
      }
    }
    next();
  };
}

/**
 * Only allow http(s) or site-relative URLs in the given body fields, so stored
 * values can never become javascript: or data: URLs on the client.
 * @param {string[]} fields
 */
export function safeUrlFields(fields) {
  return (req, res, next) => {
    const body = req.body;
    if (body && typeof body === 'object') {
      for (const field of fields) {
        const value = body[field];
        if (value == null || value === '') continue;
        if (typeof value !== 'string' || !/^(https?:\/\/|\/(?!\/))/i.test(value)) {
          res.status(400).json({ error: `${field} must be an http(s) URL` });
          return;
        }
      }
    }
    next();
  };
}
