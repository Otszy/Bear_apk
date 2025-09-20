// api/ads/start.js
const cors = require('../_utils/cors');
const { verifyInitData, getInitDataFromHeader } = require('../_utils/telegram');
const crypto = require('crypto');

function sign(obj, secret) {
  const payload = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { session: payload, sig };
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const botToken = process.env.TG_BOT_TOKEN;
  const secret = process.env.APP_SECRET || botToken;
  const initData = getInitDataFromHeader(req);
  const v = verifyInitData(botToken, initData);
  if (!v.ok || !v.user?.id) return res.status(401).json({ error: 'invalid_init_data' });

  const minWatchMs = Number(process.env.AD_MIN_MS || 5000);
  const payload = { uid: v.user.id, t: Date.now() };
  const { session, sig } = sign(payload, secret);
  const adUrl = process.env.AD_URL || 'https://example.com/';

  return res.status(200).json({ session, sig, minWatchMs, adUrl });
};
