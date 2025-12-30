const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// --- CONFIGURAÇÃO ---
const ALVO_EMAIL = 'admin@admin.com'; // <--- SUBSTITUA PELO EMAIL DO ADMIN
const NOVA_SENHA = 'Supersenha@1'; // <--- SUBSTITUA PELA NOVA SENHA DESEJADA
// --------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetarSenha() {
    console.log(`=== INICIANDO RESET DE SENHA ===`);
    console.log(`Alvo: ${ALVO_EMAIL}`);

    // 1. Verificar se usuário existe na tabela profiles
    const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', ALVO_EMAIL)
        .maybeSingle();

    if (findError) {
        console.error('ERRO: Falha ao buscar usuário:', findError.message);
        return;
    }

    if (!user) {
        console.error('ERRO: Usuário não encontrado na tabela "profiles". Verifique se o email está correto.');
        console.log('Dica: Se não sabe o email, posso criar um script para listar todos os admins.');
        return;
    }

    console.log(`Usuário encontrado: ${user.name} (ID: ${user.id})`);

    // 2. Atualizar senha
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ password: NOVA_SENHA })
        .eq('email', ALVO_EMAIL);

    if (updateError) {
        console.error('ERRO: Falha ao atualizar a senha:', updateError.message);
    } else {
        console.log('---------------------------------------------------');
        console.log('SUCESSO! A senha foi atualizada na tabela profiles.');
        console.log('Tente fazer login com a nova senha agora.');
        console.log('---------------------------------------------------');
    }
}

resetarSenha();
