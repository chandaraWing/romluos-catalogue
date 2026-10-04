import { NextRequest, NextResponse } from 'next/server';
import { BranchItem, Status } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

const FALLBACK_BRANCHES: Record<string, BranchItem[]> = {
  '47860': [
    {
      id: '47861',
      companyId: '47860',
      name: 'Google Mini Aeon I',
      code: 'AEON-01',
      address: 'Aeon Mall Phnom Penh Ground Floor, Samdach Sothearos Blvd',
      phone: '+855 23 999 111',
      status: Status.ACTIVE,
      company: {
        id: '47860',
        name: 'Google Mini Store',
        code: 'GM',
        status: Status.ACTIVE,
      },
    },
    {
      id: '47862',
      companyId: '47860',
      name: 'Google Mini Aeon II Sen Sok',
      code: 'AEON-02',
      address: 'Aeon Mall Sen Sok City Level 1, St 1003, Phnom Penh',
      phone: '+855 23 999 222',
      status: Status.ACTIVE,
      company: {
        id: '47860',
        name: 'Google Mini Store',
        code: 'GM',
        status: Status.ACTIVE,
      },
    },
    {
      id: '47863',
      companyId: '47860',
      name: 'Google Mini Olympia Mall',
      code: 'OLY-01',
      address: 'The Olympia Mall Ground Floor, Monireth Blvd, Phnom Penh',
      phone: '+855 23 999 333',
      status: Status.ACTIVE,
      company: {
        id: '47860',
        name: 'Google Mini Store',
        code: 'GM',
        status: Status.ACTIVE,
      },
    },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const { searchParams } = new URL(req.url);

    let businessId = companyId || searchParams.get('business_id') || searchParams.get('company_id') || '47860';
    if (!businessId || businessId.startsWith('ROM-') || businessId === 'undefined') {
      businessId = '47860';
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token =
        searchParams.get('access_token') ||
        searchParams.get('district_banker_token') ||
        searchParams.get('token') ||
        req.cookies.get('romlus_district_banker_token')?.value ||
        req.cookies.get('romlus_auth_token')?.value ||
        null;
    }

    if (!token) {
      console.warn(`[branches/route.ts] Missing District Banker token for company ${businessId}. Using fallback.`);
      const fallbackList = FALLBACK_BRANCHES[businessId] || FALLBACK_BRANCHES['47860'];
      return NextResponse.json({
        result: true,
        result_code: '200',
        result_message: 'Loaded default showroom branches (Unauthenticated)',
        companyId: businessId,
        branches: fallbackList,
      });
    }

    const page = searchParams.get('page') || '1';
    const rpp = searchParams.get('rpp') || '50';

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

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
      Authorization: `Bearer ${token.trim()}`,
    };

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
        const companyName = getPreferredLocaleName(item.business?.name_locales) || item.business?.name || 'Google Mini Store';

        return {
          id: String(item.id),
          companyId: String(item.business?.id || businessId),
          name: branchName,
          code: item.code || `BR-${item.id}`,
          address:
            item.address?.address_format ||
            (branchName.includes('Aeon I')
              ? 'Aeon Mall Phnom Penh Ground Floor, Samdach Sothearos Blvd'
              : branchName.includes('Aeon II')
              ? 'Aeon Mall Sen Sok City Level 1, St 1003, Phnom Penh'
              : 'Phnom Penh Showroom'),
          phone: item.phone || '+855 23 999 111',
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
        branches: mappedBranches.length > 0 ? mappedBranches : FALLBACK_BRANCHES[businessId] || FALLBACK_BRANCHES['47860'],
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

    console.warn(`[branches/route.ts] WingMall returned error:`, remoteJson);
    const fallbackList = FALLBACK_BRANCHES[businessId] || FALLBACK_BRANCHES['47860'];
    return NextResponse.json({
      result: true,
      result_code: '200',
      result_message: 'Loaded fallback showroom branches due to partner API response',
      companyId: businessId,
      branches: fallbackList,
      error_detail: remoteJson,
    });
  } catch (error: any) {
    console.error('Error fetching partner branches:', error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Error loading branches', branches: [] },
      { status: 500 }
    );
  }
}
