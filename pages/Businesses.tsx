import React from 'react';
import { MOCK_TENANTS } from '../services/mockData';
import { TenantType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, MoreHorizontal, ShoppingCart, LayoutDashboard, ArrowUpRight } from 'lucide-react';

interface BusinessesProps {
    onOpenModule: (moduleId: string, tenantId: string) => void;
}

export const Businesses: React.FC<BusinessesProps> = ({ onOpenModule }) => {
  const businesses = MOCK_TENANTS.filter(t => t.type === TenantType.BUSINESS && t.id !== 'global');

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Businesses</h2>
                <p className="text-slate-500 text-sm">Manage retail outlets, inventory, and point of sale terminals.</p>
            </div>
            <Button>
                <Plus size={18} className="mr-2" />
                New Business
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(biz => (
                <Card key={biz.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: biz.primaryColor }}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={biz.logoUrl} alt={biz.name} className="w-14 h-14 rounded-xl object-cover bg-slate-100 shadow-sm" />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${biz.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">{biz.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{biz.currency} • {biz.subscriptionTier}</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full flex items-center gap-2 justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-none border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                            onClick={() => onOpenModule('business-dashboard', biz.id)}
                         >
                            <ShoppingCart size={16} /> Open POS
                         </Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full flex items-center gap-2 justify-center"
                            onClick={() => onOpenModule('business-dashboard', biz.id)}
                         >
                            <LayoutDashboard size={16} /> Dashboard
                         </Button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        <span>Daily Sales</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            R 12,450 <ArrowUpRight size={12} className="text-emerald-500" />
                        </span>
                    </div>
                </Card>
            ))}
            
            <button className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all h-[220px]">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Plus size={24} />
                </div>
                <span className="font-medium">Add Business Entity</span>
            </button>
        </div>
    </div>
  );
};