import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const srcImage = path.resolve('public/assets/aistudio/file_00000000572c820b9cd2deb0eff7516b_d2e1c2a4.png');
const publicDir = path.resolve('public');

// Perfectly centered square bounding box of the squircle
// Center is (627, 628), width/height = 1160
const CROP_BOX = { left: 47, top: 48, width: 1160, height: 1160 };

// Mask for 512x512 rounded squircle (transparent outside corners)
const SQUIRCLE_MASK_512 = Buffer.from(
  '<svg width="512" height="512"><rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="#000"/></svg>'
);

async function processIcons() {
  console.log('Processing precisely centered icons from:', srcImage);

  // 1. Generate 512x512 master centered icon with transparent corners
  const centered512Buffer = await sharp(srcImage)
    .extract(CROP_BOX)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .composite([{ input: SQUIRCLE_MASK_512, blend: 'dest-in' }])
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  // Save app-logo.png and pwa-512x512.png
  await sharp(centered512Buffer).toFile(path.join(publicDir, 'app-logo.png'));
  console.log('Saved public/app-logo.png (precisely centered)');

  await sharp(centered512Buffer).toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // 2. pwa-192x192.png
  await sharp(centered512Buffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // 3. apple-touch-icon.png (180x180) - iOS applies its own rounded corners
  const apple180 = await sharp(srcImage)
    .extract(CROP_BOX)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .composite([{
      input: Buffer.from('<svg width="180" height="180"><rect x="0" y="0" width="180" height="180" rx="39" ry="39" fill="#000"/></svg>'),
      blend: 'dest-in'
    }])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');

  // 4. pwa-maskable-512x512.png (80% safe zone centered at 256, 256)
  const innerResized = await sharp(centered512Buffer)
    .resize(410, 410, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 6, g: 78, b: 59, alpha: 1 }, // #064e3b
    },
  })
    .composite([
      {
        input: innerResized,
        top: 51,
        left: 51,
      },
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved public/pwa-maskable-512x512.png (precisely centered maskable)');

  // 5. favicon.png (32x32)
  await sharp(centered512Buffer)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved public/favicon.png');

  console.log('All icons generated with pixel-perfect precision!');
}

processIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
