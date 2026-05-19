// routes/auth.js
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database')

const JWT_SECRET = process.env.JWT_SECRET || 'acolhe_secret_2024'

// ─── Cadastro ─────────────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, email, password, role = 'paciente' } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing)
    return res.status(409).json({ error: 'E-mail já cadastrado.' })

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, role)

  const user = db.prepare('SELECT id, name, email, role, address FROM users WHERE id = ?').get(result.lastInsertRowid)
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

  res.status(201).json({ user, token })
})

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user)
    return res.status(401).json({ error: 'Credenciais inválidas.' })

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid)
    return res.status(401).json({ error: 'Credenciais inválidas.' })

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  const { password: _, ...userSafe } = user

  res.json({ user: userSafe, token })
})

// ─── Perfil do usuário logado ─────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, address FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json(user)
})

// ─── Atualizar perfil ─────────────────────────────────────────────────────────
router.put('/me', auth, (req, res) => {
  const { name, address } = req.body
  db.prepare('UPDATE users SET name = ?, address = ? WHERE id = ?').run(name, address, req.userId)
  const user = db.prepare('SELECT id, name, email, role, address FROM users WHERE id = ?').get(req.userId)
  res.json(user)
})

// ─── Middleware de autenticação ───────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Token não fornecido.' })

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.id
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
  }
}

module.exports = router
module.exports.auth = auth
