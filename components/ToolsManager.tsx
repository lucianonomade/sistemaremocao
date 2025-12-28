
import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, ExternalLink, Zap, MessageSquare,
    MapPin, Settings, Layout, Globe, Bot, Smartphone, Wrench, Hammer
} from 'lucide-react';
import { User } from '../types';

interface ToolItem {
    id: string;
    title: string;
    description: string;
    link: string;
    buttonText: string;
    icon: string;
    isActive: boolean;
}

interface ToolsManagerProps {
    currentUser: User;
}

const ToolsManager: React.FC<ToolsManagerProps> = ({ currentUser }) => {
    const [tools, setTools] = useState<ToolItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState<ToolItem | null>(null);

    // Modal Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        buttonText: 'ACESSAR AGORA',
        icon: 'Zap'
    });

    const isAdmin = currentUser.role === 'admin';

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const res = await fetch('/api/tools');
            const data = await res.json();
            setTools(data);
        } catch (error) {
            console.error('Error fetching tools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta ferramenta?')) return;
        try {
            await fetch(`/api/tools/${id}`, { method: 'DELETE' });
            fetchTools();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingTool ? `/api/tools/${editingTool.id}` : '/api/tools';
        const method = editingTool ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            setShowModal(false);
            fetchTools();
            setEditingTool(null);
            setFormData({ title: '', description: '', link: '', buttonText: 'ACESSAR AGORA', icon: 'Zap' });
        } catch (error) {
            alert('Erro ao salvar');
        }
    };

    const openEditModal = (tool: ToolItem) => {
        setEditingTool(tool);
        setFormData({
            title: tool.title,
            description: tool.description,
            link: tool.link,
            buttonText: tool.buttonText,
            icon: tool.icon
        });
        setShowModal(true);
    };

    const getIcon = (iconName: string) => {
        const icons: any = { Zap, Globe, MessageSquare, MapPin, Settings, Layout, Bot, Smartphone, Wrench, Hammer };
        const IconComponent = icons[iconName] || Zap;
        return <IconComponent size={24} />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-['Outfit'] font-black text-white uppercase tracking-tight">Ecossistema de Ferramentas</h1>
                    <p className="text-gray-400 mt-2 font-medium">Potencialize seus resultados com nossas soluções exclusivas de automação e captação.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => { setEditingTool(null); setFormData({ title: '', description: '', link: '', buttonText: 'ACESSAR AGORA', icon: 'Zap' }); setShowModal(true); }}
                        className="bg-[#F59E0B] text-[#0B0E14] px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#D97706] transition-all shadow-lg shadow-[#F59E0B]/20 active:scale-95"
                    >
                        <Plus size={20} /> Nova Ferramenta
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20"><div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <div key={tool.id} className="bg-[#1E2025] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between hover:border-[#F59E0B]/30 transition-all duration-300 group hover:-translate-y-1 shadow-2xl">
                            <div>
                                <div className="w-14 h-14 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center text-[#F59E0B] mb-6 border border-[#F59E0B]/20 group-hover:scale-110 transition-transform">
                                    {getIcon(tool.icon)}
                                </div>
                                <h3 className="text-xl font-['Outfit'] font-bold text-white uppercase mb-2 group-hover:text-[#F59E0B] transition-colors">{tool.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-8">{tool.description}</p>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={tool.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#F59E0B] text-[#0B0E14] py-4 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-[#D97706] transition-all shadow-lg active:scale-95"
                                >
                                    {tool.buttonText} <ExternalLink size={16} />
                                </a>

                                {isAdmin && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => openEditModal(tool)}
                                            className="w-full bg-[#161B22] border border-white/10 text-gray-400 py-3 rounded-xl font-bold uppercase text-xs hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tool.id)}
                                            className="w-full bg-[#161B22] border border-white/10 text-red-500 py-3 rounded-xl font-bold uppercase text-xs hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {tools.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500 bg-[#1E2025]/50 rounded-[2rem] border border-white/5 border-dashed">
                            <Wrench size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold">Nenhuma ferramenta disponível no momento.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1E2025] rounded-[2rem] border border-white/10 p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-['Outfit'] font-bold text-white mb-6 uppercase flex items-center gap-2">
                            <Wrench className="text-[#F59E0B]" /> {editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                <input required className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Robô Extrator" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                                <textarea required className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#F59E0B] focus:outline-none h-24 resize-none"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Breve descrição da ferramenta..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link de Acesso</label>
                                <input required className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
                                    value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto do Botão</label>
                                    <input className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
                                        value={formData.buttonText} onChange={e => setFormData({ ...formData, buttonText: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ícone</label>
                                    <select className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
                                        value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    >
                                        <option value="Zap">Zap (Raio)</option>
                                        <option value="Globe">Globo</option>
                                        <option value="Bot">Robô</option>
                                        <option value="MapPin">Mapa</option>
                                        <option value="MessageSquare">Chat</option>
                                        <option value="Smartphone">Celular</option>
                                        <option value="Settings">Engrenagem</option>
                                        <option value="Layout">Layout</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold uppercase text-sm hover:bg-white/10 hover:text-white transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 bg-[#F59E0B] text-[#0B0E14] py-3 rounded-xl font-bold uppercase text-sm hover:bg-[#D97706] transition-all shadow-lg active:scale-95">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsManager;
