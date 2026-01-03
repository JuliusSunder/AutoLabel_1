"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        
        console.log("[Login] Auth check result:", data);
        
        if (!isMounted) return;
        
        if (data.user) {
          // User is already logged in, redirect to dashboard
          console.log("[Login] User is logged in, redirecting to dashboard");
          setShouldRedirect(true);
          return;
        }
        
        console.log("[Login] No user session, showing login form");
      } catch (error) {
        console.error("[Login] Session check error:", error);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Separate effect for redirect to avoid race conditions
  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/dashboard");
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    if (searchParams.get("passwordReset") === "true") {
      setSuccess("Your password has been successfully reset. You can now sign in.");
    }
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful! Please check your email to verify your account.");
    }
    if (searchParams.get("verified") === "true") {
      setSuccess("Email verified successfully! You can now sign in.");
    }
    if (searchParams.get("error") === "verify-email") {
      setError("Please verify your email address before signing in. Check your inbox for the verification link.");
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setResendingVerification(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Verification email has been sent. Please check your inbox.");
      } else {
        setError(data.error || "Failed to send verification email.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[Login] Sign-in result:", result);

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email address before signing in. Check your inbox for the verification link.");
        } else if (result.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else {
          setError(`Sign-in failed: ${result.error}`);
        }
      } else if (result?.ok) {
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("[Login] Sign-in error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Container>
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Container>
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Sign In
            </h1>
            <p className="text-gray-600">
              Sign in to your AutoLabel account
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="px-4 py-3 text-green-700 bg-green-50 rounded-lg border border-green-200">
                  {success}
                </div>
              )}
              {error && (
                <div className="px-4 py-3 text-red-700 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="flex gap-3 items-center">
                    {error.includes("verify") && email && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {resendingVerification ? "Sending..." : "Resend email"}
                      </button>
                    )}
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="flex absolute inset-0 items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="flex relative justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => {
                console.log("[Login] Google sign-in initiated");
                signIn("google", { callbackUrl: "/dashboard" });
              }}
              disabled={loading}
              className="flex gap-3 justify-center items-center px-4 py-3 w-full rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-gray-700">Sign in with Google</span>
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

