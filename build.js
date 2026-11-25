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
const blogPostTemplate = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'blog-post.html'), 'utf-8');
const blogIndexTemplate = fs.readFileSync(path.join(__dirname, 'src', 'templates', 'blog-index.html'), 'utf-8');
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

// --- Preco particular "a partir de" ---
// Fonte unica: public/produtos-chatgpt.csv, o feed de produtos dos anuncios no ChatGPT. Cada
// produto aponta (coluna "url") para a pagina do exame; o "a partir de" de uma pagina e' o menor
// preco entre os produtos disponiveis que apontam para ela. Mudou o preco no feed, mudou no site.
// Sem feed, ou sem produto para a pagina, ela sai com "sob consulta".
// Para fixar ou esconder em uma pagina: "price_from" no JSON da landing (numero = valor fixo;
// false = nao mostrar).
function parseCSV(text) {
  var rows = [], row = [], field = '', inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

var PRICE_FEED = path.join(__dirname, 'public', 'produtos-chatgpt.csv');
var priceFromBySlug = (function () {
  var map = {};
  if (!fs.existsSync(PRICE_FEED)) {
    console.warn('  ! Feed de produtos ausente (public/produtos-chatgpt.csv) — paginas saem sem preco');
    return map;
  }
  var rows = parseCSV(fs.readFileSync(PRICE_FEED, 'utf-8').replace(/^\uFEFF/, ''));
  var head = rows.shift() || [];
  var iUrl = head.indexOf('url'), iPrice = head.indexOf('price'), iAvail = head.indexOf('availability');
  if (iUrl < 0 || iPrice < 0) {
    console.warn('  ! Feed de produtos sem as colunas "url" e "price" — paginas saem sem preco');
    return map;
  }
  rows.forEach(function (r) {
    if (iAvail >= 0 && r[iAvail] && r[iAvail].trim() !== 'in_stock') return;
    var price = /^(\d+(?:\.\d{1,2})?)\s*BRL$/.exec((r[iPrice] || '').trim());
    var slug = /^https?:\/\/[^/]+\/([a-z0-9-]+)\/?$/.exec((r[iUrl] || '').trim());
    if (!price || !slug) return;
    var value = parseFloat(price[1]);
    if (!(value > 0)) return;
    if (!(slug[1] in map) || value < map[slug[1]]) map[slug[1]] = value;
  });
  return map;
})();

// 150 -> "R$ 150"; 1000 -> "R$ 1.000"; 99.9 -> "R$ 99,90" (espaco que nao quebra linha).
function formatBRL(value) {
  var cents = Math.round(value * 100);
  var whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  var dec = cents % 100;
  return 'R$\u00a0' + whole + (dec ? ',' + (dec < 10 ? '0' : '') + dec : '');
}

// Menor preco particular da pagina de exame (numero) ou null.
function priceFromFor(lp) {
  if (lp.price_from === false) return null;
  if (typeof lp.price_from === 'number' && lp.price_from > 0) return lp.price_from;
  return priceFromBySlug[lp.slug] || null;
}

// Texto que entra onde o JSON da landing escreve {{PRICE_FROM}}.
function priceFromText(lp) {
  var value = priceFromFor(lp);
  return value ? 'a partir de ' + formatBRL(value) : 'sob consulta';
}

// Copia um objeto de dados trocando um marcador em todos os textos.
function fillToken(node, token, value) {
  if (typeof node === 'string') return node.split(token).join(value);
  if (Array.isArray(node)) return node.map(function (item) { return fillToken(item, token, value); });
  if (node && typeof node === 'object') {
    var copy = {};
    Object.keys(node).forEach(function (key) { copy[key] = fillToken(node[key], token, value); });
    return copy;
  }
  return node;
}

// Lista de precos da home: onde a FAQ de data/site.json escreve {{PRICE_LIST}} entra
// "raio-X R$ 110; mamografia R$ 150; ...", do menor para o maior. Sem nenhum preco
// conhecido, a pergunta que usa a lista nao e' publicada.
var priceListText = landingPages
  .map(function (lp) { return { name: lcFirst(lp.exam_short || lp.exam_name), value: priceFromFor(lp) }; })
  .filter(function (item) { return item.value; })
  .sort(function (x, y) { return x.value - y.value || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0); })
  .map(function (item) { return item.name + ' ' + formatBRL(item.value); })
  .join('; ');
if (site.faq) {
  site.faq = fillToken(
    site.faq.filter(function (item) {
      return priceListText || (item.question + ' ' + item.answer).indexOf('{{PRICE_LIST}}') < 0;
    }),
    '{{PRICE_LIST}}', priceListText);
}

// --- URL canonica do site ---
// unodiagnostico.com (apex) e o host oficial. A Vercel redireciona www -> apex.
// Toda URL absoluta do site (canonical, og:url, schema.org, sitemap) sai daqui,
// sempre COM barra final, pra bater exatamente com o que o servidor entrega.
const SITE_URL = 'https://unodiagnostico.com';
function siteUrl(pathname) {
  if (!pathname) return SITE_URL + '/';
  var p = String(pathname).replace(/^\/+/, '');
  if (p.indexOf('#') === 0) return SITE_URL + '/' + p;
  if (!/\/$/.test(p)) p += '/';
  return SITE_URL + '/' + p;
}
function assetUrl(pathname) {
  return SITE_URL + '/' + String(pathname).replace(/^\/+/, '');
}

