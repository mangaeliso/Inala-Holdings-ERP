import React, { useState } from 'react';
import { MOCK_TENANTS } from '../services/mockData';
import { POS } from './POS';
import { Inventory } from './Inventory';
import { Customers } from './Customers';
import { Reports } from './Reports';
import { Expenses } from './Expenses';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart2, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';

interface BusinessDashboardProps {
  tenantId: string;
  onBack: () => void;
  initialTab?: string;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ tenantId, onBack, initialTab = 'pos' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const tenant = MOCK_TENANTS.find(t => t.id === tenantId);

  if (!tenant) return <div>Business not found</div>;

  const tabs = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in bg-slate-50 dark:bg-slate-950">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <button 
                  onClick={onBack} 
                  className="group p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-1 shadow-inner">
                         <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">{tenant.name}</h2>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                           Business Terminal
                        </span>
                    </div>
                </div>
            </div>

            {/* Floating Tab Dock */}
            <div className="mt-4 md:mt-0 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex overflow-x-auto max-w-full no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                            activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md transform scale-100'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area with slight padding for card effect */}
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
                {activeTab === 'pos' && <div className="h-full p-4 md:p-6 overflow-hidden"><POS tenantId={tenantId} /></div>}
                {activeTab === 'inventory' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Inventory tenantId={tenantId} /></div>}
                {activeTab === 'customers' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Customers tenantId={tenantId} /></div>}
                {activeTab === 'reports' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Reports tenantId={tenantId} /></div>}
                {activeTab === 'expenses' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Expenses tenantId={tenantId} /></div>}
            </div>
        </div>
    </div>
  );
};