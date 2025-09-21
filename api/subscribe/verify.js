// api/subscribe/verify.js
import { ensureTgUser, checkMembership } from '../_utils/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    // Body bisa di Node (req.body) atau Edge (await req.json())
    const body = req.body ?? (typeof req.json === 'function' ? await req.json().catch(() => null) : null);

    const { user } = ensureTgUser(req, body);
    const provider = body?.provider;
    if (!provider) return res.status(400).json({ error: 'provider_required' });

    if (provider === 'tg') {
      const m = await checkMembership(user.id);
      console.log('membership_check', JSON.stringify(m));
      if (!m.isMember) {
        return res.status(200).json({ valid: false, amount: 0, reason: m.reason, status: m.status || null, chat: m.chat || null });
      }
      return res.status(200).json({ valid: true, amount: 0.002 });
    }

    if (provider === 'x') return res.status(200).json({ valid: false, amount: 0 });
    return res.status(400).json({ error: 'unknown_provider' });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