// --- Medicao (Google Ads + GA4) ---
// O ID da tag do Google Ads e' o "ID de conversao" da conta (AW-715533760), NAO o
// numero da conta (577-913-0943). O send_to e' o rotulo da acao de conversao
// "Whatsapp" (Google Ads > Metas > Conversoes > Whatsapp > Fontes de dados > Gerenciar).
// Os valores vivem em data/site.json ("tracking"); os de baixo sao so' reserva.
var tracking = site.tracking || {};
var ADS_TAG_ID = tracking.google_ads_tag_id || 'AW-715533760';
var ADS_WHATSAPP_SEND_TO = tracking.google_ads_whatsapp_send_to || 'AW-715533760/KKyuCPnntfcCEMDbmNUC';
var GA4_ID = tracking.ga4_id || 'G-4T951CHR0E';

// --- Links de WhatsApp com mensagem pre-preenchida ---
// Cada pagina abre a conversa ja' dizendo de onde a pessoa veio e o que quer
// (agendar tal exame, consultar valor...). Os textos ficam em data/site.json
// ("whatsapp_messages") e em cada data/landing-pages/<slug>.json.
function waLink(message) {
  return 'https://api.whatsapp.com/send?phone=' + site.whatsapp + '&text=' + encodeURIComponent(message);
}

// --- Telefone (ligacao) ---
// site.phone e' o numero como aparece na pagina. O link de ligacao (tel:) e o schema.org usam o
// formato internacional, montado a partir dele; "phone_e164" em data/site.json troca esse numero
// se um dia o telefone de ligacao for outro.
var PHONE_E164 = site.phone_e164 || ('+55' + String(site.phone || '').replace(/\D/g, ''));
var PHONE_TEL_HREF = 'tel:' + PHONE_E164;

// Torna clicavel o telefone citado em um texto ja' escapado (respostas da FAQ): vira ligacao,
// ou conversa no WhatsApp quando a frase diz "WhatsApp" logo antes do numero.
function linkPhone(html, waHref, place) {
  var phone = escapeHTML(site.phone || '');
  if (!phone || html.indexOf(phone) < 0) return html;
  var parts = html.split(phone);
  return parts.map(function (part, i) {
    if (i === parts.length - 1) return part;
    var link = /WhatsApp:?\s*$/.test(part)
      ? '<a href="' + waHref + '" target="_blank" rel="noopener" onclick="return trackWhatsappClick(\'' + place + '\')">' + phone + '</a>'
      : '<a href="' + PHONE_TEL_HREF + '" onclick="return trackPhoneClick(\'' + place + '\')">' + phone + '</a>';
    return part + link;
  }).join('');
}
var waMessages = site.whatsapp_messages || {};
var WA_MSG_DEFAULT = site.whatsapp_message || 'Olá! Vim pelo site da Uno Diagnóstico e gostaria de mais informações.';
var WA_MSG_PRICE = waMessages.price || 'Olá! Vim pelo site da Uno Diagnóstico e gostaria de consultar valores de exames.';
var WA_MSG_BLOG = waMessages.blog || 'Olá! Vim pelo blog da Uno Diagnóstico e gostaria de agendar um exame.';
var WA_MSG_EXAM_PREFIX = waMessages.exam_prefix || 'Olá! Vim pelo site da Uno Diagnóstico e quero agendar: ';
var WA_LINK_DEFAULT = waLink(WA_MSG_DEFAULT);
var WA_LINK_PRICE = waLink(WA_MSG_PRICE);
var WA_LINK_BLOG = waLink(WA_MSG_BLOG);

