#!/usr/bin/env node
/* ============================================
   UNO DIAGNÓSTICO - Build Script
   Reads JSON data files + HTML template
   Generates static site in /dist
   ============================================ */

const fs = require('fs');
const path = require('path');

// --- Load Data ---
function loadJSON(filename) {
  const filepath = path.join(__dirname, 'data', filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

const site = loadJSON('site.json');
const services = loadJSON('services.json');
const doctors = loadJSON('doctors.json');
const insurance = loadJSON('insurance.json');
const blogPosts = loadJSON('blog-posts.json');
const reviews = loadJSON('reviews.json');
const equipment = fs.existsSync(path.join(__dirname, 'data', 'equipment.json'))
  ? loadJSON('equipment.json')
  : { section_title: '', section_subtitle: '', items: [] };

// --- Load Template ---
const template = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'index.html'), 'utf-8');
const landingTemplate = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'landing.html'), 'utf-8');
const template404 = fs.readFileSync(path.join(__dirname, 'src', 'templates', '404.html'), 'utf-8');
const css = fs.readFileSync(path.join(__dirname, 'src', 'styles', 'main.css'), 'utf-8');
const landingCss = fs.readFileSync(path.join(__dirname, 'src', 'styles', 'landing.css'), 'utf-8');
const js = fs.readFileSync(path.join(__dirname, 'src', 'js', 'main.js'), 'utf-8');

// --- Load Landing Pages Data ---
function loadLandingPages() {
  const dir = path.join(__dirname, 'data', 'landing-pages');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(function (f) { return f.endsWith('.json'); })
    .map(function (f) { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); });
}
const landingPages = loadLandingPages();

// --- Icon SVGs ---
const icons = {
  'xray': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
  'syringe': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>',
  'ultrasound': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/></svg>',
  'ct-scan': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
  'bone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>',
  'mammography': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><circle cx="12" cy="12" r="2"/></svg>',
  'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  'mail': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  'location': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  'clock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  'instagram': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  'facebook': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  'whatsapp': '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  'whatsapp-large': '<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
};

