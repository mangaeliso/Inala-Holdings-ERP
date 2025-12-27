
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
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/db';
import { 
    Tenant, User, Product, Transaction, Customer, StokvelMember, 
    Contribution, Loan, Expense, TransactionType, GlobalSettings as GlobalSettingsType,
    BillingPlan, TenantBilling, Invoice, TenantType, LoanStatus, PaymentMethod
} from '../types';

// --- 1. SAFE SANITIZER ---
export const sanitizeData = (doc: any): any => {
    if (!doc) return doc;
    const { ref, firestore, ...data } = doc; 

    const safeValue = (val: any) => {
        if (val && typeof val.toDate === 'function') {
            return val.toDate().toISOString();
        }
        if (val && val.path && typeof val.path === 'string') {
            return val.path; 
        }
        return val;
    }

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

    if (data.timestamp && typeof data.timestamp === 'object' && !data.timestamp.toDate && data.timestamp.seconds) {
         data.timestamp = new Date(data.timestamp.seconds * 1000).toISOString();
    }

    return data;
};

// --- 2. FAIL-OPEN DATE FILTER ---
const isInDateRange = (doc: any, start: Date, end: Date): boolean => {
    if (!doc.timestamp || typeof doc.timestamp.toDate !== 'function') {
        if (typeof doc.date === 'string' && doc.date.includes('-')) {
             const d = new Date(doc.date);
             if (!isNaN(d.getTime())) {
                 return d >= start && d <= end;
             }
        }
        return true; 
    }
    
    try {
        const docDate = doc.timestamp.toDate();
        return docDate >= start && docDate <= end;
    } catch (error) {
        return true; 
    }
};

const ensureTenantId = (id: string | null | undefined, action: string) => {
    if (!id || id === 'global') {
        console.error(`[Guard] Blocked ${action}: Invalid or missing tenantId.`);
        return false;
    }
    return true;
};

// --- 3. HYBRID STOKVEL ACCOUNTING ENGINE ---

/**
 * Derives financial truth for Lending Stokvels from granular records.
 * Cash on Hand = Contributions + Repayments - Disbursements
 */
export const calculateHybridStokvelMetrics = async (tenantId: string) => {
    if (!ensureTenantId(tenantId, 'calculateHybridStokvelMetrics')) return null;

    const [contributionsSnap, loansSnap, transactionsSnap] = await Promise.all([
        getDocs(collection(db, 'businesses', tenantId, 'contributions')),
        getDocs(collection(db, 'businesses', tenantId, 'loans')),
        getDocs(collection(db, 'businesses', tenantId, 'transactions'))
    ]);

    const contributions = contributionsSnap.docs.map(d => Number(d.data().amount || 0));
    const loans = loansSnap.docs.map(d => d.data() as Loan);
    const transactions = transactionsSnap.docs.map(d => d.data() as Transaction);

    const totalContributions = contributions.reduce((a, b) => a + b, 0);
    
    // Disbursements (Money moved out of pool to borrowers)
    const disbursements = transactions
        .filter(t => t.type === TransactionType.LOAN_DISBURSEMENT)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Repayments (Money moved into pool from borrowers)
    const repayments = transactions
        .filter(t => t.type === TransactionType.LOAN_REPAYMENT)
        .reduce((sum, t) => ({
            total: sum.total + (t.amount || 0),
            interest: sum.interest + (t.interestPart || 0)
        }), { total: 0, interest: 0 });

    const activeLoanPrincipal = loans
        .filter(l => l.status === LoanStatus.ACTIVE)
        .reduce((sum, l) => sum + (l.amount || 0), 0);

    const activeLoanBookValue = loans
        .filter(l => l.status === LoanStatus.ACTIVE)
        .reduce((sum, l) => sum + (l.balanceRemaining || 0), 0);

    // ROI Calculation: (Interest Earned / Principal Loaned) * 100
    const lifetimeLent = transactions
        .filter(t => t.type === TransactionType.LOAN_DISBURSEMENT)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const effectiveROI = lifetimeLent > 0 ? (repayments.interest / lifetimeLent) * 100 : 0;

    return {
        liquidCapital: (totalContributions + repayments.total) - disbursements,
        totalContributions,
        realizedInterest: repayments.interest,
        activePrincipal: activeLoanPrincipal,
        activeBookValue: activeLoanBookValue,
        effectiveROI: effectiveROI.toFixed(1)
    };
};

