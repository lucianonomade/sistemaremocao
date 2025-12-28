
import React, { useState, useRef } from 'react';
import { UserPlus, FileUp, Upload, CheckCircle2, AlertCircle, X, FileText, FileSpreadsheet } from 'lucide-react';

interface NewClientFormProps {
  onAddClient: (name: string, doc: string) => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onAddClient }) => {
  const [method, setMethod] = useState<'manual' | 'batch'>('manual');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    document: ''
  });

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false);
      onAddClient(formData.name, formData.document);
      alert('Processo iniciado com sucesso para ' + formData.name);
      setFormData({ name: '', document: '' });
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmitBatch = () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    // Simulate parsing and uploading
    setTimeout(() => {
      setIsUploading(false);
      // Simulate adding a list for batch
      onAddClient("Importação em Lote", "LOTE-" + Math.floor(Math.random() * 1000));
      alert(`Processamento do arquivo ${uploadedFile.name} concluído. Listas criadas para os clientes importados.`);
      setUploadedFile(null);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white">Adicionar Novos Clientes</h2>
        <p className="text-[#8B949E]">Cada entrada gera um novo ciclo de remoção de 90 dias.</p>
      </div>

      <div className="flex p-1 bg-[#161B22] border border-[#30363D] rounded-2xl w-full max-w-sm mx-auto">
        <button 
          onClick={() => setMethod('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${method === 'manual' ? 'bg-[#B8860B] text-white shadow-lg shadow-[#B8860B]/20' : 'text-[#8B949E] hover:text-white'}`}
        >
          <UserPlus size={18} /> Manual
        </button>
        <button 
          onClick={() => setMethod('batch')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${method === 'batch' ? 'bg-[#B8860B] text-white shadow-lg shadow-[#B8860B]/20' : 'text-[#8B949E] hover:text-white'}`}
        >
          <FileUp size={18} /> Lote (PDF/Excel)
        </button>
      </div>

      <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {isUploading && (
          <div className="absolute inset-0 z-50 bg-[#161B22]/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-[#B8860B] animate-pulse">Criando novos processos...</p>
          </div>
        )}

        {method === 'manual' ? (
          <form onSubmit={handleSubmitManual} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#8B949E] uppercase mb-2">Nome Completo</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Carlos Oliveira"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-6 py-4 focus:border-[#B8860B] focus:outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8B949E] uppercase mb-2">CPF ou CNPJ</label>
              <input 
                required
                type="text" 
                placeholder="000.000.000-00"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl px-6 py-4 focus:border-[#B8860B] focus:outline-none transition-all"
                value={formData.document}
                onChange={e => setFormData({...formData, document: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-sm">
              <AlertCircle size={20} />
              Um novo ID de Lista será gerado para este cliente com ciclo inicial de 90 dias.
            </div>
            <div className="pt-4">
              <button className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-[#B8860B]/20 transition-all flex items-center justify-center gap-3">
                <CheckCircle2 /> Iniciar Nova Lista
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8 text-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer group
                ${uploadedFile ? 'border-green-500/50 bg-green-500/5' : 'border-[#30363D] hover:border-[#B8860B]/50 hover:bg-[#B8860B]/5'}
              `}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".pdf,.xls,.xlsx"
                onChange={handleFileUpload}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${uploadedFile ? 'bg-green-500/20 text-green-500' : 'bg-[#30363D] text-[#8B949E] group-hover:scale-110 group-hover:text-[#B8860B]'}`}>
                  {uploadedFile ? <CheckCircle2 size={40} /> : <Upload size={40} />}
                </div>
                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-white font-bold">{uploadedFile.name}</p>
                    <p className="text-xs text-[#8B949E]">Arquivo pronto para processamento individualizado.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-white font-bold">Clique ou arraste seu arquivo</p>
                    <p className="text-sm text-[#8B949E]">PDF ou Planilhas (Excel)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={!uploadedFile}
                onClick={handleSubmitBatch}
                className={`
                  w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                  ${uploadedFile ? 'bg-[#B8860B] hover:bg-[#9a7009] text-white shadow-xl shadow-[#B8860B]/20' : 'bg-[#30363D] text-[#484F58] cursor-not-allowed'}
                `}
              >
                <Upload size={24} /> Processar Importação em Lote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewClientForm;
