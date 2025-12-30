/**
 * Login Modal Component
 * Handles user authentication with email/password
 */

import React, { useState } from 'react';
import { toast } from 'sonner';

interface LoginModalProps {
  onLoginSuccess?: () => void;
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Bitte geben Sie Email und Passwort ein');
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.autolabel.auth.login(email, password);

      if (result.success) {
        toast.success('Login erfolgreich!');
        
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        toast.error(result.error || 'Login fehlgeschlagen');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Open website in default browser
    // In production, this should be set via build-time environment variable
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
    window.open(`${websiteUrl}/forgot-password`, '_blank');
  };

  const handleCreateAccount = () => {
    // Open website registration in default browser
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
    window.open(`${websiteUrl}/register`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AutoLabel</h2>
          <p className="text-gray-600 mt-2">Melden Sie sich an, um fortzufahren</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ihre@email.de"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            disabled={isLoading}
          >
            Passwort vergessen?
          </button>

          <div className="text-sm text-gray-600">
            Noch kein Account?{' '}
            <button
              onClick={handleCreateAccount}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              disabled={isLoading}
            >
              Jetzt registrieren
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Durch die Anmeldung stimmen Sie unseren{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Nutzungsbedingungen
            </a>{' '}
            zu.
          </p>
        </div>
      </div>
    </div>
  );
}