export const recordRepayment = async (tenantId: string, loanId: string, amount: number, method: PaymentMethod) => {
    if (!ensureTenantId(tenantId, 'recordRepayment')) return;

    const loanRef = doc(db, 'businesses', tenantId, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);
    if (!loanSnap.exists()) return;

    const loan = loanSnap.data() as Loan;
    
    // Split logic: Interest is satisfied first in this model
    const totalDue = loan.totalRepayable;
    const principalBasis = loan.amount;
    const interestBasis = totalDue - principalBasis;
    
    const interestRatio = interestBasis / totalDue;
    const interestPortion = amount * interestRatio;
    const principalPortion = amount - interestPortion;

    // 1. Update Loan Balance
    const newBalance = Math.max(0, loan.balanceRemaining - amount);
    await updateDoc(loanRef, {
        balanceRemaining: newBalance,
        status: newBalance <= 0 ? LoanStatus.PAID : loan.status
    });

    // 2. Create Immutable Repayment Log
    const txId = `tx_rep_${Date.now()}`;
    await setDoc(doc(db, 'businesses', tenantId, 'transactions', txId), {
        id: txId,
        tenantId,
        loanId,
        type: TransactionType.LOAN_REPAYMENT,
        amount,
        interestPart: interestPortion,
        principalPart: principalPortion,
        method,
        timestamp: Timestamp.fromDate(new Date()),
        status: 'COMPLETED'
    });
};

// --- STANDARD ENTITY FETCHERS ---

// Fix: Implement missing fetch functions
export const fetchTransactions = async (tenantId: string, start: Date, end: Date): Promise<Transaction[]> => {
    if (!ensureTenantId(tenantId, 'fetchTransactions')) return [];
    try {
        const snapshot = await getDocs(collection(db, 'businesses', tenantId, 'transactions'));
        return snapshot.docs
            .map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Transaction))
            .filter(doc => isInDateRange(doc, start, end))
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    } catch (error) {
        console.error("fetchTransactions error:", error);
        return [];
    }
};

export const fetchSalesData = async (tenantId: string, start: Date, end: Date): Promise<Transaction[]> => {
    const txs = await fetchTransactions(tenantId, start, end);
    return txs.filter(t => t.type === TransactionType.SALE);
};

export const fetchExpensesData = async (tenantId: string, start: Date, end: Date): Promise<Expense[]> => {
    if (!ensureTenantId(tenantId, 'fetchExpensesData')) return [];
    try {
        const snapshot = await getDocs(collection(db, 'businesses', tenantId, 'expenses'));
        return snapshot.docs
            .map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Expense))
            .filter(doc => isInDateRange(doc, start, end))
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    } catch (error) {
        console.error("fetchExpensesData error:", error);
        return [];
    }
};

export const fetchPaymentsData = async (tenantId: string, start: Date, end: Date): Promise<Transaction[]> => {
    const txs = await fetchTransactions(tenantId, start, end);
    return txs.filter(t => t.type === TransactionType.DEBT_PAYMENT);
};

export const fetchLifetimeSalesAndPayments = async (tenantId: string): Promise<{ sales: Transaction[], payments: Transaction[] }> => {
    if (!ensureTenantId(tenantId, 'fetchLifetimeSalesAndPayments')) return { sales: [], payments: [] };
    try {
        const txsSnap = await getDocs(collection(db, 'businesses', tenantId, 'transactions'));
        const allTxs = txsSnap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Transaction));
        
        return {
            sales: allTxs.filter(t => t.type === TransactionType.SALE),
            payments: allTxs.filter(t => t.type === TransactionType.DEBT_PAYMENT)
        };
    } catch (error) {
        console.error("fetchLifetimeSalesAndPayments error:", error);
        return { sales: [], payments: [] };
    }
};

export const getTenants = async (): Promise<Tenant[]> => {
    try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        const tenSnap = await getDocs(collection(db, 'tenants'));
        const all = [
            ...bizSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...tenSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        ];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique.map(sanitizeData) as Tenant[];
    } catch (e) { 
        return []; 
    }
};

export const getProducts = async (tenantId: string): Promise<Product[]> => {
    if (!ensureTenantId(tenantId, 'getProducts')) return [];
    
    const profile = await getBusinessProfile(tenantId);
    if (profile?.type === TenantType.LOAN || profile?.type === TenantType.LENDING) {
        return [];
    }

    try {
        const productsRef = collection(db, 'businesses', tenantId, 'products');
        const snapshot = await getDocs(productsRef);
        return snapshot.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Product));
    } catch (error) {
        return [];
    }
};

export const getCustomers = async (tenantId: string): Promise<Customer[]> => {
    if (!ensureTenantId(tenantId, 'getCustomers')) return [];
    try {
        const snapshot = await getDocs(collection(db, 'businesses', tenantId, 'customers'));
        return snapshot.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Customer));
    } catch (error) {
        return [];
    }
};

