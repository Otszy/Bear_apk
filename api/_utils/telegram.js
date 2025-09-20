// api/_utils/telegram.js
const crypto = require('crypto');

function verifyInitData(botToken, initDataRaw) {
  if (!initDataRaw) return { ok: false, reason: 'missing_init_data' };

  const p = new URLSearchParams(initDataRaw);
  const hash = p.get('hash');
  if (!hash) return { ok: false, reason: 'missing_hash' };
  p.delete('hash');

  const dataCheckString = [...p].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHash('sha256').update('WebAppData' + botToken).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (hmac !== hash) return { ok: false, reason: 'bad_hash' };

  let user = null;
  const u = p.get('user');
  if (u) try { user = JSON.parse(u); } catch {}
  return { ok: true, user };
}

function getInitDataFromHeader(req) {
  return req.headers['x-tg-initdata'] || req.headers['x-tg-init-data'] || '';
}

module.exports = { verifyInitData, getInitDataFromHeader };
