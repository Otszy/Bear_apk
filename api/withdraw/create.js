// api/withdraw/create.js
const cors = require('../_utils/cors');
const { verifyInitData, getInitDataFromHeader } = require('../_utils/telegram');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const botToken = process.env.TG_BOT_TOKEN;
  const initData = getInitDataFromHeader(req);
  const v = verifyInitData(botToken, initData);
  if (!v.ok || !v.user?.id) return res.status(401).json({ error: 'invalid_init_data' });

  const { amount, address, memo, network } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });
  if (!address || String(address).length < 8) return res.status(400).json({ error: 'invalid_address' });

  // di tahap ini harusnya disimpan ke DB (Supabase nanti)
  const id = 'wd_' + crypto.randomBytes(6).toString('hex');

  return res.status(200).json({
    id,
    status: 'pending',
    userId: v.user.id,
    amount: Number(amount),
    address,
    memo: memo || '',
    network: network || '',
  });
};
