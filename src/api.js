const base = ''; // same-origin

function tgInitData() {
  try { return window?.Telegram?.WebApp?.initData || ''; } catch { return ''; }
}

async function j(method, url, body) {
  const r = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-tg-init-data': tgInitData(), // <-- penting untuk verifikasi server
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error || r.statusText), { status: r.status, data });
  return data;
}

export const api = {
  ads: {
    start: () => j('POST', '/api/ads/start'),
    verify: (session, sig) => j('POST', '/api/ads/verify', { session, sig }),
  },
  subscribe: {
    start: (provider) => j('POST', '/api/subscribe/start', { provider }),
    verify: (provider) => j('POST', '/api/subscribe/verify', { provider }), // userId tidak perlu (server ambil dari header)
  },
  withdraw: {
    create: (payload) => j('POST', '/api/withdraw/create', payload),
  },
};
