import { NextRequest, NextResponse } from 'next/server';
import {
  getEncryptedConsumerClientSecret,
  getEncryptedDistrictBankerClientSecret,
  rsaEncrypt,
} from '@/lib/cipher';

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
  try {
    const body = await req.json();
    const { phone, pin, encryptedPin: propEncryptedPin } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const formattedUsername = formatCambodiaPhone(phone);

    // Compute encrypted pin if not provided directly
    let consumerEncryptedPin = propEncryptedPin;
    let districtBankerEncryptedPin = propEncryptedPin;

    if (!consumerEncryptedPin && pin) {
      consumerEncryptedPin = rsaEncrypt({ value: pin, role: 'consumer' });
    }
    if (!districtBankerEncryptedPin && pin) {
      districtBankerEncryptedPin = rsaEncrypt({ value: pin, role: 'district_banker' });
    }

    if (!consumerEncryptedPin && !districtBankerEncryptedPin) {
      return NextResponse.json(
        { success: false, message: '4-digit PIN is required' },
        { status: 400 }
      );
    }

    const consumerSecret = getEncryptedConsumerClientSecret();
    const districtBankerSecret = getEncryptedDistrictBankerClientSecret();

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
        districtBankerRes.data?.error_description ||
        consumerRes.data?.error_description ||
        'Authentication failed. Please verify your phone number and 4-digit PIN.';

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

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server authentication error',
      },
      { status: 500 }
    );
  }
}
