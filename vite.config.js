import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-env-file',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url ? req.url.split('?')[0] : '';
          if (pathname.endsWith('/env/.env')) {
            const envPath = path.resolve(__dirname, 'env/.env')
            if (fs.existsSync(envPath)) {
              res.setHeader('Content-Type', 'text/plain')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(fs.readFileSync(envPath))
              return
            }
          }
          next()
        })
      },
      closeBundle() {
        const src = path.resolve(__dirname, 'env/.env')
        const destDir = path.resolve(__dirname, 'dist/env')
        const dest = path.resolve(destDir, '.env')
        if (fs.existsSync(src)) {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
          }
          fs.copyFileSync(src, dest)
        }
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: ['..']
    }
  }
})
