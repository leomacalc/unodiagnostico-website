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
│   └── blog-posts.json      # Posts do blog
│
├── src/                     # Templates e assets fonte
│   ├── templates/
│   │   └── index.html       # Template principal (usa placeholders {{...}})
│   ├── styles/
│   │   └── main.css         # Estilos do site
│   └── js/
│       └── main.js          # JavaScript do site
│
├── public/                  # Arquivos estáticos (copiados direto para dist/)
│   └── images/              # Imagens do site
│       ├── gallery/         # Fotos do espaço
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
- `icon`: ícone (opções: xray, syringe, ultrasound, ct-scan, bone, mammography)
- `short_description`: texto curto para o card
- `description`: texto completo para o modal
- `preparations`: lista de orientações de preparo

### Adicionar/editar um médico
Editar `data/doctors.json` — cada médico tem:
- `id`: identificador único
- `name`, `specialty`, `crm`, `rqe`
- `photo`: caminho para foto em public/images/
- `qualifications`: lista de formações

### Adicionar um convênio
Editar `data/insurance.json` — adicionar ao array `partners`:
```json
{ "id": "nome-convenio", "name": "Nome do Convênio", "logo": "images/nome-logo.png" }
```

### Publicar um post no blog
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

---

## Links Externos Importantes

- **Sistema de Resultados:** https://uno.otimusclinic.com/uno/servlet/app.resultadodeexame?sdTjZIxAkYVpFL5AwTTQ8QwYtMA7qRj3B6bU5uP3P0Y=
- **WhatsApp:** https://api.whatsapp.com/send?phone=558521816818
- **Instagram:** https://instagram.com/unodiagnostico
- **Facebook:** https://m.facebook.com/unodiagnostico/
