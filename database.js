// database.js
// Cria o banco SQLite, as tabelas e popula com dados iniciais

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const db = new Database('./acolhe.db')

// Ativar foreign keys
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Criar tabelas ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'paciente',
    address    TEXT    DEFAULT '',
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS psychologists (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    profession      TEXT    NOT NULL,
    crp             TEXT    NOT NULL,
    specialty       TEXT    NOT NULL,
    approach        TEXT    NOT NULL,
    price           INTEGER NOT NULL,
    audience        TEXT    NOT NULL,
    care_model      TEXT    NOT NULL,
    rating          REAL    DEFAULT 5.0,
    reviews         INTEGER DEFAULT 0,
    online          INTEGER DEFAULT 1,
    presential      INTEGER DEFAULT 0,
    bio             TEXT    DEFAULT '',
    formation       TEXT    DEFAULT '',
    specialization  TEXT    DEFAULT '',
    areas           TEXT    DEFAULT '[]',
    schedule        TEXT    DEFAULT '[]',
    testimonials    TEXT    DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    psy_id       INTEGER REFERENCES psychologists(id),
    professional TEXT    NOT NULL,
    specialty    TEXT    NOT NULL,
    date         TEXT    NOT NULL,
    time         TEXT,
    status       TEXT    NOT NULL DEFAULT 'Agendada',
    notes        TEXT    DEFAULT '',
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`)

// ─── Seed: popular se vazio ───────────────────────────────────────────────────

const psyCount = db.prepare('SELECT COUNT(*) as n FROM psychologists').get()

if (psyCount.n === 0) {
  const insertPsy = db.prepare(`
    INSERT INTO psychologists
      (name, profession, crp, specialty, approach, price, audience, care_model,
       rating, reviews, online, presential, bio, formation, specialization, areas, schedule, testimonials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const psychologists = [
    {
      name: 'Dra. Camila Rocha',
      profession: 'Psicólogo(a)',
      crp: 'CRP 06/112345',
      specialty: 'Ansiedade',
      approach: 'Cognitivo-Comportamental (TCC)',
      price: 30,
      audience: 'Baixa renda',
      care_model: 'Atendimento social',
      rating: 4.9,
      reviews: 87,
      online: 1,
      presential: 0,
      bio: 'Especialista em transtornos de ansiedade e síndrome de burnout. Atendo adultos e adolescentes com foco em resultados práticos.',
      formation: 'Psicologia - USP (2013)',
      specialization: 'Cognitivo-Comportamental - CETCC-SP (2015)',
      areas: JSON.stringify(['Ansiedade', 'Pânico', 'Burnout', 'TOC', 'Fobias']),
      schedule: JSON.stringify(['Seg 8h-18h', 'Ter 8h-18h', 'Qui 8h-18h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'Camila me ajudou a entender e controlar minha ansiedade.' },
        { author: 'Paciente anônimo', text: 'Profissional excelente, abordagem muito prática e efetiva.' },
      ]),
    },
    {
      name: 'Dr. Rafael Mendes',
      profession: 'Psicanalista',
      crp: 'CRP 06/98432',
      specialty: 'Depressão',
      approach: 'Psicanálise',
      price: 45,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.8,
      reviews: 124,
      online: 1,
      presential: 1,
      bio: 'Psicanalista com 12 anos de experiência. Atendo depressão, luto e questões de identidade com escuta aprofundada.',
      formation: 'Psicologia - PUC-SP (2012)',
      specialization: 'Psicanálise - IPUSP (2014)',
      areas: JSON.stringify(['Depressão', 'Luto', 'Identidade', 'Relacionamentos']),
      schedule: JSON.stringify(['Ter 9h-17h', 'Qui 9h-17h', 'Sex 9h-14h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'Rafael tem uma escuta muito acolhedora e transformadora.' },
      ]),
    },
    {
      name: 'Dra. Beatriz Lima',
      profession: 'Psicólogo(a)',
      crp: 'CRP 06/76543',
      specialty: 'Relacionamentos',
      approach: 'Humanista',
      price: 40,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 5.0,
      reviews: 56,
      online: 1,
      presential: 1,
      bio: 'Psicóloga humanista especializada em relacionamentos e comunicação não-violenta.',
      formation: 'Psicologia - UNICAMP (2015)',
      specialization: 'Abordagem Centrada na Pessoa - ICP-SP (2017)',
      areas: JSON.stringify(['Relacionamentos', 'Comunicação', 'Autoestima', 'Família']),
      schedule: JSON.stringify(['Seg 10h-18h', 'Qua 10h-18h', 'Sex 10h-16h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'Beatriz me ajudou a melhorar muito minha comunicação.' },
      ]),
    },
    {
      name: 'Dr. Lucas Ferreira',
      profession: 'Psicólogo(a)',
      crp: 'CRP 06/54321',
      specialty: 'Trauma e TEPT',
      approach: 'EMDR',
      price: 50,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.9,
      reviews: 43,
      online: 1,
      presential: 0,
      bio: 'Especialista em trauma e TEPT com certificação em EMDR. Atendo vítimas de trauma, acidentes e violência.',
      formation: 'Psicologia - USP (2014)',
      specialization: 'EMDR - EMDR Brasil (2018)',
      areas: JSON.stringify(['Trauma', 'TEPT', 'Ansiedade', 'Fobias']),
      schedule: JSON.stringify(['Seg 14h-20h', 'Qua 14h-20h', 'Sex 14h-18h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'O EMDR foi transformador para mim. Lucas é incrível.' },
      ]),
    },
    {
      name: 'Dra. Ana Paula Souza',
      profession: 'Psiquiatra',
      crp: 'CRM 123456',
      specialty: 'Depressão',
      approach: 'Psiquiatria Clínica',
      price: 50,
      audience: 'Empresa parceira',
      care_model: 'Benefício corporativo',
      rating: 4.7,
      reviews: 201,
      online: 1,
      presential: 1,
      bio: 'Psiquiatra com foco em transtornos de humor e ansiedade. Atendimento integrado com psicoterapia.',
      formation: 'Medicina - UNIFESP (2010)',
      specialization: 'Psiquiatria - Hospital das Clínicas (2013)',
      areas: JSON.stringify(['Depressão', 'Ansiedade', 'Bipolaridade', 'TDAH']),
      schedule: JSON.stringify(['Ter 8h-12h', 'Qui 8h-12h', 'Sex 8h-12h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'Dra. Ana Paula é muito cuidadosa e atenciosa.' },
      ]),
    },
    {
      name: 'Dr. Pedro Oliveira',
      profession: 'Psicólogo(a)',
      crp: 'CRP 06/87654',
      specialty: 'Autoconhecimento',
      approach: 'Gestalt',
      price: 35,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.6,
      reviews: 38,
      online: 1,
      presential: 1,
      bio: 'Psicólogo gestáltico apaixonado por processos de autoconhecimento e desenvolvimento pessoal.',
      formation: 'Psicologia - PUC-MG (2016)',
      specialization: 'Gestalt-terapia - IGT-SP (2018)',
      areas: JSON.stringify(['Autoconhecimento', 'Desenvolvimento pessoal', 'Criatividade', 'Espiritualidade']),
      schedule: JSON.stringify(['Seg 9h-17h', 'Qua 9h-17h', 'Sex 9h-13h']),
      testimonials: JSON.stringify([
        { author: 'Paciente anônimo', text: 'Pedro tem uma abordagem muito criativa e acolhedora.' },
      ]),
    },
  ]

  const insertMany = db.transaction((psys) => {
    for (const p of psys) {
      insertPsy.run(
        p.name, p.profession, p.crp, p.specialty, p.approach,
        p.price, p.audience, p.care_model, p.rating, p.reviews,
        p.online, p.presential, p.bio, p.formation, p.specialization,
        p.areas, p.schedule, p.testimonials
      )
    }
  })

  insertMany(psychologists)
  console.log('Banco populado com', psychologists.length, 'profissionais.')
}

// Seed: usuário de teste
const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get()
if (userCount.n === 0) {
  const hash = bcrypt.hashSync('123456', 10)
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
    'Usuário Teste', 'teste@email.com', hash, 'paciente'
  )
  console.log('Usuário de teste criado: teste@email.com / 123456')
}

module.exports = db
