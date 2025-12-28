
import React from 'react';
import { CheckCircle2, MessageCircle, LogOut, ShieldAlert, Clock } from 'lucide-react';

interface PendingApprovalProps {
  userName: string;
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ userName, onLogout }) => {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-[#161B22] border border-[#30363D] rounded-[3rem] p-10 md:p-14 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#B8860B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-8 animate-pulse shadow-[0_0_40px_rgba(34,197,94,0.1)]">
              <CheckCircle2 size={56} />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">Cadastro realizado com sucesso!</h2>
            
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 mb-8 text-left space-y-4">
              <p className="text-lg text-[#E6EDF3] leading-relaxed">
                Olá <span className="text-[#B8860B] font-black">{userName}</span>, sua conta foi criada e está <span className="text-yellow-500 font-bold underline decoration-wavy">aguardando aprovação</span> pela nossa equipe administrativa.
              </p>
              
              <div className="flex items-center gap-3 text-sm text-[#8B949E]">
                <Clock size={18} className="text-[#B8860B]" />
                <span>Tempo médio de aprovação: <strong>Até 2 horas</strong></span>
              </div>
            </div>

            <p className="text-[#8B949E] mb-10 text-sm font-medium">
              Entre em contato pelo link abaixo para ativar sua conta agora mesmo com um de nossos atendentes.
            </p>

            <a 
              href="https://wa.me/5500000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1da851] text-white py-5 rounded-3xl font-black text-xl shadow-2xl shadow-[#25D366]/20 transition-all transform hover:scale-[1.03] flex items-center justify-center gap-3 active:scale-95"
            >
              <MessageCircle size={28} /> Ativar Minha Conta
            </a>

            <button 
              onClick={onLogout}
              className="mt-8 text-[#8B949E] hover:text-white flex items-center gap-2 text-sm font-bold transition-all group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sair do Sistema
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-[#30363D]">
          <div className="h-[1px] w-12 bg-current" />
          <ShieldAlert size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Painel de Acesso Restrito</span>
          <div className="h-[1px] w-12 bg-current" />
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
