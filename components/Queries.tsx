
import React from 'react';
import { Search, ShieldAlert, Zap, Landmark, ShieldCheck, AlertTriangle } from 'lucide-react';

const Queries: React.FC = () => {
  const queryTypes = [
    { id: 'serasa', name: 'Consulta Serasa Experian', cost: 'R$ 15,00', color: 'bg-blue-600' },
    { id: 'boavista', name: 'Consulta SCPC Boa Vista', cost: 'R$ 12,00', color: 'bg-purple-600' },
    { id: 'bacen', name: 'Consulta Bacen (Registrato)', cost: 'R$ 25,00', color: 'bg-green-600' },
    { id: 'cadin', name: 'Consulta CADIN Nacional', cost: 'R$ 20,00', color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Consultas Premium</h2>
          <p className="text-[#8B949E]">Relatórios detalhados diretamente das fontes oficiais.</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500">
           <AlertTriangle size={24} className="shrink-0" />
           <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
             Integração via API <br/> em Desenvolvimento
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {queryTypes.map((query) => (
          <div key={query.id} className="relative group cursor-not-allowed">
            {/* Maintenance Overlay */}
            <div className="absolute inset-0 z-10 bg-[#0D1117]/80 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-all border border-yellow-500/30">
               <ShieldAlert className="text-yellow-500 mb-3" size={32} />
               <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Manutenção</p>
               <p className="text-[9px] text-[#8B949E] font-bold">A integração via API estará disponível em breve.</p>
            </div>

            <div className="bg-[#161B22] border border-[#30363D] p-6 rounded-[2rem] shadow-xl h-full flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 ${query.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/20`}>
                  <Search className="text-white" size={24} />
                </div>
                <h4 className="font-black text-white text-lg leading-tight mb-2">{query.name}</h4>
                <p className="text-xs text-[#8B949E] font-medium leading-relaxed">Relatório completo de apontamentos, dívidas e score de crédito.</p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-[#30363D] flex items-center justify-between">
                <span className="text-[10px] font-black text-[#B8860B] uppercase">Custo</span>
                <span className="text-sm font-black text-white">{query.cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#161B22] border border-[#30363D] p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
         <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
            <ShieldCheck size={180} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center shrink-0 border border-[#B8860B]/20">
               <Zap size={48} />
            </div>
            <div className="text-center md:text-left space-y-2">
               <h3 className="text-2xl font-black text-white">Consulte seu Cliente Agora!</h3>
               <p className="text-[#8B949E] text-sm leading-relaxed max-w-xl">
                 Em breve você poderá realizar consultas automatizadas que descontam diretamente do seu saldo de revendedor. Mais agilidade para fechar novos contratos de remoção.
               </p>
               <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-50 mt-4">
                 Aguardando Lançamento
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Queries;
