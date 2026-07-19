import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { getToken, clearToken } from './token.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {

      if (err.status === 401 && token) {
        clearToken();
        window.location.reload();
      }
      return throwError(() => err);
    }),
  );
};
