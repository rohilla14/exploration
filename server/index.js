import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load env before anything reads process.env (db.js reads DB_PATH at import time).
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

const { DB_PATH } = await import('./db.js');
const { seedIfEmpty } = await import('./seed.js');
const { credentialsConfigured } = await import('./adminAuth.js');
const { app, allowedOrigin, distPath } = await import('./app.js');

await seedIfEmpty();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Exploration API running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`CORS allowed origin: ${allowedOrigin}`);
  if (!process.env.ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
    console.warn(
      '[cors] ALLOWED_ORIGIN is not set in production — defaulting to http://localhost:5173. Set ALLOWED_ORIGIN to your deployed frontend URL.'
    );
  }
  if (!credentialsConfigured()) {
    console.warn(
      '[admin-auth] ADMIN_USERNAME/ADMIN_PASSWORD missing — /admin and admin-only APIs will refuse requests.'
    );
  }
  if (existsSync(distPath)) {
    console.log(`Serving frontend from ${distPath}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  }
});
