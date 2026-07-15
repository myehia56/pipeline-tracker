const Database = require('better-sqlite3');
const db = new Database('instagram_tracker.db');

// 1. We drop the old tables to start fresh (ONLY do this in early development!)
db.exec(`DROP TABLE IF EXISTS profiles`);
db.exec(`DROP TABLE IF EXISTS users`);

// 2. Create the Users Table
// status can be: 'pending', 'active', 'banned'
// role can be: 'admin', 'hunter'
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, 
    profile_pic_url TEXT,
    role TEXT DEFAULT 'hunter',
    status TEXT DEFAULT 'pending' 
  )
`);

// 3. Create the Advanced Profiles Table
// We use Foreign Keys to link specific actions back to the users table
db.exec(`
  CREATE TABLE profiles (
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

// 4. Create Your Admin "God Mode" Account Automatically
// (In a production app, passwords must be hashed. We are keeping it simple for local dev).
const insertAdmin = db.prepare(`
  INSERT INTO users (username, password, profile_pic_url, role, status) 
  VALUES (?, ?, ?, ?, ?)
`);
insertAdmin.run('Admin', 'admin123', 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y', 'admin', 'active');

console.log("Success! Database upgraded for Multi-User Architecture. Admin account created.");