
import React, { useState } from 'react';
import { TrendingUp, LogOut, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
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
  const progress = list ? calculateListProgress(list.startDate, list.manualConclusion, list.organs) : 0;

  const resellerServices = services.filter(s => s.resellerId === reseller?.id && s.isActive);

  const handleSupportClick = () => {
    const cleanPhone = (reseller?.whatsapp || '5511999999999').replace(/\D/g, '');
    const text = encodeURIComponent(`Olá, sou o cliente ${currentUser.name} e gostaria de suporte sobre meu processo de limpeza ID: ${list?.id || 'NOVO'}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleServiceClick = (service: ServiceCard) => {
    const cleanPhone = (reseller?.whatsapp || '5511999999999').replace(/\D/g, '');
    const text = encodeURIComponent(`Olá, vi o serviço "${service.title}" na sua vitrine e gostaria de contratá-lo agora.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-100 font-sans flex flex-col items-center relative overflow-hidden selection:bg-[#F59E0B] selection:text-white">

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center fixed top-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 animate-in fade-in duration-700">
          <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] border border-[#F59E0B]/30">
            <TrendingUp size={20} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Painel do Cliente</span>
            <div className="font-extrabold text-sm tracking-wide text-white">
              CENTRAL <span className="text-[#F59E0B]">REMOÇÃO</span>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="group w-10 h-10 rounded-full bg-[#161B22] border border-gray-700 flex items-center justify-center hover:bg-red-900/20 transition-all duration-300 shadow-sm"
        >
          <LogOut size={18} className="text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-lg px-4 py-24 sm:py-28 relative z-10">

        {/* Welcome Section */}
        <div className="text-center mb-8 animate-in slide-in-from-bottom-5 duration-700">
          <h1 className="font-extrabold text-5xl md:text-6xl text-white mb-2 tracking-tight">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{currentUser.name.split(' ')[0]}</span>
          </h1>
          <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-gray-500 uppercase">
            Acompanhe sua blindagem real
          </p>
        </div>

        {/* Status Card */}
        <div className="w-full bg-[#161B22]/80 backdrop-blur-md rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-100">

          {/* Progress Header */}
          <div className="p-6 md:p-8 border-b border-gray-800">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase mb-2">Evolução Sistêmica</p>
                <div className={`inline-flex items-center px-2 py-1 rounded border ${progress === 100 ? 'bg-green-900/30 border-green-800' : 'bg-blue-900/30 border-blue-800'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${progress === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                    {progress === 100 ? 'Processo Finalizado' : 'Em Andamento'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black italic text-5xl text-white leading-none block">{progress}%</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-1">Concluído</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[1500ms] ease-out ${progress >= 90 ? 'bg-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Organs List */}
          <div className="p-6 md:p-8 space-y-3 bg-[#11141c]">
            {[
              { name: 'SERASA EXPERIAN', completed: list?.organs.serasa },
              { name: 'BOA VISTA SCPC', completed: list?.organs.boaVista },
              { name: 'SPC BRASIL', completed: list?.organs.spc },
              { name: 'CENPROT NACIONAL', completed: list?.organs.cenprotNacional },
              { name: 'CENPROT SP (CARTÓRIOS)', completed: list?.organs.cenprotSP }
            ].map((organ, idx) => (
              <div key={idx} className="group flex items-center justify-between p-4 bg-[#1F2937] rounded-xl border border-gray-700 hover:border-[#F59E0B]/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${organ.completed ? 'bg-green-900/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                    {organ.completed ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <span className="font-bold text-sm tracking-wide text-gray-200 uppercase">{organ.name}</span>
                </div>
                <span className={`px-3 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${organ.completed ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  {organ.completed ? 'Baixado' : 'Aguardando'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reseller Showcase Section */}
        {resellerServices.length > 0 && (
          <div className="w-full mt-12 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Serviços Exclusivos</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Oportunidades para o seu Perfil</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {resellerServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-[#161B22] border border-gray-800 rounded-3xl p-5 hover:border-[#F59E0B]/50 transition-all duration-300 group shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                    {service.price > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Valor</span>
                        <p className="text-lg font-black text-[#F59E0B]">R$ {Number(service.price).toFixed(2).replace('.', ',')}</p>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-black text-white mb-2">{service.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-2">{service.description}</p>

                  <button
                    onClick={() => handleServiceClick(service)}
                    className="w-full py-4 bg-[#F59E0B] hover:bg-[#d98b00] text-[#0B0E14] rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-[#F59E0B]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Chamar no WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center opacity-60 animate-in fade-in duration-700 delay-500">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400 mb-2">Atendimento Exclusivo Por</p>
          <div className="font-black text-sm tracking-wide text-white">
            {reseller?.name || 'Central Remoção'}
          </div>
          <div className="w-12 h-0.5 bg-[#F59E0B]/50 mx-auto mt-4 rounded-full"></div>
        </div>

      </main>

      {/* Floating Chat Button */}
      <button
        onClick={handleSupportClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#F59E0B] text-[#0B0E14] rounded-full shadow-lg shadow-[#F59E0B]/30 flex items-center justify-center hover:scale-110 hover:shadow-xl hover:shadow-[#F59E0B]/50 transition-all duration-300 z-50 animate-bounce group"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

    </div>
  );
};

export default ClientPortal;
