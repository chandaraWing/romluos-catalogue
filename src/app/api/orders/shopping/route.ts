import { NextRequest, NextResponse } from 'next/server';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const SHOP_BASE_URL =
  process.env.NEXT_PUBLIC_SHOP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://qa.wingmall.com';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romluos_consumer_token')?.value || null;
    }

    const body = await req.json();

    logApiRequest('POST', '/api/orders/shopping', {
      hasToken: !!token,
      orderGroupsCount: body?.orders?.length || 0,
      totalAmount: body?.orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
    });

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders/shopping`;

    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json; charset=utf-8',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    logUpstreamRequest('POST', targetUrl, headers, body);

    const remoteRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && data) {
      logApiResponse('/api/orders/shopping', 200, {
        orderId: data.body?.order_id || data.order_id,
        status: data.body?.status || data.status,
      }, Date.now() - startTime);

      return NextResponse.json({
        result: true,
        result_code: '200',
        result_message: 'Draft order created successfully',
        ...data,
      });
    }

    logApiResponse('/api/orders/shopping', remoteRes.status || 400, data, Date.now() - startTime);

    return NextResponse.json(
      data || {
        result: false,
        result_code: String(remoteRes.status),
        result_message: 'Failed to create shopping order',
      },
      { status: remoteRes.status || 400 }
    );
  } catch (error: any) {
    logApiError('/api/orders/shopping', error);
    return NextResponse.json(
      {
        result: false,
        result_message: error?.message || 'Internal Server Error creating shopping order',
      },
      { status: 500 }
    );
  }
}
