// frontend/src/app/api/batch-01/[action]/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'ru_batch01_access';

const BACKEND_URL = (
  process.env.COURSE_BACKEND_INTERNAL_URL ||
  'http://127.0.0.1:4000'
).replace(/\/$/, '');

type ActionConfig = {
  method: 'GET' | 'POST';
  backendPath: string;
  requiresSession?: boolean;
  createsSession?: boolean;
  responseType?: 'json' | 'pdf';
};

const ACTIONS: Record<string, ActionConfig> = {
  settings: {
    method: 'GET',
    backendPath: 'course/batch-01/settings',
  },

  register: {
    method: 'POST',
    backendPath: 'course/batch-01/register',
    createsSession: true,
  },

  status: {
    method: 'GET',
    backendPath: 'course/batch-01/status',
    requiresSession: true,
  },

  'coupon-apply': {
    method: 'POST',
    backendPath: 'course/batch-01/coupon/apply',
    requiresSession: true,
  },

  'coupon-remove': {
    method: 'POST',
    backendPath: 'course/batch-01/coupon/remove',
    requiresSession: true,
  },

  initiate: {
    method: 'POST',
    backendPath: 'course/batch-01/initiate',
    requiresSession: true,
  },

  verify: {
    method: 'POST',
    backendPath: 'course/batch-01/verify',
    requiresSession: true,
  },

  confirm: {
    method: 'POST',
    backendPath: 'course/batch-01/confirm',
    requiresSession: true,
  },

  receipt: {
    method: 'GET',
    backendPath: 'course/batch-01/receipt',
    requiresSession: true,
    responseType: 'pdf',
  },
};

type RouteContext = {
  params: {
    action: string;
  };
};

async function handleRequest(
  request: NextRequest,
  context: RouteContext,
) {
  const action = context.params.action;
  const config = ACTIONS[action];

  if (!config || config.method !== request.method) {
    return NextResponse.json(
      { message: 'API route not found' },
      { status: 404 },
    );
  }

  // Same-origin protection for POST requests.
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');

    const siteUrl =
      process.env.COURSE_SITE_URL ||
      'https://workshop.researchustad.org';

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
        message: 'Batch-01 session missing. Please register first.',
        code: 'BATCH01_SESSION_MISSING',
      },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(
      `${BACKEND_URL}/api/${config.backendPath}`,
      {
        method: config.method,
        headers: {
          Accept:
            config.responseType === 'pdf'
              ? 'application/pdf'
              : 'application/json',

          ...(config.method === 'POST'
            ? { 'Content-Type': 'application/json' }
            : {}),

          ...(config.requiresSession && accessToken
            ? { 'x-course-access': accessToken }
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

    // Preserve the PDF response as binary data.
    if (config.responseType === 'pdf') {
      if (!upstream.ok) {
        const errorData = await upstream.json().catch(() => ({
          message: 'Unable to generate payment receipt',
        }));

        return NextResponse.json(errorData, {
          status: upstream.status,
        });
      }

      const buffer = await upstream.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            upstream.headers.get('content-disposition') ||
            'attachment; filename="Research-Ustad-Receipt.pdf"',
          'Cache-Control': 'no-store',
        },
      });
    }

    const data = await upstream.json().catch(() => ({
      message: 'Unexpected response from Batch-01 backend',
    }));

    if (!upstream.ok) {
      return NextResponse.json(data, {
        status: upstream.status,
      });
    }

    // Registration creates a new HttpOnly session cookie.
    if (config.createsSession) {
      const {
        accessToken: newToken,
        ...safeData
      } = data;

      if (
        typeof newToken !== 'string' ||
        !/^[a-f0-9]{64}$/i.test(newToken)
      ) {
        return NextResponse.json(
          { message: 'Invalid Batch-01 session from backend' },
          { status: 502 },
        );
      }

      const response = NextResponse.json(safeData, {
        status: upstream.status,
      });

      response.cookies.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error(
      '[Batch-01 API Proxy]',
      error instanceof Error ? error.message : 'Unknown error',
    );

    return NextResponse.json(
      {
        message: 'Batch-01 backend is temporarily unavailable',
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