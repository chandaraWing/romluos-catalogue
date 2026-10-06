import { NextRequest, NextResponse } from 'next/server';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const SHOP_BASE_URL =
  process.env.NEXT_PUBLIC_SHOP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://qa.wingmall.com';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    let body = await req.json().catch(() => ({}));

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romluos_consumer_token')?.value || null;
    }

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders/shopping/${encodeURIComponent(orderId)}/checkout`;

    const customReq = createCustomRequest(token, SHOP_BASE_URL, {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
    });

    const data = await customReq.post(targetUrl, body);

    const isSuccess =
      data &&
      data.result !== false &&
      data.result_code !== '400' &&
      data.result_code !== '401' &&
      data.result_code !== '403' &&
      data.result_code !== '404' &&
      data.result_code !== '500';

    if (isSuccess && data) {
      const redirectWebUrl =
        data.body?.payment_redirect_web_url ||
        data?.payment_redirect_web_url ||
        null;

      return NextResponse.json({
        result: true,
        result_code: '200',
        result_message: data.result_message || 'Checkout succeeded',
        ...data,
        payment_redirect_web_url: redirectWebUrl,
      });
    }

    const statusCode = 400;
    const errorMessage =
      data?.result_message ||
      data?.message ||
      data?.body?.message ||
      'Failed to process order checkout';

    return NextResponse.json(
      data || {
        result: false,
        result_code: String(statusCode),
        result_message: errorMessage,
      },
      { status: statusCode }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      result: false,
      result_message: error?.message || 'Internal Server Error during order checkout',
    };
    logApiError(`/api/orders/shopping/checkout`, error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
