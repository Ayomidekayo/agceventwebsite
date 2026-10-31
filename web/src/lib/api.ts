import axios, { AxiosError, AxiosHeaders } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    if (axiosError.response?.data?.message) {
      const message = axiosError.response.data.message;
      return Array.isArray(message) ? message.join(' ') : message;
    }
    if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
      return 'We could not reach the AGN service. The API may not be running yet. Please try again later.';
    }
  }
  return fallback;
}


let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = api
      .get<{ csrfToken: string }>('/auth/csrf')
      .then((response) => {
        const token = response.data?.csrfToken;

        if (typeof token !== 'string' || token.length < 32) {
          throw new Error('The API did not return a valid CSRF token.');
        }

        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

export function resetCsrfToken(): void {
  csrfToken = null;
  csrfPromise = null;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !config.url?.endsWith('/auth/csrf')) {
    const token = await ensureCsrfToken();
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('X-CSRF-Token', token);
  }
  return config;
});

api.interceptors.response.use((response) => {
  const responseToken = response.data?.csrfToken;
  if (typeof responseToken === 'string') csrfToken = responseToken;
  return response;
}, (error) => {
  if (error?.response?.status === 403 && String(error?.response?.data?.message ?? '').toLowerCase().includes('csrf')) {
    resetCsrfToken();
  }
  return Promise.reject(error);
});
