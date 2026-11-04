// backend/src/course/shared-ipn-auth.ts

import {
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  createHmac,
  timingSafeEqual,
} from 'crypto';

/**
 * Verify trusted internal IPN forwarding.
 *
 * PayStation -> Main Express -> Workshop NestJS
 *
 * This signature is created by our Main Backend.
 * It is not a PayStation signature.
 */

export function verifySharedIpn(
  body: unknown,
  timestamp?: string,
  signature?: string,
): void {
  const secret = process.env.SHARED_IPN_HMAC_SECRET;

  if (!secret || secret.length < 32) {
    throw new ServiceUnavailableException(
      'Shared IPN authentication is not configured',
    );
  }

  // Validate timestamp and signature format.
  if (
    !timestamp ||
    !/^\d{13}$/.test(timestamp) ||
    !signature ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    throw new UnauthorizedException(
      'Missing or invalid internal IPN signature',
    );
  }

  // Allow a five-minute clock difference.
  const age = Math.abs(
    Date.now() - Number(timestamp)
  );

  if (!Number.isFinite(age) || age > 5 * 60 * 1000) {
    throw new UnauthorizedException(
      'Internal IPN request expired',
    );
  }

  // Recreate the exact same signed content.
  const signedContent =
    `${timestamp}.${JSON.stringify(body)}`;

  const expectedSignature = createHmac(
    'sha256',
    secret,
  )
    .update(signedContent)
    .digest('hex');

  const actual = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  // Constant-time signature comparison.
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    throw new UnauthorizedException(
      'Internal IPN authentication failed',
    );
  }
}
