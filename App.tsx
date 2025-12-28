import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  Search,
  Image as ImageIcon,
  LifeBuoy,
  History,
  CreditCard,
  Target,
  FileText,
  ShoppingBag,
  PieChart,
  Calendar,
  Wrench
} from 'lucide-react';
import { User, Reseller, CreditList, Transaction, Plan, ServiceCard } from './types';
import AuthScreen from './components/AuthScreen';
import ListManager from './components/ListManager';
import Finance from './components/Finance';
import ResellerManager from './components/ResellerManager';
import PlanManager from './components/PlanManager';
import ServicesManager from './components/ServicesManager';
import CreativesManager from './components/CreativesManager';
import ToolsManager from './components/ToolsManager';
import Queries from './components/Queries';
import ClientPortal from './components/ClientPortal';
import { DashboardHome } from './components/DashboardHome';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  // Data State
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [lists, setLists] = useState<CreditList[]>([]);
  const [services, setServices] = useState<ServiceCard[]>([]); // Note: type ServiceCard
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Platform Settings (Restored)
  const [platformSettings, setPlatformSettings] = useState({
    pixKey: '',
    pixQrCodeUrl: '',
    paymentLink: '',
    plans: {
      monthly: { price: 197, link: 'https://mpago.la/monthly1' },
      semiAnnual: { price: 597, link: 'https://mpago.la/semi1' },
      annual: { price: 997, link: 'https://mpago.la/annual1' }
    }
  });

  // Auto-login Logic
  useEffect(() => {
    const performAutoLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      const cpf = params.get('cpf');

      if (portal === 'client' && cpf) {
        setIsAutoLoggingIn(true);
        try {
          const res = await fetch('/api/auth/client-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf })
          });

          if (!res.ok) throw new Error('Falha no login automático');

          const user = await res.json();
          setCurrentUser(user);
        } catch (error) {
          console.error('Auto login failed', error);
          alert('Erro ao acessar portal do cliente. Verifique o link.');
        } finally {
          setIsAutoLoggingIn(false);
        }
      }
    };
    performAutoLogin();
  }, []);

  // Data Fetching
  const fetchData = async () => {
    try {
      const queryParams = currentUser ? `?userId=${currentUser.id}&role=${currentUser.role}` : '';
      const [resellersRes, listsRes, servicesRes, transactionsRes, plansRes] = await Promise.all([
        fetch('/api/resellers'),
        fetch(`/api/lists${queryParams}`),
        fetch('/api/services'),
        fetch('/api/transactions'),
        fetch('/api/plans')
      ]);

      const listsData = await listsRes.json();
      setLists(listsData);

      if (resellersRes.ok) setResellers(await resellersRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    window.history.pushState({}, '', '/');
  };

  // Stats for Dashboard
  const stats = {
    totalLists: lists.length,
    activeResellers: resellers.filter(r => r.status === 'active').length,
    averageProgress: lists.length > 0 ? lists.reduce((acc, list) => {
      const completed = Object.values(list.organs).filter(v => v).length;
      const total = Object.values(list.organs).length;
      return acc + (completed / total);
    }, 0) / lists.length * 100 : 0,
    totalRevenue: lists.length * 150
  };

  // Pre-Loader
  if (isAutoLoggingIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D99000]"></div>
      </div>
    );
  }

  // Auth Screen
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAutoLoggingIn(false);
        }}
        onRegister={() => { }}
        resellers={resellers}
        lists={lists}
      />
    );
  }

  // Client Portal direct view
  if (currentUser.role === 'client') {
    const clientList = lists.find(l => l.clientDocument === currentUser.document || l.id === currentUser.id.replace('cli-', ''));
    const clientReseller = resellers.find(r => r.id === clientList?.resellerId);

    return (
      <ClientPortal
        currentUser={currentUser}
        list={clientList}
        reseller={clientReseller}
        services={services}
        onLogout={handleLogout}
      />
    );
  }

  // --- COMPONENT PROPS MAPPING ---
  // Ensuring correct props are passed to children based on their interfaces

  // Sidebar Link Component
  const SidebarLink = ({ icon: Icon, label, tabId, sectionTitle }: any) => {
    if (sectionTitle) return <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 mt-6 mb-2 font-['Outfit']">{label}</div>;

    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => { setActiveTab(tabId); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-white/5 text-[#D99000] border-l-2 border-[#D99000]'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
      >
        <Icon size={20} className={isActive ? 'text-[#D99000]' : ''} />
        {label}
      </button>
    );
  };

  return (
    <div className="bg-[#0A0A0C] text-gray-100 font-sans h-screen flex overflow-hidden selection:bg-[#D99000]/30">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#121418] flex-shrink-0 flex flex-col border-r border-white/5 h-full fixed lg:static z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-[#D99000] rounded-lg flex items-center justify-center shadow-lg shadow-[#D99000]/20 flex-shrink-0">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-['Outfit'] font-bold text-xl tracking-tight text-white leading-none">Central</h1>
            <span className="font-['Outfit'] font-bold text-[#D99000] tracking-[0.2em] text-[10px] uppercase mt-0.5">Remoção</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          <SidebarLink icon={LayoutDashboard} label="Painel de Controle" tabId="dashboard" />

          {currentUser.role === 'admin' && (
            <>
              <SidebarLink icon={Users} label="Revendedores" tabId="resellers" />
              <SidebarLink icon={ShoppingBag} label="Vitrine de Serviços" tabId="services" />
              <SidebarLink icon={Settings} label="Planos & Comissões" tabId="plans" />

              <SidebarLink sectionTitle label="Clientes" />
              <SidebarLink icon={FileText} label="Novos Clientes" tabId="lists" />

              <SidebarLink sectionTitle label="Consultas" />
              <SidebarLink icon={Search} label="Serasa & Boa Vista" tabId="queries" />

              <SidebarLink sectionTitle label="Financeiro" />
              <SidebarLink icon={Wallet} label="Depósitos" tabId="finance-deposits" />
              <SidebarLink icon={History} label="Extrato Detalhado" tabId="finance" />

              <SidebarLink sectionTitle label="Outros" />
              <SidebarLink icon={Wrench} label="Ferramentas" tabId="tools" />
              <SidebarLink icon={ImageIcon} label="Criativos" tabId="creatives" />
              <SidebarLink icon={LifeBuoy} label="Suporte Técnico" tabId="support" />
            </>
          )}
          {currentUser.role !== 'admin' && (
            <>
              <SidebarLink icon={FileText} label="Meus Protocolos" tabId="lists" />
              <SidebarLink icon={ShoppingBag} label="Loja e Serviços" tabId="services" />

              <SidebarLink sectionTitle label="Financeiro" />
              <SidebarLink icon={Wallet} label="Depósitos" tabId="finance-deposits" />
              <SidebarLink icon={History} label="Extrato Detalhado" tabId="finance" />

              <SidebarLink sectionTitle label="Outros" />
              <SidebarLink icon={Wrench} label="Ferramentas" tabId="tools" />
              <SidebarLink icon={ImageIcon} label="Criativos" tabId="creatives" />
              <SidebarLink icon={LifeBuoy} label="Suporte Técnico" tabId="support" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="bg-[#1E2025] rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Revendedor'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0A0A0C]">
        <header className="h-20 bg-[#0A0A0C] border-b border-white/5 flex items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-['Outfit'] font-bold text-white uppercase tracking-wide">
              {activeTab === 'dashboard' ? 'Dashboard' :
                activeTab === 'lists' ? 'Gestão de Clientes' :
                  activeTab === 'finance' ? 'Financeiro' :
                    activeTab === 'resellers' ? 'Revendedores' :
                      activeTab === 'plans' ? 'Planos' :
                        activeTab === 'queries' ? 'Consultas' :
                          activeTab === 'services' ? 'Loja de Serviços' :
                            activeTab === 'tools' ? 'Ferramentas' :
                              activeTab === 'creatives' ? 'Criativos' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {currentUser.role === 'admin' && (
              <button className="hidden md:flex items-center gap-2 bg-yellow-900/20 text-yellow-500 hover:bg-yellow-900/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-yellow-700/30 transition-all">
                <Calendar size={14} />
                Acesso Master
              </button>
            )}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <Wallet size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentUser.role === 'admin' ? 1250 : currentUser.balance || 0)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative scrollbar-none">
          {activeTab === 'dashboard' && <DashboardHome stats={stats} lists={lists} currentUser={currentUser} onNavigate={setActiveTab} />}

          <div className={activeTab === 'dashboard' ? 'hidden' : 'p-6 animate-in fade-in duration-300 h-full'}>
            {activeTab === 'lists' && (
              <ListManager
                lists={lists}
                setLists={setLists}
                currentUser={currentUser}
                resellers={resellers}
              />
            )}
            {activeTab === 'resellers' && currentUser.role === 'admin' && (
              <ResellerManager
                resellers={resellers}
                setResellers={setResellers}
                lists={lists}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'services' && (
              <ServicesManager
                services={services}
                setServices={setServices}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            )}
            {activeTab === 'plans' && currentUser.role === 'admin' && (
              <PlanManager onPlanUpdate={() => fetchData()} />
            )}
            {(activeTab === 'finance' || activeTab === 'finance-deposits') && (
              <Finance
                currentUser={currentUser}
                platformSettings={platformSettings}
                setPlatformSettings={setPlatformSettings}
                activeTab={activeTab} // Note: Finance prop name is generic 'activeTab' but it handles subtabs internally. This might be fine.
                transactions={transactions}
                setTransactions={setTransactions}
                resellers={resellers}
                setResellers={setResellers}
                setCurrentUser={setCurrentUser}
              />
            )}
            {activeTab === 'queries' && (
              <Queries />
            )}
            {activeTab === 'creatives' && (
              <CreativesManager currentUser={currentUser} />
            )}
            {activeTab === 'tools' && (
              <ToolsManager currentUser={currentUser} />
            )}
            {activeTab === 'support' && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <LifeBuoy size={48} className="opacity-50" />
                <p className="text-lg font-['Outfit']">Suporte Técnico</p>
                <a href={`https://wa.me/${currentUser.whatsapp || '5511999999999'}`} target="_blank" rel="noreferrer" className="bg-[#D99000] text-white px-6 py-2 rounded-lg hover:bg-[#b37600] transition-colors">
                  Entrar em Contato
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
