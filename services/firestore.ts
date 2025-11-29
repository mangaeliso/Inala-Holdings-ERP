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
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/db';
import * as InitialData from './mockData';
import { Tenant, User, Product, Transaction, Customer, StokvelMember, Contribution, Loan, Expense, EmailMessage, POPDocument, TransactionType } from '../types';

// --- Helper: Dynamic Business Collection Refs ---
// Scopes data to: businesses/{businessId}/{collectionName}
const getBusinessCollection = (businessId: string, collectionName: string) => {
    return collection(db, 'businesses', businessId, collectionName);
};

// Global collections
const globalTenantsRef = collection(db, 'tenants');
const globalUsersRef = collection(db, 'users');
const globalPopsRef = collection(db, 'pops');
const globalEmailsRef = collection(db, 'emails');

// --- Helper: Date Normalization ---
// Converts Firestore Timestamps or Date objects to ISO strings
const normalizeDate = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') return date.toDate().toISOString();
    // Handle JS Date object
    if (date instanceof Date) return date.toISOString();
    
    return new Date().toISOString();
};

// --- Helper: Number Normalization ---
// Ensures value is a number, defaults to 0 if undefined/null/NaN
const normalizeNumber = (val: any): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
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

// --- MIGRATION SCRIPT ---
// Moves top-level legacy collections to businesses/t_biz_01/
export const migrateTopLevelToButchery = async () => {
    const targetBusinessId = 't_biz_01'; // Inala Butchery
    const collectionsToMigrate = [
        'customers', 
        'sales', 
        'expenditure', 
        'expenditures', 
        'household_bills', 
        'personal_budget', 
        'transactions', 
        'payments'
    ];

    try {
        // Check if migration is needed by checking if the target business already has data
        const checkRef = getBusinessCollection(targetBusinessId, 'transactions');
        const checkSnap = await getDocs(checkRef);
        
        if (!checkSnap.empty) {
            console.log('Migration skipped: Business data already exists.');
            return; 
        }

        console.log('Starting Migration: Top-level -> Business Scoped...');
        const batch = writeBatch(db);
        let operationCount = 0;

        for (const colName of collectionsToMigrate) {
            const oldRef = collection(db, colName);
            const snapshot = await getDocs(oldRef);

            if (snapshot.empty) continue;

            // Map old collection names to new standard ones
            let targetColName = colName;
            if (colName === 'expenditure') targetColName = 'expenditures';

            const newRef = getBusinessCollection(targetBusinessId, targetColName);

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Add tenantId if missing
                const newData = { 
                    ...data, 
                    tenantId: targetBusinessId,
                    // Normalize on migration
                    timestamp: normalizeDate(data.timestamp || data.date),
                    amount: normalizeNumber(data.amount)
                };
                const newDocRef = doc(newRef, docSnap.id);
                batch.set(newDocRef, newData);
                operationCount++;
            });
        }

        if (operationCount > 0) {
            await batch.commit();
            console.log(`Migration Complete: Moved ${operationCount} documents to ${targetBusinessId}`);
        } else {
            console.log('Migration: No legacy data found. Running Seeder...');
            await seedDatabase();
        }

    } catch (error) {
        console.warn('Migration failed (likely permission/offline):', error);
        // Fallback to seeding in case of error
        await seedDatabase();
    }
};

// --- Seeding Function ---
export const seedDatabase = async () => {
    try {
        const tenantsSnap = await getDocs(globalTenantsRef);
        if (!tenantsSnap.empty) return; 

        console.log('Seeding Business Scoped Data...');
        const batch = writeBatch(db);

        // Global Data
        [...InitialData.INITIAL_TENANTS, InitialData.INALA_HOLDINGS_TENANT].forEach(t => {
            batch.set(doc(globalTenantsRef, t.id), t);
        });
        InitialData.INITIAL_USERS.forEach(u => {
            batch.set(doc(globalUsersRef, u.id), u);
        });

        // Business Data Distribution
        InitialData.INITIAL_PRODUCTS.forEach(p => {
            batch.set(doc(getBusinessCollection(p.tenantId, 'products'), p.id), p);
        });
        InitialData.INITIAL_CUSTOMERS.forEach(c => {
            batch.set(doc(getBusinessCollection(c.tenantId, 'customers'), c.id), c);
        });
        InitialData.INITIAL_TRANSACTIONS.forEach(t => {
            batch.set(doc(getBusinessCollection(t.tenantId, 'transactions'), t.id), t);
            
            if (t.type === TransactionType.SALE) {
                batch.set(doc(getBusinessCollection(t.tenantId, 'sales'), t.id), t);
            } else if (t.type === TransactionType.DEBT_PAYMENT) {
                 batch.set(doc(getBusinessCollection(t.tenantId, 'payments'), t.id), t);
            }
        });
        InitialData.INITIAL_EXPENSES.forEach(e => {
            batch.set(doc(getBusinessCollection(e.tenantId, 'expenditures'), e.id), e);
        });
        InitialData.INITIAL_LOANS.forEach(l => {
            batch.set(doc(getBusinessCollection(l.tenantId, 'loans'), l.id), l);
        });
        InitialData.INITIAL_STOKVEL_MEMBERS.forEach(m => {
            batch.set(doc(getBusinessCollection(m.tenantId, 'members'), m.id), m);
        });
        InitialData.INITIAL_CONTRIBUTIONS.forEach(c => {
            batch.set(doc(getBusinessCollection(c.tenantId, 'contributions'), c.id), c);
        });

        await batch.commit();
        console.log('Seeding Complete.');
    } catch (error) {
        console.warn('Seeding skipped:', error);
    }
};

