import fs from 'node:fs/promises'
import express from 'express'
import Fuse from 'fuse.js'
import { glob } from 'glob'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : ''
const ssrManifest = isProduction
  ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
  : undefined

// Create http server
const app = express()

// Add Vite or respective production middlewares
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve static assets from public directory
app.use(express.static('./public'))

// Serve HTML
app.get('/:query', async (req, res) => {
  try {
    const context = await glob('./public/assets/*.{png,jpg,jpeg,gif,svg}')
    const fileList = context.map((key) => key.replace(/public\/assets\/|public\\assets\\/, ''))

    const result = searchFiles(fileList, req.params.query)

    if (result) {
      res.status(200).sendFile('/assets/' + result, { root: './public' })
    } else {
      res.status(404).send('Not found')
    }
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    let template
    let render
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.ts')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const rendered = await render(url, ssrManifest)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})

function searchFiles(images, userInput) {
  const fuse = new Fuse(images, {
    keys: ['item'],
    includeScore: true
  })

  let closestMatch = null
  // Try inline search
  const inlineMatch = findClosestMatch(images, userInput)

  if (inlineMatch) {
    closestMatch = inlineMatch
  } else {
    // Fallback to fuzzy search
    const fuzzyMatches = fuse.search(userInput)
    if (fuzzyMatches.length > 0) {
      // Return the first fuzzy match as the closest match
      closestMatch = fuzzyMatches[0].item
    } else {
      closestMatch = null
    }
  }

  return closestMatch
}

function findClosestMatch(availableImages, query) {
  const matches = availableImages.filter((image) =>
    image.toLowerCase().includes(query.toLowerCase())
  )

  if (matches.length > 0) {
    // Return the first match as the closest match
    return matches[0]
  } else {
    return null
  }
}
