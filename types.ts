// Enums for standardizing statuses and roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  TREASURER = 'TREASURER',
  CASHIER = 'CASHIER',
  MEMBER = 'MEMBER'
}

export enum TenantType {
  BUSINESS = 'BUSINESS',
  STOKVEL = 'STOKVEL',
  LENDING = 'LENDING'
}

export enum TransactionType {
  SALE = 'SALE',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  EXPENSE = 'EXPENSE',
  CAPITAL_INJECTION = 'CAPITAL_INJECTION',
  CONTRIBUTION = 'CONTRIBUTION',
  PAYOUT = 'PAYOUT',
  DEBT_PAYMENT = 'DEBT_PAYMENT'
}

export enum PaymentMethod {
  CASH = 'CASH',
  EFT = 'EFT',
  MOMO = 'MOMO',
  CREDIT = 'CREDIT'
}

export enum LoanStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  DEFAULTED = 'DEFAULTED',
  REJECTED = 'REJECTED'
}

export enum POPStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum ContributionStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL'
}

// --- BILLING & SUBSCRIPTIONS ---
export enum BillingInterval {
  MONTHLY = 'month',
  YEARLY = 'year'
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  isActive: boolean;
  tier: 'BASIC' | 'PRO' | 'ENTERPRISE'; // Maps to AccessSettings
}

export interface Invoice {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'VOID' | 'UNCOLLECTIBLE';
  date: string;
  pdfUrl?: string;
  planName: string;
}

export interface TenantBilling {
  tenantId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingEmail?: string;
}

// Global ERP Settings
export interface GlobalSettings {
  id: 'global'; // Fixed ID for the global settings document
  erpName: string;
  erpLogoUrl?: string;
  primaryColor: string; // Global accent color
  secondaryColor: string; // Global secondary accent color
  supportEmail: string;
  platformDomain: string;
  
  // New System Settings
  apiKeys?: {
    googleMaps?: string;
    sendGrid?: string;
    twilio?: string;
    firebaseProject?: string; // Informational
  };
  system?: {
    maintenanceMode: boolean;
    allowSignup: boolean;
    dataRetentionDays?: number;
    enable2FA?: boolean;
  };
}

// Tenant-Specific Settings Interfaces (Sub-documents)
export interface BrandingSettings {
  logoUrl?: string;
  primaryColor: string; // Tenant's primary color, overrides global
  secondaryColor?: string; // Tenant's secondary color, overrides global
  displayName: string; // Tenant's display name
  slogan?: string; // Short description/slogan
}

export interface AccessSettings {
  subscriptionTier: 'BASIC' | 'PRO' | 'ENTERPRISE';
  // Other access-related settings can go here
}

export interface EmailTemplate { // Moved template definition here
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION';
}

export interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string; // SMTP username (e.g., email address)
  smtpPass?: string; // SMTP password (securely handled, not stored client-side)
  senderEmail: string; // Default 'From' email address
  replyTo?: string;
  templates: EmailTemplate[];
}

export interface NotificationSettings {
  emailNewSale: boolean;
  smsPayment: boolean;
  dailySummary: boolean;
  lowStock: boolean;
  creditWarning: boolean;
  autoMonthlyReport: boolean;
  recipients: string[]; // List of emails for notifications
}

export interface POSSettings {
  receiptFooter: string;
  taxRate: number; // e.g., 15 for 15%
  enableCash: boolean;
  enableCard: boolean;
  enableCredit: boolean;
  autoPrint: boolean;
  currencySymbol: string; 
  numberFormat: 'R_COMMA_DECIMAL' | 'COMMA_DECIMAL_R'; // R 1,234.56 vs 1,234.56 R
}

export interface BusinessCycleSettings {
  startDay: number; // e.g., 5 (for 5th of the month)
  endDay: number;   // e.g., 4 (for 4th of the next month)
  fiscalStartMonth: number; // 1-12 (e.g., 1 for Jan, 7 for July)
  currencySymbol: string; // e.g., 'R', '$'
}

export interface DataSettings {
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
  dataRetentionPeriod: '1_year' | '5_years' | 'forever';
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  ipWhitelist: string[];
  auditLogRetentionDays: number;
}


// Main Tenant Interface (Stores summary & directly editable profile fields)
export interface Tenant {
  id: string;
  name: string; // Main name for search/list - branding.displayName is for display
  type: TenantType;
  isActive: boolean;
  category?: string; // Business category (e.g., Butchery, IT)

  // Direct fields (can be edited on initial profile tab)
  regNumber?: string;
  taxNumber?: string;
  address?: string;
  contactNumber?: string;
  email?: string; // Contact email for the business/stokvel
  website?: string;
  target?: number; // Only for Stokvels (financial target)

  // Nested Settings (these will be separate sub-documents in Firestore)
  branding?: BrandingSettings;
  access?: AccessSettings; 
  emailConfig?: EmailSettings;
  notifications?: NotificationSettings;
  posSettings?: POSSettings;
  cycleSettings?: BusinessCycleSettings;
  dataSettings?: DataSettings;
  securitySettings?: SecuritySettings;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  tenantId: string; // 'global' for SuperAdmin, otherwise tenant ID
  branchId?: string;
  name: string;
  email: string;
  phone?: string; // Added phone field
  role: UserRole;
  avatarUrl?: string;
  permissions?: string[]; // E.g., ['VIEW_REPORTS', 'MANAGE_STOCK']
  isActive?: boolean; // New field for activation status
  hasSeenWelcome?: boolean; // New field for welcome tour
  createdAt?: string;
}

export interface StokvelMember {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  joinDate: string;
  monthlyPledge: number;
  totalContributed: number;
  payoutQueuePosition?: number;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
}

export interface Contribution {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  date: string;
  period: string; // YYYY-MM
  status: ContributionStatus;
  method: PaymentMethod;
}

export interface Payout {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  date: string;
  status: 'PAID' | 'SCHEDULED' | 'PENDING';
  period: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  stockLevel: number;
  minStockThreshold: number;
  imageUrl?: string; 
  unit: 'kg' | 'unit' | 'litre' | 'box';
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  creditLimit: number;
  currentDebt: number;
  lastPurchaseDate?: string;
  salesCount?: number;
  totalCredit?: number; 
  timestamp?: string; 
}

export interface Expense {
  id: string;
  tenantId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
}

export interface Transaction {
  id: string;
  tenantId: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string; // ISO date
  reference?: string;
  receivedBy?: string;
  items?: { productId: string; name: string; qty: number; price: number; subtotal: number }[];
}

export interface Loan {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  amount: number;
  interestRate: number;
  totalRepayable: number;
  balanceRemaining: number;
  startDate: string;
  dueDate: string;
  status: LoanStatus;
  approvals: { userId: string; role: UserRole; approved: boolean; date: string }[];
}

export interface POPDocument {
  id: string;
  tenantId: string;
  uploadedBy: string;
  amount: number;
  reference: string;
  imageUrl: string; // URL to image
  ocrData?: string;
  status: POPStatus;
  timestamp: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'READ' | 'UNREAD' | 'SENT' | 'FAILED';
  folder: 'INBOX' | 'SENT';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  tenantId: string;
}