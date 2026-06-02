// database.js
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const db = new Database('./acolhe.db')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Tipos de profissional válidos ───────────────────────────────────────────
const PROFESSIONAL_TYPES = [
  'Psicólogo',
  'Psicanalista',
  'Psiquiatra',
  'Terapeuta',
  'Neuropsicólogo',
  'Psicopedagogo',
  'Acompanhante Terapêutico',
  'Conselheiro ou Orientador Emocional',
]

// ─── Criar tabelas ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password     TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'paciente',
    address      TEXT    DEFAULT '',
    phone        TEXT    DEFAULT '',
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS professionals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profession      TEXT    NOT NULL,
    register_number TEXT    NOT NULL,
    specialty       TEXT    NOT NULL,
    approach        TEXT    NOT NULL DEFAULT '',
    price           INTEGER NOT NULL DEFAULT 0,
    audience        TEXT    NOT NULL DEFAULT '',
    care_model      TEXT    NOT NULL DEFAULT '',
    rating          REAL    DEFAULT 5.0,
    reviews         INTEGER DEFAULT 0,
    online          INTEGER DEFAULT 1,
    presential      INTEGER DEFAULT 0,
    bio             TEXT    DEFAULT '',
    formation       TEXT    DEFAULT '',
    specialization  TEXT    DEFAULT '',
    areas           TEXT    DEFAULT '[]',
    schedule        TEXT    DEFAULT '[]',
    testimonials    TEXT    DEFAULT '[]',
    approved        INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      INTEGER NOT NULL REFERENCES users(id),
    professional_id INTEGER REFERENCES professionals(id),
    professional    TEXT    NOT NULL,
    specialty       TEXT    NOT NULL,
    date            TEXT    NOT NULL,
    time            TEXT,
    status          TEXT    NOT NULL DEFAULT 'Agendada',
    notes           TEXT    DEFAULT '',
    created_at      TEXT    DEFAULT (datetime('now'))
  );
