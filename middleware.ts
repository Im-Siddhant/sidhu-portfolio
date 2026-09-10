import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: cookies => cookies.forEach(({name,value}) => response.cookies.set(name,value)) },
  });
  await supabase.auth.getUser();
  return response;
}
export const config = { matcher: ['/admin/:path*'] };