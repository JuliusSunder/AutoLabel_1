'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

            {/* CTA Button */}
            <Button
              size="sm"
              onClick={() => scrollToSection('pricing')}
              className="hidden sm:inline-flex bg-accent hover:bg-accent-dark text-white border-0 shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Button>

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

          {/* Mobile Menu CTA */}
          <div className="p-6 border-t border-gray-200">
            <Button
              size="sm"
              onClick={() => scrollToSection('pricing')}
              className="w-full bg-accent hover:bg-accent-dark text-white border-0 shadow-lg shadow-accent/30 transition-all duration-300"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

