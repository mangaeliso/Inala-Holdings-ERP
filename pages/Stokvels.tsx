import React from 'react';
import { MOCK_TENANTS } from '../services/mockData';
import { TenantType } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Users, ShieldCheck, Wallet, ArrowRight, Calendar, Star } from 'lucide-react';

interface StokvelsProps {
    onOpenModule?: (moduleId: string, tenantId: string) => void;
}

export const Stokvels: React.FC<StokvelsProps> = ({ onOpenModule }) => {
  const stokvels = MOCK_TENANTS.filter(t => t.type === TenantType.STOKVEL);

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stokvel Groups</h2>
                <p className="text-slate-500 mt-2 text-base">Manage your cooperative savings groups, member rotations, and automated payouts.</p>
            </div>
            <Button className="shadow-lg shadow-indigo-500/20">
                <Plus size={18} className="mr-2" />
                Register New Group
            </Button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stokvels.map(stok => (
                <div 
                    key={stok.id} 
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                    {/* Top Accent Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 opacity-50 z-0"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-full z-0" style={{ color: stok.primaryColor }}></div>

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm">
                                <img src={stok.logoUrl} alt={stok.name} className="w-full h-full rounded-xl object-cover" />
                            </div>
                            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Star size={12} className="text-amber-400 fill-amber-400" /> Premium
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{stok.name}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                            A community savings group dedicated to mutual financial growth and support.
                        </p>

                        {/* Stats Strip */}
                        <div className="grid grid-cols-3 gap-2 mb-6 border-y border-slate-100 dark:border-slate-800 py-4">
                            <div className="text-center">
                                 <div className="text-indigo-500 mb-1 flex justify-center"><Users size={18}/></div>
                                 <div className="font-bold text-slate-900 dark:text-white">42</div>
                                 <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Members</div>
                            </div>
                            <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                 <div className="text-emerald-500 mb-1 flex justify-center"><Wallet size={18}/></div>
                                 <div className="font-bold text-slate-900 dark:text-white">R 45k</div>
                                 <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Pool</div>
                            </div>
                            <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                 <div className="text-amber-500 mb-1 flex justify-center"><Calendar size={18}/></div>
                                 <div className="font-bold text-slate-900 dark:text-white">25th</div>
                                 <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Payout</div>
                            </div>
                        </div>

                        <Button 
                            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors h-11"
                            onClick={() => onOpenModule && onOpenModule('stokvel-dashboard', stok.id)}
                        >
                            Open Dashboard <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>
            ))}
            
            {/* Create New Card */}
            <button className="relative group rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-300 min-h-[380px]">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center mb-4 transition-colors">
                    <Plus size={32} className="text-slate-400 group-hover:text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Start a New Stokvel</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">Create a new group, invite members, and set up automated contribution tracking.</p>
            </button>
        </div>
    </div>
  );
};