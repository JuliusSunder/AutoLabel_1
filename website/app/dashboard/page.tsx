"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { BackButton } from "@/app/components/ui/BackButton";
import { Download, Key, CreditCard, LogOut, Copy, Check, TrendingUp } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  subscription: {
    plan: string;
    status: string;
    billingPeriod: string | null;
    currentPeriodEnd: string | null;
  } | null;
  license: {
    licenseKey: string;
    plan: string;
    status: string;
    expiresAt: string | null;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserData(data.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLicenseKey = () => {
    if (userData?.license?.licenseKey) {
      navigator.clipboard.writeText(userData.license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  const hasActiveLicense = userData.license?.status === "active";
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

          {/* License Card - Nur für Premium User */}
          {isPremium && hasActiveLicense && userData.license && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Your License
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userData.license.licenseKey}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyLicenseKey}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-medium uppercase">
                      {userData.license.plan}
                    </p>
                  </div>
                  {userData.license.expiresAt && (
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="font-medium">
                        {new Date(
                          userData.license.expiresAt
                        ).toLocaleDateString("en-US")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Download Card - Für alle User */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Download AutoLabel</h2>
            </div>
            <p className="mb-6 text-blue-100">
              {planName === "free" 
                ? "Download AutoLabel and use it with the free plan (10 labels per month)."
                : "Download the latest version of AutoLabel and install it on your computer."}
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Now
            </button>
            {planName === "free" && (
              <p className="mt-4 text-sm text-blue-200">
                Note: No license key is required for the Free plan.
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}


