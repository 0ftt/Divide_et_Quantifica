import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public params?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.params ? { params: err.params } : {}) });
    return;
  }

  if (err instanceof ZodError) {
    const msg = err.issues[0]?.message;
    const code = msg && /^[a-z0-9_]+$/.test(msg) ? msg : 'validation_error';
    res.status(400).json({ error: code });
    return;
  }
  console.error('Errore non gestito:', err);
  res.status(500).json({ error: 'server_error' });
}
