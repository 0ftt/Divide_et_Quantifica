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
      throw new AppError(401, 'Autenticazione richiesta.');
    }
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError(401, 'Token non valido o scaduto.');
    }

    const row = await queryOne<{ token_version: number }>(
      'select token_version from users where id = $1',
      [payload.sub],
    );
    if (!row || row.token_version !== (payload.tv ?? 0)) {
      throw new AppError(401, 'Sessione scaduta: accesso effettuato altrove.');
    }
    req.user = payload;
    next();
  },
);

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    throw new AppError(403, 'Operazione riservata agli amministratori.');
  }
  next();
}
