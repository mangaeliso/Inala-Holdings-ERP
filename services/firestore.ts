import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch,
    getDoc,
    query,
    where,
    limit,
    Timestamp,
    addDoc,
    onSnapshot
} from 'firebase/firestore';
// Added Firebase Storage imports
import { getStorage, ref, uploadBytes, getDownloadURL, Storage } from 'firebase/storage';
import { db, app } from '../lib/db'; // Import app from db.ts for storage initialization
import { 
    Tenant, User, Product, Transaction, Customer, StokvelMember, 
    Contribution, Loan, Expense, EmailMessage, POPDocument, 
    TransactionType, TenantType, GlobalSettings as GlobalSettingsType,
    BrandingSettings, EmailSettings, BusinessCycleSettings, AccessSettings,
    UserRole, PaymentMethod, ContributionStatus, LoanStatus, POPStatus,
    AuditLog, BillingPlan, TenantBilling, Invoice, BillingInterval
} from '../types';

// Initialize Cloud Storage
const storage: Storage = getStorage(app);

// --- MOCK DATA (Moved from mockData.ts) ---

// In-memory global settings for fallback and initial state
export const INITIAL_GLOBAL_SETTINGS: GlobalSettingsType = {
    id: 'global',
    erpName: 'INALA ERP',
    erpLogoUrl: 'https://ui-avatars.com/api/?name=I&background=6366f1&color=fff&size=128&bold=true',
    primaryColor: '#6366f1', // default indigo
    secondaryColor: '#0ea5e9', // default sky
    supportEmail: 'support@inala.holdings',
    platformDomain: 'inala.holdings'
};

// In-memory base branding settings for fallback
export const INITIAL_BRANDING_SETTINGS: BrandingSettings = {
    displayName: 'Default Brand',
    primaryColor: INITIAL_GLOBAL_SETTINGS.primaryColor,
    secondaryColor: INITIAL_GLOBAL_SETTINGS.secondaryColor,
    logoUrl: INITIAL_GLOBAL_SETTINGS.erpLogoUrl,
    slogan: 'Powered by Inala'
};

// --- BILLING MOCK DATA ---
export const INITIAL_PLANS: BillingPlan[] = [
    {
        id: 'plan_basic',
        name: 'Basic',
        description: 'Essential tools for small businesses.',
        price: 299,
        currency: 'ZAR',
        interval: BillingInterval.MONTHLY,
        features: ['Up to 5 Users', 'Basic Reports', 'Community Support'],
        isActive: true,
        tier: 'BASIC'
    },
    {
        id: 'plan_pro',
        name: 'Professional',
        description: 'Advanced analytics and higher limits.',
        price: 799,
        currency: 'ZAR',
        interval: BillingInterval.MONTHLY,
        features: ['Up to 20 Users', 'Advanced BI Reports', 'Priority Support', 'API Access'],
        isActive: true,
        tier: 'PRO'
    },
    {
        id: 'plan_enterprise',
        name: 'Enterprise',
        description: 'Unlimited scale for large organizations.',
        price: 1999,
        currency: 'ZAR',
        interval: BillingInterval.MONTHLY,
        features: ['Unlimited Users', 'Dedicated Account Manager', 'Custom Integrations', 'SLA'],
        isActive: true,
        tier: 'ENTERPRISE'
    }
];

export const INALA_HOLDINGS_TENANT: Tenant = {
    id: 'global',
    name: 'INALA HOLDINGS',
    type: TenantType.BUSINESS,
    isActive: true,
    category: 'Headquarters',
    branding: INITIAL_BRANDING_SETTINGS,
    emailConfig: {
        senderEmail: 'admin@inala.holdings',
        templates: [], // Should be loaded dynamically
    },
    posSettings: {
        receiptFooter: 'Thank you for your business!',
        taxRate: 15,
        enableCash: true,
        enableCard: true,
        enableCredit: true,
        autoPrint: true,
        currencySymbol: 'R',
        numberFormat: 'R_COMMA_DECIMAL'
    },
    cycleSettings: {
        startDay: 5,
        endDay: 4,
        fiscalStartMonth: 1,
        currencySymbol: 'R' // Added missing currencySymbol
    }
};

