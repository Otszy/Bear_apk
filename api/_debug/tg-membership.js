// api/_debug/tg-membership.js
import { ensureTgUser } from '../_utils/telegram.js';
import cors from '../_utils/cors.js';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

function resolveChat() {
  const id = process.env.TG_CHANNEL_ID;               // -100xxxxxxxxxx
  const username = process.env.TG_CHANNEL_USERNAME;   // tanpa @
  const url = process.env.TG_CHANNEL_URL;             // fallback kalau ada
  
  console.log('Channel config:', { id, username, url });
  
  if (id) return id;
  if (username) return '@' + username.replace(/^@/, '');
  if (url) {
    const m = url.match(/t\.me\/(?:c\/)?([^\/?#]+)/i);
    if (m) return '@' + m[1];
  }
  return null;
}

export default async function handler(req, res) {
  // Handle CORS
  if (cors(req, res)) return;

  console.log('=== Debug Membership Check ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Parse body if needed
    let body = req.body;
    if (typeof req.json === 'function' && !body) {
      try {
        body = await req.json();
      } catch (e) {
        console.warn('Failed to parse JSON body:', e.message);
        body = null;
      }
    }

    const { user } = ensureTgUser(req, body);
    console.log('Validated user:', { userId: user.id, username: user.username });

    const chat = resolveChat();
    if (!chat) {
      console.error('No chat configuration found');
      return res.status(400).json({ error: 'no_chat_config' });
    }

    console.log('Checking membership:', { chat, userId: user.id });

    const api = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${user.id}`;
    console.log('API URL:', api.replace(BOT_TOKEN, 'BOT_TOKEN'));

    const r = await fetch(api);
    const data = await r.json().catch(() => ({}));

    console.log('Telegram API response:', {
      httpStatus: r.status,
      apiOk: data.ok,
      description: data.description,
      result: data.result
    });

    // Interpretasi membership
    let interpretedMember = false;
    if (data?.ok && data?.result?.status) {
      const status = data.result.status;
      interpretedMember = !['left', 'kicked'].includes(status);
      
      // Special case untuk restricted tapi masih member
      if (status === 'restricted' && data.result.is_member === true) {
        interpretedMember = true;
      }
    }

    // Pulangkan info lengkap biar jelas di log/ui
    return res.status(200).json({
      chat,
      userId: user.id,
      username: user.username,
      botToken: BOT_TOKEN ? BOT_TOKEN.substring(0, 8) + '...' : 'missing',
      httpStatus: r.status,
      apiOk: !!data.ok,
      tgDescription: data.description || null,
      tgResult: data.result || null,
      interpretedMember,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Debug membership error:', {
      message: e.message,
      status: e.status,
      stack: e.stack
    });
    
    return res.status(e.status || 401).json({ 
      error: e.message || 'unauthorized',
      timestamp: new Date().toISOString()
    });
  }
}