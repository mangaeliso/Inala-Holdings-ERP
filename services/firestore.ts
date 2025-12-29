
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
    increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/db';
import { 
    Tenant, User, Product, Transaction, Customer, StokvelMember, 
    Contribution, Loan, Expense, TransactionType, GlobalSettings as GlobalSettingsType,
    BillingPlan, TenantBilling, Invoice, TenantType, LoanStatus, PaymentMethod,
    Person, TenantPersonLink, SystemEmailTemplate, EmailSettings, BrandingSettings, POPDocument, EmailMessage
} from '../types';

// --- UTILS ---
export const sanitizeData = (doc: any): any => {
    if (!doc) return doc;
    const { ref, firestore, ...data } = doc; 
    const safeValue = (val: any) => (val && typeof val.toDate === 'function') ? val.toDate().toISOString() : val;
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (Array.isArray(val)) {
            data[key] = val.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const newItem: any = {};
                    Object.keys(item).forEach(k => newItem[k] = safeValue(item[k]));
                    return newItem;
                }
                return item;
            });
        } else {
            data[key] = safeValue(val);
        }
    });
    return data;
};

// --- USER MANAGEMENT ---

// Fix: Added updateUser export
export const updateUser = async (userId: string, data: Partial<User>) => {
    await updateDoc(doc(db, 'users', userId), data);
};

