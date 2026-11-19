// routes/auth.js
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database')
const { PROFESSIONAL_TYPES } = require('../database')

// Em produção a chave é obrigatória; em desenvolvimento usa uma chave local de teste.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Defina a variável de ambiente JWT_SECRET')
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret'

// ─── Cadastro de PACIENTE ─────────────────────────────────────────────────────
// POST /auth/register/paciente
router.post('/register/paciente', (req, res) => {
  const { name, email, password, phone = '', address = '' } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing)
    return res.status(409).json({ error: 'E-mail já cadastrado.' })

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, hash, 'paciente', phone, address)

  const user = db.prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?').get(result.lastInsertRowid)
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

  res.status(201).json({ user, token })
})

// ─── Cadastro de PROFISSIONAL ─────────────────────────────────────────────────
// POST /auth/register/profissional
router.post('/register/profissional', (req, res) => {
  const {
    // dados de usuário
    name, email, password, phone = '', address = '',
    // dados profissionais
    profession, register_number, specialty,
    approach = '', price = 0, audience = '',
    care_model = '', bio = '', formation = '',
    specialization = '', areas = [], schedule = [],
    online = true, presential = false,
  } = req.body

  // Validações básicas
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' })

  if (!profession || !register_number || !specialty)
    return res.status(400).json({ error: 'Profissão, número de registro e especialidade são obrigatórios.' })

  if (!PROFESSIONAL_TYPES.includes(profession))
    return res.status(400).json({
      error: 'Profissão inválida.',
      valid_professions: PROFESSIONAL_TYPES,
    })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing)
    return res.status(409).json({ error: 'E-mail já cadastrado.' })

  const registerAll = db.transaction(() => {
    const hash = bcrypt.hashSync(password, 10)
    const userResult = db.prepare(
      'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hash, 'profissional', phone, address)

    db.prepare(`
      INSERT INTO professionals
        (user_id, profession, register_number, specialty, approach, price, audience,
         care_model, bio, formation, specialization, areas, schedule, online, presential, approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      userResult.lastInsertRowid,
      profession, register_number, specialty, approach,
      price, audience, care_model, bio, formation, specialization,
      JSON.stringify(areas), JSON.stringify(schedule),
      online ? 1 : 0, presential ? 1 : 0
    )

    return userResult.lastInsertRowid
  })

  const newUserId = registerAll()
  const user = db.prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?').get(newUserId)
  const profile = getProfessionalProfile(newUserId)
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

  res.status(201).json({
    user,
    profile,
    token,
    message: 'Cadastro realizado! Aguarde aprovação para aparecer na listagem.',
  })
})

// ─── Login (paciente ou profissional) ────────────────────────────────────────
// POST /auth/login
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

  // Se for profissional, retorna os dados do perfil profissional também
  let profile = null
  if (user.role === 'profissional') {
    profile = getProfessionalProfile(user.id)
  }

  res.json({ user: userSafe, profile, token })
})

// ─── Perfil do usuário logado ─────────────────────────────────────────────────
// GET /auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  let profile = null
  if (user.role === 'profissional') {
    profile = getProfessionalProfile(user.id)
  }

  res.json({ user, profile })
})

// ─── Atualizar perfil do usuário ──────────────────────────────────────────────
// PUT /auth/me
router.put('/me', auth, (req, res) => {
  const { name, address, phone } = req.body
  db.prepare('UPDATE users SET name = ?, address = ?, phone = ? WHERE id = ?')
    .run(name, address, phone, req.userId)

  const user = db.prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?').get(req.userId)
  res.json({ user })
})

// ─── Atualizar perfil profissional ────────────────────────────────────────────
// PUT /auth/me/professional-profile
router.put('/me/professional-profile', auth, requireRole('profissional'), (req, res) => {
  const {
    specialty, approach, price, audience, care_model,
    bio, formation, specialization, areas, schedule,
    online, presential,
  } = req.body

  const pro = db.prepare('SELECT id FROM professionals WHERE user_id = ?').get(req.userId)
  if (!pro) return res.status(404).json({ error: 'Perfil profissional não encontrado.' })

  db.prepare(`
    UPDATE professionals SET
      specialty = ?, approach = ?, price = ?, audience = ?, care_model = ?,
      bio = ?, formation = ?, specialization = ?, areas = ?, schedule = ?,
      online = ?, presential = ?
    WHERE user_id = ?
  `).run(
    specialty, approach, price, audience, care_model,
    bio, formation, specialization,
    JSON.stringify(areas || []), JSON.stringify(schedule || []),
    online ? 1 : 0, presential ? 1 : 0,
    req.userId
  )

  const profile = getProfessionalProfile(req.userId)
  res.json({ profile })
})

// ─── Listar tipos de profissional válidos ─────────────────────────────────────
// GET /auth/professional-types
router.get('/professional-types', (req, res) => {
  res.json({ types: PROFESSIONAL_TYPES })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getProfessionalProfile(userId) {
  const pro = db.prepare('SELECT * FROM professionals WHERE user_id = ?').get(userId)
  if (!pro) return null
  return {
    ...pro,
    online: pro.online === 1,
    presential: pro.presential === 1,
    approved: pro.approved === 1,
    areas: JSON.parse(pro.areas || '[]'),
    schedule: JSON.parse(pro.schedule || '[]'),
    testimonials: JSON.parse(pro.testimonials || '[]'),
  }
}

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

// ─── Middleware de role ───────────────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole))
      return res.status(403).json({ error: 'Acesso não autorizado para este tipo de usuário.' })
    next()
  }
}

module.exports = router
module.exports.auth = auth
module.exports.requireRole = requireRole
