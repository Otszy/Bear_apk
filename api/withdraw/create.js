import cors from '../_utils/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, address, memo, network } = req.body || {};
  if (!amount || !address) return res.status(400).json({ error: 'invalid_payload' });

  // TODO: simpan ke Supabase nanti
  const id = 'wd_' + Math.random().toString(36).slice(2);
  return res.status(200).json({ id, status: 'queued' });
}
