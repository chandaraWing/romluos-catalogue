import { NextRequest, NextResponse } from 'next/server';
import { BranchItem, Status } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const businessId = searchParams.get('business_id') || searchParams.get('company_id') || searchParams.get('businessId');
    const page = searchParams.get('page') || '1';
    const rpp = searchParams.get('rpp') || '50';

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

    if (!businessId || businessId === 'undefined') {
      return NextResponse.json(
        { result: false, result_message: 'business_id / company_id query parameter is required', branches: [] },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { result: false, result_message: 'Authorization token is required to fetch branches', branches: [] },
        { status: 401 }
      );
    }

    const cacheKey = `branches:${businessId}:${page}:${rpp}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const targetUrl = `${BASE_URL}/merchant/v1/partner/branches?business_id=${businessId}&page=${page}&rpp=${rpp}`;

    const customReq = createCustomRequest(token, BASE_URL, {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    });

    const remoteJson = await customReq.get(targetUrl);

    if (remoteJson) {
      const rawBranches: any[] = Array.isArray(remoteJson.body)
        ? remoteJson.body
        : Array.isArray(remoteJson.body?.items)
        ? remoteJson.body.items
        : Array.isArray(remoteJson.data)
        ? remoteJson.data
        : [];

      const mappedBranches: BranchItem[] = rawBranches.map((item: any) => {
        const branchName = getPreferredLocaleName(item.name_locales) || item.name || `Branch ${item.id}`;
        const companyName = getPreferredLocaleName(item.business?.name_locales) || item.business?.name || 'Partner Store';

        return {
          id: String(item.id),
          companyId: String(item.business?.id || businessId),
          name: branchName,
          code: item.code || `BR-${item.id}`,
          address: item.address?.address_format || '',
          phone: item.phone || '',
          status: item.status === 'ACTIVE' ? Status.ACTIVE : Status.INACTIVE,
          company: {
            id: String(item.business?.id || businessId),
            name: companyName,
            code: item.business?.code || 'GM',
            status: Status.ACTIVE,
          },
        };
      });

      const responsePayload = {
        result: true,
        result_code: '200',
        result_message: 'Success',
        companyId: businessId,
        branches: mappedBranches,
        raw: remoteJson.body,
      };

      serverCache.set(cacheKey, responsePayload, 300);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    return NextResponse.json(
      {
        result: false,
        result_code: '400',
        result_message: remoteJson?.message || remoteJson?.result_message || 'Failed to fetch branches from WingMall',
        branches: [],
        error_detail: remoteJson,
      },
      { status: 400 }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { result: false, result_message: error?.message || 'Error loading branches', branches: [] };
    logApiError('/api/branches', error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
