import React from 'react';
import { INITIAL_TENANTS } from '../services/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, MoreHorizontal, Users, CreditCard, Activity, CheckCircle2 } from 'lucide-react';

export const Tenants: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h2>
                <p className="text-slate-500 text-sm">Manage organizations, subscriptions, and global settings.</p>
            </div>
            <Button>
                <Plus size={18} className="mr-2" />
                Add Organization
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INITIAL_TENANTS.map(tenant => (
                <Card key={tenant.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: tenant.primaryColor }}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <img src={tenant.logoUrl} alt={tenant.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{tenant.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                        <CheckCircle2 size={10} className="mr-1" /> Active
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 border border-slate-200 rounded">
                                        {tenant.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Subscription</p>
                            <p className="text-sm font-bold text-slate-700">{tenant.subscriptionTier}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Renewal</p>
                            <p className="text-sm font-bold text-slate-700">Nov 5, 2025</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                         <Button variant="outline" size="sm" className="w-full text-xs">Manage Users</Button>
                         <Button variant="outline" size="sm" className="w-full text-xs">Settings</Button>
                    </div>
                </Card>
            ))}
            
            {/* Add New Placeholder Card */}
            <button className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-slate-50 transition-all group">
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-medium">Register New Tenant</span>
            </button>
        </div>
    </div>
  );
};