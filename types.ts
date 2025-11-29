

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

// Interfaces
export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  subscriptionTier: 'BASIC' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  target?: number; // Financial target for the stokvel
  category?: string; // Business category
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  tenantId: string; // 'GLOBAL' for SuperAdmin
  branchId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface StokvelMember {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string; // Added email
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
  subcategory?: string; // Added subcategory
  price: number;
  cost: number;
  stockLevel: number;
  minStockThreshold: number;
  // imageUrl removed as per request
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
  // New fields matching Firestore schema
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
  customerId?: string; // Optional (walk-in)
  customerName?: string; // Snapshot
  type: TransactionType;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string; // ISO date
  reference?: string;
  receivedBy?: string; // Added receiver field
  items?: { productId: string; name: string; qty: number; price: number; subtotal: number }[];
}

export interface Loan {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string; // Denormalized for UI
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

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION';
}