// Fix: Added getUsers export
export const getUsers = async (): Promise<User[]> => {
    const s = await getDocs(collection(db, 'users'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as User[];
};

// Fix: Added getBusinessAdmins export
export const getBusinessAdmins = async (tenantId: string): Promise<User[]> => {
    const q = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as User[];
};

// --- TENANT & SETTINGS ---

// Fix: Added getGlobalSettings as alias for ensureGlobalSettings
export const getGlobalSettings = async (): Promise<GlobalSettingsType> => {
    return await ensureGlobalSettings();
};

// Fix: Added updateGlobalSettings export
export const updateGlobalSettings = async (settings: GlobalSettingsType) => {
    await setDoc(doc(db, 'global', 'settings'), settings);
    return true;
};

// Fix: Added updateSystemBranding export
export const updateSystemBranding = async (branding: { logoUrl: string }) => {
    await setDoc(doc(db, 'system_settings', 'branding'), branding, { merge: true });
};

// Fix: Added addTenant export
export const addTenant = async (tenant: Tenant) => {
    const col = tenant.type === TenantType.BUSINESS ? 'businesses' : 'tenants';
    await setDoc(doc(db, col, tenant.id), tenant);
};

// Fix: Added updateTenant export
export const updateTenant = async (tenant: Tenant) => {
    const col = tenant.type === TenantType.BUSINESS ? 'businesses' : 'tenants';
    await updateDoc(doc(db, col, tenant.id), tenant as any);
};

// Fix: Added updateBusinessProfile export
export const updateBusinessProfile = async (tenantId: string, data: Partial<Tenant>) => {
    await updateDoc(doc(db, 'businesses', tenantId), data as any);
    return true;
};

// Fix: Added deleteTenant export
export const deleteTenant = async (tenantId: string) => {
    await deleteDoc(doc(db, 'businesses', tenantId));
};

// --- PRODUCT & INVENTORY ---

// Fix: Added addProduct export
export const addProduct = async (p: Product) => {
    await setDoc(doc(db, 'businesses', p.tenantId, 'products', p.id), p);
};

// Fix: Added updateProduct export
export const updateProduct = async (p: Product) => {
    await updateDoc(doc(db, 'businesses', p.tenantId, 'products', p.id), p as any);
};

// Fix: Added deleteProduct export
export const deleteProduct = async (tid: string, pid: string) => {
    await deleteDoc(doc(db, 'businesses', tid, 'products', pid));
};

// Fix: Added decrementStock export
export const decrementStock = async (path: string, qty: number) => {
    const ref = doc(db, path);
    await updateDoc(ref, { stockLevel: increment(-qty) });
};

// Fix: Added seedInalaFragrances export
export const seedInalaFragrances = async (tenantId: string) => {
    const items = [
        { name: 'Fragrance A', sku: 'FR-A', category: 'Fragrance', price: 250, stockLevel: 100, minStockThreshold: 10, unit: 'unit', isActive: true },
        { name: 'Fragrance B', sku: 'FR-B', category: 'Fragrance', price: 300, stockLevel: 80, minStockThreshold: 5, unit: 'unit', isActive: true }
    ];
    for (const item of items) {
        const id = `p_${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, 'businesses', tenantId, 'products', id), { ...item, id, tenantId });
    }
};

// --- CUSTOMER MANAGEMENT ---

// Fix: Added addCustomer export
export const addCustomer = async (c: Customer) => {
    await setDoc(doc(db, 'businesses', c.tenantId, 'customers', c.id), c);
};

// Fix: Added updateCustomer export
export const updateCustomer = async (tid: string, cid: string, data: Partial<Customer>) => {
    await updateDoc(doc(db, 'businesses', tid, 'customers', cid), data);
};

// --- TRANSACTIONS ---

// Fix: Added addTransaction export
export const addTransaction = async (tx: Transaction) => {
    await setDoc(doc(db, 'businesses', tx.tenantId, 'transactions', tx.id), tx);
};

// Fix: Updated voidTransaction to accept a reason and handle object/id
export const voidTransaction = async (tenantId: string, tx: any, userId: string, reason?: string) => {
    const txId = typeof tx === 'string' ? tx : tx.id;
    const ref = doc(db, 'businesses', tenantId, 'transactions', txId);
    await updateDoc(ref, { 
        status: 'VOIDED', 
        voidedBy: userId, 
        voidedAt: new Date().toISOString(),
        voidReason: reason
    });
};

// Fix: Added fetchSalesData export
export const fetchSalesData = async (tid: string, start: Date, end: Date) => {
    const q = query(
        collection(db, 'businesses', tid, 'transactions'),
        where('type', '==', TransactionType.SALE),
        where('timestamp', '>=', start.toISOString()),
        where('timestamp', '<=', end.toISOString())
    );
    const s = await getDocs(q);
    return s.docs.map(d => sanitizeData(d.data()));
};

// Fix: Added fetchExpensesData export
export const fetchExpensesData = async (tid: string, start: Date, end: Date) => {
    const q = query(
        collection(db, 'businesses', tid, 'expenses'),
        where('date', '>=', start.toISOString().split('T')[0]),
        where('date', '<=', end.toISOString().split('T')[0])
    );
    const s = await getDocs(q);
    return s.docs.map(d => sanitizeData(d.data()));
};

// Fix: Added fetchTransactions as alias for getTransactions or filtered query
export const fetchTransactions = async (tid: string, start: Date, end: Date) => {
    const q = query(
        collection(db, 'businesses', tid, 'transactions'),
        where('timestamp', '>=', start.toISOString()),
        where('timestamp', '<=', end.toISOString())
    );
    const s = await getDocs(q);
    return s.docs.map(d => sanitizeData(d.data()));
};

// Fix: Added fetchPaymentsData export
export const fetchPaymentsData = async (tid: string, start: Date, end: Date) => {
    const q = query(
        collection(db, 'businesses', tid, 'transactions'),
        where('type', '==', TransactionType.DEBT_PAYMENT),
        where('timestamp', '>=', start.toISOString()),
        where('timestamp', '<=', end.toISOString())
    );
    const s = await getDocs(q);
    return s.docs.map(d => sanitizeData(d.data()));
};

// Fix: Added fetchLifetimeSalesAndPayments export
export const fetchLifetimeSalesAndPayments = async (tid: string) => {
    const sSnap = await getDocs(collection(db, 'businesses', tid, 'transactions'));
    const txs = sSnap.docs.map(d => sanitizeData(d.data()));
    return {
        sales: txs.filter(t => t.type === TransactionType.SALE),
        payments: txs.filter(t => t.type === TransactionType.DEBT_PAYMENT)
    };
};

// Fix: Added requestVoid export
export const requestVoid = async (tid: string, tx: Transaction, requestedBy: string, reason: string) => {
    const requestId = `void_req_${Date.now()}`;
    await setDoc(doc(db, 'businesses', tid, 'void_requests', requestId), {
        id: requestId,
        transactionId: tx.id,
        requestedBy,
        reason,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
    });
};

// Fix: Added adjustSale export
export const adjustSale = async (tid: string, oldTx: Transaction, newTx: Transaction, adjustedBy: string, reason: string) => {
    await updateDoc(doc(db, 'businesses', tid, 'transactions', oldTx.id), {
        ...newTx,
        adjustedBy,
        adjustmentReason: reason,
        adjustedAt: new Date().toISOString()
    } as any);
};

// --- EXPENSES ---

// Fix: Added getExpenses export
export const getExpenses = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'expenses'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Expense[];
};

// Fix: Added addExpense export
export const addExpense = async (e: Expense) => {
    await setDoc(doc(db, 'businesses', e.tenantId, 'expenses', e.id), e);
};

// Fix: Added getExpenseCategories export
export const getExpenseCategories = async (tid: string) => {
    const s = await getDoc(doc(db, 'businesses', tid, 'settings', 'expenses'));
    return s.exists() ? (s.data().categories || []) : ['Rent', 'Utilities', 'Wages', 'Stock', 'Other'];
};

// --- FINANCE & POP ---

// Fix: Added getPOPs export
export const getPOPs = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'pops'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as POPDocument[];
};

// Fix: Added updatePOP export
export const updatePOP = async (tid: string, pop: POPDocument) => {
    await updateDoc(doc(db, 'businesses', tid, 'pops', pop.id), pop as any);
};

// --- BILLING & PLANS ---

// Fix: Added getBillingPlans export
export const getBillingPlans = async (): Promise<BillingPlan[]> => {
    const s = await getDocs(collection(db, 'billing_plans'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as BillingPlan[];
};

// Fix: Added getTenantBilling export
export const getTenantBilling = async (tid: string) => {
    const s = await getDoc(doc(db, 'businesses', tid, 'billing', 'subscription'));
    return s.exists() ? sanitizeData(s.data()) as TenantBilling : null;
};

// Fix: Added updateTenantBilling export
export const updateTenantBilling = async (billing: TenantBilling) => {
    await setDoc(doc(db, 'businesses', billing.tenantId, 'billing', 'subscription'), billing);
};

// Fix: Added getInvoices export
export const getInvoices = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'invoices'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Invoice[];
};

// --- EMAIL & INBOX ---

// Fix: Added getEmails export
export const getEmails = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'emails'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as EmailMessage[];
};

// Fix: Added sendEmail export
export const sendEmail = async (tid: string, email: EmailMessage) => {
    await setDoc(doc(db, 'businesses', tid, 'emails', email.id), email);
};

// Fix: Added getTenantEmailSettings export
export const getTenantEmailSettings = async (tid: string) => {
    const s = await getDoc(doc(db, 'businesses', tid, 'settings', 'email'));
    return s.exists() ? sanitizeData(s.data()) as EmailSettings : null;
};

// --- GLOBAL PEOPLE REGISTRY ---

// Fix: Added searchGlobalPeople export
export const searchGlobalPeople = async (term: string) => {
    const q = query(collection(db, 'people'), where('name', '>=', term), where('name', '<=', term + '\uf8ff'));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Person[];
};

// Fix: Added getOrCreatePerson export
export const getOrCreatePerson = async (data: Partial<Person>) => {
    const q = query(collection(db, 'people'), where('phone', '==', data.phone));
    const s = await getDocs(q);
    if (!s.empty) return { id: s.docs[0].id, ...sanitizeData(s.docs[0].data()) } as Person;
    
    const id = `p_${Date.now()}`;
    const newPerson = { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'people', id), newPerson);
    return newPerson as Person;
};

// Fix: Added linkPersonToTenant export
export const linkPersonToTenant = async (link: TenantPersonLink) => {
    await setDoc(doc(db, 'tenant_person_links', link.id), link);
};

// Fix: Added updateGlobalPerson export
export const updateGlobalPerson = async (id: string, data: Partial<Person>) => {
    await updateDoc(doc(db, 'people', id), { ...data, updatedAt: new Date().toISOString() });
};

// --- STORAGE ---

// Fix: Added uploadFileToFirebaseStorage export
export const uploadFileToFirebaseStorage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// --- STOKVEL ENGINE (AGGREGATION) ---
export const calculateHybridStokvelMetrics = async (tenantId: string) => {
    const [contributionsSnap, loansSnap, transactionsSnap] = await Promise.all([
        getDocs(collection(db, 'businesses', tenantId, 'contributions')),
        getDocs(collection(db, 'businesses', tenantId, 'loans')),
        getDocs(collection(db, 'businesses', tenantId, 'transactions'))
    ]);

    const contributions = contributionsSnap.docs.map(d => d.data()).filter(c => c.status !== 'VOIDED');
    const loans = loansSnap.docs.map(d => d.data()).filter(l => l.status !== 'REJECTED' && l.status !== 'VOIDED');
    const transactions = transactionsSnap.docs.map(d => d.data()).filter(t => t.status !== 'VOIDED');

    const totalContributed = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalRepayments = transactions
        .filter(t => t.type === TransactionType.LOAN_REPAYMENT || t.type === TransactionType.DEBT_PAYMENT)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const totalDisbursed = loans
        .filter(l => l.status !== LoanStatus.PENDING_APPROVAL)
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const adjustments = transactions
        .filter(t => t.type === TransactionType.CAPITAL_INJECTION)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const activePrincipal = loans
        .filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED)
        .reduce((sum, l) => sum + (Number(l.balanceRemaining) || 0), 0);

    const liquidCapital = (totalContributed + totalRepayments + adjustments) - totalDisbursed;

    return {
        liquidCapital: Math.max(0, liquidCapital),
        totalContributions: totalContributed,
        activePrincipal,
        effectiveROI: totalContributed > 0 ? ((totalRepayments / totalContributed) * 100).toFixed(1) : 0
    };
};

// --- LOAN HUB ACTIONS ---
export const recordLoanRepayment = async (tenantId: string, loanId: string, amount: number, receivedBy: string) => {
    const loanRef = doc(db, 'businesses', tenantId, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan not found");
    const loan = loanSnap.data() as Loan;

    const newBalance = Math.max(0, loan.balanceRemaining - amount);
    const newStatus = newBalance <= 0 ? LoanStatus.PAID : loan.status;

    await updateDoc(loanRef, { 
        balanceRemaining: newBalance, 
        status: newStatus,
        updatedAt: new Date().toISOString()
    });

    const txId = `rep_${Date.now()}`;
    await setDoc(doc(db, 'businesses', tenantId, 'transactions', txId), {
        id: txId,
        tenantId,
        type: TransactionType.LOAN_REPAYMENT,
        amount,
        loanId,
        customerName: loan.customerName,
        timestamp: new Date().toISOString(),
        receivedBy,
        status: 'COMPLETED'
    });
};

export const manualOverrideLoanStatus = async (tenantId: string, loanId: string, status: LoanStatus) => {
    const loanRef = doc(db, 'businesses', tenantId, 'loans', loanId);
    await updateDoc(loanRef, { status });
};

// --- CORE FETCHERS ---
export const getTenants = async (): Promise<Tenant[]> => {
    const [b, t] = await Promise.all([getDocs(collection(db, 'businesses')), getDocs(collection(db, 'tenants'))]);
    return [...b.docs, ...t.docs].map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Tenant[];
};

export const getBusinessProfile = async (id: string) => {
    const d = await getDoc(doc(db, 'businesses', id));
    return d.exists() ? { id: d.id, ...sanitizeData(d.data()) } as Tenant : null;
};

export const getStokvelMembers = async (id: string) => {
    const s = await getDocs(collection(db, 'businesses', id, 'members'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as StokvelMember[];
};

export const getContributions = async (id: string) => {
    const s = await getDocs(collection(db, 'businesses', id, 'contributions'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Contribution[];
};

export const getLoans = async (id: string) => {
    const s = await getDocs(collection(db, 'businesses', id, 'loans'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Loan[];
};

export const addContribution = async (c: Contribution) => {
    await setDoc(doc(db, 'businesses', c.tenantId, 'contributions', c.id), c);
};

export const addStokvelMember = async (m: StokvelMember) => {
    await setDoc(doc(db, 'businesses', m.tenantId, 'members', m.id), m);
};

export const getProducts = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'products'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Product[];
};

export const getCustomers = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'customers'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Customer[];
};

export const getTransactions = async (tid: string) => {
    const s = await getDocs(collection(db, 'businesses', tid, 'transactions'));
    return s.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) })) as Transaction[];
};

export const addLoan = async (l: Loan) => {
    await setDoc(doc(db, 'businesses', l.tenantId, 'loans', l.id), l);
};

export const INITIAL_GLOBAL_SETTINGS: GlobalSettingsType = {
    id: 'global', erpName: 'INALA HOLDINGS', erpLogoUrl: '', primaryColor: '#6366f1',
    secondaryColor: '#0ea5e9', supportEmail: 'admin@inala.holdings', platformDomain: 'app.inala.holdings',
    system: { maintenanceMode: false, allowSignup: false }
};

export const ensureGlobalSettings = async () => {
    const s = await getDoc(doc(db, 'global', 'settings'));
    return s.exists() ? { ...INITIAL_GLOBAL_SETTINGS, ...sanitizeData(s.data()) } : INITIAL_GLOBAL_SETTINGS;
};

export const getTenantBrandingSettings = async (id: string) => {
    const p = await getBusinessProfile(id);
    return p?.branding || null;
};
