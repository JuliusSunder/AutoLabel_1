/**
 * Email Provider Info Modal Component
 * Displays email provider compatibility information and setup instructions
 */

import React, { useState } from 'react';
import {
  EMAIL_PROVIDERS,
  getProvidersByCategory,
  getCategoryInfo,
  type EmailProviderInfo,
} from '../data/email-providers';
import './EmailProviderInfoModal.css';

interface EmailProviderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider?: (provider: EmailProviderInfo) => void;
}

type Tab = 'intro' | 'overview' | 'instructions';

export function EmailProviderInfoModal({
  isOpen,
  onClose,
  onSelectProvider,
}: EmailProviderInfoModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('intro');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          <h2>📧 Email-Anbieter Kompatibilität</h2>
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
            Was ist IMAP?
          </button>
          <button
            className={`provider-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Anbieter-Übersicht
          </button>
          <button
            className={`provider-tab ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            Anleitungen
          </button>
        </div>

        <div className="modal-body provider-modal-body">
          {/* INTRO TAB */}
          {activeTab === 'intro' && (
            <div className="provider-intro">
              <h3>Wie funktioniert AutoLabel?</h3>
              <p>
                AutoLabel benötigt Zugriff auf Ihre E-Mails, um automatisch Versandlabels von
                Online-Marktplätzen (eBay, Amazon, etc.) zu erkennen und zu verarbeiten.
              </p>

              <div className="info-section">
                <h4>📥 Option 1: IMAP-Zugriff (Empfohlen)</h4>
                <p>
                  <strong>Was ist IMAP?</strong> IMAP (Internet Message Access Protocol) ist ein
                  Standard-Protokoll, mit dem Programme wie AutoLabel Ihre E-Mails vom Server
                  abrufen können - ähnlich wie Outlook oder Thunderbird.
                </p>
                <ul>
                  <li>✅ Direkte Verbindung zu Ihrem Postfach</li>
                  <li>✅ Schnell und zuverlässig</li>
                  <li>✅ Ihre E-Mails bleiben auf dem Server</li>
                  <li>✅ Bei den meisten Anbietern kostenlos</li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🔄 Option 2: E-Mail-Weiterleitung</h4>
                <p>
                  Falls Ihr Anbieter kein IMAP unterstützt, können Sie eingehende E-Mails
                  automatisch an einen IMAP-fähigen Account weiterleiten lassen.
                </p>
                <ul>
                  <li>✅ Funktioniert mit fast allen Anbietern</li>
                  <li>⚠️ Benötigt einen zweiten E-Mail-Account (z.B. Gmail)</li>
                  <li>⚠️ Leichte Verzögerung durch Weiterleitung</li>
                </ul>
              </div>

              <div className="info-section security-note">
                <h4>🔒 Ist das sicher?</h4>
                <p>
                  Ja! AutoLabel speichert Ihre Zugangsdaten verschlüsselt auf Ihrem Computer.
                  Bei vielen Anbietern (Gmail, Outlook) verwenden Sie ein spezielles "App-Passwort"
                  statt Ihres Haupt-Passworts - so bleibt Ihr Account geschützt.
                </p>
              </div>

              <div className="info-section">
                <h4>👉 Nächster Schritt</h4>
                <p>
                  Wechseln Sie zum Tab <strong>"Anbieter-Übersicht"</strong>, um zu sehen, ob Ihr
                  E-Mail-Anbieter kompatibel ist, oder zu <strong>"Anleitungen"</strong> für
                  Schritt-für-Schritt-Anleitungen.
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
                  placeholder="🔍 Anbieter suchen..."
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
                            <span className="badge badge-warning" title="App-Passwort erforderlich">
                              🔑 App-Passwort
                            </span>
                          )}
                        </div>
                        {provider.imap && onSelectProvider && (
                          <button
                            className="btn btn-sm btn-primary"
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
                                {provider.imap.tls ? '✅ Aktiviert' : '❌ Deaktiviert'}
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
                                  {provider.imap.tls ? '✅ Aktiviert' : '❌ Deaktiviert'}
                                </span>
                              </div>
                            </div>
                          )}
                          {provider.notes && <p className="provider-notes">{provider.notes}</p>}
                          {provider.forwardingAvailable && (
                            <div className="provider-alternative">
                              <strong>💡 Kostenlose Alternative:</strong> Richten Sie eine E-Mail-Weiterleitung
                              zu einem kompatiblen Anbieter (z.B. Gmail, Web.de) ein.
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
                  <p>Keine Anbieter gefunden für "{searchQuery}"</p>
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
                  placeholder="🔍 Anbieter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <p className="instructions-hint">
                Klicken Sie auf einen Anbieter, um detaillierte Einrichtungsanleitungen zu sehen.
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
                            <h4>📥 IMAP einrichten</h4>
                            <ol className="instruction-steps">
                              {provider.instructions.imapSetup.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                            {provider.imap && (
                              <div className="quick-config">
                                <strong>Schnell-Konfiguration:</strong>
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
                                    Jetzt in AutoLabel verwenden
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* App Password Instructions */}
                        {provider.instructions.appPassword && (
                          <div className="instruction-section">
                            <h4>🔑 App-Passwort erstellen</h4>
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
                            <h4>🔄 E-Mail-Weiterleitung einrichten</h4>
                            {provider.forwardingPaid && (
                              <div className="warning-box">
                                ⚠️ Bei {provider.name} ist die E-Mail-Weiterleitung kostenpflichtig.
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
                              📖 Offizielle Hilfe von {provider.name} →
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
                  <p>Keine Anbieter gefunden für "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

