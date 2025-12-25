/**
 * Account Sidebar Component
 * Shows list of email accounts with status and actions
 */

import React from 'react';
import type { EmailAccount } from '../../shared/types';
import './AccountSidebar.css';

interface AccountSidebarProps {
  accounts: EmailAccount[];
  selectedAccountId: string | null; // null = "All Accounts"
  salesCounts: Record<string, number>;
  onSelectAccount: (accountId: string | null) => void;
  onAddAccount: () => void;
  onEditAccount: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onToggleAccount: (accountId: string) => void;
  onShowProviderInfo: () => void;
}

export function AccountSidebar({
  accounts,
  selectedAccountId,
  salesCounts,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onToggleAccount,
  onShowProviderInfo,
}: AccountSidebarProps) {
  const totalSales = Object.values(salesCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="account-sidebar">
      <div className="account-sidebar-header">
        <h3>Email Accounts</h3>
        <div className="account-sidebar-actions">
          <button 
            className="btn btn-sm btn-secondary btn-info-icon" 
            onClick={onShowProviderInfo}
            title="Email-Anbieter Kompatibilität"
          >
            ℹ️
          </button>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={onAddAccount}
            title="Add new email account"
          >
            + Add
          </button>
        </div>
      </div>

      {/* All Accounts Filter */}
      <div
        className={`account-item ${selectedAccountId === null ? 'active' : ''}`}
        onClick={() => onSelectAccount(null)}
      >
        <div className="account-info">
          <div className="account-name">📧 All Accounts</div>
          <div className="account-email">Show all sales</div>
        </div>
        {totalSales > 0 && (
          <div className="account-badge">{totalSales}</div>
        )}
      </div>

      {/* Account List */}
      <div className="account-list">
        {accounts.length === 0 ? (
          <div className="account-empty">
            <p>No accounts configured</p>
            <p className="account-empty-hint">Add an email account to get started</p>
          </div>
        ) : (
          accounts.map((account) => {
            const salesCount = salesCounts[account.id] || 0;
            
            return (
              <div
                key={account.id}
                className={`account-item ${selectedAccountId === account.id ? 'active' : ''} ${!account.isActive ? 'inactive' : ''}`}
              >
                <div 
                  className="account-info"
                  onClick={() => onSelectAccount(account.id)}
                >
                  <div className="account-name">
                    {account.isActive ? '✅' : '⏸️'} {account.name}
                  </div>
                  <div className="account-email">{account.username}</div>
                </div>
                
                {salesCount > 0 && (
                  <div className="account-badge">{salesCount}</div>
                )}

                <div className="account-actions">
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAccount(account.id);
                    }}
                    title={account.isActive ? 'Deactivate account' : 'Activate account'}
                  >
                    {account.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount(account.id);
                    }}
                    title="Edit account"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete account "${account.name}"?\n\nSales from this account will not be deleted, but will no longer be linked to an account.`)) {
                        onDeleteAccount(account.id);
                      }
                    }}
                    title="Delete account"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