export const INITIAL_USERS: User[] = [
    // Fix: Used UserRole enum
    { id: 'u_global_01', tenantId: 'global', name: 'Super Admin', email: 'admin@inala.holdings', phone: '+27712345678', role: UserRole.SUPER_ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=SA&background=0f172a&color=fff', isActive: true },
    { id: 'u_tenant_01', tenantId: 't_biz_01', name: 'Tenant Admin', email: 'admin@butchery.com', phone: '+27821234567', role: UserRole.TENANT_ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=TA&background=6366f1&color=fff', isActive: true },
    { id: 'u_stokvel_01', tenantId: 't_stok_01', name: 'Stokvel Manager', email: 'manager@stokvel.com', phone: '+27612345678', role: UserRole.BRANCH_MANAGER, avatarUrl: 'https://ui-avatars.com/api/?name=SM&background=0ea5e9&color=fff', isActive: true },
    { id: 'u_cashier_01', tenantId: 't_biz_01', name: 'Butchery Cashier', email: 'cashier@butchery.com', phone: '+27731112222', role: UserRole.CASHIER, avatarUrl: 'https://ui-avatars.com/api/?name=BC&background=f97316&color=fff', isActive: true },
];

export const INITIAL_TENANTS: Tenant[] = [
    {
        id: 't_biz_01',
        name: 'African Man Group Butchery',
        type: TenantType.BUSINESS,
        isActive: true,
        category: 'Butchery',
        regNumber: '2020/000123/07',
        address: '123 Main St, Johannesburg',
        contactNumber: '+27115551234',
        email: 'info@butchery.com',
        website: 'www.butchery.com',
        branding: {
            displayName: 'African Man Group Butchery',
            primaryColor: '#6366f1',
            secondaryColor: '#0ea5e9',
            logoUrl: 'https://ui-avatars.com/api/?name=AMG&background=6366f1&color=fff',
            slogan: 'Quality Meats for Less'
        },
        posSettings: {
            receiptFooter: 'Thank you for choosing AMG!', taxRate: 15, enableCash: true, enableCard: true, enableCredit: true, autoPrint: false,
            currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL' // Added missing currencySymbol and numberFormat
        },
        cycleSettings: { startDay: 5, endDay: 4, fiscalStartMonth: 1, currencySymbol: 'R' }, // Added missing currencySymbol
        access: { subscriptionTier: 'BASIC' } // Added default access settings
    },
    {
        id: 't_stok_01',
        name: 'Sisonke Savings Stokvel',
        type: TenantType.STOKVEL,
        isActive: true,
        category: 'Community Savings',
        address: 'Online Group',
        contactNumber: '+27876543210',
        email: 'info@sisonke.org',
        branding: {
            displayName: 'Sisonke Savings Stokvel',
            primaryColor: '#0ea5e9',
            secondaryColor: '#f97316',
            logoUrl: 'https://ui-avatars.com/api/?name=SS&background=0ea5e9&color=fff',
            slogan: 'Saving Together for a Brighter Future'
        },
        target: 100000,
        cycleSettings: { startDay: 25, endDay: 24, fiscalStartMonth: 1, currencySymbol: 'R' }, // Added missing currencySymbol
        posSettings: { // Added default posSettings for Stokvel
            receiptFooter: 'Thank you for your contribution!', taxRate: 0, enableCash: true, enableCard: false, enableCredit: false, autoPrint: false,
            currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL'
        },
        access: { subscriptionTier: 'BASIC' } // Added default access settings
    },
    {
        id: 't_lending_01',
        name: 'Capital Connect Lending',
        type: TenantType.LENDING,
        isActive: true,
        category: 'Microfinance',
        address: 'Unit 7, Financial Plaza, Cape Town',
        contactNumber: '+27211234567',
        email: 'loans@capitalconnect.co.za',
        branding: {
            displayName: 'Capital Connect Lending',
            primaryColor: '#ef4444',
            secondaryColor: '#eab308',
            logoUrl: 'https://ui-avatars.com/api/?name=CC&background=ef4444&color=fff',
            slogan: 'Your Partner in Growth'
        },
        cycleSettings: { startDay: 1, endDay: 31, fiscalStartMonth: 1, currencySymbol: 'R' }, // Added missing currencySymbol
        posSettings: { // Added default posSettings for Lending
            receiptFooter: 'Capital Connect - Your Financial Partner!', taxRate: 0, enableCash: true, enableCard: true, enableCredit: true, autoPrint: false,
            currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL'
        },
        access: { subscriptionTier: 'BASIC' } // Added default access settings
    }
];


export const INITIAL_PRODUCTS: Product[] = [
    { id: 'p_001', tenantId: 't_biz_01', name: 'Beef Sirloin Steak', sku: 'BF-S001', category: 'Beef', subcategory: 'Steak', price: 120.00, cost: 80.00, stockLevel: 50, minStockThreshold: 10, unit: 'kg' },
    { id: 'p_002', tenantId: 't_biz_01', name: 'Boerewors (Traditional)', sku: 'WS-T001', category: 'Wors', subcategory: 'Sausage', price: 85.00, cost: 55.00, stockLevel: 100, minStockThreshold: 20, unit: 'kg' },
    { id: 'p_003', tenantId: 't_biz_01', name: 'Chicken Drumsticks', sku: 'CK-D001', category: 'Chicken', subcategory: 'Poultry', price: 60.00, cost: 40.00, stockLevel: 150, minStockThreshold: 30, unit: 'kg' },
    { id: 'p_004', tenantId: 't_biz_01', name: 'Pork Chops', sku: 'PK-C001', category: 'Pork', subcategory: 'Chops', price: 95.00, cost: 65.00, stockLevel: 75, minStockThreshold: 15, unit: 'kg' },
    { id: 'p_005', tenantId: 't_biz_01', name: 'Lamb Ribs', sku: 'LB-R001', category: 'Lamb', subcategory: 'Ribs', price: 150.00, cost: 100.00, stockLevel: 30, minStockThreshold: 5, unit: 'kg' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
    { id: 'c_001', tenantId: 't_biz_01', name: 'Sipho Dlamini', phone: '+27721234567', email: 'sipho@example.com', creditLimit: 2000, currentDebt: 500, lastPurchaseDate: '2024-03-10T14:30:00Z', salesCount: 5, totalCredit: 1500 },
    { id: 'c_002', tenantId: 't_biz_01', name: 'Thandiwe Mkhize', phone: '+27837654321', email: 'thandi@example.com', creditLimit: 1000, currentDebt: 0, lastPurchaseDate: '2024-03-05T11:00:00Z', salesCount: 8, totalCredit: 1000 },
    { id: 'c_003', tenantId: 't_biz_01', name: 'Peter Jones', phone: '+27601239876', email: 'peter@example.com', creditLimit: 3000, currentDebt: 1200, lastPurchaseDate: '2024-03-12T09:15:00Z', salesCount: 3, totalCredit: 1800 },
    { id: 'c_004', tenantId: 't_biz_01', name: 'Nomusa Ncube', phone: '+27719876543', email: 'nomusa@example.com', creditLimit: 500, currentDebt: 0, lastPurchaseDate: '2024-02-28T16:00:00Z', salesCount: 12, totalCredit: 500 },
    { id: 'c_005', tenantId: 't_biz_01', name: 'Mohammed Ali', phone: '+27825551111', email: 'mohammed@example.com', creditLimit: 1500, currentDebt: 750, lastPurchaseDate: '2024-03-11T10:45:00Z', salesCount: 6, totalCredit: 750 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
    // Fix: Used PaymentMethod enum
    { id: 'tx_001', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_001', customerName: 'Sipho Dlamini', type: TransactionType.SALE, amount: 250.00, currency: 'ZAR', method: PaymentMethod.CREDIT, status: 'COMPLETED', timestamp: '2024-03-10T14:30:00Z', items: [{ productId: 'p_001', name: 'Beef Sirloin Steak', qty: 1, price: 120, subtotal: 120 }, { productId: 'p_002', name: 'Boerewors (Traditional)', qty: 1, price: 85, subtotal: 85 }] },
    { id: 'tx_002', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_002', customerName: 'Thandiwe Mkhize', type: TransactionType.SALE, amount: 180.00, currency: 'ZAR', method: PaymentMethod.CASH, status: 'COMPLETED', timestamp: '2024-03-05T11:00:00Z', items: [{ productId: 'p_003', name: 'Chicken Drumsticks', qty: 2, price: 60, subtotal: 120 }] },
    { id: 'tx_003', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_003', customerName: 'Peter Jones', type: TransactionType.SALE, amount: 300.00, currency: 'ZAR', method: PaymentMethod.CREDIT, status: 'COMPLETED', timestamp: '2024-03-12T09:15:00Z', items: [{ productId: 'p_001', name: 'Beef Sirloin Steak', qty: 2, price: 120, subtotal: 240 }] },
    { id: 'tx_004', tenantId: 't_biz_01', branchId: 'b_001', type: TransactionType.SALE, amount: 95.00, currency: 'ZAR', method: PaymentMethod.EFT, status: 'COMPLETED', timestamp: '2024-03-08T17:45:00Z', items: [{ productId: 'p_004', name: 'Pork Chops', qty: 1, price: 95, subtotal: 95 }] },
    { id: 'tx_005', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_005', customerName: 'Mohammed Ali', type: TransactionType.SALE, amount: 200.00, currency: 'ZAR', method: PaymentMethod.CREDIT, status: 'COMPLETED', timestamp: '2024-03-11T10:45:00Z', items: [{ productId: 'p_002', name: 'Boerewors (Traditional)', qty: 1, price: 85, subtotal: 85 }] },
    { id: 'tx_006', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_001', customerName: 'Sipho Dlamini', type: TransactionType.DEBT_PAYMENT, amount: 100.00, currency: 'ZAR', method: PaymentMethod.CASH, status: 'COMPLETED', timestamp: '2024-03-15T10:00:00Z' },
    { id: 'tx_007', tenantId: 't_biz_01', branchId: 'b_001', type: TransactionType.SALE, amount: 75.00, currency: 'ZAR', method: PaymentMethod.CASH, status: 'COMPLETED', timestamp: '2024-03-16T13:00:00Z', items: [{ productId: 'p_003', name: 'Chicken Drumsticks', qty: 1, price: 60, subtotal: 60 }] },
    { id: 'tx_008', tenantId: 't_biz_01', branchId: 'b_001', type: TransactionType.SALE, amount: 120.00, currency: 'ZAR', method: PaymentMethod.EFT, status: 'COMPLETED', timestamp: '2024-03-17T11:30:00Z', items: [{ productId: 'p_001', name: 'Beef Sirloin Steak', qty: 1, price: 120, subtotal: 120 }] },
    { id: 'tx_009', tenantId: 't_biz_01', branchId: 'b_001', type: TransactionType.SALE, amount: 60.00, currency: 'ZAR', method: PaymentMethod.MOMO, status: 'COMPLETED', timestamp: '2024-03-18T14:00:00Z', items: [{ productId: 'p_003', name: 'Chicken Drumsticks', qty: 1, price: 60, subtotal: 60 }] },
    { id: 'tx_010', tenantId: 't_biz_01', branchId: 'b_001', customerId: 'c_003', customerName: 'Peter Jones', type: TransactionType.DEBT_PAYMENT, amount: 50.00, currency: 'ZAR', method: PaymentMethod.EFT, status: 'COMPLETED', timestamp: '2024-03-19T09:00:00Z' },
];

export const INITIAL_EXPENSES: Expense[] = [
    { id: 'exp_001', tenantId: 't_biz_01', description: 'Monthly Rent', category: 'Rent', amount: 15000.00, date: '2024-03-01', status: 'PAID' },
    { id: 'exp_002', tenantId: 't_biz_01', description: 'Electricity Bill', category: 'Utilities', amount: 2500.00, date: '2024-03-08', status: 'PAID' },
    { id: 'exp_003', tenantId: 't_biz_01', description: 'Butchery Supplies', category: 'Supplies', amount: 3000.00, date: '2024-03-10', status: 'PAID' },
    { id: 'exp_004', tenantId: 't_biz_01', description: 'Staff Salaries (March)', category: 'Salaries', amount: 20000.00, date: '2024-03-25', status: 'PAID' },
    { id: 'exp_005', tenantId: 't_biz_01', description: 'Marketing Campaign', category: 'Marketing', amount: 1500.00, date: '2024-03-15', status: 'PAID' },
];

export const INITIAL_STOKVEL_MEMBERS: StokvelMember[] = [
    { id: 'sm_001', tenantId: 't_stok_01', name: 'Lindiwe Ngcobo', phone: '+27761112222', email: 'lindiwe@example.com', joinDate: '2023-01-15', monthlyPledge: 1000, totalContributed: 15000, payoutQueuePosition: 1, status: 'ACTIVE', avatarUrl: 'https://ui-avatars.com/api/?name=Lindiwe+Ngcobo&background=random' },
    { id: 'sm_002', tenantId: 't_stok_01', name: 'Musa Zulu', phone: '+27833334444', email: 'musa@example.com', joinDate: '2023-02-20', monthlyPledge: 1000, totalContributed: 14000, payoutQueuePosition: 2, status: 'ACTIVE', avatarUrl: 'https://ui-avatars.com/api/?name=Musa+Zulu&background=random' },
    { id: 'sm_003', tenantId: 't_stok_01', name: 'Zandile Khumalo', phone: '+27615556666', email: 'zandile@example.com', joinDate: '2023-03-10', monthlyPledge: 1000, totalContributed: 13000, payoutQueuePosition: 3, status: 'ACTIVE', avatarUrl: 'https://ui-avatars.com/api/?name=Zandile+Khumalo&background=random' },
    { id: 'sm_004', tenantId: 't_stok_01', name: 'Sizwe Nxumalo', phone: '+27727778888', email: 'sizwe@example.com', joinDate: '2023-04-01', monthlyPledge: 1000, totalContributed: 12000, payoutQueuePosition: 4, status: 'ACTIVE', avatarUrl: 'https://ui-avatars.com/api/?name=Sizwe+Nxumalo&background=random' },
];

export const INITIAL_CONTRIBUTIONS: Contribution[] = [
    // Fix: Used ContributionStatus and PaymentMethod enums
    { id: 'con_001', tenantId: 't_stok_01', memberId: 'sm_001', amount: 1000, date: '2024-03-01T08:00:00Z', period: '2024-03', status: ContributionStatus.PAID, method: PaymentMethod.EFT },
    { id: 'con_002', tenantId: 't_stok_01', memberId: 'sm_002', amount: 1000, date: '2024-03-02T09:00:00Z', period: '2024-03', status: ContributionStatus.PAID, method: PaymentMethod.CASH },
    { id: 'con_003', tenantId: 't_stok_01', memberId: 'sm_003', amount: 1000, date: '2024-03-03T10:00:00Z', period: '2024-03', status: ContributionStatus.PAID, method: PaymentMethod.MOMO },
    { id: 'con_004', tenantId: 't_stok_01', memberId: 'sm_004', amount: 1000, date: '2024-03-04T11:00:00Z', period: '2024-03', status: ContributionStatus.PAID, method: PaymentMethod.EFT },
];

export const INITIAL_LOANS: Loan[] = [
    // Fix: Used LoanStatus enum
    { id: 'ln_001', tenantId: 't_stok_01', customerId: 'sm_001', customerName: 'Lindiwe Ngcobo', amount: 5000, interestRate: 5, totalRepayable: 5250, balanceRemaining: 3000, startDate: '2023-10-01', dueDate: '2024-04-01', status: LoanStatus.ACTIVE, approvals: [] },
    { id: 'ln_002', tenantId: 't_stok_01', customerId: 'sm_003', customerName: 'Zandile Khumalo', amount: 3000, interestRate: 7, totalRepayable: 3210, balanceRemaining: 1500, startDate: '2023-11-15', dueDate: '2024-05-15', status: LoanStatus.ACTIVE, approvals: [] },
];

export const INITIAL_POPS: POPDocument[] = [
    // Fix: Used POPStatus enum
    { id: 'pop_001', tenantId: 't_biz_01', uploadedBy: 'u_cashier_01', amount: 1500.00, reference: 'INV-20240315-001', imageUrl: 'https://picsum.photos/seed/pop1/400/300', ocrData: 'INV 001, Amount 1500.00', status: POPStatus.PENDING, timestamp: '2024-03-15T10:00:00Z' },
    { id: 'pop_002', tenantId: 't_biz_01', uploadedBy: 'u_cashier_01', amount: 250.50, reference: 'REF-XYZ-789', imageUrl: 'https://picsum.photos/seed/pop2/400/300', ocrData: 'REF XYZ, Amount 250.50', status: POPStatus.VERIFIED, timestamp: '2024-03-14T15:30:00Z' },
    { id: 'pop_003', tenantId: 't_stok_01', uploadedBy: 'sm_001', amount: 1000.00, reference: 'STK-CON-MAR-LNDW', imageUrl: 'https://picsum.photos/seed/pop3/400/300', ocrData: 'Stokvel Contribution, March, Lindiwe', status: POPStatus.PENDING, timestamp: '2024-03-01T08:00:00Z' },
];

export const INITIAL_EMAILS: EmailMessage[] = [
    {
        id: 'em_001',
        from: 'info@butchery.com',
        fromName: 'AMG Butchery',
        to: 'sipho@example.com',
        subject: 'Your Latest Invoice from AMG Butchery',
        body: 'Dear Sipho, here is your invoice for your recent purchase. Total: R250.00. Due date: 2024-03-25. Thank you!',
        timestamp: '2024-03-10T15:00:00Z',
        status: 'SENT',
        folder: 'SENT'
    },
    {
        id: 'em_002',
        from: 'support@inala.holdings',
        fromName: 'Inala Support',
        to: 'admin@butchery.com',
        subject: 'New Feature Alert: POS Integration',
        body: 'Hi Admin, we have rolled out a new POS integration feature. Check it out!',
        timestamp: '2024-03-12T09:30:00Z',
        status: 'UNREAD',
        folder: 'INBOX'
    },
    {
        id: 'em_003',
        from: 'no-reply@sisonke.org',
        fromName: 'Sisonke Stokvel',
        to: 'lindiwe@example.com',
        subject: 'Monthly Contribution Reminder',
        body: 'Hi Lindiwe, this is a reminder for your R1000 monthly contribution due on 2024-03-25.',
        timestamp: '2024-03-20T08:00:00Z',
        status: 'SENT',
        folder: 'SENT'
    },
    {
        id: 'em_004',
        from: 'info@butchery.com',
        fromName: 'AMG Butchery',
        to: 'admin@butchery.com',
        subject: 'Low Stock Alert: Beef Sirloin Steak',
        body: 'Dear Admin, the stock level for Beef Sirloin Steak is below threshold. Please reorder.',
        timestamp: '2024-03-22T11:00:00Z',
        status: 'UNREAD',
        folder: 'INBOX'
    }
];

export const getCycleStartDate = (): Date => {
    const now = new Date();
    const cycleStartDay = 5; // Assuming 5th of the month
    let year = now.getFullYear();
    let month = now.getMonth();

    // If current day is before the cycle start day, the cycle started in the previous month
    if (now.getDate() < cycleStartDay) {
        month -= 1;
        if (month < 0) {
            month = 11; // December
            year -= 1;
        }
    }
    return new Date(year, month, cycleStartDay, 0, 0, 0, 0);
};

export const generateCurrentCycleTransactions = (startDate: Date, endDate: Date): Transaction[] => {
    const transactions: Transaction[] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    let currentDay = new Date(startDate.getTime());

    while (currentDay <= endDate) {
        // Random number of transactions per day
        const numTransactions = Math.floor(Math.random() * 5) + 1; 

        for (let i = 0; i < numTransactions; i++) {
            const customer = INITIAL_CUSTOMERS[Math.floor(Math.random() * INITIAL_CUSTOMERS.length)];
            const isCredit = Math.random() > 0.7; // 30% chance of credit sale
            const isDebtPayment = Math.random() > 0.85 && customer.currentDebt > 0; // 15% chance of debt payment if customer has debt

            let type: TransactionType = TransactionType.SALE;
            // Fix: Corrected type to PaymentMethod
            let method: PaymentMethod = PaymentMethod.CASH;
            let amount = Math.floor(Math.random() * 500) + 50; // Random amount between 50 and 550

            if (isDebtPayment) {
                type = TransactionType.DEBT_PAYMENT;
                amount = Math.min(amount, customer.currentDebt); // Don't pay more than owed
                method = [PaymentMethod.CASH, PaymentMethod.EFT, PaymentMethod.MOMO][Math.floor(Math.random() * 3)]; // No credit for debt payment
            } else if (isCredit) {
                method = PaymentMethod.CREDIT;
            } else {
                method = [PaymentMethod.CASH, PaymentMethod.EFT, PaymentMethod.MOMO][Math.floor(Math.random() * 3)];
            }

            const transaction: Transaction = {
                id: `tx_${Date.now()}_${transactions.length}`,
                tenantId: 't_biz_01',
                branchId: 'b_001',
                customerId: customer.id,
                customerName: customer.name,
                type: type,
                amount: amount,
                currency: 'ZAR',
                method: method,
                status: 'COMPLETED',
                timestamp: new Date(currentDay.getTime() + Math.random() * msPerDay).toISOString(), // Random time during the day
                reference: `INV-${Math.floor(Math.random() * 10000)}`,
                items: type === TransactionType.SALE ? [{ productId: 'p_xxx', name: 'Random Item', qty: 1, price: amount, subtotal: amount }] : undefined
            };
            transactions.push(transaction);
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }
    return transactions;
};


// --- Helper: Dynamic Business Collection Refs ---
const getBusinessCollection = (businessId: string, collectionName: string) => {
    return collection(db, 'tenants', businessId, collectionName);
};

// Global collections
const globalTenantsRef = collection(db, 'tenants');
const globalUsersRef = collection(db, 'users');
const globalPopsRef = collection(db, 'pops');
const auditLogsRef = collection(db, 'audit_logs');
const billingPlansRef = collection(db, 'billing_plans'); // Added
const tenantBillingRef = collection(db, 'tenant_billing'); // Added

// Tenant-specific sub-collections for settings
const getTenantBrandingRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'branding');
const getTenantEmailSettingsRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'email');
const getTenantPOSSettingsRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'pos');
const getTenantCycleSettingsRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'cycle');
const getTenantNotificationSettingsRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'notifications');
const getTenantAccessSettingsRef = (tenantId: string) => doc(db, 'tenants', tenantId, 'settings', 'access'); // Added


// --- Helper: Normalization ---
const normalizeDate = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    if (date?.toDate && typeof date.toDate === 'function') return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    return new Date().toISOString();
};

const normalizeNumber = (val: any): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

const normalizeString = (val: any): string => {
    return val ? String(val) : '';
};

// Helper to extract top-level tenant fields from a full Tenant object (excluding sub-documents)
const extractTopLevelTenantFields = (tenant: Partial<Tenant>): Partial<Tenant> => {
    const { branding, access, emailConfig, notifications, posSettings, cycleSettings, dataSettings, securitySettings, ...topLevelFields } = tenant;
    return topLevelFields;
};


// --- Fallback Helper ---
async function fetchWithFallback<T>(
    fetchFn: () => Promise<T[]>, 
    fallbackData: T[]
): Promise<T[]> {
    try {
        const data = await fetchFn();
        return data.length > 0 ? data : fallbackData;
    } catch (error) {
        console.warn("Firestore fetch failed, using fallback data:", error);
        return fallbackData;
    }
}

async function fetchDocWithFallback<T>(
    docRef: any, // Firebase DocumentReference
    fallbackData: T
): Promise<T> {
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as T;
        }
        return fallbackData;
    } catch (error) {
        console.warn(`Firestore fetch for doc ${docRef.id} failed, using fallback data:`, error);
        return fallbackData;
    }
}

// --- GLOBAL SETTINGS ---
export const getGlobalSettings = async (): Promise<GlobalSettingsType> => {
    try {
        const docRef = doc(db, 'global', 'settings');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            // Deep merge with defaults to ensure no fields are undefined
            return { ...INITIAL_GLOBAL_SETTINGS, ...snap.data() } as GlobalSettingsType;
        }
        return INITIAL_GLOBAL_SETTINGS;
    } catch (e) {
        console.error("Failed to fetch global settings:", e);
        return INITIAL_GLOBAL_SETTINGS;
    }
};

export const ensureGlobalSettings = async (): Promise<GlobalSettingsType> => {
    const docRef = doc(db, 'global', 'settings');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        await setDoc(docRef, INITIAL_GLOBAL_SETTINGS);
        return INITIAL_GLOBAL_SETTINGS;
    }
    // Return existing data merged with defaults to handle any schema updates
    return { ...INITIAL_GLOBAL_SETTINGS, ...snap.data() } as GlobalSettingsType;
};

