// routes/sessions.js
const router = require('express').Router()
const db = require('../database')
const { auth } = require('./auth')

// ─── Listar sessões do usuário logado ─────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const sessions = db.prepare(
    'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.userId)
  res.json(sessions)
})

// ─── Agendar sessão ───────────────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { psy_id, professional, specialty, date, time, notes } = req.body

  if (!professional || !specialty || !date)
    return res.status(400).json({ error: 'Profissional, especialidade e data são obrigatórios.' })

  const result = db.prepare(`
    INSERT INTO sessions (user_id, psy_id, professional, specialty, date, time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'Agendada', ?)
  `).run(req.userId, psy_id || null, professional, specialty, date, time || null, notes || '')

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(session)
})

// ─── Atualizar status da sessão ───────────────────────────────────────────────
router.patch('/:id', auth, (req, res) => {
  const { status } = req.body
  const valid = ['Agendada', 'Realizada', 'Cancelada']

  if (!valid.includes(status))
    return res.status(400).json({ error: 'Status inválido.' })

  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' })

  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, req.params.id)
  const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// ─── Deletar sessão ───────────────────────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' })

  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id)
  res.json({ message: 'Sessão removida.' })
})

module.exports = router