export const getBusinessProfile = async (tenantId: string): Promise<Tenant | null> => {
    if (!tenantId) return null;
    try {
        let snap = await getDoc(doc(db, 'businesses', tenantId));
        if (!snap.exists()) {
             snap = await getDoc(doc(db, 'tenants', tenantId));
        }
        if (snap.exists()) return { id: snap.id, ...sanitizeData(snap.data()) } as Tenant;
        return null;
    } catch (e) { return null; }
};

export const getExpenses = async (tenantId: string): Promise<Expense[]> => {
    if (!ensureTenantId(tenantId, 'getExpenses')) return [];
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12); 
    return (await fetchExpensesData(tenantId, start, end)) as Expense[];
};

export const getTransactions = async (tenantId: string): Promise<Transaction[]> => {
    if (!ensureTenantId(tenantId, 'getTransactions')) return [];
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return (await fetchTransactions(tenantId, start, end)) as Transaction[];
};

export const getLoans = async (tenantId: string): Promise<Loan[]> => {
    if (!ensureTenantId(tenantId, 'getLoans')) return [];
    try {
        const loansRef = collection(db, 'businesses', tenantId, 'loans');
        const snapshot = await getDocs(loansRef);
        return snapshot.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Loan));
    } catch (error) {
        return [];
    }
};

export const addLoan = async (loan: Loan) => {
    if (!ensureTenantId(loan.tenantId, 'addLoan')) return;
    const ref = doc(db, 'businesses', loan.tenantId, 'loans', loan.id);
    
    // Atomic Write: Loan Doc + Transaction Log (Outflow)
    await setDoc(ref, {
        ...loan,
        timestamp: Timestamp.fromDate(new Date()),
    });

    const txId = `tx_dis_${Date.now()}`;
    await setDoc(doc(db, 'businesses', loan.tenantId, 'transactions', txId), {
        id: txId,
        tenantId: loan.tenantId,
        loanId: loan.id,
        type: TransactionType.LOAN_DISBURSEMENT,
        amount: loan.amount,
        timestamp: Timestamp.fromDate(new Date()),
        status: 'COMPLETED'
    });
};

export const addProduct = async (product: Product) => {
    if (!ensureTenantId(product.tenantId, 'addProduct')) return;
    const profile = await getBusinessProfile(product.tenantId);
    if (profile?.type !== TenantType.BUSINESS) {
        throw new Error("Only Retail businesses can have inventory products.");
    }
    const ref = doc(db, 'businesses', product.tenantId, 'products', product.id);
    await setDoc(ref, product);
};

export const updateProduct = async (product: Product) => {
    if (!ensureTenantId(product.tenantId, 'updateProduct')) return;
    const ref = doc(db, 'businesses', product.tenantId, 'products', product.id);
    await updateDoc(ref, product);
};

export const deleteProduct = async (tenantId: string, productId: string) => {
    if (!ensureTenantId(tenantId, 'deleteProduct')) return;
    await deleteDoc(doc(db, 'businesses', tenantId, 'products', productId));
};

export const addTransaction = async (transaction: Transaction) => {
    if (!ensureTenantId(transaction.tenantId, 'addTransaction')) return;
    const colName = 'transactions';
    const ref = doc(db, 'businesses', transaction.tenantId, colName, transaction.id);
    await setDoc(ref, {
        ...transaction,
        timestamp: Timestamp.fromDate(new Date()),
        createdAt: Timestamp.fromDate(new Date()) 
    });
};

export const addContribution = async (contribution: Contribution) => {
    if (!ensureTenantId(contribution.tenantId, 'addContribution')) return;
    const ref = doc(db, 'businesses', contribution.tenantId, 'contributions', contribution.id);
    await setDoc(ref, {
        ...contribution,
        timestamp: Timestamp.fromDate(new Date(contribution.date))
    });
};

export const addCustomer = async (customer: Customer) => {
    if (!ensureTenantId(customer.tenantId, 'addCustomer')) return;
    const ref = doc(db, 'businesses', customer.tenantId, 'customers', customer.id);
    await setDoc(ref, customer);
};

export const addExpense = async (expense: Expense) => {
    if (!ensureTenantId(expense.tenantId, 'addExpense')) return;
    const ref = doc(db, 'businesses', expense.tenantId, 'expenses', expense.id);
    await setDoc(ref, {
        ...expense,
        timestamp: Timestamp.fromDate(new Date(expense.date))
    });
};

export const INITIAL_GLOBAL_SETTINGS: GlobalSettingsType = {
    id: 'global',
    erpName: 'INALA HOLDINGS',
    erpLogoUrl: '',
    primaryColor: '#6366f1',
    secondaryColor: '#0ea5e9',
    supportEmail: 'admin@inala.holdings',
    platformDomain: 'app.inala.holdings',
    apiKeys: {},
    system: {
        maintenanceMode: false,
        allowSignup: false,
        dataRetentionDays: 365,
        enable2FA: false
    }
};

