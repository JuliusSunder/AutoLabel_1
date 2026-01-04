/**
 * Account Modal Component
 * Form for creating/editing email accounts and watched folders
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { EmailAccount, WatchedFolder } from '../../shared/types';
import './AccountModal.css';

interface AccountModalProps {
  isOpen: boolean;
  account: EmailAccount | null; // null = create mode, account = edit mode
  folder: WatchedFolder | null; // null = create mode, folder = edit mode
  onClose: () => void;
  onSuccess: () => void;
  onShowProviderInfo?: (tab?: 'intro' | 'overview' | 'instructions') => void; // Callback to open provider info modal with specific tab
  prefillData?: {
    host: string;
    port: number;
    tls: boolean;
  };
}

export function AccountModal({ isOpen, account, folder, onClose, onSuccess, onShowProviderInfo, prefillData }: AccountModalProps) {
  const api = useAutolabel();
  const isEditMode = account !== null || folder !== null;
  const isFolder = folder !== null;
  
  // Type selection (only for create mode)
  const [sourceType, setSourceType] = useState<'email' | 'folder'>('email');

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    tls: true,
    isActive: true,
    folderPath: '',
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

  // Initialize form data when account or folder changes
  useEffect(() => {
    if (account) {
      setSourceType('email');
      setFormData({
        name: account.name,
        host: account.host,
        port: account.port,
        username: account.username,
        password: '***', // Masked password
        tls: account.tls,
        isActive: account.isActive,
        folderPath: '',
      });
    } else if (folder) {
      setSourceType('folder');
      setFormData({
        name: folder.name,
        host: '',
        port: 993,
        username: '',
        password: '',
        tls: true,
        isActive: folder.isActive,
        folderPath: folder.folderPath,
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
        folderPath: '',
      });
    }
    setTestResult(null);
    setError(null);
  }, [account, folder, isOpen, prefillData]);

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

  const handleChooseFolder = async () => {
    try {
      const result = await api.folders.chooseFolder();
      if (result.success && result.path) {
        setFormData(prev => ({ ...prev, folderPath: result.path! }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to choose folder');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError(sourceType === 'folder' ? 'Folder name is required' : 'Account name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode) {
        if (isFolder) {
          // Edit folder
          const updates: any = {
            name: formData.name,
            folderPath: formData.folderPath,
            isActive: formData.isActive,
          };
          await api.folders.update(folder!.id, updates);
        } else {
          // Edit email account
          if (!formData.host.trim()) {
            setError('Host is required');
            setSaving(false);
            return;
          }
          if (!formData.username.trim()) {
            setError('Username is required');
            setSaving(false);
            return;
          }

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
        }
      } else {
        // Create mode
        if (sourceType === 'folder') {
          // Create folder
          if (!formData.folderPath.trim()) {
            setError('Folder path is required');
            setSaving(false);
            return;
          }
          await api.folders.create({
            name: formData.name,
            folderPath: formData.folderPath,
            isActive: formData.isActive,
          });
        } else {
          // Create email account
          if (!formData.host.trim()) {
            setError('Host is required');
            setSaving(false);
            return;
          }
          if (!formData.username.trim()) {
            setError('Username is required');
            setSaving(false);
            return;
          }
          if (!formData.password.trim()) {
            setError('Password is required');
            setSaving(false);
            return;
          }
          await api.accounts.create(formData);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
          <h2>
            {isEditMode 
              ? (isFolder ? 'Edit Watched Folder' : 'Edit Email Account')
              : 'Add Source'}
          </h2>
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

          {/* Source Type Selection (only in create mode) */}
          {!isEditMode && (
            <div className="form-group">
              <label>Source Type</label>
              <div className="source-type-tabs">
                <button
                  type="button"
                  className={`source-type-tab ${sourceType === 'email' ? 'active' : ''}`}
                  onClick={() => setSourceType('email')}
                >
                  📧 Email Account
                </button>
                <button
                  type="button"
                  className={`source-type-tab ${sourceType === 'folder' ? 'active' : ''}`}
                  onClick={() => setSourceType('folder')}
                >
                  📁 Folder
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="label-with-action">
              <label>{sourceType === 'folder' ? 'Folder Name *' : 'Account Name *'}</label>
              {onShowProviderInfo && sourceType === 'email' && (
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
              placeholder={sourceType === 'folder' ? 'e.g., Downloads, Vinted Labels' : 'e.g., Gmail Main, Outlook Business'}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          {/* Folder-specific fields */}
          {sourceType === 'folder' && (
            <div className="form-group">
              <label>Folder Path *</label>
              <div className="folder-path-input">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Choose a folder to watch..."
                  value={formData.folderPath}
                  readOnly
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleChooseFolder}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Choose Folder
                </button>
              </div>
              <p className="field-help-text">
                Select a folder to watch for shipping label files (PDFs, images). Subfolders will be scanned recursively.
              </p>
            </div>
          )}

          {/* Email-specific fields */}
          {sourceType === 'email' && (
            <>
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
            </>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
              />
              Active (scan this {sourceType === 'folder' ? 'folder' : 'account'})
            </label>
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
            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : (sourceType === 'folder' ? 'Add Folder' : 'Add Account')}
          </button>
        </div>
      </div>
    </div>
  );
}