function lcFirst(str) {
  str = String(str || '');
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Corta um texto no limite de caracteres sem partir palavra (meta description).
function truncateText(text, max) {
  text = String(text || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  var cut = text.slice(0, max - 1);
  var lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.replace(/[\s,;:.\-–—]+$/, '') + '…';
}

// --- Icon SVGs ---
const icons = {
  'xray': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
  'syringe': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>',
  'ultrasound': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/></svg>',
  'ct-scan': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
  'bone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>',
  'heart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.7z"/><polyline points="3.5 12.5 8 12.5 9.8 9.4 12.2 15 14 12.5 18.5 12.5"/></svg>',
  'mri': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><rect x="2" y="6" width="20" height="12" rx="3"/><rect x="8" y="9" width="8" height="6" rx="3"/><line x1="2" y1="20" x2="6" y2="20"/><line x1="18" y1="20" x2="22" y2="20"/><line x1="12" y1="2" x2="12" y2="6"/></svg>',
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

// --- Helper: le dimensoes de JPEG (marcador SOF) considerando a rotacao EXIF ---
function getJpegSize(filePath) {
  try {
    var buf = fs.readFileSync(filePath);
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    var orientation = 1;
    var i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      var marker = buf[i + 1];
      if (marker === 0xFF) { i++; continue; }
      if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
      if (marker === 0xD9 || marker === 0xDA) break;
      var segLen = buf.readUInt16BE(i + 2);
      // APP1/Exif: procura a tag de orientacao (0x0112) no IFD0
      if (marker === 0xE1 && buf.toString('latin1', i + 4, i + 10) === 'Exif\u0000\u0000') {
        var tiff = i + 10;
        var le = buf.toString('latin1', tiff, tiff + 2) === 'II';
        var rd16 = function (o) { return le ? buf.readUInt16LE(o) : buf.readUInt16BE(o); };
        var rd32 = function (o) { return le ? buf.readUInt32LE(o) : buf.readUInt32BE(o); };
        var ifd = tiff + rd32(tiff + 4);
        var n = rd16(ifd);
        for (var k = 0; k < n; k++) {
          var entry = ifd + 2 + k * 12;
          if (entry + 12 > buf.length) break;
          if (rd16(entry) === 0x0112) { orientation = rd16(entry + 8); break; }
        }
      }
      // SOF0..SOF15, exceto DHT (C4), JPG (C8) e DAC (CC)
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        var h = buf.readUInt16BE(i + 5);
        var w = buf.readUInt16BE(i + 7);
        return orientation >= 5 && orientation <= 8 ? { width: h, height: w } : { width: w, height: h };
      }
      i += 2 + segLen;
    }
  } catch (e) { /* cai no null abaixo */ }
  return null;
}

// Dimensoes de PNG ou JPEG; null para outros formatos ou arquivo ausente.
function getImageSize(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return getPngSize(filePath);
  if (ext === '.jpg' || ext === '.jpeg') return getJpegSize(filePath);
  return null;
}

// --- Helper: gera <picture> com WebP (source) + PNG/JPG fallback (img) ---
// Uso: pictureTag('images/insurance/camed.png', 'Convênio CAMED', 'loading="lazy"')
// Declara automaticamente width/height lendo do PNG/JPEG (Core Web Vitals: elimina CLS).
// Se não existir o .webp correspondente, emite apenas <img> normal.
function pictureTag(srcPng, alt, extraAttrs) {
  extraAttrs = extraAttrs || '';
  var webpSrc = srcPng.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  var pngFull = path.join(__dirname, 'public', srcPng.replace(/^\//, ''));
  var webpFull = path.join(__dirname, 'public', webpSrc.replace(/^\//, ''));
  var size = getImageSize(pngFull);
  var dimAttrs = size ? ' width="' + size.width + '" height="' + size.height + '"' : '';
  var hasWebp = fs.existsSync(webpFull);
  var imgEl = '<img src="' + srcPng + '" alt="' + alt + '"' + dimAttrs + ' ' + extraAttrs + '>';
  if (!hasWebp) return imgEl;
  return '<picture>' +
    '<source srcset="' + webpSrc + '" type="image/webp">' +
    imgEl +
    '</picture>';
}

// --- Links internos: exames que tem pagina propria ---
// Ordem = a dos cards da home (services.json); landings sem card correspondente vao no fim.
function landingForService(s) {
  return landingPages.find(function (lp) { return lp.slug === s.id || lp.exam_name === s.name; }) || null;
}
var examPages = (function () {
  var list = [];
  services.forEach(function (s) {
    var lp = landingForService(s);
    if (lp && list.indexOf(lp) === -1) list.push(lp);
  });
  landingPages.forEach(function (lp) { if (list.indexOf(lp) === -1) list.push(lp); });
  return list;
})();

// Links de texto para todas as paginas de exame (rodape de todas as paginas).
// Garante que cada pagina de exame receba link de todas as outras e de cada post.
function examLinksHTML(excludeSlug) {
  return examPages
    .filter(function (lp) { return lp.slug !== excludeSlug; })
    .map(function (lp) { return '<a href="/' + lp.slug + '/">' + escapeHTML(lp.exam_name) + '</a>'; })
    .join(' ');
}

// --- Generate HTML Sections ---
function generateServicesHTML() {
  return services.map(function (s) {
    var lp = landingForService(s);
    var landingSlug = lp ? lp.slug : null;
    // Texto do link cita o exame ("Saiba mais sobre tomografia") — ancora descritiva
    // ajuda o Google a entender a pagina de destino.
    var landingLink = landingSlug
      ? '<a href="/' + landingSlug + '/" class="service-card-link" onclick="event.stopPropagation()">Saiba mais sobre ' + escapeHTML(lcFirst(lp.exam_short || lp.exam_name)) + ' &rarr;</a>'
      : '';
    // Preco particular: so' para exame que tem pagina propria e produto no feed.
    var priceFrom = lp ? priceFromFor(lp) : null;
    var priceLine = priceFrom
      ? '<p class="service-card-price">Particular a partir de <strong>' + formatBRL(priceFrom) + '</strong></p>'
      : '';
    return '<div class="service-card" data-service="' + s.id + '" data-title="' + escapeHTML(s.name) + '" data-description="' + escapeHTML(s.description) + '" data-preparations=\'' + escapeHTML(JSON.stringify(s.preparations)) + '\'>' +
      '<div class="service-icon">' + (icons[s.icon] || '') + '</div>' +
      '<h3>' + s.name + '</h3>' +
      '<p>' + s.short_description + '</p>' +
      priceLine +
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

// Fallback: se a foto do equipamento ainda não existe em public/, usa o banner
// abstrato da marca em vez de gerar um <img> quebrado. Avisa no console do build.
var EQUIPMENT_PHOTO_FALLBACK = 'images/gallery/ressonancia-banner.png';
function equipmentPhoto(photo) {
  if (!photo) return EQUIPMENT_PHOTO_FALLBACK;
  var full = path.join(__dirname, 'public', photo.replace(/^\//, ''));
  var webp = full.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  if (fs.existsSync(full) || fs.existsSync(webp)) return photo;
  console.warn('  ! Foto de equipamento ausente: public/' + photo + ' — usando imagem padrao');
  return EQUIPMENT_PHOTO_FALLBACK;
}

function generateEquipmentHTML() {
  if (!equipment.items || !equipment.items.length) return '';
  return equipment.items.map(function (e) {
    var badgeHTML = e.badge ? '<span class="equipment-card-badge">' + escapeHTML(e.badge) + '</span>' : '';
    return '<article class="equipment-card">' +
      '<div class="equipment-card-image">' +
      pictureTag(equipmentPhoto(e.photo), escapeHTML(e.name) + ' - Uno Diagnostico', 'loading="lazy"') +
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
    html += '<a href="' + WA_LINK_PRICE + '" target="_blank" rel="noopener" onclick="return trackWhatsappClick(\'convenios\')" class="insurance-private"><h3>' + insurance.private_label + '</h3><p>Consulte valores e condições</p></a>';
  }
  return html;
}

// Parcerias (data/insurance.json > "partnerships"): nao sao convenios. Aparecem em uma linha de
// texto abaixo dos logos, na home e nas paginas de exame, sem logo. Lista vazia = nao aparece.
function partnershipsHTML(cssClass, waHref) {
  var names = (insurance.partnerships || []).map(function (p) { return p.name; }).filter(Boolean);
  if (!names.length) return '';
  var list = names.length > 1
    ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1]
    : names[0];
  var note = insurance.partnerships_note ? ' ' + escapeHTML(insurance.partnerships_note) : '';
  return '<p class="' + cssClass + '"><strong>' + (names.length > 1 ? 'Parcerias' : 'Parceria') + ':</strong> ' +
    escapeHTML(list) + '.' + note +
    ' <a href="' + waHref + '" target="_blank" rel="noopener" onclick="return trackWhatsappClick(\'parcerias\')">Consulte as condições pelo WhatsApp</a>.</p>';
}

// --- Blog: cada post tem URL propria em /blog/<slug>/ ---
function postSlug(post) {
  return post.slug || post.id;
}
function postPath(post) {
  return 'blog/' + postSlug(post);
}

// Converte o texto puro do post (blocos separados por \n\n) em HTML semantico.
// Regras: bloco iniciado por "•" vira <ul>; linha curta sem pontuacao final vira
// <h2> (sao os subtitulos dos posts); o resto vira <p>.
function renderPostContent(text) {
  if (!text) return '';
  return String(text).split(/\n{2,}/).map(function (raw) {
    var block = raw.trim();
    if (!block) return '';
    var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);

    if (lines[0].charAt(0) === '•') {
      var items = lines.map(function (l) {
        return '<li>' + escapeHTML(l.replace(/^•\s*/, '')) + '</li>';
      }).join('');
      return '<ul>' + items + '</ul>';
    }

    var isHeading = lines.length === 1 &&
      block.length <= 95 &&
      !/[.;:!]$/.test(block) &&
      block.indexOf('•') === -1;
    if (isHeading) return '<h2>' + escapeHTML(block) + '</h2>';

    // Linhas do tipo "MITO: ..." / "VERDADE: ..." ganham o rotulo em negrito
    return '<p>' + lines.map(function (l) {
      return escapeHTML(l).replace(/^([A-ZÁÂÃÀÉÊÍÓÔÕÚÇ]{3,15}:)/, '<strong>$1</strong>');
    }).join('<br>') + '</p>';
  }).filter(Boolean).join('\n          ');
}

function blogCardHTML(post) {
  var href = '/' + postPath(post) + '/';
  var imageHTML = post.image
    ? '<img src="/' + post.image.replace(/^\//, '') + '" alt="' + escapeHTML(post.title) + '" loading="lazy">'
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-size:2rem">&#128196;</div>';
  return '<article class="blog-card">' +
    '<a href="' + href + '" class="blog-image" aria-hidden="true" tabindex="-1">' + imageHTML + '</a>' +
    '<div class="blog-content">' +
    '<div class="blog-date" data-date="' + post.date + '">' + formatDate(post.date) + '</div>' +
    '<h3><a href="' + href + '">' + escapeHTML(post.title) + '</a></h3>' +
    '<p>' + escapeHTML(post.excerpt) + '</p>' +
    '<a href="' + href + '" class="blog-link">Ler mais &rarr;</a>' +
    '</div>' +
    '</article>';
}

function generateBlogHTML() {
  return blogPosts.slice(0, 3).map(blogCardHTML).join('\n            ');
}

function generateFAQHTML() {
  if (!site.faq || !site.faq.length) return '';
  return site.faq.map(function (item, index) {
    return '<div class="faq-item">' +
      '<div class="faq-question" data-faq="' + index + '">' +
      '<h3>' + escapeHTML(item.question) + '</h3>' +
      '<span class="faq-toggle">+</span>' +
      '</div>' +
      '<div class="faq-answer"><p>' + linkPhone(escapeHTML(item.answer), WA_LINK_DEFAULT, 'faq') + '</p></div>' +
      '</div>';
  }).join('\n        ');
}

// Identificador unico da clinica no schema.org: as paginas de exame e os posts
// apontam para ele, entao o Google entende que e' tudo a mesma entidade.
var CLINIC_ID = SITE_URL + '/#clinica';

// Coordenada do ponto da clinica no Google Maps (data/site.json > "geo").
var geo = site.geo || { latitude: -3.8707165, longitude: -38.6190201 };

// Link do Maps que abre a ficha da clinica (place_id em data/reviews.json),
// e nao uma busca generica pelo endereco.
function mapsUrl() {
  var base = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.name + ' ' + site.address.city);
  return reviews.google_place_id ? base + '&query_place_id=' + encodeURIComponent(reviews.google_place_id) : base;
}

// Outro endereco (exame feito fora da unidade principal, ex.: ressonancia no Feira Center).
// "maps_query" e' o que o Google Maps procura; "maps_place_id" (opcional) abre a ficha exata do lugar.
function mapsUrlFor(loc) {
  var base = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(loc.maps_query || loc.full);
  return loc.maps_place_id ? base + '&query_place_id=' + encodeURIComponent(loc.maps_place_id) : base;
}

// Mapa embutido (iframe) das paginas. Sem argumento, mostra a unidade principal.
var MAPS_EMBED_QUERY = 'Avenida I Business Place Torre 2 Jereissati Maracanau CE 61900-320';
function mapsEmbedUrl(query) {
  return 'https://www.google.com/maps?q=' + encodeURIComponent(query || MAPS_EMBED_QUERY).replace(/%20/g, '+') + '&output=embed';
}

// Segundo endereco na home (data/site.json > "second_unit"), logo abaixo do endereco principal.
function secondUnitHTML() {
  var u = site.second_unit;
  if (!u || !u.full) return '';
  return '<div class="map-info-item">' +
    '<div class="map-info-icon">' + icons.location + '</div>' +
    '<p>' + (u.label ? '<strong>' + escapeHTML(u.label) + ':</strong> ' : '') + escapeHTML(u.full) +
    '<br><a href="' + mapsUrlFor(u) + '" target="_blank" rel="noopener" style="color:var(--color-secondary);font-weight:600">Como chegar (Google Maps) &rarr;</a></p>' +
    '</div>';
}

function generateSchemaOrg() {
  var schema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": CLINIC_ID,
    "name": site.name,
    "description": site.seo.description,
    "url": siteUrl(),
    "telephone": PHONE_E164,
    "email": site.email,
    "image": assetUrl('images/og-image.png'),
    "logo": assetUrl('images/logos/logo-verde.png'),
    "priceRange": "$$",
    "sameAs": [site.social.instagram, site.social.facebook],
    "hasMap": mapsUrl(),
    "areaServed": [
      { "@type": "City", "name": "Maracanaú" },
      { "@type": "City", "name": "Fortaleza" },
      { "@type": "City", "name": "Pacatuba" },
      { "@type": "City", "name": "Maranguape" },
      { "@type": "AdministrativeArea", "name": "Região Metropolitana de Fortaleza" }
    ],
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
      "latitude": String(geo.latitude),
      "longitude": String(geo.longitude)
    },
    "openingHours": "Mo-Su 07:00-22:00",
    "medicalSpecialty": "Diagnostic Radiology",
    "availableService": services.map(function (s) {
      var lp = landingPages.find(function (l) { return l.slug === s.id || l.exam_name === s.name; });
      var entry = {
        "@type": "MedicalTest",
        "name": s.name,
        "description": s.short_description
      };
      if (lp) entry.url = siteUrl(lp.slug);
      return entry;
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
  '{{CANONICAL_URL}}': siteUrl(),
  '{{OG_IMAGE_URL}}': assetUrl('images/og-image.png'),
  '{{SITE_URL}}': SITE_URL,
  '{{SITE_NAME}}': site.name,
  '{{SITE_TAGLINE}}': site.tagline,
  '{{SITE_DESCRIPTION_SHORT}}': site.description,
  '{{PHONE}}': site.phone,
  '{{PHONE_TEL}}': PHONE_TEL_HREF,
  '{{WHATSAPP}}': site.whatsapp,
  '{{WHATSAPP_LINK_PRICE}}': WA_LINK_PRICE,
  '{{WHATSAPP_LINK_RM}}': waLink((landingPages.find(function (lp) { return lp.slug === 'ressonancia-magnetica'; }) || {}).whatsapp_message || WA_MSG_DEFAULT),
  '{{WHATSAPP_LINK}}': WA_LINK_DEFAULT,
  '{{WHATSAPP_EXAM_PREFIX}}': escapeHTML(WA_MSG_EXAM_PREFIX),
  '{{ADS_TAG_ID}}': ADS_TAG_ID,
  '{{ADS_WHATSAPP_SEND_TO}}': ADS_WHATSAPP_SEND_TO,
  '{{GA4_ID}}': GA4_ID,
  '{{FOOTER_EXAMS_HTML}}': examLinksHTML(null),
  '{{MAPS_URL}}': mapsUrl(),
  '{{MAPS_EMBED_URL}}': mapsEmbedUrl(),
  '{{SECOND_UNIT_HTML}}': secondUnitHTML(),
  '{{PARTNERSHIPS_HTML}}': partnershipsHTML('insurance-partnerships', WA_LINK_PRICE),
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
  '{{GOOGLE_RATING_BR}}': reviews.google_rating.toLocaleString('pt-BR'),
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
  '.xml', '.txt', '.csv', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.json'
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
  // Preco particular: {{PRICE_FROM}} em qualquer texto do JSON vira "a partir de R$ X"
  // (ou "sob consulta" quando o feed nao tem produto para esta pagina).
  var lpPriceFrom = priceFromFor(lp);
  if (!lpPriceFrom && lp.price_from !== false) {
    console.warn('  ! Sem preco no feed para /' + lp.slug + '/ — a pagina sai com "sob consulta"');
  }
  lp = fillToken(lp, '{{PRICE_FROM}}', priceFromText(lp));

  // Mensagens de WhatsApp desta pagina (data/landing-pages/<slug>.json):
  //   whatsapp_message        -> botoes de agendar
  //   whatsapp_message_price  -> botoes de "consultar valor"
  var examLc = lcFirst(lp.exam_short || lp.exam_name);
  var lpWaLink = waLink(lp.whatsapp_message || (WA_MSG_EXAM_PREFIX + lp.exam_name + '.'));
  var lpWaPriceLink = waLink(lp.whatsapp_message_price || ('Olá! Vim pelo site da Uno Diagnóstico e gostaria de saber o valor particular: ' + lp.exam_name + '.'));
  // O segundo botao do topo: mensagem propria (whatsapp_message_secondary) se houver;
  // senao, a de valor quando o texto do botao fala em valor/preco; senao, a de agendar.
  var secondaryIsPrice = /valor|pre[cç]o|quanto|particular|a partir de|sob consulta/i.test(lp.hero.cta_secondary || '');
  var lpWaSecondaryLink = lp.whatsapp_message_secondary
    ? waLink(lp.whatsapp_message_secondary)
    : (secondaryIsPrice ? lpWaPriceLink : lpWaLink);

  // Local e horario proprios desta pagina (opcionais no JSON; sem eles vale o da unidade principal):
  //   "location": { unit_name, full, maps_query, maps_place_id, note } -> exame feito em outro endereco
  //   "hours":    { text, days_per_week, cta }                        -> exame com horario proprio
  var lpLoc = lp.location && lp.location.full ? lp.location : null;
  var lpHours = lp.hours || {};
  var lpLocationNoteHTML = lpLoc && lpLoc.note
    ? '<span class="lp-location-note">' + escapeHTML(lpLoc.note) + '</span>'
    : '';

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
      '<div class="lp-faq-answer">' + linkPhone(escapeHTML(item.answer), lpWaLink, 'faq') + '</div>' +
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
    lpInsuranceHTML += '<a href="' + lpWaPriceLink + '" target="_blank" rel="noopener" onclick="return trackWhatsappClick(\'insurance\')" class="lp-insurance-private">' +
      (lpPriceFrom
        ? '<h3>Particular a partir de ' + formatBRL(lpPriceFrom) + '</h3><p>Consulte o valor do seu exame pelo WhatsApp</p>'
        : '<h3>' + escapeHTML(insurance.private_label) + '</h3><p>Consulte valores pelo WhatsApp</p>') +
      '</a>';
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
    "url": siteUrl(lp.slug),
    "provider": {
      "@type": "MedicalClinic",
      "@id": CLINIC_ID,
      "name": site.name,
      "telephone": PHONE_E164,
      "url": siteUrl(),
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
      { "@type": "ListItem", "position": 1, "name": "Início", "item": siteUrl() },
      { "@type": "ListItem", "position": 2, "name": "Exames", "item": SITE_URL + '/#exames' },
      { "@type": "ListItem", "position": 3, "name": lp.exam_name, "item": siteUrl(lp.slug) }
    ]
  }, null, 2);

  // Foto do exame: public/images/exames/<slug>.jpg (destaque) e <slug>-og.jpg (1200x630, compartilhamento)
  var examImgRel = 'images/exames/' + lp.slug + '.jpg';
  var examOgRel = 'images/exames/' + lp.slug + '-og.jpg';
  var hasExamImg = fs.existsSync(path.join(__dirname, 'public', examImgRel));
  var hasExamOg = fs.existsSync(path.join(__dirname, 'public', examOgRel));
  // width/height (lidos do arquivo) reservam o espaco da foto antes de ela carregar: sem salto de layout.
  var heroImageHTML = hasExamImg
    ? '<figure class="lp-hero-image">' + pictureTag('/' + examImgRel, escapeHTML(lp.exam_name) + ' na Uno Diagnóstico em Maracanaú/CE', 'fetchpriority="high" decoding="async"') + '</figure>'
    : '';

  // Titulo principal (h1). Quando o titulo nao cita a cidade, o selo ("Exame em Maracanau")
  // entra no mesmo <h1>, com o mesmo visual: o h1 passa a dizer exame + cidade sem mudar o texto.
  var headlineHasCity = (lp.hero.headline || '').indexOf(site.address.city) !== -1;
  var mergeBadge = lp.hero.badge_in_h1 === true || (lp.hero.badge_in_h1 !== false && !headlineHasCity);
  var heroHeadingHTML = mergeBadge
    ? '<h1><span class="lp-hero-badge">' + lp.hero.badge + '</span> <span class="lp-hero-headline">' + lp.hero.headline + '</span></h1>'
    : '<span class="lp-hero-badge">' + lp.hero.badge + '</span>\n        <h1>' + lp.hero.headline + '</h1>';

  var lpReplacements = {
    '{{OG_IMAGE_TYPE}}': hasExamOg ? 'image/jpeg' : 'image/png',
    '{{HERO_IMAGE_HTML}}': heroImageHTML,
    '{{HERO_HEADING_HTML}}': heroHeadingHTML,
    '{{EXAM_SHORT_LC}}': examLc,
    '{{WHATSAPP_LINK_PRICE}}': lpWaPriceLink,
    '{{WHATSAPP_LINK_SECONDARY}}': lpWaSecondaryLink,
    '{{ADS_TAG_ID}}': ADS_TAG_ID,
    '{{ADS_WHATSAPP_SEND_TO}}': ADS_WHATSAPP_SEND_TO,
    '{{GA4_ID}}': GA4_ID,
    '{{FOOTER_EXAMS_HTML}}': examLinksHTML(lp.slug),
    '{{MAPS_URL}}': lpLoc ? mapsUrlFor(lpLoc) : mapsUrl(),
    '{{MAPS_EMBED_URL}}': mapsEmbedUrl(lpLoc ? (lpLoc.maps_query || lpLoc.full) : null),
    '{{LOCATION_NOTE_HTML}}': lpLocationNoteHTML,
    '{{TRUST_DAYS}}': escapeHTML(String(lpHours.days_per_week || '7')),
    '{{FINAL_CTA_TEXT}}': escapeHTML(lpHours.cta || 'Nossa equipe está disponível todos os dias das 7h às 22h para atender você.'),
    '{{PARTNERSHIPS_HTML}}': partnershipsHTML('lp-insurance-partnerships', lpWaPriceLink),
    '{{HERO_CLASS}}': hasExamImg ? ' lp-hero--with-image' : '',
    '{{SLUG}}': lp.slug,
    '{{EXAM_NAME}}': lp.exam_name,
    '{{EXAM_SHORT}}': lp.exam_short || lp.exam_name,
    '{{EXAM_ICON}}': examIcon,
    '{{SEO_TITLE}}': lp.seo.title,
    '{{SEO_DESCRIPTION}}': lp.seo.description,
    '{{SEO_KEYWORDS}}': lp.seo.keywords,
    '{{CANONICAL_URL}}': siteUrl(lp.slug),
    '{{OG_IMAGE_URL}}': assetUrl(hasExamOg ? examOgRel : 'images/og-image.png'),
    '{{SITE_URL}}': SITE_URL,
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
    '{{PHONE_TEL}}': PHONE_TEL_HREF,
    '{{WHATSAPP}}': site.whatsapp,
    '{{WHATSAPP_LINK}}': lpWaLink,
    '{{ADDRESS_FULL}}': lpLoc ? escapeHTML(lpLoc.full) : site.address.full,
    '{{UNIT_NAME}}': lpLoc && lpLoc.unit_name ? escapeHTML(lpLoc.unit_name) : site.unit_name,
    '{{HOURS}}': lpHours.text ? escapeHTML(lpHours.text) : site.hours,
    '{{TECHNICAL_DIRECTOR}}': site.technical_director,
    '{{LEGAL_NAME}}': site.legal_name,
    '{{RESULTS_URL}}': site.results_url,
    '{{STATS_YEARS}}': site.stats ? site.stats.years : '7+',
    '{{STATS_EXAMS}}': site.stats ? site.stats.exams : '200mil+',
    '{{GOOGLE_RATING}}': reviews.google_rating.toString(),
    '{{GOOGLE_RATING_BR}}': reviews.google_rating.toLocaleString('pt-BR'),
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

// --- Build Blog (indice + uma pagina por post) ---
var blogCommon = {
  '{{CSS}}': css,
  '{{SITE_URL}}': SITE_URL,
  '{{OG_IMAGE_URL}}': assetUrl('images/og-image.png'),
  '{{SITE_NAME}}': site.name,
  '{{PHONE}}': site.phone,
  '{{PHONE_TEL}}': PHONE_TEL_HREF,
  '{{WHATSAPP}}': site.whatsapp,
  '{{WHATSAPP_LINK}}': WA_LINK_BLOG,
  '{{ADS_TAG_ID}}': ADS_TAG_ID,
  '{{ADS_WHATSAPP_SEND_TO}}': ADS_WHATSAPP_SEND_TO,
  '{{GA4_ID}}': GA4_ID,
  '{{FOOTER_EXAMS_HTML}}': examLinksHTML(null),
  '{{INSTAGRAM}}': site.social.instagram,
  '{{FACEBOOK}}': site.social.facebook,
  '{{RESULTS_URL}}': site.results_url,
  '{{TECHNICAL_DIRECTOR}}': site.technical_director,
  '{{LEGAL_NAME}}': site.legal_name,
  '{{ICON_WHATSAPP}}': icons.whatsapp,
  '{{ICON_WHATSAPP_LARGE}}': icons['whatsapp-large'],
  '{{ICON_INSTAGRAM}}': icons.instagram,
  '{{ICON_FACEBOOK}}': icons.facebook,
  '{{YEAR}}': new Date().getFullYear().toString()
};

function applyTemplate(tpl, map) {
  var out = tpl;
  Object.keys(map).forEach(function (k) { out = out.split(k).join(map[k]); });
  return out;
}

function writePage(relDir, html) {
  var outDir = path.join(distDir, relDir);
  fs.mkdirSync(outDir, { recursive: true });
  var final = addCacheBuster(html);
  fs.writeFileSync(path.join(outDir, 'index.html'), final);
  return final.length;
}

function postNavLink(post, kind) {
  if (!post) return '';
  return '<a class="post-nav-link ' + kind + '" href="/' + postPath(post) + '/">' +
    '<span>' + (kind === 'prev' ? 'Post anterior' : 'Próximo post') + '</span>' +
    '<strong>' + escapeHTML(post.title) + '</strong></a>';
}

// Exames com pagina propria citados no post (titulo/resumo pesam mais que o corpo).
// Vira o bloco "Exames citados neste artigo", com link para cada pagina de exame.
var EXAM_KEYWORDS = {
  'ressonancia-magnetica': /resson[aâ]ncia/gi,
  'tomografia': /tomografia/gi,
  'ultrassonografia': /ultrass|doppler/gi,
  'mamografia': /mamografia/gi,
  'densitometria-ossea': /densitometria|osteoporose/gi,
  'ecocardiografia': /ecocardiogra/gi,
  'radiografia-digital': /raio[\s-]?x|radiografia/gi
};
function relatedExamPages(post) {
  var head = (post.title || '') + ' ' + (post.excerpt || '') + ' ' + postSlug(post).replace(/-/g, ' ');
  var body = post.content || '';
  return examPages.map(function (lp) {
    var re = EXAM_KEYWORDS[lp.slug];
    if (!re) return { lp: lp, score: 0 };
    var inHead = (head.match(re) || []).length;
    var inBody = (body.match(re) || []).length;
    return { lp: lp, score: inHead * 5 + inBody };
  }).filter(function (x) { return x.score >= 3; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 3)
    .map(function (x) { return x.lp; });
}
function postExamsHTML(post) {
  var related = relatedExamPages(post);
  if (!related.length) return '';
  return '<aside class="post-exams">' +
    '<h2>Exames citados neste artigo</h2>' +
    '<ul>' + related.map(function (lp) {
      return '<li><a href="/' + lp.slug + '/">' + escapeHTML(lp.exam_name) + ' em ' + escapeHTML(site.address.city) + '</a></li>';
    }).join('') + '</ul>' +
    '</aside>';
}

function buildBlogPost(post, index) {
  // blogPosts esta ordenado do mais novo pro mais antigo
  var newer = blogPosts[index - 1] || null;
  var older = blogPosts[index + 1] || null;
  var related = blogPosts.filter(function (p) { return p !== post; }).slice(0, 3);
  var imageUrl = assetUrl(post.image || 'images/og-image.png');

  var schemaArticle = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": imageUrl,
    "datePublished": post.date,
    "dateModified": post.date,
    "inLanguage": "pt-BR",
    "mainEntityOfPage": { "@type": "WebPage", "@id": siteUrl(postPath(post)) },
    "author": { "@type": "Organization", "name": site.name, "url": siteUrl() },
    "publisher": {
      "@type": "MedicalClinic",
      "@id": CLINIC_ID,
      "name": site.name,
      "url": siteUrl(),
      "logo": { "@type": "ImageObject", "url": assetUrl('images/logos/logo-verde.png') }
    }
  }, null, 2);

  var schemaBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": siteUrl() },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": siteUrl('blog') },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": siteUrl(postPath(post)) }
    ]
  }, null, 2);

  var map = Object.assign({}, blogCommon, {
    '{{POST_TITLE}}': escapeHTML(post.title),
    '{{POST_SEO_TITLE}}': escapeHTML(post.title) + ' | Uno Diagnóstico',
    '{{POST_EXCERPT}}': escapeHTML(post.excerpt),
    // Descricao para buscadores: mesmo resumo, cortado em ~155 caracteres sem partir palavra
    '{{POST_META_DESCRIPTION}}': escapeHTML(truncateText(post.excerpt, 155)),
    '{{POST_EXAMS_HTML}}': postExamsHTML(post),
    '{{POST_SLUG}}': postSlug(post),
    '{{POST_DATE}}': formatDate(post.date),
    '{{POST_DATE_ISO}}': post.date,
    '{{POST_IMAGE}}': '/' + (post.image || 'images/og-image.png').replace(/^\//, ''),
    '{{POST_IMAGE_URL}}': imageUrl,
    '{{POST_CONTENT}}': renderPostContent(post.content),
    '{{POST_PREV}}': postNavLink(older, 'prev'),
    '{{POST_NEXT}}': postNavLink(newer, 'next'),
    '{{POST_RELATED}}': related.map(blogCardHTML).join('\n          '),
    '{{CANONICAL_URL}}': siteUrl(postPath(post)),
    '{{SCHEMA_ARTICLE}}': schemaArticle,
    '{{SCHEMA_BREADCRUMB}}': schemaBreadcrumb
  });

  return writePage(postPath(post), applyTemplate(blogPostTemplate, map));
}

function buildBlogIndex() {
  var schemaBlog = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog da Uno Diagnóstico",
    "description": "Artigos sobre exames de imagem, preparo, sintomas e prevenção.",
    "url": siteUrl('blog'),
    "inLanguage": "pt-BR",
    "publisher": { "@type": "MedicalClinic", "@id": CLINIC_ID, "name": site.name, "url": siteUrl() },
    "blogPost": blogPosts.map(function (p) {
      return {
        "@type": "BlogPosting",
        "headline": p.title,
        "datePublished": p.date,
        "url": siteUrl(postPath(p))
      };
    })
  }, null, 2);

  var schemaBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": siteUrl() },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": siteUrl('blog') }
    ]
  }, null, 2);

  var map = Object.assign({}, blogCommon, {
    '{{BLOG_SEO_TITLE}}': 'Blog sobre Exames de Imagem | Uno Diagnóstico Maracanaú',
    '{{BLOG_SEO_DESCRIPTION}}': 'Artigos sobre ressonância, tomografia, ultrassom, mamografia e densitometria: quando fazer, como se preparar e o que cada exame mostra. Escritos pela equipe da Uno Diagnóstico em Maracanaú/CE.',
    '{{CANONICAL_URL}}': siteUrl('blog'),
    '{{BLOG_LIST_HTML}}': blogPosts.map(blogCardHTML).join('\n        '),
    '{{SCHEMA_BLOG}}': schemaBlog,
    '{{SCHEMA_BREADCRUMB}}': schemaBreadcrumb
  });

  return writePage('blog', applyTemplate(blogIndexTemplate, map));
}

