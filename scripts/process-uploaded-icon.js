import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const srcImage = path.resolve('public/assets/aistudio/file_00000000572c820b9cd2deb0eff7516b_d2e1c2a4.png');
const publicDir = path.resolve('public');

async function processIcons() {
  console.log('Processing uploaded icon from:', srcImage);

  // 1. Master logo copy for UI
  await sharp(srcImage)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'app-logo.png'));
  console.log('Created public/app-logo.png');

  // 2. pwa-512x512.png (purpose: "any")
  await sharp(srcImage)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 3. pwa-192x192.png (purpose: "any")
  await sharp(srcImage)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 4. apple-touch-icon.png (180x180 for iOS Safari home screen)
  await sharp(srcImage)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 5. pwa-maskable-512x512.png (purpose: "maskable" with 15% safe-zone margin)
  // We place an 80% resized icon (410x410) centered on a 512x512 canvas filled with the deep green #064e3b
  const innerResized = await sharp(srcImage)
    .resize(410, 410, { kernel: sharp.kernel.lanczos3 })
    .png()
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
  console.log('Created public/pwa-maskable-512x512.png (safe-zone padded)');

  // 6. Favicon 32x32 & 64x64
  await sharp(srcImage)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created public/favicon.png');

  console.log('All PWA icon assets generated successfully from user upload!');
}

processIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