// --- DATA ACCESS LAYER (Business Scoped) ---

// Products
export const getProducts = async (tenantId?: string | null): Promise<Product[]> => {
    if (!tenantId) return InitialData.INITIAL_PRODUCTS;
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'products'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
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
export const deleteProduct = async (productId: string) => {
    console.warn("Delete requires tenant context in new architecture");
};

// Transactions
export const getTransactions = async (tenantId: string): Promise<Transaction[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'transactions'));
        return snap.docs.map(d => {
            const data = d.data();
            // Ensure data integrity
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                timestamp: normalizeDate(data.timestamp),
                items: data.items ? data.items.map((i: any) => ({
                    ...i,
                    qty: normalizeNumber(i.qty),
                    price: normalizeNumber(i.price),
                    subtotal: normalizeNumber(i.subtotal)
                })) : undefined
            } as Transaction;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, InitialData.INITIAL_TRANSACTIONS.filter(t => t.tenantId === tenantId));
};

export const addTransaction = async (transaction: Transaction) => {
    try {
        const batch = writeBatch(db);
        // Ensure strictly valid data
        const safeTransaction = {
            ...transaction,
            amount: normalizeNumber(transaction.amount),
            timestamp: normalizeDate(transaction.timestamp)
        };

        // 1. Master Ledger
        batch.set(doc(getBusinessCollection(transaction.tenantId, 'transactions'), transaction.id), safeTransaction);
        
        // 2. Collection specific routing
        if (transaction.type === TransactionType.SALE) {
            batch.set(doc(getBusinessCollection(transaction.tenantId, 'sales'), transaction.id), safeTransaction);
        } else if (transaction.type === TransactionType.DEBT_PAYMENT) {
            batch.set(doc(getBusinessCollection(transaction.tenantId, 'payments'), transaction.id), safeTransaction);
        } else if (transaction.type === TransactionType.EXPENSE) {
             batch.set(doc(getBusinessCollection(transaction.tenantId, 'expenditures'), transaction.id), safeTransaction);
        }

        // 3. Update Customer Balance if applicable
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
    } catch (e) {
        console.error("Error adding transaction:", e);
    }
};

// Customers
export const getCustomers = async (tenantId: string): Promise<Customer[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'customers'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
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

// Expenses
export const getExpenses = async (tenantId: string): Promise<Expense[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'expenditures'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                date: normalizeDate(data.date)
            } as Expense;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, InitialData.INITIAL_EXPENSES.filter(e => e.tenantId === tenantId));
};
export const addExpense = async (expense: Expense) => {
    try { await setDoc(doc(getBusinessCollection(expense.tenantId, 'expenditures'), expense.id), expense); } catch (e) {}
};

// Stokvel
export const getStokvelMembers = async (tenantId: string): Promise<StokvelMember[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'members'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                monthlyPledge: normalizeNumber(data.monthlyPledge),
                totalContributed: normalizeNumber(data.totalContributed),
                payoutQueuePosition: normalizeNumber(data.payoutQueuePosition),
                joinDate: normalizeDate(data.joinDate)
            } as StokvelMember;
        });
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
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                date: normalizeDate(data.date)
            } as Contribution;
        });
    }, InitialData.INITIAL_CONTRIBUTIONS.filter(c => c.tenantId === tenantId));
};

export const getLoans = async (tenantId?: string): Promise<Loan[]> => {
    if (!tenantId) return InitialData.INITIAL_LOANS;
    return fetchWithFallback(async () => {
        const snap = await getDocs(getBusinessCollection(tenantId, 'loans'));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                amount: normalizeNumber(data.amount),
                interestRate: normalizeNumber(data.interestRate),
                totalRepayable: normalizeNumber(data.totalRepayable),
                balanceRemaining: normalizeNumber(data.balanceRemaining),
                startDate: normalizeDate(data.startDate),
                dueDate: normalizeDate(data.dueDate)
            } as Loan;
        });
    }, InitialData.INITIAL_LOANS.filter(l => l.tenantId === tenantId));
};

// --- GLOBAL (Tenants, Users, POPs, Emails) ---

export const getTenants = async (): Promise<Tenant[]> => {
    return fetchWithFallback(async () => {
        const snap = await getDocs(globalTenantsRef);
        return snap.docs.map(d => d.data() as Tenant);
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
export const updateUser = async (user: User) => {
    try { await updateDoc(doc(globalUsersRef, user.id), { ...user }); } catch (e) {}
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
                timestamp: normalizeDate(data.timestamp)
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
        return snap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id,
                timestamp: normalizeDate(data.timestamp)
            } as EmailMessage;
        });
    }, InitialData.INITIAL_EMAILS);
};
export const sendEmail = async (email: EmailMessage) => {
    try { await setDoc(doc(globalEmailsRef, email.id), email); } catch (e) {}
};