`)

// ─── Seed: profissionais de teste ─────────────────────────────────────────────
const proCount = db.prepare('SELECT COUNT(*) as n FROM professionals').get()

if (proCount.n === 0) {
  const seedProfessionals = [
    {
      name: 'Dra. Camila Rocha',
      email: 'camila@acolhe.com',
      profession: 'Psicólogo',
      register_number: 'CRP 06/112345',
      specialty: 'Ansiedade',
      approach: 'Cognitivo-Comportamental (TCC)',
      price: 30,
      audience: 'Baixa renda',
      care_model: 'Atendimento social',
      rating: 4.9,
      reviews: 87,
      online: 1,
      presential: 0,
      bio: 'Especialista em transtornos de ansiedade e síndrome de burnout.',
      formation: 'Psicologia - USP (2013)',
      specialization: 'Cognitivo-Comportamental - CETCC-SP (2015)',
      areas: ['Ansiedade', 'Pânico', 'Burnout', 'TOC', 'Fobias'],
      schedule: ['Seg 8h-18h', 'Ter 8h-18h', 'Qui 8h-18h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Camila me ajudou a controlar minha ansiedade.' }],
    },
    {
      name: 'Dr. Rafael Mendes',
      email: 'rafael@acolhe.com',
      profession: 'Psicanalista',
      register_number: 'CRP 06/98432',
      specialty: 'Depressão',
      approach: 'Psicanálise',
      price: 45,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.8,
      reviews: 124,
      online: 1,
      presential: 1,
      bio: 'Psicanalista com 12 anos de experiência.',
      formation: 'Psicologia - PUC-SP (2012)',
      specialization: 'Psicanálise - IPUSP (2014)',
      areas: ['Depressão', 'Luto', 'Identidade', 'Relacionamentos'],
      schedule: ['Ter 9h-17h', 'Qui 9h-17h', 'Sex 9h-14h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Escuta muito acolhedora e transformadora.' }],
    },
    {
      name: 'Dra. Ana Paula Souza',
      email: 'anapaula@acolhe.com',
      profession: 'Psiquiatra',
      register_number: 'CRM 123456',
      specialty: 'Depressão',
      approach: 'Psiquiatria Clínica',
      price: 50,
      audience: 'Empresa parceira',
      care_model: 'Benefício corporativo',
      rating: 4.7,
      reviews: 201,
      online: 1,
      presential: 1,
      bio: 'Psiquiatra com foco em transtornos de humor e ansiedade.',
      formation: 'Medicina - UNIFESP (2010)',
      specialization: 'Psiquiatria - Hospital das Clínicas (2013)',
      areas: ['Depressão', 'Ansiedade', 'Bipolaridade', 'TDAH'],
      schedule: ['Ter 8h-12h', 'Qui 8h-12h', 'Sex 8h-12h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Muito cuidadosa e atenciosa.' }],
    },
    {
      name: 'Dra. Beatriz Lima',
      email: 'beatriz@acolhe.com',
      profession: 'Terapeuta',
      register_number: 'CRP 06/76543',
      specialty: 'Relacionamentos',
      approach: 'Humanista',
      price: 40,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 5.0,
      reviews: 56,
      online: 1,
      presential: 1,
      bio: 'Especializada em relacionamentos e comunicação não-violenta.',
      formation: 'Psicologia - UNICAMP (2015)',
      specialization: 'Abordagem Centrada na Pessoa - ICP-SP (2017)',
      areas: ['Relacionamentos', 'Comunicação', 'Autoestima', 'Família'],
      schedule: ['Seg 10h-18h', 'Qua 10h-18h', 'Sex 10h-16h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Me ajudou muito na comunicação.' }],
    },
    {
      name: 'Dr. Lucas Ferreira',
      email: 'lucas@acolhe.com',
      profession: 'Neuropsicólogo',
      register_number: 'CRP 06/54321',
      specialty: 'Trauma e TEPT',
      approach: 'EMDR',
      price: 50,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.9,
      reviews: 43,
      online: 1,
      presential: 0,
      bio: 'Especialista em trauma e TEPT com certificação em EMDR.',
      formation: 'Psicologia - USP (2014)',
      specialization: 'EMDR - EMDR Brasil (2018)',
      areas: ['Trauma', 'TEPT', 'Ansiedade', 'Fobias'],
      schedule: ['Seg 14h-20h', 'Qua 14h-20h', 'Sex 14h-18h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'O EMDR foi transformador.' }],
    },
    {
      name: 'Dr. Pedro Oliveira',
      email: 'pedro@acolhe.com',
      profession: 'Psicopedagogo',
      register_number: 'CRP 06/87654',
      specialty: 'Dificuldades de aprendizagem',
      approach: 'Gestalt',
      price: 35,
      audience: 'Renda média',
      care_model: 'Plano essencial',
      rating: 4.6,
      reviews: 38,
      online: 1,
      presential: 1,
      bio: 'Apaixonado por processos de autoconhecimento e desenvolvimento educacional.',
      formation: 'Psicologia - PUC-MG (2016)',
      specialization: 'Gestalt-terapia - IGT-SP (2018)',
      areas: ['Dificuldades de aprendizagem', 'Autoconhecimento', 'Desenvolvimento'],
      schedule: ['Seg 9h-17h', 'Qua 9h-17h', 'Sex 9h-13h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Abordagem muito criativa.' }],
    },
    {
      name: 'Dra. Mariana Costa',
      email: 'mariana@acolhe.com',
      profession: 'Acompanhante Terapêutico',
      register_number: 'CRP 06/34521',
      specialty: 'Suporte cotidiano',
      approach: 'Acompanhamento Terapêutico',
      price: 25,
      audience: 'Baixa renda',
      care_model: 'Atendimento social',
      rating: 4.8,
      reviews: 29,
      online: 0,
      presential: 1,
      bio: 'Auxilia pessoas em tratamento psicológico ou psiquiátrico em atividades do cotidiano.',
      formation: 'Psicologia - UFMG (2017)',
      specialization: 'Acompanhamento Terapêutico - IPq-SP (2019)',
      areas: ['Suporte cotidiano', 'Reabilitação', 'Inclusão social'],
      schedule: ['Seg-Sex 8h-18h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Presença fundamental na minha recuperação.' }],
    },
    {
      name: 'Dr. Felipe Santos',
      email: 'felipe@acolhe.com',
      profession: 'Conselheiro ou Orientador Emocional',
      register_number: 'Cert. 45678',
      specialty: 'Orientação emocional',
      approach: 'Orientação Integrativa',
      price: 20,
      audience: 'Baixa renda',
      care_model: 'Atendimento social',
      rating: 4.5,
      reviews: 17,
      online: 1,
      presential: 1,
      bio: 'Oferece suporte e orientação emocional com escuta ativa e empatia.',
      formation: 'Coaching e Orientação Emocional - FGV (2019)',
      specialization: 'Conselheiro Certificado - ICF (2021)',
      areas: ['Orientação emocional', 'Autoestima', 'Relacionamentos'],
      schedule: ['Ter 10h-18h', 'Qui 10h-18h'],
      testimonials: [{ author: 'Paciente anônimo', text: 'Felipe tem uma escuta incrível.' }],
    },
  ]

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  )
  const insertPro = db.prepare(`
    INSERT INTO professionals
      (user_id, profession, register_number, specialty, approach, price, audience,
       care_model, rating, reviews, online, presential, bio, formation,
       specialization, areas, schedule, testimonials, approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `)

  const seedAll = db.transaction((list) => {
    const hash = bcrypt.hashSync('123456', 10)
    for (const p of list) {
      const userResult = insertUser.run(p.name, p.email, hash, 'profissional')
      insertPro.run(
        userResult.lastInsertRowid,
        p.profession, p.register_number, p.specialty, p.approach,
        p.price, p.audience, p.care_model, p.rating, p.reviews,
        p.online, p.presential, p.bio, p.formation, p.specialization,
        JSON.stringify(p.areas), JSON.stringify(p.schedule), JSON.stringify(p.testimonials)
      )
    }
  })

  seedAll(seedProfessionals)
  console.log(`Banco populado com ${seedProfessionals.length} profissionais.`)
}

// Seed: usuário paciente de teste
const userCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'paciente'").get()
if (userCount.n === 0) {
  const hash = bcrypt.hashSync('123456', 10)
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Usuário Teste', 'teste@email.com', hash, 'paciente'
  )
  console.log('Paciente de teste criado: teste@email.com / 123456')
}

module.exports = db
module.exports.PROFESSIONAL_TYPES = PROFESSIONAL_TYPES
