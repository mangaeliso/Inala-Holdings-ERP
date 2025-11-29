import React from 'react';
import { INITIAL_TENANTS } from '../services/mockData';
import { TenantType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, MoreHorizontal, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export const Lending: React.FC = () => {
  const lenders = INITIAL_TENANTS.filter(t => t.type === TenantType.LENDING);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lending & Credit</h2>
                <p className="text-slate-500 text-sm">Manage micro-lending entities, approval workflows, and debt collection.</p>
            </div>
            <Button>
                <Plus size={18} className="mr-2" />
                New Lender
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lenders.map(lender => (
                <Card key={lender.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-amber-500">
                    
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight text-slate-900">{lender.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">Reg: NCR-10293</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                         <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                             <span className="text-sm font-medium text-amber-900">Pending Approvals</span>
                             <span className="bg-white px-2 py-0.5 rounded text-sm font-bold shadow-sm text-amber-600">5</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                             <span className="text-sm font-medium text-slate-600">Active Book</span>
                             <span className="font-bold text-slate-900">R 125,000</span>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20">
                            Approvals
                        </Button>
                        <Button variant="outline" className="w-full">
                            Collections
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
};