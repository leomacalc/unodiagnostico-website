#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const IMAGES = {
  'public/images/logos/logo.png': 'https://unodiagnostico.com/wp-content/uploads/2020/08/LOGO.png',
  'public/images/logos/logo-verde.png': 'https://unodiagnostico.com/wp-content/uploads/2025/08/cropped-cropped-logo-verde-2.png',
  'public/images/doctors/leonardo.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/leonardo.png',
  'public/images/doctors/tacio.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/image29.png',
  'public/images/insurance/umied.png': 'https://unodiagnostico.com/wp-content/uploads/2021/06/UMIED.png',
  'public/images/insurance/camed.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/LOGO-CAMED-1.png',
  'public/images/insurance/livsaude.png': 'https://unodiagnostico.com/wp-content/uploads/2025/06/livsaude.png',
  'public/images/insurance/fusex.png': 'https://unodiagnostico.com/wp-content/uploads/2022/05/Fusex-e1652111552211.png',
  'public/images/insurance/issec.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/LOGO-ISSEC-FINAL-1.png',
  'public/images/gallery/clinica-exterior.jpg': 'https://unodiagnostico.com/wp-content/uploads/2024/10/UNO_SITE-e1743174232874.jpg',
  'public/images/gallery/recepcao.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/FOTO-4-min.png',
  'public/images/gallery/sala-exames.png': 'https://unodiagnostico.com/wp-content/uploads/2021/08/FOTO-7-min.png',
  'public/images/banner-hero.png': 'https://unodiagnostico.com/wp-content/uploads/2026/03/BANNER_____122211-copiar.png',
  'public/images/banner-secondary.png': 'https://unodiagnostico.com/wp-content/uploads/2021/06/Banner.png'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log('  [SKIP] ' + dest);
      resolve();
      return;
    }
    const protocol = url.startsWith('https') ? https : http;
    const request = (currentUrl, redirects) => {
      if (redirects > 5) { reject(new Error('Too many redirects')); return; }
      protocol.get(currentUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VercelBot/1.0)', 'Accept': 'image/*,*/*' }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location, redirects + 1);
          return;
        }
        if (response.statusCode !== 200) { reject(new Error('HTTP ' + response.statusCode)); return; }
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(dest).size;
          console.log('  [OK] ' + dest + ' (' + (size / 1024).toFixed(1) + 'KB)');
          resolve();
        });
        file.on('error', reject);
      }).on('error', reject);
    };
    request(url, 0);
  });
}

async function main() {
  console.log('=== Downloading images from WordPress ===');
  let success = 0, failed = 0;
  for (const [dest, url] of Object.entries(IMAGES)) {
    try { await downloadFile(url, dest); success++; }
    catch (err) { console.log('  [FAIL] ' + dest + ': ' + err.message); failed++; }
  }
  console.log('=== Done: ' + success + ' downloaded, ' + failed + ' failed ===');
}

main().catch(console.error);
