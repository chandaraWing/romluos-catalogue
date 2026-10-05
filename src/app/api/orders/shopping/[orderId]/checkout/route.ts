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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const startTime = Date.now();
  try {
    const { orderId } = await context.params;
    let body = await req.json().catch(() => ({}));

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romlus_consumer_token')?.value || null;
    }

    logApiRequest('POST', `/api/orders/shopping/${orderId}/checkout`, {
      orderId,
      hasToken: !!token,
      deliveryOptionId: body?.metadata?.delivery_option?.delivery_option_id,
      paymentOptionId: body?.metadata?.payment_option?.id,
    });

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders/shopping/${encodeURIComponent(orderId)}/checkout`;

    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
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
      const redirectWebUrl = data.body?.payment_redirect_web_url || data.body?.payment_redirect_url;
      logApiResponse(`/api/orders/shopping/${orderId}/checkout`, 200, {
        orderId,
        paymentId: data.body?.payment_id,
        hasRedirectUrl: !!redirectWebUrl,
        redirectUrl: redirectWebUrl,
      }, Date.now() - startTime);

      return NextResponse.json({
        result: true,
        result_code: '200',
        result_message: 'Checkout succeeded',
        ...data,
      });
    }

    logApiResponse(`/api/orders/shopping/${orderId}/checkout`, remoteRes.status || 400, data, Date.now() - startTime);

    return NextResponse.json(
      data || {
        result: false,
        result_code: String(remoteRes.status),
        result_message: 'Failed to process order checkout',
      },
      { status: remoteRes.status || 400 }
    );
  } catch (error: any) {
    logApiError(`/api/orders/shopping/checkout`, error);
    return NextResponse.json(
      {
        result: false,
        result_message: error?.message || 'Internal Server Error during order checkout',
      },
      { status: 500 }
    );
  }
}
