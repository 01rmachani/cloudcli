const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || '/root/.cloudcli/auth.db';

// OAuth2 Proxy Headers passed as environment variables by your ingress/container
const headerUser = process.env.X_AUTH_REQUEST_USER || 'admin';
const headerEmail = process.env.X_AUTH_REQUEST_EMAIL || 'admin@example.com';
// git_name is often the same as the username in these setups
const gitName = headerUser;

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

try {
  const db = new Database(dbPath);

  // Schema exactly as defined in claudecodeui/server/database/init.sql
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        git_name TEXT,
        git_email TEXT,
        has_completed_onboarding BOOLEAN DEFAULT 0
    )
  `);

  const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get(headerUser);

  if (!userExists) {
    console.log(`[BOOTSTRAP] User "${headerUser}" not found. Seeding from Auth headers...`);

    const insert = db.prepare(`
      INSERT INTO users (
        username, 
        password_hash, 
        git_name, 
        git_email, 
        is_active, 
        has_completed_onboarding
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // password_hash is NOT NULL in schema, but since you use OAuth2 Proxy,
    // we use a placeholder 'oauth2_managed' as the app will bypass local pw checks.
    insert.run(headerUser, 'oauth2_managed', gitName, headerEmail, 1, 1);

    console.log(`[BOOTSTRAP] Successfully provisioned user: ${headerUser}`);
  } else {
    console.log(`[BOOTSTRAP] User "${headerUser}" already exists in database.`);
  }

  db.close();
} catch (err) {
  console.error('[BOOTSTRAP] Database Error:', err.message);
}
