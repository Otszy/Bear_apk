import { ensureTgUser, isMemberOfChannel } from '../_utils/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const { user } = ensureTgUser(req);
    const { provider } = req.body || {};
    if (!provider) return res.status(400).json({ error: 'provider_required' });

    if (provider === 'tg') {
      const ok = await isMemberOfChannel(user.id);
      return res.status(200).json({ valid: ok, amount: ok ? 0.002 : 0 });
    }
    if (provider === 'x') {
      return res.status(200).json({ valid: false, amount: 0 }); // placeholder
    }
    return res.status(400).json({ error: 'unknown_provider' });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
