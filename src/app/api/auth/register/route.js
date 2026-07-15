import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password, profilePic } = await request.json();
    const db = new Database('instagram_tracker.db');

    // If they uploaded a picture, use it. Otherwise, give them a default avatar.
    const avatar = profilePic || `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`;

    const role = username.toLowerCase() === 'yehia' ? 'admin' : 'hunter';
    const status = username.toLowerCase() === 'yehia' ? 'active' : 'pending';

    const stmt = db.prepare(`INSERT INTO users (username, password, profile_pic_url, role, status) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(username, password, avatar, role, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "That username is already taken in the market." }, { status: 400 });
  }
}