// Added: Function to update global settings
export const updateGlobalSettings = async (settings: Partial<GlobalSettingsType>): Promise<boolean> => {
    try {
        await setDoc(doc(db, 'global', 'settings'), settings, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating global settings", e);
        return false;
    }
};

// Added: Function to upload files to Firebase Storage
export const uploadFileToFirebaseStorage = async (file: File, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        console.error("Error uploading file to Firebase Storage", e);
        throw e; // Re-throw to handle in UI
    }
};

// --- SYSTEM BRANDING (SAFE ADDITION) ---
export const getSystemBranding = async (): Promise<{ logoUrl: string } | null> => {
    return fetchDocWithFallback<{ logoUrl: string }>(doc(db, 'system_settings', 'branding'), { logoUrl: '' });
};

export const updateSystemBranding = async (data: { logoUrl: string }) => {
    try {
        await setDoc(doc(db, 'system_settings', 'branding'), data, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating system branding", e);
        return false;
    }
};

// --- SYSTEM EMAILS (TRIGGER) ---
export const triggerSystemEmail = async (type: string, data: any) => {
    // Write to a 'mail_triggers' collection which Cloud Functions listen to
    // This simulates calling the backend without directly importing 'firebase-functions' client SDK
    try {
        await addDoc(collection(db, 'mail_triggers'), {
            type,
            data,
            timestamp: new Date().toISOString(),
            status: 'PENDING'
        });
        return true;
    } catch (e) {
        console.error("Failed to trigger email", e);
        return false;
    }
};


// --- TENANT SETTINGS (BRANDING, EMAIL, etc.) ---
export const getTenantBrandingSettings = async (tenantId: string): Promise<BrandingSettings | null> => {
    if (tenantId === 'global') return INITIAL_BRANDING_SETTINGS; // Super Admin uses global branding
    const defaultBranding: BrandingSettings = { ...INITIAL_BRANDING_SETTINGS, displayName: 'Default Tenant' };
    return fetchDocWithFallback(getTenantBrandingRef(tenantId), defaultBranding);
};

export const updateTenantBrandingSettings = async (tenantId: string, branding: BrandingSettings) => {
    try {
        await setDoc(getTenantBrandingRef(tenantId), branding, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant branding settings", e);
        return false;
    }
};

export const getTenantAccessSettings = async (tenantId: string): Promise<AccessSettings | null> => { // Added
    const defaultAccess: AccessSettings = { subscriptionTier: 'BASIC' };
    return fetchDocWithFallback(getTenantAccessSettingsRef(tenantId), defaultAccess);
};

export const updateTenantAccessSettings = async (tenantId: string, access: AccessSettings) => { // Added
    try {
        await setDoc(getTenantAccessSettingsRef(tenantId), access, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant access settings", e);
        return false;
    }
};

export const getTenantEmailSettings = async (tenantId: string): Promise<EmailSettings | null> => {
    const defaultEmailSettings: EmailSettings = { senderEmail: 'no-reply@inala.holdings', templates: [] };
    return fetchDocWithFallback(getTenantEmailSettingsRef(tenantId), defaultEmailSettings);
};

export const updateTenantEmailSettings = async (tenantId: string, emailSettings: EmailSettings) => {
    try {
        await setDoc(getTenantEmailSettingsRef(tenantId), emailSettings, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant email settings", e);
        return false;
    }
};

export const getTenantPOSSettings = async (tenantId: string): Promise<Tenant['posSettings'] | null> => {
    const defaultPOS: Tenant['posSettings'] = { 
        receiptFooter: 'Thank you!', taxRate: 15, enableCash: true, enableCard: true, 
        enableCredit: true, autoPrint: true, currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL' 
    };
    return fetchDocWithFallback(getTenantPOSSettingsRef(tenantId), defaultPOS);
};

export const updateTenantPOSSettings = async (tenantId: string, posSettings: Tenant['posSettings']) => {
    try {
        await setDoc(getTenantPOSSettingsRef(tenantId), posSettings, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant POS settings", e);
        return false;
    }
};

export const getTenantCycleSettings = async (tenantId: string): Promise<BusinessCycleSettings | null> => {
    const defaultCycle: BusinessCycleSettings = { startDay: 5, endDay: 4, fiscalStartMonth: 1, currencySymbol: 'R' };
    return fetchDocWithFallback(getTenantCycleSettingsRef(tenantId), defaultCycle);
};

export const updateTenantCycleSettings = async (tenantId: string, cycleSettings: BusinessCycleSettings) => {
    try {
        await setDoc(getTenantCycleSettingsRef(tenantId), cycleSettings, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant cycle settings", e);
        return false;
    }
};

export const getTenantNotificationSettings = async (tenantId: string): Promise<Tenant['notifications'] | null> => {
    const defaultNotifications: Tenant['notifications'] = {
        emailNewSale: true, smsPayment: false, dailySummary: true, 
        lowStock: true, creditWarning: true, autoMonthlyReport: true, recipients: []
    };
    return fetchDocWithFallback(getTenantNotificationSettingsRef(tenantId), defaultNotifications);
};

export const updateTenantNotificationSettings = async (tenantId: string, notifications: Tenant['notifications']) => {
    try {
        await setDoc(getTenantNotificationSettingsRef(tenantId), notifications, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant notification settings", e);
        return false;
    }
};


// --- CYCLE CHECKER & SEEDER ---
export const ensureCurrentCycleData = async () => {
    try {
        const targetBusinessId = 't_biz_01'; // Default butchery
        const txRef = getBusinessCollection(targetBusinessId, 'transactions');
        const cycleStart = getCycleStartDate();
        
        const q = query(txRef, where('timestamp', '>=', cycleStart.toISOString()), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            console.log(`No transactions found for cycle starting ${cycleStart.toLocaleDateString()}. Seeding fresh data...`);
            const batch = writeBatch(db);
            const freshTxs = generateCurrentCycleTransactions(cycleStart, new Date());
            
            freshTxs.forEach(t => {
                const docRef = doc(txRef, t.id);
                // Ensure timestamp is stored as ISO string if not already
                const data = { ...t, timestamp: t.timestamp }; 
                batch.set(docRef, data);
                if (t.type === TransactionType.SALE) {
                     const saleRef = doc(getBusinessCollection(targetBusinessId, 'sales'), t.id);
                     batch.set(saleRef, data);
                }
            });
            
            await batch.commit();
            console.log(`Seeded ${freshTxs.length} fresh transactions.`);
        }
    } catch (error) {
        console.warn('Auto-seed check failed:', error);
    }
};

export const migrateTopLevelToButchery = async () => {
    await ensureCurrentCycleData();
};

// --- BILLING SERVICES ---

export const getBillingPlans = async (): Promise<BillingPlan[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(billingPlansRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as BillingPlan));
    }, INITIAL_PLANS);
};

export const saveBillingPlan = async (plan: BillingPlan) => {
    try {
        await setDoc(doc(billingPlansRef, plan.id), plan);
        return true;
    } catch (e) {
        console.error("Error saving billing plan", e);
        return false;
    }
};

export const getTenantBilling = async (tenantId: string): Promise<TenantBilling> => {
    const defaultBilling: TenantBilling = {
        tenantId,
        planId: 'plan_basic',
        status: 'active',
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        cancelAtPeriodEnd: false,
        paymentMethod: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2026
        }
    };
    return fetchDocWithFallback(doc(tenantBillingRef, tenantId), defaultBilling);
};

export const updateTenantBilling = async (billing: TenantBilling) => {
    try {
        await setDoc(doc(tenantBillingRef, billing.tenantId), billing, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating tenant billing", e);
        return false;
    }
};

export const getInvoices = async (tenantId: string): Promise<Invoice[]> => {
    // Generate some mock invoices for display
    const mockInvoices: Invoice[] = Array.from({length: 5}, (_, i) => ({
        id: `inv_${1000 + i}`,
        tenantId,
        amount: 299,
        currency: 'ZAR',
        status: 'PAID',
        date: new Date(new Date().setMonth(new Date().getMonth() - i)).toISOString(),
        planName: 'Basic',
        pdfUrl: '#'
    }));
    return mockInvoices;
};


// --- SETTINGS MANAGEMENT ---

export const getBusinessProfile = async (tenantId: string): Promise<Tenant | null> => {
    if (tenantId === 'global') return INALA_HOLDINGS_TENANT;
    try {
        const docRef = doc(db, 'tenants', tenantId); 
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            const tenantData = snap.data() as Tenant;
            const branding = await getTenantBrandingSettings(tenantId); // Fetch sub-document
            const access = await getTenantAccessSettings(tenantId); // Fetch sub-document
            const emailConfig = await getTenantEmailSettings(tenantId); // Fetch sub-document
            const posSettings = await getTenantPOSSettings(tenantId); // Fetch sub-document
            const cycleSettings = await getTenantCycleSettings(tenantId); // Fetch sub-document
            const notifications = await getTenantNotificationSettings(tenantId); // Fetch sub-document

            return { 
                ...tenantData, 
                id: snap.id, 
                branding: branding || undefined,
                access: access || undefined,
                emailConfig: emailConfig || undefined,
                posSettings: posSettings || undefined,
                cycleSettings: cycleSettings || undefined,
                notifications: notifications || undefined,
            };
        }
        
        const tenants = await getTenants();
        const fallbackTenant = tenants.find(t => t.id === tenantId) || null;
        if (fallbackTenant) {
            const branding = await getTenantBrandingSettings(tenantId);
            const access = await getTenantAccessSettings(tenantId);
            const emailConfig = await getTenantEmailSettings(tenantId);
            const posSettings = await getTenantPOSSettings(tenantId);
            const cycleSettings = await getTenantCycleSettings(tenantId);
            const notifications = await getTenantNotificationSettings(tenantId);

            return { 
                ...fallbackTenant, 
                branding: branding || undefined,
                access: access || undefined,
                emailConfig: emailConfig || undefined,
                posSettings: posSettings || undefined,
                cycleSettings: cycleSettings || undefined,
                notifications: notifications || undefined,
            };
        }
        return null;
    } catch (e) {
        console.error("Error fetching business profile", e);
        const t = INITIAL_TENANTS.find(t => t.id === tenantId);
        if (t) {
            return { ...t, branding: INITIAL_BRANDING_SETTINGS }; // Fallback with default branding
        }
        return null;
    }
};

export const updateBusinessProfile = async (tenantId: string, data: Partial<Tenant>) => {
    try {
        const batch = writeBatch(db);
        const tenantDocRef = doc(globalTenantsRef, tenantId);
        
        // Update main tenant document with top-level fields
        const topLevelUpdateData = extractTopLevelTenantFields(data);
        if (Object.keys(topLevelUpdateData).length > 0) {
            batch.update(tenantDocRef, topLevelUpdateData);
        }
        
        // Update sub-documents if they exist in the payload
        if (data.branding) {
            await updateTenantBrandingSettings(tenantId, data.branding);
        }
        if (data.access) {
            await updateTenantAccessSettings(tenantId, data.access);
        }
        if (data.emailConfig) {
            await updateTenantEmailSettings(tenantId, data.emailConfig);
        }
        if (data.posSettings) {
            await updateTenantPOSSettings(tenantId, data.posSettings);
        }
        if (data.cycleSettings) {
            await updateTenantCycleSettings(tenantId, data.cycleSettings);
        }
        if (data.notifications) {
            await updateTenantNotificationSettings(tenantId, data.notifications);
        }

        await batch.commit();
        return true;
    } catch (e) {
        console.error("Error updating business profile", e);
        return false;
    }
};

export const getBusinessAdmins = async (tenantId: string): Promise<User[]> => {
    return fetchWithFallback(async () => {
        const q = query(globalUsersRef, where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as User);
    }, INITIAL_USERS.filter(u => u.tenantId === tenantId));
};

export const addBusinessAdmin = async (user: User) => {
    try {
        await setDoc(doc(globalUsersRef, user.id), { ...user, isActive: true, createdAt: new Date().toISOString() });
    } catch(e) { console.error(e); }
};

export const updateUser = async (userId: string, data: Partial<User>) => {
    try {
        await updateDoc(doc(globalUsersRef, userId), data);
        return true;
    } catch (e) {
        console.error("Error updating user profile", e);
        return false;
    }
};

export const deleteUser = async (userId: string) => {
    try {
        await deleteDoc(doc(globalUsersRef, userId));
        return true;
    } catch (e) {
        console.error("Error deleting user", e);
        return false;
    }
};

export const logAudit = async (audit: Partial<AuditLog>) => {
    try {
        await addDoc(auditLogsRef, {
            ...audit,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.warn("Failed to log audit event:", e);
    }
};


// --- DATA ACCESS LAYER ---

export const getProducts = async (tenantId?: string | null): Promise<Product[]> => {
    if (!tenantId) return INITIAL_PRODUCTS;
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'products'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                name: normalizeString(data.name),
                sku: normalizeString(data.sku),
                category: normalizeString(data.category),
                subcategory: normalizeString(data.subcategory),
                unit: normalizeString(data.unit),
                price: normalizeNumber(data.price),
                cost: normalizeNumber(data.cost),
                stockLevel: normalizeNumber(data.stockLevel),
                minStockThreshold: normalizeNumber(data.minStockThreshold)
            } as Product;
        });
    }, INITIAL_PRODUCTS.filter(p => p.tenantId === tenantId));
};

