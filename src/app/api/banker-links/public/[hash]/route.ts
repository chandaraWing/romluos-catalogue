import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await context.params;

    if (!hash || hash === 'DEMO' || hash === 'demo') {
      return NextResponse.json({
        result: false,
        message: 'Demo mode or hash not found',
        data: null,
      });
    }

    const cacheKey = `banker_link:${hash}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const customReq = createCustomRequest(token, BASE_URL, {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    });

    const targetUrl = `${BASE_URL}/banker-links/public/${encodeURIComponent(hash)}`;
    const data = await customReq.get(targetUrl);

    serverCache.set(cacheKey, data, 60);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { result: false, message: error?.message || 'Internal Server Error' };
    logApiError(`/api/banker-links/public`, error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
