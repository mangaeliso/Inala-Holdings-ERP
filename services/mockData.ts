import { Tenant, User, UserRole, Product, Transaction, TransactionType, PaymentMethod, Loan, LoanStatus, POPStatus, POPDocument, Customer, TenantType, StokvelMember, Contribution, ContributionStatus, Payout } from '../types';

// 0. Global Parent Tenant
export const INALA_HOLDINGS_TENANT: Tenant = {
  id: 'global',
  name: 'INALA HOLDINGS',
  type: TenantType.BUSINESS, // Acts as admin business
  primaryColor: '#0f172a', // Slate 900
  currency: 'USD',
  subscriptionTier: 'ENTERPRISE',
  isActive: true,
  logoUrl: 'https://ui-avatars.com/api/?name=Inala+Holdings&background=0f172a&color=fff&size=128&bold=true'
};

// 1. Tenants (Categorized)
export const MOCK_TENANTS: Tenant[] = [
  // Stokvels
  {
    id: 't_stok_01',
    name: 'African Man Group',
    type: TenantType.STOKVEL,
    logoUrl: 'https://ui-avatars.com/api/?name=African+Man&background=0ea5e9&color=fff&size=128',
    primaryColor: '#0ea5e9',
    currency: 'ZAR',
    subscriptionTier: 'ENTERPRISE',
    isActive: true
  },
  {
    id: 't_stok_02',
    name: 'Soweto Stokvel',
    type: TenantType.STOKVEL,
    logoUrl: 'https://ui-avatars.com/api/?name=Soweto+Stokvel&background=8b5cf6&color=fff&size=128',
    primaryColor: '#8b5cf6',
    currency: 'ZAR',
    subscriptionTier: 'BASIC',
    isActive: true
  },
  // Businesses
  {
    id: 't_biz_01',
    name: 'Inala Butchery',
    type: TenantType.BUSINESS,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Butchery&background=dc2626&color=fff&size=128',
    primaryColor: '#dc2626', // Red
    currency: 'ZAR',
    subscriptionTier: 'PRO',
    isActive: true
  },
  {
    id: 't_biz_02',
    name: 'Inala Perfumes',
    type: TenantType.BUSINESS,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Perfumes&background=ec4899&color=fff&size=128',
    primaryColor: '#ec4899', // Pink
    currency: 'ZAR',
    subscriptionTier: 'BASIC',
    isActive: true
  },
  // Loans
  {
    id: 't_loan_01',
    name: 'Inala Loans',
    type: TenantType.LENDING,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Loans&background=d97706&color=fff&size=128',
    primaryColor: '#d97706', // Amber
    currency: 'ZAR',
    subscriptionTier: 'ENTERPRISE',
    isActive: true
  }
];

// 2. Users
export const MOCK_USERS: User[] = [
  {
    id: 'u_001',
    tenantId: 'GLOBAL',
    name: 'Inala SuperAdmin',
    email: 'admin@inala.holdings',
    role: UserRole.SUPER_ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=0f172a&color=fff'
  },
  {
    id: 'u_002',
    tenantId: 't_stok_01',
    name: 'Thabo Mbeki',
    email: 'thabo@africanmangroup.co.za',
    role: UserRole.TENANT_ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Thabo+Mbeki&background=random'
  },
  {
    id: 'u_003',
    tenantId: 't_stok_01',
    name: 'Lerato Kganyago',
    email: 'lerato@africanmangroup.co.za',
    role: UserRole.TREASURER,
    avatarUrl: 'https://ui-avatars.com/api/?name=Lerato+K&background=random'
  }
];

