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

  if (user.role.toLowerCase() === 'tv' || activeView === 'tv') {
    return (
      <>
        <TVMode onBack={user.role.toLowerCase() !== 'tv' ? () => setActiveView('dashboard') : undefined} />
        <ChatWidget />
      </>
    );
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
  const [alreadyOpen, setAlreadyOpen] = useState(false);

  useEffect(() => {
    // Check for other open tabs
    const channel = new BroadcastChannel('app-instance-channel');
    
    channel.postMessage({ type: 'CHECK_INSTANCE' });

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CHECK_INSTANCE') {
        channel.postMessage({ type: 'INSTANCE_EXISTS' });
      } else if (event.data.type === 'INSTANCE_EXISTS') {
        setAlreadyOpen(true);
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/status/')) {
      const token = path.replace('/status/', '');
      if (token) {
        setPublicToken(token);
      }
    }
  }, []);

  if (alreadyOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white p-6">
        <div className="bg-[#15151A] p-8 rounded-xl border border-white/10 text-center max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Sistema já está aberto</h2>
          <p className="text-white/60 text-sm mb-6">
            Identificamos que o sistema já está sendo executado em outra aba deste navegador. Para evitar conflitos, apenas uma aba pode ficar aberta por vez.
          </p>
          <button 
            onClick={() => window.close()} 
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-colors uppercase tracking-wider text-sm"
          >
            Fechar esta aba
          </button>
          <p className="text-[10px] text-white/40 mt-4">
            Se você tem certeza que não há outra aba, <button onClick={() => setAlreadyOpen(false)} className="underline hover:text-white">clique aqui para forçar a abertura</button>.
          </p>
        </div>
      </div>
    );
  }

  if (publicToken) {
    return <PublicStatus token={publicToken} />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
