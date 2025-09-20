// api/ads/verify.js
const cors = require('../_utils/cors');
const { verifyInitData, getInitDataFromHeader } = require('../_utils/telegram');
const crypto = require('crypto');

function unsign(session, sig, secret) {
  const good = crypto.createHmac('sha256', secret).update(session).digest('hex');
  if (good !== sig) return null;
  try { return JSON.parse(Buffer.from(session, 'base64url').toString()); } catch { return null; }
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { session, sig } = req.body || {};
  if (!session || !sig) return res.status(400).json({ error: 'session_and_sig_required' });

  const botToken = process.env.TG_BOT_TOKEN;
  const secret = process.env.APP_SECRET || botToken;

  // validasi initData juga
  const initData = getInitDataFromHeader(req);
  const v = verifyInitData(botToken, initData);
  if (!v.ok || !v.user?.id) return res.status(401).json({ error: 'invalid_init_data' });

  const s = unsign(session, sig, secret);
  if (!s) return res.status(400).json({ error: 'bad_signature' });

  const minWatchMs = Number(process.env.AD_MIN_MS || 5000);
  const watched = Date.now() - s.t;
  const ok = watched >= minWatchMs;

  const amount = ok ? parseFloat(process.env.REWARD_AD || '0.002') : 0;
  return res.status(200).json({ valid: ok, watched, amount });
};