// 3. Products (Scoped to Businesses)
export const MOCK_PRODUCTS: Product[] = [
  // Butchery Products
  {
    id: 'p_001',
    tenantId: 't_biz_01', // Butchery
    name: 'Premium Beef Stew Cut',
    sku: 'BEEF-001',
    category: 'Meat',
    price: 120.00,
    cost: 85.00,
    stockLevel: 45,
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'p_002',
    tenantId: 't_biz_01', // Butchery
    name: 'Lamb Chops 1kg',
    sku: 'LAMB-002',
    category: 'Meat',
    price: 189.99,
    cost: 140.00,
    stockLevel: 20,
    minStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1602498456745-e9503b30470b?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'p_005',
    tenantId: 't_biz_01', // Butchery
    name: 'Boerewors Special',
    sku: 'SAUS-001',
    category: 'Sausage',
    price: 89.99,
    cost: 50.00,
    stockLevel: 100,
    minStockThreshold: 20,
    imageUrl: 'https://images.unsplash.com/photo-1595480838330-811c762510c4?auto=format&fit=crop&q=80&w=300&h=300'
  },
  // Perfume Products
  {
    id: 'p_003',
    tenantId: 't_biz_02', // Perfumes
    name: 'Oud Wood Intense',
    sku: 'PERF-001',
    category: 'Fragrance',
    price: 450.00,
    cost: 120.00,
    stockLevel: 100, 
    minStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'p_004',
    tenantId: 't_biz_02', // Perfumes
    name: 'Vanilla Essence',
    sku: 'PERF-002',
    category: 'Fragrance',
    price: 350.00,
    cost: 90.00,
    stockLevel: 50,
    minStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'p_006',
    tenantId: 't_biz_02', // Perfumes
    name: 'Ocean Breeze Mist',
    sku: 'PERF-003',
    category: 'Body Mist',
    price: 150.00,
    cost: 40.00,
    stockLevel: 200,
    minStockThreshold: 30,
    imageUrl: 'https://images.unsplash.com/photo-1615108395436-1e0de1c92a95?auto=format&fit=crop&q=80&w=300&h=300'
  }
];

// 4. Customers
export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'c_001',
        tenantId: 't_biz_01',
        name: 'Mama Joy',
        phone: '+27 82 123 4567',
        creditLimit: 5000,
        currentDebt: 1200
    },
    {
        id: 'c_002',
        tenantId: 't_biz_01',
        name: 'Sipho Nkosi',
        phone: '+27 71 987 6543',
        creditLimit: 2000,
        currentDebt: 0
    }
];

// 5. Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1001',
    tenantId: 't_biz_01',
    branchId: 'b_001',
    customerId: 'c_001',
    type: TransactionType.SALE,
    amount: 1200.00,
    currency: 'ZAR',
    method: PaymentMethod.CREDIT,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    reference: 'INV-0092',
    items: [{ productId: 'p_001', name: 'Premium Beef', qty: 10, price: 120 }]
  },
  {
    id: 'tx_1002',
    tenantId: 't_biz_02',
    branchId: 'b_001',
    customerId: 'walk_in',
    type: TransactionType.SALE,
    amount: 450.00,
    currency: 'ZAR',
    method: PaymentMethod.CASH,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    items: [{ productId: 'p_003', name: 'Oud Wood Intense', qty: 1, price: 450.00 }]
  }
];

// 6. Loans
export const MOCK_LOANS: Loan[] = [
  {
    id: 'ln_001',
    tenantId: 't_loan_01', // Inala Loans
    customerId: 'c_001',
    customerName: 'Mama Joy',
    amount: 5000,
    interestRate: 15,
    totalRepayable: 5750,
    balanceRemaining: 5750,
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), // +30 days
    status: LoanStatus.PENDING_APPROVAL,
    approvals: [
      { userId: 'u_003', role: UserRole.TREASURER, approved: true, date: new Date().toISOString() }
    ]
  },
  {
    id: 'ln_stok_01',
    tenantId: 't_stok_01', // African Man Group Loan
    customerId: 'sm_002',
    customerName: 'Kabelo Mabalane',
    amount: 20000,
    interestRate: 5,
    totalRepayable: 21000,
    balanceRemaining: 15000,
    startDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 45).toISOString(),
    status: LoanStatus.ACTIVE,
    approvals: []
  }
];

// 7. POPs
export const MOCK_POPS: POPDocument[] = [
    {
        id: 'pop_001',
        tenantId: 't_stok_01',
        uploadedBy: 'c_001',
        amount: 1200,
        reference: 'STOK-0092',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800', // Mock receipt
        status: POPStatus.PENDING,
        timestamp: new Date().toISOString()
    }
];

