
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAdmins() {
    console.log('Connecting to Supabase...');

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, name')
        .eq('role', 'admin');

    if (error) {
        console.error('Error fetching admins:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No admin users found in "profiles" table.');
    } else {
        console.log('Found the following admin users:');
        console.table(data);
    }
}

inspectAdmins();
