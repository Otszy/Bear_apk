// pages/api/_lib/telegram.js
import crypto from 'node:crypto';

export function verifyInitData(initData, botToken) {
  if (!initData) throw new Error('missing_init_data');

  // Parse querystring dari initData
  const sp = new URLSearchParams(initData);
  const hash = sp.get('hash');
  if (!hash) throw new Error('missing_hash');
  sp.delete('hash');

  // data_check_string: key=value dipisah \n, urut alfabet
  const dataCheckString = [...sp.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calcHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calcHash !== hash) throw new Error('bad_init_data');

  const userJson = sp.get('user');
  const user = userJson ? JSON.parse(userJson) : null;
  if (!user?.id) throw new Error('user_missing');

  return { user, authDate: Number(sp.get('auth_date')) || 0 };
}

export function getUserFromReq(req) {
  const init = req.headers['x-telegram-init'] || req.body?.init || '';
  return verifyInitData(init, process.env.TG_BOT_TOKEN);
}
