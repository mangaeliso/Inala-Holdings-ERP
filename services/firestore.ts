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
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/db';
import * as InitialData from './mockData';
import { Tenant, User, Product, Transaction, Customer, StokvelMember, Contribution, Loan, Expense, EmailMessage, POPDocument, TransactionType } from '../types';

// --- Helper: Dynamic Business Collection Refs ---
const getBusinessCollection = (businessId: string, collectionName: string) => {
    return collection(db, 'businesses', businessId, collectionName);
};

// Global collections
const globalTenantsRef = collection(db, 'tenants');
const globalUsersRef = collection(db, 'users');
const globalPopsRef = collection(db, 'pops');
const globalEmailsRef = collection(db, 'emails');

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

// --- CYCLE CHECKER & SEEDER ---
export const ensureCurrentCycleData = async () => {
    try {
        const targetBusinessId = 't_biz_01'; // Default butchery
        const txRef = getBusinessCollection(targetBusinessId, 'transactions');
        const cycleStart = InitialData.getCycleStartDate();
        
        const q = query(txRef, where('timestamp', '>=', cycleStart.toISOString()), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            console.log(`No transactions found for cycle starting ${cycleStart.toLocaleDateString()}. Seeding fresh data...`);
            const batch = writeBatch(db);
            const freshTxs = InitialData.generateCurrentCycleTransactions(cycleStart, new Date());
            
            freshTxs.forEach(t => {
                const docRef = doc(txRef, t.id);
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

// --- SETTINGS MANAGEMENT ---

export const getBusinessProfile = async (tenantId: string): Promise<Tenant | null> => {
    if (tenantId === 'global') return InitialData.INALA_HOLDINGS_TENANT;
    try {
        const docRef = doc(db, 'businesses', tenantId); 
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Tenant;
        }
        
        const tenants = await getTenants();
        return tenants.find(t => t.id === tenantId) || null;
    } catch (e) {
        const t = InitialData.INITIAL_TENANTS.find(t => t.id === tenantId);
        return t || null;
    }
};

export const updateBusinessProfile = async (tenantId: string, data: Partial<Tenant>) => {
    try {
        const busDocRef = doc(db, 'businesses', tenantId);
        await setDoc(busDocRef, data, { merge: true });
        
        const tenantDocRef = doc(globalTenantsRef, tenantId);
        await setDoc(tenantDocRef, data, { merge: true });
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
    }, InitialData.INITIAL_USERS.filter(u => u.tenantId === tenantId));
};

export const addBusinessAdmin = async (user: User) => {
    try {
        await setDoc(doc(globalUsersRef, user.id), user);
    } catch(e) { console.error(e); }
};

// --- DATA ACCESS LAYER ---

export const getProducts = async (tenantId?: string | null): Promise<Product[]> => {
    if (!tenantId) return InitialData.INITIAL_PRODUCTS;
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
    }, InitialData.INITIAL_PRODUCTS.filter(p => p.tenantId === tenantId));
};

export const addProduct = async (product: Product) => {
    try { await setDoc(doc(getBusinessCollection(product.tenantId, 'products'), product.id), product); } catch (e) {}
};
export const updateProduct = async (product: Product) => {
    try { await updateDoc(doc(getBusinessCollection(product.tenantId, 'products'), product.id), { ...product }); } catch (e) {}
};
export const deleteProduct = async (productId: string) => { console.warn("Delete requires tenant context"); };

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
    InitialData.INITIAL_TRANSACTIONS.filter(t => 
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
                
                if (transaction.method === 'CREDIT') {
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
    }, InitialData.INITIAL_CUSTOMERS.filter(c => c.tenantId === tenantId));
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
    InitialData.INITIAL_EXPENSES.filter(e => 
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
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                name: normalizeString(data.name),
                type: normalizeString(data.type),
                primaryColor: normalizeString(data.primaryColor),
                currency: normalizeString(data.currency),
                category: normalizeString(data.category)
            } as Tenant;
        });
    }, [...InitialData.INITIAL_TENANTS, InitialData.INALA_HOLDINGS_TENANT]);
};
export const addTenant = async (tenant: Tenant) => {
    try { await setDoc(doc(globalTenantsRef, tenant.id), tenant); } catch (e) {}
};
export const updateTenant = async (tenant: Tenant) => {
    try { await updateDoc(doc(globalTenantsRef, tenant.id), { ...tenant }); } catch (e) {}
};

export const getUsers = async (): Promise<User[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalUsersRef);
        return snap.docs.map(d => d.data() as User);
    }, InitialData.INITIAL_USERS);
};

export const getStokvelMembers = async (tenantId: string): Promise<StokvelMember[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'members'));
        return snap.docs.map(d => d.data() as StokvelMember);
    }, InitialData.INITIAL_STOKVEL_MEMBERS.filter(m => m.tenantId === tenantId));
};
export const addStokvelMember = async (member: StokvelMember) => {
    try { await setDoc(doc(getBusinessCollection(member.tenantId, 'members'), member.id), member); } catch (e) {}
};
export const updateStokvelMember = async (member: StokvelMember) => {
    try { await updateDoc(doc(getBusinessCollection(member.tenantId, 'members'), member.id), { ...member }); } catch (e) {}
};
export const deleteStokvelMember = async (id: string) => { console.warn("Delete requires tenantId"); };

export const getContributions = async (tenantId: string): Promise<Contribution[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'contributions'));
        return snap.docs.map(d => d.data() as Contribution);
    }, InitialData.INITIAL_CONTRIBUTIONS.filter(c => c.tenantId === tenantId));
};

export const getLoans = async (tenantId?: string): Promise<Loan[]> => {
    if (!tenantId) return InitialData.INITIAL_LOANS;
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'loans'));
        return snap.docs.map(d => d.data() as Loan);
    }, InitialData.INITIAL_LOANS.filter(l => l.tenantId === tenantId));
};

export const getPOPs = async (): Promise<POPDocument[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalPopsRef);
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
    }, InitialData.INITIAL_POPS);
};
export const updatePOP = async (pop: POPDocument) => {
    try { await updateDoc(doc(globalPopsRef, pop.id), { ...pop }); } catch (e) {}
};

export const getEmails = async (): Promise<EmailMessage[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalEmailsRef);
        return snap.docs.map(d => d.data() as EmailMessage);
    }, InitialData.INITIAL_EMAILS);
};
export const sendEmail = async (email: EmailMessage) => {
    try { await setDoc(doc(globalEmailsRef, email.id), email); } catch (e) {}
};