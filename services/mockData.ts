import { Tenant, User, UserRole, Product, Transaction, TransactionType, PaymentMethod, Loan, LoanStatus, POPStatus, POPDocument, Customer, TenantType, StokvelMember, Contribution, ContributionStatus, Payout, Expense, EmailMessage, EmailTemplate } from '../types';

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

// 1. Tenants
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't_stok_01',
    name: 'African Man Group',
    type: TenantType.STOKVEL,
    logoUrl: 'https://ui-avatars.com/api/?name=African+Man&background=0ea5e9&color=fff&size=128',
    primaryColor: '#0ea5e9',
    currency: 'ZAR',
    subscriptionTier: 'ENTERPRISE',
    isActive: true,
    target: 500000,
    category: 'Community'
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
    target: 20000,
    category: 'Community'
  },
  {
    id: 't_biz_01',
    name: 'Inala Butchery',
    type: TenantType.BUSINESS,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Butchery&background=dc2626&color=fff&size=128',
    primaryColor: '#dc2626', 
    currency: 'ZAR',
    subscriptionTier: 'PRO',
    isActive: true,
    category: 'Butchery'
  },
  {
    id: 't_biz_02',
    name: 'Inala Perfumes',
    type: TenantType.BUSINESS,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Perfumes&background=ec4899&color=fff&size=128',
    primaryColor: '#ec4899', 
    currency: 'ZAR',
    subscriptionTier: 'BASIC',
    isActive: true,
    category: 'Retail'
  },
  {
    id: 't_loan_01',
    name: 'Inala Loans',
    type: TenantType.LENDING,
    logoUrl: 'https://ui-avatars.com/api/?name=Inala+Loans&background=d97706&color=fff&size=128',
    primaryColor: '#d97706',
    currency: 'ZAR',
    subscriptionTier: 'ENTERPRISE',
    isActive: true,
    category: 'Financial Services'
  }
];

// 2. Users
export const INITIAL_USERS: User[] = [
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

// 3. Products
export const INITIAL_PRODUCTS: Product[] = [
  // Beef
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
    name: 'T-Bone Steak',
    sku: 'BF-TBONE-001',
    category: 'Beef',
    subcategory: 'Steak',
    price: 145.00,
    cost: 95.00,
    stockLevel: 30,
    minStockThreshold: 5,
    unit: 'kg'
  },
  // Chicken
  {
    id: 'p_chk_01',
    tenantId: 't_biz_01',
    name: 'Whole Chicken',
    sku: 'CHK-WH-001',
    category: 'Chicken',
    subcategory: 'Fresh',
    price: 65.00,
    cost: 45.00,
    stockLevel: 100,
    minStockThreshold: 20,
    unit: 'unit'
  },
  {
    id: 'p_chk_02',
    tenantId: 't_biz_01',
    name: 'Chicken Portions',
    sku: 'CHK-PORT-001',
    category: 'Chicken',
    subcategory: 'Frozen',
    price: 49.99,
    cost: 35.00,
    stockLevel: 80,
    minStockThreshold: 15,
    unit: 'kg'
  },
  // Pork
  {
    id: 'p_prk_01',
    tenantId: 't_biz_01',
    name: 'Pork Chops',
    sku: 'PRK-CHOP-001',
    category: 'Pork',
    subcategory: 'Chops',
    price: 85.00,
    cost: 60.00,
    stockLevel: 40,
    minStockThreshold: 10,
    unit: 'kg'
  },
  {
    id: 'p_prk_02',
    tenantId: 't_biz_01',
    name: 'Pork Ribs',
    sku: 'PRK-RIB-001',
    category: 'Pork',
    subcategory: 'Ribs',
    price: 110.00,
    cost: 80.00,
    stockLevel: 25,
    minStockThreshold: 5,
    unit: 'kg'
  },
  // Wors
  {
    id: 'p_wor_01',
    tenantId: 't_biz_01',
    name: 'Boerewors',
    sku: 'WOR-BOERE-001',
    category: 'Wors',
    subcategory: 'Sausage',
    price: 89.99,
    cost: 60.00,
    stockLevel: 60,
    minStockThreshold: 10,
    unit: 'kg'
  },
  // Perfume
  {
    id: 'p_perf_01',
    tenantId: 't_biz_02', 
    name: 'Oud Wood Intense',
    sku: 'PERF-001',
    category: 'Perfume 600',
    subcategory: 'Oud',
    price: 600.00,
    cost: 150.00,
    stockLevel: 100, 
    minStockThreshold: 15,
    unit: 'unit',
  }
];

// 4. Customers
export const INITIAL_CUSTOMERS: Customer[] = [
    {
        id: 'c_001',
        tenantId: 't_biz_01',
        name: 'Mama Joy',
        phone: '+27 82 123 4567',
        creditLimit: 5000,
        currentDebt: 1200,
        salesCount: 15,
        totalCredit: 1200,
        lastPurchaseDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
    },
    {
        id: 'c_002',
        tenantId: 't_biz_01',
        name: 'Sipho Nkosi',
        phone: '+27 71 987 6543',
        creditLimit: 2000,
        currentDebt: 0,
        salesCount: 8,
        totalCredit: 0,
        lastPurchaseDate: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString()
    },
    {
        id: 'c_003',
        tenantId: 't_biz_01',
        name: 'Tshepo Restaurant',
        phone: '+27 60 555 0000',
        creditLimit: 10000,
        currentDebt: 4500,
        salesCount: 42,
        totalCredit: 4500,
        lastPurchaseDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
    }
];

// Helper to determine the start of the current business cycle
export const getCycleStartDate = (now = new Date()): Date => {
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 5);
    // If today is before the 5th, the cycle started on the 5th of the previous month
    if (now.getDate() < 5) {
        cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
    cycleStart.setHours(0, 0, 0, 0);
    return cycleStart;
};

