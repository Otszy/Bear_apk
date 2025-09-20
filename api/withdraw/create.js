import { ensureTgUser } from '../_utils/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const { user } = ensureTgUser(req);
    const { amount, address, memo, network } = req.body || {};
    if (!amount || !address || !network) return res.status(400).json({ error: 'invalid_payload' });

    const id = `wd_${Math.random().toString(36).slice(2,10)}`;
    return res.status(200).json({ id, userId: user.id });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
