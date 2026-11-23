# Uno Diagnóstico - Guia de Gestão por IA

## Visão Geral do Projeto

Site estático da **Uno Diagnóstico**, clínica de diagnóstico por imagem em Maracanaú/CE.
O site é construído a partir de **arquivos JSON de dados** + **templates HTML**, processados por um script Node.js (`build.js`).

**Deploy:** Vercel (automático via push no GitHub)
**URL:** https://unodiagnostico.com
**Domínio:** Configurado na Vercel

---

## Estrutura do Projeto

```
├── data/                    # ⬅ DADOS DO SITE (editar aqui para atualizar conteúdo)
│   ├── site.json            # Informações gerais (nome, telefone, endereço, SEO)
│   ├── services.json        # Lista de exames/serviços oferecidos
│   ├── doctors.json         # Corpo clínico (médicos)
│   ├── insurance.json       # Convênios aceitos
│   ├── blog-posts.json      # Posts do blog
│   ├── reviews.json         # Avaliações do Google
│   └── landing-pages/       # ⬅ LANDING PAGES por exame (campanhas pagas)
│       └── tomografia.json  # Ex: landing de tomografia computadorizada
│
├── src/                     # Templates e assets fonte
│   ├── templates/
│   │   ├── index.html       # Template do site principal (placeholders {{...}})
│   │   ├── landing.html     # Template reutilizável das landing pages
│   │   ├── blog-index.html  # Template do índice /blog/
│   │   ├── blog-post.html   # Template de cada post /blog/<slug>/
│   │   └── 404.html
│   ├── styles/
│   │   ├── main.css         # Estilos do site principal
│   │   └── landing.css      # Estilos das landing pages (inline na landing)
│   └── js/
│       └── main.js          # JavaScript do site principal
│
├── public/                  # Arquivos estáticos (copiados direto para dist/)
│   ├── fonts/               # Montserrat e Open Sans (woff2 variável) — ver "Fontes"
│   └── images/              # Imagens do site
│       ├── gallery/         # Fotos do espaço
│       ├── equipment/       # Fotos dos aparelhos (cards de Equipamentos)
│       ├── exames/          # Foto do topo de cada landing: <slug>.jpg + <slug>.webp
│       └── blog/            # Imagens dos posts
│
├── dist/                    # ⬅ SAÍDA DO BUILD (gerado automaticamente, NÃO editar)
├── build.js                 # Script de build
├── package.json             # Configuração do projeto
├── vercel.json              # Configuração de deploy
└── CLAUDE.md                # Este arquivo
```

---

## Como Atualizar o Site

### Atualizar informações gerais (telefone, endereço, horário)
Editar `data/site.json`. Campos que o build usa além dos óbvios:
- `whatsapp_message`: mensagem que já vem escrita quando a pessoa clica num botão de WhatsApp da home.
- `whatsapp_messages`: `price` (botões de valor), `blog` (botões do blog) e `exam_prefix`
  (o botão "Agendar este Exame" do modal vira `exam_prefix` + nome do exame).
- `geo`: latitude/longitude do schema.org — é a coordenada da ficha da clínica no Google Maps.
- `tracking`: IDs do Google Ads e do GA4 (ver "Tracking de conversão").
Os links de WhatsApp são montados pelo build (`waLink()`); `social.whatsapp_link` não é mais usado.

A nota e o total de avaliações do Google ficam em `data/reviews.json` (`google_rating`,
`google_total_reviews`) e aparecem no topo da home e nas landings. Atualizar à mão de tempos
em tempos, conferindo na ficha do Google (último ajuste: 23/11/2026, 1.713 avaliações).

### Adicionar/editar um exame
Editar `data/services.json` — cada exame tem:
- `id`: identificador único (slug)
- `name`: nome do exame
- `icon`: ícone (opções: mri, xray, syringe, ultrasound, heart, ct-scan, bone, mammography)
- `short_description`: texto curto para o card
- `description`: texto completo para o modal
- `preparations`: lista de orientações de preparo

