// api/subscribe/start.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const { provider } = req.body || {};
    if (!provider) return res.status(400).json({ error: 'provider_required' });

    if (provider === 'tg') {
      // prefer INVITE untuk channel private; fallback username/URL
      const invite = process.env.TG_CHANNEL_INVITE;       // ex: https://t.me/+xxxxxxxxxxxx
      const username = process.env.TG_CHANNEL_USERNAME;   // tanpa @
      const url = process.env.TG_CHANNEL_URL;             // ex: https://t.me/yourchannel

      if (invite) return res.status(200).json({ joinUrl: invite });
      if (username) return res.status(200).json({ joinUrl: `https://t.me/${username.replace(/^@/,'')}` });
      if (url)      return res.status(200).json({ joinUrl: url });

      return res.status(400).json({ error: 'no_join_link_config' });
    }

    if (provider === 'x') {
      const joinUrl = process.env.X_PROFILE_URL || 'https://x.com/';
      return res.status(200).json({ joinUrl });
    }

    return res.status(400).json({ error: 'unknown_provider' });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'server_error' });
  }
}
