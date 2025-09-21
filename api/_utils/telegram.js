// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

/* ---------------- helpers ---------------- */
function hget(req, key) {
  const h = req.headers || {};
  if (typeof h.get === 'function') return h.get(key) || '';
  // fallback object-style; header keys bisa lowercase
  return h[key] || h[key.toLowerCase()] || h[key.toUpperCase()] || '';
}

export function extractInitData(req, body) {
  // 1) header
  let init =
    hget(req, 'x-telegram-init') ||
    hget(req, 'x-telegram-init-data') ||
    hget(req, 'x-tg-init-data');

  // 2) body (body bisa datang dari req.body (Node) ATAU hasil req.json() (Edge))
  if (!init && body && typeof body.initData === 'string') init = body.initData;

  // 3) query
  if (!init) {
    try {
      const url = new URL(req.url, 'http://localhost');
      init =
        url.searchParams.get('init') ||
        url.searchParams.get('initData') ||
        url.searchParams.get('tgWebAppData') ||
        '';
    } catch {}
  }
  return init || '';
}

/* -------------- auth: verify Telegram initData -------------- */
export function ensureTgUserFromInitData(initData) {
  if (!BOT_TOKEN) throw Object.assign(new Error('missing_bot_token'), { status: 401 });
  if (!initData)  throw Object.assign(new Error('missing_initdata'), { status: 401 });

  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  p.delete('hash');

  const dataCheckString = Array.from(p.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const signature = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (signature !== hash) throw Object.assign(new Error('signature_mismatch'), { status: 401 });

  const authDate = parseInt(p.get('auth_date') || '0', 10) * 1000;
  if (!authDate || Date.now() - authDate > 24 * 60 * 60 * 1000) {
    throw Object.assign(new Error('initdata_expired'), { status: 401 });
  }

  let user = null;
  try { user = JSON.parse(p.get('user') || 'null'); } catch {}
  const uid = Number(user?.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw Object.assign(new Error('invalid_user_id'), { status: 401 });
  }
  return { user: { ...user, id: uid } };
}

/** versi praktis untuk handler: kirim req + (opsional) body terparse */
export function ensureTgUser(req, body) {
  const init = extractInitData(req, body);
  return ensureTgUserFromInitData(init);
}

/* -------------- membership -------------- */
const OK = new Set(['member', 'administrator', 'creator']);

async function tgGetMember(chat, userId) {
  const uid = Number(userId);
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${uid}`;
  const r = await fetch(url);
  return await r.json().catch(() => ({}));
}

/** Cek join channel; prioritas TG_CHANNEL_ID, fallback username/URL kalau ada */
export async function checkMembership(userId) {
  if (!BOT_TOKEN) return { isMember: false, reason: 'missing_bot_token' };
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) return { isMember: false, reason: 'invalid_user_id' };

  let chat = null;
  if (process.env.TG_CHANNEL_ID) chat = process.env.TG_CHANNEL_ID; // -100...
  else if (process.env.TG_CHANNEL_USERNAME) chat = '@' + process.env.TG_CHANNEL_USERNAME.replace(/^@/, '');
  else if (process.env.TG_CHANNEL_URL) {
    const m = process.env.TG_CHANNEL_URL.match(/t\.me\/(?:c\/)?([^\/?#]+)/i);
    if (m) chat = '@' + m[1];
  }
  if (!chat) return { isMember: false, reason: 'no_chat_config' };

  const data = await tgGetMember(chat, uid);
  if (!data?.ok) return { isMember: false, chat, reason: data?.description || 'tg_api_not_ok' };

  const res = data.result || {};
  const s = res.status;
  if (OK.has(s)) return { isMember: true, status: s, chat };
  if (s === 'restricted' && res.is_member === true) {
    return { isMember: true, status: 'restricted(is_member=true)', chat };
  }
  return { isMember: false, status: s || null, chat, reason: 'not_member' };
}
