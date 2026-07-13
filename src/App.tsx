import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { VehicleForm } from './components/VehicleForm';
import { TVMode } from './components/TVMode';
import { UsersList } from './components/UsersList';
import { PublicStatus } from './components/PublicStatus';
import { ProductsManager } from './components/ProductsManager';
import { ChangePassword } from './components/ChangePassword';
import { ResponsiblesManager } from './components/ResponsiblesManager';
import { RolesManager } from './components/RolesManager';
import { ChatWidget } from './components/ChatWidget';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">Carregando...</div>;

  if (!user) {
    return <Login />;
  }

  if (user.must_change_password) {
    return <ChangePassword />;
  }

  if (user.role === 'tv' || activeView === 'tv') {
    return <TVMode onBack={user.role !== 'tv' ? () => setActiveView('dashboard') : undefined} />;
  }

  const renderContent = () => {
    if (activeView === 'vehicles' || editingVehicleId) {
      return (
        <VehicleForm 
          vehicleId={editingVehicleId}
          onSaved={() => {
            setEditingVehicleId(null);
            setActiveView('dashboard');
          }} 
          onCancel={() => {
            setEditingVehicleId(null);
            setActiveView('dashboard');
          }}
        />
      );
    }
    
    if (activeView === 'users') {
      return <UsersList />;
    }
    if (activeView === 'products') {
      return <ProductsManager />;
    }
    if (activeView === 'responsibles') {
      return <ResponsiblesManager />;
    }
    if (activeView === 'roles') {
      return <RolesManager />;
    }

    return (
      <Dashboard 
        onEditVehicle={(id) => {
          setEditingVehicleId(id);
          setActiveView('vehicles');
        }} 
      />
    );
  };

  return (
    <>
      <Layout activeView={activeView} onNavigate={(view) => {
        setActiveView(view);
        setEditingVehicleId(null);
      }}>
        {renderContent()}
      </Layout>
      <ChatWidget />
    </>
  );
}

export default function App() {
  const [publicToken, setPublicToken] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/status/')) {
      const token = path.replace('/status/', '');
      if (token) {
        setPublicToken(token);
      }
    }
  }, []);

  if (publicToken) {
    return <PublicStatus token={publicToken} />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