// --- Helper Functions ---
function formatDate(dateStr) {
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDate() + ' de ' + months[d.getMonth()] + ' de ' + d.getFullYear();
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Cache-buster: adiciona ?v=TIMESTAMP nas URLs de imagem local ---
// Evita que browsers fiquem presos em caches antigos quando um arquivo é atualizado.
// Aplica apenas em URLs relativas (src="images/...", srcset="images/..." ou src="/images/...");
// NÃO toca em URLs absolutas (https://...) como og:image, que vão pro scraper social.
const BUILD_VERSION = Date.now().toString();
function addCacheBuster(html) {
  return html.replace(
    /((?:src|href|srcset)\s*=\s*["'])(\/?images\/[^"'?#\s]+\.(?:png|jpg|jpeg|svg|webp|gif|ico))(["'])/g,
    '$1$2?v=' + BUILD_VERSION + '$3'
  );
}

// --- Helper: lê dimensões de PNG direto do header binário (sem lib externa) ---
// Bytes 16-23 do header PNG contêm width/height (uint32 big-endian) após a assinatura.
function getPngSize(filePath) {
  try {
    var buf = Buffer.alloc(24);
    var fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    // Validar assinatura PNG (primeiros 8 bytes)
    var sig = buf.slice(0, 8);
    if (sig[0] !== 0x89 || sig[1] !== 0x50 || sig[2] !== 0x4E || sig[3] !== 0x47) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch (e) {
    return null;
  }
}

// --- Helper: gera <picture> com WebP (source) + PNG/JPG fallback (img) ---
// Uso: pictureTag('images/insurance/camed.png', 'Convênio CAMED', 'loading="lazy"')
// Declara automaticamente width/height lendo do PNG (Core Web Vitals: elimina CLS).
// Se não existir o .webp correspondente, emite apenas <img> normal.
function pictureTag(srcPng, alt, extraAttrs) {
  extraAttrs = extraAttrs || '';
  var webpSrc = srcPng.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  var pngFull = path.join(__dirname, 'public', srcPng.replace(/^\//, ''));
  var webpFull = path.join(__dirname, 'public', webpSrc.replace(/^\//, ''));
  var size = getPngSize(pngFull);
  var dimAttrs = size ? ' width="' + size.width + '" height="' + size.height + '"' : '';
  var hasWebp = fs.existsSync(webpFull);
  var imgEl = '<img src="' + srcPng + '" alt="' + alt + '"' + dimAttrs + ' ' + extraAttrs + '>';
  if (!hasWebp) return imgEl;
  return '<picture>' +
    '<source srcset="' + webpSrc + '" type="image/webp">' +
    imgEl +
    '</picture>';
}

// --- Generate HTML Sections ---
function generateServicesHTML() {
  // Mapeia service.id → landing slug quando houver landing page correspondente
  var landingSlugByServiceId = {};
  landingPages.forEach(function (lp) {
    var matched = services.find(function (s) { return s.id === lp.slug || s.name === lp.exam_name; });
    if (matched) landingSlugByServiceId[matched.id] = lp.slug;
  });

  return services.map(function (s) {
    var landingSlug = landingSlugByServiceId[s.id];
    var landingLink = landingSlug
      ? '<a href="/' + landingSlug + '/" class="service-card-link" onclick="event.stopPropagation()" aria-label="Saiba mais sobre ' + escapeHTML(s.name) + '">Saiba mais &rarr;</a>'
      : '';
    return '<div class="service-card" data-service="' + s.id + '" data-title="' + escapeHTML(s.name) + '" data-description="' + escapeHTML(s.description) + '" data-preparations=\'' + escapeHTML(JSON.stringify(s.preparations)) + '\'>' +
      '<div class="service-icon">' + (icons[s.icon] || '') + '</div>' +
      '<h3>' + s.name + '</h3>' +
      '<p>' + s.short_description + '</p>' +
      landingLink +
      '</div>';
  }).join('\n            ');
}

function generateDoctorsHTML() {
  return doctors.map(function (d) {
    const photoHTML = d.photo
      ? pictureTag(d.photo, escapeHTML(d.name) + ' - Médico Radiologista em Maracanaú', 'loading="lazy"')
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    const qualificationsHTML = d.qualifications.map(function (q) {
      return '<li>' + q + '</li>';
    }).join('');

    return '<div class="doctor-card">' +
      '<div class="doctor-photo">' + photoHTML + '</div>' +
      '<div class="doctor-info">' +
      '<h3>' + d.name + '</h3>' +
      '<div class="doctor-specialty">' + d.specialty + '</div>' +
      '<div class="doctor-crm">(' + d.crm + ' / ' + d.rqe + ')</div>' +
      '<ul class="doctor-qualifications">' + qualificationsHTML + '</ul>' +
      '</div></div>';
  }).join('\n            ');
}

function generateEquipmentHTML() {
  if (!equipment.items || !equipment.items.length) return '';
  return equipment.items.map(function (e) {
    var badgeHTML = e.badge ? '<span class="equipment-card-badge">' + escapeHTML(e.badge) + '</span>' : '';
    return '<article class="equipment-card">' +
      '<div class="equipment-card-image">' +
      pictureTag(e.photo, escapeHTML(e.name) + ' - Uno Diagnostico', 'loading="lazy"') +
      badgeHTML +
      '</div>' +
      '<div class="equipment-card-body">' +
      '<h3>' + escapeHTML(e.name) + '</h3>' +
      '<p>' + escapeHTML(e.description) + '</p>' +
      '</div>' +
      '</article>';
  }).join('\n        ');
}

function generateInsuranceHTML() {
  let html = '';
  insurance.partners.forEach(function (p) {
    html += '<div class="insurance-logo">' +
      pictureTag(p.logo, 'Convênio ' + escapeHTML(p.name) + ' aceito na Uno Diagnóstico', 'loading="lazy"') +
      '</div>';
  });
  if (insurance.accepts_private) {
    html += '<a href="' + site.social.whatsapp_link + '" target="_blank" rel="noopener" class="insurance-private"><h3>' + insurance.private_label + '</h3><p>Consulte valores e condições</p></a>';
  }
  return html;
}

function generateBlogHTML() {
  return blogPosts.slice(0, 3).map(function (post) {
    var imageHTML = post.image
      ? '<img src="' + post.image + '" alt="' + escapeHTML(post.title) + '" loading="lazy">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-size:2rem">&#128196;</div>';
    var contentFormatted = post.content.replace(/\n/g, '<br>');
    return '<div class="blog-card" data-blog-id="' + post.id + '">' +
      '<div class="blog-image">' + imageHTML + '</div>' +
      '<div class="blog-content">' +
      '<div class="blog-date" data-date="' + post.date + '">' + formatDate(post.date) + '</div>' +
      '<h3>' + post.title + '</h3>' +
      '<p>' + post.excerpt + '</p>' +
      '<a href="#" class="blog-link" data-blog="' + post.id + '">Ler mais &rarr;</a>' +
      '</div>' +
      '<div class="blog-full-content" style="display:none">' + contentFormatted + '</div>' +
      '</div>';
  }).join('\n            ');
}

function generateFAQHTML() {
  if (!site.faq || !site.faq.length) return '';
  return site.faq.map(function (item, index) {
    return '<div class="faq-item">' +
      '<div class="faq-question" data-faq="' + index + '">' +
      '<h3>' + escapeHTML(item.question) + '</h3>' +
      '<span class="faq-toggle">+</span>' +
      '</div>' +
      '<div class="faq-answer"><p>' + escapeHTML(item.answer) + '</p></div>' +
      '</div>';
  }).join('\n        ');
}

function generateSchemaOrg() {
  var schema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": site.name,
    "description": site.seo.description,
    "url": "https://unodiagnostico.com",
    "telephone": site.phone,
    "email": site.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": site.address.street + ', ' + site.address.complement,
      "addressLocality": site.address.city,
      "addressRegion": site.address.state,
      "postalCode": site.address.cep,
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-3.8764",
      "longitude": "-38.6254"
    },
    "openingHours": "Mo-Su 07:00-22:00",
    "medicalSpecialty": "Diagnostic Radiology",
    "availableService": services.map(function (s) {
      return {
        "@type": "MedicalTest",
        "name": s.name,
        "description": s.short_description
      };
    }),
    "paymentAccepted": "Cash, Credit Card, Debit Card, PIX",
    "currenciesAccepted": "BRL"
  };
  return JSON.stringify(schema, null, 2);
}

function generateSchemaFAQ() {
  if (!site.faq || !site.faq.length) return '{}';
  var schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": site.faq.map(function (item) {
      return {
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      };
    })
  };
  return JSON.stringify(schema, null, 2);
}

function generateContactSubjects() {
  return site.contact_form_subjects.map(function (s) {
    return '<option value="' + escapeHTML(s) + '">' + s + '</option>';
  }).join('\n                  ');
}

function generateGoogleStarsHTML(rating) {
  var fullStars = Math.floor(rating);
  var hasHalf = (rating - fullStars) >= 0.3;
  var html = '';
  for (var i = 0; i < fullStars; i++) {
    html += '★';
  }
  if (hasHalf) {
    html += '★';
  }
  return html;
}

function generateReviewsHTML() {
  return reviews.reviews.map(function (r) {
    var initial = r.name.charAt(0).toUpperCase();
    var starsHTML = '';
    for (var i = 0; i < r.rating; i++) {
      starsHTML += '★';
    }
    var badgeHTML = r.badge ? '<span class="review-badge">' + escapeHTML(r.badge) + '</span>' : '';
    return '<div class="review-card">' +
      '<div class="review-card-header">' +
      '<div class="review-avatar">' + initial + '</div>' +
      '<div class="review-author">' +
      '<span class="review-name">' + escapeHTML(r.name) + '</span>' +
      badgeHTML +
      '</div>' +
      '</div>' +
      '<div class="review-stars">' + starsHTML + '</div>' +
      '<p class="review-text">' + escapeHTML(r.text) + '</p>' +
      '<span class="review-time">' + escapeHTML(r.time) + '</span>' +
      '</div>';
  }).join('\n        ');
}

// --- Build Page ---
let html = template;

// Replace placeholders
const replacements = {
  '{{SITE_TITLE}}': site.seo.title,
  '{{SITE_DESCRIPTION}}': site.seo.description,
  '{{SITE_KEYWORDS}}': site.seo.keywords,
  '{{SITE_NAME}}': site.name,
  '{{SITE_TAGLINE}}': site.tagline,
  '{{SITE_DESCRIPTION_SHORT}}': site.description,
  '{{PHONE}}': site.phone,
  '{{WHATSAPP}}': site.whatsapp,
  '{{WHATSAPP_LINK}}': site.social.whatsapp_link,
  '{{EMAIL}}': site.email,
  '{{ADDRESS_FULL}}': site.address.full,
  '{{UNIT_NAME}}': site.unit_name,
  '{{HOURS}}': site.hours,
  '{{TECHNICAL_DIRECTOR}}': site.technical_director,
  '{{LEGAL_NAME}}': site.legal_name,
  '{{RESULTS_URL}}': site.results_url,
  '{{INSTAGRAM}}': site.social.instagram,
  '{{FACEBOOK}}': site.social.facebook,
  '{{SERVICES_HTML}}': generateServicesHTML(),
  '{{DOCTORS_HTML}}': generateDoctorsHTML(),
  '{{INSURANCE_HTML}}': generateInsuranceHTML(),
  '{{EQUIPMENT_HTML}}': generateEquipmentHTML(),
  '{{EQUIPMENT_TITLE}}': equipment.section_title || 'Nossos Equipamentos',
  '{{EQUIPMENT_SUBTITLE}}': equipment.section_subtitle || '',
  '{{GOOGLE_RATING}}': reviews.google_rating.toString(),
  '{{GOOGLE_STARS_HTML}}': generateGoogleStarsHTML(reviews.google_rating),
  '{{GOOGLE_TOTAL_REVIEWS}}': reviews.google_total_reviews.toLocaleString('pt-BR'),
  '{{REVIEWS_HTML}}': generateReviewsHTML(),
  '{{BLOG_HTML}}': generateBlogHTML(),
  '{{FAQ_HTML}}': generateFAQHTML(),
  '{{SCHEMA_ORG}}': generateSchemaOrg(),
  '{{SCHEMA_FAQ}}': generateSchemaFAQ(),
  '{{STATS_YEARS}}': site.stats ? site.stats.years : '5+',
  '{{STATS_EXAMS}}': site.stats ? site.stats.exams : '50mil+',
  '{{STATS_EQUIPMENT}}': site.stats ? site.stats.equipment : '6+',
  '{{CONTACT_SUBJECTS}}': generateContactSubjects(),
  '{{CSS}}': css,
  '{{JS}}': js,
  '{{ICON_INSTAGRAM}}': icons.instagram,
  '{{ICON_FACEBOOK}}': icons.facebook,
  '{{ICON_WHATSAPP}}': icons.whatsapp,
  '{{ICON_WHATSAPP_LARGE}}': icons['whatsapp-large'],
  '{{ICON_PHONE}}': icons.phone,
  '{{ICON_MAIL}}': icons.mail,
  '{{ICON_LOCATION}}': icons.location,
  '{{ICON_CLOCK}}': icons.clock,
  '{{YEAR}}': new Date().getFullYear().toString()
};

Object.keys(replacements).forEach(function (key) {
  html = html.split(key).join(replacements[key]);
});

// --- Write Output ---
const distDir = path.join(__dirname, 'dist');
// Limpa dist/ antes de rebuildar pra evitar arquivos órfãos de builds anteriores
// (ex: HEIC copiado antes do filtro ALLOWED_EXT existir). Ignora erros de lock
// do OneDrive — nesse caso só os arquivos novos sobrescrevem os relevantes.
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('Aviso: não foi possível limpar dist/ completamente (OneDrive lock?). Build continua.');
  }
}
fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), addCacheBuster(html));

