
import React from 'react';
import { Clock, CheckCircle2, ListChecks, Calendar, ShieldCheck, UserCheck, Share2, Target, AlertCircle, TrendingUp, Upload, Trash2 } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newClientDoc, setNewClientDoc] = React.useState('');
  const [newClientName, setNewClientName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'export' | 'system'>('export');
  const [downloadFilter, setDownloadFilter] = React.useState({
    batchId: '',
    startDate: '',
    endDate: ''
  });
  const [downloadOrgans, setDownloadOrgans] = React.useState({
    serasa: true, boaVista: true, spc: true, cenprotNacional: true, cenprotSP: true
  });
  const [expandedBatches, setExpandedBatches] = React.useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = React.useState<any>(null); // New state for modal
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

      // Pre-scan to count valid CPFs
      const validRows = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const doc = row[docIndex]?.toString().replace(/\D/g, '');
        const name = row[nameIndex]?.toString() || '';
        if (doc && (doc.length === 11 || doc.length === 14)) {
          validRows.push({ doc, name });
        }
      }

      // Generate a batch ID only if 10 or more CPFs (according to specification)
      const now = new Date();
      const batchId = validRows.length >= 10
        ? `LOTE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
        : null;

      // Iterate valid rows
      for (const row of validRows) {
        try {
          const res = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resellerId: currentUser.id, clientDocument: row.doc, clientName: row.name, batchId })
          });
          if (res.ok) {
            const newList = await res.json();
            const formattedList: CreditList = {
              id: newList.id || `temp-${Date.now()}-${Math.random()}`,
              resellerId: currentUser.id,
              clientDocument: row.doc,
              clientName: row.name,
              batchId: batchId || undefined,
              startDate: new Date().toISOString(),
              manualConclusion: false,
              status: 'processing',
              organs: { serasa: false, boaVista: false, spc: false, cenprotNacional: false, cenprotSP: false }
            };
            setLists(prev => [formattedList, ...prev]);
            count++;
          }
        } catch (e) { console.error('Error importing row', row.doc, e); }
      }
      alert(`${count} protocolos importados com sucesso!${batchId ? `\nLote ID: ${batchId}` : ''}`);
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


  const toggleOrgan = async (id: string, organ: string) => {
    const list = lists.find(l => l.id === id);
    if (!list) return;

    // @ts-ignore
    const currentStatus = list.organs[organ];
    const nextStatus = !currentStatus;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/lists/${id}/organs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organ, active: nextStatus })
      });

      if (!res.ok) throw new Error('Erro ao atualizar órgão');

      setLists(prev => prev.map(l => {
        if (l.id === id) {
          const newOrgans = { ...l.organs, [organ]: nextStatus };
          const isNowFull = Object.values(newOrgans).every(v => v === true);

          return {
            ...l,
            organs: newOrgans,
            status: isNowFull ? 'completed' : l.status,
            manualConclusion: isNowFull ? true : l.manualConclusion
          };
        }
        return l;
      }));
    } catch (err: any) { alert(err.message); }
    finally { setIsLoading(false); }
  };

  const confirmBatchCompletion = async (batchId: string) => {
    const members = lists.filter(l => l.batchId === batchId);
    const ids = members.map(m => m.id);

    if (!confirm(`Deseja baixar TODOS os órgãos para os protocolos do lote ${batchId}?`)) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/lists/batch/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) throw new Error('Erro ao completar lote');

      setLists(prev => prev.map(l => {
        if (l.batchId === batchId) {
          return {
            ...l,
            status: 'completed',
            manualConclusion: true,
            organs: { serasa: true, boaVista: true, spc: true, cenprotNacional: true, cenprotSP: true }
          };
        }
        return l;
      }));
    } catch (err: any) { alert(err.message); }
    finally { setIsLoading(false); }
  };

  const toggleBatchOrgan = async (batchId: string, organ: keyof OrganStatus) => {
    const members = lists.filter(l => l.batchId === batchId);
    if (members.length === 0) return;

    const ids = members.map(m => m.id);
    const currentStatus = members.every(m => m.organs[organ]);
    const nextStatus = !currentStatus;

    setIsLoading(true);
    try {
      const res = await fetch('/api/lists/batch/organs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, organ, active: nextStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar lote');

      setLists(prev => prev.map(l => {
        if (l.batchId === batchId) {
          const newOrgans = { ...l.organs, [organ]: nextStatus };
          const isNowFull = Object.values(newOrgans).every(v => v === true);
          return {
            ...l,
            organs: newOrgans,
            status: isNowFull ? 'completed' : l.status,
            manualConclusion: isNowFull ? true : l.manualConclusion
          };
        }
        return l;
      }));
    } catch (err: any) { alert(err.message); }
    finally { setIsLoading(false); }
  };

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CreditList[]> = {};
    const individuals: CreditList[] = [];

    lists.forEach(list => {
      if (list.batchId) {
        if (!groups[list.batchId]) groups[list.batchId] = [];
        groups[list.batchId].push(list);
      } else {
        individuals.push(list);
      }
    });

    const batchItems = Object.entries(groups).map(([batchId, members]) => {
      // Sort members by ID for consistency
      const sortedMembers = [...members].sort((a, b) => a.id.localeCompare(b.id));
      const representative = sortedMembers[0];

      const aggregateOrgans = {
        serasa: members.every(m => m.organs.serasa),
        boaVista: members.every(m => m.organs.boaVista),
        spc: members.every(m => m.organs.spc),
        cenprotNacional: members.every(m => m.organs.cenprotNacional),
        cenprotSP: members.every(m => m.organs.cenprotSP),
      };

      const isManual = members.every(m => m.manualConclusion);
      const overallProgress = calculateListProgress(representative.startDate, isManual, aggregateOrgans);

      return {
        isBatch: true,
        batchId,
        members: sortedMembers,
        representative,
        organs: aggregateOrgans,
        overallProgress,
        manualConclusion: isManual
      };
    });

    const individualItems = individuals.map(l => ({
      ...l,
      isBatch: false,
      overallProgress: calculateListProgress(l.startDate, l.manualConclusion, l.organs)
    }));

    return [...batchItems, ...individualItems].sort((a, b) => {
      const dateA = new Date((a as any).representative?.startDate || (a as any).startDate || 0).getTime();
      const dateB = new Date((b as any).representative?.startDate || (b as any).startDate || 0).getTime();
      return dateB - dateA;
    });
  }, [lists]);

  const copyClientLink = (listId: string, cpf: string) => {
    const baseUrl = window.location.origin;
    const clientLink = `${baseUrl}?portal=client&cpf=${cpf}`;
    navigator.clipboard.writeText(clientLink).then(() => {
      alert('Link do Cliente copiado!');
    });
  };
  const handleDeleteList = async (listId: string) => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir este cliente? Esta ação é irreversível.')) {
      return;
    }

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Falha ao excluir cliente');

      setLists(prev => prev.filter(l => l.id !== listId));
      alert('Cliente removido com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir cliente');
    }
  };

  const handleBatchDownload = async () => {
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
    if (!XLSX) {
      alert('Carregando biblioteca de exportação. Tente novamente em 2 segundos.');
      return;
    }

    let filteredLists = [...lists];

    if (downloadFilter.batchId) {
      filteredLists = filteredLists.filter(l => l.batchId === downloadFilter.batchId);
    }

    if (downloadFilter.startDate) {
      const start = new Date(downloadFilter.startDate).getTime();
      filteredLists = filteredLists.filter(l => new Date(l.startDate).getTime() >= start);
    }

    if (downloadFilter.endDate) {
      const end = new Date(downloadFilter.endDate).getTime();
      filteredLists = filteredLists.filter(l => new Date(l.startDate).getTime() <= end);
    }

    if (filteredLists.length === 0) {
      alert('Nenhum protocolo encontrado com os filtros selecionados.');
      return;
    }

    const exportData = filteredLists.map(l => {
      const data: any = {
        'Protocolo': l.id,
        'Cliente': l.clientName,
        'Documento': l.clientDocument,
        'Data Início': new Date(l.startDate).toLocaleDateString(),
        'Lote': l.batchId || 'N/A'
      };

      if (downloadOrgans.serasa) data['Serasa'] = l.organs.serasa ? 'LIMPO' : 'PENDENTE';
      if (downloadOrgans.boaVista) data['Boa Vista'] = l.organs.boaVista ? 'LIMPO' : 'PENDENTE';
      if (downloadOrgans.spc) data['SPC'] = l.organs.spc ? 'LIMPO' : 'PENDENTE';
      if (downloadOrgans.cenprotNacional) data['Cenprot Nacional'] = l.organs.cenprotNacional ? 'LIMPO' : 'PENDENTE';
      if (downloadOrgans.cenprotSP) data['Cenprot SP'] = l.organs.cenprotSP ? 'LIMPO' : 'PENDENTE';

      return data;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Protocolos");
    XLSX.writeFile(workbook, `Protocolos_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBatchSystemUpdate = async () => {
    let filteredLists = [...lists];

    if (downloadFilter.batchId) {
      filteredLists = filteredLists.filter(l => l.batchId === downloadFilter.batchId);
    }

    if (downloadFilter.startDate) {
      const start = new Date(downloadFilter.startDate).getTime();
      filteredLists = filteredLists.filter(l => new Date(l.startDate).getTime() >= start);
    }

    if (downloadFilter.endDate) {
      const end = new Date(downloadFilter.endDate).getTime();
      filteredLists = filteredLists.filter(l => new Date(l.startDate).getTime() <= end);
    }

    if (filteredLists.length === 0) {
      alert('Nenhum protocolo encontrado com os filtros selecionados.');
      return;
    }

    if (!confirm(`Deseja aplicar BAIXA no sistema para ${filteredLists.length} protocolos nos órgãos selecionados?`)) return;

    setIsLoading(true);
    const ids = filteredLists.map(l => l.id);
    const organsToUpdate = Object.entries(downloadOrgans)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    try {
      // Se todos os órgãos estiverem selecionados, usa a rota de complete total
      const allOrgansSelected = organsToUpdate.length === 5;

      if (allOrgansSelected) {
        const res = await fetch('/api/lists/batch/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });
        if (!res.ok) throw new Error('Erro ao completar protocolos em lote');
      } else {
        // Update each organ in batch
        for (const organ of organsToUpdate) {
          const res = await fetch('/api/lists/batch/organs', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, organ, active: true })
          });
          if (!res.ok) throw new Error(`Erro ao atualizar órgão ${organ}`);
        }
      }

      // Update local state
      setLists(prev => prev.map(l => {
        if (ids.includes(l.id)) {
          const newOrgans = { ...l.organs };
          organsToUpdate.forEach(o => {
            // @ts-ignore
            newOrgans[o] = true;
          });

          const isNowFull = Object.values(newOrgans).every(v => v === true);

          return {
            ...l,
            organs: newOrgans,
            status: isNowFull ? 'completed' : l.status,
            manualConclusion: isNowFull ? true : l.manualConclusion
          };
        }
        return l;
      }));

      alert('Baixa realizada com sucesso no sistema!');
      setIsDownloadModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const OrganProgressBar: React.FC<{ active: boolean; label: string; progress: number; onClick: () => void; disabled: boolean }> = ({ active, label, progress, onClick, disabled }) => {
    const displayProgress = active ? 100 : progress;
    const isWaiting = !active && progress >= 97;

    return (
      <div
        onClick={() => !disabled && onClick()}
        className={`relative p-3 rounded-2xl border transition-all cursor-pointer group/organ ${active ? 'bg-green-500/10 border-green-500/30' : isWaiting ? 'bg-[#B8860B]/10 border-[#B8860B]/50' : 'bg-[#0D1117] border-[#30363D] hover:border-[#B8860B]/30'}`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${active ? 'text-green-500' : isWaiting ? 'text-[#B8860B]' : 'text-[#8B949E] group-hover/organ:text-white'}`}>{label}</span>
          {active ? (
            <CheckCircle2 size={12} className="text-green-500" />
          ) : (
            <span className={`text-[9px] font-bold ${isWaiting ? 'text-[#B8860B]' : 'text-[#484F58]'}`}>
              {isWaiting ? 'AGUARDANDO BAIXA' : `${displayProgress}%`}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full bg-[#161B22] rounded-full overflow-hidden p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-green-500' : isWaiting ? 'bg-[#B8860B] animate-pulse' : 'bg-[#30363D]'}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    );
  };


  return (
    <div className="p-8">
      <div className="space-y-6 animate-in text-white">
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
                onClick={() => {
                  setModalMode('export');
                  setIsDownloadModalOpen(true);
                }}
                className="px-6 py-3 bg-[#1e2229] border border-[#30363D] hover:bg-[#252a33] text-[#8B949E] hover:text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group/btn w-full sm:w-auto"
              >
                <TrendingUp size={18} className="rotate-90 group-hover/btn:scale-110 transition-transform" />
                Exportar Protocolos
              </button>
              <button
                onClick={() => {
                  // Determine current week range (Portuguese context, week usually starts on Sunday or Monday)
                  const now = new Date();
                  const day = now.getDay();
                  const diff = now.getDate() - day; // Sunday
                  const start = new Date(now.setDate(diff)).toISOString().split('T')[0];
                  const end = new Date(now.setDate(diff + 6)).toISOString().split('T')[0];

                  setDownloadFilter(prev => ({ ...prev, startDate: start, endDate: end }));
                  setModalMode('system');
                  setIsDownloadModalOpen(true);
                }}
                className="px-6 py-3 bg-[#1e2229] border border-[#30363D] hover:bg-[#252a33] text-[#8B949E] hover:text-[#B8860B] rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group/btn w-full sm:w-auto"
              >
                <ShieldCheck size={18} className="group-hover/btn:scale-110 transition-transform" />
                Baixar Semana (Sistema)
              </button>
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

        {/* Download Modal */}
        {isDownloadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#161B22] border border-[#30363D] rounded-[2rem] w-full max-w-lg p-5 shadow-2xl animate-in zoom-in-95 relative flex flex-col max-h-[85vh]">
              <button onClick={() => setIsDownloadModalOpen(false)} className="absolute top-4 right-4 text-[#8B949E] hover:text-white"><AlertCircle className="rotate-45" size={20} /></button>


              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                {modalMode === 'export' ? 'Exportação Inteligente' : 'Baixa em Lote (Sistema)'}
              </h3>
              <p className="text-xs text-[#8B949E] mb-4">
                {modalMode === 'export'
                  ? 'Filtre por lote, data e órgãos.'
                  : 'Selecione os dados para atualizar.'}
              </p>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {/* Filtros de Data/Lote */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Data Inicial</label>
                    <input
                      type="date"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white font-bold focus:border-[#B8860B] outline-none"
                      value={downloadFilter.startDate}
                      onChange={e => setDownloadFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Data Final</label>
                    <input
                      type="date"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white font-bold focus:border-[#B8860B] outline-none"
                      value={downloadFilter.endDate}
                      onChange={e => setDownloadFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8B949E] uppercase ml-1">Filtrar por Lote (OPCIONAL)</label>
                  <select
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white font-bold focus:border-[#B8860B] outline-none appearance-none"
                    value={downloadFilter.batchId}
                    onChange={e => setDownloadFilter(prev => ({ ...prev, batchId: e.target.value }))}
                  >
                    <option value="">Todos os Lotes</option>
                    {Array.from(new Set(lists.map(l => l.batchId).filter(Boolean))).map(batch => (
                      <option key={batch} value={batch!}>{batch}</option>
                    ))}
                  </select>
                </div>

                {/* Seleção de Órgãos */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#8B949E] uppercase ml-1">Órgãos Incluídos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(downloadOrgans).map(([key, value]) => (
                      <label key={key} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all group ${value ? 'bg-[#B8860B]/10 border-[#B8860B]/30' : 'bg-[#0D1117] border-[#30363D]'}`}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => setDownloadOrgans(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${value ? 'bg-[#B8860B] border-[#B8860B]' : 'bg-[#161B22] border-[#30363D]'}`}>
                          {value && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${value ? 'text-[#B8860B]' : 'text-[#8B949E]'}`}>
                          {key === 'serasa' ? 'Serasa' :
                            key === 'boaVista' ? 'Boa Vista' :
                              key === 'spc' ? 'SPC' :
                                key === 'cenprotNacional' ? 'Cenprot Nacional' : 'Cenprot SP'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[#30363D]">
                <button
                  onClick={() => {
                    if (modalMode === 'export') {
                      handleBatchDownload();
                    } else {
                      handleBatchSystemUpdate();
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full ${modalMode === 'export' ? 'bg-[#B8860B]' : 'bg-green-600'} hover:opacity-90 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                >
                  {modalMode === 'export' ? (
                    <>
                      <TrendingUp size={18} className="rotate-90" />
                      Gerar Planilha
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      {isLoading ? 'Processando...' : 'Confirmar Baixa'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Batch Details Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 relative max-h-[90vh] flex flex-col">
              <button onClick={() => setSelectedBatch(null)} className="absolute top-6 right-6 text-[#8B949E] hover:text-white">
                <AlertCircle className="rotate-45" size={24} />
              </button>

              <div className="mb-6 flex items-center gap-3 border-b border-[#30363D] pb-6">
                <div className="p-3 rounded-2xl bg-[#B8860B]/10 text-[#B8860B]">
                  <ListChecks size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Detalhes do Lote</h3>
                  <p className="text-sm font-bold text-[#8B949E] uppercase tracking-widest">{selectedBatch.batchId} • {selectedBatch.members.length} MEMBROS</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363D] pr-2 space-y-2">
                {selectedBatch.members.map((m: any) => (
                  <div key={m.id} className="p-4 bg-[#0D1117] rounded-2xl border border-[#30363D] flex justify-between items-center group hover:border-[#B8860B]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#161B22] flex items-center justify-center text-[#8B949E] font-bold text-xs ring-2 ring-[#30363D]">
                        {m.clientName ? m.clientName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase">{m.clientName || 'Cliente sem nome'}</p>
                        <p className="text-[10px] text-[#8B949E] font-medium tracking-wider">{m.clientDocument}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyClientLink(m.id, m.clientDocument || '')}
                      className="p-2 rounded-xl bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-[#B8860B] hover:bg-[#B8860B]/10 transition-all"
                      title="Copiar Link"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {groupedItems.map((item: any) => {
            const isBatch = item.isBatch;
            const displayId = isBatch ? item.batchId : item.id;
            const displayName = isBatch ? `LOTE DE ${item.members.length} CPFS` : (item.clientName || 'Cliente sem nome');
            const overallProgress = item.overallProgress;
            const organs = isBatch ? item.organs : item.organs;
            const startDate = isBatch ? item.representative.startDate : item.startDate;

            return (
              <div key={displayId} className={`bg-[#161B22] border rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl relative group transition-all ${isBatch ? 'border-[#B8860B]/40 bg-gradient-to-br from-[#161B22] to-[#1c180d]' : 'border-[#30363D] hover:border-[#B8860B]/30'}`}>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.2em]">{isBatch ? 'Identificador Lote' : 'Protocolo ID'}</span>
                    <h4 className="text-4xl font-black text-white tracking-tighter mb-1">
                      {isBatch ? displayId : `#${displayId.split('-')[1]}`}
                    </h4>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{displayName}</p>
                    {isBatch && (
                      <button
                        onClick={() => setSelectedBatch(item)}
                        className="mt-2 text-[10px] font-black text-[#B8860B] hover:text-[#9a7009] uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <ListChecks size={14} />
                        Ver CPFs do Lote
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isBatch && (
                      <button
                        onClick={() => copyClientLink(item.id, item.clientDocument || '')}
                        className="p-3 rounded-2xl bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#B8860B] hover:border-[#B8860B]/30 transition-all"
                        title="Copiar Link do Cliente"
                      >
                        <Share2 size={20} />
                      </button>
                    )}
                    {(currentUser.role === 'admin' || (currentUser.role === 'reseller' && item.resellerId === currentUser.id)) && !isBatch && (
                      <button
                        onClick={() => handleDeleteList(item.id)}
                        className="p-3 rounded-2xl bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-red-500 hover:border-red-500/30 transition-all"
                        title="Excluir Cliente"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
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
                  <OrganProgressBar
                    disabled={!hasControlAccess}
                    active={item.organs.serasa}
                    label="Serasa"
                    progress={calculateOrganProgress(startDate, item.organs.serasa, 0)}
                    onClick={() => isBatch ? toggleBatchOrgan(displayId, 'serasa') : toggleOrgan(displayId, 'serasa')}
                  />
                  <OrganProgressBar
                    disabled={!hasControlAccess}
                    active={item.organs.boaVista}
                    label="Boa Vista"
                    progress={calculateOrganProgress(startDate, item.organs.boaVista, 1)}
                    onClick={() => isBatch ? toggleBatchOrgan(displayId, 'boaVista') : toggleOrgan(displayId, 'boaVista')}
                  />
                  <OrganProgressBar
                    disabled={!hasControlAccess}
                    active={item.organs.spc}
                    label="SPC"
                    progress={calculateOrganProgress(startDate, item.organs.spc, 2)}
                    onClick={() => isBatch ? toggleBatchOrgan(displayId, 'spc') : toggleOrgan(displayId, 'spc')}
                  />
                  <OrganProgressBar
                    disabled={!hasControlAccess}
                    active={item.organs.cenprotNacional}
                    label="Cenprot Nac."
                    progress={calculateOrganProgress(startDate, item.organs.cenprotNacional, 3)}
                    onClick={() => isBatch ? toggleBatchOrgan(displayId, 'cenprotNacional') : toggleOrgan(displayId, 'cenprotNacional')}
                  />
                  <OrganProgressBar
                    disabled={!hasControlAccess}
                    active={item.organs.cenprotSP}
                    label="Cenprot SP"
                    progress={calculateOrganProgress(startDate, item.organs.cenprotSP, 4)}
                    onClick={() => isBatch ? toggleBatchOrgan(displayId, 'cenprotSP') : toggleOrgan(displayId, 'cenprotSP')}
                  />
                </div>

                <div className="pt-4 border-t border-[#30363D]/50 space-y-4">
                  {!isBatch && (
                    <div className="flex items-center gap-4 p-4 bg-[#0D1117] rounded-2xl border border-[#30363D]">
                      <div className="w-10 h-10 rounded-xl bg-[#161B22] flex items-center justify-center text-[#B8860B]">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#484F58] uppercase">Documento do Cliente</p>
                        <p className="text-sm font-bold text-white/90">{item.clientDocument}</p>
                      </div>
                    </div>
                  )}

                  {hasControlAccess && overallProgress < 100 && (
                    <button
                      onClick={() => isBatch ? confirmBatchCompletion(displayId) : confirmCompletion(displayId)}
                      className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#B8860B]/20 flex items-center justify-center gap-3 group/btn"
                    >
                      <UserCheck size={24} className="group-hover/btn:scale-110 transition-transform" />
                      {isBatch ? 'BAIXAR TODOS ÓRGÃOS (LOTE)' : 'Confirmar Baixa Total'}
                    </button>
                  )}

                  {overallProgress === 100 && (
                    <div className="w-full py-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-center flex items-center justify-center gap-3">
                      <ShieldCheck size={24} /> {isBatch ? 'Lote Finalizado com Sucesso' : 'Processo Finalizado com Sucesso'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {groupedItems.length === 0 && (
            <div className="col-span-full py-32 bg-[#161B22] border-2 border-[#B8860B]/30 border-dashed rounded-[3rem] text-center space-y-4">
              <AlertCircle size={64} className="mx-auto text-[#B8860B]" />
              <p className="text-xl font-bold text-white">Nenhum protocolo encontrado</p>
              <p className="text-sm text-gray-300">Clique em "Novo Protocolo" para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListManager;
