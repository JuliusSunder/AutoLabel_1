"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { CheckCircle, Download, Key, Mail, Copy, Check } from "lucide-react";

interface LicenseData {
  licenseKey: string;
  plan: string;
  expiresAt: string | null;
}

function SuccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchLicenseData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchLicenseData = async () => {
    try {
      // Wait a bit for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (data.user?.license) {
        setLicenseData(data.user.license);
      }
    } catch (error) {
      console.error("Error fetching license data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLicenseKey = () => {
    if (licenseData?.licenseKey) {
      navigator.clipboard.writeText(licenseData.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    router.push("/download");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your purchase. Your license has been activated.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-600">
                Your license is being created... Please wait a moment.
              </p>
            </div>
          ) : licenseData ? (
            <>
              {/* License Key Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your License Key
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
                        value={licenseData.licenseKey}
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
                    <p className="text-sm text-gray-500 mt-2">
                      Keep this key safe. You will need it when installing AutoLabel.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Plan</p>
                      <p className="font-medium uppercase">
                        {licenseData.plan}
                      </p>
                    </div>
                    {licenseData.expiresAt && (
                      <div>
                        <p className="text-sm text-gray-600">Valid Until</p>
                        <p className="font-medium">
                          {new Date(licenseData.expiresAt).toLocaleDateString(
                            "en-US"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">
                    Download AutoLabel
                  </h2>
                </div>
                <p className="mb-6 text-blue-100">
                  Download AutoLabel now and start using it immediately.
                </p>
                <Button
                  onClick={handleDownload}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Now
                </Button>
              </div>

              {/* Email Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      Email Sent
                    </h3>
                    <p className="text-sm text-gray-600">
                      We have sent you an email with your License Key and the
                      download link. Please also check your spam folder.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-600 mb-6">
                Your license is being created. This may take a few minutes.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can close this page and access your license later in your dashboard.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Go to Homepage</Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 flex items-center justify-center">Loading...</div>}>
      <SuccessForm />
    </Suspense>
  );
}

