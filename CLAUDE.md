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
│   ├── produtos-chatgpt.csv # Feed de produtos dos anúncios no ChatGPT (exames com preço e horário)
│   │                        #   e fonte dos preços "a partir de" que o site mostra
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
- `phone`: o número como aparece na página. O build monta a partir dele o link de ligação
  (`tel:+55...`, marcador `{{PHONE_TEL}}`) e o telefone do schema.org, em formato internacional.
  `phone_e164` (opcional) troca o número do link, se um dia o telefone de ligação for outro.
- `whatsapp_message`: mensagem que já vem escrita quando a pessoa clica num botão de WhatsApp da home.
- `whatsapp_messages`: `price` (botões de valor), `blog` (botões do blog) e `exam_prefix`
  (o botão "Agendar este Exame" do modal vira `exam_prefix` + nome do exame).
- `geo`: latitude/longitude do schema.org — é a coordenada da ficha da clínica no Google Maps.
- `tracking`: IDs do Google Ads e do GA4 (ver "Tracking de conversão").
- `second_unit` (opcional): segundo endereço mostrado na home, abaixo do principal — hoje o espaço
  da ressonância no Feira Center. Campos: `label`, `full`, `maps_query`, `maps_place_id`.
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

**Parcerias (não são convênios):** array `partnerships` (`id`, `name`) e `partnerships_note`, no
mesmo arquivo. Saem como uma linha de texto abaixo dos logos, na home e nas landings, sem logo e
com link de WhatsApp. Hoje: Cartão de Todos e AmorSaúde (desconto em exames para quem tem o cartão).

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

### Preço particular "a partir de"
O site mostra, por exame, o menor valor particular ("a partir de R$ X"). **O número não é escrito
em nenhum JSON nem template:** o build lê `public/produtos-chatgpt.csv` (o feed dos anúncios no
ChatGPT) e, para cada página de exame, usa o menor `price` entre os produtos `in_stock` cuja `url`
aponta para ela. **Para mudar um preço, editar só o feed** e rodar o build.

Onde aparece:
- Páginas de exame: no texto do JSON, o marcador `{{PRICE_FROM}}` vira "a partir de R$ 350"
  (ou "sob consulta", se o feed não tiver produto para a página). Hoje está no segundo botão do
  topo (`hero.cta_secondary`: "Particular {{PRICE_FROM}}"), na pergunta de valor da FAQ e, na
  ressonância, no primeiro selo do topo (lá o segundo botão é "Tirar dúvidas"). O cartão
  "Particular" da seção de convênios recebe o preço sozinho.
- Home: cada cartão de exame que tem página própria ganha a linha "Particular a partir de R$ X",
  e a FAQ de `data/site.json` tem o marcador `{{PRICE_LIST}}` (a lista de todos os exames, do
  menor para o maior). Sem nenhum preço no feed, a pergunta que usa a lista não é publicada.

Ajustes por página, no JSON da landing: `"price_from": 280` fixa um valor; `"price_from": false`
esconde o preço. O build lista os preços em uso no fim da saída e avisa quando uma página fica
sem preço. Frase que leva o marcador precisa funcionar com as duas saídas ("Tomografia
particular: {{PRICE_FROM}}." serve; "custa {{PRICE_FROM}}" não).

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
   - `location` (opcional): para exame feito fora da unidade principal. Troca o nome, o endereço,
     o link "Como chegar" e o mapa da seção de localização. Campos: `unit_name`, `full`,
     `maps_query` (o que o Google Maps procura — usar o nome do lugar quando o Maps ainda não
     conhece o endereço), `maps_place_id` (opcional) e `note` (aviso em letra menor).
     Hoje só a ressonância usa (Feira Center).
   - `hours` (opcional): para exame com horário próprio. `text` (seção de localização),
     `days_per_week` (número da faixa de estatísticas; padrão 7) e `cta` (frase acima do botão
     final). Hoje só a mamografia usa.
   - Preço: usar `{{PRICE_FROM}}` no texto e ter ao menos um produto do exame no feed com a `url`
     da página (ver "Preço particular"). `price_from` (opcional) fixa ou esconde o valor.
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
   parágrafo institucional repetido citando a lista de exames). Vale também para mudança de
   horário ou endereço: o feed `public/produtos-chatgpt.csv` (anúncios no ChatGPT) repete
   horário e exame em cada produto. Preço é o contrário: mora só no feed, e o site lê de lá.
