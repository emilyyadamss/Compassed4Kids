import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/* `npm run dev` serves the app from Vite and the quiz endpoint from Vercel's
   `api/` directory, which Vite otherwise knows nothing about. Without this you
   would have to run `vercel dev` to see a quiz work locally.

   The same module Vercel will run in production is loaded here through
   `ssrLoadModule`, so it hot-reloads on edit and there is no second copy of
   the handler to keep in step. */
function apiInDev(env) {
  return {
    name: 'compassed-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/quiz', async (req, res) => {
        /* Answered here rather than passed on. Falling through would let Vite
           resolve /api/quiz to the module and serve its source as a
           transformed asset, which is a confusing thing to find in a browser
           even though the secrets are all in env. */
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'POST only' }))
        }

        /* Server-side keys, from the same .env as the client's. These are read
           in the Node process only — Vite never exposes an unprefixed variable
           to the browser bundle, which is the entire reason the Anthropic key
           is spelled without VITE_. */
        process.env.ANTHROPIC_API_KEY ||= env.ANTHROPIC_API_KEY || ''
        process.env.QUIZ_SECRET ||= env.QUIZ_SECRET || ''
        process.env.SUPABASE_URL ||= env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
        process.env.SUPABASE_ANON_KEY ||= env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''

        try {
          const { default: handler } = await server.ssrLoadModule('/api/quiz.js')
          await handler(req, res)
        } catch (err) {
          server.config.logger.error(`[api/quiz] ${err.stack || err}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify({ error: 'The quiz endpoint failed to load. Check the dev server log.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // '' as the prefix so unprefixed server keys are readable here too.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiInDev(env)],
    server: { open: true },
  }
})
