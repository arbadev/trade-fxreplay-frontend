import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Authentication Interceptor
 * Adds Bearer token to requests that require authentication
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: Get actual token from authentication service
  // For now, using a placeholder token for development
  const token = 'dev-placeholder-token';
  
  // Skip authentication for specific requests
  const skipAuth = req.headers.has('X-Skip-Auth');
  
  if (!skipAuth && token) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return next(authReq);
  }
  
  return next(req);
};