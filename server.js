
console.log('========================================');
console.log('SERVER.JS CARREGADO - VERSÃO COM LOGS DO PATCH');
console.log('========================================');

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicialização do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILITÁRIOS ---

/**
 * Lógica Central: Calcula o progresso baseado na data de início
 * Regra: 1.11% ao dia, trava em 90%. Manual = 100%.
 */
const calculateRealTimeProgress = (startDateStr, manualConclusion) => {
  if (manualConclusion) return 100;

  const startDate = new Date(startDateStr);
  const now = new Date();

  // Diferença em milissegundos convertida para dias
  const diffTime = Math.abs(now - startDate);
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // Regra de 1.11% ao dia (aproximadamente 100% em 90 dias)
  let progress = Math.floor(diffDays * 1.11);

  // Trava de Segurança em 90%
  if (progress >= 90) return 90;

  return Math.max(0, progress);
};

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Tentativa de login:', email);

  // Tenta login oficial no Supabase Auth primeiro
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.log('Auth oficial falhou, tentando login manual via tabela profiles...');
    // Login Manual (para facilitar testes do user sem convites de email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, plans(*)')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (profileError) {
      console.error('SERVER DEBUG: Login manual falhou (erro de query):', profileError.message);
      return res.status(500).json({ error: 'Erro no servidor ao tentar login manual' });
    }

    if (!profile) {
      console.log('SERVER DEBUG: Login manual falhou: Usuário não encontrado ou senha incorreta.');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log('SERVER DEBUG: Login manual bem-sucedido para:', email);
    return res.json({ user: { id: profile.id, email: profile.email }, profile });
  }

  // Buscar perfil detalhado para login oficial
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, plans(*)')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('SERVER DEBUG: Erro ao buscar perfil detalhado:', profileError.message);
  }

  if (!profile) {
    console.warn('SERVER DEBUG: Perfil não encontrado para o usuário logado:', authData.user.id);
  }

  console.log('Login oficial bem-sucedido:', email);
  res.json({ user: authData.user, profile });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, document, parentId } = req.body;
  console.log('Tentativa de registro:', email, 'Referência:', parentId);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Erro no signUp:', error.message);
    return res.status(400).json({ error: error.message });
  }

  console.log('Usuário criado no Auth:', data.user.id);

  // Calcular validade de 7 dias (Trial)
  const trialDate = new Date();
  trialDate.setDate(trialDate.getDate() + 7);
  const expiryDate = trialDate.toISOString().split('T')[0];

  // Criação do perfil na tabela customizada
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: data.user.id,
      name,
      email,
      document,
      role: 'reseller',
      status: 'active', // Define active para permitir o insert (Lógica do App trata como Trial se sem plano)
      parent_id: parentId || null,
      expiry_date: expiryDate
    }]);

  if (profileError) {
    console.error('Erro ao criar perfil na tabela profiles:', profileError.message);
    return res.status(400).json({ error: profileError.message });
  }

  console.log('Perfil criado com sucesso para:', email);
  res.json({ message: 'Cadastro realizado. Aguardando aprovação.' });
});

// --- ROTAS DE LISTAS ---