export const addProduct = async (product: Product) => {
    try { await setDoc(doc(getBusinessCollection(product.tenantId, 'products'), product.id), product); } catch (e) {}
};
export const updateProduct = async (product: Product) => {
    try { await updateDoc(doc(getBusinessCollection(product.tenantId, 'products'), product.id), { ...product }); } catch (e) {}
};
export const deleteProduct = async (tenantId: string, productId: string) => { 
    try { await deleteDoc(doc(getBusinessCollection(tenantId, 'products'), productId)); } catch (e) {console.error(e);}
};

export const getTransactions = async (tenantId: string, startDate?: string, endDate?: string): Promise<Transaction[]> => {
    return fetchWithFallback(async () => {
        const colRef = getBusinessCollection(tenantId, 'transactions');
        let q = query(colRef);
        
        if (startDate && endDate) {
            q = query(colRef, 
                where('timestamp', '>=', startDate),
                where('timestamp', '<=', endDate)
            );
        }
        
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                timestamp: normalizeDate(data.timestamp),
                customerName: normalizeString(data.customerName),
                reference: normalizeString(data.reference),
                type: data.type as TransactionType,
                items: data.items ? data.items.map((i: any) => ({
                    ...i,
                    name: normalizeString(i.name),
                    qty: normalizeNumber(i.qty),
                    price: normalizeNumber(i.price),
                    subtotal: normalizeNumber(i.subtotal)
                })) : undefined
            } as Transaction;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, 
    INITIAL_TRANSACTIONS.filter(t => 
        t.tenantId === tenantId && 
        (!startDate || t.timestamp >= startDate) &&
        (!endDate || t.timestamp <= endDate)
    ));
};

