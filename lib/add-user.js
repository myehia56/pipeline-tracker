const Database = require('better-sqlite3');
const db = new Database('instagram_tracker.db');

const insertUser = db.prepare(`
  INSERT INTO users (username, password, profile_pic_url, role, status) 
  VALUES (?, ?, ?, ?, ?)
`);

// We are giving you a default auto-generated avatar for now!
const avatarUrl = "https://api.dicebear.com/9.x/avataaars/svg?seed=yehia";

try {
  insertUser.run('yehia', 'hunt', avatarUrl, 'hunter', 'active');
  console.log("Success! Yehia has been added to the database.");
} catch (error) {
  console.log("Failed. That user might already exist!");
}