app.get('/api/lists', async (req, res) => {
  const { userId, role, doc } = req.query;

  let query = supabase.from('credit_lists').select('*, organs_status(*)');

  if (role === 'reseller') {
    query = query.eq('reseller_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('SERVER DEBUG: Error fetching lists:', error);
    return res.status(400).json({ error: error.message });
  }

  console.log(`SERVER DEBUG: Fetched ${data ? data.length : 0} lists. Role: ${role}, Doc: ${doc}`);

  let filteredData = data;

  if (role === 'client' && doc) {
    const cleanDoc = doc.replace(/\D/g, '');
    filteredData = data.filter(l => {
      const dbDoc = String(l.client_document || '').replace(/\D/g, '');
      const match = dbDoc.includes(cleanDoc) || cleanDoc.includes(dbDoc);
      if (match) console.log(`SERVER DEBUG: Match found! CleanInput: ${cleanDoc}, DbDoc: ${dbDoc}`);
      return match;
    });
    console.log(`SERVER DEBUG: Filtered down to ${filteredData.length} matches.`);
  }

  const resultData = role === 'client' ? filteredData : data;

  const mapping = (l) => ({
    id: l.id,
    resellerId: l.reseller_id,
    clientDocument: l.client_document,
    startDate: l.start_date,
    manualConclusion: l.manual_conclusion,
    status: l.status,
    clientName: l.client_name,
    organs: {
      serasa: l.organs_status?.[0]?.serasa || false,
      boaVista: l.organs_status?.[0]?.boa_vista || false,
      spc: l.organs_status?.[0]?.spc || false,
      cenprotNacional: l.organs_status?.[0]?.cenprot_nacional || false,
      cenprotSP: l.organs_status?.[0]?.cenprot_sp || false,
    }
  });

  res.json(resultData.map(mapping));
});

// Criar nova lista
app.post('/api/lists', async (req, res) => {
  const { resellerId, clientDocument, clientName } = req.body;

  const { data, error } = await supabase
    .from('credit_lists')
    .insert([{
      reseller_id: resellerId,
      client_document: clientDocument,
      client_name: clientName,
      status: 'processing',
      start_date: new Date().toISOString()
    }])
    .select()
    .maybeSingle();

  if (error) {
    console.error('SERVER DEBUG: Erro ao criar protocolo:', error.message);
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(400).json({ error: 'Falha ao criar e recuperar o protocolo.' });
  }

  // Criar status inicial dos órgãos
  await supabase.from('organs_status').insert([{ list_id: data.id }]);

  res.json({
    id: data.id,
    resellerId: data.reseller_id,
    clientDocument: data.client_document,
    clientName: data.client_name,
    startDate: data.start_date,
    manualConclusion: data.manual_conclusion,
    status: data.status,
    organs: { serasa: false, boaVista: false, spc: false, cenprotNacional: false, cenprotSP: false }
  });
});

// --- ROTAS DE CONFIGURAÇÕES ---

app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase.from('platform_settings').select('*').maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  res.json({
    pixKey: data.pix_key,
    pixQrCodeUrl: data.pix_qr_code_url,
    paymentLink: data.payment_link
  });
});

app.patch('/api/settings', async (req, res) => {
  const { pixKey, pixQrCodeUrl, paymentLink } = req.body;
  const { data, error } = await supabase
    .from('platform_settings')
    .update({
      pix_key: pixKey,
      pix_qr_code_url: pixQrCodeUrl,
      payment_link: paymentLink,
      updated_at: new Date().toISOString()
    })
    .eq('id', 'global')
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json({
    pixKey: data.pix_key,
    pixQrCodeUrl: data.pix_qr_code_url,
    paymentLink: data.payment_link
  });
});

// --- ROTAS DE PLANOS ---

app.get('/api/plans', async (req, res) => {
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data.map(p => ({
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    commissionRate: parseFloat(p.commission_rate),
    description: p.description
  })));
});

