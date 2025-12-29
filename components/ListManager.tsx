
import React from 'react';
import { Clock, CheckCircle2, ListChecks, Calendar, ShieldCheck, UserCheck, Share2, Target, AlertCircle, TrendingUp, Upload } from 'lucide-react';
import { CreditList, User, OrganStatus, Reseller } from '../types';
import { calculateListProgress, calculateOrganProgress } from '../utils/progress';
// Dynamic import used in handleFileUpload


interface ListManagerProps {
  lists: CreditList[];
  setLists: React.Dispatch<React.SetStateAction<CreditList[]>>;
  currentUser: User;
  resellers: Reseller[];
}

const ListManager: React.FC<ListManagerProps> = ({ lists, setLists, currentUser, resellers }) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newClientDoc, setNewClientDoc] = React.useState('');
  const [newClientName, setNewClientName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Agora permitimos que tanto Admin quanto Reseller tenham controle manual
  const hasControlAccess = currentUser.role === 'admin' || currentUser.role === 'reseller';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);

    try {
      // Carregar XLSX do CDN dinamicamente se não estiver presente no window
      // @ts-ignore
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // @ts-ignore
      const XLSX = window.XLSX;
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let count = 0;

      // Determine column indices based on header (Row 0)
      const headerRow = jsonData[0] as any[];
      let docIndex = 0; // Default to Col 0
      let nameIndex = 1; // Default to Col 1

      if (Array.isArray(headerRow)) {
        const lowerHeader = headerRow.map(h => h?.toString().toLowerCase() || '');
        const foundDoc = lowerHeader.findIndex(h => h.includes('cpf') || h.includes('document') || h.includes('cnpj'));
        const foundName = lowerHeader.findIndex(h => h.includes('nome') || h.includes('client') || h.includes('razao'));

        if (foundDoc !== -1) docIndex = foundDoc;
        if (foundName !== -1) nameIndex = foundName;
      }

      // Iterate starting from Row 1
      for (let i = 1; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const doc = row[docIndex]?.toString().replace(/\D/g, '');
        const name = row[nameIndex]?.toString() || '';

        if (doc && (doc.length === 11 || doc.length === 14)) {
          // Create List logic repeated
          try {
            const res = await fetch('/api/lists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resellerId: currentUser.id, clientDocument: doc, clientName: name })
            });
            if (res.ok) {
              const newList = await res.json();
              const formattedList: CreditList = {
                id: newList.id || `temp-${Date.now()}-${Math.random()}`,
                resellerId: currentUser.id,
                clientDocument: doc,
                clientName: name,
                startDate: new Date().toISOString(),
                manualConclusion: false,
                status: 'processing',
                organs: { serasa: false, boaVista: false, spc: false, cenprotNacional: false, cenprotSP: false }
              };
              setLists(prev => [formattedList, ...prev]);
              count++;
            }
          } catch (e) { console.error('Error importing row', i, e); }
        }
      }
      alert(`${count} protocolos importados com sucesso!`);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar arquivo Excel.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientDoc) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: currentUser.id, clientDocument: newClientDoc, clientName: newClientName })
      });
      if (!res.ok) throw new Error('Erro ao criar protocolo');
      const newList = await res.json();

      // Add to list with default structure
      const formattedList: CreditList = {
        id: newList.id || `temp-${Date.now()}`,
        resellerId: currentUser.id,
        clientDocument: newClientDoc,
        clientName: newClientName,
        startDate: new Date().toISOString(),
        manualConclusion: false,
        status: 'processing',
        organs: { serasa: false, boaVista: false, spc: false, cenprotNacional: false, cenprotSP: false }
      };

      setLists([formattedList, ...lists]);
      setIsModalOpen(false);
      setNewClientDoc('');
      setNewClientName('');
      alert('Protocolo criado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCompletion = async (id: string) => {
    if (!hasControlAccess) return;
    try {
      await fetch(`/api/lists/${id}/complete`, { method: 'POST' });
      setLists(prev => prev.map(l =>
        l.id === id ? {
          ...l,
          manualConclusion: true,
          status: 'completed',
          organs: { serasa: true, boaVista: true, spc: true, cenprotNacional: true, cenprotSP: true }
        } : l
      ));
      alert('Processo concluído em 100% com sucesso!');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOrgan = async (listId: string, organ: keyof OrganStatus) => {
    if (!hasControlAccess) return;

    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const newValue = !list.organs[organ];

    try {
      const response = await fetch(`/api/lists/${listId}/organs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organ, active: newValue })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status do órgão');

      setLists(prev => prev.map(l => {
        if (l.id === listId) {
          const newOrgans = { ...l.organs, [organ]: newValue };
          return { ...l, organs: newOrgans };
        }
        return l;
      }));
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar a alteração no banco de dados.');
    }
  };

  const copyClientLink = (listId: string, cpf: string) => {
    const baseUrl = window.location.origin;
    const clientLink = `${baseUrl}?portal=client&cpf=${cpf}`;
    navigator.clipboard.writeText(clientLink).then(() => {
      alert('Link do Cliente copiado!');
    });
  };

  const OrganProgressBar: React.FC<{ active: boolean; label: string; progress: number; onClick: () => void; disabled: boolean }> = ({ active, label, progress, onClick, disabled }) => {
    const displayProgress = active ? 100 : progress;
    return (
      <div className={`p-4 rounded-2xl border transition-all ${active ? 'bg-green-500/5 border-green-500/20 shadow-lg shadow-green-500/5' : 'bg-[#0D1117] border-[#30363D]'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${active ? 'bg-green-500 text-white' : 'bg-[#161B22] text-[#484F58]'}`}>
              <CheckCircle2 size={12} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/80">{label}</span>
          </div>
          {!disabled && !active && (
            <button
              onClick={onClick}
              className="text-[8px] font-black uppercase px-2 py-1 rounded-lg bg-[#B8860B]/10 text-[#B8860B] hover:bg-[#B8860B] hover:text-white transition-all"
            >
              Baixar
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#161B22] rounded-full overflow-hidden border border-[#30363D]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${active ? 'bg-green-500' : progress >= 90 ? 'bg-[#B8860B]' : 'bg-blue-500'}`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <span className={`text-[10px] font-black w-8 text-right ${active ? 'text-green-500' : 'text-[#8B949E]'}`}>{displayProgress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="bg-[#161B22] border border-[#30363D] p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
          <TrendingUp size={140} />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#B8860B]/20 text-[#B8860B] flex items-center justify-center border border-[#B8860B]/20">
            <ListChecks size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black">{currentUser.role === 'admin' ? 'Gestão Master de Protocolos' : 'Meus Protocolos Ativos'}</h3>
            <p className="text-xs text-[#8B949E] font-bold uppercase tracking-widest">Acompanhamento e Baixa Manual Habilitada</p>
          </div>
        </div>

        {hasControlAccess && (
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".xlsx, .xls, .csv"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-[#1e2229] border border-[#30363D] hover:bg-[#252a33] text-[#8B949E] hover:text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group/btn w-full sm:w-auto"
              disabled={isLoading}
            >
              <Upload size={18} className="group-hover/btn:scale-110 transition-transform" />
              {isLoading ? 'Processando...' : 'Importar Lote'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#B8860B] hover:bg-[#9a7009] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#B8860B]/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Target size={18} /> Novo Protocolo
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-[#8B949E] hover:text-white"><AlertCircle className="rotate-45" size={24} /></button>

            <h3 className="text-2xl font-black text-white mb-2">Novo Cliente</h3>
            <p className="text-sm text-[#8B949E] mb-6">Inicie o processo de blindagem para um novo CPF ou CNPJ.</p>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Nome do Cliente</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-4 text-white font-bold focus:border-[#B8860B] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Documento (CPF/CNPJ)</label>
                <input
                  required
                  type="text"
                  value={newClientDoc}
                  onChange={e => setNewClientDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-4 text-white font-bold focus:border-[#B8860B] outline-none"
                />
              </div>
              <button disabled={isLoading} className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all">
                {isLoading ? 'Criando...' : 'Iniciar Blindagem'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {lists.map((list) => {
          const overallProgress = calculateListProgress(list.startDate, list.manualConclusion, list.organs);

          return (
            <div key={list.id} className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl relative group hover:border-[#B8860B]/30 transition-all">

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.2em]">Protocolo ID</span>
                  <h4 className="text-4xl font-black text-white tracking-tighter mb-1">#{list.id.split('-')[1]}</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{list.clientName || 'Cliente sem nome'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyClientLink(list.id, list.clientDocument || '')}
                    className="p-3 rounded-2xl bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#B8860B] hover:border-[#B8860B]/30 transition-all"
                    title="Copiar Link do Cliente"
                  >
                    <Share2 size={20} />
                  </button>
                  <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border ${overallProgress === 100 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {overallProgress === 100 ? 'Finalizado' : 'Em Andamento'}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#0D1117] rounded-3xl border border-[#30363D] space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#B8860B] animate-pulse" />
                    <span className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Evolução Real</span>
                  </div>
                  <span className={`text-4xl font-black italic tracking-tighter ${overallProgress >= 90 ? 'text-[#B8860B]' : 'text-white'}`}>
                    {overallProgress}%
                  </span>
                </div>
                <div className="w-full h-4 bg-[#161B22] rounded-full overflow-hidden border border-[#30363D] p-1">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${overallProgress >= 90 ? 'bg-[#B8860B] shadow-[0_0_15px_rgba(184,134,11,0.3)]' : 'bg-blue-500'}`}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <OrganProgressBar disabled={!hasControlAccess} active={list.organs.serasa} label="Serasa" progress={calculateOrganProgress(list.startDate, list.organs.serasa, 0)} onClick={() => toggleOrgan(list.id, 'serasa')} />
                <OrganProgressBar disabled={!hasControlAccess} active={list.organs.boaVista} label="Boa Vista" progress={calculateOrganProgress(list.startDate, list.organs.boaVista, 1)} onClick={() => toggleOrgan(list.id, 'boaVista')} />
                <OrganProgressBar disabled={!hasControlAccess} active={list.organs.spc} label="SPC" progress={calculateOrganProgress(list.startDate, list.organs.spc, 2)} onClick={() => toggleOrgan(list.id, 'spc')} />
                <OrganProgressBar disabled={!hasControlAccess} active={list.organs.cenprotNacional} label="Cenprot Nac." progress={calculateOrganProgress(list.startDate, list.organs.cenprotNacional, 3)} onClick={() => toggleOrgan(list.id, 'cenprotNacional')} />
                <OrganProgressBar disabled={!hasControlAccess} active={list.organs.cenprotSP} label="Cenprot SP" progress={calculateOrganProgress(list.startDate, list.organs.cenprotSP, 4)} onClick={() => toggleOrgan(list.id, 'cenprotSP')} />
              </div>

              <div className="pt-4 border-t border-[#30363D]/50 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#0D1117] rounded-2xl border border-[#30363D]">
                  <div className="w-10 h-10 rounded-xl bg-[#161B22] flex items-center justify-center text-[#B8860B]">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-[#484F58] uppercase">Documento do Cliente</p>
                    <p className="text-sm font-bold text-white/90">{list.clientDocument}</p>
                  </div>
                </div>

                {hasControlAccess && overallProgress < 100 && (
                  <button
                    onClick={() => confirmCompletion(list.id)}
                    className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#B8860B]/20 flex items-center justify-center gap-3 group/btn"
                  >
                    <UserCheck size={24} className="group-hover/btn:scale-110 transition-transform" />
                    Confirmar Baixa Total
                  </button>
                )}

                {overallProgress === 100 && (
                  <div className="w-full py-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-center flex items-center justify-center gap-3">
                    <ShieldCheck size={24} /> Processo Finalizado com Sucesso
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {lists.length === 0 && (
          <div className="col-span-full py-32 bg-[#161B22] border border-[#30363D] border-dashed rounded-[3rem] text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-[#30363D]" />
            <p className="text-[#8B949E] font-bold">Nenhum protocolo encontrado para acompanhamento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListManager;
