// server.js
const express = require('express')
const cors = require('cors')

// Inicializa banco ao subir
require('./database')

const authRoutes        = require('./routes/auth')
const psychRoutes       = require('./routes/psychologists')
const sessionsRoutes    = require('./routes/sessions')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes)
app.use('/psychologists', psychRoutes)
app.use('/sessions',      sessionsRoutes)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    app: 'Acolhe+ API',
    version: '1.0.0',
    status: 'online',
    endpoints: [
      'POST   /auth/register',
      'POST   /auth/login',
      'GET    /auth/me',
      'PUT    /auth/me',
      'GET    /psychologists',
      'GET    /psychologists/:id',
      'GET    /sessions',
      'POST   /sessions',
      'PATCH  /sessions/:id',
      'DELETE /sessions/:id',
    ],
  })
})

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

app.listen(PORT, () => {
  console.log(`Acolhe+ API rodando em http://localhost:${PORT}`)
})
