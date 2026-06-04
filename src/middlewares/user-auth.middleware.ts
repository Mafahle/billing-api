import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface AuthPayload {
  userId: number;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role?: string };
}

export function verifyAuthToken(
  token: string,
  configService: ConfigService,
): { id: number; role?: string } {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  const payload = jwt.verify(token, secret) as AuthPayload;
  return { id: payload.userId, role: payload.role };
}

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = (req.headers['authorization'] ||
      req.headers['Authorization']) as string | undefined;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return res
        .status(401)
        .json({ message: 'Invalid authorization header format' });
    }

    const [scheme, token] = parts;
    if (scheme !== 'Bearer' || !token) {
      return res
        .status(401)
        .json({ message: 'Invalid authorization header format' });
    }

    try {
      const payload = verifyAuthToken(token, this.configService);
      req.user = payload;
      return next();
    } catch (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }
}

// helper middleware to enforce a specific role on a route
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    console.log('User role:', req.user.role);
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}
