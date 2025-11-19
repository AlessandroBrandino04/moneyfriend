import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'change_me';

// Generate a JWT for a user object (expects user.id and user.email)
export function generateToken(user: any): string {
  const payload = { sub: user.id, email: user.email };
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

// Verify token and return decoded payload or null
export function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (err) {
    return null;
  }
}