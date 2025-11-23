import React from 'react';
import { MOCK_TENANTS } from '../services/mockData';
import { TenantType } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, MoreHorizontal, ShoppingCart, LayoutDashboard, ArrowUpRight, Store, MapPin } from 'lucide-react';

interface BusinessesProps {
    onOpenModule: (moduleId: string, tenantId: string) => void;
}

export const Businesses: React.FC<BusinessesProps> = ({ onOpenModule }) => {
  const businesses = MOCK_TENANTS.filter(t => (t.type === TenantType.BUSINESS || t.type === TenantType.LENDING) && t.id !== 'global');

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Business Units & Lenders</h2>
                <p className="text-slate-500 mt-2 text-base">Overview of retail outlets, service points, and lending entities.</p>
            </div>
            <Button className="shadow-lg shadow-indigo-500/20">
                <Plus size={18} className="mr-2" />
                New Entity
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(biz => (
                <div 
                    key={biz.id} 
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                    {/* Decorative Brand Accent */}
                    <div 
                        className="absolute top-0 right-0 w-32 h-32 opacity-[0.05] rounded-bl-full -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-10" 
                        style={{ backgroundColor: biz.primaryColor }}
                    ></div>
                    
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                     {/* Logo container with ring */}
                                    <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 group-hover:ring-2 group-hover:ring-indigo-100 dark:group-hover:ring-slate-600 transition-all">
                                        <img src={biz.logoUrl} alt={biz.name} className="w-full h-full rounded-xl object-cover" />
                                    </div>
                                     {/* Status indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center ${biz.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        {biz.isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl leading-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onOpenModule('business-dashboard', biz.id)}>{biz.name}</h3>
                                     {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${biz.type === TenantType.LENDING ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            {biz.type === TenantType.LENDING ? 'Lender' : 'Business'}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                                            {biz.currency}
                                        </span>
                                    </div>
                                </div>
                            </div>
                             {/* Options menu */}
                            <button className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        {/* Location / Meta (Mock) */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                            <MapPin size={14} />
                            <span>Main Branch • Johannesburg, ZA</span>
                        </div>

                        {/* Stats Section */}
                        <div className="flex items-center justify-between py-4 border-t border-b border-slate-50 dark:border-slate-800 mb-6 bg-slate-50/50 dark:bg-slate-800/20 -mx-6 px-6">
                            <div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Active Revenue</p>
                                 <div className="flex items-center gap-2">
                                     <span className="text-lg font-black text-slate-900 dark:text-white">R 12,450</span>
                                     <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                         <ArrowUpRight size={10} className="mr-0.5" /> 12%
                                     </span>
                                 </div>
                            </div>
                            <div className="text-right">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">System Status</p>
                                 <span className={`text-xs font-bold flex items-center justify-end gap-1.5 ${biz.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                     <div className={`w-2 h-2 rounded-full ${biz.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                     {biz.isActive ? 'Operational' : 'Offline'}
                                 </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                         <Button 
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-900/10 h-11 transition-all active:scale-95"
                            onClick={() => onOpenModule('business-dashboard', biz.id)}
                         >
                            <ShoppingCart size={18} /> <span className="font-bold">Open Terminal</span>
                         </Button>
                         <Button 
                            variant="outline" 
                            className="flex items-center justify-center gap-2 h-11 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:hover:bg-slate-800 transition-all active:scale-95"
                            onClick={() => onOpenModule('business-dashboard', biz.id)}
                         >
                            <LayoutDashboard size={18} /> <span className="font-medium">Dashboard</span>
                         </Button>
                    </div>
                </div>
            ))}
            
            {/* Add New Placeholder Card */}
            <button className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[320px] h-full">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all flex items-center justify-center mb-6">
                    <Plus size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Register New Entity</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Add a new retail outlet, branch, or lending service to your organization.
                </p>
            </button>
        </div>
    </div>
  );
};