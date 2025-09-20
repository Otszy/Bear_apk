import { ensureTgUser } from '../_utils/telegram.js';
import crypto from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    ensureTgUser(req); // hanya validasi user
    const session = crypto.randomBytes(16).toString('hex');
    const sig = crypto.randomBytes(32).toString('hex');
    const adUrl = process.env.AD_URL || 'https://example.com';
    return res.status(200).json({ session, sig, minWatchMs: 8000, adUrl });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message || 'unauthorized' });
  }
}
