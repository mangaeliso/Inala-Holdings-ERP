
import React, { useState } from 'react';
import { MOCK_EXPENSES, MOCK_TRANSACTIONS, addExpense } from '../services/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Expense, TransactionType } from '../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpensesProps {
  tenantId: string;
}

export const Expenses: React.FC<ExpensesProps> = ({ tenantId }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Rent',
    date: new Date().toISOString().split('T')[0]
  });

  const expenses = MOCK_EXPENSES.filter(e => e.tenantId === tenantId);
  const transactions = MOCK_TRANSACTIONS.filter(t => t.tenantId === tenantId && t.type === TransactionType.SALE);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleAddExpense = () => {
    if (!formData.description || !formData.amount) return;
    
    addExpense({
      id: `exp_${Date.now()}`,
      tenantId,
      description: formData.description,
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      status: 'PAID'
    });
    setShowModal(false);
    setFormData({ description: '', amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0] });
  };

  const chartData = [
    { name: 'Revenue', amount: totalRevenue },
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Net Profit', amount: netProfit }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Expense Management</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-emerald-500">
           <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
           <h3 className="text-2xl font-bold text-slate-900 dark:text-white">R {totalRevenue.toLocaleString()}</h3>
           <TrendingUp className="text-emerald-500 mt-2" size={20} />
        </Card>
        <Card className="border-l-4 border-red-500">
           <p className="text-sm text-slate-500 mb-1">Total Expenses</p>
           <h3 className="text-2xl font-bold text-slate-900 dark:text-white">R {totalExpenses.toLocaleString()}</h3>
           <TrendingDown className="text-red-500 mt-2" size={20} />
        </Card>
        <Card className={`border-l-4 ${netProfit >= 0 ? 'border-indigo-500' : 'border-orange-500'}`}>
           <p className="text-sm text-slate-500 mb-1">Net Profit</p>
           <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>R {netProfit.toLocaleString()}</h3>
           <DollarSign className="text-indigo-500 mt-2" size={20} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense List */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg">Expense History</h3>
            {expenses.map(expense => (
              <Card key={expense.id} className="flex justify-between items-center" noPadding>
                 <div className="p-4 flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{expense.description}</span>
                    <div className="flex gap-2 text-xs text-slate-500 mt-1">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><Tag size={10}/> {expense.category}</span>
                      <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                 </div>
                 <div className="p-4 text-right">
                    <span className="font-bold text-red-600">- R {expense.amount.toFixed(2)}</span>
                    <p className="text-xs text-slate-400 mt-1">{expense.status}</p>
                 </div>
              </Card>
            ))}
        </div>

        {/* Profit Chart */}
        <Card>
            <h3 className="font-bold text-lg mb-4">Profitability Analysis</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record New Expense">
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-sm font-medium">Description</label>
               <input 
                  type="text" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700"
                  placeholder="e.g. Weekly Restock"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-sm font-medium">Amount (R)</label>
                   <input 
                      type="number" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700"
                      placeholder="0.00"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-sm font-medium">Category</label>
                   <select 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700"
                   >
                      <option>Rent</option>
                      <option>Utilities</option>
                      <option>Supplies</option>
                      <option>Salaries</option>
                      <option>Maintenance</option>
                      <option>Marketing</option>
                      <option>Other</option>
                   </select>
                </div>
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium">Date</label>
               <input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700"
               />
            </div>
            <Button className="w-full mt-4" onClick={handleAddExpense}>
               Save Expense
            </Button>
         </div>
      </Modal>
    </div>
  );
};
