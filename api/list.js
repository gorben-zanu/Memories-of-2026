import { list } from '@vercel/blob';

async function all(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) // newest first
    .map((b) => ({ src: b.url }));
}

export default async function handler(req, res) {
  try {
    const [pictures, videos] = await Promise.all([all('Pictures/'), all('Videos/')]);
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
    res.status(200).json({ pictures, videos });
  } catch (err) {
    res.status(500).json({ error: 'Storage is not set up' });
  }
}
