"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { Download, CheckCircle, ChevronDown, AlertTriangle } from "lucide-react";

interface DownloadData {
  downloadUrl: string;
}

export default function DownloadPage() {
  const router = useRouter();
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openBrowserWarnings, setOpenBrowserWarnings] = useState(false);
  const [openSmartScreenWarnings, setOpenSmartScreenWarnings] = useState(false);

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
      <div className="py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
      <div className="py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="p-8 bg-red-50 rounded-2xl border border-red-200">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Download nicht verfügbar
              </h1>
              <p className="mb-6 text-gray-600">{error}</p>
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
    <div className="py-20 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Container className="text-[rgb(43,255,0)]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <div className="inline-flex justify-center items-center mb-4 w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Bereit zum Download!
            </h1>
            <p className="text-gray-600">
              Ihre Lizenz ist aktiv. Laden Sie AutoLabel herunter und beginnen
              Sie sofort.
            </p>
          </div>

          {/* Download Card */}
          <div className="p-8 mb-6 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl">
            <div className="flex gap-3 items-center mb-4">
              <Download className="w-6 h-6" />
              <h2 className="text-2xl font-bold">AutoLabel herunterladen</h2>
            </div>
            <p className="mb-6 text-blue-100">
              Klicken Sie auf den Button unten, um die neueste Version von
              AutoLabel für Windows herunterzuladen.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex justify-center items-center px-6 py-3 font-medium text-gray-900 bg-white rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              <Download className="mr-2 w-5 h-5 text-gray-900" />
              AutoLabel-Setup.exe herunterladen
            </button>
          </div>


          {/* Installation Instructions */}
          <div className="p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Installationsanleitung
            </h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex flex-shrink-0 justify-center items-center w-8 h-8 font-bold text-blue-600 bg-blue-100 rounded-full">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    AutoLabel herunterladen
                  </p>
                  <p className="text-gray-600">
                    Klicken Sie auf den Download-Button oben, um die
                    Installationsdatei herunterzuladen.
                  </p>
                </div>
              </li>

              {/* Browser Warnings Section */}
              <li className="flex gap-4">
                <span className="flex flex-shrink-0 justify-center items-center w-8 h-8 font-bold text-blue-600 bg-blue-100 rounded-full">
                  2
                </span>
                <div className="flex-1">
                  <div className="flex gap-2 items-start mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="font-medium text-gray-900">
                      Browser-Warnungen umgehen
                    </p>
                  </div>
                  <p className="mb-3 text-gray-600">
                    Microsoft Edge und Chrome zeigen Sicherheitswarnungen für neue
                    Software. So umgehen Sie diese:
                  </p>

                  <button
                    onClick={() => setOpenBrowserWarnings(!openBrowserWarnings)}
                    className="flex justify-between items-center px-4 py-3 w-full text-left bg-gray-50 rounded-lg transition-colors hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-700">
                      Schritt-für-Schritt Anleitung anzeigen
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                        openBrowserWarnings ? "transform rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openBrowserWarnings ? "mt-4 max-h-[2000px]" : "max-h-0"
                    }`}
                  >
                    <div className="p-4 space-y-6 bg-gray-50 rounded-lg">
                      {/* Step 1 */}
                      <div>
                        <p className="mb-2 font-medium text-gray-900">
                          Schritt 1: Download-Warnung
                        </p>
                        <p className="mb-3 text-sm text-gray-600">
                          Klicken Sie auf die drei Punkte (⋯) neben der Warnung und
                          wählen Sie <strong>&quot;Beibehalten&quot;</strong>.
                        </p>
                        <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src="/images/windows_warnings/Download_Meldung_1.png"
                            alt="Browser Download Warnung - Schritt 1"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <p className="mb-2 font-medium text-gray-900">
                          Schritt 2: Bestätigung
                        </p>
                        <p className="mb-3 text-sm text-gray-600">
                          Klicken Sie erneut auf <strong>&quot;Beibehalten&quot;</strong> zur
                          Bestätigung.
                        </p>
                        <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src="/images/windows_warnings/Download_Meldung_2.png"
                            alt="Browser Download Warnung - Schritt 2"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <p className="mb-2 font-medium text-gray-900">
                          Schritt 3: Weitere Bestätigung
                        </p>
                        <p className="mb-3 text-sm text-gray-600">
                          Klicken Sie auf <strong>&quot;Trotzdem beibehalten&quot;</strong>.
                        </p>
                        <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src="/images/windows_warnings/Download_Meldung_3.png"
                            alt="Browser Download Warnung - Schritt 3"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div>
                        <p className="mb-2 font-medium text-gray-900">
                          Schritt 4: Download abgeschlossen
                        </p>
                        <p className="mb-3 text-sm text-gray-600">
                          Der Download ist nun abgeschlossen und die Datei wurde
                          gespeichert.
                        </p>
                        <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src="/images/windows_warnings/Download_Meldung_4.png"
                            alt="Browser Download Warnung - Schritt 4"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Hinweis:</strong> Diese Warnungen erscheinen, weil
                          AutoLabel eine neue Software ist. Ihr Download ist sicher und
                          wird von uns signiert.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* Windows SmartScreen Section */}
              <li className="flex gap-4">
                <span className="flex flex-shrink-0 justify-center items-center w-8 h-8 font-bold text-blue-600 bg-blue-100 rounded-full">
                  3
                </span>
                <div className="flex-1">
                  <div className="flex gap-2 items-start mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="font-medium text-gray-900">
                      Windows SmartScreen Warnung umgehen
                    </p>
                  </div>
                  <p className="mb-3 text-gray-600">
                    Beim Start der Installation kann Windows SmartScreen eine Warnung
                    anzeigen. So fahren Sie fort:
                  </p>

                  <button
                    onClick={() =>
                      setOpenSmartScreenWarnings(!openSmartScreenWarnings)
                    }
                    className="flex justify-between items-center px-4 py-3 w-full text-left bg-gray-50 rounded-lg transition-colors hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-700">
                      Schritt-für-Schritt Anleitung anzeigen
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                        openSmartScreenWarnings ? "transform rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSmartScreenWarnings ? "mt-4 max-h-[1000px]" : "max-h-0"
                    }`}
                  >
                    <div className="p-4 space-y-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="mb-2 font-medium text-gray-900">
                          Windows SmartScreen umgehen
                        </p>
                        <p className="mb-3 text-sm text-gray-600">
                          Klicken Sie auf <strong>&quot;Weitere Informationen&quot;</strong>{" "}
                          und dann auf{" "}
                          <strong>&quot;Trotzdem ausführen&quot;</strong>.
                        </p>
                        <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src="/images/windows_warnings/Installer_Meldung_1.png"
                            alt="Windows SmartScreen Warnung"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Hinweis:</strong> Windows SmartScreen schützt vor
                          unbekannter Software. AutoLabel ist sicher, aber als neue
                          Software noch nicht bei Microsoft registriert. Diese Warnung
                          verschwindet mit der Zeit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex flex-shrink-0 justify-center items-center w-8 h-8 font-bold text-blue-600 bg-blue-100 rounded-full">
                  4
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Installation abschließen
                  </p>
                  <p className="text-gray-600">
                    Folgen Sie den Anweisungen des Installationsassistenten. Nach der
                    Installation können Sie AutoLabel starten.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex flex-shrink-0 justify-center items-center w-8 h-8 font-bold text-blue-600 bg-blue-100 rounded-full">
                  5
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Fertig!</p>
                  <p className="text-gray-600">
                    AutoLabel ist jetzt installiert und einsatzbereit. Melden Sie sich
                    mit Ihrer E-Mail und Ihrem Passwort an.
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

