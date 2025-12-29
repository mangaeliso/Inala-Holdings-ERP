import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  CreditCard, Plus, CheckCircle, Search, Calendar, ChevronRight, X,
  AlertTriangle, RefreshCw, Handshake, DollarSign, ShieldAlert,
  UserCheck, History, Info, Settings2, MoreVertical
} from 'lucide-react';
import { getLoans, getCustomers, addLoan, recordLoanRepayment, manualOverrideLoanStatus } from '../services/firestore';
import { Loan, Customer, LoanStatus, UserRole } from '../types';
import { useUI } from '../context/UIContext';

export const LoanDashboard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const { addToast, currentUser } = useUI();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showGovModal, setShowGovModal] = useState(false);
  
  // Selections
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [newLoan, setNewLoan] = useState({
      amount: 0, interestRate: 20, dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const load = async () => {
    setIsLoading(true);
    try {
        const [l, c] = await Promise.all([getLoans(tenantId), getCustomers(tenantId)]);
        setLoans(l || []);
        setCustomers(c || []);
    } catch (e) { 
        console.error("Loan sync failed", e);
        addToast("Error syncing loan data", "error");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [tenantId]);

  const handleDisburse = async () => {
      if (!selectedCustomer || newLoan.amount <= 0) return;
      setIsProcessing(true);
      try {
          const repayable = newLoan.amount * (1 + (newLoan.interestRate / 100));
          const loanData: Loan = {
              id: `loan_${Date.now()}`, 
              tenantId, 
              customerId: selectedCustomer.id, 
              customerName: selectedCustomer.name,
              amount: newLoan.amount, 
              interestRate: newLoan.interestRate, 
              totalRepayable: repayable,
              balanceRemaining: repayable, 
              startDate: new Date().toISOString(), 
              dueDate: new Date(newLoan.dueDate).toISOString(),
              status: LoanStatus.ACTIVE, 
              approvals: []
          };
          await addLoan(loanData);
          await load();
          setShowLoanModal(false);
          addToast('Loan disbursed and logged.', 'success');
      } catch (err) {
          addToast('Failed to disburse loan.', 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleRepayment = async () => {
      if (!selectedLoan || !repayAmount) return;
      setIsProcessing(true);
      try {
          await recordLoanRepayment(tenantId, selectedLoan.id, Number(repayAmount), currentUser?.name || 'Admin');
          addToast('Repayment verified and recorded.', 'success');
          setShowRepayModal(false);
          setRepayAmount('');
          await load();
      } catch (e) { 
          addToast('Payment recording failed.', 'error'); 
      } finally { 
          setIsProcessing(false); 
      }
  };

  const handleGovAction = async (status: LoanStatus) => {
    if (!selectedLoan) return;
    setIsProcessing(true);
    try {
        await manualOverrideLoanStatus(tenantId, selectedLoan.id, status);
        await load();
        addToast(`Loan status manually resolved to ${status}.`, 'success');
        setShowGovModal(false);
    } catch (err) {
        addToast('Governance update failed.', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.TENANT_ADMIN;

  if (isLoading) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p className="font-bold text-xs uppercase tracking-widest">Auditing Portfolios...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Enterprise Loan Hub</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manual Governance & Lifecycle Management</p>
            </div>
            <Button onClick={() => setShowLoanModal(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xl h-11 px-6 font-black uppercase text-xs tracking-widest">
                <Plus size={18} className="mr-2"/> New Disbursement
            </Button>
        </div>

        <Card noPadding className="overflow-hidden border-0 shadow-2xl rounded-3xl">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 tracking-widest">
                        <tr>
                            <th className="px-6 py-5">Borrower</th>
                            <th className="px-6 py-5">Principal</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5">Due Date</th>
                            <th className="px-6 py-5 text-right">Balance</th>
                            <th className="px-6 py-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {loans.map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-indigo-950/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500 text-xs uppercase">
                                            {loan.customerName.charAt(0)}
                                        </div>
                                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{loan.customerName}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-bold">R {loan.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                        loan.status === LoanStatus.DEFAULTED ? 'bg-red-50 text-red-600 border-red-100' : 
                                        loan.status === LoanStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    }`}>
                                        {loan.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-400">
                                    {new Date(loan.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className={`text-lg font-black ${loan.balanceRemaining > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                                        R {loan.balanceRemaining.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {loan.balanceRemaining > 0 && (
                                            <button 
                                                onClick={() => { setSelectedLoan(loan); setRepayAmount(loan.balanceRemaining.toString()); setShowRepayModal(true); }} 
                                                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm group"
                                                title="Record Payment"
                                            >
                                                <DollarSign size={16} className="group-hover:scale-110 transition-transform"/>
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button 
                                                onClick={() => { setSelectedLoan(loan); setShowGovModal(true); }} 
                                                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all shadow-sm"
                                                title="Governance Override"
                                            >
                                                <Settings2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* Modal: Governance Override */}
        <Modal isOpen={showGovModal} onClose={() => setShowGovModal(false)} title="Manual Governance Override" size="sm">
            <div className="space-y-6 pt-2">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-relaxed">
                        Manually overriding status bypasses automated system checks. This action is logged in the organizational audit trail.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Resolve Status As:</p>
                    <div className="grid grid-cols-1 gap-2">
                        {[LoanStatus.ACTIVE, LoanStatus.DEFAULTED, LoanStatus.REJECTED, LoanStatus.PAID].map(st => (
                            <button 
                                key={st}
                                onClick={() => handleGovAction(st)}
                                className={`w-full p-4 rounded-2xl font-black uppercase text-xs text-left border transition-all flex items-center justify-between group ${
                                    selectedLoan?.status === st 
                                    ? 'bg-indigo-600 text-white border-indigo-700' 
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:border-indigo-500'
                                }`}
                            >
                                {st}
                                {selectedLoan?.status === st && <CheckCircle size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
                
                <Button variant="ghost" className="w-full" onClick={() => setShowGovModal(false)}>Cancel</Button>
            </div>
        </Modal>

        {/* Modal: Repayment */}
        <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)} title="Lending Recovery Ledger" size="sm">
            <div className="space-y-6 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-center border border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Outstanding</p>
                    <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">R {selectedLoan?.balanceRemaining.toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase">{selectedLoan?.customerName}</p>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Record Repayment (R)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            inputMode="decimal"
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                            value={repayAmount} 
                            autoFocus
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                if (val.split('.').length <= 2) setRepayAmount(val);
                            }}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                    <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed uppercase">
                        Payment will be verified against the liquid pool and deducted from member liability.
                    </p>
                </div>

                <Button 
                    className="w-full h-14 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-500/30 rounded-2xl active:scale-95 transition-all" 
                    onClick={handleRepayment} 
                    isLoading={isProcessing}
                    disabled={!repayAmount || Number(repayAmount) <= 0}
                >
                    Finalize Collection
                </Button>
            </div>
        </Modal>

        {/* Modal: New Loan Disbursement */}
        <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Capital Disbursement" size="sm">
             <div className="space-y-6 pt-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Identify Borrower</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            className="w-full pl-10 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                            placeholder="Search borrower registry..." 
                            value={customerSearch} 
                            onChange={e => setCustomerSearch(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Loan Principal (R)</label>
                    <input 
                        type="number" 
                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white font-black text-xl outline-none border-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                        value={newLoan.amount || ''} 
                        onChange={e => setNewLoan({...newLoan, amount: Number(e.target.value)})} 
                        placeholder="0.00"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Interest Rate %</label>
                        <input 
                            type="number" 
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                            value={newLoan.interestRate} 
                            onChange={e => setNewLoan({...newLoan, interestRate: Number(e.target.value)})} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Due Date</label>
                        <input 
                            type="date" 
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                            value={newLoan.dueDate} 
                            onChange={e => setNewLoan({...newLoan, dueDate: e.target.value})} 
                        />
                    </div>
                </div>

                <Button 
                    className="w-full h-14 font-black uppercase text-xs tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-2xl active:scale-95 transition-all" 
                    onClick={handleDisburse} 
                    isLoading={isProcessing}
                    disabled={!newLoan.amount}
                >
                    Approve & Disburse Capital
                </Button>
             </div>
        </Modal>
    </div>
  );
};