var blogIndexSize = buildBlogIndex();
console.log('  + /blog/ (' + Math.round(blogIndexSize / 1024) + ' KB, ' + blogPosts.length + ' posts)');
blogPosts.forEach(function (post, i) { buildBlogPost(post, i); });
console.log('  + ' + blogPosts.length + ' paginas de post em /blog/<slug>/');

// --- Gerar sitemap.xml ---
function generateSitemap() {
  var today = new Date().toISOString().split('T')[0];
  var urls = [
    { loc: siteUrl(), priority: '1.0', changefreq: 'weekly' }
  ];
  landingPages.forEach(function (lp) {
    urls.push({
      loc: siteUrl(lp.slug),
      priority: '0.8',
      changefreq: 'monthly'
    });
  });
  urls.push({ loc: siteUrl('blog'), priority: '0.7', changefreq: 'weekly' });
  blogPosts.forEach(function (p) {
    urls.push({ loc: siteUrl(postPath(p)), priority: '0.6', changefreq: 'yearly', lastmod: p.date });
  });
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function (u) {
    xml += '  <url>\n';
    xml += '    <loc>' + u.loc + '</loc>\n';
    xml += '    <lastmod>' + (u.lastmod || today) + '</lastmod>\n';
    xml += '    <changefreq>' + u.changefreq + '</changefreq>\n';
    xml += '    <priority>' + u.priority + '</priority>\n';
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';
  return xml;
}

function generateRobots() {
  return 'User-agent: *\nAllow: /\n\nSitemap: ' + assetUrl('sitemap.xml') + '\n';
}

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemap());
fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobots());
console.log('  + sitemap.xml (' + (2 + landingPages.length + blogPosts.length) + ' URLs)');
console.log('  + robots.txt');

var html404 = template404
  .split('{{SITE_NAME}}').join(site.name)
  .split('{{WHATSAPP_LINK}}').join(WA_LINK_DEFAULT)
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
console.log('  - precos "a partir de": ' + (priceListText ? priceListText.replace(/\u00a0/g, ' ') : 'nenhum (feed sem produtos)'));
console.log('  - ' + reviews.reviews.length + ' reviews (Google ' + reviews.google_rating + ')');
console.log('  - ' + landingPages.length + ' landing pages');
console.log('  - ' + equipment.items.length + ' equipment items');
console.log('  - cache-buster version: ' + BUILD_VERSION);