app.post('/api/plans', async (req, res) => {
  const { name, price, commissionRate, description } = req.body;
  const { data, error } = await supabase
    .from('plans')
    .insert([{ name, price, commission_rate: commissionRate, description }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.patch('/api/plans/:id', async (req, res) => {
  const { name, price, commissionRate, description } = req.body;
  const { data, error } = await supabase
    .from('plans')
    .update({ name, price, commission_rate: commissionRate, description })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/plans/:id', async (req, res) => {
  const { error } = await supabase.from('plans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Plano removido' });
});

// --- ROTAS DE REVENDEDORES ---

app.get('/api/resellers', async (req, res) => {
  const { parentId } = req.query;
  let query = supabase.from('profiles').select('*, plans(*)').eq('role', 'reseller');

  if (parentId && parentId !== 'undefined') {
    query = query.eq('parent_id', parentId);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const mapping = (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    whatsapp: r.whatsapp,
    planId: r.plan_id,
    plan: r.plans?.name || (r.role === 'admin' ? 'Admin' : 'Teste Grátis'),
    commissionRate: r.plans?.commission_rate || (r.role === 'admin' ? 0 : 40),
    expiryDate: r.expiry_date || '2099-12-31',
    usageDays: r.usage_days || 30,
    isActive: r.status === 'active',
    status: r.status,
    balance: parseFloat(r.balance || 0),
    pixKey: r.pix_key,
    parentId: r.parent_id
  });

  res.json(data.map(mapping));
});

app.post('/api/resellers', async (req, res) => {
  let { name, email, password, role = 'reseller', status = 'active', parentId, planId, pixKey, whatsapp, expiryDate, usageDays } = req.body;

  // Se não informar validade, define 7 dias de trial por padrão
  if (!expiryDate) {
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 7);
    expiryDate = trialDate.toISOString().split('T')[0];
    usageDays = 7;
  }

  console.log('DEBUG: Iniciando criação de revendedor:', email);

  try {
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    // Se falhar admin (falta permissão), tenta signUp normal
    let userId = authData?.user?.id;
    if (authError || !userId) {
      console.log('DEBUG: Admin createUser falhou, tentando signup normal...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      userId = signUpData.user.id;
    }

    // 2. Criar perfil
    const { data, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        name,
        email,
        password, // Guardamos para o admin ver/editar
        role,
        status,
        parent_id: (parentId && parentId !== '') ? parentId : null,
        plan_id: (planId && planId !== '') ? planId : null,
        pix_key: pixKey,
        whatsapp,
        expiry_date: expiryDate,
        usage_days: usageDays
      }])
      .select()
      .maybeSingle();

    if (profileError) throw profileError;

    res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      status: data.status,
      parentId: data.parent_id,
      planId: data.plan_id,
      pixKey: data.pix_key,
      whatsapp: data.whatsapp,
      expiryDate: data.expiry_date,
      balance: parseFloat(data.balance || 0)
    });

  } catch (error) {
    console.error('DEBUG: Erro no cadastro de revendedor:', error);
    res.status(400).json({ error: error.message || 'Erro interno ao salvar revendedor' });
  }
});

app.patch('/api/resellers/:id', async (req, res) => {
  const { name, email, password, role, status, balance, whatsapp, planId, pixKey, parentId, expiryDate, usageDays } = req.body;

  console.log('DEBUG: Atualizando revendedor:', req.params.id);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name, email, password, role, status, balance, whatsapp,
      plan_id: (planId && planId !== '') ? planId : null,
      pix_key: pixKey,
      parent_id: (parentId && parentId !== '') ? parentId : null,
      expiry_date: expiryDate,
      usage_days: usageDays
    })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('DEBUG: Erro ao atualizar revendedor no Supabase:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json({
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    status: data.status,
    whatsapp: data.whatsapp,
    planId: data.plan_id,
    pixKey: data.pix_key,
    parentId: data.parent_id,
    expiryDate: data.expiry_date,
    balance: parseFloat(data.balance || 0)
  });
});

app.delete('/api/resellers/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Revendedor excluído com sucesso' });
});

// --- ROTAS DE SERVIÇOS ---

app.get('/api/services', async (req, res) => {
  const { resellerId } = req.query;
  let query = supabase.from('services').select('*');

  if (resellerId && resellerId !== 'undefined') {
    query = query.or(`reseller_id.eq.${resellerId},reseller_id.is.null`);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const mapping = (s) => ({
    id: s.id,
    resellerId: s.reseller_id,
    title: s.title,
    description: s.description,
    icon: s.icon,
    isActive: s.is_active,
    price: s.price || 0
  });

  res.json(data.map(mapping));
});

app.post('/api/services', async (req, res) => {
  const { title, description, icon, isActive, resellerId, price } = req.body;
  const { data, error } = await supabase
    .from('services')
    .insert([{
      title,
      description,
      icon,
      is_active: isActive,
      reseller_id: resellerId || req.body.reseller_id,
      price: price || 0
    }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json({
    id: data.id,
    resellerId: data.reseller_id,
    title: data.title,
    description: data.description,
    icon: data.icon,
    isActive: data.is_active,
    price: data.price
  });
});

// Rota de Compra de Serviço (Store)
app.post('/api/store/purchase', async (req, res) => {
  const { resellerId, serviceId } = req.body;

  // 1. Buscar Perfil (Saldo)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', resellerId)
    .maybeSingle();

  if (profileError || !profile) return res.status(400).json({ error: 'Perfil não encontrado' });

  // 2. Buscar Serviço (Preço)
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .maybeSingle();

  if (serviceError || !service) return res.status(400).json({ error: 'Serviço não encontrado' });

  const price = parseFloat(service.price || 0);

  // 3. Verificar Saldo
  if (parseFloat(profile.balance || 0) < price) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }

  // 4. Deduzir Saldo
  const newBalance = parseFloat(profile.balance || 0) - price;
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', resellerId);

  if (balanceError) return res.status(400).json({ error: 'Erro ao atualizar saldo' });

  // 5. Registrar Transação
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
      reseller_id: resellerId,
      type: 'debit',
      amount: price,
      description: `Compra: ${service.title}`,
      date: new Date().toISOString(),
      status: 'completed'
    }]);

  if (txError) console.error('Erro ao registrar transação:', txError);

  res.json({ success: true, newBalance });
});

