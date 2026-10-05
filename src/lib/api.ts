const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

interface RequestCacheEntry {
  data: any;
  timestamp: number;
}

class ApiClient {
  private inFlightRequests = new Map<string, Promise<any>>();
  private memoryCache = new Map<string, RequestCacheEntry>();

  private extractToken(raw: string | null): string | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const token =
        parsed?.access_token ||
        parsed?.body?.access_token ||
        parsed?.data?.access_token ||
        parsed?.token ||
        parsed?.accessToken;
      if (token) return String(token).trim();
    } catch {
      // raw token
    }
    return raw.trim();
  }

  private getToken(endpoint?: string): string | null {
    if (typeof window === 'undefined') return null;

    // For consumer endpoints (categories, products, shopping), strictly prioritize consumer token
    const isConsumerEndpoint =
      endpoint?.includes('categories') ||
      endpoint?.includes('products') ||
      endpoint?.includes('marketplace');

    if (isConsumerEndpoint) {
      const consumerToken =
        this.extractToken(localStorage.getItem('romlus_consumer_token')) ||
        this.extractToken(localStorage.getItem('romlus_consumer_session')) ||
        this.extractToken(localStorage.getItem('romlus_auth_token')) ||
        this.extractToken(localStorage.getItem('romlus_district_banker_token'));
      return consumerToken;
    }

    return (
      this.extractToken(localStorage.getItem('romlus_auth_token')) ||
      this.extractToken(localStorage.getItem('romlus_district_banker_token')) ||
      this.extractToken(localStorage.getItem('romlus_district_banker_session')) ||
      this.extractToken(localStorage.getItem('romlus_consumer_token'))
    );
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit & { cacheTtlMs?: number; skipCache?: boolean } = {}
  ): Promise<T> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const cacheTtlMs = options.cacheTtlMs ?? (isGet ? 30000 : 0); // 30 seconds default client cache for GET

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    let token = this.getToken(endpoint);

    // Only set Authorization header if not already explicitly provided by caller
    if (!headers['Authorization'] && !headers['authorization']) {
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      const existingAuth = headers['Authorization'] || headers['authorization'];
      token = existingAuth.startsWith('Bearer ') ? existingAuth.substring(7) : existingAuth;
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : endpoint.startsWith('/api')
      ? endpoint
      : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const cacheKey = `${isGet ? 'GET' : options.method}:${url}:${token || ''}`;

    // 1. Check in-memory cache for GET requests
    if (isGet && !options.skipCache && cacheTtlMs > 0) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
        return cached.data as T;
      }
    }

    // 2. In-flight request deduplication for concurrent identical GET requests
    if (isGet && !options.skipCache && this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey) as Promise<T>;
    }

    const fetchPromise = (async () => {
      try {
        const { cacheTtlMs: _ttl, skipCache: _skip, ...fetchOptions } = options;
        const res = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${res.statusText}`);
        }

        const data = await res.json();

        // Cache successful response
        if (isGet && cacheTtlMs > 0) {
          if (this.memoryCache.size > 200) {
            const oldest = this.memoryCache.keys().next().value;
            if (oldest) this.memoryCache.delete(oldest);
          }
          this.memoryCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data as T;
      } catch (err: any) {
        console.warn(`API request to ${url} failed:`, err.message);
        throw err;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    if (isGet && !options.skipCache) {
      this.inFlightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  get<T = any>(endpoint: string, options?: RequestInit & { cacheTtlMs?: number; skipCache?: boolean }) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  clearCache(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.memoryCache.clear();
      return;
    }
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key.includes(keyPrefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const api = new ApiClient();
