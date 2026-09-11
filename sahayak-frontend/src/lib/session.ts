import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const session = (await cookies()).get('sahayak_session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function setSession(user: any, rememberMe: boolean = true) {
  const expires = rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined;
  const session = await encrypt({ user, expires: expires || new Date(Date.now() + 24 * 60 * 60 * 1000) });
  
  if (expires) {
    (await cookies()).set('sahayak_session', session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  } else {
    (await cookies()).set('sahayak_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  }
}

export async function clearSession() {
  (await cookies()).set('sahayak_session', '', { expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}
