# Acolhe+ API

Backend do **Acolhe+**, app que conecta pacientes a profissionais de saúde mental. API REST com cadastro e login de pacientes e profissionais, busca com filtros e agendamento de sessões.

App mobile: [acolhe-mobile](https://github.com/Azaf3/acolhe-mobile)

## Stack

- Node.js + Express
- SQLite (better-sqlite3)
- Autenticação com JWT e senhas com bcrypt
- Dois papéis de usuário: paciente e profissional

## Como rodar

```bash
cp .env.example .env   # defina JWT_SECRET
npm install
npm run dev   # desenvolvimento (nodemon)
npm start     # produção
```

API disponível em `http://localhost:3000`

## Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Cadastro |
| POST | /auth/login | Login |
| GET | /auth/me | Perfil do usuário logado |
| PUT | /auth/me | Atualizar perfil |

### Profissionais
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /psychologists | Listar com filtros |
| GET | /psychologists/:id | Buscar por ID |

**Filtros disponíveis:** `?q=&specialty=&audience=&profession=&modality=online\|presencial`

### Sessões (requer token)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /sessions | Listar sessões do usuário |
| POST | /sessions | Agendar sessão |
| PATCH | /sessions/:id | Atualizar status |
| DELETE | /sessions/:id | Cancelar sessão |

## Autenticação

As rotas protegidas exigem o header:
```
Authorization: Bearer <token>
```

O token é retornado no login e cadastro.

## Usuário de teste

Criado automaticamente ao iniciar:
- **E-mail:** teste@email.com
- **Senha:** 123456

## Banco de dados

O arquivo `acolhe.db` é criado automaticamente na raiz do projeto com 6 profissionais de dados mock.
