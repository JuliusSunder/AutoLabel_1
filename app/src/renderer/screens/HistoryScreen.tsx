/**
 * History Screen
 * Shows sales grouped by date with selection for batch operations
 * Includes account sidebar for multi-account filtering
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import { SaleCard } from '../components/SaleCard';
import { AccountSidebar } from '../components/AccountSidebar';
import { AccountModal } from '../components/AccountModal';
import { EmailProviderInfoModal } from '../components/EmailProviderInfoModal';
import type { Sale, EmailAccount } from '../../shared/types';
import type { EmailProviderInfo } from '../data/email-providers';
import './HistoryScreen.css';

interface HistoryScreenProps {
  onSelectSales: (saleIds: string[]) => void;
}

export function HistoryScreen({ onSelectSales }: HistoryScreenProps) {
  const api = useAutolabel();
  const [sales, setSales] = useState<Sale[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [salesCounts, setSalesCounts] = useState<Record<string, number>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [showProviderInfoModal, setShowProviderInfoModal] = useState(false);
  const [prefillData, setPrefillData] = useState<{ host: string; port: number; tls: boolean } | undefined>(undefined);

  useEffect(() => {
    loadAccounts();
    loadSales();
  }, []);

  useEffect(() => {
    // Reload sales when account filter changes
    loadSales();
  }, [selectedAccountId]);

  const loadAccounts = async () => {
    try {
      const result = await api.accounts.list();
      setAccounts(result);
      
      // Calculate sales counts per account
      const allSales = await api.sales.list({});
      const counts: Record<string, number> = {};
      for (const sale of allSales) {
        if (sale.accountId) {
          counts[sale.accountId] = (counts[sale.accountId] || 0) + 1;
        }
      }
      setSalesCounts(counts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.sales.list({
        accountId: selectedAccountId || undefined,
      });
      setSales(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, hasAttachments: boolean) => {
    // Don't allow selection if sale has no attachments
    if (!hasAttachments) {
      return;
    }
    
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handlePrepareLabels = () => {
    if (selectedIds.size > 0) {
      onSelectSales(Array.from(selectedIds));
    }
  };

  // Account management handlers
  const handleAddAccount = () => {
    setEditingAccount(null);
    setPrefillData(undefined);
    setShowModal(true);
  };

  const handleShowProviderInfo = () => {
    setShowProviderInfoModal(true);
  };

  const handleSelectProvider = (provider: EmailProviderInfo) => {
    if (provider.imap) {
      // Set prefill data and open AccountModal
      setPrefillData({
        host: provider.imap.host,
        port: provider.imap.port,
        tls: provider.imap.tls,
      });
      setEditingAccount(null);
      setShowProviderInfoModal(false);
      setShowModal(true);
    }
  };

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      setEditingAccount(account);
      setShowModal(true);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await api.accounts.delete(accountId);
      await loadAccounts();
      await loadSales();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleToggleAccount = async (accountId: string) => {
    try {
      await api.accounts.toggle(accountId);
      await loadAccounts();
    } catch (err) {
      console.error('Failed to toggle account:', err);
      alert('Failed to toggle account: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleModalSuccess = async () => {
    await loadAccounts();
    await loadSales();
  };

  // Group sales by date
  const salesByDate = sales.reduce((acc, sale) => {
    const date = sale.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(sale);
    return acc;
  }, {} as Record<string, Sale[]>);

  const sortedDates = Object.keys(salesByDate).sort().reverse();

  return (
    <div className="screen history-screen-container">
      <AccountSidebar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        salesCounts={salesCounts}
        onSelectAccount={setSelectedAccountId}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
        onToggleAccount={handleToggleAccount}
        onShowProviderInfo={handleShowProviderInfo}
      />

      <div className="history-main">
        <h2 className="screen-title">Sales History</h2>

        {loading && (
          <div className="card">
            <p>Loading sales...</p>
          </div>
        )}

        {error && (
          <div className="card history-error">
            <p>
              <strong>Error:</strong> {error}
            </p>
            <button className="btn btn-primary" onClick={loadSales}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && sales.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-text">No sales found</p>
            <p className="empty-state-hint">
              {selectedAccountId
                ? 'No sales for this account. Try selecting a different account.'
                : 'Scan your emails to extract sales and shipping labels'}
            </p>
          </div>
        )}

        {!loading && !error && sales.length > 0 && (
          <>
            {selectedIds.size > 0 && (
              <div className="card history-actions">
                <p>
                  <strong>{selectedIds.size}</strong> sale(s) selected
                </p>
                <button
                  className="btn btn-success"
                  onClick={handlePrepareLabels}
                >
                  Prepare Labels →
                </button>
              </div>
            )}

            <div className="history-list">
              {(() => {
                // Group sales by date
                const salesByDate = sales.reduce((acc, sale) => {
                  const date = sale.date;
                  if (!acc[date]) {
                    acc[date] = [];
                  }
                  acc[date].push(sale);
                  return acc;
                }, {} as Record<string, Sale[]>);

                const sortedDates = Object.keys(salesByDate).sort().reverse();

                return sortedDates.map((date) => (
                  <div key={date} className="history-date-group">
                    <h3 className="history-date-header">
                      📅 {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <div className="history-sales">
                      {salesByDate[date].map((sale) => (
                        <SaleCard
                          key={sale.id}
                          sale={sale}
                          selected={selectedIds.has(sale.id)}
                          onToggleSelect={() => toggleSelection(sale.id, sale.hasAttachments || false)}
                          disabled={!sale.hasAttachments}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
      </div>

      <AccountModal
        isOpen={showModal}
        account={editingAccount}
        onClose={() => {
          setShowModal(false);
          setPrefillData(undefined);
        }}
        onSuccess={handleModalSuccess}
        prefillData={prefillData}
      />

      <EmailProviderInfoModal
        isOpen={showProviderInfoModal}
        onClose={() => setShowProviderInfoModal(false)}
        onSelectProvider={handleSelectProvider}
      />
    </div>
  );
}