### Adicionar/editar um equipamento
Editar `data/equipment.json` — cada item tem `id`, `name`, `photo`, `badge` e `description`.
A foto vai em `public/images/equipment/<nome>.jpg` (gere também o `.webp` ao lado — o build monta
`<picture>` automaticamente). Se a foto não existir, o build avisa no console e usa a imagem
padrão da marca em vez de gerar um `<img>` quebrado.

### Adicionar/editar um médico
Editar `data/doctors.json` — cada médico tem:
- `id`: identificador único
- `name`, `specialty`, `crm`, `rqe`
- `photo`: caminho para foto em public/images/
- `qualifications`: lista de formações

### Adicionar um convênio
Editar `data/insurance.json` — adicionar ao array `partners`:

> Nota: o convênio **Unimed** ainda usa o arquivo `images/insurance/umied.png` — o nome do
> arquivo é herança de um erro de digitação antigo no cadastro. O nome exibido está correto;
> o arquivo pode ser renomeado quando alguém mexer nessa pasta.

```json
{ "id": "nome-convenio", "name": "Nome do Convênio", "logo": "images/nome-logo.png" }
```

### Publicar um post no blog
Cada post vira uma página própria em `unodiagnostico.com/blog/<slug>/`, entra no índice `/blog/`
e no `sitemap.xml` automaticamente. A home mostra só os 3 mais recentes, com link para a página.

Adicionar ao início do array em `data/blog-posts.json`:
```json
{
  "id": "slug-do-post",
  "title": "Título do Post",
  "date": "2026-04-06",
  "slug": "slug-do-post",
  "excerpt": "Resumo curto do post...",
  "image": "images/blog/nome-imagem.jpg",
  "content": "Conteúdo completo do post..."
}
```

**Formato do `content`** (texto puro, convertido em HTML pelo build):
- Blocos separados por linha em branco (`\n\n`)
- Linha curta e isolada, sem pontuação final → vira `<h2>` (subtítulo)
- Bloco de linhas começando com `•` → vira lista `<ul>`
- Prefixo em CAIXA ALTA seguido de `:` (ex.: `MITO:`) → fica em negrito
- Qualquer outra coisa → parágrafo

**Regras do `slug`:** único entre todos os posts, kebab-case, e **não mudar depois de publicado**
(a URL já indexada quebra). O `image` aponta para um SVG em `public/images/blog/`.

**O build faz sozinho em cada post:** a descrição para o Google (o `excerpt` cortado em ~155
caracteres, sem partir palavra) e a caixa "Exames citados neste artigo", com link para as páginas
de exame que o texto menciona (palavras-chave em `EXAM_KEYWORDS`, no `build.js`).

### Criar uma nova landing page de exame (campanha)
As landing pages ficam em URLs tipo `unodiagnostico.com/<slug>` e são 100% geradas a partir de um único arquivo JSON em `data/landing-pages/`.

**Passo a passo:**
1. Copie `data/landing-pages/tomografia.json` como modelo e renomeie para `<slug>.json` (ex: `ultrassonografia.json`).
2. Preencha todos os campos: `slug`, `exam_name`, `exam_short`, `seo`, `whatsapp_message`, `whatsapp_message_price`, `hero`, `about`, `indications`, `differentials`, `preparation`, `process`, `faq`.
   - `seo.title`: no máximo 60 caracteres, no formato "<Exame> em Maracanaú | Uno Diagnóstico" (título maior é cortado no Google).
   - `whatsapp_message`: mensagem dos botões de agendar ("...quero agendar uma tomografia.").
     `whatsapp_message_price`: mensagem dos botões de valor. `whatsapp_message_secondary` (opcional):
     mensagem do segundo botão do topo quando ele não é de valor (ex.: "Tirar dúvidas").
   - `hero.badge` + `hero.headline`: quando o título não cita a cidade, o build coloca o selo
     ("<Exame> em Maracanaú") dentro do `<h1>`, sem mudar o visual, para o título principal
     dizer exame + cidade. Forçar com `hero.badge_in_h1: true/false` se precisar.
   - Foto do topo: `public/images/exames/<slug>.jpg` + `<slug>.webp` (o build lê largura/altura
     do arquivo e monta o `<picture>`; sem a foto, a landing sai só com texto).
