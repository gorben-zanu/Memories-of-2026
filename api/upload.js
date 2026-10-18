import { handleUpload } from '@vercel/blob/client';
import { createHash, timingSafeEqual } from 'node:crypto';

const MAX_BYTES = 500 * 1024 * 1024; // per file
const TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v',
];

const sha = (s) => createHash('sha256').update(String(s)).digest();
function passwordOk(given) {
  const real = process.env.UPLOAD_PASSWORD;
  if (!real || typeof given !== 'string') return false; // no password set = nobody gets in
  return timingSafeEqual(sha(given), sha(real));
}
const slow = () => new Promise((r) => setTimeout(r, 800)); // makes password guessing painfully slow

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  // simple "is this password right?" check used by the upload form
  if (body && body.type === 'check-password') {
    if (passwordOk(body.password)) return res.status(200).json({ ok: true });
    await slow();
    return res.status(401).json({ error: 'Wrong password' });
  }

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!passwordOk(clientPayload)) {
          await slow();
          throw new Error('Wrong password');
        }
        if (!/^(Pictures|Videos)\/[\w.\-]+$/.test(pathname)) throw new Error('Bad file path');
        return {
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
