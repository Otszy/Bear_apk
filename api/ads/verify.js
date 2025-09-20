import cors from '../_utils/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // TODO: verifikasi session + waktu tonton di DB (supabase)
  return res.status(200).json({ valid: true, amount: 0.002 });
}
