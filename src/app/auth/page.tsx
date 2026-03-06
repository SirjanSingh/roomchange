"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

// ---------- Google icon ----------
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ---------- Animated background blobs ----------
function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Spinning gradient ring */}
      <div
        className="animate-spin-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10"
        style={{ background: "conic-gradient(from 0deg, #6366f1, #0ea5e9, #8b5cf6, #ec4899, #6366f1)" }}
      />
      {/* Blob 1 */}
      <div
        className="animate-blob absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, #4f46e5)" }}
      />
      {/* Blob 2 */}
      <div
        className="animate-blob-delay absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #0ea5e9, #2563eb)" }}
      />
      {/* Blob 3 */}
      <div
        className="animate-blob-delay2 absolute -bottom-20 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6, #ec4899)" }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

// ---------- Floating dots ----------
function FloatingDots() {
  const dots = [
    { size: 6, top: "15%", left: "10%", delay: "0s", dur: "4s" },
    { size: 4, top: "70%", left: "20%", delay: "1s", dur: "5s" },
    { size: 8, top: "30%", left: "85%", delay: "0.5s", dur: "3.5s" },
    { size: 5, top: "80%", left: "75%", delay: "2s", dur: "4.5s" },
    { size: 3, top: "50%", left: "50%", delay: "1.5s", dur: "6s" },
    { size: 7, top: "10%", left: "60%", delay: "0.8s", dur: "3.8s" },
  ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-40"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            background: "linear-gradient(135deg, #818cf8, #38bdf8)",
            animation: `float ${d.dur} ease-in-out ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Main login form ----------
function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "consent select_account" },
      },
    });
    if (error) {
      console.error("[auth] Google OAuth error:", error);
      setErrorMsg(`Google sign-in failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <BackgroundBlobs />
      <FloatingDots />

      {/* Card */}
      <div className="animate-slide-up relative z-10 w-full max-w-sm">
        {/* Glow behind card */}
        <div
          className="absolute -inset-1 rounded-3xl blur-xl opacity-40"
          style={{ background: "linear-gradient(135deg, #6366f1, #0ea5e9, #8b5cf6)" }}
        />

        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Floating icon */}
          <div className="flex justify-center mb-6">
            <div
              className="animate-float w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              🏠
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="shimmer-text text-3xl font-extrabold tracking-tight mb-2">
              Room Exchange
            </h1>
            <p className="text-gray-400 text-sm">
              LNMIIT · Swap your hostel room
            </p>
          </div>

          {/* Error from redirect */}
          {urlError && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
              {decodeURIComponent(urlError)}
            </div>
          )}

          {/* Inline error */}
          {errorMsg && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="animate-pulse-ring w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-white hover:bg-gray-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-xl transition-all duration-150 shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02]"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-center text-gray-600 text-xs mt-6">
            Only <span className="text-indigo-400">@lnmiit.ac.in</span> accounts are accepted
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-gray-400 animate-pulse">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
