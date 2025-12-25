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

type TimeFilter = 
  | 'all' 
  | 'today' 
  | 'thisWeek' 
  | 'last7Days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'last30Days';

interface FilterState {
  timeFilter: TimeFilter;
  shippingCompany?: string;
  platform?: string;
  hasAttachments?: boolean;
}

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
  
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scannedCount: number; newSales: number; errors?: string[] } | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    timeFilter: 'all',
  });
  
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
    // Reload sales when account filter or date filters change
    loadSales();
  }, [selectedAccountId, filters]);

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

  // Calculate date range based on time filter
  const getDateRange = (filter: TimeFilter): { fromDate?: string; toDate?: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (filter) {
      case 'today': {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        return {
          fromDate: start.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0],
        };
      }
      case 'thisWeek': {
        const start = new Date(today);
        const dayOfWeek = start.getDay();
        const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return {
          fromDate: start.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0],
        };
      }
      case 'last7Days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return {
          fromDate: start.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0],
        };
      }
      case 'thisMonth': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          fromDate: start.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0],
        };
      }
      case 'lastMonth': {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          fromDate: lastMonth.toISOString().split('T')[0],
          toDate: lastDay.toISOString().split('T')[0],
        };
      }
      case 'last30Days': {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return {
          fromDate: start.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0],
        };
      }
      default:
        return {};
    }
  };

  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateRange = getDateRange(filters.timeFilter);
      
      const result = await api.sales.list({
        accountId: selectedAccountId || undefined,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      });
      
      // Client-side filtering for shipping company, platform, attachments
      let filtered = result;
      
      if (filters.shippingCompany) {
        filtered = filtered.filter(s => s.shippingCompany === filters.shippingCompany);
      }
      
      if (filters.platform) {
        filtered = filtered.filter(s => s.platform === filters.platform);
      }
      
      if (filters.hasAttachments !== undefined) {
        filtered = filtered.filter(s => s.hasAttachments === filters.hasAttachments);
      }
      
      setSales(filtered);
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

  const handleSelectAll = () => {
    const selectableSales = sales.filter(s => s.hasAttachments);
    const allSelected = selectableSales.length > 0 && selectableSales.every(s => selectedIds.has(s.id));
    
    if (allSelected) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all selectable
      setSelectedIds(new Set(selectableSales.map(s => s.id)));
    }
  };

  const resetFilters = () => {
    setFilters({ timeFilter: 'all' });
  };

  const hasActiveFilters = () => {
    return filters.timeFilter !== 'all' || 
           filters.shippingCompany !== undefined || 
           filters.platform !== undefined || 
           filters.hasAttachments !== undefined;
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await api.scan.refreshVinted();
      setScanResult(result);
      console.log('Scan completed:', result);
      
      // Reload accounts and sales
      await loadAccounts();
      await loadSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
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
        <div className="history-header">
          <h2 className="screen-title">Sales History</h2>
          <button
            className="btn btn-primary scan-button"
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? '🔄 Scanning...' : '📧 Scan'}
          </button>
        </div>

        {scanResult && (
          <div className="scan-result-banner">
            ✅ Scan complete! <strong>{scanResult.scannedCount}</strong> emails checked, <strong>{scanResult.newSales}</strong> sales imported.
            {scanResult.errors && scanResult.errors.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                ⚠️ Errors: {scanResult.errors.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <div className="history-filters">
          <div className="filter-group">
            <label>📅</label>
            <select 
              value={filters.timeFilter} 
              onChange={(e) => setFilters({...filters, timeFilter: e.target.value as TimeFilter})}
              className="filter-select"
            >
              <option value="all">Alle Zeiten</option>
              <option value="today">Heute</option>
              <option value="thisWeek">Diese Woche</option>
              <option value="last7Days">Letzte 7 Tage</option>
              <option value="thisMonth">Dieser Monat</option>
              <option value="lastMonth">Letzter Monat</option>
              <option value="last30Days">Letzte 30 Tage</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>📦</label>
            <select 
              value={filters.shippingCompany || 'all'} 
              onChange={(e) => setFilters({
                ...filters, 
                shippingCompany: e.target.value === 'all' ? undefined : e.target.value
              })}
              className="filter-select"
            >
              <option value="all">Alle Versandarten</option>
              <option value="GLS">GLS</option>
              <option value="Hermes">Hermes</option>
              <option value="DHL">DHL</option>
              <option value="DPD">DPD</option>
              <option value="UPS">UPS</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>🏪</label>
            <select 
              value={filters.platform || 'all'} 
              onChange={(e) => setFilters({
                ...filters, 
                platform: e.target.value === 'all' ? undefined : e.target.value
              })}
              className="filter-select"
            >
              <option value="all">Alle Plattformen</option>
              <option value="Vinted/Kleiderkreisel">Vinted</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>📎</label>
            <select 
              value={filters.hasAttachments === undefined ? 'all' : filters.hasAttachments ? 'with' : 'without'} 
              onChange={(e) => setFilters({
                ...filters, 
                hasAttachments: e.target.value === 'all' ? undefined : e.target.value === 'with'
              })}
              className="filter-select"
            >
              <option value="all">Alle Status</option>
              <option value="with">Mit Label</option>
              <option value="without">Ohne Label</option>
            </select>
          </div>
          
          <div className="filter-actions">
            {sales.length > 0 && sales.some(s => s.hasAttachments) && (
              <label className="select-all-label">
                <input 
                  type="checkbox"
                  checked={sales.filter(s => s.hasAttachments).length > 0 && 
                          sales.filter(s => s.hasAttachments).every(s => selectedIds.has(s.id))}
                  onChange={handleSelectAll}
                />
                <span>Alle auswählen</span>
              </label>
            )}
            
            {hasActiveFilters() && (
              <button className="btn-reset-filters" onClick={resetFilters} title="Filter zurücksetzen">
                ✕
              </button>
            )}
          </div>
        </div>

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
