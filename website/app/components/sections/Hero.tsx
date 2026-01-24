'use client';

import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-32 md:pt-48 md:pb-48 overflow-hidden bg-white">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.4]" />
      
      {/* Gradient Overlay for Fade Effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Content */}
          <div className="flex flex-col text-left max-w-2xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-lighter text-accent-light text-sm font-medium w-fit mb-6 border border-accent-light/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-light opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-light"></span>
              </span>
              Now available for everyone
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary mb-6 leading-[1.1]">
              Automate Your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-lighter">
                Shipping Labels
              </span>
            </h1>
            
            <p className="text-xl text-primary-lighter mb-8 leading-relaxed max-w-lg">
              AutoLabel scans your emails and folders, normalizes labels to 4×6", and prints them automatically. Save hours of manual work every day.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button 
                size="lg" 
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto text-base px-8 h-12 shadow-lg shadow-primary/20 transition-transform hover:scale-105"
              >
                Start for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => scrollToSection('workflow')}
                className="w-full sm:w-auto text-base px-8 h-12 hover:bg-gray-100"
              >
                See workflow
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p>Trusted by 500+ sellers</p>
            </div>
          </div>

          {/* Right Column: Video Placeholder */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white group cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300">
            {/* Placeholder Content */}
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 text-primary ml-1 fill-current" />
              </div>
            </div>
            
            {/* Optional: Add an actual image thumbnail here if available */}
            {/* <img src="/hero-thumbnail.jpg" alt="Demo" className="absolute inset-0 w-full h-full object-cover" /> */}
            
            <div className="absolute bottom-4 left-4 right-4 p-4 glass-panel rounded-xl backdrop-blur-md bg-white/30 border border-white/20 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-800">Coming soon...</span>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
