const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setup() {
  console.log("Connecting to the Turso Cloud...");
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      profile_pic_url TEXT,
      role TEXT DEFAULT 'hunter',
      status TEXT DEFAULT 'pending'
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instagram_handle TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'Free Game',
      uploaded_by INTEGER,
      requested_by INTEGER,
      bagged_by INTEGER,
      FOREIGN KEY(uploaded_by) REFERENCES users(id),
      FOREIGN KEY(requested_by) REFERENCES users(id),
      FOREIGN KEY(bagged_by) REFERENCES users(id)
    )
  `);
  
  console.log("Success! The Hunt is officially hosted in the cloud.");
}

setup();