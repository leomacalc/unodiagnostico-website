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
│   ├── privacy.json         # Texto da Política de Privacidade (/politica-de-privacidade/)
│   └── landing-pages/       # ⬅ LANDING PAGES por exame (campanhas pagas)
│       └── tomografia.json  # Ex: landing de tomografia computadorizada
│
├── src/                     # Templates e assets fonte
│   ├── templates/
│   │   ├── index.html       # Template do site principal (placeholders {{...}})
│   │   ├── landing.html     # Template reutilizável das landing pages
│   │   ├── blog-index.html  # Template do índice /blog/
│   │   ├── blog-post.html   # Template de cada post /blog/<slug>/
│   │   ├── legal.html       # Template de página institucional de texto (política de privacidade)
│   │   ├── cookie-banner.html # Aviso de cookies (trecho único, injetado em todas as páginas)
│   │   └── 404.html
│   ├── styles/
│   │   ├── main.css         # Estilos do site principal
│   │   ├── landing.css      # Estilos das landing pages (inline na landing)
│   │   ├── consent.css      # Aviso de cookies (anexado ao CSS de todas as páginas)
│   │   └── legal.css        # Tabelas e data da página de política (só nela)
│   └── js/
│       ├── main.js          # JavaScript do site principal
│       └── consent.js       # Consentimento de cookies: trecho do <head> de todas as páginas
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
- O mapa embutido da home acha a clínica pelo texto de `MAPS_EMBED_QUERY` (no `build.js`), que leva o
  CEP 61900-320 porque é assim que a ficha do Google está escrita (e vai continuar: ver regra 14).
  Só trocar depois de abrir o mapa e conferir que o alfinete continua na clínica.
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
  "seo_title": "Título de busca, até 60 caracteres",
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

**`seo_title` (título de busca):** é o que vai no `<title>` da página, a linha azul do Google e do
Bing. **Até 60 caracteres** (acima disso o buscador corta e o Bing marca erro). O `title` continua
sendo o título que o leitor vê: página, cartões, redes sociais e schema.org. Como escrever:
- Exame ou assunto primeiro, depois o gancho ("Ultrassom de mama em Maracanaú: quando fazer e preparo").
- Exame sem página própria leva "em Maracanaú". Doença ou sintoma leva a cidade junto do exame
  ("Pedras nos rins: ultrassom ou tomografia em Maracanaú").
