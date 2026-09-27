// Vercel entry point. This file becomes the serverless function at /api/*.
//
// vercel.json rewrites every /api/... request to this one function; Express then does its
// own internal routing exactly as it does locally (server/app.js is unchanged). Everything
// that is NOT /api/... (the built site, admin.html, images) is served directly by Vercel's
// static hosting and never reaches this file at all — see the note in vercel.json about what
// that means for /admin.
//
// server/db.js runs its schema migration with a top-level await the first time it is
// imported, so by the time `app` below is usable, the tables already exist. That happens
// once per cold start; a warm function reuses this same module instance.
import { app } from '../server/app.js';
import { seedIfEmpty } from '../server/seed.js';

await seedIfEmpty();

export default app;
