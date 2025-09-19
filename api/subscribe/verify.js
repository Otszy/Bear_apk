const OK = new Set(['member', 'administrator', 'creator'])
const REWARD = 0.002


export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*')
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { provider, userId } = req.body || {}
if (!provider || !userId) return res.status(400).json({ error: 'provider_and_userId_required' })


if (provider === 'tg') {
const token = process.env.TELEGRAM_BOT_TOKEN
const channel = process.env.TELEGRAM_CHANNEL || '@bearappofficial'
if (!token) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' })


const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${encodeURIComponent(userId)}`
try {
const r = await fetch(url)
const j = await r.json()
if (!j.ok) return res.status(400).json({ error: 'telegram_api_error', detail: j })
const status = j.result?.status
const valid = OK.has(status)
if (!valid) return res.status(200).json({ valid: false, status })


// TODO: catat ke DB & idempoten
return res.status(200).json({ valid: true, awarded: true, amount: REWARD, status })
} catch (e) {
return res.status(500).json({ error: 'fetch_failed', detail: String(e) })
}
}


if (provider === 'x') {
// Tanpa API X, kita nggak bisa verifikasi otomatis. Kamu bisa pakai bukti manual nanti.
return res.status(200).json({ valid: true, awarded: true, amount: REWARD, note: 'X verification stub' })
}


return res.status(400).json({ error: 'unknown_provider' })
}
```


## `api/withdraw/create.js`
```js
export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*')
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { userId = 'demo-user', amount, address, memo = '', network = '' } = req.body || {}
if (!amount || !address) return res.status(400).json({ error: 'amount_and_address_required' })


const id = 'wd_' + Math.random().toString(36).slice(2)


// TODO: simpan ke Supabase nanti
// contoh payload yang perlu kamu simpan: { id, userId, amount, address, memo, network, status: 'pending', createdAt: new Date().toISOString() }


res.status(200).json({ ok: true, id })
}
