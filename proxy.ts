import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// App pages use client-side AuthGuard for protection.
// Only protect sensitive API routes server-side.
const isProtectedApiRoute = createRouteMatcher([
  '/api/user/(.*)',
  '/api/garage/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
