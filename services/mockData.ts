
import { Tenant, User, UserRole, Product, Transaction, TransactionType, PaymentMethod, Loan, LoanStatus, POPStatus, POPDocument, Customer, TenantType, StokvelMember, Contribution, ContributionStatus, Payout, Expense, EmailMessage } from '../types';

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
    isActive: true,
    target: 500000 // R500k Target
  },
  {
    id: 't_stok_02',
    name: 'Soweto Stokvel',
    type: TenantType.STOKVEL,
    logoUrl: 'https://ui-avatars.com/api/?name=Soweto+Stokvel&background=8b5cf6&color=fff&size=128',
    primaryColor: '#8b5cf6',
    currency: 'ZAR',
    subscriptionTier: 'BASIC',
    isActive: true,
    target: 20000 // R20k Target
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
export let MOCK_PRODUCTS: Product[] = [
  // --- INALA BUTCHERY PRODUCTS ---
  
  // Beef Category
  {
    id: 'p_beef_01',
    tenantId: 't_biz_01',
    name: 'Beef Stew',
    sku: 'BF-STEW-001',
    category: 'Beef',
    subcategory: 'Stewing Meat',
    price: 95.00,
    cost: 65.00,
    stockLevel: 50,
    minStockThreshold: 10,
    unit: 'kg'
  },
  {
    id: 'p_beef_02',
    tenantId: 't_biz_01',
    name: 'Beef Mince',
    sku: 'BF-MINC-001',
    category: 'Beef',
    subcategory: 'Mince',
    price: 90.00,
    cost: 60.00,
    stockLevel: 35,
    minStockThreshold: 10,
    unit: 'kg'
  },
  {
    id: 'p_beef_03',
    tenantId: 't_biz_01',
    name: 'T-Bone Steak',
    sku: 'BF-STK-001',
    category: 'Beef',
    subcategory: 'Steak',
    price: 130.00,
    cost: 90.00,
    stockLevel: 30,
    minStockThreshold: 5,
    unit: 'kg'
  },
  
  // Wors Category
  {
    id: 'p_wors_01',
    tenantId: 't_biz_01',
    name: 'Inala Boerewors',
    sku: 'WS-BOER-001',
    category: 'Wors',
    subcategory: 'Traditional',
    price: 89.99,
    cost: 55.00,
    stockLevel: 80,
    minStockThreshold: 15,
    unit: 'kg'
  },
  {
    id: 'p_wors_02',
    tenantId: 't_biz_01',
    name: 'Chilli Wors',
    sku: 'WS-CHIL-001',
    category: 'Wors',
    subcategory: 'Spicy',
    price: 92.00,
    cost: 57.00,
    stockLevel: 40,
    minStockThreshold: 10,
    unit: 'kg'
  },

  // Pork Category
  {
    id: 'p_pork_01',
    tenantId: 't_biz_01',
    name: 'Pork Chops',
    sku: 'PK-CHP-001',
    category: 'Pork',
    subcategory: 'Chops',
    price: 95.00,
    cost: 60.00,
    stockLevel: 40,
    minStockThreshold: 10,
    unit: 'kg'
  },
  {
    id: 'p_pork_02',
    tenantId: 't_biz_01',
    name: 'Pork Stew',
    sku: 'PK-STEW-001',
    category: 'Pork',
    subcategory: 'Stewing Meat',
    price: 75.00,
    cost: 45.00,
    stockLevel: 55,
    minStockThreshold: 10,
    unit: 'kg'
  },

  // Bones Category
  {
    id: 'p_bones_01',
    tenantId: 't_biz_01',
    name: 'Meaty Bones',
    sku: 'BN-MEAT-001',
    category: 'Bones',
    subcategory: 'Soup',
    price: 45.00,
    cost: 20.00,
    stockLevel: 100,
    minStockThreshold: 20,
    unit: 'kg'
  },

  // Oxtail Category
  {
    id: 'p_oxtail_01',
    tenantId: 't_biz_01',
    name: 'Oxtail',
    sku: 'OX-TAIL-001',
    category: 'Oxtail',
    subcategory: 'Premium',
    price: 145.00,
    cost: 95.00,
    stockLevel: 25,
    minStockThreshold: 5,
    unit: 'kg'
  },

  // Head & Hooves Category
  {
    id: 'p_head_01',
    tenantId: 't_biz_01',
    name: 'Cow Head (Skopo)',
    sku: 'HD-COW-001',
    category: 'Head & Hooves',
    subcategory: 'Head',
    price: 350.00,
    cost: 200.00,
    stockLevel: 10,
    minStockThreshold: 2,
    unit: 'unit'
  },
  {
    id: 'p_head_02',
    tenantId: 't_biz_01',
    name: 'Cow Heels (Mazondo)',
    sku: 'HV-COW-001',
    category: 'Head & Hooves',
    subcategory: 'Hooves',
    price: 75.00,
    cost: 40.00,
    stockLevel: 40,
    minStockThreshold: 10,
    unit: 'kg'
  },

  // Liver & Lungs Category
  {
    id: 'p_liver_01',
    tenantId: 't_biz_01',
    name: 'Ox Liver',
    sku: 'LV-OX-001',
    category: 'Liver & Lungs',
    subcategory: 'Liver',
    price: 65.00,
    cost: 35.00,
    stockLevel: 30,
    minStockThreshold: 5,
    unit: 'kg'
  },

  // Layers Chicken Category
  {
    id: 'p_chicken_01',
    tenantId: 't_biz_01',
    name: 'Hardbody Chicken (Layer)',
    sku: 'CK-HARD-001',
    category: 'Layers Chicken',
    subcategory: 'Whole Bird',
    price: 85.00,
    cost: 50.00,
    stockLevel: 60,
    minStockThreshold: 15,
    unit: 'unit'
  },

  // Offals Category
  {
    id: 'p_offal_01',
    tenantId: 't_biz_01',
    name: 'Clean Tripe (Mogodu)',
    sku: 'OF-TRP-001',
    category: 'Offals',
    subcategory: 'Clean',
    price: 75.00,
    cost: 40.00,
    stockLevel: 50,
    minStockThreshold: 10,
    unit: 'kg'
  },

  // --- INALA PERFUMES PRODUCTS ---
  {
    id: 'p_perf_01',
    tenantId: 't_biz_02', // Perfumes
    name: 'Oud Wood Intense',
    sku: 'PERF-001',
    category: 'Perfume 600',
    subcategory: 'Oud',
    price: 600.00,
    cost: 150.00,
    stockLevel: 100, 
    minStockThreshold: 15,
    unit: 'unit',
  },
  {
    id: 'p_perf_02',
    tenantId: 't_biz_02', // Perfumes
    name: 'Vanilla Essence',
    sku: 'PERF-002',
    category: 'Perfume 350',
    subcategory: 'Sweet',
    price: 350.00,
    cost: 90.00,
    stockLevel: 50,
    minStockThreshold: 10,
    unit: 'unit',
  },
  {
    id: 'p_perf_03',
    tenantId: 't_biz_02', // Perfumes
    name: 'Ocean Breeze Mist',
    sku: 'PERF-003',
    category: 'Body Mist',
    subcategory: 'Fresh',
    price: 150.00,
    cost: 40.00,
    stockLevel: 200,
    minStockThreshold: 30,
    unit: 'unit',
  }
];

// 4. Customers
export let MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'c_001',
        tenantId: 't_biz_01',
        name: 'Mama Joy',
        phone: '+27 82 123 4567',
        creditLimit: 5000,
        currentDebt: 1200,
        lastPurchaseDate: '2025-02-15'
    },
    {
        id: 'c_002',
        tenantId: 't_biz_01',
        name: 'Sipho Nkosi',
        phone: '+27 71 987 6543',
        creditLimit: 2000,
        currentDebt: 0,
        lastPurchaseDate: '2025-01-20'
    },
    {
        id: 'c_003',
        tenantId: 't_biz_01',
        name: 'Tshepo Restaurant',
        phone: '+27 60 555 0000',
        creditLimit: 10000,
        currentDebt: 4500,
        lastPurchaseDate: '2025-02-18'
    }
];

