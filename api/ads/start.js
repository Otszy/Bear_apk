import crypto from 'crypto'


const MIN_WATCH_MS = 5000 // contoh 5 detik buat demo


export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*')
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { userId = 'demo-user' } = req.body || {}
const secret = process.env.SERVER_SECRET
if (!secret) return res.status(500).json({ error: 'SERVER_SECRET not set' })


const payload = { u: String(userId), t: Date.now(), k: 'ads' }
const session = Buffer.from(JSON.stringify(payload)).toString('base64url')
const sig = crypto.createHmac('sha256', secret).update(session).digest('base64url')


// URL iklan dummy (kamu bisa ganti ke network ads kamu)
const adUrl = 'https://example.com/ad'


res.status(200).json({ session, sig, minWatchMs: MIN_WATCH_MS, adUrl })
}
