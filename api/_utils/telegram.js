export async function isMemberOfChannel(userId) {
  const BOT_TOKEN =
    process.env.TG_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN;

  const chat = process.env.TG_CHANNEL_ID; // WAJIB: -100XXXXXXXXXX
  if (!BOT_TOKEN) return false;
  if (!chat) return false; // tidak ada config

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat)}&user_id=${userId}`;
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!data.ok) return false;

  const s = data.result?.status;
  return s && s !== 'left' && s !== 'kicked';
}