10. **Não marcar `aggregateRating` no schema.org** com a nota do Google: avaliação própria de
    LocalBusiness vinda de terceiro não é elegível a rich result e pode gerar ação manual.
11. **Valide SVG antes de publicar** (`python -c "import xml.dom.minidom as m; m.parse(arquivo)"`) —
    XML inválido quebra o card do blog silenciosamente.
12. **Nada que mude de altura depois que a página abre.** O carrossel do topo da home empilha os
    slides na mesma célula de grid (`.hero-slide`, troca por `opacity`) — não voltar para
    `display: none`. Toda `<img>` precisa de `width`/`height`. Era isso que reprovava o site
    no Core Web Vitals (CLS). Texto que cabe "no limite" da linha também pula: a largura muda
    1 a 3% entre a fonte de reserva e a final, e de aparelho para aparelho. Os selos do topo da
    home têm 40 px de folga no computador por isso (comentário no fim do bloco do hero, em
    `main.css`) — se mudar o texto deles ou acrescentar um selo, conferir que seguem em uma
    linha só entre 1200 e 1920 px de largura. Nas páginas de exame, os dois botões do topo
    ficam sempre um embaixo do outro (lado a lado, caber ou não dependia da fonte em tablet) e
    o segundo botão encolhe abaixo de 360 px de tela para o texto com preço caber em uma linha.
13. **Links entre páginas são automáticos:** rodapé de todas as páginas lista os exames
    (`examLinksHTML()`), e os cards da home apontam para a landing com texto "Saiba mais sobre <exame>".
    Landing nova entra sozinha no rodapé; o card da home só ganha o link se, em `services.json`,
    o `id` do exame for igual ao `slug` da landing ou o `name` for igual ao `exam_name` dela.
14. **Fatos da clínica confirmados pelo Dr. Leonardo em 23/11/2026** — não publicar nada que
    contradiga, a não ser que ele diga que mudou:
    - **Ressonância: só sem contraste, por enquanto.** Nada de orientação de contraste (jejum por
      causa de contraste, creatinina, gadolínio) em texto de ressonância — essas orientações são
      da tomografia. Inclui angiorressonância arterial. **Ressonância de abdome ainda não é
      feita** (depende do contraste): não listar abdome entre os exames de ressonância.
      Dizer "alta definição"; nunca citar Tesla nem "alto campo".
    - **Onde é feita a ressonância:** Feira Center (open mall), Av. Yolanda Pontes Vidal Queiroz,
      17, lojas 102 e 103, Jereissati I, CEP 61900-410. Os demais exames seguem na Avenida I,
      Business Place Torre 2.
    - **A clínica não faz exame sob sedação.**
    - **Prazo de laudo:** ultrassom e ecocardiograma em até 40 minutos; tomografia, ressonância,
      mamografia, densitometria e raio-X eletivos em 1 dia útil; tomografia de urgência em até
      2 horas. (Biópsias: prazo não confirmado; o site não cita.)
    - **Mamografia:** segunda a sexta, 8h às 18h, e sábado, 8h às 12h. A clínica abre todos os
      dias, das 7h às 22h.
    - **Convênios:** LivSaúde, Unimed, CAMED, FUSEx e ISSEC. **Parcerias:** Cartão de Todos e AmorSaúde.
    - **Não faz endoscopia nem eletroneuromiografia.** Não citar esses exames em texto novo, para
      o site não aparecer nessas buscas.
    - A página de ditado de laudos (`/laudos.html`) e as funções `/api` saíram do site nessa data.
    - **Preço no site (autorizado em 24/11/2026):** só o valor particular "a partir de" por
      exame, tirado do feed. A tabela completa de valores foi proposta e recusada em
      25/11/2026; preço no schema.org (`offers`) não foi autorizado.
    - **O (85) 2181-6818 atende ligação** (confirmado em 25/11/2026), além de ser o WhatsApp.

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