// EXPORTED GENERATOR: Creates fresh transactions for the CURRENT business cycle
export const generateCurrentCycleTransactions = (startDate?: Date, endDate?: Date): Transaction[] => {
    const txs: Transaction[] = [];
    const meatProducts = INITIAL_PRODUCTS.filter(p => p.tenantId === 't_biz_01');
    const methods = [PaymentMethod.CASH, PaymentMethod.EFT, PaymentMethod.MOMO, PaymentMethod.CREDIT];
    const customers = INITIAL_CUSTOMERS.filter(c => c.tenantId === 't_biz_01');
    
    const now = new Date();
    const start = startDate || getCycleStartDate(now);
    const end = endDate || now;

    // Generate 150 transactions to ensure density across categories
    for (let i = 0; i < 150; i++) {
        // Random date between cycleStart (inclusive) and Now (inclusive)
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        
        // Ensure within working hours
        date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        
        const items = [];
        const itemCount = Math.floor(Math.random() * 4) + 1;
        let total = 0;
        
        for(let j=0; j<itemCount; j++) {
            const p = meatProducts[Math.floor(Math.random() * meatProducts.length)];
            const qty = Math.floor(Math.random() * 3) + 1; 
            items.push({
                productId: p.id,
                name: p.name,
                qty: qty,
                price: p.price,
                subtotal: p.price * qty
            });
            total += p.price * qty;
        }

        const isKnownCustomer = Math.random() > 0.7;
        const customer = isKnownCustomer ? customers[Math.floor(Math.random() * customers.length)] : null;
        
        txs.push({
            id: `tx_auto_${Date.now()}_${i}`, // Unique ID
            tenantId: 't_biz_01',
            branchId: 'b_001',
            customerId: customer ? customer.id : 'walk_in',
            customerName: customer ? customer.name : 'Walk-in Customer',
            type: TransactionType.SALE,
            amount: total,
            currency: 'ZAR',
            method: methods[Math.floor(Math.random() * methods.length)],
            status: 'COMPLETED',
            timestamp: date.toISOString(),
            reference: `INV-${1000 + i}`,
            items: items
        });
    }
    return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// 5. Initial Transactions (Calls the generator to ensure freshness on load)
export const INITIAL_TRANSACTIONS: Transaction[] = generateCurrentCycleTransactions();

// Helper for expenses
const getDateInCurrentCycle = (dayOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset); 
    return d.toISOString();
}

// 6. Expenses (Fresh Dates)
export const INITIAL_EXPENSES: Expense[] = [
    {
        id: 'exp_001',
        tenantId: 't_biz_01',
        description: 'Monthly Shop Rental',
        category: 'Rent',
        amount: 8500.00,
        date: getDateInCurrentCycle(2),
        status: 'PAID'
    },
    {
        id: 'exp_002',
        tenantId: 't_biz_01',
        description: 'Packaging Supplies',
        category: 'Supplies',
        amount: 1200.00,
        date: getDateInCurrentCycle(5),
        status: 'PAID'
    },
    {
        id: 'exp_003',
        tenantId: 't_biz_01',
        description: 'Electricity Bill',
        category: 'Utilities',
        amount: 2500.00,
        date: getDateInCurrentCycle(1),
        status: 'PENDING'
    },
    {
        id: 'exp_004',
        tenantId: 't_biz_01',
        description: 'Ice Machine Repair',
        category: 'Maintenance',
        amount: 1230.00,
        date: getDateInCurrentCycle(10), 
        status: 'PAID'
    }
];

// 6. Loans
export const INITIAL_LOANS: Loan[] = [
  {
    id: 'ln_001',
    tenantId: 't_loan_01',
    customerId: 'c_001',
    customerName: 'Mama Joy',
    amount: 5000,
    interestRate: 15,
    totalRepayable: 5750,
    balanceRemaining: 5750,
    startDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), 
    status: LoanStatus.PENDING_APPROVAL,
    approvals: [
      { userId: 'u_003', role: UserRole.TREASURER, approved: true, date: new Date().toISOString() }
    ]
  },
  {
    id: 'ln_stok_01',
    tenantId: 't_stok_01',
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
export const INITIAL_POPS: POPDocument[] = [
    {
        id: 'pop_001',
        tenantId: 't_stok_01',
        uploadedBy: 'c_001',
        amount: 1200,
        reference: 'STOK-0092',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800', 
        status: POPStatus.PENDING,
        timestamp: new Date().toISOString()
    }
];

// 8. Stokvel Members
export const INITIAL_STOKVEL_MEMBERS: StokvelMember[] = [
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
    // ... other members truncated for brevity
];

// 9. Contributions
export const INITIAL_CONTRIBUTIONS: Contribution[] = [
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
];

// 10. Payouts
export const INITIAL_PAYOUTS: Payout[] = [
    {
        id: 'pay_001',
        tenantId: 't_stok_01',
        memberId: 'sm_003',
        amount: 120000,
        date: '2024-12-15',
        status: 'PAID',
        period: '2024-12'
    }
];

// 11. Emails
export const INITIAL_EMAILS: EmailMessage[] = [
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
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{tenantName}}',
    body: 'Hi {{name}},\n\nWelcome to {{tenantName}}! We are excited to have you on board.\n\nBest,\nThe Team',
    category: 'NOTIFICATION'
  },
];

export const sendMockEmail = (data: { to: string; subject: string; body: string }): EmailMessage => {
  return {
    id: `em_${Date.now()}`,
    from: 'system@inala.holdings',
    fromName: 'Me',
    to: data.to,
    subject: data.subject,
    body: data.body,
    timestamp: new Date().toISOString(),
    status: 'SENT',
    folder: 'SENT'
  };
};