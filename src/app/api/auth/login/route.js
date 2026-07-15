import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secretKey = new TextEncoder().encode('super-secret-pipeline-key-change-me-later');

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

    const rs = await client.execute({
      sql: 'SELECT * FROM users WHERE username = ? AND password = ?',
      args: [username, password]
    });
    const user = rs.rows[0];

    if (!user) return NextResponse.json({ error: "Invalid credentials. Who are you?" }, { status: 401 });
    if (user.status === 'banned') return NextResponse.json({ error: "You have been banished from the hunt." }, { status: 403 });
    if (user.status === 'pending') return NextResponse.json({ error: "Account pending. Waiting on Admin approval." }, { status: 403 });

    const token = await new SignJWT({ id: user.id, username: user.username, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secretKey);

    const response = NextResponse.json({ success: true, role: user.role, username: user.username });
    response.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 });
    return response;
  } catch (error) {
    // 🚨 THIS IS THE LINE THAT WILL CATCH THE THIEF 🚨
    console.error("CRASH REPORT:", error);
    return NextResponse.json({ error: "Server error. Try again." }, { status: 500 });
  }
}