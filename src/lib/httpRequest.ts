import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  logApiRequest,
  logApiResponse,
  logApiError,
} from './server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export const STORAGE_KEYS = {
  CONSUMER_TOKEN: 'romluos_consumer_token',
  CONSUMER_SESSION: 'romluos_consumer_session',
  DISTRICT_BANKER_TOKEN: 'romluos_district_banker_token',
  DISTRICT_BANKER_SESSION: 'romluos_district_banker_session',
  ACTIVE_TOKEN: 'romluos_auth_token',
} as const;

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
    skipLog?: boolean;
  };
}

/**
 * Extract Consumer Access Token from browser localStorage/session
 */
export function getConsumerToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.CONSUMER_SESSION);
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const token =
        parsed?.access_token ||
        parsed?.body?.access_token ||
        parsed?.data?.access_token ||
        parsed?.token ||
        parsed?.accessToken;
      if (token) return String(token).trim();
    }
  } catch {
    // raw string fallback
  }

  const directToken = localStorage.getItem(STORAGE_KEYS.CONSUMER_TOKEN);
  if (directToken) return directToken.trim();

  return null;
}

/**
 * Extract District Banker Access Token from browser localStorage/session
 */
export function getDistrictBankerToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_SESSION);
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const token =
        parsed?.access_token ||
        parsed?.body?.access_token ||
        parsed?.data?.access_token ||
        parsed?.token ||
        parsed?.accessToken;
      if (token) return String(token).trim();
    }
  } catch {
    // raw string fallback
  }

  const directToken =
    localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN);
  if (directToken) return directToken.trim();

  return null;
}

function getFullUrl(config?: CustomAxiosRequestConfig): string {
  if (!config) return '';
  const url = config.url || '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseURL = (config.baseURL || '').replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseURL}${path}`;
}

/**
 * Attach request/response logging interceptors to an Axios instance
 */
function attachLoggingInterceptors(instance: AxiosInstance, clientName = 'HTTP') {
  instance.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
      config.metadata = {
        startTime: Date.now(),
        skipLog: (config as any).skipLog,
      };

      if (!config.metadata.skipLog) {
        const fullUrl = getFullUrl(config);
        const method = (config.method || 'GET').toUpperCase();
        logApiRequest(method, fullUrl, {
          ...(config.params ? { params: config.params } : {}),
          ...(config.data ? { body: config.data } : {}),
        });
      }

      return config;
    },
    (error: AxiosError) => {
      logApiError(`[${clientName} Request Error]`, error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as CustomAxiosRequestConfig;
      const durationMs = config.metadata?.startTime
        ? Date.now() - config.metadata.startTime
        : undefined;

      if (!config.metadata?.skipLog) {
        const fullUrl = getFullUrl(config);
        logApiResponse(fullUrl, response.status, response.data, durationMs);
      }

      return response;
    },
    (error: AxiosError<any>) => {
      const config = error.config as CustomAxiosRequestConfig | undefined;
      const durationMs = config?.metadata?.startTime
        ? Date.now() - config.metadata.startTime
        : undefined;

      const fullUrl = getFullUrl(config);
      const status = error.response?.status || 500;
      const responseData = error.response?.data || error.message;

      if (!config?.metadata?.skipLog) {
        logApiResponse(fullUrl, status, responseData, durationMs);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Factory to create pre-configured Axios instances with logging & token management
 */
export function createHttpClient(config: {
  baseURL?: string;
  getToken?: () => string | null;
  clientType: 'Consumer' | 'DistrictBanker' | 'Generic';
}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL !== undefined ? config.baseURL : BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // Bearer Token Interceptor
  instance.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
    const token = config.getToken ? config.getToken() : null;
    if (token && !reqConfig.headers['Authorization'] && !reqConfig.headers['authorization']) {
      reqConfig.headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return reqConfig;
  });

  // Attach Logging
  attachLoggingInterceptors(instance, config.clientType);

  return instance;
}

/**
 * 1. Consumer HTTP Client Instance
 */
export const consumerAxios = createHttpClient({
  baseURL: BASE_URL,
  getToken: getConsumerToken,
  clientType: 'Consumer',
});

/**
 * 2. District Banker HTTP Client Instance
 */
export const districtBankerAxios = createHttpClient({
  baseURL: BASE_URL,
  getToken: getDistrictBankerToken,
  clientType: 'DistrictBanker',
});

/**
 * 3. Generic Global Client Instance
 */
export const globalAxios = createHttpClient({
  baseURL: '',
  clientType: 'Generic',
});

/**
 * Consumer Wrapper Methods
 */
export const consumerRequest = {
  instance: consumerAxios,
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    consumerAxios.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    consumerAxios.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    consumerAxios.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    consumerAxios.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    consumerAxios.delete<T>(url, config).then((res) => res.data),
};

/**
 * District Banker Wrapper Methods
 */
export const districtBankerRequest = {
  instance: districtBankerAxios,
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    districtBankerAxios.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    districtBankerAxios.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    districtBankerAxios.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    districtBankerAxios.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    districtBankerAxios.delete<T>(url, config).then((res) => res.data),
};

/**
 * Dynamic custom request client for Server Route Handlers or parameterized tokens
 */
export function createCustomRequest(
  token?: string | null,
  customBaseUrl?: string,
  customHeaders?: Record<string, string>
) {
  const instance = axios.create({
    baseURL: customBaseUrl !== undefined ? customBaseUrl : BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      ...(customHeaders || {}),
    },
  });

  attachLoggingInterceptors(instance, 'CustomClient');

  return {
    instance,
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
      instance.get<T>(url, config).then((res) => res.data),
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
      instance.post<T>(url, data, config).then((res) => res.data),
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
      instance.put<T>(url, data, config).then((res) => res.data),
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
      instance.patch<T>(url, data, config).then((res) => res.data),
    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
      instance.delete<T>(url, config).then((res) => res.data),
    request: <T = any>(config: AxiosRequestConfig): Promise<T> =>
      instance.request<T>(config).then((res) => res.data),
  };
}

/**
 * Universal httpRequest helper object
 */
export const httpRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    globalAxios.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    globalAxios.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    globalAxios.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    globalAxios.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    globalAxios.delete<T>(url, config).then((res) => res.data),
  request: <T = any>(config: AxiosRequestConfig): Promise<T> =>
    globalAxios.request<T>(config).then((res) => res.data),
  consumer: consumerRequest,
  districtBanker: districtBankerRequest,
  createCustomRequest,
};

export default httpRequest;
