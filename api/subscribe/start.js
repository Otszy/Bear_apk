export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*')
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { provider } = req.body || {}
if (!provider) return res.status(400).json({ error: 'provider_required' })


// Untuk demo: arahkan ke channel / profile
if (provider === 'tg') {
const joinUrl = 'https://t.me/bearappofficial'
return res.status(200).json({ joinUrl })
}
if (provider === 'x') {
const joinUrl = 'https://x.com/' // ganti ke akun kamu kalau ada
return res.status(200).json({ joinUrl })
}
return res.status(400).json({ error: 'unknown_provider' })
}
