import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiErrorResponse } from '../models';

/**
 * HTTP Error Interceptor
 * Handles all HTTP errors and provides consistent error formatting
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';
      let userFriendlyMessage = 'Something went wrong. Please try again.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
        console.error('Client-side error:', error.error.message);
      } else {
        // Server-side error
        const apiError = error.error as ApiErrorResponse;
        
        switch (error.status) {
          case 400:
            errorMessage = 'Bad Request';
            if (apiError.message) {
              userFriendlyMessage = Array.isArray(apiError.message) 
                ? apiError.message.join(', ')
                : apiError.message;
            } else {
              userFriendlyMessage = 'Invalid request. Please check your input and try again.';
            }
            break;
            
          case 401:
            errorMessage = 'Unauthorized';
            userFriendlyMessage = 'Authentication required. Please log in and try again.';
            // TODO: Redirect to login page or refresh token
            break;
            
          case 403:
            errorMessage = 'Forbidden';
            userFriendlyMessage = 'You do not have permission to perform this action.';
            break;
            
          case 404:
            errorMessage = 'Not Found';
            userFriendlyMessage = 'The requested resource was not found.';
            break;
            
          case 409:
            errorMessage = 'Conflict';
            if (apiError.message) {
              userFriendlyMessage = Array.isArray(apiError.message) 
                ? apiError.message.join(', ')
                : apiError.message;
            } else {
              userFriendlyMessage = 'There was a conflict with your request. Please try again.';
            }
            break;
            
          case 422:
            errorMessage = 'Validation Error';
            if (apiError.message) {
              userFriendlyMessage = Array.isArray(apiError.message) 
                ? apiError.message.join(', ')
                : apiError.message;
            } else {
              userFriendlyMessage = 'Please check your input and try again.';
            }
            break;
            
          case 429:
            errorMessage = 'Too Many Requests';
            userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
            break;
            
          case 500:
            errorMessage = 'Internal Server Error';
            userFriendlyMessage = 'Server error. Please try again later.';
            break;
            
          case 502:
            errorMessage = 'Bad Gateway';
            userFriendlyMessage = 'Service temporarily unavailable. Please try again later.';
            break;
            
          case 503:
            errorMessage = 'Service Unavailable';
            userFriendlyMessage = 'Service temporarily unavailable. Please try again later.';
            break;
            
          case 504:
            errorMessage = 'Gateway Timeout';
            userFriendlyMessage = 'Request timeout. Please try again.';
            break;
            
          default:
            errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
            userFriendlyMessage = 'An unexpected error occurred. Please try again.';
        }
        
        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: errorMessage,
          apiError: apiError
        });
      }

      // Create enhanced error object with both technical and user-friendly messages
      const enhancedError = new Error(userFriendlyMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).technicalMessage = errorMessage;
      (enhancedError as any).status = error.status;
      (enhancedError as any).userMessage = userFriendlyMessage;

      return throwError(() => enhancedError);
    })
  );
};