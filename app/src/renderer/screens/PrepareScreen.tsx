/**
 * Prepare Screen
 * Configure footer and prepare labels for printing
 */

import React, { useState } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { FooterConfig } from '../../shared/types';
import './PrepareScreen.css';

interface PrepareScreenProps {
  selectedSaleIds: string[];
}

export function PrepareScreen({ selectedSaleIds }: PrepareScreenProps) {
  const api = useAutolabel();
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    includeProductNumber: true,
    includeItemTitle: false,
    includeDate: true,
    includeBuyerRef: false,
  });
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedLabels, setPreparedLabels] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleToggleField = (field: keyof FooterConfig) => {
    setFooterConfig((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePrepare = async () => {
    setIsPreparing(true);
    setError(null);
    setPreparedLabels([]);

    try {
      const result = await api.labels.prepare({
        saleIds: selectedSaleIds,
        footerConfig,
      });
      setPreparedLabels(result);
      console.log('Labels prepared:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare labels');
      console.error('Failed to prepare labels:', err);
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePrint = async () => {
    if (preparedLabels.length === 0) return;

    setIsPrinting(true);
    setError(null);

    try {
      const labelIds = preparedLabels.map((l) => l.id);
      await api.print.start({ labelIds });
      console.log('Print job started');
      alert('Print job started! Check the Print Queue tab for status.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start printing');
      console.error('Failed to print:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  if (selectedSaleIds.length === 0) {
    return (
      <div className="screen prepare-screen">
        <h2 className="screen-title">Prepare Labels</h2>
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <p className="empty-state-text">No sales selected</p>
          <p className="empty-state-hint">
            Select sales from the History screen to prepare labels
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen prepare-screen">
      <h2 className="screen-title">Prepare Labels</h2>

      <div className="card prepare-summary">
        <h3>Selected Sales</h3>
        <p>
          <strong>{selectedSaleIds.length}</strong> sale(s) selected for label preparation
        </p>
      </div>

      <div className="card prepare-footer-config">
        <h3>Footer Configuration</h3>
        <p className="prepare-footer-hint">
          Select which fields to include in the label footer:
        </p>

        <div className="prepare-checkboxes">
          <label className="prepare-checkbox-label">
            <input
              type="checkbox"
              checked={footerConfig.includeProductNumber}
              onChange={() => handleToggleField('includeProductNumber')}
            />
            <span>Product Number</span>
          </label>

          <label className="prepare-checkbox-label">
            <input
              type="checkbox"
              checked={footerConfig.includeItemTitle}
              onChange={() => handleToggleField('includeItemTitle')}
            />
            <span>Item Title</span>
          </label>

          <label className="prepare-checkbox-label">
            <input
              type="checkbox"
              checked={footerConfig.includeDate}
              onChange={() => handleToggleField('includeDate')}
            />
            <span>Date</span>
          </label>

          <label className="prepare-checkbox-label">
            <input
              type="checkbox"
              checked={footerConfig.includeBuyerRef}
              onChange={() => handleToggleField('includeBuyerRef')}
            />
            <span>Buyer Reference</span>
          </label>
        </div>
      </div>

      <div className="card prepare-actions">
        <button
          className="btn btn-success prepare-button"
          onClick={handlePrepare}
          disabled={isPreparing}
        >
          {isPreparing ? 'Preparing...' : '🏷️ Prepare Labels'}
        </button>

        {preparedLabels.length > 0 && (
          <div className="prepare-success">
            <p>
              ✅ Successfully prepared <strong>{preparedLabels.length}</strong> label(s)!
            </p>
            <button
              className="btn btn-success"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? 'Starting Print...' : '🖨️ Print Now'}
            </button>
          </div>
        )}

        {error && (
          <div className="prepare-error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
