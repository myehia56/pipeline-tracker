import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}

// 1. The GET job: Fetch the roster for the dashboard
export async function GET() {
  try {
    const client = getClient();
    const rs = await client.execute('SELECT id, username, role, status, profile_pic_url FROM users');
    
    return NextResponse.json(rs.rows);
  } catch (error) {
    console.error("USERS GET CRASH:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// 2. The PATCH job: Admin approving a user (changing status from pending to active)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const client = getClient();

    await client.execute({
      sql: 'UPDATE users SET status = ? WHERE id = ?',
      args: [status, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("USERS PATCH CRASH:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}