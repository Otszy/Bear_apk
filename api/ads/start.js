import cors from '../_utils/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = Math.random().toString(36).slice(2) + Date.now();
  const sig = Math.random().toString(36).slice(2);
  const minWatchMs = 5000;
  const adUrl = 'https://t.me/bearapk_bot'; // ganti ke url ads kamu
  res.status(200).json({ session, sig, minWatchMs, adUrl });
}