3. Rode `node build.js` — a landing é gerada em `dist/<slug>/index.html` automaticamente.
4. A landing reutiliza automaticamente: reviews do Google (`reviews.json`), convênios (`insurance.json`), corpo clínico (`doctors.json`) e dados gerais (`site.json`).

**O que a landing inclui automaticamente:**
- Hero com WhatsApp CTA agressivo + trust badges
- Trust bar com estatísticas da clínica
- Seção "O que é" (explicativa)
- Grid de indicações clínicas
- Banner CTA intermediário
- Grid de diferenciais da Uno
- Passo-a-passo do processo (4 etapas)
- Preparo para o exame (com CTA)
- Depoimentos do Google
- Convênios + particular
- Corpo clínico
- FAQ específico do exame (com schema.org FAQPage)
- Mapa + localização
- CTA final grande
- WhatsApp flutuante + sticky mobile
- Schema.org MedicalProcedure para SEO
- Tracking de conversão em TODOS os cliques de WhatsApp (ver "Tracking de conversão")
- Rodapé com link para as outras páginas de exame (automático)

### Alterar visual/design
- Cores e fontes: variáveis CSS no topo de `src/styles/main.css` (`:root { ... }`)
- Layout: modificar `src/templates/index.html`
- Comportamento: modificar `src/js/main.js`

---

## Build e Deploy

### Build local
```bash
node build.js
```
Gera o site completo em `dist/index.html`

### Deploy automático
Push no branch `main` do GitHub → Vercel reconstrói automaticamente.

### Testar localmente
```bash
npm run dev
```
Abre em http://localhost:3000

---

## Regras para o Agente IA

1. **Sempre edite os arquivos JSON em `data/`** para atualizar conteúdo. Nunca edite `dist/`.
2. **Rode `node build.js`** após qualquer alteração para verificar que o build funciona.
3. **Mantenha o formato JSON válido** — use aspas duplas, sem trailing commas.
4. **Posts de blog**: adicione no início do array (mais recentes primeiro).
5. **Imagens**: coloque em `public/images/` com nomes descritivos em kebab-case.
6. **SEO**: atualize `seo` em `site.json` quando adicionar novos serviços ou mudar o foco.
7. **Commit messages**: use português, formato "Atualiza [o quê]: [detalhe]".
8. **Não quebre a estrutura**: se precisar adicionar uma nova seção, atualize tanto o template quanto o build.js.
9. **Coerência de exame novo**: ao ativar/desativar um exame, varra TODOS os pontos — `services.json`,
   `equipment.json`, FAQ e `seo` em `site.json`, slide do hero em `src/templates/index.html`,
   a landing em `data/landing-pages/` e os posts em `blog-posts.json` (que costumam ter um
   parágrafo institucional repetido citando a lista de exames).
10. **Não marcar `aggregateRating` no schema.org** com a nota do Google: avaliação própria de
    LocalBusiness vinda de terceiro não é elegível a rich result e pode gerar ação manual.
11. **Valide SVG antes de publicar** (`python -c "import xml.dom.minidom as m; m.parse(arquivo)"`) —
    XML inválido quebra o card do blog silenciosamente.
12. **Nada que mude de altura depois que a página abre.** O carrossel do topo da home empilha os
    slides na mesma célula de grid (`.hero-slide`, troca por `opacity`) — não voltar para
    `display: none`. Toda `<img>` precisa de `width`/`height`. Era isso que reprovava o site
    no Core Web Vitals (CLS).
