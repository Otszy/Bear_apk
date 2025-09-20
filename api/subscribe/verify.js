// api/subscribe/verify.js
const cors = require('../_utils/cors');
const { verifyInitData, getInitDataFromHeader } = require('../_utils/telegram');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  const botToken = process.env.TG_BOT_TOKEN;
  if (!botToken) return res.status(500).json({ error: 'missing_bot_token' });

  // Ambil & validasi initData dari header
  const initData = getInitDataFromHeader(req);
  const v = verifyInitData(botToken, initData);
  if (!v.ok || !v.user?.id) return res.status(401).json({ error: 'invalid_init_data', detail: v.reason });

  const userId = v.user.id;
  const reward = parseFloat(process.env.REWARD_SUBSCRIBE || '0.002');

  if (provider === 'tg') {
    // Tentukan chat_id
    let chatId =
      process.env.TG_CHANNEL_ID ||
      (process.env.TG_CHANNEL_URL || '').replace(/^https?:\/\/t\.me\//, '@') ||
      '@bearappofficial';

    // Verify member
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${userId}`;
    const r = await fetch(url);
    const data = await r.json().catch(() => ({}));
    if (!data.ok) return res.status(200).json({ valid: false, reason: data.description || 'tg_api_error' });

    const status = data.result?.status; // 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked'
    const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
    return res.status(200).json({ valid: isMember, amount: isMember ? reward : 0, status });
  }

  if (provider === 'x') {
    // Belum ada verifikasi X: anggap valid (atau ubah sesuai kebutuhan)
    return res.status(200).json({ valid: true, amount: reward });
  }

  return res.status(400).json({ error: 'unknown_provider' });
};
