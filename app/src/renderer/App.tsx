/**
 * Main App Component
 * Provides navigation between different screens
 */

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Settings } from 'lucide-react';
import { HistoryScreen } from './screens/HistoryScreen';
import { PrepareScreen } from './screens/PrepareScreen';
import { PrintScreen } from './screens/PrintScreen';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

type Screen = 'history' | 'prepare' | 'print';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('history');
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const handleSelectSales = (saleIds: string[]) => {
    setSelectedSaleIds(saleIds);
    setCurrentScreen('prepare');
  };

  const handleRemoveSale = (saleId: string) => {
    setSelectedSaleIds((prev) => prev.filter((id) => id !== saleId));
  };


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey) return;

      // Ctrl/Cmd + 1: Sales
      if (e.key === '1') {
        e.preventDefault();
        setCurrentScreen('history');
      }
      // Ctrl/Cmd + 2: Prepare (only if sales are selected)
      else if (e.key === '2' && selectedSaleIds.length > 0) {
        e.preventDefault();
        setCurrentScreen('prepare');
      }
      // Ctrl/Cmd + 3: Print Queue
      else if (e.key === '3') {
        e.preventDefault();
        setCurrentScreen('print');
      }
      // Ctrl/Cmd + S: Settings
      else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSaleIds]);

  return (
    <div className="app">
      <Toaster position="top-right" richColors />
      <nav className="app-nav">
        <div className="app-nav-content">
          <h1 className="app-title">AutoLabel</h1>
          <div className="app-tabs">
          <button
            className={currentScreen === 'history' ? 'active' : ''}
            onClick={() => setCurrentScreen('history')}
          >
            Sales
          </button>
          <button
            className={currentScreen === 'prepare' ? 'active' : ''}
            onClick={() => setCurrentScreen('prepare')}
            disabled={selectedSaleIds.length === 0}
          >
            Prepare ({selectedSaleIds.length})
          </button>
          <button
            className={currentScreen === 'print' ? 'active' : ''}
            onClick={() => setCurrentScreen('print')}
          >
            Print Queue
          </button>
        </div>
        <button
          className="app-settings-btn"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={20} />
        </button>
        </div>
      </nav>

      <main className="app-content">
        <div style={{ display: currentScreen === 'history' ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
          <ErrorBoundary>
            <HistoryScreen onSelectSales={handleSelectSales} />
          </ErrorBoundary>
        </div>
        <div style={{ display: currentScreen === 'prepare' ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
          <ErrorBoundary>
            <PrepareScreen 
              selectedSaleIds={selectedSaleIds} 
              onRemoveSale={handleRemoveSale}
            />
          </ErrorBoundary>
        </div>
        <div style={{ display: currentScreen === 'print' ? 'block' : 'none', height: '100%', overflow: 'auto' }}>
          <ErrorBoundary>
            <PrintScreen />
          </ErrorBoundary>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
