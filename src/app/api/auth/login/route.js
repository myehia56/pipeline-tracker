import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// This is the secret cryptographic key used to sign the wristbands.
const secretKey = new TextEncoder().encode('super-secret-pipeline-key-change-me-later');

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const db = new Database('instagram_tracker.db');

    // 1. Look for the user in the database
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    // 2. Check all our security rules
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials. Who are you?" }, { status: 401 });
    }
    if (user.status === 'banned') {
      return NextResponse.json({ error: "You have been banished from the hunt." }, { status: 403 });
    }
    if (user.status === 'pending') {
      return NextResponse.json({ error: "Account pending. Waiting on Admin approval." }, { status: 403 });
    }

    // 3. The user is legit! Create their digital VIP wristband (JWT)
    const token = await new SignJWT({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h') // Wristband expires in 24 hours
      .sign(secretKey);

    // 4. Give them the wristband via an HTTP-Only Cookie (Super secure, hackers can't steal it easily)
    const response = NextResponse.json({ success: true, role: user.role, username: user.username });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error. Try again." }, { status: 500 });
  }
}