/**
 * Sale Card Component
 * Displays a single sale with checkbox for selection
 */

import React from 'react';
import type { Sale } from '../../shared/types';
import './SaleCard.css';

interface SaleCardProps {
  sale: Sale;
  selected: boolean;
  onToggleSelect: () => void;
}

export function SaleCard({ sale, selected, onToggleSelect }: SaleCardProps) {
  return (
    <div className={`sale-card ${selected ? 'selected' : ''}`}>
      <input
        type="checkbox"
        className="sale-checkbox"
        checked={selected}
        onChange={onToggleSelect}
      />

      <div className="sale-content">
        <div className="sale-header">
          <h4 className="sale-title">
            {sale.itemTitle || 'Untitled Sale'}
          </h4>
          {sale.platform && (
            <span className="sale-platform">{sale.platform}</span>
          )}
        </div>

        <div className="sale-details">
          {sale.productNumber && (
            <div className="sale-detail">
              <span className="sale-detail-label">Product #:</span>
              <span className="sale-detail-value">{sale.productNumber}</span>
            </div>
          )}

          {sale.buyerRef && (
            <div className="sale-detail">
              <span className="sale-detail-label">Buyer Ref:</span>
              <span className="sale-detail-value">{sale.buyerRef}</span>
            </div>
          )}

          <div className="sale-detail">
            <span className="sale-detail-label">Email ID:</span>
            <span className="sale-detail-value sale-email-id">
              {sale.emailId.substring(0, 20)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
