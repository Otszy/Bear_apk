function getInitData() {
  try { return window?.Telegram?.WebApp?.initData || ''; } catch { return ''; }
}

async function j(method, url, body) {
  const initData = getInitData();
  const payload = body ? { ...body, initData } : { initData };

  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init': initData, // tetap kirim di header
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  });

  let data = {}; try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(data?.error || r.statusText); e.status = r.status; e.data = data; throw e; }
  return data;
}
