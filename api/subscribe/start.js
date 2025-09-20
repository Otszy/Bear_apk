// api/subscribe/start.js
const cors = require('../_utils/cors');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  if (provider === 'tg') {
    // Pakai env kamu: TG_CHANNEL_URL = https://t.me/bearappofficial
    const joinUrl = process.env.TG_CHANNEL_URL || 'https://t.me/bearappofficial';
    return res.status(200).json({ joinUrl });
  }
  if (provider === 'x') {
    const joinUrl = process.env.X_FOLLOW_URL || 'https://x.com/';
    return res.status(200).json({ joinUrl });
  }
  return res.status(400).json({ error: 'unknown_provider' });
};
