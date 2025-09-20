// api/_debug/tg-selftest.js
import { ensureTgUser } from '../_utils/telegram.js';

export default async function handler(req, res) {
  const get = req.headers?.get?.bind(req.headers);
  const h = (k) => (get ? get(k) : req.headers[k]);

  const headerInit =
    h('x-telegram-init') ||
    h('x-telegram-init-data') ||
    h('x-tg-init-data') || '';

  const bodyInit = (req.body && req.body.initData) || '';
  const queryInit = (() => { try { return new URL(req.url,'http://x').searchParams.get('init') || ''; } catch { return ''; }})();
  const token = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

  const info = {
    haveToken: !!token,
    tokenPrefix: token ? token.slice(0, 8) : null,
    haveInitHeader: !!headerInit,
    haveInitBody: !!bodyInit,
    haveInitQuery: !!queryInit,
    initLen: (queryInit || bodyInit || headerInit || '').length,
  };

  try {
    const { user } = ensureTgUser(req);
    info.signature = 'ok';
    info.userId = user?.id;
    return res.status(200).json(info);
  } catch (e) {
    info.error = e?.message || 'bad_init_data';
    return res.status(e?.status || 401).json(info);
  }
}
