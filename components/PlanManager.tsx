
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, CheckCircle2, X, Percent, DollarSign } from 'lucide-react';
import { Plan } from '../types';

interface PlanManagerProps {
    onPlanUpdate?: () => void;
}

const PlanManager: React.FC<PlanManagerProps> = ({ onPlanUpdate }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        commissionRate: '',
        description: ''
    });

    const fetchPlans = async () => {
        const res = await fetch('/api/plans');
        if (res.ok) setPlans(await res.json());
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            price: parseFloat(formData.price),
            commissionRate: parseFloat(formData.commissionRate),
            description: formData.description
        };

        const url = editingId ? `/api/plans/${editingId}` : '/api/plans';
        const method = editingId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', price: '', commissionRate: '', description: '' });
            fetchPlans();
            onPlanUpdate?.();
        } else {
            const err = await res.json();
            alert('Erro ao salvar plano: ' + (err.error || 'Erro desconhecido'));
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingId(plan.id);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            commissionRate: plan.commissionRate.toString(),
            description: plan.description || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este plano?')) return;
        const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
        if (res.ok) fetchPlans();
    };

    return (
        <div className="space-y-8 animate-in pb-10">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#161B22] p-8 rounded-[2.5rem] border border-[#30363D] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                    <Settings size={140} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Engenharia de Planos</h3>
                    <p className="text-sm text-[#8B949E] font-medium">Defina os valores, comissões e pacotes de acesso do seu ecossistema.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ name: '', price: '', commissionRate: '', description: '' }); setModalOpen(true); }}
                    className="w-full sm:w-auto bg-[#B8860B] hover:bg-[#9a7009] text-white px-10 py-5 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 shadow-2xl shadow-[#B8860B]/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Criar Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-[#161B22] border border-[#30363D] rounded-[3rem] p-10 flex flex-col gap-8 shadow-2xl relative group hover:border-[#B8860B]/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.2em]">Modalidade Ativa</span>
                                <h4 className="text-3xl font-black text-white tracking-tighter mt-1">{plan.name}</h4>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(plan)} className="p-3 bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#B8860B] rounded-xl transition-all"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(plan.id)} className="p-3 bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-red-400 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="bg-[#0D1117] p-6 rounded-3xl border border-[#30363D] space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-500" />
                                    <span className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Valor do Plano</span>
                                </div>
                                <span className="text-xl font-black text-white">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-[#30363D]">
                                <div className="flex items-center gap-2">
                                    <Percent size={16} className="text-[#B8860B]" />
                                    <span className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Comissão Padrão</span>
                                </div>
                                <span className="text-xl font-black text-[#B8860B]">{plan.commissionRate}%</span>
                            </div>
                        </div>

                        <div className="text-xs text-[#8B949E] font-medium leading-relaxed italic">
                            "{plan.description || 'Nenhuma descrição definida para este plano.'}"
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500 text-white">
                    <div className="bg-[#161B22] border border-[#30363D] rounded-[3.5rem] w-full max-w-md p-12 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{editingId ? 'Refinar Plano' : 'Novo Plano Master'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-[#8B949E] hover:text-white transition-all"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Nome do Plano</label>
                                <input required placeholder="Ex: Master Vitalício" className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-6 py-5 text-sm font-bold text-white focus:border-[#B8860B] outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Preço R$</label>
                                    <input required type="number" step="0.01" placeholder="997.00" className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-6 py-5 text-sm font-bold text-white focus:border-[#B8860B] outline-none" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Comissão %</label>
                                    <input required type="number" placeholder="50" className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-6 py-5 text-sm font-bold text-[#B8860B] focus:border-[#B8860B] outline-none" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Descrição (Vantagens)</label>
                                <textarea rows={3} placeholder="Descreva os benefícios deste plano..." className="w-full bg-[#0D1117] border border-[#30363D] rounded-3xl px-6 py-5 text-sm font-bold text-white focus:border-[#B8860B] outline-none resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <button className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-[#B8860B]/20 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4">
                                <CheckCircle2 size={24} /> {editingId ? 'Salvar Configurações' : 'Implantar Plano'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanManager;
