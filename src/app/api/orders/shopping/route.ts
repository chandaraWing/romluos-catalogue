import { NextRequest, NextResponse } from 'next/server';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const SHOP_BASE_URL =
  process.env.NEXT_PUBLIC_SHOP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://qa.wingmall.com';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romluos_consumer_token')?.value || null;
    }

    const body = await req.json();

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders/shopping`;

    const customReq = createCustomRequest(token, SHOP_BASE_URL, {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
    });

    const data = await customReq.post(targetUrl, body);

    if (data) {
      return NextResponse.json({
        result: true,
        result_code: '200',
        result_message: 'Draft order created successfully',
        ...data,
      });
    }

    return NextResponse.json(
      data || {
        result: false,
        result_code: '400',
        result_message: 'Failed to create shopping order',
      },
      { status: 400 }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      result: false,
      result_message: error?.message || 'Internal Server Error creating shopping order',
    };
    logApiError('/api/orders/shopping', error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
