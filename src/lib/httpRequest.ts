import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export const STORAGE_KEYS = {
  CONSUMER_TOKEN: 'romlus_consumer_token',
  CONSUMER_SESSION: 'romlus_consumer_session',
  DISTRICT_BANKER_TOKEN: 'romlus_district_banker_token',
  DISTRICT_BANKER_SESSION: 'romlus_district_banker_session',
  ACTIVE_TOKEN: 'romlus_auth_token',
} as const;

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

/**
 * Factory to create pre-configured Axios instances
 */
function createHttpClient(config: {
  baseURL?: string;
  getToken?: () => string | null;
  clientType: 'Consumer' | 'DistrictBanker' | 'Generic';
}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL || BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // Request Interceptor: Attach Bearer Token & Default Headers
  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      const token = config.getToken ? config.getToken() : null;

      // If token exists and Authorization header not explicitly set
      if (token && !reqConfig.headers['Authorization'] && !reqConfig.headers['authorization']) {
        reqConfig.headers['Authorization'] = `Bearer ${token}`;
      }

      return reqConfig;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Format and Handle Errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError<any>) => {
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 401 || errorData?.code === '900902') {
        console.warn(`[${config.clientType} Http] Authentication error (401 / Missing Credentials):`, {
          url: error.config?.url,
          error: errorData || error.message,
        });
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * 1. Consumer HTTP Request Client
 * - For consumer-facing API endpoints: product searches, consumer categories, public catalog views
 */
export const consumerAxios = createHttpClient({
  baseURL: BASE_URL,
  getToken: getConsumerToken,
  clientType: 'Consumer',
});

/**
 * 2. District Banker HTTP Request Client
 * - For banker/partner API endpoints: partner branches, profile, merchant products, QR financing links
 */
export const districtBankerAxios = createHttpClient({
  baseURL: BASE_URL,
  getToken: getDistrictBankerToken,
  clientType: 'DistrictBanker',
});

/**
 * Generic Helper Wrappers for Type-Safe Usage
 */
export const consumerRequest = {
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

export const districtBankerRequest = {
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
 * Dynamic factory for on-demand custom token usage (e.g. Server Route Handlers)
 */
export function createCustomRequest(token?: string | null, customBaseUrl?: string) {
  const instance = axios.create({
    baseURL: customBaseUrl || BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    },
  });

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
  };
}

const httpRequest = {
  consumer: consumerRequest,
  districtBanker: districtBankerRequest,
  createCustomRequest,
};

export default httpRequest;
