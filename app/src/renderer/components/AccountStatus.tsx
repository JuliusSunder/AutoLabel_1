/**
 * Account Status Component
 * Displays user account info, subscription plan, and usage
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { SessionInfo } from '../../shared/types';

export function AccountStatus() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const sessionData = await window.autolabel.auth.getSession();
      setSession(sessionData);
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Fehler beim Laden der Account-Informationen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleLogout = async () => {
    if (!confirm('Möchten Sie sich wirklich abmelden?')) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await window.autolabel.auth.logout();
      toast.success('Erfolgreich abgemeldet');
      
      // Trigger a custom event that AuthGuard will listen to
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Fehler beim Abmelden');
      setIsLoggingOut(false);
    }
  };

  const handleUpgrade = () => {
    // Use environment variable or fallback to localhost
    // In production, VITE_WEBSITE_URL will be set via build-time environment variable
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
    window.open(`${websiteUrl}/#pricing`, '_blank');
  };

  const handleRefresh = () => {
    loadSession();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Keine Account-Informationen verfügbar</p>
      </div>
    );
  }

  const plan = session.subscription.plan;
  const planName = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
  }[plan];

  const planColor = {
    free: 'bg-gray-100 text-gray-800',
    plus: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
  }[plan];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            <p className="text-sm text-gray-600 mt-1">{session.user.email}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Aktualisieren"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Plan Info */}
        <div>
          <label className="text-sm font-medium text-gray-700">Aktueller Plan</label>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${planColor}`}>
              {planName}
            </span>
            {plan === 'free' && (
              <button
                onClick={handleUpgrade}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgraden →
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <p className="mt-1 text-sm text-gray-900">
            {session.subscription.status === 'active' ? 'Aktiv' : session.subscription.status}
          </p>
        </div>

        {/* Device Info */}
        {session.device && (
          <div>
            <label className="text-sm font-medium text-gray-700">Gerät</label>
            <p className="mt-1 text-sm text-gray-600">
              Registriert am{' '}
              {new Date(session.device.registeredAt).toLocaleDateString('de-DE')}
            </p>
          </div>
        )}

        {/* Plan Features */}
        <div className="pt-4 border-t border-gray-200">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Features</label>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {plan === 'free' && '10 Labels pro Monat'}
              {plan === 'plus' && '60 Labels pro Monat'}
              {plan === 'pro' && 'Unbegrenzte Labels'}
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Batch-Druck
            </li>
            {plan !== 'free' && (
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Custom Footer
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoggingOut ? 'Abmelden...' : 'Abmelden'}
        </button>
      </div>
    </div>
  );
}

