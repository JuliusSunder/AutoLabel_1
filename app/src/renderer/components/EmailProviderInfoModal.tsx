/**
 * Email Provider Info Modal Component
 * Displays email provider compatibility information and setup instructions
 */

import React, { useState, useEffect } from 'react';
import {
  EMAIL_PROVIDERS,
  getProvidersByCategory,
  getCategoryInfo,
  type EmailProviderInfo,
} from '../data/email-providers';
import './EmailProviderInfoModal.css';

export type EmailProviderTab = 'intro' | 'overview' | 'instructions';

interface EmailProviderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider?: (provider: EmailProviderInfo) => void;
  initialTab?: EmailProviderTab; // Optional: specify which tab to open
}

export function EmailProviderInfoModal({
  isOpen,
  onClose,
  onSelectProvider,
  initialTab = 'intro',
}: EmailProviderInfoModalProps) {
  const [activeTab, setActiveTab] = useState<EmailProviderTab>(initialTab);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update active tab when initialTab changes and modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) {
    return null;
  }

  const handleSelectProvider = (provider: EmailProviderInfo) => {
    if (provider.imap && onSelectProvider) {
      onSelectProvider(provider);
      onClose();
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleProvider = (providerId: string) => {
    setExpandedProvider(expandedProvider === providerId ? null : providerId);
  };

  // Filter providers based on search query
  const filteredProviders = EMAIL_PROVIDERS.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const compatibleProviders = filteredProviders.filter((p) => p.category === 'compatible');
  const paidProviders = filteredProviders.filter((p) => p.category === 'paid');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content provider-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📧 Email Provider Compatibility</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="provider-tabs">
          <button
            className={`provider-tab ${activeTab === 'intro' ? 'active' : ''}`}
            onClick={() => setActiveTab('intro')}
          >
            What is IMAP?
          </button>
          <button
            className={`provider-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Provider Overview
          </button>
          <button
            className={`provider-tab ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
        </div>

        <div className="modal-body provider-modal-body">
          {/* INTRO TAB */}
          {activeTab === 'intro' && (
            <div className="provider-intro">
              <h3>How does AutoLabel work?</h3>
              <p>
                AutoLabel needs access to your emails to automatically detect and process shipping labels from
                online marketplaces (eBay, Amazon, etc.).
              </p>

              <div className="info-section">
                <h4>📥 Option 1: IMAP Access (Recommended)</h4>
                <p>
                  <strong>What is IMAP?</strong> IMAP (Internet Message Access Protocol) is a
                  standard protocol that allows programs like AutoLabel to retrieve your emails from the server
                  - similar to Outlook or Thunderbird.
                </p>
                <ul>
                  <li>✅ Direct connection to your mailbox</li>
                  <li>✅ Fast and reliable</li>
                  <li>✅ Your emails stay on the server</li>
                  <li>✅ Free with most providers</li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🔄 Option 2: Email Forwarding</h4>
                <p>
                  If your provider doesn't support IMAP, you can automatically forward incoming emails
                  to an IMAP-capable account.
                </p>
                <ul>
                  <li>✅ Works with almost all providers</li>
                  <li>⚠️ Requires a second email account (e.g., Gmail)</li>
                  <li>⚠️ Slight delay due to forwarding</li>
                </ul>
              </div>

              <div className="info-section security-note">
                <h4>🔒 Is this secure?</h4>
                <p>
                  Yes! AutoLabel stores your credentials encrypted on your computer.
                  With many providers (Gmail, Outlook), you use a special "app password"
                  instead of your main password - keeping your account protected.
                </p>
              </div>

              <div className="info-section">
                <h4>👉 Next Step</h4>
                <p>
                  Switch to the <strong>"Provider Overview"</strong> tab to see if your
                  email provider is compatible, or to <strong>"Instructions"</strong> for
                  step-by-step guides.
                </p>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="provider-overview">
              <div className="search-box">
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Compatible Providers */}
              <div className="provider-category">
                <h3>
                  {getCategoryInfo('compatible').icon} {getCategoryInfo('compatible').label}
                </h3>
                <p className="category-description">{getCategoryInfo('compatible').description}</p>

                <div className="provider-list">
                  {compatibleProviders.map((provider) => (
                    <div key={provider.id} className="provider-card">
                      <div className="provider-card-header">
                        <div className="provider-name">
                          <strong>{provider.name}</strong>
                          {provider.requiresAppPassword && (
                            <span className="badge badge-warning" title="App password required">
                              🔑 App Password
                            </span>
                          )}
                        </div>
                        {provider.imap && onSelectProvider && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSelectProvider(provider)}
                            title="Use IMAP settings"
                          >
                            Use
                          </button>
                        )}
                      </div>
                      <div className="provider-card-body">
                        {provider.imap && (
                          <div className="provider-config">
                            <div className="config-item">
                              <span className="config-label">Server:</span>
                              <span className="config-value">
                                {provider.imap.host}
                                <button
                                  className="btn-icon"
                                  onClick={() => handleCopyToClipboard(provider.imap!.host)}
                                  title="Copy"
                                >
                                  📋
                                </button>
                              </span>
                            </div>
                            <div className="config-item">
                              <span className="config-label">Port:</span>
                              <span className="config-value">{provider.imap.port}</span>
                            </div>
                            <div className="config-item">
                              <span className="config-label">TLS:</span>
                              <span className="config-value">
                                {provider.imap.tls ? '✅ Enabled' : '❌ Disabled'}
                              </span>
                            </div>
                          </div>
                        )}
                        {provider.notes && <p className="provider-notes">{provider.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paid Providers */}
              {paidProviders.length > 0 && (
                <div className="provider-category">
                  <h3>
                    {getCategoryInfo('paid').icon}{' '}
                    {getCategoryInfo('paid').label}
                  </h3>
                  <p className="category-description">
                    {getCategoryInfo('paid').description}
                  </p>

                  <div className="provider-list">
                    {paidProviders.map((provider) => (
                      <div key={provider.id} className="provider-card provider-card-paid">
                        <div className="provider-card-header">
                          <div className="provider-name">
                            <strong>{provider.name}</strong>
                            <span className="badge badge-paid">💰 Kostenpflichtig</span>
                          </div>
                          {provider.imap && onSelectProvider && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleSelectProvider(provider)}
                              title="IMAP-Einstellungen übernehmen"
                            >
                              Verwenden
                            </button>
                          )}
                        </div>
                        <div className="provider-card-body">
                          {provider.imap && (
                            <div className="provider-config">
                              <div className="config-item">
                                <span className="config-label">Server:</span>
                                <span className="config-value">
                                  {provider.imap.host}
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleCopyToClipboard(provider.imap!.host)}
                                    title="Kopieren"
                                  >
                                    📋
                                  </button>
                                </span>
                              </div>
                              <div className="config-item">
                                <span className="config-label">Port:</span>
                                <span className="config-value">{provider.imap.port}</span>
                              </div>
                              <div className="config-item">
                                <span className="config-label">TLS:</span>
                                <span className="config-value">
                                  {provider.imap.tls ? '✅ Enabled' : '❌ Disabled'}
                                </span>
                              </div>
                            </div>
                          )}
                          {provider.notes && <p className="provider-notes">{provider.notes}</p>}
                          {provider.forwardingAvailable && (
                            <div className="provider-alternative">
                              <strong>💡 Free Alternative:</strong> Set up email forwarding
                              to a compatible provider (e.g., Gmail, Web.de).
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredProviders.length === 0 && (
                <div className="no-results">
                  <p>No providers found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* INSTRUCTIONS TAB */}
          {activeTab === 'instructions' && (
            <div className="provider-instructions">
              <div className="search-box">
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <p className="instructions-hint">
                Click on a provider to see detailed setup instructions.
              </p>

              <div className="provider-accordion">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="accordion-item">
                    <button
                      className="accordion-header"
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <span className="accordion-title">
                        {getCategoryInfo(provider.category).icon} {provider.name}
                      </span>
                      <span className="accordion-icon">
                        {expandedProvider === provider.id ? '▼' : '▶'}
                      </span>
                    </button>

                    {expandedProvider === provider.id && (
                      <div className="accordion-body">
                        {/* IMAP Setup Instructions */}
                        {provider.instructions.imapSetup && (
                          <div className="instruction-section">
                            <h4>📥 Set up IMAP</h4>
                            <ol className="instruction-steps">
                              {provider.instructions.imapSetup.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                            {provider.imap && (
                              <div className="quick-config">
                                <strong>Quick Configuration:</strong>
                                <div className="quick-config-values">
                                  <code>Server: {provider.imap.host}</code>
                                  <code>Port: {provider.imap.port}</code>
                                  <code>TLS: {provider.imap.tls ? 'Ja' : 'Nein'}</code>
                                </div>
                                {onSelectProvider && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleSelectProvider(provider)}
                                  >
                                    Use in AutoLabel now
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* App Password Instructions */}
                        {provider.instructions.appPassword && (
                          <div className="instruction-section">
                            <h4>🔑 Create App Password</h4>
                            <ol className="instruction-steps">
                              {provider.instructions.appPassword.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Forwarding Instructions */}
                        {provider.instructions.forwarding && (
                          <div className="instruction-section">
                            <h4>🔄 Set up Email Forwarding</h4>
                            {provider.forwardingPaid && (
                              <div className="warning-box">
                                ⚠️ Email forwarding is a paid feature with {provider.name}.
                              </div>
                            )}
                            <ol className="instruction-steps">
                              {provider.instructions.forwarding.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Official Help Link */}
                        {provider.officialHelpUrl && (
                          <div className="instruction-section">
                            <a
                              href={provider.officialHelpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="help-link"
                            >
                              📖 Official Help from {provider.name} →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredProviders.length === 0 && (
                <div className="no-results">
                  <p>No providers found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