app.delete('/api/services/:id', async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Serviço removido' });
});

// --- ROTAS DE TRANSAÇÕES ---

app.get('/api/transactions', async (req, res) => {
  const { resellerId, role } = req.query;
  let query = supabase.from('transactions').select('*');

  if (role === 'reseller') {
    query = query.eq('reseller_id', resellerId);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.patch('/api/transactions/:id/confirm', async (req, res) => {
  const { id } = req.params;

  // 1. Buscar transação
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (txError || !tx) return res.status(404).json({ error: 'Transação não encontrada' });
  if (tx.status === 'completed') return res.status(400).json({ error: 'Transação já foi confirmada' });

  // 2. Atualizar status da transação
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  // 3. Se for depósito, atualizar saldo do perfil
  if (tx.type === 'deposit') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', tx.reseller_id)
      .maybeSingle();

    const newBalance = parseFloat(profile.balance || 0) + parseFloat(tx.amount);

    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', tx.reseller_id);
  }

  res.json({ success: true });
});

// --- ROTA DE CONCLUSÃO DE LISTA ---

app.patch('/api/lists/:id/organs', async (req, res) => {
  const { id } = req.params;
  const { organ, active } = req.body;

  // Mapeamento de camelCase para snake_case
  const organFieldMap = {
    serasa: 'serasa',
    boaVista: 'boa_vista',
    spc: 'spc',
    cenprotNacional: 'cenprot_nacional',
    cenprotSP: 'cenprot_sp'
  };

  const dbField = organFieldMap[organ];
  if (!dbField) return res.status(400).json({ error: 'Órgão inválido' });

  const { error } = await supabase
    .from('organs_status')
    .update({ [dbField]: active })
    .eq('list_id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/lists/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('credit_lists')
    .update({ manual_conclusion: true, status: 'completed' })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('organs_status').update({
    serasa: true, boa_vista: true, spc: true,
    cenprot_nacional: true, cenprot_sp: true
  }).eq('list_id', id);

  res.json({ success: true });
});


// --- ROTAS DE COMISSÃO ---

app.get('/api/commission-payouts', async (req, res) => {
  const { resellerId } = req.query;

  let query = supabase.from('commission_payouts').select('*');
  if (resellerId) {
    query = query.eq('reseller_id', resellerId);
  }

  const { data, error } = await query.order('paid_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const formatted = data.map(p => ({
    id: p.id,
    resellerId: p.reseller_id,
    amount: parseFloat(p.amount),
    period: p.period,
    paidAt: p.paid_at,
    receiptBase64: p.receipt_base64,
    status: p.status
  }));

  res.json(formatted);
});

app.post('/api/commission-payouts', async (req, res) => {
  const { resellerId, amount, period, receiptBase64 } = req.body;
  if (!resellerId || !amount || !period) return res.status(400).json({ error: 'Dados incompletos' });

  const { data, error } = await supabase.from('commission_payouts').insert({
    reseller_id: resellerId,
    amount,
    period,
    receipt_base64: receiptBase64,
    status: 'paid'
  }).select().maybeSingle();

  if (error) return res.status(400).json({ error: error.message });

  const payout = {
    id: data.id,
    resellerId: data.reseller_id,
    amount: parseFloat(data.amount),
    period: data.period,
    paidAt: data.paid_at,
    receiptBase64: data.receipt_base64,
    status: data.status
  };

  res.json(payout);
});

app.get('/api/commissions-summary', async (req, res) => {
  try {
    // 1. Fetch Resellers
    const { data: resellers, error: rError } = await supabase
      .from('profiles')
      .select('id, name, email, commission_rate, plan_id')
      .eq('role', 'reseller');
    if (rError) throw rError;

    // 2. Fetch Plans (fallback for commission rate)
    const { data: plans, error: plError } = await supabase.from('plans').select('id, commission_rate');
    if (plError) throw plError;

    // 3. Fetch Sales (Confirmed Plan Payments)
    const { data: sales, error: sError } = await supabase
      .from('transactions')
      .select('reseller_id, amount')
      .eq('type', 'plan_payment')
      .eq('status', 'completed');
    if (sError) throw sError;

    // 4. Fetch Paid Commissions
    const { data: payouts, error: pError } = await supabase
      .from('commission_payouts')
      .select('reseller_id, amount');
    if (pError) throw pError;

    // 5. Aggregate
    const summary = resellers.map(r => {
      // Rate logic: Profile > Plan > Default 0
      const plan = plans.find(p => p.id === r.plan_id);
      const rate = r.commission_rate !== null ? r.commission_rate : (plan?.commission_rate || 0);

      const mySales = sales.filter(s => s.reseller_id === r.id);
      const totalSales = mySales.reduce((sum, s) => sum + parseFloat(s.amount), 0);
      const commissionTotal = totalSales * (rate / 100);

      const myPayouts = payouts.filter(p => p.reseller_id === r.id);
      const totalPaid = myPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return {
        resellerId: r.id,
        name: r.name,
        email: r.email,
        totalSales,
        commissionRate: rate,
        commissionTotal,
        totalPaid,
        pending: commissionTotal - totalPaid
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// --- ROTAS DE REVENDEDORES (ATUALIZAÇÃO) ---
app.patch('/api/resellers/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Filter allowed fields to prevent arbitrary updates
  const allowed = ['name', 'document', 'whatsapp', 'email', 'pixKey', 'password'];
  const toUpdate = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) toUpdate[k] = updates[k];
  }

  if (Object.keys(toUpdate).length === 0) {
    return res.json({ message: 'Nada a atualizar' });
  }

  console.log('PATCH Update:', { id, toUpdate });

  // 1. UPDATE direto (sem select)
  const { error: updateError } = await supabase
    .from('profiles')
    .update(toUpdate)
    .eq('id', id);

  if (updateError) {
    console.error('Erro no UPDATE:', updateError);
    return res.status(400).json({ error: updateError.message });
  }

  // 2. SELECT para pegar o resto dos dados
  const { data: currentProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Erro no SELECT:', selectError);
  }

  // 3. CONSTRUIR RESPOSTA MANUALMENTE (A Correção Definitiva)
  // Pegamos o que veio do banco e SOBRESCREVEMOS com o que o usuário enviou.
  // Isso garante que a UI receba exatamente o que foi digitado e salvo.
  const finalResponse = {
    ...(currentProfile || {}), // Dados do banco (ou vazio se falhou)
    ...toUpdate,               // Dados novos (Força a atualização na UI)
    id: id                     // Garante o ID
  };

  console.log('Respondendo com:', finalResponse);

  res.json(finalResponse);
});

// --- ASAAS INTEGRATION ---

const ASAAS_URL = process.env.ASAAS_API_URL;
const ASAAS_KEY = process.env.ASAAS_API_KEY;

// Helper: Get or Create Customer
// Helper: Get or Create Customer
async function getOrCreateAsaasCustomer(profile, overrides = {}) {
  // Use overrides if provided, else profile
  const p = { ...profile, ...overrides };

  if (p.asaas_customer_id) return p.asaas_customer_id;

  // Search by email
  try {
    const searchRes = await fetch(`${ASAAS_URL}/customers?email=${p.email}`, {
      headers: { access_token: ASAAS_KEY }
    });
    const searchData = await searchRes.json();
    if (searchData.data && searchData.data.length > 0) {
      // Try to update profile (fire & forget)
      supabase.from('profiles').update({ asaas_customer_id: searchData.data[0].id }).eq('id', p.id).then();
      return searchData.data[0].id;
    }
  } catch (e) { console.error('Asaas Search Error:', e); }

  // Validate Document
  const rawDoc = p.document || '';
  const sanitizedDoc = rawDoc.replace(/\D/g, '');

  if (!sanitizedDoc || (sanitizedDoc.length !== 11 && sanitizedDoc.length !== 14)) {
    throw new Error('CPF/CNPJ inválido (' + sanitizedDoc + '). Verifique os dados enviados.');
  }

  // Create
  const createRes = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_KEY
    },
    body: JSON.stringify({
      name: p.name,
      email: p.email,
      cpfCnpj: sanitizedDoc,
      externalReference: p.id,
      mobilePhone: p.whatsapp,
      notificationDisabled: true
    })
  });
  const customer = await createRes.json();

  if (customer.id) {
    supabase.from('profiles').update({ asaas_customer_id: customer.id }).eq('id', p.id).then();
    return customer.id;
  }

  // Handle Specific Errors
  if (customer.errors) {
    throw new Error('Asaas Error: ' + customer.errors[0].description);
  }

  throw new Error('Falha ao criar cliente no Asaas: ' + JSON.stringify(customer));
}

app.post('/api/asaas/create-pix-charge', async (req, res) => {
  try {
    const { userId, amount, type = 'deposit', customerData } = req.body;

    // 1. Get User
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) return res.status(404).json({ error: 'Usuário não encontrado' });

    // 2. Create pending transaction
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
      reseller_id: userId,
      type: type === 'plan' ? 'plan_payment' : 'deposit',
      amount,
      status: 'pending',
      description: type === 'plan' ? 'Renovação de Plano' : 'Recarga via PIX (Asaas)',
      date: new Date().toISOString()
    }).select().maybeSingle();

    if (txError) throw txError;

    // 3. Get Asaas Customer (with Data Override)
    const customerId = await getOrCreateAsaasCustomer(profile, customerData || {});

    // 4. Create Payment
    const paymentRes = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_KEY
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0], // Today
        externalReference: tx.id,
        description: `Recarga de Saldo - Transação #${tx.id}`
      })
    });

    const payment = await paymentRes.json();
    if (!payment.id) throw new Error('Erro Asaas: ' + JSON.stringify(payment));

    // Save Asaas ID to Transaction
    await supabase.from('transactions').update({ asaas_id: payment.id }).eq('id', tx.id);

    // 5. Get QR Code
    const qrRes = await fetch(`${ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: ASAAS_KEY }
    });
    const qrData = await qrRes.json();

    res.json({
      success: true,
      transactionId: tx.id,
      paymentId: payment.id,
      encodedImage: qrData.encodedImage,
      payload: qrData.payload
    });

  } catch (error) {
    console.error('Asaas Error:', error);
    fs.writeFileSync('debug_asaas.txt', `[${new Date().toISOString()}] ERROR: ${error.message}\n${error.stack}\n---\n`, { flag: 'a' });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/asaas/webhook', async (req, res) => {
  const { event, payment } = req.body;

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const txId = payment.externalReference;
    if (txId) {
      // Confirm Transaction
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();

      if (tx && tx.status !== 'completed') {
        // Update Transaction
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', txId);


        if (tx.type === 'plan_payment') {
          // RENEW PLAN
          const { data: planData } = await supabase.from('plans').select('id').eq('name', 'Mensal').single();
          const oneMonthLater = new Date();
          oneMonthLater.setDate(oneMonthLater.getDate() + 30);

          if (planData) {
            await supabase.from('profiles').update({
              plan_id: planData.id,
              status: 'active',
              expiry_date: oneMonthLater.toISOString()
            }).eq('id', tx.reseller_id);

            console.log(`[WEBHOOK] Plano renovado para usuário ${tx.reseller_id}`);
          }
        } else {
          // DEPOSIT
          // Update Balance
          const { data: profile } = await supabase.from('profiles').select('balance').eq('id', tx.reseller_id).maybeSingle();
          const newBalance = (parseFloat(profile.balance) || 0) + parseFloat(tx.amount);
          await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.reseller_id);

          console.log(`[WEBHOOK] Depósito confirmado para usuário ${tx.reseller_id}`);
        }
      }
    }
  }

  res.json({ received: true });
});

// CHECK PAYMENT STATUS (Manual or Polling)
app.get('/api/asaas/check-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Check status at Asaas
    const asaasRes = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
      headers: { access_token: ASAAS_KEY }
    });
    const payment = await asaasRes.json();

    if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
      // Activate logic similar to webhook
      const txId = payment.externalReference;
      if (txId) {
        const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();

        if (tx && tx.status !== 'completed') {
          await supabase.from('transactions').update({ status: 'completed' }).eq('id', txId);

          if (tx.type === 'plan_payment') {
            // RENEW PLAN
            const { data: planData } = await supabase.from('plans').select('id').eq('name', 'Mensal').single();
            const oneMonthLater = new Date();
            oneMonthLater.setDate(oneMonthLater.getDate() + 30);

            if (planData) {
              await supabase.from('profiles').update({
                plan_id: planData.id,
                status: 'active',
                expiry_date: oneMonthLater.toISOString()
              }).eq('id', tx.reseller_id);
            }
          } else {
            // DEPOSIT
            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', tx.reseller_id).maybeSingle();
            const newBalance = (parseFloat(profile.balance) || 0) + parseFloat(tx.amount);
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.reseller_id);
          }
        }
      }
      return res.json({ status: 'paid' });
    }

    res.json({ status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure Multer
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });

// Serve Uploads
app.use('/uploads', express.static('uploads'));

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// --- ROTAS DE CRIATIVOS ---

app.get('/api/creatives', async (req, res) => {
  const { data, error } = await supabase.from('creatives').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/creatives', async (req, res) => {
  const { name, category, type, url, thumbnail } = req.body;
  const { data, error } = await supabase
    .from('creatives')
    .insert([{ name, category, type, url, thumbnail }])
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/creatives/:id', async (req, res) => {
  const { error } = await supabase.from('creatives').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});




// --- TOOLS ENDPOINTS (Ecossistema de Ferramentas) ---
const TOOLS_FILE = 'tools.json';

// Helper to load tools
function loadTools() {
  if (!fs.existsSync(TOOLS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

// Helper to save tools
function saveTools(tools) {
  fs.writeFileSync(TOOLS_FILE, JSON.stringify(tools, null, 2));
}

// Get All Tools
app.get('/api/tools', (req, res) => {
  const tools = loadTools();
  res.json(tools);
});

// Create Tool (Admin)
app.post('/api/tools', (req, res) => {
  const { title, description, link, buttonText, icon, isActive } = req.body;
  const tools = loadTools();
  const newTool = {
    id: Date.now().toString(),
    title,
    description,
    link,
    buttonText: buttonText || 'Acessar Agora',
    icon: icon || 'Zap',
    isActive: isActive !== undefined ? isActive : true
  };
  tools.push(newTool);
  saveTools(tools);
  res.json(newTool);
});

// Update Tool (Admin)
app.put('/api/tools/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let tools = loadTools();
  const index = tools.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Tool not found' });

  tools[index] = { ...tools[index], ...updates };
  saveTools(tools);
  res.json(tools[index]);
});

// Delete Tool (Admin)
app.delete('/api/tools/:id', (req, res) => {
  const { id } = req.params;
  let tools = loadTools();
  tools = tools.filter(t => t.id !== id);
  saveTools(tools);
  res.json({ success: true });
});

// --- SERVING FRONTEND (PRODUCTION) ---

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  // Ignora chamadas de API que não deram match (embora devam ser tratadas antes)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Central Remoção rodando na porta ${PORT}`);
});
