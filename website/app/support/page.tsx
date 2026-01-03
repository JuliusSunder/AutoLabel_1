"use client";

import { useState } from "react";
import { Container } from "@/app/components/ui/Container";
import { Navigation } from "@/app/components/sections/Navigation";
import { Footer } from "@/app/components/sections/Footer";
import { BackButton } from "@/app/components/ui/BackButton";

import type { Metadata } from "next";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <BackButton />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support & Kontakt
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Haben Sie Fragen oder benötigen Sie Hilfe? Wir sind für Sie da!
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Kontaktinformationen
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                    <a
                      href="mailto:AutoLabel@gmx.de"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      AutoLabel@gmx.de
                    </a>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Antwortzeit
                    </h3>
                    <p className="text-gray-600">
                      Wir antworten in der Regel innerhalb von 24 Stunden.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Support-Zeiten
                    </h3>
                    <p className="text-gray-600">
                      Montag - Freitag: 9:00 - 18:00 Uhr
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Häufige Fragen
                </h2>
                
                <div className="space-y-3">
                  <a
                    href="/#faq"
                    className="block text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    → FAQ - Häufig gestellte Fragen
                  </a>
                  <a
                    href="/#how-it-works"
                    className="block text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    → Wie funktioniert AutoLabel?
                  </a>
                  <a
                    href="/#pricing"
                    className="block text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    → Preise & Pläne
                  </a>
                  <a
                    href="/agb"
                    className="block text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    → AGB
                  </a>
                  <a
                    href="/datenschutz"
                    className="block text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    → Datenschutzerklärung
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nachricht senden
              </h2>

              {success && (
                <div className="mb-6 px-4 py-3 text-green-700 bg-green-50 rounded-lg border border-green-200">
                  Vielen Dank für Ihre Nachricht! Wir werden uns so schnell wie
                  möglich bei Ihnen melden.
                </div>
              )}

              {error && (
                <div className="mb-6 px-4 py-3 text-red-700 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ihr Name"
                    disabled={loading}
                  />
                </div>

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
                    placeholder="ihre@email.de"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Nachricht
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Beschreiben Sie Ihr Anliegen..."
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Wird gesendet..." : "Nachricht senden"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}

