/**
 * Account Sidebar Component
 * Shows list of email accounts and watched folders with status and actions
 */

import React from 'react';
import type { EmailAccount, WatchedFolder } from '../../shared/types';
import { Button } from '../../components/ui/button';
import { Info, List, PauseCircle, PlayCircle, Edit2, Trash2, Folder, Mail } from 'lucide-react';
import './AccountSidebar.css';

interface AccountSidebarProps {
  accounts: EmailAccount[];
  folders: WatchedFolder[];
  selectedAccountId: string | null; // null = "All Accounts"
  selectedFolderId: string | null; // null = not filtering by folder
  salesCounts: Record<string, number>;
  folderSalesCounts: Record<string, number>;
  onSelectAccount: (accountId: string | null) => void;
  onSelectFolder: (folderId: string | null) => void;
  onAddAccount: () => void;
  onAddFolder: () => void;
  onEditAccount: (accountId: string) => void;
  onEditFolder: (folderId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleAccount: (accountId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onShowProviderInfo: () => void;
}

export function AccountSidebar({
  accounts,
  folders,
  selectedAccountId,
  selectedFolderId,
  salesCounts,
  folderSalesCounts,
  onSelectAccount,
  onSelectFolder,
  onAddAccount,
  onAddFolder,
  onEditAccount,
  onEditFolder,
  onDeleteAccount,
  onDeleteFolder,
  onToggleAccount,
  onToggleFolder,
  onShowProviderInfo,
}: AccountSidebarProps) {
  const totalSales = Object.values(salesCounts).reduce((sum, count) => sum + count, 0) +
                     Object.values(folderSalesCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="account-sidebar">
      <div className="account-sidebar-header">
        <h3>Sources</h3>
        <div className="account-sidebar-actions">
          <Button 
            variant="ghost" 
            size="icon-sm"
            className="rounded-full"
            onClick={onShowProviderInfo}
            title="Email-Anbieter Kompatibilität"
          >
            <Info className="h-4 w-4" />
          </Button>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onAddAccount}
            title="Add new source (email account or folder)"
          >
            + Add
          </button>
        </div>
      </div>

      {/* All Sources Filter */}
      <div
        className={`account-item ${selectedAccountId === null && selectedFolderId === null ? 'active' : ''}`}
        onClick={() => {
          onSelectAccount(null);
          onSelectFolder(null);
        }}
      >
        <div className="account-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <List className="h-4 w-4" />
          <div>
            <div className="account-name">All Sources</div>
            <div className="account-email">Show all sales</div>
          </div>
        </div>
        {totalSales > 0 && (
          <div className="account-badge">{totalSales}</div>
        )}
      </div>

      {/* Email Accounts Section */}
      {accounts.length > 0 && (
        <div className="source-section">
          <div className="source-section-header">
            <Mail className="h-4 w-4" />
            <span>Email Accounts</span>
          </div>
          <div className="account-list">
            {accounts.map((account) => {
              const salesCount = salesCounts[account.id] || 0;
              
              return (
                <div
                  key={account.id}
                  className={`account-item ${selectedAccountId === account.id ? 'active' : ''} ${!account.isActive ? 'inactive' : ''}`}
                >
                  <div 
                    className="account-info"
                    onClick={() => {
                      onSelectAccount(account.id);
                      onSelectFolder(null);
                    }}
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
                      {account.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAccount(account.id);
                      }}
                      title="Edit account"
                    >
                      <Edit2 className="h-4 w-4" />
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
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Watched Folders Section */}
      {folders.length > 0 && (
        <div className="source-section">
          <div className="source-section-header">
            <Folder className="h-4 w-4" />
            <span>Watched Folders</span>
          </div>
          <div className="account-list">
            {folders.map((folder) => {
              const salesCount = folderSalesCounts[folder.id] || 0;
              
              return (
                <div
                  key={folder.id}
                  className={`account-item folder-item ${selectedFolderId === folder.id ? 'active' : ''} ${!folder.isActive ? 'inactive' : ''}`}
                >
                  <div 
                    className="account-info"
                    onClick={() => {
                      onSelectFolder(folder.id);
                      onSelectAccount(null);
                    }}
                  >
                    <div className="account-name">
                      {folder.isActive ? '✅' : '⏸️'} {folder.name}
                    </div>
                    <div className="account-email folder-path">{folder.folderPath}</div>
                  </div>
                  
                  {salesCount > 0 && (
                    <div className="account-badge">{salesCount}</div>
                  )}

                  <div className="account-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFolder(folder.id);
                      }}
                      title={folder.isActive ? 'Deactivate folder' : 'Activate folder'}
                    >
                      {folder.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFolder(folder.id);
                      }}
                      title="Edit folder"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}"?\n\nSales from this folder will not be deleted, but will no longer be linked to a folder.`)) {
                          onDeleteFolder(folder.id);
                        }
                      }}
                      title="Delete folder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && folders.length === 0 && (
        <div className="account-empty">
          <p>No sources configured</p>
          <p className="account-empty-hint">Add an email account or folder to get started</p>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onShowProviderInfo}
            style={{ marginTop: '1rem' }}
            title="Show email provider compatibility info"
          >
            How?
          </button>
        </div>
      )}
    </div>
  );
}

