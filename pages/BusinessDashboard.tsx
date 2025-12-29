import React, { useState, useEffect, useMemo } from 'react';
import { getBusinessProfile } from '../services/firestore';
import { POS } from './POS';
import { Inventory } from './Inventory';
import { Reports } from './Reports';
import { Expenses } from './Expenses';
import { BusinessSettings } from './BusinessSettings';
import { LoanDashboard } from './LoanDashboard'; 
import { Tenant, TenantType, BusinessMode } from '../types';
import { useUI } from '../context/UIContext';
import { Button } from '../components/ui/Button';
import { 
  ShoppingCart, 
  Package, 
  BarChart2, 
  ArrowLeft,
  DollarSign,
  Users,
  Settings,
  CreditCard,
  FileText
} from 'lucide-react';

interface BusinessDashboardProps {
  tenantId: string;
  onBack: () => void;
  initialTab?: string;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ tenantId, onBack, initialTab }) => {
  const { globalSettings, setCurrentTenant, setTenantBranding } = useUI();
  const [activeTab, setActiveTab] = useState(initialTab || 'pos');
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenantData = async () => {
      setIsLoading(true);
      try {
        const profile = await getBusinessProfile(tenantId);
        if (profile) {
          setTenantProfile(profile);
          setCurrentTenant(profile);
          if (profile.branding) {
            setTenantBranding(profile.branding);
          }
        }
      } catch (error) {
        console.error("Critical: Business context failed to load:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTenantData();
    return () => setTenantBranding(null);
  }, [tenantId, setTenantBranding, setCurrentTenant]);

  const tabs = useMemo(() => {
    if (!tenantProfile) return [];
    
    const mode = tenantProfile.businessMode || 'RETAIL';
    const isLending = mode === 'LOANS' || mode === 'BOTH' || (tenantProfile.type as string) === 'LOAN';
    const isRetail = mode === 'RETAIL' || mode === 'BOTH' || !isLending;

    const navTabs = [];
    
    // Core Modules for Lending
    if (isLending) {
      navTabs.push({ id: 'hub', label: 'Loan Hub', icon: CreditCard });
    }

    // Core Modules for Retail
    if (isRetail) {
      navTabs.push({ id: 'pos', label: 'POS Terminal', icon: ShoppingCart });
      navTabs.push({ id: 'inventory', label: 'Inventory', icon: Package });
    }

    // Enterprise Financials (Always Visible)
    navTabs.push({ id: 'ledger', label: 'Financials', icon: FileText });
    navTabs.push({ id: 'expenses', label: 'Expenses', icon: DollarSign });
    
    // FIX: Settings must be always visible regardless of mode
    navTabs.push({ id: 'settings', label: 'Settings', icon: Settings });

    return navTabs;
  }, [tenantProfile]);

  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold uppercase tracking-widest text-xs">Synchronizing Organizational Context...</p>
    </div>
  );

  if (!tenantProfile) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <p className="font-bold text-red-500">Error: Tenant Context Unreachable.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">Return to HQ</Button>
    </div>
  );

  const effectivePrimaryColor = tenantProfile.branding?.primaryColor || globalSettings.primaryColor;
  const displayLogo = tenantProfile.branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenantProfile.name)}&background=${(effectivePrimaryColor).replace('#', '')}&color=fff&size=128`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-fade-in bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                    <img src={displayLogo} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-inner" />
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">{tenantProfile.branding?.displayName || tenantProfile.name}</h2>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                           {tenantProfile.businessMode || 'STOKVEL'} Mode Active
                        </span>
                    </div>
                </div>
            </div>

            <nav className="mt-4 md:mt-0 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${
                            activeTab === tab.id
                            ? 'text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                        style={activeTab === tab.id ? { backgroundColor: effectivePrimaryColor } : {}}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 md:p-8">
                {activeTab === 'hub' && <LoanDashboard tenantId={tenantId} />}
                {activeTab === 'ledger' && <Reports tenantId={tenantId} />}
                {activeTab === 'pos' && <POS tenantId={tenantId} />}
                {activeTab === 'inventory' && <Inventory tenantId={tenantId} />}
                {activeTab === 'expenses' && <Expenses tenantId={tenantId} />}
                {activeTab === 'settings' && <BusinessSettings tenantId={tenantId} onDelete={onBack} />}
            </div>
        </div>
    </div>
  );
};