import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';

export function serverError(
  transloco: TranslocoService,
  err: unknown,
  fallbackKey = 'errors.unknown',
): string {
  const body =
    err instanceof HttpErrorResponse ? err.error : (err as { error?: unknown } | null)?.error;
  const code =
    body && typeof body === 'object' ? (body as { error?: string }).error : undefined;
  const params =
    body && typeof body === 'object' ? (body as { params?: Record<string, unknown> }).params : undefined;
  if (code && typeof code === 'string') {
    return transloco.translate(`errors.${code}`, params);
  }
  return transloco.translate(fallbackKey);
}
