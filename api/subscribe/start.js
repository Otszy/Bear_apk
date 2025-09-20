export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  if (provider === 'tg') {
    const joinUrl = `https://t.me/${process.env.TG_CHANNEL_USERNAME || 'bearappofficial'}`;
    return res.status(200).json({ joinUrl });
  }
  if (provider === 'x') {
    const joinUrl = process.env.X_PROFILE_URL || 'https://x.com/';
    return res.status(200).json({ joinUrl });
  }
  return res.status(400).json({ error: 'unknown_provider' });
}