// 5. Transactions
export let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1001',
    tenantId: 't_biz_01',
    branchId: 'b_001',
    customerId: 'c_001',
    customerName: 'Mama Joy',
    type: TransactionType.SALE,
    amount: 1200.00,
    currency: 'ZAR',
    method: PaymentMethod.CREDIT,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    reference: 'INV-0092',
    items: [{ productId: 'p_beef_01', name: 'Beef Stew', qty: 10, price: 95.00, subtotal: 950 }]
  },
  {
    id: 'tx_1002',
    tenantId: 't_biz_02',
    branchId: 'b_001',
    customerId: 'walk_in',
    customerName: 'Walk-in Customer',
    type: TransactionType.SALE,
    amount: 600.00,
    currency: 'ZAR',
    method: PaymentMethod.CASH,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    items: [{ productId: 'p_perf_01', name: 'Oud Wood Intense', qty: 1, price: 600.00, subtotal: 600 }]
  }
];

// Expenses
export let MOCK_EXPENSES: Expense[] = [
    {
        id: 'exp_001',
        tenantId: 't_biz_01',
        description: 'Monthly Shop Rental',
        category: 'Rent',
        amount: 8500.00,
        date: new Date(Date.now() - 86400000 * 15).toISOString(),
        status: 'PAID'
    },
    {
        id: 'exp_002',
        tenantId: 't_biz_01',
        description: 'Packaging Supplies',
        category: 'Supplies',
        amount: 1200.00,
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'PAID'
    },
    {
        id: 'exp_003',
        tenantId: 't_biz_01',
        description: 'Electricity Bill',
        category: 'Utilities',
        amount: 2500.00,
        date: new Date().toISOString(),
        status: 'PENDING'
    }
];

