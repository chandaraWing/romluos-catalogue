import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/server-cache';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  const startTime = Date.now();
  try {
    const { hash } = await context.params;

    logApiRequest('GET', `/api/banker-links/public/${hash}`, { hash });

    if (!hash || hash === 'DEMO' || hash === 'demo') {
      logApiResponse(`/api/banker-links/public/${hash}`, 200, { result: false, message: 'Demo mode or hash not found' }, Date.now() - startTime);
      return NextResponse.json({
        result: false,
        message: 'Demo mode or hash not found',
        data: null,
      });
    }

    const cacheKey = `banker_link:${hash}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      logApiResponse(`/api/banker-links/public/${hash}`, 200, {
        source: 'SERVER_CACHE',
        hash,
        banker: cachedResponse.banker?.fullName || cachedResponse.banker?.name,
      }, Date.now() - startTime);
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const targetUrl = `${BASE_URL}/banker-links/public/${encodeURIComponent(hash)}`;
    logUpstreamRequest('GET', targetUrl, headers);

    const remoteRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    if (!remoteRes.ok) {
      const errorData = await remoteRes.json().catch(() => null);
      logApiResponse(`/api/banker-links/public/${hash}`, remoteRes.status, errorData, Date.now() - startTime);
      return NextResponse.json(
        errorData || { result: false, message: `Remote responded with status ${remoteRes.status}` },
        { status: remoteRes.status }
      );
    }

    const data = await remoteRes.json();
    serverCache.set(cacheKey, data, 60);

    logApiResponse(`/api/banker-links/public/${hash}`, 200, {
      hash,
      banker: data.banker?.fullName || data.banker?.name,
      branch: data.branch?.name,
    }, Date.now() - startTime);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    logApiError(`/api/banker-links/public`, error);
    return NextResponse.json(
      { result: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
