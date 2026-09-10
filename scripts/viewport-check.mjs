// Varredura de viewport: procura transbordo horizontal e elementos que escapam
// da viewport em cada breakpoint, com o quadro e com cada modal aberto.
//
//   npm run build && npm run viewport-check
//
// Sai com codigo 1 se encontrar transbordo, para poder rodar em CI.

import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const DIST = 'dist'
const PORT = 4478

const WIDTHS = [320, 360, 390, 414, 480, 640, 768, 1024, 1280, 1600]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
}

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
        res.writeHead(404)
        res.end('')
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

/**
 * O quadro Kanban rola horizontalmente de proposito, dentro do seu container.
 * O que nao pode acontecer e o <body> transbordar — isso sim e quebra de layout.
 */
async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const bodyOverflow = doc.scrollWidth - doc.clientWidth

    // Elementos que passam da borda direita da viewport, ignorando os que estao
    // dentro de um container com overflow horizontal proprio.
    const escaping = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right <= doc.clientWidth + 1 && r.left >= -1) continue

      let scrollable = false
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if (ox === 'auto' || ox === 'scroll') { scrollable = true; break }
      }
      if (scrollable) continue

      escaping.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 70),
        left: Math.round(r.left),
        right: Math.round(r.right),
      })
    }
    return { bodyOverflow, escaping: escaping.slice(0, 5) }
  })
}

const STATES = [
  { name: 'kanban', open: async () => {} },
  { name: 'lista', open: async p => { await p.getByLabel('Visualização Lista').click(); await p.waitForTimeout(400) } },
  { name: 'nova-tarefa', open: async p => { await p.locator('button', { hasText: 'Nova tarefa' }).first().click(); await p.waitForTimeout(400) } },
  { name: 'configuracoes', open: async p => { await p.getByLabel('Configurações').click(); await p.waitForTimeout(700) } },
]

async function main() {
  const server = await serve()
  const browser = await chromium.launch({ channel: 'chrome' })
  const base = `http://localhost:${PORT}/`
  const problems = []

  console.log('largura  estado          transbordo  elementos fora')
  console.log('-------  --------------  ----------  --------------')

  try {
    for (const width of WIDTHS) {
      for (const state of STATES) {
        const ctx = await browser.newContext({
          viewport: { width, height: 800 },
          hasTouch: width < 640,
          isMobile: width < 640,
        })
        const page = await ctx.newPage()
        await page.goto(base)
        await page.waitForSelector('text=A fazer', { timeout: 10000 })
        await state.open(page)
        await page.waitForTimeout(250)

        const { bodyOverflow, escaping } = await measure(page)
        const bad = bodyOverflow > 1 || escaping.length > 0
        if (bad) problems.push({ width, state: state.name, bodyOverflow, escaping })

        console.log(
          `${String(width).padStart(7)}  ${state.name.padEnd(14)}  ` +
          `${String(bodyOverflow).padStart(10)}  ${escaping.length ? '⚠ ' + escaping.length : 'ok'}`,
        )
        await ctx.close()
      }
    }
  } finally {
    await browser.close()
    server.close()
  }

  if (problems.length === 0) {
    console.log('\nSem transbordo horizontal em nenhum breakpoint.')
    return
  }

  console.log('\nProblemas encontrados:')
  for (const p of problems) {
    console.log(`\n  ${p.width}px / ${p.state} — transbordo ${p.bodyOverflow}px`)
    for (const e of p.escaping) {
      console.log(`    <${e.tag} class="${e.cls}"> left=${e.left} right=${e.right}`)
    }
  }
  process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
