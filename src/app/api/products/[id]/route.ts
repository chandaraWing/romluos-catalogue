import { NextRequest, NextResponse } from 'next/server';
import { formatImageUrl, getPreferredLocaleName } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const SHOP_BASE_URL = process.env.NEXT_PUBLIC_SHOP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const serviceTypes = searchParams.get('service_types') || 'ST_SHOPPING';
    const branchId = searchParams.get('branch_id');

    logApiRequest('GET', `/api/products/${id}`, {
      productId: id,
      branchId,
      serviceTypes,
    });

    if (!branchId || branchId === 'undefined') {
      logApiResponse(`/api/products/${id}`, 400, { result: false, result_message: 'branch_id is required' }, Date.now() - startTime);
      return NextResponse.json(
        { result: false, result_message: 'branch_id is required' },
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

    const cacheKey = `product_detail:${id}:${branchId}:${serviceTypes}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      logApiResponse(`/api/products/${id}`, 200, {
        source: 'SERVER_CACHE',
        productId: id,
        name: cachedResponse.body?.name || cachedResponse.body?.info_locales?.[0]?.name,
      }, Date.now() - startTime);
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    const targetUrl = `${SHOP_BASE_URL}/marketplace/v1/consumer/products/${encodeURIComponent(id)}?service_types=${serviceTypes}&branch_id=${branchId}`;

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json; charset=utf-8',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
      Connection: 'keep-alive',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    logUpstreamRequest('GET', targetUrl, headers);

    const remoteRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const data = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && data?.body) {
      const responsePayload = {
        result: true,
        result_code: '200',
        result_message: 'Success',
        body: data.body,
        raw: data,
      };

      serverCache.set(cacheKey, responsePayload, 120);

      logApiResponse(`/api/products/${id}`, 200, {
        productId: id,
        name: data.body?.name || data.body?.info_locales?.[0]?.name,
        price: data.body?.price,
      }, Date.now() - startTime);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    logApiResponse(`/api/products/${id}`, remoteRes.status || 400, data, Date.now() - startTime);

    return NextResponse.json(
      data || {
        result: false,
        result_code: String(remoteRes.status),
        result_message: 'Failed to fetch product details',
      },
      { status: remoteRes.status }
    );
  } catch (error: any) {
    logApiError(`/api/products`, error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Failed to fetch product detail' },
      { status: 500 }
    );
  }
}
