
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
  LENDING = 'LENDING',
  LOAN = 'LOAN'
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
  idNumber?: string;
  employmentStatus?: string;
  income?: number;
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
  timestamp: string;
  reference?: string;
  receivedBy?: string;
  items?: { productId: string; name: string; qty: number; price: number; subtotal: number }[];
  // Repayment specifics
  principalPart?: number;
  interestPart?: number;
  loanId?: string;
}

export interface Loan {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  amount: number; // Principal
  interestRate: number;
  totalRepayable: number;
  balanceRemaining: number;
  startDate: string;
  dueDate: string;
  status: LoanStatus;
  approvals: { userId: string; role: UserRole; approved: boolean; date: string }[];
  lastCompoundedDate?: string; // Tracks when auto-compounding was last applied
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
