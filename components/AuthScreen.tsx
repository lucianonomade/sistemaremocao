
import React, { useState, useEffect } from 'react';
import { TrendingUp, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
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
    document: '',
    parentId: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'client') {
      setAuthType('client');
      const cpf = params.get('cpf');
      if (cpf) setFormData(prev => ({ ...prev, document: cpf }));
    } else {
      const ref = params.get('ref');
      if (ref) {
        setAuthType('register');
        setFormData(prev => ({ ...prev, parentId: ref }));
      }
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
          whatsapp: data.profile.whatsapp,
          expiryDate: data.profile.expiry_date, // Mapeamento crucial para o banner funcionar
          planId: data.profile.plan_id         // Mapeamento crucial para a lógica de trial
        };
        onLogin(user);
      } else {
        alert('Cadastro realizado com sucesso! Seu acesso já está liberado. Faça login para começar seu Teste Grátis.');
        setAuthType('login');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-[#F3F4F6] dark:bg-[#0A0A0C] text-gray-800 dark:text-gray-100 font-sans min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-5 [mask-image:linear-gradient(to_bottom,transparent,10%,white,90%,transparent)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D99000]/5 dark:bg-[#D99000]/10 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 w-full items-center">
          <div className="lg:col-span-7 flex flex-col space-y-12 lg:pr-12 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#D99000] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D99000]/20">
                <TrendingUp className="text-white text-4xl" size={32} />
              </div>
              <div className="flex flex-col">
                <h1 className="font-['Outfit'] font-extrabold text-4xl tracking-tight text-gray-900 dark:text-white leading-none">
                  Central
                </h1>
                <span className="font-['Outfit'] font-bold text-[#D99000] tracking-[0.3em] text-sm uppercase mt-1">
                  Remoção
                </span>
              </div>
            </div>

            <div className="space-y-8 pl-2">
              <div className="flex gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:border-[#D99000]/50 transition-colors">
                  <ShieldCheck className="text-[#D99000] text-2xl" size={24} />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-lg text-gray-900 dark:text-white mb-1">
                    Segurança de Dados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md">
                    Criptografia de ponta a ponta para proteger todas as informações sensíveis.
                  </p>
                </div>
              </div>

              <div className="flex gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:border-[#D99000]/50 transition-colors">
                  <Clock className="text-[#D99000] text-2xl" size={24} />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-lg text-gray-900 dark:text-white mb-1">
                    Atualização Diária
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md">
                    Monitoramento em tempo real da baixa nos órgãos de proteção ao crédito.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div className="bg-white dark:bg-[#16181C] rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D99000] to-transparent opacity-50"></div>

              <div className="text-center mb-10">
                <h2 className="font-['Outfit'] font-bold text-3xl text-gray-900 dark:text-white mb-2">
                  {authType === 'client' ? 'Portal de Acompanhamento' : authType === 'login' ? 'Acesso ao Painel' : 'Criar Conta'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {authType === 'client' ? 'Consulte o status do seu CPF/CNPJ' : 'Entre com suas credenciais de parceiro'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {authType === 'client' ? (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ShieldCheck className="text-gray-400 group-focus-within:text-[#D99000] transition-colors" size={20} />
                    </div>
                    <input
                      required
                      type="text"
                      className="w-full bg-[#Eef2f6] text-gray-900 placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 border-none focus:ring-2 focus:ring-[#D99000]/50 focus:bg-white transition-all font-medium tracking-wide"
                      placeholder="CPF ou CNPJ"
                      value={formData.document}
                      onChange={e => setFormData({ ...formData, document: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    {authType === 'register' && (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserIcon className="text-gray-400 group-focus-within:text-[#D99000] transition-colors" size={20} />
                        </div>
                        <input
                          required
                          type="text"
                          className="w-full bg-[#Eef2f6] text-gray-900 placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 border-none focus:ring-2 focus:ring-[#D99000]/50 focus:bg-white transition-all font-medium"
                          placeholder="Nome Completo"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="text-gray-400 group-focus-within:text-[#D99000] transition-colors" size={20} />
                      </div>
                      <input
                        required
                        type="email"
                        className="w-full bg-[#Eef2f6] text-gray-900 placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 border-none focus:ring-2 focus:ring-[#D99000]/50 focus:bg-white transition-all font-medium"
                        placeholder="admin@admin.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="text-gray-400 group-focus-within:text-[#D99000] transition-colors" size={20} />
                      </div>
                      <input
                        required
                        type="password"
                        className="w-full bg-[#Eef2f6] text-gray-900 placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 border-none focus:ring-2 focus:ring-[#D99000]/50 focus:bg-white transition-all font-medium tracking-widest"
                        placeholder="•••••••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      {authType === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthType('register')}
                          className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-[#D99000] tracking-wider uppercase transition-colors"
                        >
                          Não tem conta? Cadastre-se
                        </button>
                      )}
                      {authType === 'register' && (
                        <button
                          type="button"
                          onClick={() => setAuthType('login')}
                          className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-[#D99000] tracking-wider uppercase transition-colors"
                        >
                          Já tem conta? Faça Login
                        </button>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="group w-full bg-gradient-to-r from-[#D99000] to-yellow-600 hover:to-yellow-500 text-white font-['Outfit'] font-bold text-sm tracking-widest py-4 rounded-xl shadow-lg shadow-[#D99000]/25 hover:shadow-[#D99000]/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 uppercase"
                >
                  {authType === 'client' ? 'Consultar' : authType === 'login' ? 'Acessar Painel' : 'Criar Conta'}
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthScreen;

