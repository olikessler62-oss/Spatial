import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const rawNext = requestUrl.searchParams.get("next") ?? "/app/overview-1";
  const next = rawNext.startsWith("/") ? rawNext : "/app/overview-1";

  const cookieStore = await cookies();
  const pendingCookies: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore — cookies are also copied onto the redirect response below.
            }

            pendingCookies.push({ name, value, options });
          }
        },
      },
    },
  );

  let authError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    authError = error;
  } else {
    return withCookies(
      NextResponse.redirect(
        new URL("/login?error=missing_code", requestUrl.origin),
      ),
      pendingCookies,
    );
  }

  if (authError) {
    console.error("Magic-link confirmation failed:", authError.message);

    return withCookies(
      NextResponse.redirect(
        new URL("/login?error=confirmation_failed", requestUrl.origin),
      ),
      pendingCookies,
    );
  }

  // One redirect hop into the app, with session cookies on this response.
  return withCookies(
    NextResponse.redirect(new URL(next, requestUrl.origin)),
    pendingCookies,
  );
}

function withCookies(
  response: NextResponse,
  pendingCookies: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[],
) {
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
