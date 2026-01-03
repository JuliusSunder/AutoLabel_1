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
    console.log('[LoginModal] handleSubmit called');

    if (!email || !password) {
      console.log('[LoginModal] Email or password missing');
      toast.error('Please enter email and password');
      return;
    }

    console.log('[LoginModal] Starting login process...');
    setIsLoading(true);

    try {
      console.log('[LoginModal] Calling window.autolabel.auth.login...');
      const result = await window.autolabel.auth.login(email, password);
      console.log('[LoginModal] Login result:', result);

      if (result.success) {
        console.log('[LoginModal] Login successful');
        toast.success('Login successful!');
        
        if (onLoginSuccess) {
          console.log('[LoginModal] Calling onLoginSuccess callback');
          onLoginSuccess();
        }
      } else {
        console.log('[LoginModal] Login failed:', result.error);
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('[LoginModal] Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      console.log('[LoginModal] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      // Open website in default browser
      // In production, this should be set via build-time environment variable
      const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
      await window.autolabel.shell.openExternal(`${websiteUrl}/forgot-password`);
    } catch (error) {
      console.error('Failed to open forgot password page:', error);
      toast.error('Failed to open password recovery page');
    }
  };

  const handleCreateAccount = async () => {
    try {
      // Open website registration in default browser
      const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
      await window.autolabel.shell.openExternal(`${websiteUrl}/register`);
    } catch (error) {
      console.error('Failed to open registration page:', error);
      toast.error('Failed to open registration page');
    }
  };

  const handleTermsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Open terms page in default browser
      const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
      await window.autolabel.shell.openExternal(`${websiteUrl}/agb`);
    } catch (error) {
      console.error('Failed to open terms page:', error);
      toast.error('Failed to open terms of service');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AutoLabel</h2>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
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
              placeholder="your@email.com"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
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
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            disabled={isLoading}
          >
            Forgot password?
          </button>

          <div className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={handleCreateAccount}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              disabled={isLoading}
            >
              Sign up now
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our{' '}
            <a 
              href="#" 
              onClick={handleTermsClick}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

