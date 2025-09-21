// src/api.js
function resolveInitData() {
  let s = '';

  // 1) Telegram WebApp - prioritas utama
  try { 
    s = window?.Telegram?.WebApp?.initData || ''; 
    if (s) {
      console.log('Got initData from Telegram WebApp:', s.length, 'chars');
    }
  } catch (e) {
    console.warn('Failed to get initData from Telegram WebApp:', e.message);
  }

  // 2) hash (#tgWebAppData=...)
  if (!s && typeof window !== 'undefined') {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      s = hash.get('tgWebAppData') || hash.get('initData') || '';
      if (s) {
        console.log('Got initData from URL hash:', s.length, 'chars');
      }
    } catch (e) {
      console.warn('Failed to parse hash:', e.message);
    }
  }

  // 3) query (?tgWebAppData=...)
  if (!s && typeof window !== 'undefined') {
    try {
      const qs = new URLSearchParams(window.location.search);
      s = qs.get('tgWebAppData') || qs.get('initData') || qs.get('init') || '';
      if (s) {
        console.log('Got initData from URL query:', s.length, 'chars');
      }
    } catch (e) {
      console.warn('Failed to parse query string:', e.message);
    }
  }

  // 4) cache - simpan dan ambil dari sessionStorage
  if (s) {
    try {
      sessionStorage.setItem('tgInitData', s);
      console.log('Cached initData to sessionStorage');
    } catch (e) {
      console.warn('Failed to cache initData:', e.message);
    }
  }
  
  if (!s) {
    try {
      s = sessionStorage.getItem('tgInitData') || '';
      if (s) {
        console.log('Retrieved initData from cache:', s.length, 'chars');
      }
    } catch (e) {
      console.warn('Failed to retrieve cached initData:', e.message);
    }
  }

  return s || '';
}

export function getInitData() {
  try { 
    window?.Telegram?.WebApp?.ready?.(); 
  } catch (e) {
    console.warn('Failed to call Telegram WebApp ready:', e.message);
  }
  
  const initData = resolveInitData();
  console.log('Final initData:', {
    hasData: !!initData,
    length: initData.length,
    preview: initData ? initData.substring(0, 50) + '...' : 'empty'
  });
  
  return initData;
}

async function j(method, url, body) {
  const initData = getInitData();
  
  if (!initData) {
    console.error('No initData available for API call');
    throw new Error('No Telegram initData available');
  }

  // Kirim initData via multiple channels untuk memastikan backend bisa ambil
  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-Init': initData,
    'X-Telegram-Init-Data': initData,
    'X-TG-Init-Data': initData,
    'X-TG-InitData': initData,
  };

  // Tambahkan initData ke body juga
  const payload = body ? { ...body, initData } : { initData };

  // Tambahkan ke query string sebagai fallback
  const queryParam = 'init=' + encodeURIComponent(initData);
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = url + separator + queryParam;

  console.log('Making API request:', {
    method,
    url: finalUrl.replace(initData, 'INIT_DATA'),
    hasBody: !!body,
    headersCount: Object.keys(headers).length
  });

  try {
    const r = await fetch(finalUrl, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(payload),
    });

    let data = {};
    try { 
      data = await r.json(); 
    } catch (e) {
      console.warn('Failed to parse response JSON:', e.message);
    }

    console.log('API response:', {
      status: r.status,
      ok: r.ok,
      hasData: !!Object.keys(data).length
    });

    if (!r.ok) {
      const err = new Error(data?.error || r.statusText || 'Request failed');
      err.status = r.status; 
      err.data = data;
      throw err;
    }
    
    return data;
  } catch (e) {
    console.error('API request failed:', {
      message: e.message,
      status: e.status,
      url: url
    });
    throw e;
  }
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