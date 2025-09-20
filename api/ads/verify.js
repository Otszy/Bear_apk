import { ensureTgUser } from '../_utils/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    ensureTgUser(req);
    const { session, sig } = req.body || {};
    if (!session || !sig) return res.status(400).json({ error: 'session_required' });
    return res.status(200).json({ ok: true, amount: 0.002 }); // placeholder
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
