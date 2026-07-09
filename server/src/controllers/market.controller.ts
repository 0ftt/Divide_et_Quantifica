import { Request, Response } from 'express';
import { getMarketStatus, refreshNow } from '../services/market-scheduler.service';

export function marketStatus(_req: Request, res: Response): void {
  res.json(getMarketStatus());
}

export async function marketRefresh(_req: Request, res: Response): Promise<void> {
  const status = await refreshNow();
  res.json(status);
}
