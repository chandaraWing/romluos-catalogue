import { NextRequest, NextResponse } from 'next/server';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const SHOP_BASE_URL =
  process.env.NEXT_PUBLIC_SHOP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://qa.wingmall.com';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romluos_consumer_token')?.value || null;
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const rpp = searchParams.get('rpp') || '20';
    const filter = searchParams.get('filter');

    // Default filter if none provided: shopping orders in Placed, Confirmed, Delivering status
    const defaultFilter = JSON.stringify([
      { field: 'service_type', values: ['ST_SHOPPING'], condition: 'IN' },
      { field: 'order_status', values: ['PLACED', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELLED'], condition: 'IN' },
    ]);

    const activeFilter = filter || defaultFilter;

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders?page=${encodeURIComponent(
      page
    )}&rpp=${encodeURIComponent(rpp)}&filter=${encodeURIComponent(activeFilter)}`;

    const customReq = createCustomRequest(token, SHOP_BASE_URL, {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'device-id': req.headers.get('device-id') || 'Wm3_CSP1A.210812.016',
      'x-dropoff-latitude': req.headers.get('x-dropoff-latitude') || '11.5414619',
    });

    const data = await customReq.get(targetUrl);

    if (data) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      {
        result: false,
        result_code: '400',
        result_message: 'Failed to fetch consumer orders',
      },
      { status: 400 }
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      result: false,
      result_message: error?.message || 'Internal Server Error fetching orders',
    };
    logApiError('/api/orders', error, status);
    return NextResponse.json(errorData, { status });
  }
}
