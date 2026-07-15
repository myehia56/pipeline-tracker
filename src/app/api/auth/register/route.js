import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password, profilePic } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const client = createClient({ 
      url: process.env.TURSO_DATABASE_URL, 
      authToken: process.env.TURSO_AUTH_TOKEN 
    });

    // 1. Check if the database already has this user
    const checkUser = await client.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken." }, { status: 400 });
    }

    // 2. Set Admin privileges if the username is 'yehia'
    const role = username.toLowerCase() === 'yehia' ? 'admin' : 'hunter';
    const status = username.toLowerCase() === 'yehia' ? 'active' : 'pending';
    const defaultPic = profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // 3. Save the new user to the empty database
    await client.execute({
      sql: 'INSERT INTO users (username, password, role, status, profile_pic_url) VALUES (?, ?, ?, ?, ?)',
      args: [username, password, role, status, defaultPic]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // 🚨 THIS UNMASKS ANY HIDDEN BUGS 🚨
    console.error("REGISTER CRASH REPORT:", error);
    return NextResponse.json({ error: "Server failed to create account." }, { status: 500 });
  }
}