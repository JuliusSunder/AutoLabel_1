/**
 * History Screen
 * Shows sales grouped by date with selection for batch operations
 * Includes account sidebar for multi-account filtering
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import { toast } from '../hooks/useToast';
import { SaleCard } from '../components/SaleCard';
import { AccountSidebar } from '../components/AccountSidebar';
import { AccountModal } from '../components/AccountModal';
import { EmailProviderInfoModal } from '../components/EmailProviderInfoModal';
import { EmptyState } from '../components/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { ChevronDown, Search, X, Loader2, Inbox, Mail } from 'lucide-react';
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
  shippingCompanies: string[];
  platforms: string[];
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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scannedCount: number; newSales: number; errors?: string[] } | null>(null);
  
  // Quick Start state
  const [isQuickStarting, setIsQuickStarting] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    timeFilter: 'all',
    shippingCompanies: [],
    platforms: [],
  });
  
  // Dropdown open states for chevron rotation
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [carrierDropdownOpen, setCarrierDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
  
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
  }, [selectedAccountId, filters, debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      
      // Filter by search query
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(s => 
          (s.itemTitle && s.itemTitle.toLowerCase().includes(query)) ||
          (s.productNumber && s.productNumber.toLowerCase().includes(query)) ||
          (s.trackingNumber && s.trackingNumber.toLowerCase().includes(query)) ||
          (s.buyerName && s.buyerName.toLowerCase().includes(query))
        );
      }
      
      // Filter by shipping companies (only if some are selected)
      if (filters.shippingCompanies.length > 0) {
        filtered = filtered.filter(s => 
          s.shippingCompany && filters.shippingCompanies.includes(s.shippingCompany)
        );
      }
      
      // Filter by platforms (only if some are selected)
      if (filters.platforms.length > 0) {
        filtered = filtered.filter(s => 
          s.platform && filters.platforms.includes(s.platform)
        );
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

  const handleQuickStart = async () => {
    if (selectedIds.size === 0) return;

    setIsQuickStarting(true);
    setError(null);

    try {
      // Get default footer config from localStorage
      const savedFooterConfig = localStorage.getItem('defaultFooterConfig');
      const defaultConfig = savedFooterConfig 
        ? JSON.parse(savedFooterConfig) 
        : {
            includeProductNumber: true,
            includeItemTitle: false,
            includeDate: true,
          };

      // Prepare labels with default config
      const result = await api.labels.prepare({
        saleIds: Array.from(selectedIds),
        footerConfig: defaultConfig,
      });

      // Get default printer
      const savedDefaultPrinter = localStorage.getItem('defaultPrinter');
      const printerList = await api.print.listPrinters();
      const printerToUse = savedDefaultPrinter && printerList.find((p) => p.name === savedDefaultPrinter)
        ? savedDefaultPrinter
        : printerList.find((p) => p.isDefault)?.name || printerList[0]?.name;

      if (!printerToUse) {
        throw new Error('No printer available');
      }

      // Start printing immediately
      const labelIds = result.map((l: any) => l.id);
      await api.print.start({ labelIds, printerName: printerToUse });
      
      toast.success('Quick Start successful!', {
        description: `${labelIds.length} label(s) sent to ${printerToUse}`
      });

      // Reload sales to update status
      await loadSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quick Start failed');
      toast.error('Quick Start failed', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      console.error('Quick Start failed:', err);
    } finally {
      setIsQuickStarting(false);
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
    setFilters({ 
      timeFilter: 'all',
      shippingCompanies: [],
      platforms: [],
    });
  };

  const hasActiveFilters = () => {
    return filters.timeFilter !== 'all' || 
           filters.shippingCompanies.length > 0 || 
           filters.platforms.length > 0 || 
           filters.hasAttachments !== undefined ||
           searchQuery.trim() !== '';
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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
      toast.error('Failed to delete account', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const handleToggleAccount = async (accountId: string) => {
    try {
      await api.accounts.toggle(accountId);
      await loadAccounts();
    } catch (err) {
      console.error('Failed to toggle account:', err);
      toast.error('Failed to toggle account', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
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
            className="btn btn-secondary scan-button"
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning && <Loader2 className="animate-spin" size={16} style={{ marginRight: '0.5rem' }} />}
            {isScanning ? 'Scanning...' : 'Scan'}
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

        {/* Search Bar */}
        <div className="history-search">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, product number, tracking, buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search sales"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="search-results-count">
              {sales.length} result{sales.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="history-filters">
          <div className="filter-group">
            <DropdownMenu onOpenChange={(open) => setTimeDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="filter-select" style={{ justifyContent: 'space-between' }}>
                  {filters.timeFilter === 'all' ? 'Alle Zeiten' :
                   filters.timeFilter === 'today' ? 'Heute' :
                   filters.timeFilter === 'thisWeek' ? 'Diese Woche' :
                   filters.timeFilter === 'last7Days' ? 'Letzte 7 Tage' :
                   filters.timeFilter === 'thisMonth' ? 'Dieser Monat' :
                   filters.timeFilter === 'lastMonth' ? 'Letzter Monat' :
                   filters.timeFilter === 'last30Days' ? 'Letzte 30 Tage' : 'Alle Zeiten'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${timeDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="px-2 py-1 space-y-2">
                  {[
                    { value: 'all', label: 'Alle Zeiten' },
                    { value: 'today', label: 'Heute' },
                    { value: 'thisWeek', label: 'Diese Woche' },
                    { value: 'last7Days', label: 'Letzte 7 Tage' },
                    { value: 'thisMonth', label: 'Dieser Monat' },
                    { value: 'lastMonth', label: 'Letzter Monat' },
                    { value: 'last30Days', label: 'Letzte 30 Tage' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`dropdown-time-${option.value}`}
                        checked={filters.timeFilter === option.value}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({
                              ...filters,
                              timeFilter: option.value as TimeFilter
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`dropdown-time-${option.value}`} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="filter-group">
            <DropdownMenu onOpenChange={(open) => setCarrierDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="filter-select" style={{ justifyContent: 'space-between' }}>
                  {filters.shippingCompanies.length > 0 
                    ? `${filters.shippingCompanies.length} ausgewählt` 
                    : 'Versanddienstleister'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${carrierDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="px-2 py-1 space-y-2">
                  {['GLS', 'Hermes', 'DHL', 'DPD', 'UPS'].map((carrier) => (
                    <div key={carrier} className="flex items-center gap-2">
                      <Checkbox
                        id={`dropdown-carrier-${carrier}`}
                        checked={filters.shippingCompanies.includes(carrier)}
                        onCheckedChange={(checked) => {
                          setFilters({
                            ...filters,
                            shippingCompanies: checked
                              ? [...filters.shippingCompanies, carrier]
                              : filters.shippingCompanies.filter(c => c !== carrier)
                          });
                        }}
                      />
                      <Label 
                        htmlFor={`dropdown-carrier-${carrier}`} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {carrier}
                      </Label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="filter-group">
            <DropdownMenu onOpenChange={(open) => setPlatformDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="filter-select" style={{ justifyContent: 'space-between' }}>
                  {filters.platforms.length > 0 
                    ? filters.platforms.join(', ').replace('Vinted/Kleiderkreisel', 'Vinted')
                    : 'Plattformen'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${platformDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="px-2 py-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dropdown-platform-vinted"
                      checked={filters.platforms.includes('Vinted/Kleiderkreisel')}
                      onCheckedChange={(checked) => {
                        setFilters({
                          ...filters,
                          platforms: checked
                            ? [...filters.platforms, 'Vinted/Kleiderkreisel']
                            : filters.platforms.filter(p => p !== 'Vinted/Kleiderkreisel')
                        });
                      }}
                    />
                    <Label 
                      htmlFor="dropdown-platform-vinted" 
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      Vinted
                    </Label>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="filter-group">
            <DropdownMenu onOpenChange={(open) => setLabelDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="filter-select" style={{ justifyContent: 'space-between' }}>
                  {filters.hasAttachments === true 
                    ? 'Mit Label' 
                    : filters.hasAttachments === false 
                    ? 'Ohne Label' 
                    : 'Label Status'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${labelDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="px-2 py-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dropdown-with-label"
                      checked={filters.hasAttachments === true}
                      onCheckedChange={(checked) => {
                        setFilters({
                          ...filters,
                          hasAttachments: checked ? true : undefined
                        });
                      }}
                    />
                    <Label 
                      htmlFor="dropdown-with-label" 
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      Mit Label
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dropdown-without-label"
                      checked={filters.hasAttachments === false}
                      onCheckedChange={(checked) => {
                        setFilters({
                          ...filters,
                          hasAttachments: checked ? false : undefined
                        });
                      }}
                    />
                    <Label 
                      htmlFor="dropdown-without-label" 
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      Ohne Label
                    </Label>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {!loading && !error && accounts.length === 0 && (
          <EmptyState
            icon={<Mail size={64} />}
            title="No email accounts configured"
            description="Add an email account to start scanning for shipping labels"
            action={
              <button className="btn btn-primary" onClick={handleAddAccount}>
                Add Account
              </button>
            }
          />
        )}

        {!loading && !error && accounts.length > 0 && sales.length === 0 && (
          <EmptyState
            icon={<Inbox size={64} />}
            title="No sales found"
            description={
              selectedAccountId
                ? 'No sales for this account. Try selecting a different account or scan for new emails.'
                : 'Start scanning your emails to find shipping labels'
            }
            action={
              accounts.length > 0 && (
                <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
                  {isScanning ? 'Scanning...' : 'Start Scan'}
                </button>
              )
            }
          />
        )}

        {!loading && !error && sales.length > 0 && (
          <>
            {selectedIds.size > 0 && (
              <div className="card history-actions">
                <p>
                  <strong>{selectedIds.size}</strong> sale(s) selected
                </p>
                <div className="history-action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleQuickStart}
                    disabled={isQuickStarting}
                    title="Prepare and print immediately with default settings"
                  >
                    {isQuickStarting ? 'Quick Starting...' : '⚡ Quick Start'}
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handlePrepareLabels}
                    disabled={isQuickStarting}
                  >
                    Prepare Labels →
                  </button>
                </div>
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
