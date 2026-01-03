/**
 * Account Modal Component
 * Form for creating/editing email accounts
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { EmailAccount } from '../../shared/types';
import './AccountModal.css';

interface AccountModalProps {
  isOpen: boolean;
  account: EmailAccount | null; // null = create mode, account = edit mode
  onClose: () => void;
  onSuccess: () => void;
  onShowProviderInfo?: (tab?: 'intro' | 'overview' | 'instructions') => void; // Callback to open provider info modal with specific tab
  prefillData?: {
    host: string;
    port: number;
    tls: boolean;
  };
}

export function AccountModal({ isOpen, account, onClose, onSuccess, onShowProviderInfo, prefillData }: AccountModalProps) {
  const api = useAutolabel();
  const isEditMode = account !== null;

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    tls: true,
    isActive: true,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track if user is dragging (for text selection)
  const handleMouseDown = () => {
    setIsDragging(false);
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if:
    // 1. Click was directly on the overlay (not a child element)
    // 2. User didn't drag (no text selection)
    if (e.target === e.currentTarget && !isDragging) {
      onClose();
    }
  };

  // Initialize form data when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        host: account.host,
        port: account.port,
        username: account.username,
        password: '***', // Masked password
        tls: account.tls,
        isActive: account.isActive,
      });
    } else {
      // Use prefill data if provided, otherwise use defaults
      setFormData({
        name: '',
        host: prefillData?.host || '',
        port: prefillData?.port || 993,
        username: '',
        password: '',
        tls: prefillData?.tls ?? true,
        isActive: true,
      });
    }
    setTestResult(null);
    setError(null);
  }, [account, isOpen, prefillData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null); // Clear test result when form changes
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      let result;

      // In edit mode, if password is masked, test with saved password
      if (isEditMode && formData.password === '***' && account) {
        result = await api.accounts.testExisting(account.id);
      } else {
        // Test with entered password
        result = await api.accounts.test({
          host: formData.host,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          tls: formData.tls,
        });
      }

      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.host.trim()) {
      setError('Host is required');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!isEditMode && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode) {
        // Edit mode: only send changed fields
        const updates: any = {
          name: formData.name,
          host: formData.host,
          port: formData.port,
          username: formData.username,
          tls: formData.tls,
          isActive: formData.isActive,
        };

        // Only include password if it was changed
        if (formData.password !== '***') {
          updates.password = formData.password;
        }

        await api.accounts.update(account!.id, updates);
      } else {
        // Create mode
        await api.accounts.create(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Email Account' : 'Add Email Account'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <div className="label-with-action">
              <label>Account Name *</label>
              {onShowProviderInfo && (
                <button
                  type="button"
                  className="btn-link btn-template"
                  onClick={() => onShowProviderInfo('overview')}
                  title="Use predefined settings for common email providers"
                >
                  📋 Use Template
                </button>
              )}
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Gmail Main, Outlook Business"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>IMAP Host *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., imap.gmail.com"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
              />
            </div>
            <div className="form-group form-group-small">
              <label>Port *</label>
              <input
                type="number"
                className="form-control"
                value={formData.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="your.email@example.com"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="label-with-info">
              <label>App-Password * <span className="label-hint">(not your login password!)</span></label>
              {onShowProviderInfo && (
                <button
                  type="button"
                  className="btn-info"
                  onClick={() => onShowProviderInfo('instructions')}
                  title="How to create an app password? Click here for instructions."
                >
                  ℹ️
                </button>
              )}
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder={isEditMode ? 'Leave unchanged' : 'Your app-specific password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="field-help-text">
              Many email providers (Gmail, Outlook, etc.) require a special app password for IMAP access.
            </p>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.tls}
                onChange={(e) => handleChange('tls', e.target.checked)}
              />
              Use TLS/SSL (recommended)
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
              />
              Active (scan this account)
            </label>
          </div>

          {/* Test Connection */}
          <div className="form-group">
            <button
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={testing || !formData.host || !formData.username || !formData.password}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? '✅ Connection successful!' : `❌ ${testResult.error}`}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

