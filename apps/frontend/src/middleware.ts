import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only-12345';

async function verifyJwt(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[verifyJwt] Token does not have 3 parts:', parts.length);
      return false;
    }
    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload to check expiration
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.error('[verifyJwt] Token expired:', payload.exp);
      return false;
    }

    // Verify HMAC-SHA256 signature using Web Crypto API (Edge-safe)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBinary = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const isVerified = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBinary,
      data
    );

    if (!isVerified) {
      console.error('[verifyJwt] Signature verification failed. Secret length:', secret.length);
    }
    return isVerified;
  } catch (err) {
    console.error('[verifyJwt] Caught exception during verification:', err);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isValid = token ? await verifyJwt(token, JWT_SECRET) : false;

  const pathname = request.nextUrl.pathname;
  if (pathname === '/profile' || pathname === '/profile/') {
    if (!isValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      const response = NextResponse.redirect(url);
      if (token) {
        response.cookies.delete('token');
      }
      return response;
    }
  }

  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (isValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/auth/:path*'],
};
