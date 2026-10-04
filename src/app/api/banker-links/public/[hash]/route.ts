import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/server-cache';

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
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const remoteRes = await fetch(`${BASE_URL}/banker-links/public/${encodeURIComponent(hash)}`, {
      method: 'GET',
      headers,
    });

    if (!remoteRes.ok) {
      const errorData = await remoteRes.json().catch(() => null);
      return NextResponse.json(
        errorData || { result: false, message: `Remote responded with status ${remoteRes.status}` },
        { status: remoteRes.status }
      );
    }

    const data = await remoteRes.json();
    serverCache.set(cacheKey, data, 60);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.warn(`Failed to fetch banker public link for hash:`, error?.message);
    return NextResponse.json(
      { result: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