// Formatos válidos pra web — ignora HEIC, originais brutos, backups etc.
var ALLOWED_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico',
  '.xml', '.txt', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.json'
]);

// Copy public folder if exists
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  copyDir(publicDir, distDir);
}

function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(function (entry) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    // Pula pastas que começam com _ ou . (backups, internos)
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return;
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      var ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) return; // pula HEIC, psd, etc.
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// --- Build Landing Pages ---
function buildLandingPage(lp) {
  var heroTrustHTML = (lp.hero.trust_badges || []).map(function (b) {
    return '<li>' + escapeHTML(b) + '</li>';
  }).join('');

  var aboutParagraphsHTML = (lp.about.paragraphs || []).map(function (p) {
    return '<p>' + escapeHTML(p) + '</p>';
  }).join('');

  var indicationsHTML = (lp.indications.items || []).map(function (item) {
    return '<div class="lp-indication-card">' +
      '<h3>' + escapeHTML(item.title) + '</h3>' +
      '<p>' + escapeHTML(item.text) + '</p>' +
      '</div>';
  }).join('\n        ');

  var differentialsHTML = (lp.differentials.items || []).map(function (item) {
    return '<div class="lp-differential-card">' +
      '<h3>' + escapeHTML(item.title) + '</h3>' +
      '<p>' + escapeHTML(item.text) + '</p>' +
      '</div>';
  }).join('\n        ');

  var processHTML = (lp.process.steps || []).map(function (step) {
    return '<div class="lp-process-step">' +
      '<div class="lp-process-number">' + escapeHTML(step.number) + '</div>' +
      '<h3>' + escapeHTML(step.title) + '</h3>' +
      '<p>' + escapeHTML(step.text) + '</p>' +
      '</div>';
  }).join('\n        ');

  var preparationHTML = (lp.preparation.items || []).map(function (it) {
    return '<li>' + escapeHTML(it) + '</li>';
  }).join('');

  var faqHTML = (lp.faq || []).map(function (item) {
    return '<details class="lp-faq-item">' +
      '<summary>' + escapeHTML(item.question) + '</summary>' +
      '<div class="lp-faq-answer">' + escapeHTML(item.answer) + '</div>' +
      '</details>';
  }).join('\n        ');

  // Reviews (reuse from main reviews.json, show top 3)
  var lpReviewsHTML = reviews.reviews.slice(0, 3).map(function (r) {
    var initial = r.name.charAt(0).toUpperCase();
    var starsHTML = '';
    for (var i = 0; i < r.rating; i++) starsHTML += '★';
    return '<div class="lp-review-card">' +
      '<div class="lp-review-header">' +
      '<div class="lp-review-avatar">' + initial + '</div>' +
      '<div class="lp-review-name">' + escapeHTML(r.name) + '</div>' +
      '</div>' +
      '<div class="lp-review-stars">' + starsHTML + '</div>' +
      '<p class="lp-review-text">' + escapeHTML(r.text) + '</p>' +
      '<span class="lp-review-time">' + escapeHTML(r.time) + '</span>' +
      '</div>';
  }).join('\n        ');

  // Insurance (reuse)
  var lpInsuranceHTML = '';
  insurance.partners.forEach(function (p) {
    lpInsuranceHTML += '<div class="lp-insurance-logo">' +
      pictureTag('/' + p.logo, 'Convênio ' + escapeHTML(p.name), 'loading="lazy"') +
      '</div>';
  });
  if (insurance.accepts_private) {
    lpInsuranceHTML += '<a href="' + site.social.whatsapp_link + '" target="_blank" rel="noopener" onclick="return trackWhatsappClick(\'insurance\')" class="lp-insurance-private"><h3>' + escapeHTML(insurance.private_label) + '</h3><p>Consulte valores pelo WhatsApp</p></a>';
  }

  // Doctors (reuse — all)
  var lpDoctorsHTML = doctors.map(function (d) {
    var photoHTML = d.photo
      ? pictureTag('/' + d.photo, escapeHTML(d.name), 'loading="lazy"')
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    var qualHTML = (d.qualifications || []).slice(0, 3).map(function (q) { return '<li>' + escapeHTML(q) + '</li>'; }).join('');
    return '<div class="lp-doctor-card">' +
      '<div class="lp-doctor-photo">' + photoHTML + '</div>' +
      '<div class="lp-doctor-info">' +
      '<h3>' + escapeHTML(d.name) + '</h3>' +
      '<div class="lp-doctor-specialty">' + escapeHTML(d.specialty) + '</div>' +
      '<div class="lp-doctor-crm">' + escapeHTML(d.crm) + ' / ' + escapeHTML(d.rqe) + '</div>' +
      '<ul class="lp-doctor-qualifications">' + qualHTML + '</ul>' +
      '</div></div>';
  }).join('\n        ');

  // Exam icon — reuse services.json icon mapping
  var examIcon = '';
  var matchedService = services.find(function (s) { return s.id === lp.slug || s.name === lp.exam_name; });
  if (matchedService && icons[matchedService.icon]) {
    examIcon = icons[matchedService.icon].replace('width="28" height="28"', 'width="56" height="56"');
  } else {
    examIcon = icons['ct-scan'].replace('width="28" height="28"', 'width="56" height="56"');
  }

  // Schema.org MedicalProcedure
  var schemaMedical = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": lp.exam_name,
    "description": lp.seo.description,
    "procedureType": "Diagnostic",
    "howPerformed": lp.about.paragraphs ? lp.about.paragraphs[0] : '',
    "preparation": (lp.preparation.items || []).join('; '),
    "url": "https://unodiagnostico.com/" + lp.slug,
    "provider": {
      "@type": "MedicalClinic",
      "name": site.name,
      "telephone": site.phone,
      "url": "https://unodiagnostico.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": site.address.street + ', ' + site.address.complement,
        "addressLocality": site.address.city,
        "addressRegion": site.address.state,
        "postalCode": site.address.cep,
        "addressCountry": "BR"
      }
    }
  }, null, 2);

  var schemaFAQ = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (lp.faq || []).map(function (item) {
      return {
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer }
      };
    })
  }, null, 2);

  var schemaBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://unodiagnostico.com" },
      { "@type": "ListItem", "position": 2, "name": "Exames", "item": "https://unodiagnostico.com#exames" },
      { "@type": "ListItem", "position": 3, "name": lp.exam_name, "item": "https://unodiagnostico.com/" + lp.slug }
    ]
  }, null, 2);

  var lpReplacements = {
    '{{SLUG}}': lp.slug,
    '{{EXAM_NAME}}': lp.exam_name,
    '{{EXAM_SHORT}}': lp.exam_short || lp.exam_name,
    '{{EXAM_ICON}}': examIcon,
    '{{SEO_TITLE}}': lp.seo.title,
    '{{SEO_DESCRIPTION}}': lp.seo.description,
    '{{SEO_KEYWORDS}}': lp.seo.keywords,
    '{{HERO_BADGE}}': lp.hero.badge,
    '{{HERO_HEADLINE}}': lp.hero.headline,
    '{{HERO_SUBTITLE}}': lp.hero.subtitle,
    '{{HERO_CTA_PRIMARY}}': lp.hero.cta_primary,
    '{{HERO_CTA_SECONDARY}}': lp.hero.cta_secondary,
    '{{HERO_TRUST_HTML}}': heroTrustHTML,
    '{{ABOUT_TITLE}}': lp.about.title,
    '{{ABOUT_PARAGRAPHS_HTML}}': aboutParagraphsHTML,
    '{{INDICATIONS_TITLE}}': lp.indications.title,
    '{{INDICATIONS_SUBTITLE}}': lp.indications.subtitle || '',
    '{{INDICATIONS_HTML}}': indicationsHTML,
    '{{DIFFERENTIALS_TITLE}}': lp.differentials.title,
    '{{DIFFERENTIALS_HTML}}': differentialsHTML,
    '{{PROCESS_TITLE}}': lp.process.title,
    '{{PROCESS_HTML}}': processHTML,
    '{{PREPARATION_TITLE}}': lp.preparation.title,
    '{{PREPARATION_INTRO}}': lp.preparation.intro || '',
    '{{PREPARATION_HTML}}': preparationHTML,
    '{{PREPARATION_NOTE}}': lp.preparation.note || '',
    '{{FAQ_HTML}}': faqHTML,
    '{{REVIEWS_HTML}}': lpReviewsHTML,
    '{{INSURANCE_HTML}}': lpInsuranceHTML,
    '{{DOCTORS_HTML}}': lpDoctorsHTML,
    '{{SCHEMA_MEDICAL}}': schemaMedical,
    '{{SCHEMA_FAQ}}': schemaFAQ,
    '{{SCHEMA_BREADCRUMB}}': schemaBreadcrumb,
    '{{LANDING_CSS}}': landingCss,
    // Shared site values
    '{{SITE_NAME}}': site.name,
    '{{PHONE}}': site.phone,
    '{{WHATSAPP}}': site.whatsapp,
    '{{WHATSAPP_LINK}}': site.social.whatsapp_link,
    '{{ADDRESS_FULL}}': site.address.full,
    '{{UNIT_NAME}}': site.unit_name,
    '{{HOURS}}': site.hours,
    '{{TECHNICAL_DIRECTOR}}': site.technical_director,
    '{{LEGAL_NAME}}': site.legal_name,
    '{{RESULTS_URL}}': site.results_url,
    '{{STATS_YEARS}}': site.stats ? site.stats.years : '7+',
    '{{STATS_EXAMS}}': site.stats ? site.stats.exams : '200mil+',
    '{{GOOGLE_RATING}}': reviews.google_rating.toString(),
    '{{GOOGLE_STARS_HTML}}': generateGoogleStarsHTML(reviews.google_rating),
    '{{GOOGLE_TOTAL_REVIEWS}}': reviews.google_total_reviews.toLocaleString('pt-BR'),
    '{{ICON_WHATSAPP}}': icons.whatsapp,
    '{{ICON_WHATSAPP_LARGE}}': icons['whatsapp-large'],
    '{{ICON_PHONE}}': icons.phone,
    '{{ICON_LOCATION}}': icons.location,
    '{{ICON_CLOCK}}': icons.clock,
    '{{YEAR}}': new Date().getFullYear().toString()
  };

  var lpHTML = landingTemplate;
  Object.keys(lpReplacements).forEach(function (key) {
    lpHTML = lpHTML.split(key).join(lpReplacements[key]);
  });

  var outDir = path.join(distDir, lp.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  var finalLpHTML = addCacheBuster(lpHTML);
  fs.writeFileSync(path.join(outDir, 'index.html'), finalLpHTML);
  return finalLpHTML.length;
}

