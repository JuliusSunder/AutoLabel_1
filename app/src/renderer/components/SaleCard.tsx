/**
 * Sale Card Component
 * Displays a single sale with checkbox for selection
 */

import React from 'react';
import type { Sale } from '../../shared/types';
import { CarrierBadge, PlatformBadge } from '../../components/ui/carrier-badge';
import './SaleCard.css';

interface SaleCardProps {
  sale: Sale;
  selected: boolean;
  onToggleSelect: () => void;
  disabled?: boolean;
}

export function SaleCard({ sale, selected, onToggleSelect, disabled }: SaleCardProps) {
  return (
    <div className={`sale-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        className="sale-checkbox"
        checked={selected}
        onChange={onToggleSelect}
        disabled={disabled}
        title={disabled ? 'No shipping label attached to this sale' : ''}
      />

      <div className="sale-content">
        <div className="sale-header">
          <h4 className="sale-title">
            {sale.itemTitle || 'Untitled Sale'}
          </h4>
          <div className="sale-badges">
            {sale.shippingCompany && (
              <CarrierBadge carrier={sale.shippingCompany} />
            )}
            {sale.platform && (
              <PlatformBadge platform={sale.platform} />
            )}
          </div>
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

        <div className="sale-status">
          {sale.hasAttachments ? (
            <span className="sale-status-badge has-label">
              ✓ Shipping Label Attached
            </span>
          ) : (
            <span className="sale-status-badge no-label">
              ✗ No Shipping Label
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
