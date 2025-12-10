import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Finance } from './pages/Finance';
import { Businesses } from './pages/Businesses';
import { Stokvels } from './pages/Stokvels';
import { StokvelDashboard } from './pages/StokvelDashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { Profile } from './pages/Profile';
import { GlobalSettings } from './pages/GlobalSettings';
import { CurrencyExchange } from './pages/CurrencyExchange';
import { Inbox } from './pages/Inbox';
import { UIProvider, useUI } from './context/UIContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { ensureGlobalSettings, getUsers, getTenants, getTenantBrandingSettings } from './services/firestore';
import { Tenant, User, UserRole, TenantType, GlobalSettings as GlobalSettingsType } from './types';

// Default Tenant structure for fallback/initial state
const DEFAULT_GLOBAL_TENANT: Tenant = {
  id: 'global',
  name: 'INALA HOLDINGS',
  type: TenantType.BUSINESS,
  isActive: true,
  category: 'Headquarters',
  branding: { displayName: 'INALA Holdings', primaryColor: '#6366f1' },
  access: { subscriptionTier: 'ENTERPRISE' },
  cycleSettings: { startDay: 1, endDay: 31, fiscalStartMonth: 1, currencySymbol: 'R' },
  posSettings: { receiptFooter: 'Thank you!', taxRate: 15, enableCash: true, enableCard: true, enableCredit: true, autoPrint: true, currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL' }
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use Context for Global State
  const { 
      isDarkMode, toggleTheme, addToast,
      setGlobalSettings, 
      currentUser, setCurrentUser,
      currentTenant, setCurrentTenant,
      setTenantBranding 
  } = useUI();

  const [contextTenantId, setContextTenantId] = useState<string | null>(null);

  useEffect(() => {
    const initGlobalAndAuth = async () => {
        // 1. Ensure/Load Global ERP Settings
        const globalConfig = await ensureGlobalSettings();
        setGlobalSettings(globalConfig);

        // 2. Attempt Quick Login
        try {
            const users = await getUsers();
            const tenants = await getTenants();
            
            // Try to log in the first Super Admin, or a Tenant Admin
            const superAdminUser = users.find(u => u.role === UserRole.SUPER_ADMIN);
            const tenantAdminUser = users.find(u => u.role === UserRole.TENANT_ADMIN);

            let userToLogin: User | undefined;
            if (superAdminUser) {
                userToLogin = superAdminUser;
            } else if (tenantAdminUser) {
                userToLogin = tenantAdminUser;
            }

            if (userToLogin) {
                let tenantContext: Tenant | undefined;
                if (userToLogin.tenantId === 'global') {
                    tenantContext = tenants.find(t => t.id === 'global') || DEFAULT_GLOBAL_TENANT;
                } else {
                    tenantContext = tenants.find(t => t.id === userToLogin.tenantId);
                }

                if (tenantContext) {
                    handleLogin(userToLogin, tenantContext); 
                } else {
                    console.warn("Could not find tenant for auto-login user.");
                    addToast("Could not find tenant for auto-login user.", "error");
                }
            } else {
                console.log("No default admin users found for auto-login.");
            }
        } catch (error) {
            console.error("Initial auth/data load failed, staying unauthenticated:", error);
            addToast("Initial authentication failed.", "error");
        }
    };
    initGlobalAndAuth();
  }, []); 

  const handleLogin = async (user: User, tenant: Tenant) => {
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setIsAuthenticated(true);
    setActiveTab('dashboard');

    if (user.tenantId !== 'global') {
        const branding = await getTenantBrandingSettings(user.tenantId);
        setTenantBranding(branding || undefined); 
    } else {
        setTenantBranding(null); 
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentTenant(null);
    setTenantBranding(null); 
    setActiveTab('dashboard'); 
  };

  const handleOpenModule = (moduleId: string, tenantId: string) => {
    setContextTenantId(tenantId);
    setActiveTab(moduleId);
  };

  const handleNavigate = (tab: string) => {
      if (!['business-dashboard', 'stokvel-dashboard', 'global-settings'].includes(tab)) {
          setContextTenantId(null);
      }
      setActiveTab(tab);
  };

  const renderContent = () => {
    if (!currentUser || !currentTenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-4"></div>
                Loading user session...
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'businesses': return <Businesses onOpenModule={handleOpenModule} />;
      case 'stokvels': return <Stokvels onOpenModule={handleOpenModule} />;
      case 'stokvel-dashboard': return <StokvelDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('stokvels')} />;
      case 'business-dashboard': return <BusinessDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('businesses')} />;
      case 'finance': return <Finance />;
      case 'exchange': return <CurrencyExchange />;
      case 'inbox': return <Inbox />;
      case 'global-settings': return <GlobalSettings />;
      case 'profile': return <Profile user={currentUser} />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  // Render Layout only if we have valid context
  if (!currentUser || !currentTenant) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-4"></div>
            Initializing...
        </div>
      );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={handleNavigate}
      currentUser={currentUser}
      currentTenant={currentTenant}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <UIProvider>
      <ToastContainer />
      <AppContent />
    </UIProvider>
  );
};

export default App;