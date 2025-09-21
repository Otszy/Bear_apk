// api/subscribe/verify.js
import { ensureTgUser, checkMembership } from '../_utils/telegram.js';
import cors from '../_utils/cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  console.log('=== Subscribe Verify Request ===');
  console.log('Method:', req.method);
  console.log('Headers keys:', Object.keys(req.headers || {}));
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body type:', typeof req.body);
  console.log('Raw body:', req.body);

  try {
    // Parse body untuk berbagai runtime
    let body = req.body;
    
    // Untuk Edge Runtime atau jika body belum terparsing
    if (!body && typeof req.json === 'function') {
      try {
        body = await req.json();
        console.log('Parsed body from req.json():', body);
      } catch (e) {
        console.warn('Failed to parse JSON body:', e.message);
      }
    }
    
    // Untuk Node.js runtime, body mungkin sudah terparsing
    if (!body && req.body) {
      body = req.body;
      console.log('Using req.body directly:', body);
    }
    
    // Jika body masih string, coba parse
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log('Parsed string body to object:', body);
      } catch (e) {
        console.warn('Body is string but not JSON:', body);
      }
    }

    // Validasi user dari Telegram
    console.log('Attempting to validate Telegram user...');
    const { user } = ensureTgUser(req, body);
    console.log('User validated successfully:', { userId: user.id, username: user.username });

    const provider = body?.provider;
    if (!provider) {
      console.error('Missing provider in request body');
      return res.status(400).json({ error: 'provider_required' });
    }

    console.log('Provider:', provider);

    if (provider === 'tg') {
      console.log('Checking Telegram channel membership...');
      const membershipResult = await checkMembership(user.id);
      
      console.log('Membership check result:', JSON.stringify(membershipResult, null, 2));
      
      if (!membershipResult.isMember) {
        return res.status(200).json({ 
          valid: false, 
          amount: 0, 
          reason: membershipResult.reason, 
          status: membershipResult.status || null, 
          chat: membershipResult.chat || null,
          debug: {
            userId: user.id,
            apiResponse: membershipResult.apiResponse
          }
        });
      }
      
      console.log('User is a member, granting reward');
      return res.status(200).json({ 
        valid: true, 
        amount: 0.002,
        status: membershipResult.status,
        chat: membershipResult.chat
      });
    }

    if (provider === 'x') {
      console.log('X/Twitter verification (placeholder)');
      return res.status(200).json({ valid: false, amount: 0 });
    }

    console.error('Unknown provider:', provider);
    return res.status(400).json({ error: 'unknown_provider' });

  } catch (e) {
    console.error('Subscribe verify error:', {
      message: e.message,
      status: e.status,
      stack: e.stack
    });
    
    return res.status(e.status || 401).json({ 
      error: e.message || 'unauthorized',
      debug: {
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });
  }
}