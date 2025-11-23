
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
import { MOCK_USERS, INALA_HOLDINGS_TENANT, MOCK_TENANTS } from './services/mockData';
import { Tenant, User } from './types';

// Simple Hash Router Implementation for SPA without Server
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth State - Defaulted to Super Admin as requested
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]); 
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(INALA_HOLDINGS_TENANT);

  // Temporary state to handle launching a specific module for a tenant (simulating routing)
  const [contextTenantId, setContextTenantId] = useState<string | null>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = (user: User, tenant: Tenant) => {
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setIsAuthenticated(true);
    setActiveTab('dashboard'); // Reset to dashboard on login
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
      // If navigating away from a specific context module
      if (!['business-dashboard', 'stokvel-dashboard'].includes(tab)) {
          setContextTenantId(null);
      }
      setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'businesses':
        return <Businesses onOpenModule={handleOpenModule} />;
      case 'stokvels':
        return <Stokvels onOpenModule={handleOpenModule} />;
      case 'stokvel-dashboard':
        return <StokvelDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('stokvels')} />;
      case 'business-dashboard':
        return <BusinessDashboard tenantId={contextTenantId!} onBack={() => setActiveTab('businesses')} />;
      case 'finance':
        return <Finance />;
      case 'exchange':
         return <CurrencyExchange />;
      case 'inbox':
         return <Inbox />;
      case 'settings':
         return <Settings />;
      case 'profile':
         return <Profile user={currentUser!} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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

export default App;
