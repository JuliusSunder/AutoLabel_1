/**
 * Print Screen
 * Shows print queue and job status
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { PrinterInfo } from '../../shared/types';
import './PrintScreen.css';

export function PrintScreen() {
  const api = useAutolabel();
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.print.listPrinters();
      setPrinters(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load printers');
      console.error('Failed to load printers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen print-screen">
      <h2 className="screen-title">Print Queue</h2>

      <div className="card print-printers">
        <h3>Available Printers</h3>

        {loading && <p>Loading printers...</p>}

        {error && (
          <div className="print-error">
            <p>
              <strong>Error:</strong> {error}
            </p>
            <button className="btn btn-primary" onClick={loadPrinters}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && printers.length === 0 && (
          <p className="print-hint">
            No printers found. Printer enumeration will be implemented in Phase 3.
          </p>
        )}

        {!loading && !error && printers.length > 0 && (
          <ul className="print-printer-list">
            {printers.map((printer) => (
              <li key={printer.name} className="print-printer-item">
                <span className="print-printer-name">{printer.name}</span>
                {printer.isDefault && (
                  <span className="print-printer-badge">Default</span>
                )}
                <span className="print-printer-status">{printer.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card print-queue">
        <h3>Print Queue</h3>
        <div className="empty-state">
          <div className="empty-state-icon">🖨️</div>
          <p className="empty-state-text">No print jobs</p>
          <p className="empty-state-hint">
            Prepared labels will appear here when ready to print
          </p>
        </div>
      </div>

      <div className="card print-info">
        <h3>💡 Printing Information</h3>
        <p>
          Print queue management and batch printing will be implemented in Phase 3.
          Labels will be normalized to 100×150mm (4×6") format.
        </p>
      </div>
    </div>
  );
}
