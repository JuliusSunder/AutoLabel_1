"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = "Ein Fehler ist aufgetreten";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <Container>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Passwort vergessen?
            </h1>
            <p className="text-gray-600">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {success ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">E-Mail gesendet!</p>
                  <p className="text-sm mt-1">
                    Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.
                  </p>
                  <p className="text-sm mt-2">
                    Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den Link in der E-Mail.
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <Link href="/login">
                    <Button className="w-full">
                      Zurück zur Anmeldung
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ihre@email.de"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Wird gesendet..." : "Reset-Link senden"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