**Telefone:** todo link de ligação usa `href="{{PHONE_TEL}}"` e
`onclick="return trackPhoneClick('nome-do-lugar')"`. O clique dispara o evento `phone_click` no
GA4, com os mesmos `landing_page` e `location`; **não** dispara a conversão "Whatsapp" do Google
Ads. Hoje o número é link de ligação no bloco de endereço (home e páginas de exame) e no rodapé
de todas as páginas. Nas respostas da FAQ o build faz sozinho (`linkPhone()`): o número citado
vira link de ligação, ou de WhatsApp quando a frase diz "WhatsApp" logo antes dele. Os botões
verdes, inclusive o do topo das páginas de exame que mostra o número, continuam sendo WhatsApp.

## Fontes

Montserrat (títulos) e Open Sans (texto) ficam em `public/fonts/` (woff2 variável, licença OFL) e
são carregadas do próprio site — não usar Google Fonts (uma conexão a menos e sem troca de layout).
- **Não pré-carregar as fontes** (`<link rel="preload" as="font">`): o navegador segura o primeiro
  desenho da página esperando a fonte (medido em celular lento: ~0,2 s a mais, e o PageSpeed chega
  a mostrar 2 s de tela em branco). O CSS já pede as fontes cedo o bastante.
- Os `@font-face` ficam no topo de `src/styles/main.css` e `src/styles/landing.css`, junto com as
  fontes de reserva ("... Fallback Roboto/Arial"): elas ajustam a fonte do aparelho (`size-adjust`)
  para ocupar o mesmo espaço da fonte final, então o texto não muda de linha quando ela carrega.
  Os valores foram medidos com os textos reais do site; não mexer sem medir de novo. Elas levam
  `font-display: swap` para o texto nunca ficar invisível enquanto o aparelho localiza a fonte.
- A página 404 é a exceção: continua com Google Fonts.

## Imagens

- Logos de convênio são exibidos a 60px de altura → salvar com no máximo 180px de altura
- A fachada da home é o LCP → manter em 1200x800, JPEG q82 + WebP. Ela tem versões menores
  (`fachada-640.webp`, `fachada-800.webp`, `fachada-960.webp`, WebP q80) listadas no `srcset` do
  `<picture>` e no `<link rel="preload">` do `src/templates/index.html` — o celular baixa só a que
  precisa. **Se trocar a foto da fachada, gerar de novo as três versões menores.**
- O fundo do slide da ressonância (`ressonancia-banner.webp`) só é baixado depois que a página
  carrega: o `main.js` põe a classe `.bg-ready` no slide. Fundo de slide novo segue o mesmo padrão.
- Sempre gerar o `.webp` ao lado do `.png`/`.jpg` (o build monta o `<picture>` sozinho) — vale
  também para as fotos de exame das landings (`public/images/exames/`)
- Se mudar a dimensão da fachada, atualizar `width`/`height` no `src/templates/index.html`

## Links Externos Importantes

- **Sistema de Resultados:** https://uno.otimusclinic.com/uno/servlet/app.resultadodeexame?sdTjZIxAkYVpFL5AwTTQ8QwYtMA7qRj3B6bU5uP3P0Y=
- **WhatsApp:** https://api.whatsapp.com/send?phone=558521816818
- **Instagram:** https://instagram.com/unodiagnostico
- **Facebook:** https://m.facebook.com/unodiagnostico/
