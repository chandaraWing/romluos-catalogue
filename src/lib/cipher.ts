import { AES, Utf8, Base64, CipherParams, CBC, Pkcs7 } from 'crypto-es';
import JSEncrypt from 'jsencrypt';

const DEFAULT_AES_IV = 'ZzNjB2Y6rYJ5JH2a';
const DEFAULT_AES_KEY = 'UGpRMH7Frk7od2Ql';

const getAesIv = (iv: string = DEFAULT_AES_IV) => Utf8.parse(iv);
const getAesKey = (key: string = DEFAULT_AES_KEY) => Utf8.parse(key);
const parseBase64CipherText = (value: string) =>
  CipherParams.create({
    ciphertext: Base64.parse(value),
  });

const removeWhitespace = (value: string) => {
  let sanitized = '';

  for (const char of value) {
    if (char.trim() !== '') {
      sanitized += char;
    }
  }

  return sanitized;
};

const normalizeBase64 = (value: string) => {
  const sanitized = removeWhitespace(value).replaceAll('-', '+').replaceAll('_', '/');
  const paddingLength = (4 - (sanitized.length % 4)) % 4;
  return sanitized.padEnd(sanitized.length + paddingLength, '=');
};

export const decodePublicKey = (pubKey: string) => {
  const trimmedKey = pubKey.trim();

  if (trimmedKey.includes('BEGIN PUBLIC KEY')) {
    return trimmedKey.replaceAll(String.raw`\n`, '\n');
  }

  try {
    const decodedKey = atob(normalizeBase64(trimmedKey));
    if (decodedKey.includes('BEGIN PUBLIC KEY')) {
      return decodedKey.replaceAll(String.raw`\n`, '\n');
    }
  } catch {
    // Fall through and let JSEncrypt try the original string.
  }

  return trimmedKey.replaceAll(String.raw`\n`, '\n');
};

export const aesDecrypt = (value: string) => {
  try {
    const decrypted = AES.decrypt(parseBase64CipherText(value.trim()), getAesKey(), {
      iv: getAesIv(),
      mode: CBC,
      padding: Pkcs7,
    });
    return decrypted.toString(Utf8);
  } catch (error) {
    throw new Error(`CipherManager cannot decrypt the key! - ${String(error)}`);
  }
};

export const getPublicKey = (role?: 'consumer' | 'district_banker') => {
  let rawKey = '';
  if (role === 'consumer') {
    rawKey = process.env.NEXT_PUBLIC_CONSUMER_RSA_PUBLIC_KEY || '';
  } else if (role === 'district_banker') {
    rawKey = process.env.NEXT_PUBLIC_DISTRICT_BANKER_RSA_PUBLIC_KEY || '';
  }

  if (!rawKey) {
    rawKey =
      process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_CONSUMER_RSA_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_DISTRICT_BANKER_RSA_PUBLIC_KEY ||
      '';
  }

  rawKey = rawKey.trim();

  if (!rawKey) {
    return '';
  }

  try {
    const decrypted = aesDecrypt(rawKey);
    if (decrypted) {
      return decrypted;
    }
  } catch {
    // Fall through if rawKey was not AES-encrypted
  }

  return rawKey;
};

export const rsaEncrypt = ({
  value,
  pubKey,
  role,
}: {
  value: string;
  pubKey?: string;
  role?: 'consumer' | 'district_banker';
}) => {
  const resolvedPubKey = pubKey || getPublicKey(role);

  if (!resolvedPubKey) {
    throw new Error('CipherManager cannot encrypt! - RSA public key is required');
  }

  try {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(decodePublicKey(resolvedPubKey));
    const encrypted = encryptor.encrypt(value);

    if (!encrypted) {
      throw new Error('RSA encryption failed - check public key format');
    }

    return encrypted;
  } catch (error) {
    throw new Error(`CipherManager cannot encrypt the key! - ${String(error)}`);
  }
};

export const getEncryptedConsumerClientSecret = () => {
  const clientSecret =
    process.env.NEXT_PUBLIC_CONSUMER_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_CUNSUMER_CLIENT_SECRET ||
    '';
  if (!clientSecret) {
    return '';
  }
  return rsaEncrypt({ value: clientSecret, role: 'consumer' });
};

export const getEncryptedDistrictBankerClientSecret = () => {
  const clientSecret = process.env.NEXT_PUBLIC_DISTRICT_BANKER_CLIENT_SECRET ?? '';
  if (!clientSecret) {
    return '';
  }
  return rsaEncrypt({ value: clientSecret, role: 'district_banker' });
};
