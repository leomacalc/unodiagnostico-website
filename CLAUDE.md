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
│   └── images/              # Imagens do site
│       ├── gallery/         # Fotos do espaço
│       ├── equipment/       # Fotos dos aparelhos (cards de Equipamentos)
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
Editar `data/site.json`

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

### Criar uma nova landing page de exame (campanha)
As landing pages ficam em URLs tipo `unodiagnostico.com/<slug>` e são 100% geradas a partir de um único arquivo JSON em `data/landing-pages/`.

**Passo a passo:**
1. Copie `data/landing-pages/tomografia.json` como modelo e renomeie para `<slug>.json` (ex: `ultrassonografia.json`).
2. Preencha todos os campos: `slug`, `exam_name`, `seo`, `hero`, `about`, `indications`, `differentials`, `preparation`, `process`, `faq`.
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
- Tracking de conversão no Google Ads em TODOS os cliques de WhatsApp (evento `whatsapp_click` com `location` identificando em qual botão clicou)

**Importante:** o tracking `trackWhatsappClick()` emite evento no Google Ads (tag `AW-5779130943`) permitindo configurar conversões específicas por landing page na campanha.

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

---

## URL canônica

`https://unodiagnostico.com` (apex) é o host oficial — a Vercel redireciona `www` para ele.
Toda URL absoluta (canonical, og:url, schema.org, sitemap) sai da constante `SITE_URL` no
`build.js`, sempre **com barra final**, pra bater exatamente com o que o servidor entrega.
Nunca escrever `https://unodiagnostico.com/...` à mão em template ou script: usar
`siteUrl('caminho')` para páginas e `assetUrl('images/x.png')` para arquivos.

## Tracking de conversão

Todas as páginas (home, landings e blog) têm `trackWhatsappClick(location)`, que dispara o
evento `whatsapp_click` no Google Ads (`AW-5779130943`) e no GA4 (`G-4T951CHR0E`), com
`landing_page` identificando a página e `location` identificando o botão (`header`, `hero`,
`flutuante`, `sticky-mobile`, `footer`...). **Ao adicionar qualquer CTA novo de WhatsApp,
incluir `onclick="return trackWhatsappClick('nome-do-lugar')"`** — senão o clique não é medido.

## Imagens

- Logos de convênio são exibidos a 60px de altura → salvar com no máximo 180px de altura
- A fachada da home é o LCP → manter em 1200x800, JPEG q82 + WebP
- Sempre gerar o `.webp` ao lado do `.png`/`.jpg` (o build monta o `<picture>` sozinho)
- Se mudar a dimensão da fachada, atualizar `width`/`height` no `src/templates/index.html`

## Links Externos Importantes

- **Sistema de Resultados:** https://uno.otimusclinic.com/uno/servlet/app.resultadodeexame?sdTjZIxAkYVpFL5AwTTQ8QwYtMA7qRj3B6bU5uP3P0Y=
- **WhatsApp:** https://api.whatsapp.com/send?phone=558521816818
- **Instagram:** https://instagram.com/unodiagnostico
- **Facebook:** https://m.facebook.com/unodiagnostico/
