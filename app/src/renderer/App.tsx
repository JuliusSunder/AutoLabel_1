/**
 * Main App Component
 * Provides navigation between different screens
 */

import React, { useState } from 'react';
import { ScanScreen } from './screens/ScanScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { PrepareScreen } from './screens/PrepareScreen';
import { PrintScreen } from './screens/PrintScreen';
import './App.css';

type Screen = 'scan' | 'history' | 'prepare' | 'print';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('scan');
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  const handleSelectSales = (saleIds: string[]) => {
    setSelectedSaleIds(saleIds);
    setCurrentScreen('prepare');
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <h1 className="app-title">AutoLabel</h1>
        <div className="app-tabs">
          <button
            className={currentScreen === 'scan' ? 'active' : ''}
            onClick={() => setCurrentScreen('scan')}
          >
            Scan
          </button>
          <button
            className={currentScreen === 'history' ? 'active' : ''}
            onClick={() => setCurrentScreen('history')}
          >
            History
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
      </nav>

      <main className="app-content">
        {currentScreen === 'scan' && <ScanScreen />}
        {currentScreen === 'history' && (
          <HistoryScreen onSelectSales={handleSelectSales} />
        )}
        {currentScreen === 'prepare' && (
          <PrepareScreen selectedSaleIds={selectedSaleIds} />
        )}
        {currentScreen === 'print' && <PrintScreen />}
      </main>
    </div>
  );
}
