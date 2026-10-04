import { NextRequest, NextResponse } from 'next/server';

const SHOP_BASE_URL =
  process.env.NEXT_PUBLIC_SHOP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://qa.wingmall.com';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token = req.cookies.get('romlus_consumer_token')?.value || null;
    }

    const body = await req.json();

    const targetUrl = `${SHOP_BASE_URL}/order/v1/consumer/orders/shopping`;

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

    const remoteRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && data) {
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
        result_code: String(remoteRes.status),
        result_message: 'Failed to create shopping order',
      },
      { status: remoteRes.status || 400 }
    );
  } catch (error: any) {
    console.error('Error in /api/orders/shopping:', error);
    return NextResponse.json(
      {
        result: false,
        result_message: error?.message || 'Internal Server Error creating shopping order',
      },
      { status: 500 }
    );
  }
}
