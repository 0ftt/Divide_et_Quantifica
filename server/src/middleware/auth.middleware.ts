import { NextFunction, Request, Response } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';
import { queryOne } from '../db/pool';
import { AppError, asyncHandler } from './error';

declare global {

  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);
    if (!token) {
      throw new AppError(401, 'auth_required');
    }
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'invalid_token');
    }

    const row = await queryOne<{ token_version: number }>(
      'select token_version from users where id = $1',
      [payload.sub],
    );
    if (!row || row.token_version !== (payload.tv ?? 0)) {
      throw new AppError(401, 'session_expired');
    }
    req.user = payload;
    next();
  },
);

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    throw new AppError(403, 'admin_only');
  }
  next();
}
