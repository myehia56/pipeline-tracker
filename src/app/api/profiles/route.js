import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';

const db = new Database('instagram_tracker.db');

// 1. The GET job: Fetch all profiles AND join them with the users table to get the names
export async function GET() {
  try {
    const profiles = db.prepare(`
      SELECT p.*,
             u1.username as uploader_name,
             u2.username as requester_name,
             u3.username as bagger_name
      FROM profiles p
      LEFT JOIN users u1 ON p.uploaded_by = u1.id
      LEFT JOIN users u2 ON p.requested_by = u2.id
      LEFT JOIN users u3 ON p.bagged_by = u3.id
    `).all();
    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch profiles" }, { status: 500 });
  }
}

// 2. The POST job: Add a brand new profile and record who uploaded it
export async function POST(request) {
  try {
    const body = await request.json();
    const { instagram_handle, username } = body;
    
    // Look up the user's ID using their username
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    const userId = user ? user.id : null;

    const stmt = db.prepare(`INSERT INTO profiles (instagram_handle, status, uploaded_by) VALUES (?, 'Free Game', ?)`);
    const info = stmt.run(instagram_handle, userId);
    
    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: "Could not add profile." }, { status: 500 });
  }
}

// 3. The PATCH job: Update a profile's category and record who moved it
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, username } = body;
    
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    const userId = user ? user.id : null;

    // Depending on where they move it, record them as the requester or the bagger
    if (status === 'Request Sent') {
      db.prepare(`UPDATE profiles SET status = ?, requested_by = ? WHERE id = ?`).run(status, userId, id);
    } else if (status === 'Bagged') {
      db.prepare(`UPDATE profiles SET status = ?, bagged_by = ? WHERE id = ?`).run(status, userId, id);
    } else {
      // If it moves back to Free Game, just update the status
      db.prepare(`UPDATE profiles SET status = ? WHERE id = ?`).run(status, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not update status" }, { status: 500 });
  }
}

// 4. The DELETE job: Remove a profile entirely
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;
    db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not delete profile" }, { status: 500 });
  }
}