export const ensureGlobalSettings = async () => {
    try {
        const snap = await getDoc(doc(db, 'global', 'settings'));
        if (snap.exists()) return { ...INITIAL_GLOBAL_SETTINGS, ...sanitizeData(snap.data()) };
    } catch(e) {}
    return INITIAL_GLOBAL_SETTINGS;
};
export const getGlobalSettings = ensureGlobalSettings;
export const updateGlobalSettings = async (s: any) => {
    await setDoc(doc(db, 'global', 'settings'), s, { merge: true });
    return true;
};
export const getUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({id: d.id, ...sanitizeData(d.data())})) as User[];
};
export const updateUser = async (id: string, d: any) => {
    await updateDoc(doc(db, 'users', id), d);
};
export const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
};
export const addBusinessAdmin = async (u: any) => {
    await setDoc(doc(db, 'users', u.id), u);
};
export const getBusinessAdmins = async (id: string) => {
    const snap = await getDocs(query(collection(db, 'users'), where('tenantId', '==', id)));
    return snap.docs.map(d => ({id: d.id, ...sanitizeData(d.data())})) as User[];
};
export const getStokvelMembers = async (id: string) => {
    const snap = await getDocs(collection(db, 'businesses', id, 'members'));
    return snap.docs.map(d => ({id: d.id, ...sanitizeData(d.data())})) as StokvelMember[];
};
export const getContributions = async (id: string) => {
    const snap = await getDocs(collection(db, 'businesses', id, 'contributions'));
    return snap.docs.map(d => ({id: d.id, ...sanitizeData(d.data())})) as Contribution[];
};
export const addStokvelMember = async (m: any) => {
    await setDoc(doc(db, 'businesses', m.tenantId, 'members', m.id), m);
};
export const updateStokvelMember = async (m: any) => {
    await updateDoc(doc(db, 'businesses', m.tenantId, 'members', m.id), m);
};
export const deleteStokvelMember = async (t: string, m: string) => {
    await deleteDoc(doc(db, 'businesses', t, 'members', m));
};
export const getEmails = async (tenantId: string) => {
    if (!ensureTenantId(tenantId, 'getEmails')) return [];
    try {
        const snap = await getDocs(collection(db, 'businesses', tenantId, 'emails'));
        return snap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) }));
    } catch (e) { return []; }
};
export const sendEmail = async (tenantId: string, e: any) => {
    if (!ensureTenantId(tenantId, 'sendEmail')) return;
    await setDoc(doc(db, 'businesses', tenantId, 'emails', e.id), e);
};
export const getTenantBrandingSettings = async (id: string) => {
    const p = await getBusinessProfile(id);
    return p?.branding || null;
};
export const getTenantEmailSettings = async (id: string) => undefined;
export const getBillingPlans = async () => {
    const snap = await getDocs(collection(db, 'billing_plans'));
    return snap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) }));
};
export const getTenantBilling = async (id: string) => null;
export const getInvoices = async (id: string) => [];
export const saveBillingPlan = async (p: any) => {};
export const updateTenantBilling = async (b: any) => {};
export const getPOPs = async (tenantId: string) => {
    if (!ensureTenantId(tenantId, 'getPOPs')) return [];
    const snap = await getDocs(collection(db, 'businesses', tenantId, 'pops'));
    return snap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) }));
};
export const updatePOP = async (tenantId: string, p: any) => {
    if (!ensureTenantId(tenantId, 'updatePOP')) return;
    await updateDoc(doc(db, 'businesses', tenantId, 'pops', p.id), p);
};
export const getExpenseCategories = async (id: string) => ['General', 'Rent', 'Utilities', 'Stock'];
export const triggerSystemEmail = async (t: string, d: any) => {};
export const updateSystemBranding = async (d: any) => {};
export const uploadFileToFirebaseStorage = async (f: File, p: string) => "";
export const addTenant = async (t: Tenant) => {
    await setDoc(doc(db, 'businesses', t.id), t);
};
export const updateTenant = async (t: Partial<Tenant>) => {
    if(t.id) await updateDoc(doc(db, 'businesses', t.id), t);
};
export const deleteTenant = async (id: string) => {
    if (!ensureTenantId(id, 'deleteTenant')) return;
    try {
        await deleteDoc(doc(db, 'businesses', id));
        await deleteDoc(doc(db, 'tenants', id));
    } catch (e) {
        console.error("Error deleting tenant:", e);
        throw e;
    }
};
export const updateBusinessProfile = async (id: string, d: any) => {
    await updateDoc(doc(db, 'businesses', id), d);
    return true;
};
export const logAudit = async (e: any) => {};