13. **Links entre páginas são automáticos:** rodapé de todas as páginas lista os exames
    (`examLinksHTML()`), e os cards da home apontam para a landing com texto "Saiba mais sobre <exame>".
    Landing nova entra sozinha no rodapé; o card da home só ganha o link se, em `services.json`,
    o `id` do exame for igual ao `slug` da landing ou o `name` for igual ao `exam_name` dela.

---

## URL canônica

`https://unodiagnostico.com` (apex) é o host oficial — a Vercel redireciona `www` para ele.
Toda URL absoluta (canonical, og:url, schema.org, sitemap) sai da constante `SITE_URL` no
`build.js`, sempre **com barra final**, pra bater exatamente com o que o servidor entrega.
Nunca escrever `https://unodiagnostico.com/...` à mão em template ou script: usar
`siteUrl('caminho')` para páginas e `assetUrl('images/x.png')` para arquivos.

## Tracking de conversão

Todas as páginas (home, landings e blog) têm `trackWhatsappClick(location)`. Cada clique dispara:
1. o evento `whatsapp_click` no GA4 (`G-4T951CHR0E`), com `landing_page` identificando a página e
   `location` identificando o botão (`header`, `hero`, `flutuante`, `sticky-mobile`, `footer`...);
2. a conversão "Whatsapp" do Google Ads (`send_to: AW-715533760/KKyuCPnntfcCEMDbmNUC`).

Os IDs ficam em `data/site.json` > `tracking` e entram nos templates por `{{ADS_TAG_ID}}`,
`{{ADS_WHATSAPP_SEND_TO}}` e `{{GA4_ID}}` — não escrever ID à mão em template.

> **Atenção:** o ID da tag do Google Ads é `AW-715533760` (ID de conversão). `577-913-0943` é o
> *número da conta* e não serve como tag: de abril a novembro de 2026 o site usou `AW-5779130943`
> por engano e nenhuma conversão do site chegou ao Google Ads.

**Ao adicionar qualquer CTA novo de WhatsApp, incluir
`onclick="return trackWhatsappClick('nome-do-lugar')"`** — senão o clique não é medido.
(A página 404 é a única sem medição.)

## Fontes

Montserrat (títulos) e Open Sans (texto) ficam em `public/fonts/` (woff2 variável, licença OFL) e
são carregadas do próprio site — não usar Google Fonts (uma conexão a menos e sem troca de layout).
- Cada template faz `<link rel="preload" as="font" ... crossorigin>` das duas.
- Os `@font-face` ficam no topo de `src/styles/main.css` e `src/styles/landing.css`, junto com as
  fontes de reserva ("... Fallback Roboto/Arial"): elas ajustam a fonte do aparelho (`size-adjust`)
  para ocupar o mesmo espaço da fonte final, então o texto não muda de linha quando ela carrega.
  Os valores foram medidos com os textos reais do site; não mexer sem medir de novo.
- A página 404 é a exceção: continua com Google Fonts.

## Imagens

- Logos de convênio são exibidos a 60px de altura → salvar com no máximo 180px de altura
- A fachada da home é o LCP → manter em 1200x800, JPEG q82 + WebP
- Sempre gerar o `.webp` ao lado do `.png`/`.jpg` (o build monta o `<picture>` sozinho) — vale
  também para as fotos de exame das landings (`public/images/exames/`)
- Se mudar a dimensão da fachada, atualizar `width`/`height` no `src/templates/index.html`

## Links Externos Importantes

- **Sistema de Resultados:** https://uno.otimusclinic.com/uno/servlet/app.resultadodeexame?sdTjZIxAkYVpFL5AwTTQ8QwYtMA7qRj3B6bU5uP3P0Y=
- **WhatsApp:** https://api.whatsapp.com/send?phone=558521816818
- **Instagram:** https://instagram.com/unodiagnostico
- **Facebook:** https://m.facebook.com/unodiagnostico/
