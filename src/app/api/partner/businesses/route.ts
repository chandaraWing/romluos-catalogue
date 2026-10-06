import { NextRequest, NextResponse } from 'next/server';
import { PartnerBusinessesResponse, PartnerBusinessItem } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';
const BUSINESSES_ENDPOINT = `${BASE_URL}/merchant/v1/partner/businesses`;
const DEFAULT_DEVICE_ID = 'Wm3_PCE2A.260420.050';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token =
        searchParams.get('access_token') ||
        searchParams.get('district_banker_token') ||
        searchParams.get('token') ||
        req.cookies.get('romluos_district_banker_token')?.value ||
        req.cookies.get('romluos_auth_token')?.value ||
        null;
    }

    if (!token) {
      return NextResponse.json(
        {
          result: false,
          result_code: '401',
          result_message: 'Authorization token is required',
          body: [],
        },
        { status: 401 }
      );
    }

    const deviceId = req.headers.get('device-id') || DEFAULT_DEVICE_ID;
    const cacheKey = `businesses:${token.slice(-16)}:${deviceId}`;
    const cachedResponse = serverCache.get<PartnerBusinessesResponse>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    const customReq = createCustomRequest(token, BASE_URL, {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
      'device-id': deviceId,
    });

    const data = await customReq.get(BUSINESSES_ENDPOINT);

    if (data) {
      const rawList: any[] = Array.isArray(data.body)
        ? data.body
        : Array.isArray(data.data)
        ? data.data
        : [];

      // Normalize businesses with computed name for current preferred locale
      const normalizedBusinesses: PartnerBusinessItem[] = rawList.map((item: any) => ({
        id: String(item.id),
        status: item.status || 'ACTIVE',
        logo: item.logo || null,
        name_locales: item.name_locales || [],
        branch_count: Number(item.branch_count || 0),
        name: getPreferredLocaleName(item.name_locales) || item.name || `Business ${item.id}`,
      }));

      const payload: PartnerBusinessesResponse = {
        result: true,
        result_code: '200',
        result_message: data.result_message || 'Success',
        trace_id: data.trace_id,
        body: normalizedBusinesses,
      };

      serverCache.set(cacheKey, payload, 60);

      return NextResponse.json(payload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    return NextResponse.json(
      data || {
        result: false,
        result_code: '400',
        result_message: 'Failed to fetch partner businesses',
        body: [],
      },
      { status: 400 }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      result: false,
      result_code: String(status),
      result_message: error?.message || 'Error fetching businesses',
      body: [],
    };
    logApiError('/api/partner/businesses', error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
