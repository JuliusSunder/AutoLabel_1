/**
 * Settings Modal
 * Allows users to configure app settings
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import { X, Printer, Clock, FileText, Lock, User } from 'lucide-react';
import type { PrinterInfo, FooterConfig } from '../../shared/types';
import { AccountStatus } from './AccountStatus';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const api = useAutolabel();
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<string>('');
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(false);
  const [autoScanInterval, setAutoScanInterval] = useState<number>(30);
  const [defaultFooterConfig, setDefaultFooterConfig] = useState<FooterConfig>({
    includeProductNumber: true,
    includeItemTitle: false,
    includeDate: true,
  });
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [canCustomFooter, setCanCustomFooter] = useState<boolean>(true); // License check

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      loadPrinters();
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

  const loadPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const result = await api.print.listPrinters();
      setPrinters(result);
    } catch (err) {
      console.error('Failed to load printers:', err);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const loadSettings = () => {
    // Load default printer
    const savedPrinter = localStorage.getItem('defaultPrinter');
    if (savedPrinter) {
      setDefaultPrinter(savedPrinter);
    }

    // Load auto-scan settings
    const savedAutoScanEnabled = localStorage.getItem('autoScanEnabled');
    if (savedAutoScanEnabled !== null) {
      setAutoScanEnabled(savedAutoScanEnabled === 'true');
    }

    const savedAutoScanInterval = localStorage.getItem('autoScanInterval');
    if (savedAutoScanInterval) {
      setAutoScanInterval(parseInt(savedAutoScanInterval, 10));
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

  const handleAutoScanEnabledChange = (enabled: boolean) => {
    setAutoScanEnabled(enabled);
    localStorage.setItem('autoScanEnabled', enabled.toString());
  };

  const handleAutoScanIntervalChange = (interval: number) => {
    const clampedInterval = Math.max(1, Math.min(1440, interval));
    setAutoScanInterval(clampedInterval);
    localStorage.setItem('autoScanInterval', clampedInterval.toString());
  };

  const handleFooterConfigChange = (field: keyof FooterConfig, value: boolean) => {
    const newConfig = { ...defaultFooterConfig, [field]: value };
    setDefaultFooterConfig(newConfig);
    localStorage.setItem('defaultFooterConfig', JSON.stringify(newConfig));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
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
      <div className="settings-modal">
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
            {loadingPrinters ? (
              <p className="settings-loading">Loading printers...</p>
            ) : printers.length === 0 ? (
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

          {/* Auto-Scan Interval */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Clock size={20} />
              <h3>Auto-Scan</h3>
            </div>
            <p className="settings-section-description">
              Automatically scan for new emails at regular intervals
            </p>
            <label className="settings-toggle-label">
              <input
                type="checkbox"
                checked={autoScanEnabled}
                onChange={(e) => handleAutoScanEnabledChange(e.target.checked)}
                aria-label="Enable auto-scan"
              />
              <span>Enable auto-scan</span>
            </label>
            {autoScanEnabled && (
              <div className="settings-input-group">
                <label htmlFor="auto-scan-interval">Interval (minutes):</label>
                <input
                  id="auto-scan-interval"
                  type="number"
                  min="1"
                  max="1440"
                  value={autoScanInterval}
                  onChange={(e) => handleAutoScanIntervalChange(parseInt(e.target.value, 10) || 1)}
                  className="settings-input"
                  aria-label="Auto-scan interval in minutes"
                />
                <span className="settings-input-hint">
                  {autoScanInterval === 1 ? '1 minute' : `${autoScanInterval} minutes`}
                </span>
              </div>
            )}
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

