/**
 * Prepare Screen
 * Configure footer and prepare labels for printing
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { FooterConfig, Sale, PrinterInfo } from '../../shared/types';
import './PrepareScreen.css';

interface PrepareScreenProps {
  selectedSaleIds: string[];
  onRemoveSale?: (saleId: string) => void;
}

export function PrepareScreen({ selectedSaleIds, onRemoveSale }: PrepareScreenProps) {
  const api = useAutolabel();
  const [sales, setSales] = useState<Sale[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    includeProductNumber: true,
    includeItemTitle: false,
    includeDate: true,
  });
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedLabels, setPreparedLabels] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [preparedThumbnails, setPreparedThumbnails] = useState<Map<string, string>>(new Map());
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | undefined>();

  // Load sale details when selectedSaleIds change
  useEffect(() => {
    const loadSales = async () => {
      const loadedSales: Sale[] = [];
      for (const saleId of selectedSaleIds) {
        try {
          const sale = await api.sales.get(saleId);
          if (sale) {
            loadedSales.push(sale);
          }
        } catch (err) {
          console.error(`Failed to load sale ${saleId}:`, err);
        }
      }
      setSales(loadedSales);
    };

    if (selectedSaleIds.length > 0) {
      loadSales();
    } else {
      setSales([]);
    }
  }, [selectedSaleIds]);

  // Load thumbnails for selected sales
  useEffect(() => {
    const loadThumbnails = async () => {
      const thumbMap = new Map<string, string>();

      for (const sale of sales) {
        try {
          // @ts-ignore - New API not yet in types
          const attachments = await api.attachments.getBySale(sale.id);
          if (attachments && attachments.length > 0) {
            // @ts-ignore - New API not yet in types
            const thumbnail = await api.labels.getThumbnail(attachments[0].localPath);
            thumbMap.set(sale.id, thumbnail);
          }
        } catch (err) {
          console.error(`Failed to load thumbnail for sale ${sale.id}:`, err);
        }
      }

      setThumbnails(thumbMap);
    };

    if (sales.length > 0) {
      loadThumbnails();
    }
  }, [sales]);

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
    setPreparedThumbnails(new Map());

    try {
      const result = await api.labels.prepare({
        saleIds: selectedSaleIds,
        footerConfig,
      });
      setPreparedLabels(result);
      console.log('Labels prepared:', result);

      // Load thumbnails for prepared labels
      const thumbMap = new Map<string, string>();
      for (const label of result) {
        try {
          // @ts-ignore - getThumbnail API exists
          const thumbnail = await api.labels.getThumbnail(label.outputPath);
          thumbMap.set(label.id, thumbnail);
        } catch (err) {
          console.error(`Failed to load thumbnail for label ${label.id}:`, err);
        }
      }
      setPreparedThumbnails(thumbMap);

      // Load printers after successful preparation
      try {
        const printerList = await api.print.listPrinters();
        setPrinters(printerList);
        // Auto-select default printer
        const defaultPrinter = printerList.find((p) => p.isDefault);
        setSelectedPrinter(defaultPrinter?.name || printerList[0]?.name);
      } catch (err) {
        console.error('Failed to load printers:', err);
        // Don't block the user if printers can't be loaded
      }
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
      await api.print.start({ labelIds, printerName: selectedPrinter });
      console.log('Print job started with printer:', selectedPrinter);
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
        {sales.length > 0 && (
          <div className="selected-sales-list">
            {sales.map((sale) => (
              <div key={sale.id} className="selected-sale-item">
                {/* Thumbnail preview */}
                {thumbnails.has(sale.id) && (
                  <div className="sale-thumbnail">
                    <img
                      src={thumbnails.get(sale.id)}
                      alt="Label preview"
                      className="thumbnail-image"
                    />
                  </div>
                )}
                
                <div className="selected-sale-info">
                  <strong>{sale.itemTitle || 'Untitled Sale'}</strong>
                  {sale.shippingCompany && <span className="sale-shipping-badge">{sale.shippingCompany}</span>}
                  {sale.platform && <span className="sale-platform-badge">{sale.platform}</span>}
                  {sale.productNumber && <span className="sale-product-number">#{sale.productNumber}</span>}
                </div>
                {onRemoveSale && (
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => onRemoveSale(sale.id)}
                    title="Remove from selection"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
          <>
            <div className="prepare-success">
              <p>
                ✅ Successfully prepared <strong>{preparedLabels.length}</strong> label(s)!
              </p>

              {printers.length > 0 && (
                <div className="prepare-printer-selection">
                  <label htmlFor="printer-select">Drucker auswählen:</label>
                  <select
                    id="printer-select"
                    value={selectedPrinter || ''}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="prepare-printer-dropdown"
                  >
                    {printers.map((printer) => (
                      <option key={printer.name} value={printer.name}>
                        {printer.name} {printer.isDefault && '(Standard)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                className="btn btn-success"
                onClick={handlePrint}
                disabled={isPrinting || !selectedPrinter}
              >
                {isPrinting ? 'Starting Print...' : '🖨️ Print Now'}
              </button>
            </div>
            
            <div className="prepare-preview">
              <h4>Label Preview</h4>
              <p className="prepare-preview-hint">
                Preview of prepared labels with footer applied:
              </p>
              <div className="prepare-preview-grid">
                {preparedLabels.map((label, index) => {
                  const sale = sales.find(s => s.id === label.saleId);
                  const thumbnail = preparedThumbnails.get(label.id);
                  return (
                    <div key={label.id} className="prepare-preview-item">
                      <div className="preview-label-number">Label {index + 1}</div>
                      
                      {/* Thumbnail preview of prepared label */}
                      {thumbnail && (
                        <div className="preview-thumbnail">
                          <img
                            src={thumbnail}
                            alt={`Prepared label ${index + 1}`}
                            className="preview-thumbnail-image"
                          />
                        </div>
                      )}
                      
                      {sale && (
                        <div className="preview-sale-info">
                          <strong>{sale.itemTitle || 'Untitled Sale'}</strong>
                          {sale.shippingCompany && (
                            <span className="preview-shipping-badge">{sale.shippingCompany}</span>
                          )}
                        </div>
                      )}
                      <div className="preview-file-info">
                        <span className="preview-file-type">
                          {label.outputPath.endsWith('.pdf') ? '📄 PDF' : '🖼️ Image'}
                        </span>
                        <span className="preview-file-size">
                          {label.sizeMm.width}×{label.sizeMm.height}mm @ {label.dpi}dpi
                        </span>
                      </div>
                      {footerConfig && (
                        <div className="preview-footer-info">
                          <strong>Footer fields:</strong>
                          <ul>
                            {footerConfig.includeProductNumber && <li>Product Number</li>}
                            {footerConfig.includeItemTitle && <li>Item Title</li>}
                            {footerConfig.includeDate && <li>Date</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
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
