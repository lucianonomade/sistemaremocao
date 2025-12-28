import React from 'react';
import { Users, DollarSign, Activity, TrendingUp, ChevronRight, Link, Search, Save, Copy, MessageSquare, Calendar } from 'lucide-react';
import { User, CreditList } from '../types';

interface DashboardHomeProps {
    stats: {
        totalLists: number;
        activeResellers: number;
        averageProgress: number;
        totalRevenue: number;
    };
    lists: CreditList[];
    currentUser: User;
    onNavigate: (tab: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ stats, lists, currentUser, onNavigate }) => {
    const recentLists = lists.slice(0, 3); // Show top 3 recent

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#181A1E] rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total de Clientes</p>
                            <h3 className="text-3xl font-['Outfit'] font-bold text-white">{stats.totalLists}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1E2025] text-blue-400 group-hover:bg-blue-400/10 transition-colors">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#181A1E] rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                {currentUser.role === 'admin' ? 'Faturamento da Master' : 'Faturamento de Revendas'}
                            </p>
                            <h3 className="text-3xl font-['Outfit'] font-bold text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1E2025] text-green-400 group-hover:bg-green-400/10 transition-colors">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#181A1E] rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Média de Progresso</p>
                            <h3 className="text-3xl font-['Outfit'] font-bold text-white">{Math.round(stats.averageProgress)}%</h3>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1E2025] text-yellow-400 group-hover:bg-yellow-400/10 transition-colors">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>

                {currentUser.role === 'admin' && (
                    <div className="bg-[#181A1E] rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between h-32 group hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Revendedores Ativos</p>
                                <h3 className="text-3xl font-['Outfit'] font-bold text-white">{stats.activeResellers}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1E2025] text-purple-400 group-hover:bg-purple-400/10 transition-colors">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visão Geral dos Protocolos */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Link className="text-[#D99000]" size={20} />
                            <h3 className="font-['Outfit'] font-bold text-lg text-white">Visão Geral dos Protocolos</h3>
                        </div>
                        <button
                            onClick={() => onNavigate('lists')}
                            className="text-[10px] font-bold uppercase tracking-wider bg-[#1E2025] hover:bg-white/10 text-[#D99000] border border-[#D99000]/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                        >
                            Gerenciar Todos
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentLists.map(list => {
                            const completedOrgans = Object.values(list.organs).filter(status => status).length;
                            const totalOrgans = Object.values(list.organs).length;
                            const progress = Math.round((completedOrgans / totalOrgans) * 100);
                            const progressColor = progress === 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500';
                            const textColor = progress === 100 ? 'text-green-500' : progress >= 50 ? 'text-blue-500' : 'text-yellow-500';

                            return (
                                <div key={list.id} className="bg-[#181A1E] border border-white/5 rounded-2xl p-6 relative group hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`bg-opacity-10 ${progressColor.replace('bg-', 'text-')} px-3 py-1 rounded text-xs font-bold font-mono bg-white bg-opacity-5`}>
                                                #{list.id.split('-')[1]}
                                            </span>
                                            <h4 className="font-bold text-white text-sm">{list.clientDocument}</h4>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${textColor}`}>{progress}% Concluído</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                                        <div className={`${progressColor} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {recentLists.length === 0 && (
                            <div className="bg-[#181A1E] border border-white/5 rounded-2xl p-8 text-center">
                                <p className="text-gray-500 text-sm">Nenhum protocolo recente.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-8">
                    {/* Card Portal do Cliente */}
                    <div className="bg-[#181A1E] border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Link size={96} />
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-700/20 to-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-700/20">
                            <Link className="text-[#D99000]" size={32} />
                        </div>
                        <h3 className="font-['Outfit'] font-bold text-xl text-white mb-3">Portal do Cliente</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-8">
                            Compartilhe este link para seu cliente acompanhar o progresso em tempo real.
                        </p>
                        <div className="bg-[#0A0A0C] border border-white/5 rounded-xl p-2 flex items-center gap-2 pl-4 group-hover:border-[#D99000]/30 transition-colors">
                            <code className="text-xs text-yellow-500 truncate flex-1 text-left font-mono">
                                {window.location.origin}/?portal=client
                            </code>
                            <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?portal=client`)}
                                className="bg-[#D99000] hover:bg-[#b37600] text-white p-2.5 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Card Suporte */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="text-yellow-500" size={20} />
                            <h3 className="font-['Outfit'] font-bold text-lg text-white">WhatsApp de Vendas</h3>
                        </div>
                        <div className="bg-[#181A1E] border border-white/5 rounded-3xl p-6">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Configurar WhatsApp de Vendas</label>
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MessageSquare className="text-gray-500" size={18} />
                                </div>
                                <input
                                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-[#D99000] focus:border-[#D99000] transition-all outline-none"
                                    placeholder="Ex: 5511999999999"
                                    type="text"
                                    defaultValue={currentUser.whatsapp || ''}
                                />
                            </div>
                            <button className="w-full bg-[#D99000] hover:bg-[#b37600] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#D99000]/20 transition-all flex items-center justify-center gap-2">
                                <Save size={18} />
                                Salvar Configuração
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
