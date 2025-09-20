// ESM
export default function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, x-tg-init-data, x-tg-initdata, x-telegram-init-data, authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // sudah ditangani
  }
  return false;
}
