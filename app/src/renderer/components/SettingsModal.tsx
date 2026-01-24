/**
 * Settings Modal
 * Allows users to configure app settings
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import { X, Printer, Calendar, FileText, Lock, User } from 'lucide-react';
import type { PrinterInfo, FooterConfig } from '../../shared/types';
import { AccountStatus } from './AccountStatus';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedPrinters?: PrinterInfo[];
}

export function SettingsModal({ isOpen, onClose, cachedPrinters = [] }: SettingsModalProps) {
  const api = useAutolabel();
  const [printers, setPrinters] = useState<PrinterInfo[]>(cachedPrinters);
  const [defaultPrinter, setDefaultPrinter] = useState<string>('');
  const [scanDays, setScanDays] = useState<number>(30);
  const [defaultFooterConfig, setDefaultFooterConfig] = useState<FooterConfig>({
    includeProductNumber: true,
    includeItemTitle: false,
    includeDate: true,
  });
  const [canCustomFooter, setCanCustomFooter] = useState<boolean>(true); // License check

  // Update printers when cachedPrinters prop changes
  useEffect(() => {
    if (cachedPrinters.length > 0) {
      setPrinters(cachedPrinters);
    }
  }, [cachedPrinters]);

  // Load settings only once on first open
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      checkLicense();
    }
  }, [isOpen]);

  const checkLicense = async () => {
    try {
      const userInfo = await api.auth.getCachedUserInfo();
      const plan = userInfo.subscription?.plan || 'free';
      // Custom footer is allowed for Plus and Pro plans
      setCanCustomFooter(plan !== 'free');
    } catch (err) {
      console.error('Failed to check custom footer permission:', err);
      setCanCustomFooter(false);
    }
  };

  const loadSettings = async () => {
    // Load default printer
    const savedPrinter = localStorage.getItem('defaultPrinter');
    if (savedPrinter) {
      setDefaultPrinter(savedPrinter);
    }

    // Load scan days from config
    try {
      const config = await api.config.get();
      setScanDays(config.scanDays || 30);
    } catch (err) {
      console.error('Failed to load scan days from config:', err);
      setScanDays(30); // Fallback to default
    }

    // Load default footer config
    const savedFooterConfig = localStorage.getItem('defaultFooterConfig');
    if (savedFooterConfig) {
      try {
        setDefaultFooterConfig(JSON.parse(savedFooterConfig));
      } catch (err) {
        console.error('Failed to parse footer config:', err);
      }
    }
  };

  const handleDefaultPrinterChange = (printerName: string) => {
    setDefaultPrinter(printerName);
    localStorage.setItem('defaultPrinter', printerName);
  };

  const handleScanDaysChange = async (value: string) => {
    // Parse the input value
    const parsed = parseInt(value, 10);
    
    // If empty or invalid, set to 1
    if (value === '' || isNaN(parsed) || parsed < 1) {
      setScanDays(1);
      try {
        await api.config.set({ scanDays: 1 });
      } catch (err) {
        console.error('Failed to save scan days to config:', err);
      }
      return;
    }
    
    // Validate: min=1, max=365
    const validatedDays = Math.max(1, Math.min(365, parsed));
    setScanDays(validatedDays);
    
    try {
      await api.config.set({ scanDays: validatedDays });
      console.log('Scan days saved to config:', validatedDays);
    } catch (err) {
      console.error('Failed to save scan days to config:', err);
    }
  };

  const handleFooterConfigChange = (field: keyof FooterConfig, value: boolean) => {
    const newConfig = { ...defaultFooterConfig, [field]: value };
    setDefaultFooterConfig(newConfig);
    localStorage.setItem('defaultFooterConfig', JSON.stringify(newConfig));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop (not on modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="settings-modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Account Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <User size={20} />
              <h3>Account</h3>
            </div>
            <AccountStatus />
          </div>

          {/* Default Printer */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Printer size={20} />
              <h3>Default Printer</h3>
            </div>
            <p className="settings-section-description">
              Select the default printer to use when preparing labels
            </p>
            {printers.length === 0 ? (
              <p className="settings-empty">No printers found</p>
            ) : (
              <select
                className="settings-select"
                value={defaultPrinter}
                onChange={(e) => handleDefaultPrinterChange(e.target.value)}
                aria-label="Default printer"
              >
                <option value="">Select a printer...</option>
                {printers.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name} {printer.isDefault && '(System Default)'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scan Time Period */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Calendar size={20} />
              <h3>Scan Time Period</h3>
            </div>
            <p className="settings-section-description">
              Scan emails from the last X days
            </p>
            <div className="settings-input-group">
              <label htmlFor="scan-days">Days:</label>
              <input
                id="scan-days"
                type="number"
                min="1"
                max="365"
                step="1"
                value={scanDays}
                onChange={(e) => handleScanDaysChange(e.target.value)}
                onBlur={(e) => {
                  // Ensure minimum value on blur
                  if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                    handleScanDaysChange('1');
                  }
                }}
                className="settings-input"
                aria-label="Scan time period in days"
              />
              <span className="settings-input-hint">
                {scanDays === 1 ? '1 day' : `${scanDays} days`}
              </span>
            </div>
            <p className="settings-input-hint" style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
              💡 Recommended: 1-30 days for best performance
            </p>
          </div>

          {/* Default Footer Settings */}
          <div className="settings-section">
            <div className="settings-section-header">
              <FileText size={20} />
              <h3>Default Footer Settings</h3>
            </div>
            
            {canCustomFooter ? (
              <>
                <p className="settings-section-description">
                  Choose which fields to include in labels by default
                </p>
                <div className="settings-footer-options">
                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={defaultFooterConfig.includeProductNumber}
                      onChange={(e) => handleFooterConfigChange('includeProductNumber', e.target.checked)}
                      aria-label="Include product number"
                    />
                    <span>Product Number</span>
                  </label>
                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={defaultFooterConfig.includeItemTitle}
                      onChange={(e) => handleFooterConfigChange('includeItemTitle', e.target.checked)}
                      aria-label="Include item title"
                    />
                    <span>Item Title</span>
                  </label>
                  <label className="settings-toggle-label">
                    <input
                      type="checkbox"
                      checked={defaultFooterConfig.includeDate}
                      onChange={(e) => handleFooterConfigChange('includeDate', e.target.checked)}
                      aria-label="Include date"
                    />
                    <span>Date</span>
                  </label>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '24px',
                opacity: 0.6 
              }}>
                <Lock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', textAlign: 'center' }}>
                  Custom Footer Locked
                </p>
                <p style={{ fontSize: '13px', opacity: 0.8, textAlign: 'center' }}>
                  Upgrade your plan to unlock this feature
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

