// src/api.js
const base = ''; // same-origin. Kalau backend beda domain, isi dengan URL backend kamu.

function getInitData() {
  try {
    return window?.Telegram?.WebApp?.initData || '';
  } catch {
    return '';
  }
}

async function j(method, url, body) {
  const r = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init': getInitData(), // <- penting: kirim initData ke server
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try { data = await r.json(); } catch {}

  if (!r.ok) {
    const err = new Error(data?.error || r.statusText || 'Request failed');
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  ads: {
    start: () => j('POST', '/api/ads/start'), // userId TIDAK dikirim dari client
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
