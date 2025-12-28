
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  UserPlus,
  Search,
  Image as ImageIcon,
  LifeBuoy,
  ChevronDown,
  History,
  Target,
  Zap,
  Link as LinkIcon,
  Copy,
  Check,
  CreditCard as PaymentIcon,
  ShieldCheck,
  CalendarClock,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { PlanType, Reseller, CreditList, Transaction, User, ServiceCard } from './types';
import Dashboard from './components/Dashboard';
import ResellerManager from './components/ResellerManager';
import ListManager from './components/ListManager';
import Finance from './components/Finance';
import NewClientForm from './components/NewClientForm';
import AuthScreen from './components/AuthScreen';
import PendingApproval from './components/PendingApproval';
import CreativesManager from './components/CreativesManager';
import ServicesManager from './components/ServicesManager';
import ClientPortal from './components/ClientPortal';
import Queries from './components/Queries';
import PlanManager from './components/PlanManager';

const App: React.FC = () => {
  const masterAdminWhatsApp = '5511999999999';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    clientes: true,
    consultas: true,
    financeiro: true
  });

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

  const [services, setServices] = useState<ServiceCard[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [lists, setLists] = useState<CreditList[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Carregar dados do banco ao logar
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Settings
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setPlatformSettings(prev => ({
            ...prev,
            pixKey: s.pix_key,
            pixQrCodeUrl: s.pix_qr_code_url,
            paymentLink: s.payment_link
          }));
        }

        // Resellers (Admin only)
        if (currentUser.role === 'admin') {
          const resResellers = await fetch('/api/resellers');
          if (resResellers.ok) setResellers(await resResellers.json());
        }

        // Services
        const rId = currentUser.resellerId || currentUser.id;
        const resServices = await fetch(`/api/services?resellerId=${rId}`);
        if (resServices.ok) setServices(await resServices.json());

        // Lists
        const listParams = new URLSearchParams({
          role: currentUser.role,
          userId: rId,
          doc: currentUser.document || ''
        });
        const resLists = await fetch(`/api/lists?${listParams}`);
        if (resLists.ok) setLists(await resLists.json());

        // Transactions
        const resTx = await fetch(`/api/transactions?resellerId=${rId}&role=${currentUser.role}`);
        if (resTx.ok) setTransactions(await resTx.json());

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    fetchData();
  }, [currentUser]);

  const updateResellerWhatsApp = async (newWhatsapp: string) => {
    if (!currentUser) return;

    const rId = currentUser.role === 'admin' ? currentUser.id : (currentUser.resellerId || currentUser.id);

    try {
      await fetch(`/api/resellers/${rId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: newWhatsapp })
      });
      setCurrentUser(prev => prev ? ({ ...prev, whatsapp: newWhatsapp }) : null);
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysRemainingCount = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') return 'Acesso Master';
    const rId = currentUser.resellerId || currentUser.id.replace('res-', '');
    const resellerData = resellers.find(r => r.id === rId);
    if (!resellerData) return null;
    if (resellerData.plan === PlanType.VITALICIO || resellerData.expiryDate.startsWith('2099')) return 'Plano Vitalício';
    const expiry = new Date(resellerData.expiryDate);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} dias restantes` : 'Plano Expirado';
  };

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddNewList = (name: string, doc: string) => {
    const rId = currentUser?.role === 'admin' ? '1' : (currentUser?.resellerId || currentUser?.id.replace('res-', '') || '1');
    const newList: CreditList = {
      id: `L-${Math.floor(1000 + Math.random() * 9000)}`,
      resellerId: rId,
      clientDocument: doc,
      startDate: new Date().toISOString(),
      manualConclusion: false,
      organs: { serasa: false, boaVista: false, spc: false, cenprotNacional: false, cenprotSP: false },
      status: 'processing'
    };
    setLists(prev => [newList, ...prev]);
    setActiveTab('lists');
  };

  const navItemClass = (tab: string) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
    ${activeTab === tab
      ? 'bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20 shadow-lg shadow-[#B8860B]/5'
      : 'text-[#8B949E] hover:bg-white/5 hover:text-white'}
  `;

  if (!currentUser) return <AuthScreen onLogin={setCurrentUser} onRegister={setCurrentUser} resellers={resellers} lists={lists} />;

  if (currentUser.role === 'client') {
    const clientList = lists.find(l => l.clientDocument === currentUser.document);
    const partnerId = clientList?.resellerId || currentUser.resellerId || '1';
    const partner = resellers.find(r => r.id === partnerId);
    const partnerServices = services.filter(s => !s.resellerId || s.resellerId === partnerId);

    return <ClientPortal currentUser={currentUser} onLogout={() => setCurrentUser(null)} list={clientList} reseller={partner} services={partnerServices} />;
  }

  if (currentUser.status === 'pending') return <PendingApproval userName={currentUser.name} onLogout={() => setCurrentUser(null)} />;

  const isFinanceTab = ['finance-deposits', 'finance-history'].includes(activeTab);
  const daysRemainingLabel = getDaysRemainingCount();

  const filteredLists = currentUser.role === 'admin'
    ? lists
    : lists.filter(l => l.resellerId === (currentUser.resellerId || currentUser.id.replace('res-', '')));

  const currentResellerIdForServices = currentUser.role === 'admin' ? undefined : (currentUser.resellerId || currentUser.id.replace('res-', ''));
  const filteredServices = currentUser.role === 'admin' ? services : services.filter(s => s.resellerId === currentResellerIdForServices);

  return (
    <div className="flex min-h-screen bg-[#0D1117] text-white overflow-x-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#161B22] border-r border-[#30363D] transition-transform duration-300 lg:static lg:translate-x-0 overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8860B] flex items-center justify-center shadow-lg shadow-[#B8860B]/20"><TrendingUp className="text-white" /></div>
            <div>
              <h1 className="font-bold text-lg leading-none">Central</h1>
              <span className="text-xs text-[#B8860B] font-semibold tracking-widest">REMOÇÃO</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-6">
            <div className="space-y-1">
              <button onClick={() => setActiveTab('dashboard')} className={navItemClass('dashboard')}><LayoutDashboard size={18} /> Painel de Controle</button>
              {currentUser.role === 'admin' && <button onClick={() => setActiveTab('resellers')} className={navItemClass('resellers')}><Users size={18} /> Revendedores</button>}
              <button onClick={() => setActiveTab('services')} className={navItemClass('services')}><Zap size={18} /> Vitrine de Serviços</button>
              {currentUser.role === 'admin' && <button onClick={() => setActiveTab('plans-config')} className={navItemClass('plans-config')}><Settings size={18} /> Planos & Comissões</button>}
            </div>

            <div className="space-y-1">
              <button onClick={() => toggleMenu('clientes')} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-[#484F58] uppercase tracking-widest hover:text-[#8B949E] transition-colors">
                Clientes <ChevronDown size={12} className={`transition-transform ${expandedMenus.clientes ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.clientes && (
                <div className="space-y-1 mt-1">
                  <button onClick={() => setActiveTab('new-clients')} className={navItemClass('new-clients')}><UserPlus size={18} /> Novos Clientes</button>
                  <button onClick={() => setActiveTab('lists')} className={navItemClass('lists')}><Target size={18} /> Percentual de Baixas</button>
                  <button onClick={() => setActiveTab('client-link')} className={navItemClass('client-link')}><LinkIcon size={18} /> Link do Cliente</button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button onClick={() => toggleMenu('consultas')} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-[#484F58] uppercase tracking-widest hover:text-[#8B949E] transition-colors">
                Consultas <ChevronDown size={12} className={`transition-transform ${expandedMenus.consultas ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.consultas && (
                <div className="space-y-1 mt-1">
                  <button onClick={() => setActiveTab('queries')} className={navItemClass('queries')}>
                    <Search size={18} /> Serasa & Boa Vista
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button onClick={() => toggleMenu('financeiro')} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-[#484F58] uppercase tracking-widest hover:text-[#8B949E] transition-colors">
                Financeiro <ChevronDown size={12} className={`transition-transform ${expandedMenus.financeiro ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.financeiro && (
                <div className="space-y-1 mt-1">
                  <button onClick={() => setActiveTab('finance-deposits')} className={navItemClass('finance-deposits')}><Wallet size={18} /> Depósitos</button>
                  <button onClick={() => setActiveTab('finance-history')} className={navItemClass('finance-history')}><History size={18} /> Extrato Detalhado</button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button onClick={() => setActiveTab('creatives')} className={navItemClass('creatives')}><ImageIcon size={18} /> Criativos</button>
              <button onClick={() => setActiveTab('support')} className={navItemClass('support')}><LifeBuoy size={18} /> Suporte Técnico</button>
            </div>
          </nav>

          <div className="p-4 border-t border-[#30363D] shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1117] mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold">{currentUser.role === 'admin' ? 'AD' : 'RV'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-[#8B949E] capitalize">{currentUser.role}</p>
              </div>
            </div>
            <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all group active:scale-95"><LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> <span className="font-medium">Sair</span></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-[#161B22]/80 backdrop-blur-md border-b border-[#30363D] sticky top-0 z-30">
          <button className="lg:hidden p-2 -ml-2 text-[#8B949E]" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <h2 className="text-lg font-black text-white/90 tracking-tighter uppercase">{activeTab.replace('-', ' ')}</h2>

          <div className="flex items-center gap-4">
            {daysRemainingLabel && (
              <div className="hidden md:flex items-center gap-2 bg-[#B8860B]/10 border border-[#B8860B]/20 px-4 py-2 rounded-full">
                <CalendarClock size={16} className="text-[#B8860B]" />
                <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-wider">{daysRemainingLabel}</span>
              </div>
            )}

            <div className="bg-[#0D1117] px-5 py-2.5 rounded-2xl border border-[#30363D] flex items-center gap-3 shadow-inner">
              <Wallet size={16} className="text-[#B8860B]" />
              <span className="text-sm font-black tracking-tight">R$ {currentUser.role === 'admin' ? '1.250,00' : (resellers.find(r => r.id === (currentUser.resellerId || currentUser.id.replace('res-', '')))?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00')}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              resellers={resellers}
              lists={filteredLists}
              transactions={transactions}
              services={services}
              onUpdateWhatsApp={updateResellerWhatsApp}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'resellers' && <ResellerManager resellers={resellers} setResellers={setResellers} lists={lists} currentUser={currentUser} />}
          {activeTab === 'plans-config' && currentUser.role === 'admin' && <PlanManager />}
          {activeTab === 'lists' && <ListManager lists={filteredLists} setLists={setLists} currentUser={currentUser} resellers={resellers} />}

          {isFinanceTab && (
            <Finance
              activeTab={activeTab}
              transactions={transactions}
              setTransactions={setTransactions}
              resellers={resellers}
              setResellers={setResellers}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              platformSettings={platformSettings}
              setPlatformSettings={setPlatformSettings}
            />
          )}

          {activeTab === 'queries' && <Queries />}
          {activeTab === 'new-clients' && <NewClientForm onAddClient={handleAddNewList} />}
          {activeTab === 'creatives' && <CreativesManager currentUser={currentUser} />}
          {activeTab === 'services' && <ServicesManager services={services} setServices={setServices} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          {activeTab === 'support' && (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-10 animate-in">
              <div className="w-24 h-24 bg-[#B8860B]/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-[#B8860B]/20 shadow-inner">
                <LifeBuoy size={48} className="text-[#B8860B]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-white tracking-tighter">Suporte Master Admin</h3>
                <p className="text-[#8B949E] text-lg max-w-md mx-auto">Precisa de ajuda técnica ou liberação de créditos? Nosso time está online.</p>
              </div>
              <a href={`https://wa.me/${masterAdminWhatsApp}`} target="_blank" className="bg-[#25D366] hover:bg-[#1da851] text-white px-12 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-[#25D366]/20 transition-all hover:scale-105 active:scale-95">
                <MessageCircle size={28} /> Abrir Chamado no WhatsApp
              </a>
            </div>
          )}
          {activeTab === 'client-link' && (
            <div className="max-w-xl mx-auto py-10 animate-in">
              <div className="bg-[#161B22] border border-[#30363D] p-12 rounded-[3rem] shadow-2xl text-center space-y-10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                  <LinkIcon size={180} className="text-[#B8860B]" />
                </div>
                <div className="w-20 h-20 bg-[#B8860B]/10 text-[#B8860B] rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-[#B8860B]/20">
                  <LinkIcon size={40} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black tracking-tighter">Link de Acompanhamento</h3>
                  <p className="text-sm text-[#8B949E] max-w-xs mx-auto">Envie este link para seu cliente final para que ele possa ver as baixas sem acessar seu painel.</p>
                </div>
                <div className="bg-[#0D1117] p-6 rounded-3xl border border-[#30363D] flex items-center justify-between gap-4 shadow-inner">
                  <code className="text-[11px] text-[#B8860B] truncate font-mono font-bold">{window.location.origin}?portal=client</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?portal=client`);
                      alert('Link copiado com sucesso!');
                    }}
                    className="p-4 bg-[#B8860B] hover:bg-[#9a7009] text-white rounded-2xl hover:scale-110 transition-transform shadow-xl shadow-[#B8860B]/20 active:scale-90"
                  >
                    <Copy size={24} />
                  </button>
                </div>
                <p className="text-[10px] text-[#484F58] font-black uppercase tracking-[0.3em]">
                  Seguro • Criptografado • Profissional
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
