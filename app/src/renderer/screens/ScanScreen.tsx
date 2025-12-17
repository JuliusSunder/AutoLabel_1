/**
 * Scan Screen
 * Allows user to trigger email scanning
 */

import React, { useState } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { ScanResult } from '../../shared/types';
import './ScanScreen.css';

export function ScanScreen() {
  const api = useAutolabel();
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const result = await api.scan.start();
      setLastResult(result);
      console.log('Scan completed:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="screen scan-screen">
      <h2 className="screen-title">Scan Emails</h2>

      <div className="card scan-card">
        <p className="scan-description">
          Click the button below to scan your mailbox for new sales and shipping labels.
          This will check emails from the last 30 days.
        </p>

        <button
          className="btn btn-primary scan-button"
          onClick={handleScan}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : '📧 Scan Email'}
        </button>

        {lastResult && (
          <div className="scan-result">
            <h3>Last Scan Results</h3>
            <p>
              <strong>Emails scanned:</strong> {lastResult.scannedCount}
            </p>
            <p>
              <strong>New sales found:</strong> {lastResult.newSales}
            </p>
            {lastResult.errors && lastResult.errors.length > 0 && (
              <div className="scan-errors">
                <strong>Errors:</strong>
                <ul>
                  {lastResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="scan-error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="card scan-info">
        <h3>💡 Configuration</h3>
        <p>
          To configure your email settings (IMAP), use the config API.
          Email scanning will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
}