landingPages.forEach(function (lp) {
  var size = buildLandingPage(lp);
  console.log('  + landing /' + lp.slug + ' (' + Math.round(size / 1024) + ' KB)');
});

// --- Gerar sitemap.xml ---
function generateSitemap() {
  var today = new Date().toISOString().split('T')[0];
  var urls = [
    { loc: 'https://unodiagnostico.com/', priority: '1.0', changefreq: 'weekly' }
  ];
  landingPages.forEach(function (lp) {
    urls.push({
      loc: 'https://unodiagnostico.com/' + lp.slug + '/',
      priority: '0.8',
      changefreq: 'monthly'
    });
  });
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function (u) {
    xml += '  <url>\n';
    xml += '    <loc>' + u.loc + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>' + u.changefreq + '</changefreq>\n';
    xml += '    <priority>' + u.priority + '</priority>\n';
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';
  return xml;
}

function generateRobots() {
  return 'User-agent: *\nAllow: /\n\nSitemap: https://unodiagnostico.com/sitemap.xml\n';
}

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap());
fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots());
console.log('  + sitemap.xml (' + (1 + landingPages.length) + ' URLs)');
console.log('  + robots.txt');

var html404 = template404
  .split('{{SITE_NAME}}').join(site.name)
  .split('{{WHATSAPP_LINK}}').join(site.social.whatsapp_link)
  .split('{{ICON_WHATSAPP}}').join(icons.whatsapp);
fs.writeFileSync(path.join(distDir, '404.html'), addCacheBuster(html404));
console.log('  + 404.html');

console.log('Build complete! Output in /dist');
console.log('  - index.html (' + Math.round(html.length / 1024) + ' KB)');
console.log('  - ' + services.length + ' services');
console.log('  - ' + doctors.length + ' doctors');
console.log('  - ' + blogPosts.length + ' blog posts');
console.log('  - ' + insurance.partners.length + ' insurance partners');
console.log('  - ' + (site.faq ? site.faq.length : 0) + ' FAQ items');
console.log('  - ' + reviews.reviews.length + ' reviews (Google ' + reviews.google_rating + ')');
console.log('  - ' + landingPages.length + ' landing pages');
console.log('  - ' + equipment.items.length + ' equipment items');
console.log('  - cache-buster version: ' + BUILD_VERSION);
