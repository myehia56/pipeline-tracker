import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

// Helper to instantly connect to Turso
function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}

// 1. The GET job: Fetch all profiles AND join them with the users table
export async function GET() {
  try {
    const client = getClient();
    const profiles = await client.execute(`
      SELECT p.*,
             u1.username as uploader_name,
             u2.username as requester_name,
             u3.username as bagger_name
      FROM profiles p
      LEFT JOIN users u1 ON p.uploaded_by = u1.id
      LEFT JOIN users u2 ON p.requested_by = u2.id
      LEFT JOIN users u3 ON p.bagged_by = u3.id
    `);
    
    // Turso stores results in .rows
    return NextResponse.json(profiles.rows);
  } catch (error) {
    console.error("GET PROFILES CRASH:", error);
    return NextResponse.json({ error: "Could not fetch profiles" }, { status: 500 });
  }
}

// 2. The POST job: Add a brand new profile
export async function POST(request) {
  try {
    const body = await request.json();
    const { instagram_handle, username } = body;
    const client = getClient();
    
    // 1. Look up the user's ID
    const userRs = await client.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    });
    const userId = userRs.rows.length > 0 ? userRs.rows[0].id : null;

    // 2. Check if the handle is ALREADY in the database
    const checkProfile = await client.execute({
      sql: 'SELECT id FROM profiles WHERE instagram_handle = ?',
      args: [instagram_handle]
    });

    if (checkProfile.rows.length > 0) {
      return NextResponse.json({ error: "That tag is already in the market." }, { status: 400 });
    }

    // 3. Insert the new profile
    const info = await client.execute({
      sql: `INSERT INTO profiles (instagram_handle, status, uploaded_by) VALUES (?, 'Free Game', ?) RETURNING id`,
      args: [instagram_handle, userId]
    });
    
    return NextResponse.json({ success: true, id: info.rows[0].id });
  } catch (error) {
    console.error("POST PROFILE CRASH:", error);
    return NextResponse.json({ error: "Could not add profile." }, { status: 500 });
  }
}

// 3. The PATCH job: Update a profile's category
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, username } = body;
    const client = getClient();
    
    const userRs = await client.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username]
    });
    const userId = userRs.rows.length > 0 ? userRs.rows[0].id : null;

    if (status === 'Request Sent') {
      await client.execute({
        sql: `UPDATE profiles SET status = ?, requested_by = ? WHERE id = ?`,
        args: [status, userId, id]
      });
    } else if (status === 'Bagged') {
      await client.execute({
        sql: `UPDATE profiles SET status = ?, bagged_by = ? WHERE id = ?`,
        args: [status, userId, id]
      });
    } else {
      await client.execute({
        sql: `UPDATE profiles SET status = ? WHERE id = ?`,
        args: [status, id]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH PROFILE CRASH:", error);
    return NextResponse.json({ error: "Could not update status" }, { status: 500 });
  }
}

// 4. The DELETE job: Remove a profile entirely
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;
    const client = getClient();
    
    await client.execute({
      sql: 'DELETE FROM profiles WHERE id = ?',
      args: [id]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE PROFILE CRASH:", error);
    return NextResponse.json({ error: "Could not delete profile" }, { status: 500 });
  }
}