import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = new Database('instagram_tracker.db');
    const users = db.prepare('SELECT id, username, profile_pic_url, role, status FROM users').all();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch users" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const db = new Database('instagram_tracker.db');

    // [NEW] The command to update a user's profile picture
    if (body.action === 'change_pic') {
      db.prepare("UPDATE users SET profile_pic_url = ? WHERE username = ?").run(body.profilePic, body.username);
      return NextResponse.json({ success: true });
    }

    // The God Mode commands
    const { id, action } = body;
    if (action === 'approve' || action === 'unban') {
      db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(id);
    } else if (action === 'kick') {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    } else if (action === 'ban') {
      db.prepare("UPDATE users SET status = 'banned' WHERE id = ?").run(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not perform admin action" }, { status: 500 });
  }
}