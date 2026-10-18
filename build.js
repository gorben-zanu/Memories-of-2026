// Scans ./Pictures and ./Videos, copies everything into ./dist and writes dist/manifest.json.
// Vercel runs this on every deploy, so new files in those folders show up automatically.
import fs from 'node:fs';
import path from 'node:path';

const IMG = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VID = /\.(mp4|webm|mov|m4v|ogg)$/i;
const OUT = 'dist';

const scan = (dir, re) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir)
        .filter((f) => re.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => ({ src: `${dir}/${encodeURIComponent(f)}` }))
    : [];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const d of ['Pictures', 'Videos']) {
  if (fs.existsSync(d)) fs.cpSync(d, path.join(OUT, d), { recursive: true });
}
for (const f of ['index.html', 'upload-client.js']) {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(OUT, f));
}

const manifest = { pictures: scan('Pictures', IMG), videos: scan('Videos', VID) };
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Built: ${manifest.pictures.length} pictures, ${manifest.videos.length} videos`);
