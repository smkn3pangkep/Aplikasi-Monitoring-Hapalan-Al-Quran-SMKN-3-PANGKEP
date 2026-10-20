import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard App Icon SVG (512x512)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background rounded rectangle -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />

  <!-- Subtle Islamic 8-Point Star Geometric Aura -->
  <g opacity="0.12" fill="#ffffff">
    <rect x="156" y="156" width="200" height="200" rx="20" transform="rotate(0 256 256)" />
    <rect x="156" y="156" width="200" height="200" rx="20" transform="rotate(45 256 256)" />
  </g>

  <!-- Outer Decorative Ring -->
  <circle cx="256" cy="256" r="216" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.35" stroke-dasharray="12 8" />

  <!-- Main Open Quran Graphic -->
  <g filter="url(#shadow)" transform="translate(0, -10)">
    <!-- Book Base / Stand (Rehal) -->
    <path d="M190 340 L256 295 L322 340 L350 325 L256 265 L162 325 Z" fill="url(#goldGrad)" opacity="0.9" />

    <!-- Left Book Page -->
    <path d="M256 280 C210 270 140 250 110 215 C108 213 106 170 106 160 C138 185 210 210 256 220 Z" fill="url(#bookGrad)" />
    <!-- Left Page Accent Lines -->
    <path d="M136 195 C170 212 220 226 246 232" stroke="#047857" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />
    <path d="M142 215 C176 228 220 240 246 245" stroke="#047857" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    <path d="M152 235 C182 245 220 254 246 258" stroke="#047857" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />

    <!-- Right Book Page -->
    <path d="M256 280 C302 270 372 250 402 215 C404 213 406 170 406 160 C374 185 302 210 256 220 Z" fill="url(#bookGrad)" />
    <!-- Right Page Accent Lines -->
    <path d="M376 195 C342 212 292 226 266 232" stroke="#047857" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />
    <path d="M370 215 C336 228 292 240 266 245" stroke="#047857" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    <path d="M360 235 C330 245 292 254 266 258" stroke="#047857" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />

    <!-- Center Binding Ribbon -->
    <path d="M254 218 L258 218 L258 310 L256 315 L254 310 Z" fill="url(#goldGrad)" />
  </g>

  <!-- Islamic Crescent & Star Emblem Above Quran -->
  <g transform="translate(256, 125) scale(0.75)">
    <circle cx="0" cy="0" r="30" fill="url(#goldGrad)" />
    <circle cx="8" cy="-6" r="24" fill="#047857" />
    <polygon points="12,-4 15,4 7,0 17,0 9,4" fill="url(#goldGrad)" transform="translate(4, -8) scale(1.1)" />
  </g>

  <!-- Typography: SMKN 3 PANGKEP & JUZ 30 -->
  <text x="256" y="390" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">SMKN 3 PANGKEP</text>
  <rect x="186" y="408" width="140" height="30" rx="15" fill="url(#goldGrad)" />
  <text x="256" y="429" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#064e3b" letter-spacing="1.5">TAHFIDZ JUZ 30</text>
</svg>`;

// 2. Maskable Icon SVG (with safe-zone 15% padding so corners never get clipped on Android squircles/circles)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background extending to canvas edge -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Scaled content to fit strictly within 80% safe circle (radius 204px from center 256, 256) -->
  <g transform="translate(51, 51) scale(0.8)">
    <!-- Decorative Ring inside safe zone -->
    <circle cx="256" cy="256" r="216" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.35" stroke-dasharray="12 8" />

    <!-- Open Quran Graphic -->
    <g transform="translate(0, -10)">
      <path d="M190 340 L256 295 L322 340 L350 325 L256 265 L162 325 Z" fill="url(#goldGrad)" opacity="0.9" />

      <!-- Left Page -->
      <path d="M256 280 C210 270 140 250 110 215 C108 213 106 170 106 160 C138 185 210 210 256 220 Z" fill="url(#bookGrad)" />
      <path d="M136 195 C170 212 220 226 246 232" stroke="#047857" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />
      <path d="M142 215 C176 228 220 240 246 245" stroke="#047857" stroke-width="3" stroke-linecap="round" opacity="0.6" />
      <path d="M152 235 C182 245 220 254 246 258" stroke="#047857" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />

      <!-- Right Page -->
      <path d="M256 280 C302 270 372 250 402 215 C404 213 406 170 406 160 C374 185 302 210 256 220 Z" fill="url(#bookGrad)" />
      <path d="M376 195 C342 212 292 226 266 232" stroke="#047857" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />
      <path d="M370 215 C336 228 292 240 266 245" stroke="#047857" stroke-width="3" stroke-linecap="round" opacity="0.6" />
      <path d="M360 235 C330 245 292 254 266 258" stroke="#047857" stroke-width="2.5" stroke-linecap="round" opacity="0.5" />

      <!-- Center Binding Ribbon -->
      <path d="M254 218 L258 218 L258 310 L256 315 L254 310 Z" fill="url(#goldGrad)" />
    </g>

    <!-- Emblem Above Quran -->
    <g transform="translate(256, 125) scale(0.75)">
      <circle cx="0" cy="0" r="30" fill="url(#goldGrad)" />
      <circle cx="8" cy="-6" r="24" fill="#047857" />
      <polygon points="12,-4 15,4 7,0 17,0 9,4" fill="url(#goldGrad)" transform="translate(4, -8) scale(1.1)" />
    </g>

    <!-- Typography -->
    <text x="256" y="390" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">SMKN 3 PANGKEP</text>
    <rect x="186" y="408" width="140" height="30" rx="15" fill="url(#goldGrad)" />
    <text x="256" y="429" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#064e3b" letter-spacing="1.5">TAHFIDZ JUZ 30</text>
  </g>
</svg>`;

async function generateAll() {
  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('Saved public/icon.svg');

  const standardBuf = Buffer.from(standardSvg);
  const maskableBuf = Buffer.from(maskableSvg);

  // Generate pwa-192x192.png
  await sharp(standardBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // Generate pwa-512x512.png
  await sharp(standardBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // Generate pwa-maskable-512x512.png
  await sharp(maskableBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(standardBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // Generate favicon-32x32.png and favicon.ico
  await sharp(standardBuf)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated public/favicon.png');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
