import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Search, Edit, Trash2, Key, Shield, ShieldAlert, X, Eye, EyeOff, Clock, CheckCircle2, Phone, Briefcase, ChevronDown, Lock, Calendar } from 'lucide-react';
import { Reseller, CreditList, Plan, User } from '../types';

interface ResellerManagerProps {
  resellers: Reseller[];
  setResellers: React.Dispatch<React.SetStateAction<Reseller[]>>;
  lists: CreditList[];
  currentUser: User;
}

const ResellerManager: React.FC<ResellerManagerProps> = ({ resellers, setResellers, lists, currentUser }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    usageDays: '30',
    planId: '',
    pixKey: '',
    whatsapp: ''
  });

  const isAdmin = currentUser.role === 'admin';

  React.useEffect(() => {
    fetch('/api/plans').then(res => res.json()).then(setPlans);
  }, []);

  const handleOpenEdit = (reseller: Reseller) => {
    setEditingId(reseller.id);
    setFormData({
      name: reseller.name,
      email: reseller.email,
      password: reseller.password || '',
      usageDays: reseller.usageDays?.toString() || '30',
      planId: reseller.planId || '',
      pixKey: reseller.pixKey || '',
      whatsapp: reseller.whatsapp || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(formData.usageDays) || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      planId: formData.planId,
      pixKey: formData.pixKey,
      whatsapp: formData.whatsapp,
      parentId: isAdmin ? null : currentUser.id,
      usageDays: days,
      expiryDate: expiryDate.toISOString().split('T')[0],
      status: 'active'
    };

    try {
      const url = editingId ? `/api/resellers/${editingId}` : '/api/resellers';
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao salvar revendedor');

      const savedReseller = await response.json();

      if (editingId) {
        setResellers(prev => prev.map(r => r.id === editingId ? savedReseller : r));
      } else {
        setResellers(prev => [...prev, savedReseller]);
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [clientModalOpen, setClientModalOpen] = React.useState(false);
  const [selectedResellerId, setSelectedResellerId] = React.useState<string | null>(null);
  const [selectedResellerName, setSelectedResellerName] = React.useState<string>('');

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o parceiro ${name}? Esta ação não pode ser desfeita e removerá todos os dados vinculados.`)) return;

    try {
      const response = await fetch(`/api/resellers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir revendedor');

      setResellers(prev => prev.filter(r => r.id !== id));
      alert('Parceiro removido com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open modal showing this reseller's clients
  const openClientModal = (resellerId: string, resellerName: string) => {
    setSelectedResellerId(resellerId);
    setSelectedResellerName(resellerName);
    setClientModalOpen(true);
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setSelectedResellerId(null);
    setSelectedResellerName('');
  };

  const handleDeleteClient = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) return;
    try {
      const response = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir protocolo');
      setLists(prev => prev.filter(l => l.id !== listId));
      alert('Protocolo excluído com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#161B22] p-6 rounded-[2rem] border border-[#30363D]">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Parceiros Revendedores</h3>
          <p className="text-xs text-[#8B949E] font-medium">Controle de acessos, senhas e licenças.</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ name: '', email: '', password: '', usageDays: '30', planId: '', pixKey: '', whatsapp: '' }); setModalOpen(true); }} className="w-full sm:w-auto bg-[#B8860B] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-xl shadow-[#B8860B]/20 transition-transform active:scale-95">
          <UserPlus size={18} /> Novo Acesso
        </button>
      </div>

      <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0D1117]/50 border-b border-[#30363D]">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Identificação</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Acesso & Senha</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Vencimento</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#8B949E] uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {resellers.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-sm text-white">{r.name}</p>
                    <p className="text-[10px] text-[#484F58] font-bold uppercase">{r.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.plan?.includes('Teste') ? 'bg-blue-500/10 text-blue-500' : 'bg-[#B8860B]/10 text-[#B8860B]'}`}>{r.plan}</span>
                      <div className="flex items-center gap-1 text-[11px] text-[#484F58] font-mono bg-[#0D1117] px-2 py-1 rounded-lg border border-[#30363D]">
                        <Lock size={10} /> {r.password}
                      </div>
                    </div>
                    {r.pixKey && <p className="text-[9px] text-[#B8860B] mt-1 font-bold">PIX: {r.pixKey}</p>}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#8B949E]">
                      <Calendar size={14} className="text-[#B8860B]" />
                      {r.expiryDate === '2099-12-31' ? 'Vitalício' : r.expiryDate}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(r)} className="p-3 bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#B8860B] rounded-xl transition-all" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(r.id, r.name)} className="p-3 bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-red-500 rounded-xl transition-all" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-xl bg-[#161B22] border border-[#30363D] rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B8860B] to-transparent opacity-75" />

            {/* Header */}
            <div className="flex-none p-8 pb-4 border-b border-[#30363D] bg-[#161B22] rounded-t-[2rem]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                    {editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
                  </h3>
                  <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-widest opacity-80">Gestão de Acesso Ministerial</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 bg-[#0D1117] hover:bg-white/10 rounded-xl text-[#8B949E] hover:text-white transition-colors border border-[#30363D]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#161B22]">
              <form onSubmit={handleSubmit} id="reseller-form" className="space-y-6">

                {/* Identidade */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
                      <Briefcase size={14} />
                    </div>
                    <span className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Identidade</span>
                  </div>

                  <input
                    required
                    placeholder="Nome do Responsável"
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D] focus:shadow-[0_0_20px_rgba(184,134,11,0.1)]"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="email" placeholder="Email Corporativo" className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input placeholder="WhatsApp" className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>

                {/* Segurança */}
                <div className="bg-[#0D1117]/50 border border-[#30363D] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
                      <Lock size={14} />
                    </div>
                    <span className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Segurança de Acesso</span>
                  </div>

                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha de Acesso"
                      className="w-full bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all font-mono placeholder:text-[#30363D]"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#B8860B]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Plano */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#8B949E] uppercase ml-2">Validade (Dias)</label>
                    <input
                      type="number"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none"
                      value={formData.usageDays}
                      onChange={e => setFormData({ ...formData, usageDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#8B949E] uppercase ml-2">Plano</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#B8860B] outline-none appearance-none"
                        value={formData.planId}
                        onChange={e => setFormData({ ...formData, planId: e.target.value })}
                      >
                        <option value="" disabled>Selecione...</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] pointer-events-none" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="flex-none p-6 border-t border-[#30363D] bg-[#161B22] rounded-b-[2rem]">
              <button
                form="reseller-form"
                type="submit"
                className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-[#B8860B]/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} />
                {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ResellerManager;
