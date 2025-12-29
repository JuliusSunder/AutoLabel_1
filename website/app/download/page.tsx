"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { Download, Key, CheckCircle } from "lucide-react";

interface DownloadData {
  downloadUrl: string;
  licenseKey: string;
  plan: string;
  expiresAt: string | null;
}

export default function DownloadPage() {
  const router = useRouter();
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDownloadData();
  }, []);

  const fetchDownloadData = async () => {
    try {
      const response = await fetch("/api/download/app");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Download nicht verfügbar");
        setLoading(false);
        return;
      }

      setDownloadData(data);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadData?.downloadUrl) {
      window.location.href = downloadData.downloadUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <Container>
          <div className="text-center">
            <p className="text-gray-600">Lädt...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Download nicht verfügbar
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push("/dashboard")}>
                Zum Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <Container>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bereit zum Download!
            </h1>
            <p className="text-gray-600">
              Ihre Lizenz ist aktiv. Laden Sie AutoLabel herunter und beginnen
              Sie sofort.
            </p>
          </div>

          {/* Download Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6" />
              <h2 className="text-2xl font-bold">AutoLabel herunterladen</h2>
            </div>
            <p className="mb-6 text-blue-100">
              Klicken Sie auf den Button unten, um die neueste Version von
              AutoLabel für Windows herunterzuladen.
            </p>
            <Button
              onClick={handleDownload}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Download className="w-5 h-5 mr-2" />
              AutoLabel-Setup.exe herunterladen
            </Button>
          </div>

          {/* License Info Card */}
          {downloadData && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Ihre Lizenzinformationen
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Key
                  </label>
                  <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm break-all">
                    {downloadData.licenseKey}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Bewahren Sie diesen Key sicher auf. Sie benötigen ihn bei
                    der Installation.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-medium uppercase">
                      {downloadData.plan}
                    </p>
                  </div>
                  {downloadData.expiresAt && (
                    <div>
                      <p className="text-sm text-gray-600">Gültig bis</p>
                      <p className="font-medium">
                        {new Date(downloadData.expiresAt).toLocaleDateString(
                          "de-DE"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Installation Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Installationsanleitung
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    AutoLabel herunterladen
                  </p>
                  <p className="text-gray-600">
                    Klicken Sie auf den Download-Button oben, um die
                    Installationsdatei herunterzuladen.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    Installation starten
                  </p>
                  <p className="text-gray-600">
                    Öffnen Sie die heruntergeladene Datei und folgen Sie den
                    Anweisungen des Installationsassistenten.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    License Key eingeben
                  </p>
                  <p className="text-gray-600">
                    Geben Sie Ihren License Key ein, wenn Sie dazu aufgefordert
                    werden. Sie finden ihn oben auf dieser Seite.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-900">Fertig!</p>
                  <p className="text-gray-600">
                    AutoLabel ist jetzt installiert und einsatzbereit. Viel
                    Erfolg!
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
            >
              Zurück zum Dashboard
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}

