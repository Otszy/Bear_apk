// src/api.js
const base = ''; // same-origin

function initData() {
  try { return window?.Telegram?.WebApp?.initData || ''; } catch { return ''; }
}

async function j(method, url, body) {
  const r = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init': initData(),   // <- PENTING: kirim initData
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error || r.statusText), { status: r.status, data });
  return data;
}

export const api = {
  ads: {
    start: (userId) => j('POST', '/api/ads/start', { userId }),
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