- Exame que já tem página própria fica sem a cidade e com ângulo de dúvida ("Densitometria óssea:
  quando fazer e como se preparar"), para o post não disputar a busca com a página de exame. Nunca
  repetir o título de uma página de exame ("<Exame> em Maracanaú").
- Não escrever a marca: o build acrescenta " | Uno Diagnóstico" quando o total cabe em 60.
- Post sem `seo_title`: o build usa o `title` se couber em 60, ou o trecho antes dos dois-pontos, e
  avisa. Ele também avisa título acima de 60, repetido ou igual ao de uma página de exame.

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
esconde o preço; `"price_items": ["uno-us-abdome-total"]` troca a regra da `url`: vale o menor preço
entre os produtos listados (pelo `item_id` do feed). É o que as subpáginas usam, porque os anúncios
continuam apontando para a página-mãe. O build lista os preços em uso no fim da saída e avisa quando uma página fica
sem preço. Frase que leva o marcador precisa funcionar com as duas saídas ("Tomografia
particular: {{PRICE_FROM}}." serve; "custa {{PRICE_FROM}}" não).

### Criar uma nova landing page de exame (campanha)
As landing pages ficam em URLs tipo `unodiagnostico.com/<slug>` e são 100% geradas a partir de um único arquivo JSON em `data/landing-pages/`.

**Passo a passo:**
1. Copie `data/landing-pages/tomografia.json` como modelo e renomeie para `<slug>.json` (ex: `ultrassonografia.json`).
2. Preencha todos os campos: `slug`, `exam_name`, `exam_short`, `seo`, `whatsapp_message`, `whatsapp_message_price`, `hero`, `about`, `indications`, `differentials`, `preparation`, `process`, `faq`.
   - `seo.title`: no máximo 60 caracteres, no formato "<Exame> em Maracanaú | Uno Diagnóstico" (título maior é cortado no Google).
   - `seo.description`: até 155 caracteres, com exame, cidade, um diferencial confirmado (regra 14) e
     o convite para agendar. Acima de 160 o Google corta e o Bing marca erro; o build avisa.
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
     da página (ver "Preço particular"). `price_from` (opcional) fixa ou esconde o valor;
     `price_items` (opcional) lista os produtos do feed que valem para a página.
   - `sticky_cta` (opcional): texto do botão fixo do celular. O padrão é "Agendar <exam_short>
     pelo WhatsApp"; acima de 38 caracteres ele não cabe em tela de 360 px (o build avisa).
   - **Subpágina de exame** (ex.: `/ultrassom-abdome-total/`, filha de `/ultrassonografia/`):
     `"parent": "<slug da página-mãe>"`. A subpágina usa o ícone e a foto da mãe (até ter foto
     própria em `public/images/exames/<slug>.jpg`), entra no rodapé logo depois dela, ganha a
     linha "Veja também" (mãe e irmãs), leva a mãe no caminho de navegação do schema.org e fica
     fora da lista de preços da FAQ da home. Na página-mãe, `"page": "<slug>"` em um cartão de
     `indications.items` cria o link "Saiba mais sobre <exame>". Hoje: ultrassom obstétrico e
     morfológico, abdome total e Doppler vascular.
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
    O botão fixo do celular dessas páginas usa letra menor até 380 px de tela e comporta até 38
    caracteres; nome de exame mais comprido usa `sticky_cta`.
13. **Links entre páginas são automáticos:** rodapé de todas as páginas lista os exames
    (`examLinksHTML()`), e os cards da home apontam para a landing com texto "Saiba mais sobre <exame>".
    Landing nova entra sozinha no rodapé; o card da home só ganha o link se, em `services.json`,
    o `id` do exame for igual ao `slug` da landing ou o `name` for igual ao `exam_name` dela.
    Para os posts citarem uma landing nova na caixa "Exames citados neste artigo", incluir o slug
    dela em `EXAM_KEYWORDS` (no `build.js`), com as palavras que identificam o exame.
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
    - **Cadastro da empresa (25/11/2026: vale o que está no CNPJ):** razão social
      "Uno - Clínica de Diagnósticos por Imagem LTDA" (com hífen e "Diagnósticos" no plural),
      CNPJ 33.446.906/0001-93. Unidade principal: Avenida I, 57, Business Place Torre 2,
      Jereissati I, CEP 61900-410 (o site usava 61900-320, que é o CEP da Rua 7; a Avenida I e a
      Av. Yolanda Pontes Vidal Queiroz são a mesma via). E-mail da clínica: uno@unodiagnostico.com.
    - **Ficha do Google (25/11/2026):** o CEP da ficha fica como está (61900-320), por decisão
      dele; o site segue com 61900-410, do CNPJ. Não mexer no endereço da ficha nem propor a troca
      de novo, a não ser que ele peça.
    - **Privacidade (25/11/2026):** encarregado pelo tratamento de dados: Leonardo José Araújo
      Macêdo de Alcântara, contato uno@unodiagnostico.com. Cookies de medição só com consentimento;
      sem remarketing. A avaliação de conflito de interesse do encarregado ficou com o jurídico.
15. **Mais de uma sessão publica neste repositório** (em 25/11/2026, outra sessão trocou o rótulo
    do Google Ads enquanto esta mexia nos títulos). O envio pelo navegador substitui o arquivo
    inteiro: antes de enviar, rodar `git fetch` e conferir que o arquivo não mudou em
    `origin/main` desde a cópia de trabalho, para não apagar a mudança de outra sessão.
    **Nunca publicar pela pasta do computador (OneDrive) com a Vercel CLI:** ela está atrás do
    repositório e o deploy traria de volta a versão antiga do site. O que sai da pasta (por
    exemplo, o post que a tarefa semanal escreve lá) entra no site pelo repositório.

---

## URL canônica

`https://unodiagnostico.com` (apex) é o host oficial — a Vercel redireciona `www` para ele.
Toda URL absoluta (canonical, og:url, schema.org, sitemap) sai da constante `SITE_URL` no
`build.js`, sempre **com barra final**, pra bater exatamente com o que o servidor entrega.
Nunca escrever `https://unodiagnostico.com/...` à mão em template ou script: usar
`siteUrl('caminho')` para páginas e `assetUrl('images/x.png')` para arquivos.

## Tracking de conversão

Todas as páginas (home, landings, blog e política de privacidade) têm `trackWhatsappClick(location)`.
**Nada é medido antes de a pessoa aceitar os cookies** (ver "Aviso de cookies e privacidade"): sem o
aceite, `gtag()` não faz nada. Depois do aceite, cada clique dispara:
1. o evento `whatsapp_click` no GA4 (`G-4T951CHR0E`), com `landing_page` identificando a página e
   `location` identificando o botão (`header`, `hero`, `flutuante`, `sticky-mobile`, `footer`...);
2. a conversão "Whatsapp" do Google Ads. O `send_to` fica em `data/site.json` > `tracking` e foi
   trocado em 25/11/2026, por outra sessão, para `AW-715533760/0cuGCI2c4fcCEMDbmNUC` (commit
   `9251564`: rótulo lido no snippet de evento da ação no Google Ads; segundo ele, o anterior,
   `KKyuCPnntfcCEMDbmNUC`, não era dessa ação).

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

## Aviso de cookies e privacidade

Em vigor desde a publicação da política (decidido pelo Dr. Leonardo em 25/11/2026: modelo de
consentimento, sem remarketing). **O que o site promete na política e o código precisa cumprir:**

- **As etiquetas do Google (Analytics e Ads) só carregam depois do "Aceitar".** Antes disso nenhum
  cookie é gravado e nada vai ao Google; quem recusa ou não responde não é medido (nem o clique de
  WhatsApp). Por isso os números do Analytics e as conversões do Google Ads são menores que as
  visitas reais.
- **"Recusar" e "Aceitar" têm o mesmo destaque** (mesma classe `.cc-btn`). Não transformar um deles
  em link nem mudar cor ou tamanho de um só.
- **A escolha vale 180 dias** e fica no navegador (`localStorage`, chave `uno_cookie_consent`). O
  link "Cookies" do rodapé reabre o aviso; recusar depois de ter aceitado apaga os cookies `_ga*` e
  `_gcl*` e recarrega a página sem as etiquetas.
- **Sem remarketing:** `ad_personalization` fica sempre negado no consentimento enviado ao Google.

Onde fica cada parte (fonte única; o build injeta em todos os templates):
- `src/js/consent.js`: trecho do `<head>` (marcador `{{CONSENT_BOOTSTRAP}}`). Define `gtag()` (que só
  funciona depois do aceite), `unoConsent.accept()`, `.refuse()` e `.ask()`, e carrega o gtag.js.
- `src/templates/cookie-banner.html`: o aviso (marcador `{{COOKIE_BANNER}}`, logo depois do `<body>`).
  Já vem no HTML e só aparece quando o `<html>` tem a classe `cc-ask`; é fixo na tela, não empurra nada.
- `src/styles/consent.css`: anexado pelo build ao `{{CSS}}` e ao `{{LANDING_CSS}}`.
- Rodapé de todos os templates: links "Política de Privacidade" (`{{PRIVACY_URL}}`) e "Cookies".

Regras:
- **Nunca colocar `<script src="https://www.googletagmanager.com/...">` direto em template**, nem
  outra ferramenta de medição ou anúncio (pixel da Meta, Hotjar, etc.). Ferramenta nova entra em
  `loadTags()` do `consent.js` **e** na tabela de cookies de `data/privacy.json`.
- Template novo precisa de `{{CONSENT_BOOTSTRAP}}` no `<script>` do `<head>`, `{{COOKIE_BANNER}}` depois
  do `<body>` e a linha de links do rodapé (copiar de `blog-index.html`).
- A página 404 não tem medição nem aviso.
- **Search Console:** a propriedade `https://unodiagnostico.com/` era verificada pelo código do
  Analytics fixo no `<head>`. Como o gtag.js agora só carrega depois do aceite, a home leva a metatag
  `google-site-verification` (em `src/templates/index.html`), que é o método "Tag HTML" do Search
  Console. **Não remover a metatag.** Se a verificação cair, é só clicar em "Verificar" nesse método.
- **Bing Webmaster Tools:** o site `https://unodiagnostico.com/` foi cadastrado em 25/11/2026 (o
  login é do Dr. Leonardo) e é verificado pela metatag `msvalidate.01`, também em
  `src/templates/index.html`. **Não remover a metatag.** O `sitemap.xml` está enviado lá. Página nova
  ou muito alterada: enviar a URL em "URL Submission" (equivale ao "Solicitar indexação" do Search
  Console). O relatório "AI Performance" mostra as citações do site no Copilot e em parceiros da
  Microsoft. **Não ligar o Microsoft Clarity** que o painel oferece: é ferramenta de medição e cai na
  regra acima (consentimento e tabela de cookies).

### Política de Privacidade
Página `/politica-de-privacidade/`, gerada de `data/privacy.json` com o template `legal.html`.
- Cada seção tem `id`, `heading` e `blocks`. Blocos: `{ "p": "texto" }`, `{ "ul": [...] }` e
  `{ "table": { "head": [...], "rows": [[...]] } }`. No texto, `**negrito**` e `` `código` ``; e-mail e
  telefone viram link sozinhos.
- Dados da clínica entram por marcadores preenchidos com `data/site.json`: `{{LEGAL_NAME}}`, `{{CNPJ}}`
  (`cnpj`), `{{ADDRESS_FULL}}`, `{{DPO_NAME}}` e `{{DPO_EMAIL}}` (`privacy.dpo_name`, `privacy.dpo_email`),
  `{{PHONE}}` e `{{GA4_COOKIE}}`.
- **Ao mudar o texto, atualizar `updated`** (a data aparece no topo da página e no sitemap).
- O texto descreve o que o site e a clínica fazem. Mudou a prática (ferramenta nova, novo uso de
  dados, outro encarregado)? Mudar a política junto. Texto jurídico novo passa pelo Dr. Leonardo
  antes de ir ao ar.

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
