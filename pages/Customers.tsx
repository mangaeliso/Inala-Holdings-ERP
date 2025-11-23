import React, { useState } from 'react';
import { MOCK_CUSTOMERS, addTransaction } from '../services/mockData';
import { Customer, TransactionType, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Phone, FileText, Upload, CheckCircle, Calendar, User, CreditCard, ArrowUpRight, TrendingDown } from 'lucide-react';

interface CustomersProps {
  tenantId: string;
}

export const Customers: React.FC<CustomersProps> = ({ tenantId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFT);
  const [receiver, setReceiver] = useState('');

  const customers = MOCK_CUSTOMERS.filter(c => c.tenantId === tenantId).filter(c => 
     c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePayClick = (customer: Customer) => {
      setSelectedCustomer(customer);
      setShowPayModal(true);
      setPaymentAmount('');
      setPaymentType('PARTIAL');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(PaymentMethod.EFT);
      setReceiver('');
  };

  const handlePaymentTypeChange = (type: 'FULL' | 'PARTIAL') => {
      setPaymentType(type);
      if (type === 'FULL' && selectedCustomer) {
          setPaymentAmount(selectedCustomer.currentDebt.toFixed(2));
      } else {
          setPaymentAmount('');
      }
  };

  const processPayment = () => {
      if (!selectedCustomer) return;
      
      addTransaction({
          id: `tx_pay_${Date.now()}`,
          tenantId,
          branchId: 'b_001',
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          type: TransactionType.DEBT_PAYMENT,
          amount: Number(paymentAmount),
          currency: 'ZAR',
          method: paymentMethod,
          status: 'PENDING', 
          timestamp: new Date(paymentDate).toISOString(),
          reference: 'DEBT-PAYMENT',
          receivedBy: receiver
      });

      alert('Payment Recorded!');
      setShowPayModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h2>
              <p className="text-sm text-slate-500">Manage debtors and credit accounts.</p>
          </div>
          <Button variant="outline" className="bg-white dark:bg-slate-800">Export Report</Button>
       </div>

       <div className="relative max-w-lg">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
           />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {customers.map(customer => (
               <div key={customer.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-lg transition-all duration-300">
                   {/* Debt Indicator Strip */}
                   <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl ${customer.currentDebt > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                   
                   <div className="pl-4 flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 border-white dark:border-slate-800 shadow-sm ${customer.currentDebt > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                                {customer.name.charAt(0)}
                            </div>
                           <div>
                               <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{customer.name}</h3>
                               <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={12}/> {customer.phone}</p>
                           </div>
                       </div>
                       {customer.currentDebt > 0 && (
                           <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded">Owing</span>
                       )}
                   </div>

                   <div className="pl-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                       <div className="flex justify-between items-end">
                           <div>
                               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Current Balance</p>
                               <p className={`text-2xl font-extrabold flex items-center gap-2 ${customer.currentDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                   R {customer.currentDebt.toFixed(2)}
                                   {customer.currentDebt > 0 && <TrendingDown size={20} />}
                               </p>
                           </div>
                           {customer.currentDebt > 0 ? (
                               <Button size="sm" onClick={() => handlePayClick(customer)} className="shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white border-none">
                                   Pay Debt
                               </Button>
                           ) : (
                               <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                                   View History
                               </Button>
                           )}
                       </div>
                   </div>
               </div>
           ))}
       </div>

       <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment" size="sm">
            <div className="space-y-6 pt-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Customer owes</p>
                    <p className="text-3xl font-extrabold text-red-500">R {selectedCustomer?.currentDebt.toFixed(2)}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{selectedCustomer?.name}</p>
                </div>
                
                {/* Payment Type Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => handlePaymentTypeChange('PARTIAL')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'PARTIAL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Partial
                    </button>
                    <button 
                        onClick={() => handlePaymentTypeChange('FULL')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'FULL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Full Settlement
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to Pay</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</span>
                            <input 
                                type="number" 
                                value={paymentAmount} 
                                onChange={(e) => setPaymentAmount(e.target.value)} 
                                disabled={paymentType === 'FULL'}
                                className="w-full pl-8 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                            <input 
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Method</label>
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={PaymentMethod.CASH}>Cash</option>
                                <option value={PaymentMethod.EFT}>EFT</option>
                                <option value={PaymentMethod.MOMO}>MoMo</option>
                            </select>
                        </div>
                    </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Receiver (Staff)</label>
                        <input 
                            type="text"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-500/20" onClick={processPayment} disabled={!paymentAmount || !receiver}>
                    Confirm Payment
                </Button>
            </div>
       </Modal>
    </div>
  );
};