/**
 * Shared TypeScript types for AutoLabel
 * Used across main, preload, and renderer processes
 */

// ============================================================================
// Core Domain Models
// ============================================================================

export interface Sale {
  id: string;
  emailId: string; // For deduplication
  date: string; // ISO date string
  platform?: string; // e.g., "eBay", "Amazon", detected if possible
  shippingCompany?: string; // e.g., "DHL", "Hermes", "DPD", "GLS", "UPS"
  productNumber?: string;
  itemTitle?: string;
  buyerRef?: string;
  metadata?: Record<string, any>; // Flexible storage for extra fields
  createdAt: string; // ISO timestamp
  hasAttachments?: boolean; // Whether sale has label attachments
  accountId?: string; // Email account this sale came from
}

export interface EmailAccount {
  id: string;
  name: string; // User-defined name (e.g., "Gmail Main", "Outlook Business")
  host: string; // IMAP host
  port: number; // IMAP port
  username: string; // Email address
  password: string; // Decrypted password (only in main process)
  tls: boolean;
  isActive: boolean; // Whether account is active for scanning
  createdAt: string;
}

export interface Attachment {
  id: string;
  saleId: string;
  type: 'pdf' | 'image';
  localPath: string;
  sourceEmailId: string;
  originalFilename?: string;
}

export interface PreparedLabel {
  id: string;
  saleId: string;
  profileId: string; // e.g., "generic", "dhl", "hermes"
  outputPath: string;
  sizeMm: { width: number; height: number }; // Should be 100x150 for MVP
  dpi: number; // Should be 300 for MVP
  footerApplied: boolean;
  footerConfig?: FooterConfig;
  createdAt: string;
}

export interface PrintJob {
  id: string;
  printerName: string;
  labelIds: string[];
  status: 'pending' | 'printing' | 'completed' | 'failed';
  printedCount: number;
  totalCount: number;
  errors?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrintJobItem {
  id: string;
  labelId: string;
  status: 'pending' | 'printed' | 'failed';
  error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface FooterConfig {
  includeProductNumber: boolean;
  includeItemTitle: boolean;
  includeDate: boolean;
}

export interface IMAPConfig {
  host: string;
  port: number;
  username: string;
  password: string; // Will be encrypted via safeStorage
  tls: boolean;
}

export interface AppConfig {
  imap?: IMAPConfig;
  scanDays: number; // How many days back to scan (default: 30)
  lastScanDate?: string;
  defaultFooterConfig: FooterConfig;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ScanResult {
  scannedCount: number;
  newSales: number;
  errors?: string[];
}

export interface ScanStatus {
  isScanning: boolean;
  progress?: number; // 0-100
  currentEmail?: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

// ============================================================================
// IPC API Interface (exposed via preload)
// ============================================================================

export interface AutoLabelAPI {
  scan: {
    start: (accountId?: string) => Promise<ScanResult>;
    status: () => Promise<ScanStatus>;
    refreshVinted: () => Promise<ScanResult>;
  };
  sales: {
    list: (params: { fromDate?: string; toDate?: string; accountId?: string }) => Promise<Sale[]>;
    get: (id: string) => Promise<Sale | null>;
  };
  labels: {
    prepare: (params: {
      saleIds: string[];
      footerConfig: FooterConfig;
    }) => Promise<PreparedLabel[]>;
    getThumbnail: (pdfPath: string) => Promise<string>;
  };
  attachments: {
    getBySale: (saleId: string) => Promise<Attachment[]>;
  };
  print: {
    addToQueue: (params: {
      labelIds: string[];
      printerName?: string;
    }) => Promise<PrintJob>;
    start: (params: {
      labelIds: string[];
      printerName?: string;
    }) => Promise<PrintJob>;
    startQueued: (jobId: string) => Promise<void>;
    status: (jobId: string) => Promise<PrintJob | null>;
    listJobs: () => Promise<PrintJob[]>;
    retry: (jobId: string) => Promise<void>;
    delete: (jobId: string) => Promise<void>;
    listPrinters: () => Promise<PrinterInfo[]>;
  };
  config: {
    get: () => Promise<AppConfig>;
    set: (config: Partial<AppConfig>) => Promise<void>;
  };
  accounts: {
    list: () => Promise<EmailAccount[]>;
    create: (data: Omit<EmailAccount, 'id' | 'createdAt'>) => Promise<EmailAccount>;
    update: (id: string, data: Partial<Omit<EmailAccount, 'id' | 'createdAt'>>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    toggle: (id: string) => Promise<void>;
    test: (config: { host: string; port: number; username: string; password: string; tls: boolean }) => Promise<{ success: boolean; error?: string }>;
    testExisting: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  };
  log: {
    error: (message: string, error?: any, context?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    warn: (message: string, context?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    info: (message: string, context?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    debug: (message: string, context?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    getDirectory: () => Promise<{ success: boolean; directory?: string; error?: string }>;
    getFiles: () => Promise<{ success: boolean; files?: string[]; error?: string }>;
  };
  license: {
    get: () => Promise<LicenseInfo>;
    validate: (licenseKey: string) => Promise<{ success: boolean; error?: string; license?: LicenseInfo }>;
    remove: () => Promise<{ success: boolean }>;
    usage: () => Promise<UsageInfo>;
    canCreateLabels: (count?: number) => Promise<{ allowed: boolean; reason?: string }>;
    canBatchPrint: () => Promise<boolean>;
    canCustomFooter: () => Promise<boolean>;
    getLimits: () => Promise<LicenseLimits>;
    resetUsage: () => Promise<{ success: boolean }>;
  };
}

// ============================================================================
// License & Usage Types
// ============================================================================

export interface LicenseInfo {
  plan: 'free' | 'plus' | 'pro';
  licenseKey: string | null;
  expiresAt: string | null;
  validatedAt: string;
  isValid: boolean;
}

export interface UsageInfo {
  labelsUsed: number;
  month: string; // Format: "YYYY-MM"
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
}

export interface LicenseLimits {
  labelsPerMonth: number; // -1 = unlimited
  batchPrinting: boolean;
  customFooter: boolean;
}

// ============================================================================
// Database Row Types (internal to main process)
// ============================================================================

export interface SaleRow {
  id: string;
  email_id: string;
  date: string;
  platform: string | null;
  shipping_company: string | null;
  product_number: string | null;
  item_title: string | null;
  buyer_ref: string | null;
  metadata_json: string | null;
  created_at: string;
  account_id: string | null;
}

export interface AttachmentRow {
  id: string;
  sale_id: string;
  type: string;
  local_path: string;
  source_email_id: string;
  original_filename: string | null;
}

export interface EmailAccountRow {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encrypted_password: string;
  tls: number; // SQLite stores booleans as 0/1
  is_active: number; // SQLite stores booleans as 0/1
  created_at: string;
}

export interface PreparedLabelRow {
  id: string;
  sale_id: string;
  profile_id: string;
  output_path: string;
  size_mm: string; // JSON: {width, height}
  dpi: number;
  footer_config: string | null; // JSON
  created_at: string;
}

export interface PrintJobRow {
  id: string;
  printer_name: string;
  status: string;
  printed_count: number;
  total_count: number;
  errors_json: string | null;
  created_at: string;
  updated_at: string;
}