export const addTransaction = async (transaction: Transaction) => {
    try {
        const batch = writeBatch(db);
        const safeTransaction = {
            ...transaction,
            amount: normalizeNumber(transaction.amount),
            timestamp: normalizeDate(transaction.timestamp),
            customerName: normalizeString(transaction.customerName),
            reference: normalizeString(transaction.reference)
        };

        batch.set(doc(getBusinessCollection(transaction.tenantId, 'transactions'), transaction.id), safeTransaction);
        
        if (transaction.type === TransactionType.SALE) {
            batch.set(doc(getBusinessCollection(transaction.tenantId, 'sales'), transaction.id), safeTransaction);
        } else if (transaction.type === TransactionType.DEBT_PAYMENT) {
            batch.set(doc(getBusinessCollection(transaction.tenantId, 'payments'), transaction.id), safeTransaction);
        } else if (transaction.type === TransactionType.EXPENSE) {
             batch.set(doc(getBusinessCollection(transaction.tenantId, 'expenditures'), transaction.id), safeTransaction);
        }

        if (transaction.customerId && transaction.customerId !== 'walk_in') {
            const customerRef = doc(getBusinessCollection(transaction.tenantId, 'customers'), transaction.customerId);
            const customerSnap = await getDoc(customerRef);
            
            if (customerSnap.exists()) {
                const customer = customerSnap.data() as Customer;
                let newDebt = normalizeNumber(customer.currentDebt);
                
                if (transaction.method === PaymentMethod.CREDIT) { // Fix: Use PaymentMethod.CREDIT
                    newDebt += safeTransaction.amount;
                } else if (transaction.type === TransactionType.DEBT_PAYMENT) {
                    newDebt -= safeTransaction.amount;
                }
                
                batch.update(customerRef, { 
                    currentDebt: newDebt, 
                    lastPurchaseDate: new Date().toISOString() 
                });
            }
        }
        await batch.commit();
    } catch (e) { console.error("Error adding transaction:", e); }
};

