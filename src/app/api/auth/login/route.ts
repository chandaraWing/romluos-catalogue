import { NextRequest, NextResponse } from 'next/server';
import {
  getEncryptedConsumerClientSecret,
  getEncryptedDistrictBankerClientSecret,
  rsaEncrypt,
} from '@/lib/cipher';
import {
  logApiRequest,
  logUpstreamRequest,
  logApiResponse,
  logApiError,
} from '@/lib/server-logger';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';
const TOKEN_ENDPOINT = `${BASE_URL}/identity/v1/auth/token`;

const CONSUMER_CLIENT_ID =
  process.env.NEXT_PUBLIC_CONSUMER_CLIENT_ID ||
  process.env.NEXT_PUBLIC_CUNSUMER_CLIENT_ID ||
  'mv0z8ldFzKat_pr833oMVha3QXIa';

const DISTRICT_BANKER_CLIENT_ID =
  process.env.NEXT_PUBLIC_DISTRICT_BANKER_CLIENT_ID ||
  'ISWiHRYMXeXyZIwgXSjTzglYn0Aa';

const formatCambodiaPhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+855')) {
    return cleaned;
  }
  if (cleaned.startsWith('855')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+855${cleaned.substring(1)}`;
  }
  return `+855${cleaned}`;
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { phone, pin, encryptedPin: propEncryptedPin } = body;

    logApiRequest('POST', '/api/auth/login', {
      phone,
      hasPin: !!pin,
      hasEncryptedPin: !!propEncryptedPin,
    });

    if (!phone) {
      logApiResponse('/api/auth/login', 400, { success: false, message: 'Phone number is required' }, Date.now() - startTime);
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const formattedUsername = formatCambodiaPhone(phone);

    // Compute encrypted pin for both consumer and banker
    let consumerEncryptedPin = '';
    let districtBankerEncryptedPin = '';

    if (pin) {
      consumerEncryptedPin = rsaEncrypt({ value: pin, role: 'consumer' });
      districtBankerEncryptedPin = rsaEncrypt({ value: pin, role: 'district_banker' });
    } else if (propEncryptedPin) {
      consumerEncryptedPin = propEncryptedPin;
      districtBankerEncryptedPin = propEncryptedPin;
    }

    if (!consumerEncryptedPin && !districtBankerEncryptedPin) {
      logApiResponse('/api/auth/login', 400, { success: false, message: '4-digit PIN is required' }, Date.now() - startTime);
      return NextResponse.json(
        { success: false, message: '4-digit PIN is required' },
        { status: 400 }
      );
    }

    const consumerSecret = getEncryptedConsumerClientSecret();
    const districtBankerSecret = getEncryptedDistrictBankerClientSecret();

    logUpstreamRequest('POST', TOKEN_ENDPOINT, undefined, {
      username: formattedUsername,
      grant_type: 'PASSWORD',
      consumer_client_id: CONSUMER_CLIENT_ID,
      banker_client_id: DISTRICT_BANKER_CLIENT_ID,
    });

    // 1. Prepare Consumer Auth Promise
    const consumerPromise = fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'User-Agent': 'Dart/3.10 (dart:io)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Api-Version': '--',
        'X-User-Latitude': '11.5564117',
        'Device-Id': 'Wm3_CAE3A.240806.036',
        'X-Dropoff-Latitude': '11.5564117',
        'X-User-Longitude': '104.9282',
        'Full-Device-Id': 'Wm3_CAE3A.240806.036',
        'Required_Token': 'false',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'PASSWORD',
        client_id: CONSUMER_CLIENT_ID,
        client_secret: consumerSecret,
        username: formattedUsername,
        password: consumerEncryptedPin,
        refresh_token: null,
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    }).catch((err) => ({
      ok: false,
      status: 500,
      data: { error: err.message || 'Consumer network error' },
    }));

    // 2. Prepare District Banker Auth Promise
    const districtBankerPromise = fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Origin': 'https://qa-partner.wingmall.com',
      },
      body: JSON.stringify({
        client_id: DISTRICT_BANKER_CLIENT_ID,
        client_secret: districtBankerSecret,
        username: formattedUsername,
        grant_type: 'PASSWORD',
        password: districtBankerEncryptedPin,
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    }).catch((err) => ({
      ok: false,
      status: 500,
      data: { error: err.message || 'District banker network error' },
    }));

    // Run both logins simultaneously
    const [consumerRes, districtBankerRes] = await Promise.all([
      consumerPromise,
      districtBankerPromise,
    ]);

    const hasAnySuccess = consumerRes.ok || districtBankerRes.ok;

    if (!hasAnySuccess) {
      const errorMessage =
        districtBankerRes.data?.message ||
        consumerRes.data?.message ||
        districtBankerRes.data?.result_message ||
        consumerRes.data?.result_message ||
        districtBankerRes.data?.error_description ||
        consumerRes.data?.error_description ||
        'Authentication failed. Please verify your phone number and 4-digit PIN.';

      logApiResponse('/api/auth/login', 401, {
        success: false,
        error: errorMessage,
        bankerStatus: districtBankerRes.status,
        consumerStatus: consumerRes.status,
      }, Date.now() - startTime);

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          consumer: consumerRes,
          district_banker: districtBankerRes,
        },
        { status: 401 }
      );
    }

    const responsePayload = {
      success: true,
      username: formattedUsername,
      consumer: {
        success: consumerRes.ok,
        status: consumerRes.status,
        data: consumerRes.data,
      },
      district_banker: {
        success: districtBankerRes.ok,
        status: districtBankerRes.status,
        data: districtBankerRes.data,
      },
    };

    const bankerToken =
      districtBankerRes.data?.access_token ||
      districtBankerRes.data?.data?.access_token ||
      districtBankerRes.data?.body?.access_token ||
      districtBankerRes.data?.token;

    const consumerToken =
      consumerRes.data?.access_token ||
      consumerRes.data?.data?.access_token ||
      consumerRes.data?.body?.access_token ||
      consumerRes.data?.token;

    logApiResponse('/api/auth/login', 200, {
      success: true,
      username: formattedUsername,
      banker: {
        status: districtBankerRes.status,
        ok: districtBankerRes.ok,
        hasToken: !!bankerToken,
        tokenPreview: bankerToken ? `${bankerToken.substring(0, 15)}...` : undefined,
        raw: districtBankerRes.data,
      },
      consumer: {
        status: consumerRes.status,
        ok: consumerRes.ok,
        hasToken: !!consumerToken,
        tokenPreview: consumerToken ? `${consumerToken.substring(0, 15)}...` : undefined,
        raw: consumerRes.data,
      },
    }, Date.now() - startTime);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    logApiError('/api/auth/login', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server authentication error',
      },
      { status: 500 }
    );
  }
}
