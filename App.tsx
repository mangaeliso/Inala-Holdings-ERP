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
import { Settings } from './pages/Settings';
import { CurrencyExchange } from './pages/CurrencyExchange';
import { Inbox } from './pages/Inbox';
import { UIProvider, useUI } from './context/UIContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { INITIAL_USERS, INALA_HOLDINGS_TENANT } from './services/mockData';
import { ensureCurrentCycleData } from './services/firestore';
import { Tenant, User } from './types';

// Wrapper component to use hooks inside
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]); 
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(INALA_HOLDINGS_TENANT);
  const [contextTenantId, setContextTenantId] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useUI();

  useEffect(() => {
    // Run DB Checks on startup
    const initDB = async () => {
        // Automatically populates Firestore with current cycle data if missing
        // ensuring the dashboard always shows relevant info
        await ensureCurrentCycleData();
    };
    initDB();
  }, []);

  const handleLogin = (user: User, tenant: Tenant) => {
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentTenant(null);
  };

  const handleOpenModule = (moduleId: string, tenantId: string) => {
    setContextTenantId(tenantId);
    setActiveTab(moduleId);
  };

  const handleNavigate = (tab: string) => {
      if (!['business-dashboard', 'stokvel-dashboard'].includes(tab)) {
          setContextTenantId(null);
      }
      setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'businesses': return <Businesses onOpenModule={handleOpenModule} />;
      case 'stokvels': return <Stokvels onOpenModule={handleOpenModule} />;
      case 'stokvel-dashboard': return <StokvelDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('stokvels')} />;
      case 'business-dashboard': return <BusinessDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('businesses')} />;
      case 'finance': return <Finance />;
      case 'exchange': return <CurrencyExchange />;
      case 'inbox': return <Inbox />;
      case 'settings': return <Settings />;
      case 'profile': return <Profile user={currentUser!} />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
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
      <ToastContainer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <UIProvider>
      <AppContent />
    </UIProvider>
  );
};

export default App;