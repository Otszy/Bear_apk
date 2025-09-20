// pages/api/subscribe/start.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  if (provider === 'tg') {
    return res.status(200).json({ joinUrl: process.env.TG_CHANNEL_URL || 'https://t.me/bearappofficial' });
  }
  if (provider === 'x') {
    return res.status(200).json({ joinUrl: 'https://x.com' });
  }
  return res.status(400).json({ error: 'unknown_provider' });
}
