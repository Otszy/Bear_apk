// pages/api/subscribe/verify.js
import { getUserFromReq } from '../_lib/telegram.js';

const TG_CHANNEL = process.env.TG_CHANNEL_URL || 'https://t.me/bearappofficial'; // untuk start()
const TG_CHAT_ID = '@bearappofficial'; // ganti bila pakai ID numerik
const BOT_TOKEN = process.env.TG_BOT_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const { provider } = req.body || {};
    if (!provider) return res.status(400).json({ error: 'provider_required' });

    // Verifikasi initData → dapat user.id yang valid
    const { user } = getUserFromReq(req);
    const userId = user.id;

    if (provider === 'tg') {
      // cek ke Telegram apakah user member channel
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(TG_CHAT_ID)}&user_id=${userId}`;
      const r = await fetch(url);
      const data = await r.json();
      const status = data?.result?.status;
      const valid = ['member', 'administrator', 'creator'].includes(status);
      if (!valid) return res.status(200).json({ valid: false });

      // TODO: tulis ke DB reward, cegah double claim
      return res.status(200).json({ valid: true, amount: 0.002 });
    }

    if (provider === 'x') {
      // sementara anggap valid selalu (belum ada API cek follow)
      return res.status(200).json({ valid: true, amount: 0.002 });
    }

    return res.status(400).json({ error: 'unknown_provider' });
  } catch (e) {
    console.error('verify error:', e);
    return res.status(401).json({ error: e.message || 'bad_init_data' });
  }
}
