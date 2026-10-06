import { NextRequest, NextResponse } from 'next/server';
import { getPreferredLocaleName } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';
const PROFILE_ENDPOINT = `${BASE_URL}/user/v1/partner/users/profile`;
const CONSUMER_PROFILE_ENDPOINT = `${BASE_URL}/user/v1/consumer/user-profile`;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return NextResponse.json(
        { result: false, result_message: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const cacheKey = `user-profile:${token.slice(-20)}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
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
    });

    let data: any = null;
    let isPartnerProfile = true;

    try {
      data = await customReq.get(PROFILE_ENDPOINT);
    } catch {
      isPartnerProfile = false;
    }

    // If partner profile fails (e.g. consumer token used), fallback to consumer user-profile endpoint
    if (!isPartnerProfile || !data?.body) {
      try {
        const consumerData = await customReq.get(CONSUMER_PROFILE_ENDPOINT);
        if (consumerData?.body) {
          const cBody = consumerData.body;
          const payload = {
            result: true,
            body: cBody,
            normalized: {
              id: cBody.userId || cBody.id,
              phone: cBody.phoneNumber || cBody.phone,
              email: cBody.email || '',
              firstName: cBody.username || '',
              lastName: '',
              fullName: cBody.username || '',
            },
          };

          return NextResponse.json(payload);
        }
      } catch (consumerErr: any) {
        const cStatus = consumerErr.response?.status || 400;
        const cData = consumerErr.response?.data || { result: false, result_message: 'Profile fetch failed' };
        return NextResponse.json(cData, { status: cStatus });
      }

      return NextResponse.json(
        data || { result: false, result_message: 'Profile fetch failed' },
        { status: 400 }
      );
    }

    const body = data.body;
    const companyName = getPreferredLocaleName(body?.default_company?.locales);
    const branchName = getPreferredLocaleName(body?.default_company?.default_branch?.locales);

    const payload = {
      ...data,
      normalized: {
        id: body?.id,
        phone: body?.phone_number,
        email: body?.email,
        firstName: body?.first_name,
        lastName: body?.last_name,
        fullName: `${body?.first_name || ''} ${body?.last_name || ''}`.trim(),
        companyId: body?.default_company?.id,
        companyName: companyName || '',
        branchId: body?.default_company?.default_branch?.id,
        branchName: branchName || '',
      },
    };

    serverCache.set(cacheKey, payload, 60);

    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { result: false, result_message: error?.message || 'Failed to fetch user profile' };
    logApiError('/api/user/profile', error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
