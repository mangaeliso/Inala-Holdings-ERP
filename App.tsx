import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
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
import { ensureGlobalSettings, getBusinessProfile, getTenantBrandingSettings } from './services/firestore';
import { Tenant, User, TenantType } from './types';
import { initializeUser } from './lib/initializeUser';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
        // 1. Load Global Platform Configuration
        const globalConfig = await ensureGlobalSettings();
        setGlobalSettings(globalConfig);

        // 2. Load User and Dynamically Fetch Tenant
        try {
            const user = await initializeUser();
            
            if (user) {
                // Fetch the actual tenant profile associated with this user
                let tenantContext = await getBusinessProfile(user.tenantId);
                
                // Fallback for global admin or system initialize
                if (!tenantContext && user.tenantId === 'global') {
                    tenantContext = {
                        id: 'global',
                        name: 'INALA HOLDINGS',
                        type: TenantType.BUSINESS,
                        isActive: true,
                        category: 'Headquarters'
                    };
                }

                if (tenantContext) {
                    handleLogin(user as User, tenantContext);
                    console.log('✅ System Authenticated:', user.email, 'Context:', tenantContext.id);
                } else {
                    console.warn("User has no valid tenant association.");
                    addToast("Account configuration incomplete.", "warning");
                }
            }
        } catch (error) {
            console.error("Critical: System initialization failed.", error);
            addToast("Failed to initialize Organization context.", "error");
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
                Loading context...
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'businesses': return <Businesses onOpenModule={handleOpenModule} />;
      case 'stokvels': return <Stokvels onOpenModule={handleOpenModule} />;
      // Use keys to force re-render on business switch (clears state)
      case 'stokvel-dashboard': return <StokvelDashboard key={contextTenantId} tenantId={contextTenantId!} onBack={() => setActiveTab('stokvels')} />;
      case 'business-dashboard': return <BusinessDashboard key={contextTenantId} tenantId={contextTenantId!} onBack={() => setActiveTab('businesses')} />;
      case 'finance': return <Finance />;
      case 'exchange': return <CurrencyExchange />;
      case 'inbox': return <Inbox />;
      case 'global-settings': return <GlobalSettings />;
      case 'profile': return <Profile user={currentUser} />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Authenticating Multi-Tenant Bridge...
        </div>
    );
  }
  
  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={handleNavigate}
      currentUser={currentUser!}
      currentTenant={currentTenant!}
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