// --- Helpers to simulate Backend CRUD ---

export const addTransaction = (tx: Transaction) => {
    MOCK_TRANSACTIONS.unshift(tx);
    
    // Update Stock
    if (tx.items && tx.type === TransactionType.SALE) {
        tx.items.forEach(item => {
            const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
            if (product) {
                product.stockLevel -= item.qty;
            }
        });
    }

    // Update Credit Debt
    if (tx.method === PaymentMethod.CREDIT && tx.customerId) {
        const customer = MOCK_CUSTOMERS.find(c => c.id === tx.customerId);
        if (customer) {
            customer.currentDebt += tx.amount;
            customer.lastPurchaseDate = new Date().toISOString();
        }
    }
    
    // Debt Payment
    if (tx.type === TransactionType.DEBT_PAYMENT && tx.customerId) {
        const customer = MOCK_CUSTOMERS.find(c => c.id === tx.customerId);
        if (customer) {
            customer.currentDebt = Math.max(0, customer.currentDebt - tx.amount);
        }
    }
};

export const addCustomer = (customer: Customer) => {
    MOCK_CUSTOMERS.push(customer);
};

export const addProduct = (product: Product) => {
    MOCK_PRODUCTS.push(product);
};

export const updateProduct = (product: Product) => {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === product.id);
    if (index !== -1) {
        MOCK_PRODUCTS[index] = product;
    }
};

export const deleteProduct = (productId: string) => {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === productId);
    if (index !== -1) {
        MOCK_PRODUCTS.splice(index, 1);
    }
};

export const addExpense = (expense: Expense) => {
    MOCK_EXPENSES.unshift(expense);
}

export const addTenant = (tenant: Tenant) => {
    MOCK_TENANTS.push(tenant);
};

export const updateTenant = (tenant: Tenant) => {
    const index = MOCK_TENANTS.findIndex(t => t.id === tenant.id);
    if (index !== -1) {
        MOCK_TENANTS[index] = tenant;
    }
};

// ... other mock data ...
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
        email: 'julius@example.com',
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
        email: 'kabelo@example.com',
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
        email: 'coffee@music.com',
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
        email: 'gogo@example.com',
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
        email: 'sipho@example.com',
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

// 11. Email System Mock Data
export const MOCK_EMAILS: EmailMessage[] = [
  {
    id: 'em_001',
    from: 'system@inala.holdings',
    fromName: 'Inala ERP System',
    to: 'inala.holdingz@gmail.com',
    subject: 'Welcome to Inala ERP',
    body: 'Your account has been successfully created. Welcome aboard!',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'READ',
    folder: 'INBOX'
  },
  {
    id: 'em_002',
    from: 'payments@bank.com',
    fromName: 'Standard Bank',
    to: 'inala.holdingz@gmail.com',
    subject: 'Payment Notification: R 12,500.00',
    body: 'A new payment of R 12,500.00 has been received into your account from INALA BUTCHERY.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'UNREAD',
    folder: 'INBOX'
  },
  {
    id: 'em_003',
    from: 'inala.holdingz@gmail.com',
    to: 'julius@example.com',
    subject: 'Invoice #INV-0092',
    body: 'Please find attached your invoice for recent purchases at Inala Butchery.',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'SENT',
    folder: 'SENT'
  }
];

export const sendMockEmail = (email: Partial<EmailMessage>) => {
  const newEmail: EmailMessage = {
    id: `em_${Date.now()}`,
    from: 'inala.holdingz@gmail.com',
    fromName: 'Inala ERP',
    to: email.to!,
    subject: email.subject!,
    body: email.body!,
    timestamp: new Date().toISOString(),
    status: 'SENT',
    folder: 'SENT'
  };
  MOCK_EMAILS.unshift(newEmail);
  return newEmail;
};

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
