// api/_utils/telegram.js
import crypto from 'node:crypto';

const BOT_TOKEN =
  process.env.TG_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

// ------- helpers -------
function pickHeader(req, key) { const g=req.headers?.get?.bind(req.headers); return g?g(key):req.headers[key]; }
function pickQuery(req){ try{ const u=new URL(req.url,'http://x'); return u.searchParams.get('init')||u.searchParams.get('initData')||u.searchParams.get('tgWebAppData')||'';}catch{return '';}}

// ------- auth (initData) -------
export function ensureTgUser(req){
  let initData =
    pickHeader(req,'x-telegram-init') ||
    pickHeader(req,'x-telegram-init-data') ||
    pickHeader(req,'x-tg-init-data');
  if(!initData && req.body && typeof req.body.initData==='string') initData=req.body.initData;
  if(!initData) initData=pickQuery(req);

  if(process.env.TG_DISABLE_SIGNATURE==='true'){
    const p=new URLSearchParams(initData||''); const userRaw=p.get('user'); const user=userRaw?JSON.parse(userRaw):{id:0};
    return { user };
  }
  return verifyInitData(initData);
}

function verifyInitData(initData){
  if(!BOT_TOKEN) throw Object.assign(new Error('missing_bot_token'),{status:401});
  if(!initData)  throw Object.assign(new Error('missing_initdata'),{status:401});

  const p=new URLSearchParams(initData); const hash=p.get('hash'); p.delete('hash');
  const dataCheck=Array.from(p.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');

  const secret=crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest();
  const sig=crypto.createHmac('sha256',secret).update(dataCheck).digest('hex');
  if(sig!==hash) throw Object.assign(new Error('signature_mismatch'),{status:401});

  const authDate=parseInt(p.get('auth_date')||'0',10)*1000;
  if(!authDate || Date.now()-authDate>24*60*60*1000) throw Object.assign(new Error('initdata_expired'),{status:401});

  const userRaw=p.get('user'); const user=userRaw?JSON.parse(userRaw):null;
  if(!user?.id) throw Object.assign(new Error('no_user_in_initdata'),{status:401});
  return { user };
}

// ------- membership -------
const OK = new Set(['member','administrator','creator']);

async function tgGetMember(chat, userId){
  const url=`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${userId}`;
  const r=await fetch(url); const data=await r.json().catch(()=>({}));
  return data;
}

/** Cek di satu atau dua chat, balikin detail alasan */
export async function checkMembership(userId){
  if(!BOT_TOKEN) return { isMember:false, reason:'missing_bot_token' };

  // PAKAI ID SAJA (disarankan). Isi ENV: TG_CHANNEL_ID = -100xxxxxxxxxx
  const chats=[];
  if(process.env.TG_CHANNEL_ID) chats.push(process.env.TG_CHANNEL_ID);
  // opsional: cek juga grup diskusi jika memang dipakai
  if(process.env.TG_DISCUSSION_ID) chats.push(process.env.TG_DISCUSSION_ID);

  if(!chats.length) return { isMember:false, reason:'no_chat_config' };

  let last=null;
  for(const chat of chats){
    const data=await tgGetMember(chat, userId);
    if(!data?.ok){ last={ isMember:false, chat, reason:data?.description||'tg_api_not_ok' }; continue; }
    const res=data.result||{}; const s=res.status;
    if(OK.has(s)) return { isMember:true, status:s, chat };
    if(s==='restricted' && res.is_member===true) return { isMember:true, status:'restricted(is_member=true)', chat };
    last={ isMember:false, chat, status:s||null, reason:'not_member' };
  }
  return last || { isMember:false, reason:'not_member' };
}
