// frontend/src/app/api/course/[action]/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'ru_course_access';

const BACKEND_URL = (
  process.env.COURSE_BACKEND_INTERNAL_URL ||
  'http://127.0.0.1:4000'
).replace(/\/$/, '');

const ACTIONS: Record<string, {
  method: 'GET' | 'POST';
  backendPath: string;
  requiresSession: boolean;
  createsSession: boolean;
}> = {
  register: {
    method: 'POST',
    backendPath: 'register',
    requiresSession: false,
    createsSession: true,
  },
  'resume-request': {
    method: 'POST',
    backendPath: 'resume/request',
    requiresSession: false,
    createsSession: false,
  },
  'resume-verify': {
    method: 'POST',
    backendPath: 'resume/verify',
    requiresSession: false,
    createsSession: true,
  },
  status: {
    method: 'GET',
    backendPath: 'status',
    requiresSession: true,
    createsSession: false,
  },
  initiate: {
    method: 'POST',
    backendPath: 'initiate',
    requiresSession: true,
    createsSession: false,
  },
  verify: {
    method: 'POST',
    backendPath: 'verify',
    requiresSession: true,
    createsSession: false,
  },
  confirm: {
    method: 'POST',
    backendPath: 'confirm',
    requiresSession: true,
    createsSession: false,
  },
  'coupon-apply': {
    method: 'POST',
    backendPath: 'coupon/apply',
    requiresSession: true,
    createsSession: false,
  },

  'coupon-remove': {
    method: 'POST',
    backendPath: 'coupon/remove',
    requiresSession: true,
    createsSession: false,
  },

};

type RouteContext = {
  params: { action: string };
};

function setSessionCookie(
  response: NextResponse,
  token: string,
) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

async function handleRequest(
  request: NextRequest,
  context: RouteContext,
) {
  const action = context.params.action;
  const config = ACTIONS[action];

  if (!config || request.method !== config.method) {
    return NextResponse.json(
      { message: 'API route not found' },
      { status: 404 },
    );
  }

  // Reject cross-site POST requests.
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');

    const siteUrl =
      process.env.COURSE_SITE_URL ||
      request.nextUrl.origin;

    if (
      origin &&
      new URL(origin).origin !== new URL(siteUrl).origin
    ) {
      return NextResponse.json(
        { message: 'Invalid request origin' },
        { status: 403 },
      );
    }
  }

  const accessToken =
    request.cookies.get(COOKIE_NAME)?.value;

  if (config.requiresSession && !accessToken) {
    return NextResponse.json(
      {
        message:
          'Course session missing. Resume your registration using email verification.',
        code: 'COURSE_SESSION_MISSING',
      },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(
      `${BACKEND_URL}/api/course/${config.backendPath}`,
      {
        method: config.method,
        headers: {
          Accept: 'application/json',
          ...(config.method === 'POST'
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(config.requiresSession && accessToken
          ? {
              'x-course-access': accessToken,
            }
          : {}),

        // Forward limited device metadata only during registration.
        ...(action === 'register'
          ? {
              'user-agent': (
                request.headers.get('user-agent') || ''
              ).slice(0, 512),

              'x-real-ip': (
                request.headers.get('x-real-ip') || ''
              ).slice(0, 64),
            }
          : {}),
        },
        
        body:
          config.method === 'POST'
            ? JSON.stringify(await request.json())
            : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      },
    );

    const data = await upstream.json().catch(() => ({
      message: 'Unexpected response from course backend',
    }));

    if (!upstream.ok) {
      return NextResponse.json(data, {
        status: upstream.status,
      });
    }

    if (config.createsSession) {
      const { accessToken: newToken, ...safeData } = data;

      if (
        typeof newToken !== 'string' ||
        !/^[a-f0-9]{64}$/.test(newToken)
      ) {
        return NextResponse.json(
          { message: 'Backend did not return a valid session' },
          { status: 502 },
        );
      }

      const response = NextResponse.json(
        safeData,
        { status: upstream.status },
      );

      setSessionCookie(response, newToken);

      return response;
    }

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error(
      '[Course API Proxy]',
      error instanceof Error ? error.message : 'Unknown error',
    );

    return NextResponse.json(
      {
        message: 'Course backend is temporarily unavailable',
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return handleRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  return handleRequest(request, context);
}