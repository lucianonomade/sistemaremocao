
import React, { useState, useRef } from 'react';
import { Wallet, Copy, CheckCircle2, QrCode, ExternalLink, ShieldCheck, Settings, Upload, Save, Link as LinkIcon, CreditCard, Landmark, Key, Download, FileText, Calculator, DollarSign, X, Loader2, User as UserIcon, Fingerprint, Smartphone } from 'lucide-react';
import { User, Transaction, Reseller, CommissionPayout, Plan } from '../types';

interface FinanceProps {
  currentUser: User;
  platformSettings: any;
  setPlatformSettings: React.Dispatch<React.SetStateAction<any>>;
  activeTab: string;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  resellers: Reseller[];
  setResellers: React.Dispatch<React.SetStateAction<Reseller[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Finance: React.FC<FinanceProps> = ({
  currentUser,
  platformSettings,
  setPlatformSettings,
  activeTab,
  transactions,
  resellers,
  setCurrentUser
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [copied, setCopied] = useState(false);
  const [resellerPixKey, setResellerPixKey] = useState(currentUser.pixKey || '');

  // Commissions State
  const [subTab, setSubTab] = useState<'settings' | 'commissions'>('settings');
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any[]>([]);
  const [payoutForm, setPayoutForm] = useState({ resellerId: '', amount: '', period: '', receiptBase64: '' });
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Asaas Deposit State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositValue, setDepositValue] = useState('');
  const [pixData, setPixData] = useState<{ encodedImage: string, payload: string, paymentId: string } | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);

  // Plans Integration
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  React.useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => setAvailablePlans(Array.isArray(data) ? data : []))
      .catch(err => console.error('Erro ao buscar planos:', err));
  }, []);

  const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPlanId(pId);
    if (pId) {
      const plan = availablePlans.find(p => p.id === pId);
      if (plan) setDepositValue(plan.price.toString());
    }
  };

  React.useEffect(() => {
    if (subTab === 'commissions') {
      fetchPayouts();
      if (isAdmin) fetchCommissionSummary();
    }
  }, [subTab]);

  const fetchCommissionSummary = async () => {
    try {
      const res = await fetch('/api/commissions-summary');
      if (res.ok) setCommissionSummary(await res.json());
    } catch (error) {
      console.error('Error fetching summary', error);
    }
  };

  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const url = isAdmin ? '/api/commission-payouts' : `/api/commission-payouts?resellerId=${currentUser.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      }
    } catch (error) {
      console.error('Error fetching payouts', error);
    } finally {
      setLoadingPayouts(false);
    }
  };



  const handleGeneratePix = async () => {
    if (!depositValue || parseFloat(depositValue) <= 0) return;
    setLoadingPix(true);
    try {
      const res = await fetch('/api/asaas/create-pix-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: parseFloat(depositValue),
          type: selectedPlanId ? 'plan' : 'deposit'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        alert('Erro ao gerar PIX: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro na comunicação com servidor.');
    } finally {
      setLoadingPix(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const handleRenewPix = async (price?: number) => {
    // Validate Document (CPF/CNPJ)
    const doc = currentUser.document?.replace(/\D/g, '') || '';
    if (doc.length !== 11 && doc.length !== 14) {
      alert('⚠️ Atenção: Para gerar o PIX, você precisa preencher um CPF ou CNPJ válido no painel "Meus Dados".');
      return;
    }

    setLoadingPix(true);
    try {
      // 1. AUTO-SAVE PROFILE (Best Effort - Non-Blocking)
      try {
        await fetch(`/api/resellers/${currentUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentUser.name,
            document: currentUser.document,
            whatsapp: currentUser.whatsapp,
            pixKey: resellerPixKey
          })
        });
      } catch (saveErr) {
        console.warn('Auto-save failed, proceeding with direct data:', saveErr);
      }

      // 2. GENERATE PIX
      // Use passed price OR fallback to 29.90
      const amount = price || 29.90;
      const res = await fetch('/api/asaas/create-pix-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount,
          type: 'plan',
          customerData: {
            name: currentUser.name,
            document: currentUser.document,
            whatsapp: currentUser.whatsapp
          }
        })
      });
      const data = await res.json();

      if (data.success) {
        setPixData({ ...data, isRenewal: true });
        setShowDepositModal(true);

        // Start Polling
        const pollInterval = setInterval(async () => {
          try {
            const check = await fetch(`/api/asaas/check-payment/${data.paymentId}`);
            const status = await check.json();
            if (status.status === 'paid') {
              clearInterval(pollInterval);
              alert('✅ Pagamento Confirmado! Seu plano foi renovado com sucesso.');
              window.location.reload();
            }
          } catch (e) { }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);

      } else {
        alert('❌ Erro ao gerar PIX: ' + (data.error || 'Erro desconhecido. Verifique seus dados.'));
      }
    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setLoadingPix(false);
    }
  };

  const handlePayoutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPayoutForm({ ...payoutForm, receiptBase64: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handlePayoutSubmit = async () => {
    if (!payoutForm.resellerId || !payoutForm.amount || !payoutForm.period) {
      alert('Preencha todos os campos!');
      return;
    }
    try {
      const res = await fetch('/api/commission-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutForm)
      });
      if (res.ok) {
        alert('Pagamento registrado!');
        setPayoutForm({ resellerId: '', amount: '', period: '', receiptBase64: '' });
        fetchPayouts();
      } else {
        alert('Erro ao registrar pagamento.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    }
  };

  const handleCopyPix = () => {
    setCopied(true);
    navigator.clipboard.writeText(platformSettings.pixKey);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResellerPixSave = async () => {
    try {
      const response = await fetch(`/api/resellers/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixKey: resellerPixKey })
      });

      if (!response.ok) throw new Error('Erro ao salvar Pix');

      setCurrentUser((prev: any) => prev ? { ...prev, pixKey: resellerPixKey } : null);
      alert('Chave PIX atualizada com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };



  if (activeTab === 'finance-deposits') {
    return (
      <div className="space-y-10 animate-in max-w-4xl mx-auto pb-20">

        {/* Header / Balance Card */}
        <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#30363D] p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-[#8B949E] text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Wallet size={14} className="text-[#B8860B]" />
                Saldo Disponível
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-[#8B949E] mt-1">R$</span>
                <span className="text-5xl md:text-6xl font-black text-white tracking-tighter filter drop-shadow-md">
                  {Number(currentUser.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* REMOVED: Deposit Button */}
          </div>

          {/* REMOVED: Statement Tab Navigation */}
        </div>

        {/* Sub-Navigation for Finance Deposits Section */}
        <div className="flex justify-center gap-4">
          {/* Button hidden for Admin */}
          {!isAdmin && (
            <button
              onClick={() => setSubTab('settings')}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${subTab === 'settings' ? 'bg-[#B8860B] text-white' : 'bg-[#161B22] text-[#8B949E] border border-[#30363D]'}`}
            >
              Meus Dados
            </button>
          )}
          {/* Commissions Logic: Default for Admin */}
          <button
            onClick={() => setSubTab('commissions')}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${subTab === 'commissions' || isAdmin ? 'bg-[#B8860B] text-white' : 'bg-[#161B22] text-[#8B949E] border border-[#30363D]'}`}
          >
            {isAdmin ? 'Gestão de Comissões' : 'Meus Comprovantes'}
          </button>
        </div>
        {(subTab === 'commissions' || isAdmin) && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
            {isAdmin && (
              <>
                {/* Commission Summary Dashboard */}
                <div className="bg-[#161B22] border border-[#30363D] p-8 rounded-[3rem] shadow-2xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center text-[#B8860B]"><Calculator size={28} /></div>
                    <div><h3 className="text-xl font-black text-white uppercase">Cálculo Automático</h3><p className="text-xs text-[#8B949E]">Comissões calculadas com base nas vendas confirmadas.</p></div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-[#30363D]">
                    <table className="w-full text-left">
                      <thead className="bg-[#0D1117]/50 border-b border-[#30363D]">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase">Revendedor</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Vendas Totais</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Taxa (%)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Com. Total</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Já Pago</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Pendente</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363D]">
                        {commissionSummary.map(item => (
                          <tr key={item.resellerId} className="hover:bg-white/[0.02]">
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-white">{item.name}</p>
                              <p className="text-[10px] text-[#484F58]">{item.email}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-white">R$ {item.totalSales.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-[#B8860B]">{item.commissionRate}%</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-white">R$ {item.commissionTotal.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-green-500">R$ {item.totalPaid.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-xs font-black ${item.pending > 0 ? 'text-red-500' : 'text-[#484F58]'}`}>R$ {item.pending.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {item.pending > 0 && (
                                <button
                                  onClick={() => {
                                    setPayoutForm(prev => ({ ...prev, resellerId: item.resellerId, amount: item.pending.toFixed(2) }));
                                    // Optional: smooth scroll to form
                                    document.getElementById('payout-form')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="bg-[#B8860B]/10 hover:bg-[#B8860B] text-[#B8860B] hover:text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
                                >
                                  Pagar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {commissionSummary.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-[#484F58] font-bold">Nenhum dado encontrado.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="payout-form" className="bg-[#161B22] border border-[#30363D] p-10 rounded-[3rem] shadow-2xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center text-[#B8860B]"><DollarSign size={28} /></div>
                    <div><h3 className="text-xl font-black text-white uppercase">Registrar Pagamento</h3><p className="text-xs text-[#8B949E]">Anexe o comprovante de comissão.</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2">Revendedor</label>
                      <select
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-[#B8860B] outline-none"
                        value={payoutForm.resellerId}
                        onChange={e => setPayoutForm({ ...payoutForm, resellerId: e.target.value })}
                      >
                        <option value="">Selecione o Revendedor...</option>
                        {resellers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2">Período (Mês/Ano)</label>
                      <input
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-[#B8860B] outline-none"
                        placeholder="Ex: 10/2023"
                        value={payoutForm.period}
                        onChange={e => setPayoutForm({ ...payoutForm, period: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2">Valor (R$)</label>
                      <input
                        type="number"
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-[#B8860B] outline-none"
                        placeholder="0.00"
                        value={payoutForm.amount}
                        onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2">Comprovante</label>
                      <label className="flex items-center gap-3 w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 cursor-pointer hover:border-[#B8860B] transition-colors">
                        <input type="file" className="hidden" onChange={handlePayoutFileChange} accept="image/*,application/pdf" />
                        <FileText size={16} className="text-[#B8860B]" />
                        <span className="text-xs font-bold text-[#8B949E]">{payoutForm.receiptBase64 ? 'Arquivo Selecionado' : 'Carregar Arquivo...'}</span>
                      </label>
                    </div>
                  </div>
                  <button onClick={handlePayoutSubmit} className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">Registrar Comissão</button>
                </div>
              </>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-black text-white uppercase ml-4">Histórico de Pagamentos</h3>
              <div className="bg-[#161B22] border border-[#30363D] rounded-[2rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#0D1117]/50 border-b border-[#30363D]">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase">Data / Período</th>
                      {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase">Revendedor</th>}
                      <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-right">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8B949E] uppercase text-center">Comprovante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D]">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-white">{new Date(p.paidAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-[#B8860B] font-bold">{p.period}</p>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white">{resellers.find(r => r.id === p.resellerId)?.name || '...'}</p>
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <span className="text-green-500 font-bold text-xs">R$ {p.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.receiptBase64 ? (
                            <a href={p.receiptBase64} download={`comprovante_${p.period}.png`} className="inline-flex items-center gap-2 text-[10px] font-black text-[#B8860B] uppercase hover:underline">
                              <Download size={14} /> Baixar
                            </a>
                          ) : <span className="text-[#484F58] text-[10px]">-</span>}
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-xs text-[#484F58] font-bold uppercase">Nenhum pagamento encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Master Configuration Area Removed */}

        {/* Reseller Payment View */}
        {(!isAdmin && subTab === 'settings') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* My Receive Settings - ADDED */}
            <div className="bg-[#161B22] border border-[#30363D] p-10 rounded-[3rem] shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center text-[#B8860B]"><Settings size={28} /></div>
                <div><h3 className="text-xl font-black text-white uppercase tracking-tighter">Meus Dados</h3><p className="text-xs text-[#8B949E]">Mantenha seu perfil atualizado para receber pagamentos.</p></div>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Nome Completo</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58]" />
                    <input
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]"
                      value={currentUser.name}
                      onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                      placeholder="Seu Nome..."
                    />
                  </div>
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">CPF / CNPJ (Apenas Números)</label>
                  <div className="relative">
                    <Fingerprint size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58]" />
                    <input
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]"
                      value={currentUser.document || ''}
                      onChange={e => {
                        console.log('CPF digitado:', e.target.value);
                        console.log('currentUser antes:', currentUser.document);
                        setCurrentUser({ ...currentUser, document: e.target.value });
                        console.log('currentUser depois:', { ...currentUser, document: e.target.value }.document);
                      }}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <p className="text-[10px] text-[#B8860B] italic ml-2">* Obrigatório para gerar pagamentos/renovações.</p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">WhatsApp</label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58]" />
                    <input
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]"
                      value={currentUser.whatsapp || ''}
                      onChange={e => setCurrentUser({ ...currentUser, whatsapp: e.target.value })}
                      placeholder="55..."
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#30363D]">
                  <label className="text-[10px] font-black text-[#8B949E] uppercase ml-1 tracking-widest">Minha Chave PIX (Para Receber)</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58]" />
                    <input className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:border-[#B8860B] outline-none transition-all placeholder:text-[#30363D]" value={resellerPixKey} onChange={e => setResellerPixKey(e.target.value)} placeholder="Sua Chave PIX..." />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      console.log('=== INICIANDO SALVAMENTO ===');
                      console.log('currentUser.id:', currentUser.id);
                      console.log('currentUser.document:', currentUser.document);
                      console.log('currentUser.name:', currentUser.name);
                      console.log('currentUser.whatsapp:', currentUser.whatsapp);

                      const payload = {
                        name: currentUser.name,
                        document: currentUser.document,
                        whatsapp: currentUser.whatsapp,
                        pixKey: resellerPixKey
                      };
                      console.log('Payload sendo enviado:', JSON.stringify(payload, null, 2));

                      // Save Profile Data
                      const res = await fetch(`/api/resellers/${currentUser.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      });

                      console.log('Response status:', res.status);

                      if (!res.ok) {
                        const errorData = await res.json();
                        console.error('Erro do servidor:', errorData);
                        throw new Error('Erro ao salvar');
                      }

                      const updated = await res.json();
                      console.log('Dados retornados do servidor:', JSON.stringify(updated, null, 2));

                      // FORCE MERGE: Use returned data but fallback/overwrite with payload to ensure UI consistency
                      setCurrentUser(prev => ({
                        ...prev,
                        ...updated,
                        ...payload,
                        // Ensure document is not lost
                        document: payload.document || updated.document || prev.document
                      }));

                      console.log('Estado atualizado com sucesso (Merged)');
                      alert('Dados atualizados com sucesso!');
                    } catch (e) {
                      console.error('ERRO NO SALVAMENTO:', e);
                      alert('Erro ao atualizar perfil.');
                    }
                  }}
                  className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Save size={18} /> Salvar Meus Dados
                </button>
              </div>
            </div>

            {/* SECTION: PLAN & SUBSCRIPTION */}
            <div className="bg-[#161B22] border border-[#30363D] p-10 rounded-[3rem] shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center text-[#B8860B]"><ShieldCheck size={28} /></div>
                <div><h3 className="text-xl font-black text-white uppercase tracking-tighter">Minha Assinatura</h3><p className="text-xs text-[#8B949E]">Gerencie seu plano de revenda.</p></div>
              </div>

              <div className="bg-[#0D1117] border border-[#30363D] rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[#30363D]">
                  <span className="text-xs font-bold text-[#8B949E] uppercase">Plano Atual</span>
                  <span className="text-sm font-black text-white uppercase">{currentUser.plan || 'Gratuito'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[#30363D]">
                  <span className="text-xs font-bold text-[#8B949E] uppercase">Status</span>
                  {(() => {
                    const hasExpiry = currentUser.expiryDate && !isNaN(new Date(currentUser.expiryDate).getTime());
                    const isExpired = !hasExpiry || new Date(currentUser.expiryDate!).getTime() < new Date().getTime();
                    const isPaidPlan = !!currentUser.planId;

                    // Determine Status Label and Color
                    let statusLabel = 'Pendente / Vencido';
                    let statusColor = 'bg-red-500/10 text-red-500';

                    if (!isExpired && isPaidPlan && currentUser.status === 'active') {
                      statusLabel = 'Ativo';
                      statusColor = 'bg-green-500/10 text-green-500';
                    } else if (!isExpired && !isPaidPlan) {
                      statusLabel = 'Em Período de Teste';
                      statusColor = 'bg-[#B8860B]/10 text-[#B8860B]';
                    }

                    return (
                      <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${statusColor}`}>
                        {statusLabel}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#8B949E] uppercase">Vencimento</span>
                  <span className="text-sm font-black text-white">
                    {currentUser.expiryDate ? new Date(currentUser.expiryDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-[#484F58] font-bold uppercase text-center">Precisa renovar ou fazer um upgrade?</p>
                {(() => {
                  // Find the "Mensal" plan or the first available plan to use as default price
                  const defaultPlan = availablePlans.find(p => p.name.toLowerCase().includes('mensal')) || availablePlans[0];
                  const renewalPrice = defaultPlan ? defaultPlan.price : 29.90; // Fallback to 29.90 only if no plans exist

                  return (
                    <button
                      onClick={() => handleRenewPix(renewalPrice)} // Pass dynamic price
                      disabled={loadingPix}
                      className="w-full bg-[#161B22] border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {loadingPix ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={18} />}
                      {loadingPix ? 'Gerando PIX...' : `Gerar PIX de Renovação (R$ ${renewalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                    </button>
                  );
                })()}
              </div>
            </div>




          </div>

        )}

        {/* Deposit Modal (Added for Reseller Scope) */}
        {
          showDepositModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#161B22] border border-[#30363D] w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in-50 duration-200">
                <button
                  onClick={() => { setShowDepositModal(false); setPixData(null); setDepositValue(''); setSelectedPlanId(''); }}
                  className="absolute top-6 right-6 text-[#8B949E] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center space-y-2 mb-8">
                  <div className="w-16 h-16 bg-[#B8860B]/20 rounded-2xl flex items-center justify-center text-[#B8860B] mx-auto mb-4">
                    <QrCode size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Recarga via PIX</h3>
                  <p className="text-[#8B949E] text-sm">Adicione saldo instantaneamente.</p>
                </div>

                {!pixData ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2 mb-2 block">Selecione um Plano (Opcional)</label>
                      <select
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-[#B8860B] outline-none mb-4"
                        value={selectedPlanId}
                        onChange={handlePlanSelect}
                      >
                        <option value="">-- Inserir Valor Manualmente --</option>
                        {availablePlans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      </select>

                      <label className="text-[10px] uppercase font-black text-[#8B949E] ml-2 mb-2 block">Valor da Recarga (R$)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B949E] font-bold">R$</span>
                        <input
                          type="number"
                          value={depositValue}
                          onChange={(e) => setDepositValue(e.target.value)}
                          className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-12 py-4 text-white font-bold outline-none focus:border-[#B8860B] transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGeneratePix}
                      disabled={loadingPix || !depositValue}
                      className="w-full bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                      {loadingPix ? <Loader2 className="animate-spin" size={16} /> : 'Gerar PIX Copia e Cola'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom-5">
                    <div className="bg-white p-4 rounded-2xl w-fit mx-auto">
                      <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code PIX" className="w-48 h-48" />
                    </div>
                    <div className="bg-[#0D1117] p-4 rounded-xl border border-[#30363D] flex items-center justify-between gap-4">
                      <div className="truncate text-[10px] text-[#8B949E] font-mono select-all">
                        {pixData.payload}
                      </div>
                      <button
                        onClick={() => copyToClipboard(pixData.payload)}
                        className="text-[#B8860B] hover:text-white transition-colors flex-shrink-0"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-center text-xs text-[#8B949E] px-4">
                      Após o pagamento, o saldo será liberado automaticamente em alguns instantes.
                    </p>
                    <button
                      onClick={() => { setShowDepositModal(false); setPixData(null); setDepositValue(''); }}
                      className="w-full bg-[#30363D] hover:bg-[#404751] text-white py-4 rounded-xl font-bold text-xs uppercase"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </div >
    );
  }

  return null;
};

export default Finance;
