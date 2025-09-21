// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

/* ---------------- helpers ---------------- */
function hget(req, key) {
  const h = req.headers || {};
  if (typeof h.get === 'function') return h.get(key) || '';
  // fallback object-style; header keys bisa lowercase
  return h[key] || h[key.toLowerCase()] || h[key.toUpperCase()] || '';
}

export function extractInitData(req, body) {
  let init = '';
  
  console.log('=== extractInitData Debug ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Headers available:', Object.keys(req.headers || {}));
  console.log('Body type:', typeof body);
  console.log('Body content:', body ? JSON.stringify(body).substring(0, 200) : 'null');
  
  // 1) header - coba berbagai variasi nama header
  init = 
    hget(req, 'x-telegram-init') ||
    hget(req, 'x-telegram-init-data') ||
    hget(req, 'x-tg-init-data') ||
    hget(req, 'x-tg-initdata') ||
    hget(req, 'x-telegram-initdata') ||
    hget(req, 'telegram-init-data') ||
    hget(req, 'authorization')?.replace(/^Bearer\s+/i, '') || '';

  console.log('Header init found:', !!init, init ? init.length : 0);

  // 2) body - handle berbagai format body
  if (!init && body) {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        init = parsed.initData || '';
        console.log('Parsed from JSON body:', !!init);
      } catch {
        // jika body adalah raw initData string
        if (body.includes('query_id=') || body.includes('user=')) {
          init = body;
          console.log('Raw initData from body:', !!init);
        }
      }
    } else if (typeof body === 'object') {
      init = body.initData || '';
      console.log('Object body initData:', !!init);
    }
  }

  // 3) query parameters - coba berbagai nama
  if (!init) {
    try {
      const url = new URL(req.url, 'http://localhost');
      init =
        url.searchParams.get('init') ||
        url.searchParams.get('initData') ||
        url.searchParams.get('tgWebAppData') ||
        url.searchParams.get('tg_init_data') ||
        url.searchParams.get('telegram_init_data') ||
        '';
      console.log('Query param init found:', !!init);
    } catch (e) {
      console.warn('Failed to parse URL for query params:', e.message);
    }
  }

  // 4) fallback: coba ambil dari raw body jika masih kosong
  if (!init && req.body && typeof req.body === 'string') {
    if (req.body.includes('query_id=') || req.body.includes('user=')) {
      init = req.body;
      console.log('Fallback raw body init:', !!init);
    }
  }

  console.log('extractInitData result:', {
    hasInit: !!init,
    initLength: init.length,
    initPreview: init ? init.substring(0, 100) + '...' : 'empty',
    source: init ? 'found' : 'missing'
  });

  return init || '';
}

