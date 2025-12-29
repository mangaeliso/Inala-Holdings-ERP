
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
  STOKVEL = 'STOKVEL'
}

export type BusinessMode = 'RETAIL' | 'LOANS' | 'BOTH';

export enum TransactionType {
  SALE = 'SALE',
  SALE_ADJUSTMENT = 'SALE_ADJUSTMENT',
  SALE_VOID = 'SALE_VOID',
  VOID_REQUEST = 'VOID_REQUEST',
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

// --- NEW ENTITY REGISTRY TYPES ---

export interface Person {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantPersonLink {
  id: string;
  personId: string;
  tenantId: string;
  role: 'CUSTOMER' | 'BORROWER' | 'MEMBER' | 'GUARANTOR';
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE';
  creditLimit?: number;
  currentDebt?: number;
  monthlyPledge?: number;
  totalContributed?: number;
  joinedAt: string;
}

export interface SystemEmailTemplate {
  id: string;
  category: 'REMITTANCE' | 'CREDIT_DUE' | 'STOKVEL_UPDATE' | 'RECEIPT';
  subject: string;
  body: string;
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
  tier: 'BASIC' | 'PRO' | 'ENTERPRISE';
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

export interface GlobalSettings {
  id: 'global';
  erpName: string;
  erpLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  platformDomain: string;
  apiKeys?: {
    googleMaps?: string;
    sendGrid?: string;
    twilio?: string;
    firebaseProject?: string;
  };
  system?: {
    maintenanceMode: boolean;
    allowSignup: boolean;
    dataRetentionDays?: number;
    enable2FA?: boolean;
  };
}

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  displayName: string;
  slogan?: string;
}

export interface AccessSettings {
  subscriptionTier: 'BASIC' | 'PRO' | 'ENTERPRISE';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION';
}

export interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  senderEmail: string;
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
  recipients: string[];
}

export interface POSSettings {
  receiptFooter: string;
  taxRate: number;
  enableCash: boolean;
  enableCard: boolean;
  enableCredit: boolean;
  autoPrint: boolean;
  currencySymbol: string; 
  numberFormat: 'R_COMMA_DECIMAL' | 'COMMA_DECIMAL_R';
}

export interface BusinessCycleSettings {
  startDay: number;
  endDay: number;
  fiscalStartMonth: number;
  currencySymbol: string;
}

export interface DataSettings {
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
  dataRetentionPeriod: '1_year' | '5_years' | 'forever';
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  auditLogRetentionDays: number;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  businessMode?: BusinessMode;
  isActive: boolean;
  category?: string;
  regNumber?: string;
  taxNumber?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  target?: number;
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
  tenantId: string;
  branchId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  permissions?: string[];
  isActive?: boolean;
  hasSeenWelcome?: boolean;
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
  personId?: string;
}

export interface Contribution {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  date: string;
  period: string;
  status: ContributionStatus;
  method: PaymentMethod;
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
  isActive?: boolean;
  posVisible?: boolean;
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
  idNumber?: string;
  employmentStatus?: string;
  income?: number;
  personId?: string;
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
  amount: number; // Charged Amount (The actual financial value)
  grossAmount?: number; // Retail/Original Value
  currency: string;
  method: PaymentMethod;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'VOIDED';
  timestamp: string;
  reference?: string;
  receivedBy?: string;
  receivedByUserId?: string;
  items?: { productId: string; name: string; qty: number; price: number; chargedPrice?: number; subtotal: number }[];
  
  // Tax fields
  vatRate?: number;
  vatAmount?: number;
  subtotal?: number;
  
  // Ledger History
  linkedSaleId?: string;
  voidReason?: string;
  adjustmentReason?: string;
  approvedBy?: string;
  requestedBy?: string;
  oldValues?: any;
  newValues?: any;

  // Repayment specifics
  principalPart?: number;
  interestPart?: number;
  loanId?: string;
  
  // Audit
  editedAt?: string;
  editedBy?: string;
  originalAmount?: number;
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
  lastCompoundedDate?: string;
}

export interface POPDocument {
  id: string;
  tenantId: string;
  uploadedBy: string;
  amount: number;
  reference: string;
  imageUrl: string;
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
