// routes/psychologists.js
const router = require('express').Router()
const db = require('../database')

function parsePsy(p) {
  return {
    ...p,
    online: p.online === 1,
    presential: p.presential === 1,
    areas: JSON.parse(p.areas || '[]'),
    schedule: JSON.parse(p.schedule || '[]'),
    testimonials: JSON.parse(p.testimonials || '[]'),
  }
}

// ─── Listar todos com filtros ─────────────────────────────────────────────────
// GET /psychologists?q=&specialty=&audience=&profession=&modality=online|presencial
router.get('/', (req, res) => {
  const { q, specialty, audience, profession, modality } = req.query

  let query = 'SELECT * FROM psychologists WHERE 1=1'
  const params = []

  if (q) {
    query += ' AND (name LIKE ? OR specialty LIKE ? OR approach LIKE ? OR profession LIKE ?)'
    const like = `%${q}%`
    params.push(like, like, like, like)
  }
  if (specialty) { query += ' AND specialty = ?'; params.push(specialty) }
  if (audience)  { query += ' AND audience = ?';  params.push(audience) }
  if (profession){ query += ' AND profession = ?'; params.push(profession) }
  if (modality === 'online')     { query += ' AND online = 1' }
  if (modality === 'presencial') { query += ' AND presential = 1' }

  query += ' ORDER BY rating DESC'

  const rows = db.prepare(query).all(...params)
  res.json(rows.map(parsePsy))
})

// ─── Buscar por ID ────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const psy = db.prepare('SELECT * FROM psychologists WHERE id = ?').get(req.params.id)
  if (!psy) return res.status(404).json({ error: 'Profissional não encontrado.' })
  res.json(parsePsy(psy))
})

module.exports = router
