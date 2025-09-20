// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN = process.env.TG_BOT_TOKEN; // set di Vercel

function verifyInitData(initData) {
  if (!initData || !BOT_TOKEN) {
    throw Object.assign(new Error('bad_init_data'), { status: 401 });
  }
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  const signature = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  if (signature !== hash) {
    throw Object.assign(new Error('bad_init_data'), { status: 401 });
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10) * 1000;
  if (!authDate || Date.now() - authDate > 24 * 60 * 60 * 1000) {
    throw Object.assign(new Error('bad_init_data'), { status: 401 });
  }

  const userRaw = urlParams.get('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (!user?.id) throw Object.assign(new Error('bad_init_data'), { status: 401 });
  return { user };
}

export function ensureTgUser(req) {
  const initData = req.headers?.get
    ? req.headers.get('x-telegram-init')
    : req.headers['x-telegram-init'];
  return verifyInitData(initData);
}

export async function isMemberOfChannel(userId) {
  const username = process.env.TG_CHANNEL_USERNAME || 'bearappofficial'; // tanpa @
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=@${username}&user_id=${userId}`;
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!data.ok) return false;
  const s = data.result?.status;
  return s && s !== 'left' && s !== 'kicked';
}
