/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log error to main process
    if (window.autolabel?.log?.error) {
      window.autolabel.log.error(
        'Renderer error caught by ErrorBoundary',
        {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        {
          componentStack: errorInfo.componentStack,
          source: 'ErrorBoundary',
        }
      ).catch((logError) => {
        console.error('Failed to log error to main process:', logError);
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '2rem',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <AlertCircle
              size={48}
              style={{
                color: 'hsl(var(--destructive))',
                marginBottom: '1rem',
              }}
            />
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: 'hsl(var(--foreground))',
              }}
            >
              Ein Fehler ist aufgetreten
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Anwendung neu.
            </p>
            {isDevelopment && this.state.error && (
              <div
                style={{
                  padding: '1rem',
                  background: 'hsl(var(--muted))',
                  borderRadius: 'var(--radius)',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'hsl(var(--foreground))',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
                {this.state.error.stack && (
                  <pre
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.7rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.625rem 1.5rem',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--primary) / 0.9)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 119, 130, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'hsl(var(--primary))';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              App neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

