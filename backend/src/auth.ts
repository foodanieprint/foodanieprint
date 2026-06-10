import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'printear_fallback_secret_key';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: 'ADMIN' | 'CUSTOMER'; name: string };
  } catch (error) {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'CUSTOMER';
    createdAt?: Date;
  };
}

export async function authenticateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Read from Cookie or Authorization Header
    let token = getCookieValue(req.headers.cookie, 'session');
    
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next();
    }

    try {
      const user = await db.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (user) {
        req.user = user as any;
      } else {
        req.user = {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        };
      }
    } catch (dbError) {
      req.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
    next();
  } catch (error) {
    next();
  }
}
