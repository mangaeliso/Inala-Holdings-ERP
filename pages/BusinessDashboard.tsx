
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
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                         <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover rounded" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{tenant.name}</h2>
                        <span className="text-xs text-slate-500 font-medium">Business Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
            {activeTab === 'pos' && <div className="h-full p-6 overflow-hidden"><POS tenantId={tenantId} /></div>}
            {activeTab === 'inventory' && <div className="h-full p-6 overflow-y-auto"><Inventory tenantId={tenantId} /></div>}
            {activeTab === 'customers' && <div className="h-full p-6 overflow-y-auto"><Customers tenantId={tenantId} /></div>}
            {activeTab === 'reports' && <div className="h-full p-6 overflow-y-auto"><Reports tenantId={tenantId} /></div>}
            {activeTab === 'expenses' && <div className="h-full p-6 overflow-y-auto"><Expenses tenantId={tenantId} /></div>}
        </div>
    </div>
  );
};
