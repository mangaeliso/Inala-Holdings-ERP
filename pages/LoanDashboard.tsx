
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  CreditCard, TrendingUp, Users, Clock, Plus, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle,
  Search, Calendar, DollarSign, UserPlus, X, ChevronRight,
  History, AlertTriangle, RefreshCw
} from 'lucide-react';
import { getLoans, getCustomers, addLoan, addCustomer, updateTenant } from '../services/firestore';
import { Loan, Customer, LoanStatus, UserRole } from '../types';
import { useUI } from '../context/UIContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/db';

interface LoanDashboardProps {
  tenantId: string;
}

export const LoanDashboard: React.FC<LoanDashboardProps> = ({ tenantId }) => {
  const { addToast } = useUI();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPenalties, setIsProcessingPenalties] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // New Loan Form
  const [newLoan, setNewLoan] = useState({
      customerId: '',
      amount: 0,
      interestRate: 20, // Default 20%
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // Default 1 month
  });

  // Client Search State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  /**
   * Auto-Compounding Sweep Logic
   * Identifies delayed loans and adds a cycle of interest if overdue.
   */
  const runOverdueSweep = useCallback(async (loanList: Loan[]) => {
    const now = new Date();
    const overdueLoans = loanList.filter(l => 
        l.status === LoanStatus.ACTIVE && 
        new Date(l.dueDate) < now &&
        l.balanceRemaining > 0 &&
        (!l.lastCompoundedDate || new Date(l.lastCompoundedDate).toDateString() !== now.toDateString())
    );

    if (overdueLoans.length === 0) return;

    setIsProcessingPenalties(true);
    let penaltyCount = 0;

    try {
        for (const loan of overdueLoans) {
            // Formula: Add interestRate % of CURRENT balance to the total
            const penaltyAmount = loan.balanceRemaining * (loan.interestRate / 100);
            const newBalance = loan.balanceRemaining + penaltyAmount;
            const newTotalRepayable = (loan.totalRepayable || loan.balanceRemaining) + penaltyAmount;

            const loanRef = doc(db, 'businesses', tenantId, 'loans', loan.id);
            await updateDoc(loanRef, {
                balanceRemaining: newBalance,
                totalRepayable: newTotalRepayable,
                lastCompoundedDate: now.toISOString(),
                status: LoanStatus.DEFAULTED // Flag as defaulted/delayed
            });
            penaltyCount++;
        }

        if (penaltyCount > 0) {
            addToast(`Applied interest penalties to ${penaltyCount} delayed loans.`, 'warning');
            // Refresh local list
            const updated = await getLoans(tenantId);
            setLoans(updated);
        }
    } catch (err) {
        console.error("Penalty sweep failed:", err);
    } finally {
        setIsProcessingPenalties(false);
    }
  }, [tenantId, addToast]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const l = await getLoans(tenantId);
        const c = await getCustomers(tenantId);
        setLoans(l);
        setCustomers(c);
        
        // Run automated sweep for delayed payments
        await runOverdueSweep(l);
      } catch (error) {
        console.error("Lending Hub Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [tenantId, runOverdueSweep]);

  const activeLoansValue = loans
    .filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED)
    .reduce((sum, l) => sum + (l.balanceRemaining || 0), 0);

  const pendingApprovals = loans.filter(l => l.status === LoanStatus.PENDING_APPROVAL).length;

  const handleDisburse = async () => {
      if (!selectedCustomer || newLoan.amount <= 0 || !newLoan.dueDate) {
          addToast('Please fill in all fields correctly.', 'error');
          return;
      }

      const totalRepayable = newLoan.amount * (1 + (newLoan.interestRate / 100));
      
      const loanId = `loan_${Date.now()}`;
      const loanData: Loan = {
          id: loanId,
          tenantId,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          amount: newLoan.amount,
          interestRate: newLoan.interestRate,
          totalRepayable,
          balanceRemaining: totalRepayable,
          startDate: new Date().toISOString(),
          dueDate: new Date(newLoan.dueDate).toISOString(),
          status: LoanStatus.ACTIVE,
          approvals: []
      };

      try {
          await addLoan(loanData);
          setLoans(prev => [loanData, ...prev]);
          setShowLoanModal(false);
          setCustomerSearch('');
          setSelectedCustomer(null);
          addToast('Loan successfully disbursed!', 'success');
      } catch (err) {
          console.error(err);
          addToast('Failed to record loan disbursement.', 'error');
      }
  };

  const handleCreateAndSelectCustomer = async () => {
      if (!customerSearch) return;
      
      const newId = `c_${Date.now()}`;
      const newCus: Customer = {
          id: newId,
          tenantId: tenantId,
          name: customerSearch,
          phone: '',
          creditLimit: 0,
          currentDebt: 0
      };

      try {
          await addCustomer(newCus);
          setCustomers(prev => [...prev, newCus]);
          setSelectedCustomer(newCus);
          setCustomerSearch('');
          addToast(`New client "${newCus.name}" registered.`, 'success');
      } catch (err) {
          addToast('Failed to create client.', 'error');
      }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase())
  );
  
  const exactMatch = customers.find(c => (c.name || '').toLowerCase() === customerSearch.toLowerCase());

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
          <RefreshCw size={32} className="animate-spin text-indigo-500" />
          <p className="font-medium">Analyzing loan book and enforcing penalties...</p>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-amber-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Active Portfolio</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    R {activeLoansValue.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">{loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED).length} Active Loans</p>
            </Card>
            <Card className="border-l-4 border-indigo-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Collected</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">R 0.00</h3>
                <p className="text-[10px] text-slate-400 mt-1">This cycle</p>
            </Card>
            <Card className="border-l-4 border-red-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Delayed Payments</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">{loans.filter(l => l.status === LoanStatus.DEFAULTED).length}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Interest compounded</p>
            </Card>
            <Card className="border-l-4 border-emerald-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Borrowers</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{customers.length}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Verified Clients</p>
            </Card>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Loan Book</h2>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => runOverdueSweep(loans)} 
                    isLoading={isProcessingPenalties}
                    className="hidden md:flex bg-white dark:bg-slate-800"
                >
                    <RefreshCw size={16} className={`mr-2 ${isProcessingPenalties ? 'animate-spin' : ''}`}/> Sync Penalties
                </Button>
                <Button onClick={() => setShowLoanModal(true)} className="bg-slate-900 text-white shadow-xl">
                    <Plus size={18} className="mr-2"/> Disburse Loan
                </Button>
            </div>
        </div>

        {/* Loan Table */}
        <Card noPadding>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Borrower</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expected Date</th>
                            <th className="px-6 py-4 text-right">Current Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loans.map(loan => {
                            const isOverdue = new Date(loan.dueDate) < new Date() && loan.balanceRemaining > 0;
                            return (
                                <tr key={loan.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {loan.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{loan.customerName}</p>
                                                <p className="text-[10px] text-slate-400 font-mono uppercase">ID: {loan.id.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-700 dark:text-slate-300">R {loan.amount.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400">Rate: {loan.interestRate}%</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit ${
                                            loan.status === LoanStatus.DEFAULTED ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            loan.status === LoanStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                                            loan.status === LoanStatus.PAID ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {loan.status === LoanStatus.DEFAULTED && <AlertTriangle size={12}/>}
                                            {isOverdue && loan.status !== LoanStatus.DEFAULTED ? 'OVERDUE' : loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                                {new Date(loan.dueDate).toLocaleDateString()}
                                            </span>
                                            {isOverdue && <span className="text-[10px] text-red-500 font-bold uppercase">Penalty Active</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className={`font-black text-lg ${isOverdue ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                            R {loan.balanceRemaining.toFixed(2)}
                                        </p>
                                        {isOverdue && <p className="text-[10px] text-red-400 italic">Compounded Balance</p>}
                                    </td>
                                </tr>
                            );
                        })}
                        {loans.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No active loans found in your book.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* Modal: New Loan */}
        <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="New Loan Disbursement" size="md">
            <div className="space-y-6 pt-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Borrower</label>
                    
                    {!selectedCustomer ? (
                        <div className="relative">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Search or type client name..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                />
                            </div>

                            {customerSearch && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                    <div className="p-2 space-y-1">
                                        {!exactMatch && (
                                            <button 
                                                onClick={handleCreateAndSelectCustomer}
                                                className="w-full text-left px-3 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 border border-amber-100 dark:border-amber-900/40"
                                            >
                                                <Plus size={18} className="bg-amber-600 text-white rounded-full p-0.5" />
                                                Register New Client: "{customerSearch}"
                                            </button>
                                        )}
                                        
                                        {filteredCustomers.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.name}</p>
                                                        <p className="text-[10px] text-slate-400">{c.phone || 'No phone number'}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-amber-900 dark:text-amber-100">{selectedCustomer.name}</p>
                                    <p className="text-xs text-amber-700/60 dark:text-amber-400/60">Borrower Verified</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedCustomer(null)}
                                className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800 rounded-full"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Principal Amount (R)</label>
                        <input 
                            type="number"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                            placeholder="0.00"
                            value={newLoan.amount || ''}
                            onChange={e => setNewLoan({...newLoan, amount: Number(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Interest Rate (%)</label>
                        <input 
                            type="number"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                            value={newLoan.interestRate}
                            onChange={e => setNewLoan({...newLoan, interestRate: Number(e.target.value)})}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expected Return Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="date"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                            value={newLoan.dueDate}
                            onChange={e => setNewLoan({...newLoan, dueDate: e.target.value})}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={10}/> Payments delayed past this date will auto-compound with an additional {newLoan.interestRate}% interest.
                    </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/30">
                    <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-bold">
                        <span className="text-sm uppercase tracking-wider">Total Repayable:</span>
                        <span className="text-2xl font-black">R {(newLoan.amount * (1 + (newLoan.interestRate / 100))).toFixed(2)}</span>
                    </div>
                </div>

                <Button 
                    className="w-full h-14 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50" 
                    onClick={handleDisburse}
                    disabled={!selectedCustomer || !newLoan.amount || !newLoan.dueDate}
                >
                    Confirm & Disburse Funds
                </Button>
            </div>
        </Modal>
    </div>
  );
};
