"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always enabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if cookie settings are already saved
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      // Show banner after short delay for better UX
      setTimeout(() => setShowBanner(true), 500);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(cookieConsent);
        setPreferences(saved);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookieConsent", JSON.stringify(prefs));
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(necessaryOnly);
  };

  const handleReject = () => {
    const rejected: CookiePreferences = {
      necessary: true, // Necessary cookies cannot be rejected
      analytics: false,
      marketing: false,
    };
    savePreferences(rejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              We use cookies for the basic functions of the website.{" "}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                {showDetails ? "Show less" : "Learn more"}
              </button>
            </p>

            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-900">
                      Necessary Cookies
                    </label>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Always active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    These cookies are required for the basic functions of the website and cannot be disabled.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-900">
                      Analytics Cookies
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    These cookies help us understand how visitors interact with the website.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-900">
                      Marketing Cookies
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    These cookies are used to show you relevant advertising.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSavePreferences}
                    className="w-full md:w-auto"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!showDetails && (
            <div className="flex flex-col sm:flex-row gap-2 md:ml-4">
              <Button
                onClick={handleReject}
                variant="outline"
                className="whitespace-nowrap"
              >
                Reject
              </Button>
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                className="whitespace-nowrap"
              >
                Necessary Only
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="whitespace-nowrap"
              >
                Accept All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

