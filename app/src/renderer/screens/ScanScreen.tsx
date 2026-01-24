/**
 * Scan Screen
 * Allows user to trigger Vinted email scanning
 */

import React, { useState } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { ScanResult } from '../../shared/types';
import './ScanScreen.css';

export function ScanScreen() {
  const api = useAutolabel();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setResult(null);

    try {
      const scanResult = await api.scan.refreshVinted();
      setResult(scanResult);
      console.log('Vinted refresh completed:', scanResult);
      
      // Reload page after 2 seconds to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
      console.error('Vinted refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="screen scan-screen">
      <h2 className="screen-title">Scan for Labels</h2>

      <div className="card scan-info">
        <h3>🔄 Refresh Vinted Sales</h3>
        <p>
          This will scan your mailbox for <strong>Vinted shipping labels</strong> from the last 30 days.
        </p>
        <p style={{ color: '#e67e22', fontWeight: 'bold', marginTop: '10px' }}>
          ⚠️ Note: All existing data will be cleared and rescanned for a fresh start.
        </p>
        
        <button
          className="btn btn-secondary scan-button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{ marginTop: '15px' }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Vinted Sales'}
        </button>

        {result && (
          <div className="scan-result" style={{ marginTop: '20px', border: '2px solid #27ae60' }}>
            <h4>✅ Scan Complete!</h4>
            <p>
              <strong>Items checked:</strong> {result.scannedCount}
            </p>
            <p>
              <strong>Sales imported:</strong> {result.newSales}
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="scan-errors">
                <strong>Errors:</strong>
                <ul>
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#7f8c8d' }}>
              Page will reload in 2 seconds to show updated data...
            </p>
          </div>
        )}

        {error && (
          <div className="scan-error" style={{ marginTop: '20px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="card scan-info">
        <h3>📋 What Gets Scanned?</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>✅ Only <strong>Vinted/Kleiderkreisel</strong> emails</li>
          <li>✅ Only emails with <strong>PDF attachments</strong> (shipping labels)</li>
          <li>✅ Automatically detects carrier: <strong>Hermes, DPD, DHL, GLS, UPS</strong></li>
          <li>✅ Extracts item title from email subject</li>
        </ul>
      </div>

      <div className="card scan-info">
        <h3>💡 How It Works</h3>
        <p>
          The scanner reads emails and scans folders for shipping label files.
          For Vinted emails, it reads the body text where shipping instructions mention the carrier (e.g., "Bringe dein Paket zu einem Hermes PaketShop").
        </p>
        <p style={{ marginTop: '10px' }}>
          After scanning, go to the <strong>History</strong> tab to see your sales and select which ones to prepare for printing.
        </p>
      </div>
    </div>
  );
}
