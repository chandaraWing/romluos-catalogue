import { NextRequest, NextResponse } from 'next/server';
import { CategoryItem } from '@/types';
import { getPreferredLocaleName, formatImageUrl } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id') || searchParams.get('company_id');
    const serviceType = searchParams.get('service_type') || 'ST_SHOPPING';
    const rpp = searchParams.get('rpp') || '1000';

    logApiRequest('GET', '/api/categories', {
      businessId,
      serviceType,
      rpp,
    });

    if (!businessId || businessId === 'undefined') {
      logApiResponse('/api/categories', 400, { result: false, result_message: 'business_id / company_id is required' }, Date.now() - startTime);
      return NextResponse.json(
        { result: false, result_message: 'business_id / company_id is required', categories: [] },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token =
        searchParams.get('access_token') ||
        searchParams.get('consumer_token') ||
        searchParams.get('token') ||
        req.cookies.get('romluos_consumer_token')?.value ||
        null;
    }

    const cacheKey = `categories:${businessId}:${serviceType}:${rpp}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      logApiResponse('/api/categories', 200, {
        source: 'SERVER_CACHE',
        categoryCount: cachedResponse.categories?.length || 0,
      }, Date.now() - startTime);
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const targetUrl = `${BASE_URL}/marketplace/v1/consumer/product-types?service_type=${serviceType}&rpp=${rpp}&business_id=${businessId}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'accept-language': 'EN',
      'Connection': 'keep-alive',
    };

    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }

    logUpstreamRequest('GET', targetUrl, headers);

    const remoteRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const data = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && data?.body?.items) {
      const rawItems: any[] = data.body.items;
      const mappedCategories: CategoryItem[] = rawItems.map((item: any) => {
        const catName = getPreferredLocaleName(item.name_locales) || item.name || item.code;
        return {
          id: String(item.id),
          code: item.code || `CAT-${item.id}`,
          name: catName,
          description: item.description || '',
          logoUrl: formatImageUrl(item.logo?.file_url),
        };
      });

      const responsePayload = {
        result: true,
        result_code: '200',
        result_message: 'Success',
        categories: mappedCategories,
        raw: data.body,
      };

      serverCache.set(cacheKey, responsePayload, 300);

      logApiResponse('/api/categories', 200, {
        categoryCount: mappedCategories.length,
        items: mappedCategories.map((c) => ({ id: c.id, name: c.name })),
      }, Date.now() - startTime);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    logApiResponse('/api/categories', remoteRes.status || 400, data, Date.now() - startTime);

    return NextResponse.json({
      result: false,
      result_code: data?.code || String(remoteRes.status),
      result_message: data?.message || 'Failed to fetch categories',
      categories: [],
      error_detail: data,
    }, { status: remoteRes.status || 400 });
  } catch (error: any) {
    logApiError('/api/categories', error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Failed to fetch product categories', categories: [] },
      { status: 500 }
    );
  }
}
