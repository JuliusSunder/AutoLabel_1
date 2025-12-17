/**
 * History Screen
 * Shows sales grouped by date with selection for batch operations
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import { SaleCard } from '../components/SaleCard';
import type { Sale } from '../../shared/types';
import './HistoryScreen.css';

interface HistoryScreenProps {
  onSelectSales: (saleIds: string[]) => void;
}

export function HistoryScreen({ onSelectSales }: HistoryScreenProps) {
  const api = useAutolabel();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.sales.list({});
      setSales(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
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

  if (loading) {
    return (
      <div className="screen history-screen">
        <h2 className="screen-title">Sales History</h2>
        <div className="card">
          <p>Loading sales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen history-screen">
        <h2 className="screen-title">Sales History</h2>
        <div className="card history-error">
          <p>
            <strong>Error:</strong> {error}
          </p>
          <button className="btn btn-primary" onClick={loadSales}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="screen history-screen">
        <h2 className="screen-title">Sales History</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p className="empty-state-text">No sales found</p>
          <p className="empty-state-hint">
            Scan your emails to extract sales and shipping labels
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen history-screen">
      <h2 className="screen-title">Sales History</h2>

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
        {sortedDates.map((date) => (
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
                  onToggleSelect={() => toggleSelection(sale.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
