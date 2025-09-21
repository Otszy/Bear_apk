// src/api.js
function resolveInitData() {
  let s = '';

  // 1) Telegram WebApp
  try { s = window?.Telegram?.WebApp?.initData || ''; } catch {}

  // 2) hash (#tgWebAppData=...)
  if (!s && typeof window !== 'undefined') {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    s = hash.get('tgWebAppData') || '';
  }

  // 3) query (?tgWebAppData=...)
  if (!s && typeof window !== 'undefined') {
    const qs = new URLSearchParams(window.location.search);
    s = qs.get('tgWebAppData') || '';
  }

  // 4) cache
  if (s) sessionStorage.setItem('tgInitData', s);
  if (!s) s = sessionStorage.getItem('tgInitData') || '';

  return s || '';
}

export function getInitData() {
  try { window?.Telegram?.WebApp?.ready?.(); } catch {}
  return resolveInitData();
}

async function j(method, url, body) {
  const initData = getInitData();
  const payload = body ? { ...body, initData } : { initData };

  // kirim via header + body + query (anti miss)
  const q = initData ? ((url.includes('?') ? '&' : '?') + 'init=' + encodeURIComponent(initData)) : '';
  const r = await fetch(url + q, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init': initData,
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  });

  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const err = new Error(data?.error || r.statusText || 'Request failed');
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  ads: {
    start: () => j('POST', '/api/ads/start'),
    verify: (session, sig) => j('POST', '/api/ads/verify', { session, sig }),
  },
  subscribe: {
    start: (provider) => j('POST', '/api/subscribe/start', { provider }),
    verify: (provider) => j('POST', '/api/subscribe/verify', { provider }),
  },
  withdraw: {
    create: (payload) => j('POST', '/api/withdraw/create', payload),
  },
};
