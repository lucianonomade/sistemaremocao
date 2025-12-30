
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_TABLES = [
    'profiles',
    'plans',
    'services',
    'transactions',
    'credit_lists',
    'organs_status',
    'commission_payouts',
    'creatives',
    'platform_settings'
];

async function validateSchema() {
    console.log('=== INICIANDO VALIDAÇÃO DE SCHEMA DO BANCO ===');
    let missingTables = [];
    let errors = [];

    for (const table of REQUIRED_TABLES) {
        // Tenta fazer um select simples (limit 1) para ver se a tabela existe e é acessível
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`[FALHA] Tabela '${table}': ${error.message}`);
            if (error.code === '42P01') { // undefined_table
                missingTables.push(table);
            } else {
                errors.push({ table, msg: error.message });
            }
        } else {
            console.log(`[OK] Tabela '${table}' acessível.`);
        }
    }

    console.log('\n=== RESULTADO ===');
    if (missingTables.length === 0 && errors.length === 0) {
        console.log('✅ Todas as tabelas críticas foram encontradas e estão acessíveis.');
    } else {
        if (missingTables.length > 0) {
            console.error('❌ Tabelas FALTANDO:', missingTables.join(', '));
        }
        if (errors.length > 0) {
            console.error('⚠️ Erros de acesso (pode ser RLS ou permissão):');
            errors.forEach(e => console.error(`   - ${e.table}: ${e.msg}`));
        }
    }
}

validateSchema();
