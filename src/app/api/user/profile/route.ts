import { NextRequest, NextResponse } from 'next/server';
import { PartnerProfileResponse } from '@/types';
import { getPreferredLocaleName } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';
const PROFILE_ENDPOINT = `${BASE_URL}/user/v1/partner/users/profile`;

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

    const res = await fetch(PROFILE_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': `Bearer ${token}`,
        'Connection': 'keep-alive',
      },
    });

    const data: PartnerProfileResponse = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json(
        data || { result: false, result_message: `Profile fetch failed with status ${res.status}` },
        { status: res.status }
      );
    }

    const body = data.body;
    const companyName = getPreferredLocaleName(body?.default_company?.locales);
    const branchName = getPreferredLocaleName(body?.default_company?.default_branch?.locales);

    return NextResponse.json({
      ...data,
      normalized: {
        id: body?.id,
        phone: body?.phone_number,
        email: body?.email,
        firstName: body?.first_name,
        lastName: body?.last_name,
        fullName: `${body?.first_name || ''} ${body?.last_name || ''}`.trim(),
        companyId: body?.default_company?.id,
        companyName: companyName || 'Romlus Financial Partner',
        branchId: body?.default_company?.default_branch?.id,
        branchName: branchName || 'Showroom Branch',
      },
    });
  } catch (error: any) {
    console.error('Error fetching partner user profile:', error);
    return NextResponse.json(
      { result: false, result_message: error?.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