// 8. Stokvel Members
export const MOCK_STOKVEL_MEMBERS: StokvelMember[] = [
    // African Man Group
    {
        id: 'sm_001',
        tenantId: 't_stok_01',
        name: 'Julius Malema',
        phone: '+27 82 000 0001',
        joinDate: '2024-01-15',
        monthlyPledge: 5000,
        totalContributed: 55000,
        payoutQueuePosition: 1,
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Julius+M&background=0ea5e9&color=fff'
    },
    {
        id: 'sm_002',
        tenantId: 't_stok_01',
        name: 'Kabelo Mabalane',
        phone: '+27 82 000 0002',
        joinDate: '2024-01-20',
        monthlyPledge: 5000,
        totalContributed: 50000,
        payoutQueuePosition: 2,
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Kabelo+M&background=0ea5e9&color=fff'
    },
    {
        id: 'sm_003',
        tenantId: 't_stok_01',
        name: 'DJ Black Coffee',
        phone: '+27 82 000 0003',
        joinDate: '2024-02-01',
        monthlyPledge: 10000,
        totalContributed: 100000,
        payoutQueuePosition: 3,
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Black+C&background=000&color=fff'
    },
    // Soweto Stokvel
    {
        id: 'sm_004',
        tenantId: 't_stok_02',
        name: 'Gogo Mavuso',
        phone: '+27 71 555 1234',
        joinDate: '2023-11-10',
        monthlyPledge: 500,
        totalContributed: 6000,
        payoutQueuePosition: 1,
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Gogo+M&background=8b5cf6&color=fff'
    },
    {
        id: 'sm_005',
        tenantId: 't_stok_02',
        name: 'Sipho Hotstix',
        phone: '+27 71 555 9876',
        joinDate: '2023-11-12',
        monthlyPledge: 500,
        totalContributed: 5500,
        payoutQueuePosition: 2,
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sipho+H&background=8b5cf6&color=fff'
    }
];

// 9. Contributions
export const MOCK_CONTRIBUTIONS: Contribution[] = [
    // African Man Group - Current Month
    {
        id: 'con_001',
        tenantId: 't_stok_01',
        memberId: 'sm_001',
        amount: 5000,
        date: new Date().toISOString(),
        period: '2025-02',
        status: ContributionStatus.PAID,
        method: PaymentMethod.EFT
    },
    {
        id: 'con_002',
        tenantId: 't_stok_01',
        memberId: 'sm_002',
        amount: 5000,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        period: '2025-02',
        status: ContributionStatus.PAID,
        method: PaymentMethod.MOMO
    },
    // Soweto Stokvel - Current Month
    {
        id: 'con_003',
        tenantId: 't_stok_02',
        memberId: 'sm_004',
        amount: 500,
        date: new Date().toISOString(),
        period: '2025-02',
        status: ContributionStatus.PAID,
        method: PaymentMethod.CASH
    }
];

// 10. Payout History
export const MOCK_PAYOUTS: Payout[] = [
    {
        id: 'pay_001',
        tenantId: 't_stok_01',
        memberId: 'sm_003',
        amount: 120000,
        date: '2024-12-15',
        status: 'PAID',
        period: '2024-12'
    },
    {
        id: 'pay_002',
        tenantId: 't_stok_01',
        memberId: 'sm_001',
        amount: 110000,
        date: '2025-01-15',
        status: 'PAID',
        period: '2025-01'
    }
];

// Helper to get reporting window (5th to 5th)
export const getReportingWindow = () => {
    const now = new Date();
    let startMonth = now.getMonth();
    let startYear = now.getFullYear();

    if (now.getDate() < 5) {
        startMonth = startMonth - 1;
        if(startMonth < 0) {
            startMonth = 11;
            startYear = startYear - 1;
        }
    }
    
    const start = new Date(startYear, startMonth, 5);
    const end = new Date(startYear, startMonth + 1, 4, 23, 59, 59);

    return { start, end };
};