import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Google OAuth / PKCE flow sends `code`
  const code = searchParams.get("code");

  // Magic link / email OTP flow sends `token_hash` + `type`
  // (kept as fallback in case of email confirmation links from signUp)
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // ---- PKCE / OAuth (Google, or email confirm) ----
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(error.message)}`,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return enforceAndRedirect(user?.email, supabase, origin, next);
  }

  // ---- Email OTP / magic link (signUp confirmation links) ----
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (error) {
      console.error("[auth/callback] verifyOtp error:", error);
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(error.message)}`,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return enforceAndRedirect(user?.email, supabase, origin, next);
  }

  return NextResponse.redirect(`${origin}/auth?error=Missing+auth+parameters`);
}

// Shared domain check + redirect helper
async function enforceAndRedirect(
  email: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  origin: string,
  next: string,
) {
  if (!email || !email.endsWith("@lnmiit.ac.in")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(
        "Only @lnmiit.ac.in emails are accepted",
      )}`,
    );
  }
  return NextResponse.redirect(`${origin}${next}`);
}
