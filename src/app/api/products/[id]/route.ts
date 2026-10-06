import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const SHOP_BASE_URL = process.env.NEXT_PUBLIC_SHOP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const serviceTypes = searchParams.get('service_types') || 'ST_SHOPPING';
    const branchId = searchParams.get('branch_id');

    if (!branchId || branchId === 'undefined') {
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
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    const targetUrl = `${SHOP_BASE_URL}/marketplace/v1/consumer/products/${encodeURIComponent(id)}?service_types=${serviceTypes}&branch_id=${branchId}`;

    const customReq = createCustomRequest(token, SHOP_BASE_URL, {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json; charset=utf-8',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
      Connection: 'keep-alive',
    });

    const data = await customReq.get(targetUrl);

    if (data?.body) {
      const responsePayload = {
        result: true,
        result_code: '200',
        result_message: 'Success',
        body: data.body,
        raw: data,
      };

      serverCache.set(cacheKey, responsePayload, 120);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    return NextResponse.json(
      data || {
        result: false,
        result_code: '400',
        result_message: 'Failed to fetch product details',
      },
      { status: 400 }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { result: false, result_message: error?.message || 'Failed to fetch product detail' };
    logApiError(`/api/products`, error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
