'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface UserSession {
  id: string;
  email: string;
  name: string | null;
}

export function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch user session
    fetchUserSession();
  }, []);

  const fetchUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'py-3'
          : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-full transition-all duration-500"
          style={{
            background: isScrolled 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.85) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.6) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: isScrolled
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
              : '0 4px 16px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
          }}
        >
          {/* Top shine effect */}
          <div 
            className="absolute top-0 left-1/4 right-1/4 h-px opacity-60"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            }}
          />

          <div className="flex items-center justify-between px-6 py-3">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 hover:scale-105"
            >
              <Image
                src="/logo/logo.png"
                alt="AutoLabel Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-primary hidden sm:block">
                AutoLabel
              </span>
            </button>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('workflow')}
                className="text-sm font-medium text-primary-light hover:text-accent transition-colors duration-300 relative group"
              >
                Workflow
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-primary-light hover:text-accent transition-colors duration-300 relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-primary-light hover:text-accent transition-colors duration-300 relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="hidden sm:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                  >
                    <User className="w-4 h-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => scrollToSection('pricing')}
                    className="bg-accent hover:bg-accent-dark text-white border-0 shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-primary-light hover:text-accent transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed right-0 top-0 h-full w-64 bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo/logo.png"
                alt="AutoLabel Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold text-primary">
                AutoLabel
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary-light hover:text-accent transition-colors duration-300"
              aria-label="Close mobile menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <nav className="flex-1 px-6 py-8">
            <div className="flex flex-col space-y-6">
              <button
                onClick={() => scrollToSection('workflow')}
                className="text-left text-lg font-medium text-primary-light hover:text-accent transition-colors duration-300"
              >
                Workflow
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left text-lg font-medium text-primary-light hover:text-accent transition-colors duration-300"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left text-lg font-medium text-primary-light hover:text-accent transition-colors duration-300"
              >
                FAQ
              </button>
            </div>
          </nav>

          {/* Mobile Menu Auth */}
          <div className="p-6 border-t border-gray-200">
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    {user.name || user.email}
                  </p>
                </div>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => scrollToSection('pricing')}
                  className="w-full bg-accent hover:bg-accent-dark text-white border-0 shadow-lg shadow-accent/30 transition-all duration-300"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

