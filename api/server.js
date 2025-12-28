
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const calculateRealTimeProgress = (startDateStr, manualConclusion) => {
  if (manualConclusion) return 100;
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  let progress = Math.floor(diffDays * 1.11);
  if (progress >= 90) return 90;
  return Math.max(0, progress);
};

// Exemplo de rota de listagem
app.get('/api/lists', async (req, res) => {
  const { userId, role } = req.query;
  let query = supabase.from('credit_lists').select('*, organs_status(*)');
  if (role === 'reseller') query = query.eq('reseller_id', userId);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  
  const enrichedData = data.map(list => ({
    ...list,
    current_progress: calculateRealTimeProgress(list.start_date, list.manual_conclusion)
  }));
  res.json(enrichedData);
});

module.exports = app;
