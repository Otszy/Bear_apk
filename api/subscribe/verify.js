// api/subscribe/verify.js
import { ensureTgUser } from '../_utils/telegram.js';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

function resolveChat() {
  const id = process.env.TG_CHANNEL_ID;
  const username = process.env.TG_CHANNEL_USERNAME;
  const url = process.env.TG_CHANNEL_URL;
  if (id) return id;
  if (username) return '@' + username;
  if (url) {
    const m = url.match(/t\.me\/(?:c\/)?([^\/?#]+)/i);
    if (m) return '@' + m[1];
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const { user } = ensureTgUser(req);
    const { provider } = req.body || {};
    if (!provider) return res.status(400).json({ error: 'provider_required' });

    if (provider === 'tg') {
      const chat = resolveChat();
      if (!chat) return res.status(400).json({ valid:false, reason: 'no_chat_config', amount: 0 });

      const api = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${user.id}`;
      const r = await fetch(api);
      const data = await r.json().catch(() => ({}));

      if (!data.ok) {
        return res.status(200).json({
          valid: false,
          amount: 0,
          reason: data.description || 'tg_api_not_ok'
        });
      }

      const s = data.result?.status;
      const isMember = s && !['left','kicked'].includes(s);
      return res.status(200).json({
        valid: !!isMember,
        amount: isMember ? 0.002 : 0,
        reason: isMember ? null : `status=${s}`
      });
    }

    if (provider === 'x') {
      return res.status(200).json({ valid: false, amount: 0 });
    }

    return res.status(400).json({ error: 'unknown_provider' });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
