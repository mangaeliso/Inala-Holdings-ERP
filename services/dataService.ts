import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/db';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { sanitizeData } from './firestore'; 

/**
 * Fetches documents from business-scoped sub-collections.
 */
async function fetchScopedCollection(tenantId: string, subCollection: string) {
  const colRef = collection(db, 'businesses', tenantId, subCollection);
  let docs: any[] = [];

  try {
    const snap = await getDocs(colRef);
    if (!snap.empty) {
        docs = snap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) }));
    }
  } catch (error) {
    console.warn(`Error fetching scoped ${subCollection} for ${tenantId}`, error);
  }

  // Normalize Data Structure
  return docs.map(d => ({
      ...d,
      createdAt: d.timestamp || d.date || d.createdAt || new Date().toISOString(),
      total: Number(d.amount || d.total || d.value || 0),
      amount: Number(d.amount || d.total || d.value || 0),
      customerId: d.customerId || d.customer_id,
      customerName: d.customerName || d.customer_name || d.clientName || 'Unknown',
      paymentMethod: d.paymentMethod || d.payment_method || d.method || 'CASH'
  }));
}

export async function fetchSalesByPeriod(tenantId: string, startDate: Date, endDate: Date) {
  const allSales = await fetchScopedCollection(tenantId, 'sales');
  
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return allSales.filter(s => {
      let d = s.createdAt;
      if (d && !d.includes('T') && d.length > 10) {
          d = new Date(d).toISOString();
      }
      return d >= startIso && d <= endIso;
  }).map(s => ({
      ...s,
      type: TransactionType.SALE
  }));
}

export async function fetchExpensesByPeriod(tenantId: string, startDate: Date, endDate: Date) {
  const allExpenses = await fetchScopedCollection(tenantId, 'expenses');

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return allExpenses.filter(e => {
      let d = e.createdAt;
      if (d && d.length === 10 && d.includes('-')) {
          d = new Date(d).toISOString();
      }
      return d >= startIso && d <= endIso;
  }).map(e => ({
      ...e,
      amount: e.amount || e.total, 
      type: TransactionType.EXPENSE,
      description: e.description || e.item || 'General Expense'
  }));
}

export async function fetchPaymentsByPeriod(tenantId: string, startDate: Date, endDate: Date) {
    const allPayments = await fetchScopedCollection(tenantId, 'payments');
    
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
  
    return allPayments.filter(p => {
        let d = p.createdAt;
        if (d && !d.includes('T')) d = new Date(d).toISOString();
        return d >= startIso && d <= endIso;
    }).map(p => ({
        ...p,
        type: TransactionType.DEBT_PAYMENT
    }));
}

export async function fetchOutstandingCredits(tenantId: string) {
  const [sales, payments] = await Promise.all([
      fetchScopedCollection(tenantId, 'sales'),
      fetchScopedCollection(tenantId, 'payments')
  ]);

  const balances: Record<string, any> = {};

  sales.forEach(sale => {
    const method = String(sale.paymentMethod).toLowerCase();
    const status = String(sale.status || '').toLowerCase();
    const isCredit = method.includes('credit') || status === 'credit';

    if (!isCredit) return;

    const cid = sale.customerId || sale.customerName || 'unknown';
    if (!balances[cid]) {
        balances[cid] = {
            customerId: cid,
            customerName: sale.customerName || 'Unknown',
            totalCredit: 0,
            totalPaid: 0,
            totalOwed: 0,
            transactions: []
        };
    }

    balances[cid].totalCredit += sale.total;
    balances[cid].transactions.push({
        id: sale.id,
        date: sale.createdAt,
        type: 'SALE',
        amount: sale.total,
        isPaid: false
    });
  });

  payments.forEach(pay => {
      const cid = pay.customerId || pay.customerName || 'unknown';
      if (balances[cid]) {
          balances[cid].totalPaid += pay.total;
          balances[cid].transactions.push({
              id: pay.id,
              date: pay.createdAt,
              type: 'PAYMENT',
              amount: pay.total,
              isPaid: true
          });
      }
  });

  return Object.values(balances)
    .map(b => {
      b.totalOwed = b.totalCredit - b.totalPaid;
      b.transactions.sort((x: any, y: any) => new Date(y.date).getTime() - new Date(x.date).getTime());
      return b;
    })
    .filter(b => b.totalOwed > 1); 
}

export async function fetchAllCreditHistory(tenantId: string, startDate: Date, endDate: Date) {
  const [sales, payments] = await Promise.all([
      fetchScopedCollection(tenantId, 'sales'),
      fetchScopedCollection(tenantId, 'payments')
  ]);
  
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const creditSales = sales.filter(s => {
      const method = String(s.paymentMethod).toLowerCase();
      const status = String(s.status || '').toLowerCase();
      const isCredit = method.includes('credit') || status === 'credit';
      let d = s.createdAt;
      if(d && !d.includes('T')) d = new Date(d).toISOString();
      return isCredit && d >= startIso && d <= endIso;
  }).map(s => ({
      ...s,
      type: TransactionType.SALE,
      isPaid: false, 
      amount: s.total
  }));

  const validPayments = payments.filter(p => {
      let d = p.createdAt;
      if(d && !d.includes('T')) d = new Date(d).toISOString();
      return d >= startIso && d <= endIso;
  }).map(p => ({
      ...p,
      type: TransactionType.DEBT_PAYMENT,
      isPaid: true,
      amount: p.total
  }));

  return [...creditSales, ...validPayments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function fetchComparisonData(tenantId: string) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    start.setDate(1);

    const [sales, expenses] = await Promise.all([
        fetchScopedCollection(tenantId, 'sales'),
        fetchExpensesByPeriod(tenantId, start, end) 
    ]);

    const monthlyStats: Record<string, { month: string, sales: number, expenses: number }> = {};

    const getMonthKey = (dateStr: string) => {
        if(!dateStr) return 'Unknown';
        try {
            const d = new Date(dateStr);
            return d.toISOString().substring(0, 7); 
        } catch { return 'Unknown'; }
    };

    sales.forEach(s => {
        const key = getMonthKey(s.createdAt);
        if (key < start.toISOString().substring(0,7)) return;
        
        if (!monthlyStats[key]) {
            monthlyStats[key] = { month: key, sales: 0, expenses: 0 };
        }
        monthlyStats[key].sales += s.total;
    });

    expenses.forEach(e => {
        const key = getMonthKey(e.createdAt);
        if (key < start.toISOString().substring(0,7)) return;

        if (!monthlyStats[key]) {
            monthlyStats[key] = { month: key, sales: 0, expenses: 0 };
        }
        monthlyStats[key].expenses += e.amount;
    });

    return Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
}