export const getCustomers = async (tenantId: string): Promise<Customer[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'customers'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                name: normalizeString(data.name),
                phone: normalizeString(data.phone),
                email: normalizeString(data.email),
                creditLimit: normalizeNumber(data.creditLimit),
                currentDebt: normalizeNumber(data.currentDebt),
                totalCredit: data.totalCredit !== undefined ? normalizeNumber(data.totalCredit) : undefined,
                salesCount: normalizeNumber(data.salesCount),
                lastPurchaseDate: normalizeDate(data.lastPurchaseDate)
            } as Customer;
        });
    }, INITIAL_CUSTOMERS.filter(c => c.tenantId === tenantId));
};
export const addCustomer = async (customer: Customer) => {
    try { await setDoc(doc(getBusinessCollection(customer.tenantId, 'customers'), customer.id), customer); } catch (e) {}
};

export const getExpenses = async (tenantId: string, startDate?: string, endDate?: string): Promise<Expense[]> => {
    return fetchWithFallback(async () => {
        const colRef = getBusinessCollection(tenantId, 'expenditures');
        let q = query(colRef);
        
        if (startDate && endDate) {
            q = query(colRef, 
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
        }

        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                date: normalizeDate(data.date),
                category: normalizeString(data.category),
                description: normalizeString(data.description),
                status: data.status
            } as Expense;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, 
    INITIAL_EXPENSES.filter(e => 
        e.tenantId === tenantId &&
        (!startDate || e.date >= startDate) &&
        (!endDate || e.date <= endDate)
    ));
};
export const addExpense = async (expense: Expense) => {
    try { await setDoc(doc(getBusinessCollection(expense.tenantId, 'expenditures'), expense.id), expense); } catch (e) {}
};

export const getTenants = async (): Promise<Tenant[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalTenantsRef);
        const tenantsData: Tenant[] = [];
        for (const d of snap.docs) {
            const data = d.data();
            // Fetch all sub-documents
            const branding = await getTenantBrandingSettings(d.id); 
            const access = await getTenantAccessSettings(d.id);
            const emailConfig = await getTenantEmailSettings(d.id);
            const posSettings = await getTenantPOSSettings(d.id);
            const cycleSettings = await getTenantCycleSettings(d.id);
            const notifications = await getTenantNotificationSettings(d.id);

            tenantsData.push({
                ...data,
                id: d.id,
                name: normalizeString(data.name),
                type: normalizeString(data.type),
                category: normalizeString(data.category),
                branding: branding || undefined,
                access: access || undefined,
                emailConfig: emailConfig || undefined,
                posSettings: posSettings || undefined,
                cycleSettings: cycleSettings || undefined,
                notifications: notifications || undefined,
            } as Tenant);
        }
        return tenantsData;
    }, [...INITIAL_TENANTS, INALA_HOLDINGS_TENANT]);
};

