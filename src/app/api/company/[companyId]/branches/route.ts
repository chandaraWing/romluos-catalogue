import { NextRequest, NextResponse } from 'next/server';
import { BranchItem, Status } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';
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
  { params }: { params: Promise<{ companyId: string }> }
) {
  const startTime = Date.now();
  try {
    const { companyId } = await params;
    const { searchParams } = new URL(req.url);

    const businessId = companyId || searchParams.get('business_id') || searchParams.get('company_id');
    const page = searchParams.get('page') || '1';
    const rpp = searchParams.get('rpp') || '50';

    logApiRequest('GET', `/api/company/${companyId}/branches`, {
      businessId,
      page,
      rpp,
    });

    if (!businessId || businessId === 'undefined') {
      logApiResponse(`/api/company/${companyId}/branches`, 400, { result: false, result_message: 'companyId / business_id is required' }, Date.now() - startTime);
      return NextResponse.json(
        { result: false, result_message: 'companyId / business_id is required', branches: [] },
        { status: 400 }
      );
    }

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
      logApiResponse(`/api/company/${companyId}/branches`, 401, { result: false, result_message: 'Authorization token is required to fetch branches' }, Date.now() - startTime);
      return NextResponse.json(
        { result: false, result_message: 'Authorization token is required to fetch branches', branches: [] },
        { status: 401 }
      );
    }

    const cacheKey = `branches:${businessId}:${page}:${rpp}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      logApiResponse(`/api/company/${companyId}/branches`, 200, {
        source: 'SERVER_CACHE',
        branchCount: cachedResponse.branches?.length || 0,
      }, Date.now() - startTime);
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const targetUrl = `${BASE_URL}/merchant/v1/partner/branches?business_id=${businessId}&page=${page}&rpp=${rpp}`;

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
      Authorization: `Bearer ${token.trim()}`,
    };

    logUpstreamRequest('GET', targetUrl, headers);

    const remoteRes = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const remoteJson = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && remoteJson) {
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

      logApiResponse(`/api/company/${companyId}/branches`, 200, {
        branchCount: mappedBranches.length,
        branches: mappedBranches.map((b) => ({ id: b.id, name: b.name })),
      }, Date.now() - startTime);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    logApiResponse(`/api/company/${companyId}/branches`, remoteRes.status || 400, remoteJson, Date.now() - startTime);

    return NextResponse.json(
      {
        result: false,
        result_code: String(remoteRes.status),
        result_message: remoteJson?.message || remoteJson?.result_message || 'Failed to fetch branches from WingMall',
        branches: [],
        error_detail: remoteJson,
      },
      { status: remoteRes.status || 400 }
    );
  } catch (error: any) {
    logApiError('/api/company/[companyId]/branches', error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Error loading branches', branches: [] },
      { status: 500 }
    );
  }
}
