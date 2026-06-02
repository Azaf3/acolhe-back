// routes/sessions.js
const router = require('express').Router()
const db = require('../database')
const { auth, requireRole } = require('./auth')

// ─── Paciente: listar suas sessões ────────────────────────────────────────────
router.get('/', auth, requireRole('paciente'), (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, u.name AS professional_name, p.profession
    FROM sessions s
    LEFT JOIN professionals pro ON pro.id = s.professional_id
    LEFT JOIN users u ON u.id = pro.user_id
    LEFT JOIN professionals p ON p.id = s.professional_id
    WHERE s.patient_id = ?
    ORDER BY s.created_at DESC
  `).all(req.userId)
  res.json(sessions)
})

// ─── Profissional: listar sessões recebidas ───────────────────────────────────
router.get('/my-appointments', auth, requireRole('profissional'), (req, res) => {
  const pro = db.prepare('SELECT id FROM professionals WHERE user_id = ?').get(req.userId)
  if (!pro) return res.status(404).json({ error: 'Perfil profissional não encontrado.' })

  const sessions = db.prepare(`
    SELECT s.*, u.name AS patient_name, u.email AS patient_email, u.phone AS patient_phone
    FROM sessions s
    JOIN users u ON u.id = s.patient_id
    WHERE s.professional_id = ?
    ORDER BY s.date DESC, s.time DESC
  `).all(pro.id)
  res.json(sessions)
})

// ─── Paciente: agendar sessão ─────────────────────────────────────────────────
router.post('/', auth, requireRole('paciente'), (req, res) => {
  const { professional_id, professional, specialty, date, time, notes } = req.body

  if (!professional || !specialty || !date)
    return res.status(400).json({ error: 'Profissional, especialidade e data são obrigatórios.' })

  // Valida se a data não é no passado
  if (new Date(date) < new Date(new Date().toDateString()))
    return res.status(400).json({ error: 'Não é possível agendar em uma data passada.' })

  const result = db.prepare(`
    INSERT INTO sessions (patient_id, professional_id, professional, specialty, date, time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'Agendada', ?)
  `).run(req.userId, professional_id || null, professional, specialty, date, time || null, notes || '')

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(session)
})

// ─── Atualizar status (paciente cancela / profissional atualiza) ──────────────
router.patch('/:id', auth, (req, res) => {
  const { status, notes } = req.body
  const validStatus = ['Agendada', 'Realizada', 'Cancelada']

  if (!validStatus.includes(status))
    return res.status(400).json({ error: `Status inválido. Use: ${validStatus.join(', ')}` })

  // Paciente só pode cancelar a própria sessão
  // Profissional pode marcar como Realizada ou Cancelada as sessões dele
  let session
  if (req.userRole === 'paciente') {
    session = db.prepare('SELECT * FROM sessions WHERE id = ? AND patient_id = ?').get(req.params.id, req.userId)
    if (session && status !== 'Cancelada')
      return res.status(403).json({ error: 'Paciente só pode cancelar sessões.' })
  } else if (req.userRole === 'profissional') {
    const pro = db.prepare('SELECT id FROM professionals WHERE user_id = ?').get(req.userId)
    session = db.prepare('SELECT * FROM sessions WHERE id = ? AND professional_id = ?').get(req.params.id, pro?.id)
  }

  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' })

  db.prepare('UPDATE sessions SET status = ?, notes = COALESCE(?, notes) WHERE id = ?')
    .run(status, notes || null, req.params.id)

  const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// ─── Paciente: deletar sessão ─────────────────────────────────────────────────
router.delete('/:id', auth, requireRole('paciente'), (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND patient_id = ?').get(req.params.id, req.userId)
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada.' })

  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id)
  res.json({ message: 'Sessão removida.' })
})

module.exports = router
