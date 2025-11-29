import React, { useState, useEffect } from 'react';
import { getCustomers, addTransaction } from '../services/firestore';
import { Customer, TransactionType, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Phone, ShoppingBag, Clock, User, CreditCard, TrendingDown } from 'lucide-react';

interface CustomersProps {
  tenantId: string;
}

export const Customers: React.FC<CustomersProps> = ({ tenantId }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFT);
  const [receiver, setReceiver] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const data = await getCustomers(tenantId);
        setCustomers(data);
      } catch (err) {
        setError('Failed to load customers');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCustomers();
  }, [tenantId]);

  const filteredCustomers = customers.filter(c => 
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
          const debt = selectedCustomer.totalCredit || selectedCustomer.currentDebt || 0;
          setPaymentAmount(debt.toFixed(2));
      } else {
          setPaymentAmount('');
      }
  };

  const processPayment = async () => {
      if (!selectedCustomer) return;
      
      await addTransaction({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Database</h2>
              <p className="text-sm text-slate-500">View customer activity and credit status from Firestore.</p>
          </div>
          <Button variant="outline" className="bg-white dark:bg-slate-800">Export Report</Button>
       </div>

       <div className="relative max-w-lg">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
           />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredCustomers.map(customer => {
               const debt = customer.totalCredit ?? customer.currentDebt ?? 0;
               return (
               <div key={customer.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-lg transition-all duration-300">
                   {/* Debt Indicator Strip */}
                   <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl ${debt > 0 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                   
                   <div className="pl-4 flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 border-white dark:border-slate-800 shadow-sm bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`}>
                                {customer.name.charAt(0)}
                            </div>
                           <div>
                               <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{customer.name}</h3>
                               <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><ShoppingBag size={12}/> {customer.salesCount || 0} Sales</p>
                           </div>
                       </div>
                   </div>

                   <div className="pl-4 space-y-3">
                       <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800 pb-2">
                           <span className="text-slate-500 flex items-center gap-1"><Clock size={14}/> Last Purchase</span>
                           <span className="font-medium text-slate-900 dark:text-white">
                               {customer.lastPurchaseDate 
                                  ? new Date(customer.lastPurchaseDate).toLocaleDateString() 
                                  : 'N/A'}
                           </span>
                       </div>

                       <div className="flex justify-between items-end pt-1">
                           <div>
                               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Credit</p>
                               <p className={`text-2xl font-extrabold flex items-center gap-2 ${debt > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                                   R {debt.toFixed(2)}
                               </p>
                           </div>
                           {debt > 0 ? (
                               <Button size="sm" onClick={() => handlePayClick(customer)} className="shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-none">
                                   Record Pay
                               </Button>
                           ) : (
                               <div className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                   Good Standing
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )})}
           
           {filteredCustomers.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-400">
               <p>No customers found matching your search.</p>
             </div>
           )}
       </div>

       <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment" size="sm">
            <div className="space-y-6 pt-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Total Credit / Debt</p>
                    <p className="text-3xl font-extrabold text-amber-500">
                        R {(selectedCustomer?.totalCredit ?? selectedCustomer?.currentDebt ?? 0).toFixed(2)}
                    </p>
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