"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { BackButton } from "@/app/components/ui/BackButton";
import { OnboardingGuide } from "@/app/components/OnboardingGuide";
import { Download, CreditCard, LogOut, TrendingUp, Lock, Rocket } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  hasPassword: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    billingPeriod: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        console.log("[Dashboard] Auth check result:", data);

        if (!isMounted) return;

        if (!data.user) {
          console.log("[Dashboard] No user session, redirecting to login");
          setShouldRedirect(true);
          return;
        }

        console.log("[Dashboard] User is logged in, showing dashboard");
        setUserData(data.user);
      } catch (error) {
        console.error("[Dashboard] Error fetching user data:", error);
        if (isMounted) {
          setShouldRedirect(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Separate effect for redirect to avoid race conditions
  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/login");
    }
  }, [shouldRedirect, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      console.log("[Dashboard] Refresh auth check result:", data);

      if (!data.user) {
        console.log("[Dashboard] No user session after refresh");
        router.replace("/login");
        return;
      }

      setUserData(data.user);
    } catch (error) {
      console.error("[Dashboard] Error fetching user data:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch("/api/download/app");
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Download failed");
        return;
      }

      // Start download directly
      if (data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = 'AutoLabel-Setup.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Download URL not available. Please contact support.");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("An error occurred");
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/stripe/manual-sync", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Synchronization failed";
        const hint = data.hint ? `\n\n${data.hint}` : "";
        const details = data.details ? `\n\nDetails: ${data.details}` : "";
        alert(errorMessage + hint + details);
        return;
      }

      alert("Subscription successfully updated! Page will reload...");
      // Reload user data
      await fetchUserData();
    } catch (error) {
      console.error("Sync error:", error);
      alert("An error occurred: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSyncing(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validate password
    if (password.length < 8) {
      setPasswordError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwörter stimmen nicht überein");
      return;
    }

    setSettingPassword(true);
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Fehler beim Setzen des Passworts");
        return;
      }

      alert("Passwort erfolgreich gesetzt! Sie können sich jetzt in der Desktop-App anmelden.");
      // Reload user data
      await fetchUserData();
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Set password error:", error);
      setPasswordError("Ein Fehler ist aufgetreten");
    } finally {
      setSettingPassword(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      const response = await fetch("/api/user/complete-onboarding", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to complete onboarding");
        return;
      }

      // Reload user data to update hasCompletedOnboarding flag
      await fetchUserData();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  // Check if user should see onboarding
  const shouldShowOnboarding = userData && !userData.hasCompletedOnboarding;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <Container>
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const planName = userData.subscription?.plan || "free";
  const isPremium = planName !== "free";

  // Usage Limits basierend auf Plan
  const usageLimits = {
    free: { labelsPerMonth: 10, batchPrinting: false, customFooter: false },
    plus: { labelsPerMonth: 60, batchPrinting: true, customFooter: true },
    pro: { labelsPerMonth: -1, batchPrinting: true, customFooter: true }, // -1 = unlimited
  };

  const currentLimit = usageLimits[planName as keyof typeof usageLimits] || usageLimits.free;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <Container>
        <div className="max-w-4xl mx-auto">
          <BackButton />
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {userData.name || userData.email}!
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Onboarding Card - Only for new users */}
          {shouldShowOnboarding && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Willkommen bei AutoLabel! 🎉</h2>
              </div>
              <p className="mb-6 text-green-50 text-lg">
                Du bist neu hier? Lass uns gemeinsam AutoLabel einrichten! 
                Unser interaktiver Guide führt dich Schritt für Schritt durch die Einrichtung.
              </p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowOnboarding(true)}
                  variant="outline"
                  className="bg-white text-green-600 hover:bg-green-50 border-0 font-semibold px-6 py-3 text-lg"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Guide me through
                </Button>
                <button
                  onClick={handleCompleteOnboarding}
                  className="text-green-100 hover:text-white underline text-sm transition-colors"
                >
                  Ich kenne mich schon aus
                </button>
              </div>
            </div>
          )}

          {/* Plan Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Your Plan</h2>
              </div>
              {/* Upgrade Button - Show for all users except Pro */}
              {planName !== "pro" && (
                <Button 
                  onClick={() => router.push("/#pricing")}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Upgrade
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-medium">Current Plan:</span>{" "}
                <span className="text-blue-600 font-bold uppercase">
                  {planName}
                </span>
              </p>
              {userData.subscription && (
                <>
                  <p className="text-gray-600">
                    <span className="font-medium">Status:</span>{" "}
                    {userData.subscription.status === "active"
                      ? "Active"
                      : userData.subscription.status}
                  </p>
                  {userData.subscription.billingPeriod && (
                    <p className="text-gray-600">
                      <span className="font-medium">Billing Period:</span>{" "}
                      {userData.subscription.billingPeriod === "monthly"
                        ? "Monthly"
                        : "Yearly"}
                    </p>
                  )}
                  {userData.subscription.currentPeriodEnd && (
                    <p className="text-gray-600">
                      <span className="font-medium">Renews on:</span>{" "}
                      {new Date(
                        userData.subscription.currentPeriodEnd
                      ).toLocaleDateString("en-US")}
                    </p>
                  )}
                </>
              )}
            </div>
            {/* Sync Button for all users */}
            <div className="mt-6 space-y-2">
              <Button
                onClick={handleSyncSubscription}
                disabled={syncing}
                variant="outline"
                className="w-full"
              >
                {syncing ? "Syncing..." : "Update Subscription"}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                {isPremium 
                  ? "Click here to update your subscription data (e.g., after an upgrade)."
                  : "If you have already paid, click here to synchronize your subscription."}
              </p>
            </div>
          </div>

          {/* Usage Info Card - Für alle User */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Usage Limits
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Labels per Month:</span>
                <span className="font-bold text-lg">
                  {currentLimit.labelsPerMonth === -1 
                    ? "Unlimited" 
                    : `${currentLimit.labelsPerMonth} Labels`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Batch Printing:</span>
                <span className={`font-medium ${currentLimit.batchPrinting ? "text-green-600" : "text-gray-400"}`}>
                  {currentLimit.batchPrinting ? "✓ Available" : "✗ Not Available"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Custom Footer:</span>
                <span className={`font-medium ${currentLimit.customFooter ? "text-green-600" : "text-gray-400"}`}>
                  {currentLimit.customFooter ? "✓ Available" : "✗ Not Available"}
                </span>
              </div>
            </div>
            {!isPremium && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Upgrade to Plus or Pro for more labels and additional features!
                </p>
              </div>
            )}
          </div>


          {/* Password Set Card - Nur für OAuth User ohne Passwort */}
          {!userData.hasPassword && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Desktop-App Passwort setzen</h2>
              </div>
              <p className="mb-6 text-orange-100">
                Sie haben sich mit Google angemeldet. Um die Desktop-App zu nutzen, müssen Sie ein Passwort setzen.
              </p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Neues Passwort (mindestens 8 Zeichen)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Passwort eingeben"
                    disabled={settingPassword}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Passwort wiederholen"
                    disabled={settingPassword}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-200 bg-red-900/30 p-3 rounded-lg">
                    {passwordError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={settingPassword}
                  className="w-full px-6 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-600 disabled:opacity-50"
                >
                  {settingPassword ? "Wird gesetzt..." : "Passwort setzen"}
                </button>
              </form>
              <p className="mt-4 text-sm text-orange-100">
                💡 Nach dem Setzen können Sie sich in der Desktop-App mit Ihrer E-Mail ({userData.email}) und diesem Passwort anmelden.
              </p>
            </div>
          )}

          {/* Download Card - Für alle User */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6" />
              <h2 className="text-2xl font-bold">AutoLabel Desktop App</h2>
            </div>
            <p className="mb-6 text-blue-100">
              {planName === "free" 
                ? "Download AutoLabel and use it with the free plan (10 labels per month)."
                : "Download the latest version of AutoLabel and install it on your computer."}
            </p>
            <button
              onClick={() => router.push("/download")}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download App
            </button>
            {!userData.hasPassword && (
              <p className="mt-3 text-sm text-blue-200">
                ⚠️ Bitte setzen Sie zuerst ein Passwort (siehe oben), um sich in der Desktop-App anmelden zu können.
              </p>
            )}
            {userData.hasPassword && (
              <p className="mt-3 text-sm text-blue-200">
                💡 Melden Sie sich in der Desktop-App mit Ihrer E-Mail ({userData.email}) und Ihrem Passwort an.
              </p>
            )}
          </div>
        </div>
      </Container>

      {/* Onboarding Guide Modal */}
      {showOnboarding && (
        <OnboardingGuide
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
          userEmail={userData.email}
          hasPassword={userData.hasPassword}
        />
      )}
    </div>
  );
}


