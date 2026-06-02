// server.js
const express = require('express')
const cors = require('cors')

require('./database')

const authRoutes        = require('./routes/auth')
const psychRoutes       = require('./routes/psychologists')
const sessionsRoutes    = require('./routes/sessions')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/auth',          authRoutes)
app.use('/psychologists', psychRoutes)
app.use('/sessions',      sessionsRoutes)

app.get('/', (req, res) => {
  res.json({
    app: 'Acolhe+ API',
    version: '2.0.0',
    status: 'online',
    endpoints: {
      auth: [
        'GET    /auth/professional-types',
        'POST   /auth/register/paciente',
        'POST   /auth/register/profissional',
        'POST   /auth/login',
        'GET    /auth/me',
        'PUT    /auth/me',
        'PUT    /auth/me/professional-profile  [profissional]',
      ],
      professionals: [
        'GET    /psychologists',
        'GET    /psychologists/:id',
      ],
      sessions: [
        'GET    /sessions                     [paciente]',
        'GET    /sessions/my-appointments     [profissional]',
        'POST   /sessions                     [paciente]',
        'PATCH  /sessions/:id',
        'DELETE /sessions/:id                 [paciente]',
      ],
    },
  })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

app.listen(PORT, () => {
  console.log(`Acolhe+ API v2 rodando em http://localhost:${PORT}`)
})
