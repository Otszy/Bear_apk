// api/_debug/tg-membership.js
import { ensureTgUser } from '../_utils/telegram.js';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

function resolveChat() {
  const id = process.env.TG_CHANNEL_ID;               // -100xxxxxxxxxx
  const username = process.env.TG_CHANNEL_USERNAME;   // tanpa @
  const url = process.env.TG_CHANNEL_URL;             // fallback kalau ada
  if (id) return id;
  if (username) return '@' + username;
  if (url) {
    const m = url.match(/t\.me\/(?:c\/)?([^\/?#]+)/i);
    if (m) return '@' + m[1];
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const { user } = ensureTgUser(req);

    const chat = resolveChat();
    if (!chat) return res.status(400).json({ error: 'no_chat_config' });

    const api = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${user.id}`;
    const r = await fetch(api);
    const data = await r.json().catch(() => ({}));

    // Pulangkan info lengkap biar jelas di log/ui
    return res.status(200).json({
      chat,
      userId: user.id,
      apiOk: !!data.ok,
      tgDescription: data.description || null,
      tgResult: data.result || null,
      interpretedMember:
        data?.ok && data?.result?.status &&
        !['left','kicked'].includes(data.result.status)
    });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
