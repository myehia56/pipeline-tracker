import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // This destroys the secure cookie by setting its lifespan to 0 seconds
  response.cookies.set('auth_token', '', { maxAge: 0 });
  
  return response;
}