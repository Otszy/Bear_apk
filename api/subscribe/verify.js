import cors from '../_utils/cors.js';
import { verifyInitData, getInitDataFromHeader } from '../_utils/telegram.js';

const BOT = process.env.TG_BOT_TOKEN || '';
const CH  = (process.env.TG_CHANNEL_USERNAME || 'bearappofficial').replace(/^@/, '');

async function isTelegramMember(userId) {
  const url = `https://api.telegram.org/bot${BOT}/getChatMember?chat_id=@${CH}&user_id=${userId}`;
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!j.ok) return { ok: false, reason: j.description || 'tg_api_error' };
  const st = j.result?.status;
  const member = ['member', 'administrator', 'creator'].includes(st);
  return { ok: member, status: st };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider_required' });

  // Verifikasi initData dari header (bukan percaya data client)
  const initData = getInitDataFromHeader(req);
  const v = verifyInitData(BOT, initData);
  if (!v.ok) return res.status(401).json({ error: 'bad_init_data', reason: v.reason });

  const userId = v.user?.id;
  if (!userId) return res.status(400).json({ error: 'no_user' });

  if (provider === 'tg') {
    const m = await isTelegramMember(userId);
    if (!m.ok) return res.status(200).json({ valid: false, reason: m.reason || 'not_member' });
    return res.status(200).json({ valid: true, amount: 0.002 });
  }

  // Placeholder untuk X (blm ada verifikasi real)
  if (provider === 'x') {
    return res.status(200).json({ valid: true, amount: 0.002 });
  }

  return res.status(400).json({ error: 'unknown_provider' });
}
