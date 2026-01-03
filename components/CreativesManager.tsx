
import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Image as ImageIcon,
  FileText,
  Video,
  Download,
  Trash2,
  Upload,
  X,
  FolderOpen,
  Search,
  Filter
} from 'lucide-react';
import { CreativeMaterial, User } from '../types';

interface CreativesManagerProps {
  currentUser: User;
}

const CreativesManager: React.FC<CreativesManagerProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<CreativeMaterial[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/creatives');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error fetching creatives:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Geral',
    type: 'image' as 'image' | 'pdf' | 'video'
  });

  const categories = ['Todos', 'Limpa Nome', 'Jusbrasil', 'Escavador', 'Bacen', 'Banners Instagram', 'Tabela de Preços', 'Vídeos Treinamento', 'Geral'];

  const filteredMaterials = (Array.isArray(materials) ? materials : []).filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      alert('Selecione um arquivo!');
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setIsLoading(true);

    try {
      // 1. Upload File
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Erro no upload');
      const { url } = await uploadRes.json();

      // 2. Save Metadata
      const payload = {
        name: newMaterial.name,
        category: newMaterial.category,
        type: newMaterial.type,
        url: url,
        thumbnail: newMaterial.type === 'image' ? url : null // Auto thumbnail for images
      };

      const saveRes = await fetch('/api/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Erro ao salvar criativo no banco');
      }

      const savedCreative = await saveRes.json();
      setMaterials([savedCreative, ...materials]);
      setIsModalOpen(false);
      setNewMaterial({ name: '', category: 'Geral', type: 'image' });
      alert('Criativo adicionado com sucesso!');

    } catch (err: any) {
      console.error(err);
      alert('Erro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, name: string) => {
    if (!url || url === '#') {
      alert('Link de download inválido.');
      return;
    }
    // Cria um link temporário para forçar o download se possível
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeMaterial = async (id: string) => {
    if (!confirm('Deseja realmente excluir este material?')) return;

    try {
      const res = await fetch(`/api/creatives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMaterials(materials.filter(m => m.id !== id));
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch (err) {
      alert('Erro ao excluir material.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={24} />;
      case 'pdf': return <FileText size={24} />;
      case 'video': return <Video size={24} />;
      default: return <FolderOpen size={24} />;
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Criativos & Materiais</h2>
          <p className="text-[#8B949E]">Acesse banners, tabelas e vídeos para impulsionar suas vendas.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#9a7009] text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-[#B8860B]/20"
          >
            <Plus size={20} />
            Novo Material
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484F58]" size={18} />
          <input
            type="text"
            placeholder="Buscar materiais..."
            className="w-full bg-[#161B22] border border-[#30363D] rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-[#B8860B] focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                ? 'bg-[#B8860B] text-white border-[#B8860B]'
                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:border-[#484F58]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-[#161B22] border border-[#30363D] rounded-[2rem] overflow-hidden group hover:border-[#B8860B]/30 transition-all flex flex-col shadow-xl">
            {/* Thumbnail Area */}
            {/* Thumbnail Area */}
            <div className="aspect-video bg-[#0D1117] relative flex items-center justify-center overflow-hidden group-hover:bg-[#161B22] transition-colors">
              {material.type === 'video' ? (
                <video
                  src={material.url}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              ) : material.thumbnail ? (
                <>
                  <img
                    src={material.thumbnail}
                    alt={material.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="fallback-icon hidden text-[#30363D] group-hover:text-[#B8860B] transition-colors absolute inset-0 flex items-center justify-center">
                    {getIcon(material.type)}
                  </div>
                </>
              ) : (
                <div className="text-[#30363D] group-hover:text-[#B8860B] transition-colors">
                  {getIcon(material.type)}
                </div>
              )}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-[#B8860B] border border-[#B8860B]/20">
                  {material.type}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#484F58] uppercase tracking-widest mb-1">{material.category}</p>
                <h4 className="font-bold text-white text-sm leading-snug group-hover:text-[#B8860B] transition-colors">{material.name}</h4>
              </div>

              <div className="mt-6 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDownload(material.url, material.name)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#B8860B]/10 hover:bg-[#B8860B] text-[#B8860B] hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all group/btn"
                >
                  <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
                  Download
                </button>
                {isAdmin && (
                  <button
                    onClick={() => removeMaterial(material.id)}
                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-[#161B22] rounded-full flex items-center justify-center mx-auto text-[#30363D]">
              <FolderOpen size={40} />
            </div>
            <p className="text-[#8B949E] font-medium">Nenhum material encontrado.</p>
          </div>
        )}
      </div>

      {/* Admin Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Upload de Criativo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8B949E] hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Nome do Arquivo</label>
                <input
                  required
                  type="text"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-5 py-4 text-sm focus:border-[#B8860B] focus:outline-none"
                  placeholder="Ex: Tabela de Preços Março"
                  value={newMaterial.name}
                  onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Categoria</label>
                  <select
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-4 py-4 text-sm focus:border-[#B8860B] focus:outline-none"
                    value={newMaterial.category}
                    onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}
                  >
                    {categories.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Tipo</label>
                  <select
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-4 py-4 text-sm focus:border-[#B8860B] focus:outline-none"
                    value={newMaterial.type}
                    onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                  >
                    <option value="image">Imagem</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#30363D] rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[#B8860B]/50 hover:bg-[#B8860B]/5 transition-all mt-4"
              >
                <input type="file" className="hidden" ref={fileInputRef} />
                <Upload className="text-[#B8860B]" size={32} />
                <span className="text-xs font-bold text-[#8B949E]">
                  {fileInputRef.current?.files?.[0] ? fileInputRef.current.files[0].name : 'Selecionar Arquivo'}
                </span>
              </div>

              <button
                disabled={isLoading}
                className="w-full bg-[#B8860B] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9a7009] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#B8860B]/20 transition-all mt-6"
              >
                {isLoading ? 'Salvando...' : 'Salvar Criativo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativesManager;
