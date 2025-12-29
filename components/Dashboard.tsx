
import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Activity,
  FileText,
  TrendingUp,
  ChevronRight,
  MessageCircle,
  Save,
  Target,
  Link as LinkIcon,
  Copy,
  Check,
  Zap,
  Smartphone,
  CalendarClock,
  ShieldAlert,
  CheckCircle,
  X,
  Loader2,
  QrCode
} from 'lucide-react';
import { Reseller, CreditList, Transaction, User, ServiceCard, PlanType } from '../types';
import { calculateListProgress } from '../utils/progress';

interface DashboardProps {
  currentUser: User;
  resellers: Reseller[];
  lists: CreditList[];
  transactions: Transaction[];
  services: ServiceCard[];
  onUpdateWhatsApp: (val: string) => void;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  resellers,
  lists,
  transactions,
  services,
  onUpdateWhatsApp,
  onNavigate
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [tempWhatsApp, setTempWhatsApp] = useState(currentUser.whatsapp || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [copied, setCopied] = useState(false);

  // Renewal State
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [pixData, setPixData] = useState<{ encodedImage: string, payload: string } | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);

  const handleRenewPix = async () => {
    setLoadingPix(true);
    setShowRenewalModal(true);
    try {
      const amount = 29.90; // Default Renewal Price
      const res = await fetch('/api/asaas/create-pix-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amount, type: 'plan_renewal' })
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        alert('Erro ao gerar PIX de renovação: ' + data.error);
        setShowRenewalModal(false);
      }
    } catch (error) {
      alert('Erro de conexão.');
      setShowRenewalModal(false);
    } finally {
      setLoadingPix(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const resellerId = currentUser.role === 'admin' ? null : (currentUser.resellerId || currentUser.id.replace('res-', ''));
  const resellerData = !isAdmin ? resellers.find(r => r.id === resellerId) : null;

  const filteredLists = isAdmin ? lists : lists.filter(l => l.resellerId === resellerId);
  const totalClients = filteredLists.length;

  const monthlyRevenue = transactions
    .filter(t => t.type === 'plan_payment' || t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const avgProgress = filteredLists.length > 0
    ? Math.round(filteredLists.reduce((sum, l) => sum + calculateListProgress(l.startDate, l.manualConclusion, l.organs), 0) / filteredLists.length)
    : 0;

  const activeResellersCount = resellers.filter(r => r.status === 'active').length;

  const getDaysRemainingCount = () => {
    if (isAdmin) return null;
    if (!resellerData) return 0;
    if (resellerData.plan === PlanType.VITALICIO) return 9999;
    const expiry = new Date(resellerData.expiryDate);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemainingCount();

  const stats = [
    { label: 'Total de Clientes', value: totalClients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', visible: true },
    { label: isAdmin ? 'Faturamento da Master' : 'Faturamento de Revendas', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10', visible: isAdmin },
    { label: 'Média de Progresso', value: `${avgProgress}%`, icon: Activity, color: 'text-[#B8860B]', bg: 'bg-[#B8860B]/10', visible: true },
    { label: isAdmin ? 'Revendedores Ativos' : 'Listas em Aberto', value: isAdmin ? activeResellersCount : filteredLists.filter(l => l.status === 'processing').length, icon: isAdmin ? TrendingUp : FileText, color: 'text-purple-500', bg: 'bg-purple-500/10', visible: true },
  ].filter(s => s.visible);

  const handleCopyLink = () => {
    setCopied(true);
    navigator.clipboard.writeText(`${window.location.origin}?portal=client`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWhatsApp = () => {
    if (isSaving) return;
    setIsSaving(true);

    // Simulando delay de rede para UX profissional
    setTimeout(() => {
      onUpdateWhatsApp(tempWhatsApp);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in text-white">

      {!isAdmin && daysRemaining !== null && (
        <div className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${daysRemaining <= 5 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#161B22] border-[#30363D]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${daysRemaining <= 5 ? 'bg-red-500 text-white' : 'bg-[#B8860B]/10 text-[#B8860B]'}`}>
              {daysRemaining <= 5 ? <ShieldAlert size={24} /> : <CalendarClock size={24} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8B949E]">Status da sua Licença</p>
              <h4 className="text-xl font-black text-white">
                {resellerData?.plan === PlanType.VITALICIO ? 'Plano Vitalício Ativo' :
                  daysRemaining <= 0 ? 'Licença Expirada' :
                    `${daysRemaining} dias restantes de acesso`}
              </h4>
            </div>
          </div>
          {daysRemaining <= 5 && resellerData?.plan !== PlanType.VITALICIO && (
            <button
              onClick={handleRenewPix}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest animate-pulse shadow-xl shadow-red-500/20 active:scale-95 transition-all"
            >
              Renovar Agora
            </button>
          )}
        </div>
      )}

      {/* Grid de Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#161B22] border border-[#30363D] p-6 rounded-3xl hover:border-[#B8860B]/50 transition-all group shadow-xl hover:shadow-[#B8860B]/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#8B949E] text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:rotate-12 transition-transform`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Monitor de Protocolos Ativos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black flex items-center gap-3">
                <FileText className="text-[#B8860B]" size={20} />
                {isAdmin ? 'Visão Geral dos Protocolos' : 'Meus Clientes em Andamento'}
              </h3>
              <button
                onClick={() => onNavigate('lists')}
                className="text-[10px] bg-[#B8860B]/10 text-[#B8860B] px-5 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-[#B8860B] hover:text-white transition-all flex items-center gap-1 shadow-lg active:scale-95"
              >
                Gerenciar Todos <ChevronRight size={14} />
              </button>
            </div>

            <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] overflow-hidden shadow-2xl">
              {filteredLists.length > 0 ? filteredLists.slice(0, 5).map((list, i) => {
                const prog = calculateListProgress(list.startDate, list.manualConclusion, list.organs);
                return (
                  <div key={list.id} className={`p-6 flex items-center gap-5 ${i !== 0 ? 'border-t border-[#30363D]' : ''} hover:bg-white/[0.02] transition-colors cursor-pointer group`} onClick={() => onNavigate('lists')}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-105 ${prog === 100 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20'}`}>
                      #{list.id.split('-')[1] || list.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-black text-white truncate">{list.clientDocument || 'Cliente Sem Documento'}</p>
                        <span className={`text-[10px] font-black uppercase ${prog === 100 ? 'text-green-500' : 'text-[#B8860B]'}`}>{prog}% Concluído</span>
                      </div>
                      <div className="w-full bg-[#0D1117] h-3 rounded-full overflow-hidden border border-[#30363D] p-0.5 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${prog >= 90 && prog < 100 ? 'bg-[#B8860B] shadow-[0_0_10px_rgba(184,134,11,0.5)]' : prog === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-20 text-center space-y-4">
                  <Target size={48} className="mx-auto text-[#30363D] opacity-20" />
                  <p className="text-[#484F58] font-bold">Nenhum processo ativo no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#B8860B]/30 p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-125 transition-transform pointer-events-none duration-1000">
              <LinkIcon size={180} className="text-[#B8860B]" />
            </div>
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 bg-[#B8860B]/10 text-[#B8860B] rounded-3xl flex items-center justify-center mx-auto mb-2 border border-[#B8860B]/20 shadow-inner group-hover:rotate-6 transition-transform">
                <LinkIcon size={32} />
              </div>
              <h3 className="text-xl font-black text-white">Portal do Cliente</h3>
              <p className="text-xs text-[#8B949E] font-medium leading-relaxed">Compartilhe este link para seu cliente acompanhar o progresso em tempo real.</p>

              <div className="bg-[#0D1117] p-4 rounded-2xl border border-[#30363D] flex items-center justify-between gap-3 shadow-inner">
                <span className="text-[10px] text-[#B8860B] truncate font-mono font-bold tracking-tight">{window.location.origin}/portal</span>
                <button
                  onClick={handleCopyLink}
                  className={`p-3 rounded-xl transition-all shrink-0 active:scale-90 ${copied ? 'bg-green-500 text-white' : 'bg-[#B8860B] text-white hover:bg-[#9a7009] shadow-lg shadow-[#B8860B]/20'}`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black flex items-center gap-3 px-2">
              <Smartphone size={20} className="text-[#B8860B]" />
              WhatsApp de Vendas
            </h3>
            <div className="bg-[#161B22] border border-[#30363D] p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest ml-1">Configurar WhatsApp de Vendas</p>
                  <div className="relative group">
                    <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#B8860B] transition-colors" size={20} />
                    <input
                      type="text"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-5 py-5 text-sm text-white focus:border-[#B8860B] outline-none transition-all font-bold placeholder:text-[#484F58] shadow-inner"
                      placeholder="Ex: 5511999999999"
                      value={tempWhatsApp}
                      onChange={(e) => setTempWhatsApp(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveWhatsApp}
                  disabled={isSaving}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${saveSuccess ? 'bg-green-600 text-white' : 'bg-[#B8860B] hover:bg-[#9a7009] text-white shadow-[#B8860B]/10'}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : saveSuccess ? (
                    <><CheckCircle size={20} /> Salvo com Sucesso!</>
                  ) : (
                    <><Save size={20} /> Salvar Configuração</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Renewal PIX Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161B22] border border-[#30363D] w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in-50 duration-200">
            <button
              onClick={() => { setShowRenewalModal(false); setPixData(null); }}
              className="absolute top-6 right-6 text-[#8B949E] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                <QrCode size={32} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Renovar Licença</h3>
              <p className="text-[#8B949E] text-sm">Escaneie para renovar por 30 dias.</p>
            </div>

            {loadingPix && !pixData ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#B8860B]" size={32} />
              </div>
            ) : pixData ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-5">
                <div className="bg-white p-4 rounded-2xl w-fit mx-auto">
                  <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
                <div className="bg-[#0D1117] p-4 rounded-xl border border-[#30363D] flex items-center justify-between gap-4">
                  <div className="truncate text-[10px] text-[#8B949E] font-mono select-all">
                    {pixData.payload}
                  </div>
                  <button
                    onClick={() => copyToClipboard(pixData.payload)}
                    className="text-[#B8860B] hover:text-white transition-colors flex-shrink-0"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-center text-xs text-[#8B949E] px-4">
                  O acesso será liberado automaticamente após o pagamento.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


