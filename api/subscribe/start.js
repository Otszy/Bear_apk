import cors from '../_utils/cors.js';

const TG_CHANNEL_URL = process.env.TG_CHANNEL_URL || 'https://t.me/bearappofficial';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  if (provider === 'tg') return res.status(200).json({ joinUrl: TG_CHANNEL_URL });
  if (provider === 'x')  return res.status(200).json({ joinUrl: 'https://x.com/' });

  return res.status(400).json({ error: 'unknown_provider' });
}
