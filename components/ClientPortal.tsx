
import React, { useState } from 'react';
import { TrendingUp, MessageCircle, ShieldCheck, LogOut, Zap, QrCode, Copy, CheckCircle2, X, ExternalLink, CreditCard, ChevronRight, Smartphone } from 'lucide-react';
import { User, CreditList, Reseller, ServiceCard } from '../types';
import { calculateListProgress } from '../utils/progress';

interface ClientPortalProps {
  currentUser: User;
  onLogout: () => void;
  list: CreditList | undefined;
  reseller: Reseller | undefined;
  services: ServiceCard[];
}

const ClientPortal: React.FC<ClientPortalProps> = ({ currentUser, onLogout, list, reseller, services }) => {
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const progress = list ? calculateListProgress(list.startDate, list.manualConclusion, list.organs) : 0;

  const handleCopyPix = () => {
    setCopied(true);
    navigator.clipboard.writeText(reseller?.paymentConfig?.pixKey || 'Chave não configurada');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSupportClick = () => {
    // Limpando o número para garantir que contenha apenas dígitos
    const cleanPhone = (reseller?.whatsapp || '5511999999999').replace(/\D/g, '');
    const text = encodeURIComponent(`Olá, sou o cliente ${currentUser.name} e gostaria de suporte sobre meu processo de limpeza ID: ${list?.id || 'NOVO'}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const activeServices = services.filter(s => s.isActive);

  return (
    <div className="min-h-screen bg-[#0D1117] text-white pb-24 selection:bg-[#B8860B]/30">
      <header className="bg-[#161B22]/90 backdrop-blur-xl border-b border-[#30363D] sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B8860B] flex items-center justify-center shadow-lg shadow-[#B8860B]/20"><TrendingUp size={22} className="text-white" /></div>
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-widest text-[#8B949E]">Painel do Cliente</span>
            <span className="font-black text-sm uppercase tracking-tighter">CENTRAL <span className="text-[#B8860B]">REMOÇÃO</span></span>
          </div>
        </div>
        <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl text-[#8B949E] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"><LogOut size={20} /></button>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-8">
        <div className="space-y-1 py-4 animate-in">
          <h2 className="text-5xl font-black tracking-tighter text-white">Olá, {currentUser.name.split(' ')[0]}</h2>
          <p className="text-xs text-[#8B949E] font-bold uppercase tracking-[0.3em] ml-1">Acompanhe sua blindagem real</p>
        </div>

        {/* Status do Processo */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-[3rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group animate-in delay-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest mb-1">Evolução Sistêmica</p>
              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border ${progress === 100 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                {progress === 100 ? 'Processo Finalizado' : 'Processando Baixas'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-6xl font-black italic text-white group-hover:text-[#B8860B] transition-colors duration-500">{progress}%</span>
              <span className="text-[10px] font-black text-[#484F58] uppercase">Concluído</span>
            </div>
          </div>

          <div className="w-full h-5 bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D] p-1 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${progress >= 90 ? 'bg-[#B8860B] shadow-[0_0_15px_rgba(184,134,11,0.4)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="pt-4 grid grid-cols-1 gap-3">
            {[
              { name: 'Serasa Experian', completed: list?.organs.serasa },
              { name: 'Boa Vista SCPC', completed: list?.organs.boaVista },
              { name: 'SPC Brasil', completed: list?.organs.spc },
              { name: 'Cenprot Nacional', completed: list?.organs.cenprotNacional },
              { name: 'Cenprot SP (Cartórios)', completed: list?.organs.cenprotSP }
            ].map((organ, idx) => (
              <div key={idx} className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300 ${organ.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-[#0D1117] border-[#30363D]'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${organ.completed ? 'bg-green-500 border-green-500/10 text-white shadow-lg shadow-green-500/10' : 'bg-[#161B22] border-[#30363D] text-[#484F58]'}`}>
                    {organ.completed ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/90">{organ.name}</span>
                </div>
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${organ.completed ? 'text-green-500 bg-green-500/10' : 'text-[#484F58] bg-[#161B22]'}`}>
                  {organ.completed ? 'Baixado' : 'Aguardando'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vitrine de Serviços do Parceiro */}
        {activeServices.length > 0 && (
          <div className="space-y-4 animate-in delay-200">
            <h3 className="text-xl font-black flex items-center gap-2 px-1">
              <Zap className="text-[#B8860B]" size={22} />
              Nossas Soluções
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {activeServices.map(service => (
                <div key={service.id} className="bg-[#161B22] border border-[#30363D] p-6 rounded-[2.5rem] hover:border-[#B8860B]/50 transition-all flex items-center gap-5 shadow-lg group active:scale-95">
                  <div className="w-14 h-14 rounded-2xl bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <Zap size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-sm uppercase tracking-tight">{service.title}</h4>
                    <p className="text-xs text-[#8B949E] line-clamp-2 font-medium mt-1 leading-relaxed">{service.description}</p>
                  </div>
                  <button onClick={handleSupportClick} className="p-4 rounded-2xl bg-[#0D1117] text-[#B8860B] border border-[#30363D] hover:bg-[#B8860B] hover:text-white transition-all shadow-lg active:scale-90">
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações e Suporte */}
        <div className="grid grid-cols-1 gap-5 pt-4 animate-in delay-300">
          <button onClick={() => setShowRenewalModal(true)} className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-[#B8860B]/20 flex items-center justify-center gap-4 transition-all hover:scale-[1.03] active:scale-95">
            <Zap size={32} /> Renovar Blindagem
          </button>
          <button onClick={handleSupportClick} className="w-full bg-white/5 text-[#8B949E] py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95">
            <MessageCircle size={24} className="text-[#B8860B]" /> Falar com Especialista
          </button>
        </div>

        {/* Footer do Revendedor */}
        <div className="text-center space-y-3 pt-6 animate-in delay-500">
          <div className="h-[1px] w-12 bg-[#30363D] mx-auto"></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#484F58]">Atendimento exclusivo por</p>
            <p className="text-md font-black text-white/80 tracking-tighter mt-1">{reseller?.name || 'Central Remoção'}</p>
          </div>
        </div>
      </main>

      {/* Modal de Renovação (simplificado para manter foco no WhatsApp) */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#161B22] border border-[#30363D] rounded-[3.5rem] w-full max-w-sm p-12 space-y-8 relative shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setShowRenewalModal(false)} className="absolute top-8 right-8 text-[#8B949E] hover:text-white transition-all active:scale-90"><X size={36} /></button>

            <div className="text-center space-y-3">
              <div className="w-24 h-24 bg-[#B8860B]/10 text-[#B8860B] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-[#B8860B]/20 shadow-inner"><CreditCard size={48} /></div>
              <h3 className="text-3xl font-black text-white">Novo Ciclo</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">Proteja seu histórico de crédito por mais 90 dias com nossa blindagem 100% segura.</p>
            </div>

            <div className="bg-white p-6 rounded-[3.5rem] shadow-2xl border-[16px] border-[#0D1117] aspect-square flex items-center justify-center overflow-hidden">
              {reseller?.paymentConfig?.pixQrCode ? (
                <img src={reseller.paymentConfig.pixQrCode} className="w-full h-full object-contain" alt="QR Code PIX" />
              ) : (
                <div className="text-center space-y-3 opacity-20">
                  <QrCode size={140} className="text-black mx-auto" />
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">Aguardando QR Code</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button onClick={handleCopyPix} className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-3 transition-all active:scale-95 ${copied ? 'bg-green-600 text-white shadow-xl shadow-green-600/20' : 'bg-[#0D1117] text-white border border-[#30363D] hover:border-[#B8860B]'}`}>
                {copied ? <><CheckCircle2 size={18} /> Código Copiado!</> : <><Copy size={18} /> Copiar Chave PIX</>}
              </button>
              <button onClick={handleSupportClick} className="w-full bg-[#25D366] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-95">
                <MessageCircle size={18} /> Enviar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
