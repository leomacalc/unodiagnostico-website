#!/usr/bin/env node
/* ============================================
   UNO DIAGNÃSTICO - Build Script
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

// --- Load Template ---
const template = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'index.html'), 'utf-8');
const css = fs.readFileSync(path.join(__dirname, 'src', 'styles', 'main.css'), 'utf-8');
const js = fs.readFileSync(path.join(__dirname, 'src', 'js', 'main.js'), 'utf-8');

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
  const months = ['janeiro', 'fevereiro', 'marÃ§o', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDate() + ' de ' + months[d.getMonth()] + ' de ' + d.getFullYear();
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Generate HTML Sections ---
function generateServicesHTML() {
  return services.map(function (s) {
    return '<div class="service-card" data-service="' + s.id + '" data-title="' + escapeHTML(s.name) + '" data-description="' + escapeHTML(s.description) + '" data-preparations=\'' + escapeHTML(JSON.stringify(s.preparations)) + '\'>' +
      '<div class="service-icon">' + (icons[s.icon] || '') + '</div>' +
      '<h3>' + s.name + '</h3>' +
      '<p>' + s.short_description + '</p>' +
      '</div>';
  }).join('\n            ');
}

function generateDoctorsHTML() {
  return doctors.map(function (d) {
    const photoHTML = d.photo
      ? '<img src="' + d.photo + '" alt="' + escapeHTML(d.name) + ' - MÃ©dico Radiologista em MaracanaÃº" loading="lazy">'
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

function generateInsuranceHTML() {
  let html = '';
  insurance.partners.forEach(function (p) {
    html += '<div class="insurance-logo"><img src="' + p.logo + '" alt="ConvÃªnio ' + escapeHTML(p.name) + ' aceito na Uno DiagnÃ³stico" loading="lazy"></div>';
  });
  if (insurance.accepts_private) {
    html += '<a href="' + site.social.whatsapp_link + '" target="_blank" rel="noopener" class="insurance-private"><h3>' + insurance.private_label + '</h3><p>Consulte valores e condiÃ§Ãµes</p></a>';
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
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(path.join(distDir, 'index.html'), html);

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
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('Build complete! Output in /dist');
console.log('  - index.html (' + Math.round(html.length / 1024) + ' KB)');
console.log('  - ' + services.length + ' services');
console.log('  - ' + doctors.length + ' doctors');
console.log('  - ' + blogPosts.length + ' blog posts');
console.log('  - ' + insurance.partners.length + ' insurance partners');
console.log('  - ' + (site.faq ? site.faq.length : 0) + ' FAQ items');

