
import React, { useState, useEffect } from 'react';
import { TrendingUp, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Clock, Shield, ChevronRight, Zap } from 'lucide-react';
import { User, Reseller, CreditList } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  resellers: Reseller[];
  lists: CreditList[];
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, resellers, lists }) => {
  const [authType, setAuthType] = useState<'login' | 'register' | 'client'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    document: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'client') {
      setAuthType('client');
      const cpf = params.get('cpf');
      if (cpf) setFormData(prev => ({ ...prev, document: cpf }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authType === 'client') {
      if (formData.document) {
        const cleanDoc = formData.document.replace(/\D/g, '');

        try {
          const response = await fetch(`/api/lists?role=client&doc=${cleanDoc}`);
          const clientLists = await response.json();
          const clientList = clientLists[0];

          if (clientList || cleanDoc === '12345678900') {
            onLogin({
              id: `cli-${cleanDoc}`,
              name: 'Seu Processo Ativo',
              document: formData.document,
              role: 'client',
              status: 'active',
              resellerId: clientList?.resellerId || '1'
            });
          } else {
            alert('Este CPF/CNPJ não foi encontrado. Entre em contato com seu consultor.');
          }
        } catch (error) {
          alert('Erro ao consultar documento. Tente novamente mais tarde.');
        }
      }
      return;
    }

    try {
      const endpoint = authType === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      if (authType === 'login') {
        console.log('Resposta do servidor:', data);
        if (!data.profile) {
          throw new Error(`Perfil não encontrado para o ID: ${data.user.id}. Verifique se o registro foi concluído.`);
        }
        const user: User = {
          id: data.user.id,
          name: data.profile.name || 'Usuário',
          email: data.user.email,
          role: data.profile.role,
          status: data.profile.status,
          resellerId: data.profile.id,
          document: data.profile.document,
          whatsapp: data.profile.whatsapp
        };
        onLogin(user);
      } else {
        alert('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
        // No registro, não tentamos logar automaticamente para evitar erro de profile inexistente
        setAuthType('login');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Funções de Teste Rápido
  const loginAsAdmin = () => {
    onLogin({ id: 'admin-1', name: 'Admin Master', role: 'admin', status: 'active' });
  };

  const loginAsReseller = () => {
    const reseller = resellers[0];
    onLogin({
      id: `res-${reseller.id}`,
      name: reseller.name,
      email: reseller.email,
      role: 'reseller',
      status: 'active',
      resellerId: reseller.id
    });
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4 selection:bg-[#B8860B]/30">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Lado Esquerdo: Branding e Infos */}
        <div className="hidden md:flex flex-col space-y-8 pr-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#B8860B] flex items-center justify-center shadow-2xl shadow-[#B8860B]/20">
              <TrendingUp size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Central</h1>
              <span className="text-xl font-bold text-[#B8860B] tracking-[0.3em] uppercase">Remoção</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-[#B8860B]" />
              </div>
              <div>
                <h4 className="font-bold text-white">Segurança de Dados</h4>
                <p className="text-sm text-[#8B949E]">Seus dados e processos protegidos por criptografia de ponta.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0">
                <Clock size={20} className="text-[#B8860B]" />
              </div>
              <div>
                <h4 className="font-bold text-white">Atualização Diária</h4>
                <p className="text-sm text-[#8B949E]">Acompanhamento em tempo real da baixa nos órgãos.</p>
              </div>
            </div>
          </div>

          {/* Botões de Atalho para Teste */}
          <div className="pt-8 border-t border-[#30363D] space-y-4">
            <p className="text-[10px] font-black text-[#484F58] uppercase tracking-[0.2em]">Modo Teste Rápido</p>
            <div className="flex gap-3">
              <button onClick={loginAsAdmin} className="flex-1 bg-white/5 border border-white/10 hover:border-[#B8860B]/50 hover:bg-[#B8860B]/10 py-3 rounded-xl text-[10px] font-black uppercase transition-all">
                Acesso Admin
              </button>
              <button onClick={loginAsReseller} className="flex-1 bg-white/5 border border-white/10 hover:border-[#B8860B]/50 hover:bg-[#B8860B]/10 py-3 rounded-xl text-[10px] font-black uppercase transition-all">
                Acesso Revendedor
              </button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulários */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-8 animate-in slide-in-from-right-8 duration-500">

          <div className="flex flex-col items-center md:hidden mb-6">
            <TrendingUp size={48} className="text-[#B8860B] mb-2" />
            <h2 className="text-2xl font-black">Central Remoção</h2>
          </div>

          <div className="flex p-1.5 bg-[#0D1117] border border-[#30363D] rounded-2xl">
            <button
              onClick={() => setAuthType('login')}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${authType !== 'client' ? 'bg-[#B8860B] text-white shadow-lg shadow-[#B8860B]/20' : 'text-[#8B949E]'}`}
            >
              Parceiro
            </button>
            <button
              onClick={() => setAuthType('client')}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${authType === 'client' ? 'bg-[#B8860B] text-white shadow-lg shadow-[#B8860B]/20' : 'text-[#8B949E]'}`}
            >
              Cliente
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black text-white">
                {authType === 'client' ? 'Portal de Acompanhamento' : authType === 'login' ? 'Acesso ao Painel' : 'Novo Cadastro'}
              </h3>
              <p className="text-sm text-[#8B949E] mt-1">
                {authType === 'client' ? 'Consulte o status do seu CPF/CNPJ' : 'Entre com suas credenciais de parceiro'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authType === 'client' ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#B8860B] transition-colors" size={20} />
                    <input
                      required
                      type="text"
                      placeholder="CPF ou CNPJ (apenas números)"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-5 text-sm font-bold focus:border-[#B8860B] outline-none transition-all placeholder:text-[#484F58]"
                      value={formData.document}
                      onChange={e => setFormData({ ...formData, document: e.target.value })}
                    />
                  </div>
                  <div className="p-4 bg-[#B8860B]/5 border border-[#B8860B]/20 rounded-2xl text-center">
                    <p className="text-[10px] text-[#B8860B] font-black uppercase leading-relaxed">
                      Acesso seguro e direto. Não pedimos senha para clientes finais.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {authType === 'register' && (
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#B8860B]" size={20} />
                      <input
                        required
                        type="text"
                        placeholder="Nome Completo"
                        className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#B8860B] outline-none transition-all"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#B8860B]" size={20} />
                    <input
                      required
                      type="email"
                      placeholder="E-mail"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#B8860B] outline-none transition-all"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#B8860B]" size={20} />
                    <input
                      required
                      type="password"
                      placeholder="Senha"
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#B8860B] outline-none transition-all"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  {authType === 'login' && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthType('register')}
                        className="text-[10px] text-[#8B949E] hover:text-[#B8860B] font-bold uppercase ml-1"
                      >
                        Não tem uma conta? Cadastre-se
                      </button>
                    </div>
                  )}
                  {authType === 'register' && (
                    <button
                      type="button"
                      onClick={() => setAuthType('login')}
                      className="text-[10px] text-[#8B949E] hover:text-[#B8860B] font-bold uppercase ml-1"
                    >
                      Já possui conta? Faça Login
                    </button>
                  )}
                </>
              )}

              <button className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-[#B8860B]/20 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                {authType === 'client' ? 'Acompanhar Processo' : authType === 'login' ? 'Entrar no Sistema' : 'Criar minha Conta'}
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Atalhos Mobile */}
            <div className="md:hidden pt-4 border-t border-[#30363D] grid grid-cols-2 gap-2">
              <button onClick={loginAsAdmin} className="bg-white/5 py-2 rounded-xl text-[9px] font-black uppercase text-[#8B949E]">Admin Teste</button>
              <button onClick={loginAsReseller} className="bg-white/5 py-2 rounded-xl text-[9px] font-black uppercase text-[#8B949E]">Revendedor Teste</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
