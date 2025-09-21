// api/_debug/tg-selftest.js
import { ensureTgUser } from '../_utils/telegram.js';
import cors from '../_utils/cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (cors(req, res)) return;

  console.log('=== Telegram Self Test ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  const get = req.headers?.get?.bind(req.headers);
  const h = (k) => (get ? get(k) : req.headers[k]);

  const headerInit =
    h('x-telegram-init') ||
    h('x-telegram-init-data') ||
    h('x-tg-init-data') ||
    h('x-tg-initdata') || '';

  let bodyInit = '';
  let body = req.body;
  
  // Parse body if needed
  if (typeof req.json === 'function' && !body) {
    try {
      body = await req.json();
    } catch (e) {
      console.warn('Failed to parse JSON body:', e.message);
      body = null;
    }
  }
  
  if (body && body.initData) {
    bodyInit = body.initData;
  }

  const queryInit = (() => { 
    try { 
      return new URL(req.url, 'http://x').searchParams.get('init') || 
             new URL(req.url, 'http://x').searchParams.get('initData') || 
             new URL(req.url, 'http://x').searchParams.get('tgWebAppData') || ''; 
    } catch { 
      return ''; 
    }
  })();

  const token = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

  const info = {
    timestamp: new Date().toISOString(),
    haveToken: !!token,
    tokenPrefix: token ? token.slice(0, 8) + '...' : null,
    haveInitHeader: !!headerInit,
    haveInitBody: !!bodyInit,
    haveInitQuery: !!queryInit,
    headerInitLen: headerInit.length,
    bodyInitLen: bodyInit.length,
    queryInitLen: queryInit.length,
    totalInitLen: (queryInit || bodyInit || headerInit || '').length,
    initSources: {
      header: headerInit ? headerInit.substring(0, 50) + '...' : null,
      body: bodyInit ? bodyInit.substring(0, 50) + '...' : null,
      query: queryInit ? queryInit.substring(0, 50) + '...' : null
    }
  };

  console.log('Self test info:', info);

  try {
    const { user } = ensureTgUser(req, body);
    info.signature = 'ok';
    info.userId = user?.id;
    info.username = user?.username;
    console.log('Validation successful:', { userId: user.id, username: user.username });
    return res.status(200).json(info);
  } catch (e) {
    info.error = e?.message || 'bad_init_data';
    info.errorStatus = e?.status;
    console.error('Validation failed:', { error: e.message, status: e.status });
    return res.status(e?.status || 401).json(info);
  }
}