// Modified addTenant to accept a complete Tenant object
export const addTenant = async (tenant: Tenant) => {
    try { 
        const batch = writeBatch(db);
        const tenantRef = doc(globalTenantsRef, tenant.id);
        const safeTenantData = extractTopLevelTenantFields(tenant); // Extract only top-level fields
        
        batch.set(tenantRef, safeTenantData); 

        // Save sub-documents
        if (tenant.branding) {
            batch.set(getTenantBrandingRef(tenant.id), tenant.branding, { merge: true });
        }
        if (tenant.access) {
            batch.set(getTenantAccessSettingsRef(tenant.id), tenant.access, { merge: true });
        }
        if (tenant.emailConfig) {
            batch.set(getTenantEmailSettingsRef(tenant.id), tenant.emailConfig, { merge: true });
        }
        if (tenant.posSettings) {
            batch.set(getTenantPOSSettingsRef(tenant.id), tenant.posSettings, { merge: true });
        }
        if (tenant.cycleSettings) {
            batch.set(getTenantCycleSettingsRef(tenant.id), tenant.cycleSettings, { merge: true });
        }
        if (tenant.notifications) {
            batch.set(getTenantNotificationSettingsRef(tenant.id), tenant.notifications, { merge: true });
        }

        await batch.commit();
    } catch (e) { console.error(e); }
};

