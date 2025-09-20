// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

// --- helpers ---
function pickHeader(req, key) {
  const get = req.headers?.get?.bind(req.headers);
  return get ? get(key) : req.headers[key];
}
function pickQuery(req) {
  try {
    const url = new URL(req.url, 'http://localhost'); // base dummy
    return (
      url.searchParams.get('init') ||
      url.searchParams.get('initData') ||
      url.searchParams.get('tgWebAppData') ||
      ''
    );
  } catch { return ''; }
}

// --- AUTH: verify Telegram initData ---
export function ensureTgUser(req) {
  // 1) header
  let initData =
    pickHeader(req, 'x-telegram-init') ||
    pickHeader(req, 'x-telegram-init-data') ||
    pickHeader(req, 'x-tg-init-data');

  // 2) body
  if (!initData && req.body && typeof req.body.initData === 'string') {
    initData = req.body.initData;
  }

  // 3) query
  if (!initData) initData = pickQuery(req);

  // bypass buat tes (opsional)
  if (process.env.TG_DISABLE_SIGNATURE === 'true') {
    const p = new URLSearchParams(initData || '');
    const userRaw = p.get('user');
    const user = userRaw ? JSON.parse(userRaw) : { id: 0 };
    return { user };
  }

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

  const userRaw = params.get('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (!user?.id) throw Object.assign(new Error('no_user_in_initdata'), { status: 401 });

  return { user };
}

// --- MEMBERSHIP: cek join channel ---
// ID-only (disarankan). Isi ENV: TG_CHANNEL_ID = -100xxxxxxxxxx
// (Masih support username kalau memang ada, tapi ID diprioritaskan)
export async function isMemberOfChannel(userId) {
  const chat =
    process.env.TG_CHANNEL_ID ||
    (process.env.TG_CHANNEL_USERNAME ? '@' + process.env.TG_CHANNEL_USERNAME : null);

  if (!BOT_TOKEN || !chat) return false;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${userId}`;
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!data.ok) return false;

  const s = data.result?.status;
  return s && !['left', 'kicked'].includes(s);
}
