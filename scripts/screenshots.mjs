// Captura as imagens usadas no README a partir da build de produção.
//
// Usa o Chrome instalado no sistema (channel: 'chrome') em vez do Chromium do
// Playwright, para não depender de download do navegador.
//
//   npm run build && npm run screenshots
//
// As capturas partem de um localStorage semeado, de modo que as imagens sejam
// determinísticas em vez de refletirem o estado de quem rodou o script.

import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

// Duas geometrias: o quadro cabe inteiro em 1600px de largura (5 colunas de
// 288px + gaps) e nao precisa de altura sobrando; os modais precisam de altura.
const BOARD = { viewport: { width: 1600, height: 660 }, deviceScaleFactor: 1 }
const MODAL = { viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 }

const DIST = 'dist'
const OUT = 'docs/screenshots'
const PORT = 4477

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
}

// ─── Dados de exemplo ───────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'todo', rotulo: 'A fazer', colorKey: 'gray' },
  { id: 'doing', rotulo: 'Em andamento', colorKey: 'blue' },
  { id: 'review', rotulo: 'Em revisão', colorKey: 'amber' },
  { id: 'pending', rotulo: 'Pendente', colorKey: 'rose' },
  { id: 'done', rotulo: 'Concluído', colorKey: 'green' },
]

const TAGS = [
  { id: 'tag-frontend', name: 'frontend', color: 'blue' },
  { id: 'tag-backend', name: 'backend', color: 'teal' },
  { id: 'tag-design', name: 'design', color: 'violet' },
  { id: 'tag-qa', name: 'qa', color: 'green' },
  { id: 'tag-infra', name: 'infra', color: 'red' },
  { id: 'tag-docs', name: 'docs', color: 'cyan' },
]

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TASKS = [
  {
    id: 't1', titulo: 'Redesenhar a tela de login',
    descricao: 'Aplicar o novo design system e validar contraste em tema escuro.',
    status: 'doing', prioridade: 'alta', responsavel: 'Ana Beatriz',
    prazo: daysFromNow(3), etiquetas: ['design', 'frontend'],
    criado_em: '2026-09-01T09:00:00.000Z',
    subtarefas: [
      { id: 's1', texto: 'Levantar referências', concluida: true, ordem: 0 },
      { id: 's2', texto: 'Protótipo em Figma', concluida: true, ordem: 1 },
      { id: 's3', texto: 'Revisar contraste AA', concluida: false, ordem: 2 },
    ],
  },
  {
    id: 't2', titulo: 'Migrar autenticação para OAuth',
    descricao: 'Substituir o fluxo de sessão por tokens com refresh automático.',
    status: 'doing', prioridade: 'urgente', responsavel: 'Carlos Menezes',
    prazo: daysFromNow(1), etiquetas: ['backend', 'infra'],
    criado_em: '2026-09-02T11:30:00.000Z',
  },
  {
    id: 't3', titulo: 'Escrever testes do checkout',
    descricao: 'Cobrir cupom inválido, estoque zerado e falha de pagamento.',
    status: 'todo', prioridade: 'alta', responsavel: 'Ana Beatriz',
    prazo: daysFromNow(7), etiquetas: ['qa'],
    criado_em: '2026-09-03T08:15:00.000Z',
  },
  {
    id: 't4', titulo: 'Documentar a API de relatórios',
    descricao: 'Descrever os filtros e os formatos de exportação disponíveis.',
    status: 'todo', prioridade: 'baixa', responsavel: 'Marina Alves',
    prazo: '', etiquetas: ['docs'],
    criado_em: '2026-09-04T14:00:00.000Z',
  },
  {
    id: 't5', titulo: 'Revisar consulta lenta do dashboard',
    descricao: 'A agregação mensal passa de 4 s com mais de 50 mil registros.',
    status: 'review', prioridade: 'media', responsavel: 'Carlos Menezes',
    prazo: daysFromNow(4), etiquetas: ['backend'],
    criado_em: '2026-09-05T10:20:00.000Z',
  },
  {
    id: 't6', titulo: 'Ajustar responsividade do menu',
    descricao: 'O menu lateral não fecha ao navegar em telas menores que 768 px.',
    status: 'review', prioridade: 'media', responsavel: 'Marina Alves',
    prazo: daysFromNow(-2), etiquetas: ['frontend'],
    criado_em: '2026-09-06T16:45:00.000Z',
  },
  {
    id: 't7', titulo: 'Renovar certificado do domínio',
    descricao: 'Bloqueado: aguardando liberação de acesso ao painel de DNS.',
    status: 'pending', prioridade: 'urgente', responsavel: 'Carlos Menezes',
    prazo: daysFromNow(2), etiquetas: ['infra'],
    criado_em: '2026-09-07T09:10:00.000Z',
    motivo_pendencia: 'Acesso ao painel de DNS ainda não liberado pelo time de infraestrutura.',
  },
  {
    id: 't8', titulo: 'Configurar pipeline de CI',
    descricao: 'Rodar typecheck, lint, testes e build em cada pull request.',
    status: 'done', prioridade: 'alta', responsavel: 'Ana Beatriz',
    prazo: daysFromNow(-5), etiquetas: ['infra', 'qa'],
    criado_em: '2026-08-28T13:00:00.000Z',
    solucao: 'Workflow do GitHub Actions com cache de npm e auditoria de dependências.',
    data_conclusao: daysFromNow(-5),
  },
  {
    id: 't9', titulo: 'Padronizar mensagens de erro',
    descricao: 'Unificar textos e tom de voz nos formulários.',
    status: 'done', prioridade: 'baixa', responsavel: 'Marina Alves',
    prazo: daysFromNow(-8), etiquetas: ['design', 'docs'],
    criado_em: '2026-08-25T15:30:00.000Z',
    solucao: 'Criado um catálogo único de mensagens, referenciado pelos formulários.',
    data_conclusao: daysFromNow(-8),
  },
]

