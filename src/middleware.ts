import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRole } from '@/types';

const protectedPageRoutes = ['/dashboard', '/admin', '/crew'];
const protectedApiRoutes = ['/api/reports', '/api/tickets', '/api/analytics', '/api/users'];

// Exclude public API endpoints even within protected prefixes
const publicApiRoutes = ['/api/reports/public'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Add Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // 2. Check if route needs protection
  const isProtectedPage = protectedPageRoutes.some((route) => pathname.startsWith(route));
  const isProtectedApi = protectedApiRoutes.some((route) => pathname.startsWith(route)) && 
                         !publicApiRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedPage && !isProtectedApi) {
    return response;
  }

  // 3. Authenticate User
  const { user, error } = await requireAuth(req);

  if (error || !user) {
    if (isProtectedApi) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-Based Access Control (RBAC)
  if (pathname.startsWith('/admin')) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', req.url)); // Forbidden redirect
    }
  }

  if (pathname.startsWith('/crew')) {
    if (user.role !== UserRole.CREW && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Pass user details to backend API routes via headers (safely injected by middleware)
  if (isProtectedApi) {
    const authHeaders = new Headers(req.headers);
    authHeaders.set('x-user-id', user.userId);
    authHeaders.set('x-user-role', user.role);
    return NextResponse.next({
      request: {
        headers: authHeaders,
      },
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