/* -------------- auth: verify Telegram initData -------------- */
export function ensureTgUserFromInitData(initData) {
  if (!BOT_TOKEN) {
    console.error('Missing bot token');
    throw Object.assign(new Error('missing_bot_token'), { status: 401 });
  }
  
  if (!initData) {
    console.error('Missing initData');
    throw Object.assign(new Error('missing_initdata'), { status: 401 });
  }

  console.log('Validating initData:', {
    length: initData.length,
    preview: initData.substring(0, 100) + '...'
  });

  let p;
  try {
    p = new URLSearchParams(initData);
  } catch (e) {
    console.error('Failed to parse initData as URLSearchParams:', e.message);
    throw Object.assign(new Error('invalid_initdata_format'), { status: 401 });
  }

  const hash = p.get('hash');
  if (!hash) {
    console.error('No hash found in initData');
    throw Object.assign(new Error('missing_hash'), { status: 401 });
  }

  // Remove hash for signature verification
  p.delete('hash');

  const dataCheckString = Array.from(p.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  console.log('🔑 Data check string length:', dataCheckString.length);
  console.log('🔑 Data check preview:', dataCheckString.substring(0, 200) + '...');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const signature = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  
  if (signature !== hash) {
    console.warn('⚠️ Signature mismatch (demo mode):', { 
      expected: hash.substring(0, 16) + '...', 
      calculated: signature.substring(0, 16) + '...' 
    });
    
    // In demo mode, allow signature mismatch
    if (hash === 'demo_hash') {
      console.log('🎭 Demo mode detected, skipping signature validation');
    } else {
      throw Object.assign(new Error('signature_mismatch'), { status: 401 });
    }
  }

  const authDate = parseInt(p.get('auth_date') || '0', 10) * 1000;
  if (!authDate) {
    console.warn('⚠️ Missing or invalid auth_date');
    // In demo mode, allow missing auth_date
    if (hash !== 'demo_hash') {
      throw Object.assign(new Error('missing_auth_date'), { status: 401 });
    }
  }

  const now = Date.now();
  const age = now - authDate;
  if (age > 24 * 60 * 60 * 1000 && hash !== 'demo_hash') {
    console.warn('⚠️ InitData expired:', { age: age / 1000 / 60, maxAgeMinutes: 24 * 60 });
    // In production, uncomment this line:
    // throw Object.assign(new Error('initdata_expired'), { status: 401 });
  }

  let user = null;
  const userStr = p.get('user');
  if (!userStr) {
    console.error('❌ No user data in initData');
    throw Object.assign(new Error('missing_user_data'), { status: 401 });
  }

  try {
    user = JSON.parse(userStr);
  } catch (e) {
    console.error('❌ Failed to parse user JSON:', e.message);
    throw Object.assign(new Error('invalid_user_json'), { status: 401 });
  }

  const uid = Number(user?.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    console.error('❌ Invalid user ID:', { userId: user?.id, parsedId: uid });
    throw Object.assign(new Error('invalid_user_id'), { status: 401 });
  }

  console.log('✅ Successfully validated user:', { 
    userId: uid, 
    username: user.username,
    firstName: user.first_name,
    isDemoMode: hash === 'demo_hash'
  });
  return { user: { ...user, id: uid } };
}

/** versi praktis untuk handler: kirim req + (opsional) body terparse */
export function ensureTgUser(req, body) {
  const init = extractInitData(req, body);
  return ensureTgUserFromInitData(init);
}

/* -------------- membership -------------- */
const OK = new Set(['member', 'administrator', 'creator']);

async function tgGetMember(chat, userId) {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new Error('Invalid user ID for membership check');
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${uid}`;
  
  console.log('Checking membership:', { chat, userId: uid, url: url.replace(BOT_TOKEN, 'BOT_TOKEN') });
  
  try {
    const r = await fetch(url);
    const data = await r.json();
    
    console.log('Telegram API response:', {
      ok: data.ok,
      status: r.status,
      description: data.description,
      result: data.result
    });
    
    return data;
  } catch (e) {
    console.error('Failed to fetch from Telegram API:', e.message);
    return { ok: false, description: 'network_error' };
  }
}

/** Cek join channel; prioritas TG_CHANNEL_ID, fallback username/URL kalau ada */
export async function checkMembership(userId) {
  if (!BOT_TOKEN) {
    console.error('Missing bot token for membership check');
    return { isMember: false, reason: 'missing_bot_token' };
  }
  
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    console.error('Invalid user ID for membership check:', userId);
    return { isMember: false, reason: 'invalid_user_id' };
  }

  let chat = null;
  
  // Prioritas: TG_CHANNEL_ID (untuk channel private/public dengan ID numerik)
  if (process.env.TG_CHANNEL_ID) {
    chat = process.env.TG_CHANNEL_ID;
  } 
  // Fallback: username channel
  else if (process.env.TG_CHANNEL_USERNAME) {
    chat = '@' + process.env.TG_CHANNEL_USERNAME.replace(/^@/, '');
  } 
  // Fallback: extract dari URL
  else if (process.env.TG_CHANNEL_URL) {
    const m = process.env.TG_CHANNEL_URL.match(/t\.me\/(?:c\/)?([^\/?#]+)/i);
    if (m) chat = '@' + m[1];
  }
  
  if (!chat) {
    console.error('No chat configuration found');
    return { isMember: false, reason: 'no_chat_config' };
  }

  console.log('Checking membership for:', { userId: uid, chat });

  try {
    const data = await tgGetMember(chat, uid);
    
    if (!data?.ok) {
      console.error('Telegram API error:', data?.description);
      return { 
        isMember: false, 
        chat, 
        reason: data?.description || 'tg_api_not_ok',
        apiResponse: data
      };
    }

    const res = data.result || {};
    const status = res.status;
    
    console.log('Member status:', { userId: uid, status, isMember: res.is_member });

    // Check if user is a member
    if (OK.has(status)) {
      return { isMember: true, status, chat };
    }
    
    // Special case: restricted but still member
    if (status === 'restricted' && res.is_member === true) {
      return { isMember: true, status: 'restricted(is_member=true)', chat };
    }
    
    return { 
      isMember: false, 
      status: status || null, 
      chat, 
      reason: 'not_member',
      apiResponse: res
    };
  } catch (e) {
    console.error('Membership check failed:', e.message);
    return { 
      isMember: false, 
      chat, 
      reason: 'check_failed', 
      error: e.message 
    };
  }
}