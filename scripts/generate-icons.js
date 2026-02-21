/**
 * Production icon generator: creates correctly sized PWA and favicon assets from public/logo.png.
 * Run before build: npm run generate-icons
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SRC = join(PUBLIC, 'logo.png');

const BACKGROUND = { r: 12, g: 10, b: 9 }; // #0c0a09 theme

const SIZES = [
  { name: 'icon-192.png', width: 192, height: 192 },
  { name: 'icon-512.png', width: 512, height: 512 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
  { name: 'favicon-32.png', width: 32, height: 32 },
];

if (!existsSync(SRC)) {
  console.error('Missing public/logo.png. Add your logo there and run again.');
  process.exit(1);
}

async function generate() {
  for (const { name, width, height } of SIZES) {
    const out = join(PUBLIC, name);
    await sharp(SRC)
      .resize(width, height, { fit: 'contain', background: BACKGROUND })
      .png()
      .toFile(out);
    console.log(`Generated ${name} (${width}x${height})`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