// Modified updateTenant to accept a partial Tenant object for flexible updates
export const updateTenant = async (tenant: Partial<Tenant>) => {
    try { 
        if (!tenant.id) {
            console.error("Tenant ID is required for update.");
            return;
        }

        const batch = writeBatch(db);
        const tenantRef = doc(globalTenantsRef, tenant.id);
        const safeTenantData = extractTopLevelTenantFields(tenant); 

        if (Object.keys(safeTenantData).length > 0) {
            batch.update(tenantRef, safeTenantData); 
        }

        // Update sub-documents if they are provided in the partial tenant object
        if (tenant.branding) {
            batch.set(getTenantBrandingRef(tenant.id), tenant.branding, { merge: true });
        }
        if (tenant.access) {
            batch.set(getTenantAccessSettingsRef(tenant.id), tenant.access, { merge: true });
        }
        if (tenant.emailConfig) {
            batch.set(getTenantEmailSettingsRef(tenant.id), tenant.emailConfig, { merge: true });
        }
        if (tenant.posSettings) {
            batch.set(getTenantPOSSettingsRef(tenant.id), tenant.posSettings, { merge: true });
        }
        if (tenant.cycleSettings) {
            batch.set(getTenantCycleSettingsRef(tenant.id), tenant.cycleSettings, { merge: true });
        }
        if (tenant.notifications) {
            batch.set(getTenantNotificationSettingsRef(tenant.id), tenant.notifications, { merge: true });
        }

        await batch.commit();
    } catch (e) { console.error(e); }
};

export const getUsers = async (): Promise<User[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalUsersRef);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                isActive: data.isActive !== false // Default true if undefined
            } as User;
        });
    }, INITIAL_USERS);
};

export const getStokvelMembers = async (tenantId: string): Promise<StokvelMember[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'members'));
        return snap.docs.map(d => d.data() as StokvelMember);
    }, INITIAL_STOKVEL_MEMBERS.filter(m => m.tenantId === tenantId));
};
export const addStokvelMember = async (member: StokvelMember) => {
    try { await setDoc(doc(getBusinessCollection(member.tenantId, 'members'), member.id), member); } catch (e) {}
};
export const updateStokvelMember = async (member: StokvelMember) => {
    try { await updateDoc(doc(getBusinessCollection(member.tenantId, 'members'), member.id), { ...member }); } catch (e) {}
};
export const deleteStokvelMember = async (tenantId: string, memberId: string) => { 
    try { await deleteDoc(doc(getBusinessCollection(tenantId, 'members'), memberId)); } catch (e) {console.error(e);}
};

export const getContributions = async (tenantId: string): Promise<Contribution[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'contributions'));
        return snap.docs.map(d => d.data() as Contribution);
    }, INITIAL_CONTRIBUTIONS.filter(c => c.tenantId === tenantId));
};

export const getLoans = async (tenantId?: string): Promise<Loan[]> => {
    if (!tenantId) return INITIAL_LOANS;
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'loans'));
        return snap.docs.map(d => d.data() as Loan);
    }, INITIAL_LOANS.filter(l => l.tenantId === tenantId));
};

export const getPOPs = async (tenantId: string): Promise<POPDocument[]> => {
    return fetchWithFallback(async () => {
        const q = query(globalPopsRef, where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                timestamp: normalizeDate(data.timestamp),
                reference: normalizeString(data.reference),
                uploadedBy: normalizeString(data.uploadedBy),
                imageUrl: normalizeString(data.imageUrl),
                status: data.status,
                tenantId: data.tenantId
            } as POPDocument;
        });
    }, INITIAL_POPS.filter(p => p.tenantId === tenantId));
};
export const updatePOP = async (tenantId: string, pop: POPDocument) => {
    try { await updateDoc(doc(globalPopsRef, pop.id), { ...pop }); } catch (e) {}
};

export const getEmails = async (tenantId: string): Promise<EmailMessage[]> => {
    return fetchWithFallback(async () => {
        const q = query(collection(db, 'tenants', tenantId, 'emails')); // Tenant-specific emails
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as EmailMessage);
    }, INITIAL_EMAILS.filter(e => e.from.includes(tenantId === 't_biz_01' ? 'butchery.com' : 'sisonke.org') || e.to.includes(tenantId === 't_biz_01' ? 'butchery.com' : 'sisonke.org')));
};
export const sendEmail = async (tenantId: string, email: EmailMessage) => {
    try { 
        await setDoc(doc(collection(db, 'tenants', tenantId, 'emails'), email.id), email); 
    } catch (e) {console.error(e);}
};