// ─── Servidor estático mínimo ───────────────────────────────────────────────
function serve() {
  return new Promise(resolve => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`)
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
      if (path === '' || path.endsWith('/')) path = 'index.html'
      try {
        const body = await readFile(join(DIST, path))
        res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' })
        res.end(body)
      } catch {
        const body = await readFile(join(DIST, 'index.html'))
        res.writeHead(200, { 'Content-Type': MIME['.html'] })
        res.end(body)
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

// ─── Captura ────────────────────────────────────────────────────────────────
async function seed(page, theme) {
  await page.addInitScript(
    ({ tasks, columns, tags, theme }) => {
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks))
      localStorage.setItem('taskflow_columns', JSON.stringify(columns))
      localStorage.setItem('taskflow_tags', JSON.stringify(tags))
      localStorage.setItem('taskflow_theme', theme)
      localStorage.setItem('taskflow_view', 'kanban')
    },
    { tasks: TASKS, columns: COLUMNS, tags: TAGS, theme },
  )
}

async function shot(page, name) {
  // As animações de entrada são curtas; esperar o quadro assentar.
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(OUT, `${name}.png`) })
  console.log(`  ✓ ${name}.png`)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const server = await serve()
  const browser = await chromium.launch({ channel: 'chrome' })
  const base = `http://localhost:${PORT}/`

  try {
    // 1 — Kanban, tema claro (desktop)
    let ctx = await browser.newContext(BOARD)
    let page = await ctx.newPage()
    await seed(page, 'light')
    await page.goto(base)
    await page.waitForSelector('text=Em andamento')
    await shot(page, '01-kanban-claro')

    // 2 — Kanban, tema escuro
    await page.getByLabel(/Mudar para tema/).click()
    await shot(page, '02-kanban-escuro')

    // 3 — Visão em lista, com filtros
    await page.getByLabel('Visualização Lista').click()
    await page.getByLabel(/Mudar para tema/).click()
    await shot(page, '03-lista')
    await ctx.close()

    // 4 — Detalhe da tarefa, com subtarefas
    ctx = await browser.newContext(MODAL)
    page = await ctx.newPage()
    await seed(page, 'light')
    await page.goto(base)
    await page.waitForSelector('text=Redesenhar a tela de login')
    await page.getByText('Redesenhar a tela de login').click()
    await shot(page, '04-detalhe-tarefa')
    await page.keyboard.press('Escape')

    // 5 — Formulário de nova tarefa
    await page.getByText('Nova tarefa').click()
    await page.getByLabel(/Título/).fill('Revisar contrato de dados da API')
    await shot(page, '05-nova-tarefa')
    await page.keyboard.press('Escape')

    // 6 — Configurações: pipeline
    await page.getByLabel('Configurações').click()
    await page.waitForSelector('text=Configurações')
    await shot(page, '06-configuracoes-pipeline')

    // 7 — Configurações: dados (export / import)
    await page.getByRole('button', { name: /Dados/ }).click()
    await shot(page, '07-configuracoes-dados')
    await ctx.close()

    // 8 — Mobile
    ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    page = await ctx.newPage()
    await seed(page, 'light')
    await page.goto(base)
    await page.waitForSelector('text=Em andamento')
    await shot(page, '08-mobile-kanban')
    await ctx.close()
  } finally {
    await browser.close()
    server.close()
  }

  console.log(`\nCapturas salvas em ${OUT}/`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
