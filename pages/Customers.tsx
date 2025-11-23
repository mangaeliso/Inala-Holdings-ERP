
import React, { useState } from 'react';
import { MOCK_CUSTOMERS, addTransaction } from '../services/mockData';
import { Customer, TransactionType, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Phone, FileText, Upload, CheckCircle, Calendar, User, CreditCard } from 'lucide-react';

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
      setReceiver(''); // Reset receiver or set to default if available
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
          status: 'PENDING', // Pending POP verification if upload, else can be COMPLETED depending on flow
          timestamp: new Date(paymentDate).toISOString(),
          reference: 'DEBT-PAYMENT',
          receivedBy: receiver
      });

      alert('Payment Recorded!');
      setShowPayModal(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer & Debtor Management</h2>
          <Button>Export Debtor Book</Button>
       </div>

       <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
           />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {customers.map(customer => (
               <Card key={customer.id} className="relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1 h-full ${customer.currentDebt > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                   
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <h3 className="font-bold text-lg text-slate-900 dark:text-white">{customer.name}</h3>
                           <p className="text-sm text-slate-500 flex items-center gap-1"><Phone size={12}/> {customer.phone}</p>
                       </div>
                       {customer.currentDebt > 0 && (
                           <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Owing</span>
                       )}
                   </div>

                   <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                       <div>
                           <p className="text-xs text-slate-500 uppercase">Outstanding Balance</p>
                           <p className={`text-xl font-bold ${customer.currentDebt > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                               R {customer.currentDebt.toFixed(2)}
                           </p>
                       </div>
                       {customer.currentDebt > 0 && (
                           <Button size="sm" onClick={() => handlePayClick(customer)}>Record Payment</Button>
                       )}
                   </div>
               </Card>
           ))}
       </div>

       <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Debt Payment">
            <div className="space-y-4">
                <p className="text-slate-500 text-sm">Recording payment for <strong>{selectedCustomer?.name}</strong>. Total Debt: <span className="text-red-500 font-bold">R {selectedCustomer?.currentDebt.toFixed(2)}</span></p>
                
                {/* Payment Type Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => handlePaymentTypeChange('PARTIAL')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentType === 'PARTIAL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        Partial Payment
                    </button>
                    <button 
                        onClick={() => handlePaymentTypeChange('FULL')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentType === 'FULL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        Full Settlement
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Amount (R)</label>
                        <input 
                            type="number" 
                            value={paymentAmount} 
                            onChange={(e) => setPaymentAmount(e.target.value)} 
                            disabled={paymentType === 'FULL'}
                            className="w-full border p-2.5 rounded-lg dark:bg-slate-800 dark:border-slate-700 font-mono text-lg font-bold"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Method</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 appearance-none"
                            >
                                <option value={PaymentMethod.CASH}>Cash</option>
                                <option value={PaymentMethod.EFT}>EFT</option>
                                <option value={PaymentMethod.MOMO}>MoMo</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Received By</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={receiver}
                                onChange={(e) => setReceiver(e.target.value)}
                                placeholder="Staff Name"
                                className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <Upload className="mx-auto text-slate-400 mb-2" size={20} />
                        <p className="text-xs font-medium">Attach Proof of Payment (Optional)</p>
                    </div>
                </div>

                <Button className="w-full h-11 text-base shadow-lg shadow-indigo-500/20" onClick={processPayment} disabled={!paymentAmount || !receiver}>
                    Confirm Payment
                </Button>
            </div>
       </Modal>
    </div>
  );
};
