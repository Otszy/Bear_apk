import crypto from 'crypto'


const MIN_WATCH_MS = 5000
const REWARD = 0.002


function decode(session) {
try { return JSON.parse(Buffer.from(session, 'base64url').toString('utf8')) } catch { return null }
}


export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*')
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { session, sig } = req.body || {}
const secret = process.env.SERVER_SECRET
if (!secret) return res.status(500).json({ error: 'SERVER_SECRET not set' })


const expect = crypto.createHmac('sha256', secret).update(String(session || '')).digest('base64url')
if (!session || !sig || sig !== expect) return res.status(400).json({ error: 'invalid_signature' })


const payload = decode(session)
if (!payload) return res.status(400).json({ error: 'bad_session' })


const watched = Date.now() - Number(payload.t)
if (watched < MIN_WATCH_MS) return res.status(400).json({ error: 'watch_too_short', watched })


// TODO: catat ke DB (Supabase) -> task completion & ledger
return res.status(200).json({ awarded: true, amount: REWARD, watched })
}
