import { NextRequest, NextResponse } from 'next/server';
import { PartnerProfileResponse } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';
const PROFILE_ENDPOINT = `${BASE_URL}/user/v1/partner/users/profile`;

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    logApiRequest('GET', '/api/user/profile', {
      hasAuthToken: !!token,
      tokenPreview: token ? `${token.substring(0, 14)}...` : 'none',
    });

    if (!token) {
      logApiResponse('/api/user/profile', 401, { result: false, result_message: 'Authorization token is required' }, Date.now() - startTime);
      return NextResponse.json(
        { result: false, result_message: 'Authorization token is required' },
        { status: 401 }
      );
    }

    logUpstreamRequest('GET', PROFILE_ENDPOINT, {
      Authorization: `Bearer ${token}`,
    });

    let res = await fetch(PROFILE_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': `Bearer ${token}`,
        'Connection': 'keep-alive',
      },
    });

    let data = await res.json().catch(() => null);

    // If partner profile fails (e.g. consumer token used), fallback to consumer user-profile endpoint
    if (!res.ok || !data?.body) {
      const CONSUMER_PROFILE_ENDPOINT = `${BASE_URL}/user/v1/consumer/user-profile`;
      logUpstreamRequest('GET', CONSUMER_PROFILE_ENDPOINT, {
        Authorization: `Bearer ${token}`,
      });
      const consumerRes = await fetch(CONSUMER_PROFILE_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (consumerRes.ok) {
        const consumerData = await consumerRes.json().catch(() => null);
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

          logApiResponse('/api/user/profile (consumer)', 200, payload.normalized, Date.now() - startTime);
          return NextResponse.json(payload);
        }
      }

      logApiResponse('/api/user/profile', res.status, data || { result: false, result_message: `Profile fetch failed with status ${res.status}` }, Date.now() - startTime);
      return NextResponse.json(
        data || { result: false, result_message: `Profile fetch failed with status ${res.status}` },
        { status: res.status }
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

    logApiResponse('/api/user/profile', 200, {
      id: body?.id,
      fullName: payload.normalized.fullName,
      companyId: payload.normalized.companyId,
      companyName: payload.normalized.companyName,
      branchId: payload.normalized.branchId,
      branchName: payload.normalized.branchName,
    }, Date.now() - startTime);

    return NextResponse.json(payload);
  } catch (error: any) {
    logApiError('/api/user/profile', error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
