import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config';

const secret = new TextEncoder().encode(config.jwtSecret);

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  nom: string;
  filialeAttribuee?: number | null;
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    sub: String(payload.sub),
    email: payload.email,
    role: payload.role,
    nom: payload.nom,
    filiale_attribuee: payload.filialeAttribuee ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setSubject(String(payload.sub))
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return {
      sub: Number(payload.sub),
      email: payload.email as string,
      role: payload.role as string,
      nom: payload.nom as string,
      filialeAttribuee: payload.filiale_attribuee != null
        ? Number(payload.filiale_attribuee)
        : null,
    };
  } catch {
    throw new Error('Token invalide ou expire');
  }
}
