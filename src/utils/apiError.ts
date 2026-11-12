import axios from 'axios';
import { toast } from './toast';

/**
 * Standardized API Error Extractor for FastAPI + Pydantic backend responses.
 */
export function extractErrorMessage(error: any, fallbackMessage = 'An unexpected error occurred.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;

    // 1. FastAPI 422 Unprocessable Entity - validation error array
    if (status === 422 && Array.isArray(data?.detail)) {
      const messages = data.detail.map((err: any) => {
        const field = Array.isArray(err.loc)
          ? err.loc.filter((part: any) => part !== 'body').join('.')
          : '';
        return field ? `${field}: ${err.msg}` : err.msg;
      });
      return messages.join('; ');
    }

    // 2. String detail
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    // 3. Nested detail object (e.g. { error: string } or { message: string })
    if (typeof data?.detail === 'object' && data.detail !== null) {
      if (typeof data.detail.message === 'string') return data.detail.message;
      if (typeof data.detail.error === 'string') return data.detail.error;
    }

    // 4. Standard message field
    if (typeof data?.message === 'string') {
      return data.message;
    }

    // 5. Status code specific human-readable errors
    if (status === 400) {
      return data?.detail || 'Invalid request payload or malformed parameters.';
    }
    if (status === 401) {
      return 'Authentication required or your session has expired. Please log in.';
    }
    if (status === 403) {
      return 'Access denied: You do not possess the required RBAC permissions for this operation.';
    }
    if (status === 404) {
      return 'The requested resource could not be found.';
    }
    if (status === 409) {
      return data?.detail || 'A resource with these details already exists or conflict detected.';
    }
    if (status === 500) {
      return 'Internal server error encountered. The engineering team has been notified.';
    }
    if (status === 502) {
      return 'Identity Provider unreachable: Keycloak service communication failed.';
    }

    // Network / Offline errors
    if (error.code === 'ERR_NETWORK') {
      return 'Backend service is currently unreachable. Operating in interactive demo mode.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'The server took too long to respond. Request timed out.';
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Convenience helper to show an error toast directly from any caught API exception.
 */
export function showApiErrorToast(error: any, title = 'Operation Failed'): void {
  const message = extractErrorMessage(error);
  toast.error(title, message);
}

