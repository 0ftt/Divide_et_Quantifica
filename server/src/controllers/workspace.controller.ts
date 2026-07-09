import { Request, Response } from 'express';
import { query, queryOne } from '../db/pool';

export async function getWorkspace(req: Request, res: Response): Promise<void> {
  const row = await queryOne<{ widget: unknown }>(
    'select widget from workspaces where user_id = $1 order by updated_at desc limit 1',
    [req.user!.sub],
  );
  res.json({ state: row ? row.widget : null });
}

export async function saveWorkspace(req: Request, res: Response): Promise<void> {
  const state = req.body?.state ?? null;
  const json = JSON.stringify(state);

  const existing = await queryOne<{ id: string }>(
    'select id from workspaces where user_id = $1 limit 1',
    [req.user!.sub],
  );
  if (existing) {
    await query('update workspaces set widget = $1, updated_at = now() where id = $2', [
      json,
      existing.id,
    ]);
  } else {
    await query('insert into workspaces (user_id, widget) values ($1, $2)', [req.user!.sub, json]);
  }
  res.json({ ok: true });
}
