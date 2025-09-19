export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { userId, amount, address, memo, network } = req.body || {};
  if (!userId || !amount || !address) return res.status(400).json({ error: 'Missing fields' });

  // TODO: simpan ke Supabase nanti
  const id = Date.now().toString(36);
  res.status(200).json({ id, status: 'queued', amount, address, memo, network });
}
