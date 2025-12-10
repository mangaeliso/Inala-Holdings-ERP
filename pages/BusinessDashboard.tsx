import React, { useState, useEffect } from 'react';
import { getBusinessProfile } from '../services/firestore'; // Import getBusinessProfile
import { POS } from './POS';
import { Inventory } from './Inventory';
import { Reports } from './Reports';
import { Expenses } from './Expenses';
import { Customers } from './Customers';
import { BusinessSettings } from './BusinessSettings'; // Import BusinessSettings
import { Tenant } from '../types'; // Import Tenant type
import { useUI } from '../context/UIContext'; // Import useUI
import { 
  ShoppingCart, 
  Package, 
  BarChart2, 
  ArrowLeft,
  DollarSign,
  Users,
  Settings
} from 'lucide-react';

interface BusinessDashboardProps {
  tenantId: string;
  onBack: () => void;
  initialTab?: string;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ tenantId, onBack, initialTab = 'pos' }) => {
  const { globalSettings, currentTenant, setTenantBranding } = useUI(); // Get globalSettings and setTenantBranding
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null); // Use tenantProfile to store fetched tenant data
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenantData = async () => {
      setIsLoading(true);
      try {
        const profile = await getBusinessProfile(tenantId);
        if (profile) {
          setTenantProfile(profile);
          // Set tenant-specific branding in UI context for this dashboard view
          if (profile.branding) {
            setTenantBranding(profile.branding);
          } else {
            // If no specific branding, clear and let global settings apply
            setTenantBranding(null); 
          }
        }
      } catch (error) {
        console.error("Failed to load business profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTenantData();

    // Cleanup function: when component unmounts or tenantId changes, reset tenant branding
    return () => {
        setTenantBranding(null);
    };
  }, [tenantId, setTenantBranding]); // Re-run when tenantId changes

  if (isLoading || !tenantProfile) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading Business Dashboard...</p>
    </div>
  );

  // Determine effective primary color (tenant override or global default)
  const effectivePrimaryColor = tenantProfile.branding?.primaryColor || globalSettings.primaryColor;
  const displayLogo = tenantProfile.branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenantProfile.name || '')}&background=${(effectivePrimaryColor || globalSettings.primaryColor).replace('#', '')}&color=fff&size=128`;
  const displayName = tenantProfile.branding?.displayName || tenantProfile.name;


  const tabs = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings }, // Added settings tab
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
                         <img src={displayLogo} alt={displayName} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">{displayName}</h2>
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
                        style={activeTab === tab.id ? { backgroundColor: effectivePrimaryColor, color: '#fff' } : {}}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'opacity-70'} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area with slight padding for card effect */}
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
                {activeTab === 'pos' && <div className="h-full p-4 md:p-6 overflow-hidden"><POS tenantId={tenantId} /></div>}
                {activeTab === 'customers' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Customers tenantId={tenantId} /></div>}
                {activeTab === 'inventory' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Inventory tenantId={tenantId} /></div>}
                {activeTab === 'expenses' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Expenses tenantId={tenantId} /></div>}
                {activeTab === 'reports' && <div className="h-full p-4 md:p-6 overflow-y-auto"><Reports tenantId={tenantId} /></div>}
                {activeTab === 'settings' && <div className="h-full p-4 md:p-6 overflow-y-auto"><BusinessSettings tenantId={tenantId} /></div>}
            </div>
        </div>
    </div>
  );
};