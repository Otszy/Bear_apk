// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

// ---------- helpers ----------
function pickHeader(req, key) {
  const get = req.headers?.get?.bind(req.headers);
  return get ? get(key) : req.headers[key];
}
function pickQuery(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    return (
      url.searchParams.get('init') ||
      url.searchParams.get('initData') ||
      url.searchParams.get('tgWebAppData') ||
      ''
    );
  } catch { return ''; }
}

// ---------- AUTH: verify Telegram initData ----------
export function ensureTgUser(req) {
  // 1) dari header
  let initData =
    pickHeader(req, 'x-telegram-init') ||
    pickHeader(req, 'x-telegram-init-data') ||
    pickHeader(req, 'x-tg-init-data');

  // 2) fallback body
  if (!initData && req.body && typeof req.body.initData === 'string') {
    initData = req.body.initData;
  }

  // 3) fallback query
  if (!initData) initData = pickQuery(req);

  // TIDAK ADA BYPASS LAGI: kalau mau debug, tetap butuh user.id valid
  return verifyInitData(initData);
}

function verifyInitData(initData) {
  if (!BOT_TOKEN) throw Object.assign(new Error('missing_bot_token'), { status: 401 });
  if (!initData)  throw Object.assign(new Error('missing_initdata'), { status: 401 });

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const signature = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (signature !== hash) throw Object.assign(new Error('signature_mismatch'), { status: 401 });

  const authDate = parseInt(params.get('auth_date') || '0', 10) * 1000;
  if (!authDate || Date.now() - authDate > 24 * 60 * 60 * 1000) {
    throw Object.assign(new Error('initdata_expired'), { status: 401 });
  }

  // user wajib ada & id wajib integer > 0
  const userRaw = params.get('user');
  let user = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch {}
  const uid = Number(user?.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw Object.assign(new Error('invalid_user_id'), { status: 401 });
  }
  return { user: { ...user, id: uid } };
}

// ---------- MEMBERSHIP ----------
const OK = new Set(['member', 'administrator', 'creator']);

async function tgGetMember(chat, userId) {
  const uid = Number(userId);
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${uid}`;
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  return data;
}

/** Cek member channel; prioritas TG_CHANNEL_ID */
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
