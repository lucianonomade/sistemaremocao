
import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Activity, Zap, ToggleLeft as Toggle, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { ServiceCard, User } from '../types';

interface ServicesManagerProps {
  services: ServiceCard[];
  setServices: React.Dispatch<React.SetStateAction<ServiceCard[]>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ services, setServices, currentUser, setCurrentUser }) => {
  const isAdmin = currentUser.role === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'manage' | 'store'>('manage');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    isActive: true
  });

  const myServices = isAdmin
    ? services
    : services.filter(s => s.resellerId === (currentUser.resellerId || currentUser.id));

  const storeServices = !isAdmin
    ? services.filter(s => !s.resellerId && s.isActive)
    : [];

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', price: 0, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceCard) => {
    setEditingId(service.id);
    setFormData({ title: service.title, description: service.description, price: service.price || 0, isActive: service.isActive });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const resellerId = currentUser.role === 'admin' ? null : (currentUser.resellerId || currentUser.id);

    const payload = {
      ...formData,
      price: Number(formData.price),
      reseller_id: resellerId,
      icon: 'Zap'
    };

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao salvar serviço.');

      const savedService = await response.json();
      setServices(prev => editingId ? prev.map(s => s.id === editingId ? savedService : s) : [...prev, savedService]);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este serviço da vitrine?')) return;
    try {
      const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string) => {
    // Apenas visual change por enquanto, manter simples
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handlePurchase = async (service: ServiceCard) => {
    if (!confirm(`Confirmar contratação de "${service.title}" por R$ ${Number(service.price).toFixed(2)}?`)) return;

    setPurchasingId(service.id);
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: currentUser.id, serviceId: service.id })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Serviço contratado com sucesso!');
        // Atualizar saldo do usuário localmente
        setCurrentUser(prev => prev ? ({ ...prev, balance: data.newBalance }) : null);
      } else {
        alert('Erro ao contratar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro de conexão ao processar compra.');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Central de Serviços</h2>
          <p className="text-[#8B949E]">
            {isAdmin ? 'Gestão Global de Serviços' : 'Contrate soluções ou gerencie sua vitrine.'}
          </p>
        </div>

        {!isAdmin && (
          <div className="flex bg-[#161B22] p-1 rounded-xl border border-[#30363D]">
            <button
              onClick={() => setViewMode('manage')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'manage' ? 'bg-[#B8860B] text-white' : 'text-[#8B949E] hover:text-white'}`}
            >
              Minha Vitrine
            </button>
            <button
              onClick={() => setViewMode('store')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'store' ? 'bg-[#B8860B] text-white' : 'text-[#8B949E] hover:text-white'}`}
            >
              Loja Central
            </button>
          </div>
        )}

        {(isAdmin || viewMode === 'manage') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#9a7009] text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-[#B8860B]/20"
          >
            <Plus size={20} />
            Novo Serviço
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(viewMode === 'manage' ? myServices : storeServices).map((service) => (
          <div key={service.id} className={`bg-[#161B22] border rounded-[2rem] p-6 flex flex-col justify-between transition-all group shadow-xl ${service.isActive ? 'border-[#30363D] hover:border-[#B8860B]/50' : 'border-red-500/20 opacity-60'}`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${viewMode === 'store' ? 'bg-[#B8860B]/10 text-[#B8860B]' : (service.isActive ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'bg-[#30363D] text-[#8B949E]')}`}>
                  {viewMode === 'store' ? <ShoppingBag size={24} /> : <Zap size={24} />}
                </div>

                {viewMode === 'manage' && (
                  <button
                    onClick={() => toggleStatus(service.id)}
                    className={`p-2 rounded-lg transition-colors ${service.isActive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}
                  >
                    <Activity size={18} />
                  </button>
                )}
                {viewMode === 'store' && (
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#8B949E] uppercase">Valor</span>
                    <p className="text-lg font-black text-[#B8860B]">R$ {Number(service.price).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{service.title}</h4>
              <p className="text-sm text-[#8B949E] leading-relaxed line-clamp-3">{service.description}</p>
            </div>

            <div className="mt-8">
              {viewMode === 'manage' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0D1117] hover:bg-[#B8860B]/10 text-[#8B949E] hover:text-[#B8860B] py-3 rounded-xl text-xs font-bold border border-[#30363D] hover:border-[#B8860B]/30 transition-all"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(service)}
                  disabled={!!purchasingId}
                  className="w-full bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg shadow-[#B8860B]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {purchasingId === service.id ? (
                    'Processando...'
                  ) : (
                    <>
                      <ShoppingBag size={18} /> Contratar Agora
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {(viewMode === 'manage' ? myServices : storeServices).length === 0 && (
          <div className="col-span-full py-20 bg-[#161B22] border border-[#30363D] border-dashed rounded-[3rem] text-center">
            <Zap size={48} className="mx-auto text-[#30363D] mb-4" />
            <p className="text-[#8B949E] font-bold">
              {viewMode === 'manage' ? 'Nenhum serviço cadastrado na sua vitrine.' : 'Nenhum serviço disponível na loja no momento.'}
            </p>
            {viewMode === 'manage' && (
              <button onClick={openAddModal} className="mt-4 text-[#B8860B] font-black hover:underline">Cadastrar Primeiro Serviço</button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-white">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <p className="text-xs text-[#8B949E]">Preencha os dados para sua vitrine individual.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8B949E] hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Título do Serviço</label>
                <input
                  required
                  type="text"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-5 py-4 text-sm focus:border-[#B8860B] focus:outline-none transition-all font-bold"
                  placeholder="Ex: Aumento de Score Turbo"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Descrição Curta</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-5 py-4 text-sm focus:border-[#B8860B] focus:outline-none transition-all resize-none"
                  placeholder="Descreva o que este serviço oferece ao cliente..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#0D1117] rounded-2xl border border-[#30363D]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-10 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-[#B8860B]' : 'bg-[#30363D]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-5' : 'left-1'}`} />
                </button>
                <div>
                  <label className="block text-sm font-bold text-[#8B949E] mb-2 uppercase tracking-wider">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="flex items-center gap-3 bg-[#0D1117] p-4 rounded-xl border border-[#30363D]">
                  <Toggle size={24} className={formData.isActive ? 'text-green-500' : 'text-[#8B949E]'} />
                  <span className="text-sm font-bold text-white">Serviço Ativo na Vitrine</span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </div>
              </div>

              <button className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-[#B8860B]/20 transition-all active:scale-95">
                {editingId ? 'Salvar Alterações' : 'Publicar Serviço'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;
