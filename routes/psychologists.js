// routes/psychologists.js  →  agora lista TODOS os tipos de profissional
const router = require('express').Router()
const db = require('../database')

function parsePro(p) {
  return {
    ...p,
    online: p.online === 1,
    presential: p.presential === 1,
    approved: p.approved === 1,
    areas: JSON.parse(p.areas || '[]'),
    schedule: JSON.parse(p.schedule || '[]'),
    testimonials: JSON.parse(p.testimonials || '[]'),
  }
}

// ─── Listar profissionais aprovados com filtros ───────────────────────────────
// GET /psychologists?q=&specialty=&profession=&audience=&modality=online|presencial&min_price=&max_price=
router.get('/', (req, res) => {
  const { q, specialty, profession, audience, modality, min_price, max_price } = req.query

  let query = `
    SELECT p.*, u.name, u.email
    FROM professionals p
    JOIN users u ON u.id = p.user_id
    WHERE p.approved = 1
  `
  const params = []

  if (q) {
    query += ' AND (u.name LIKE ? OR p.specialty LIKE ? OR p.approach LIKE ? OR p.profession LIKE ?)'
    const like = `%${q}%`
    params.push(like, like, like, like)
  }
  if (specialty)  { query += ' AND p.specialty = ?';  params.push(specialty) }
  if (profession) { query += ' AND p.profession = ?'; params.push(profession) }
  if (audience)   { query += ' AND p.audience = ?';   params.push(audience) }
  if (modality === 'online')     { query += ' AND p.online = 1' }
  if (modality === 'presencial') { query += ' AND p.presential = 1' }
  if (min_price)  { query += ' AND p.price >= ?'; params.push(Number(min_price)) }
  if (max_price)  { query += ' AND p.price <= ?'; params.push(Number(max_price)) }

  query += ' ORDER BY p.rating DESC'

  const rows = db.prepare(query).all(...params)
  res.json(rows.map(parsePro))
})

// ─── Buscar profissional por ID ───────────────────────────────────────────────
// GET /psychologists/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT p.*, u.name, u.email
    FROM professionals p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ? AND p.approved = 1
  `).get(req.params.id)

  if (!row) return res.status(404).json({ error: 'Profissional não encontrado.' })
  res.json(parsePro(row))
})

module.exports = router
