// server.js (VERSÃO COMPLETA E ATUALIZADA COM VALIDAÇÕES)

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Configuração da conexão com o PostgreSQL
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YEtVb3eI5RAK@ep-yellow-dawn-a8k4xiu6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Conectar ao banco de dados e criar tabelas
pool.connect()
    .then(client => {
        console.log("Conectado ao banco de dados PostgreSQL.");
        return client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_access (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                has_access BOOLEAN DEFAULT FALSE
            );
        `)
        .then(() => {
            client.release();
            console.log("Tabelas PostgreSQL verificadas/criadas.");
        })
        .catch(err => {
            client.release();
            console.error("Erro ao criar tabelas PostgreSQL:", err.message);
            process.exit(1);
        });
    })
    .catch(err => {
        console.error("Erro FATAL ao conectar ao banco de dados PostgreSQL:", err.message);
        process.exit(1);
    });

// =================================================================
// =================== ROTAS DA API ================================
// =================================================================

// ROTA DE REGISTRO
app.post('/api/register',
    // Middleware de validação
    [
        body('username')
            .isEmail().withMessage('O nome de usuário deve ser um e-mail válido.'),
        body('password')
            .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres.')
            .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
            .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
            .matches(/[0-9]/).withMessage('A senha deve conter pelo menos um número.')
            .matches(/[^A-Za-z0-9]/).withMessage('A senha deve conter pelo menos um caractere especial.')
    ],
    async (req, res) => {
        // Verifica se há erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const userInsertQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
            const userResult = await pool.query(userInsertQuery, [username, hashedPassword]);
            const newUserId = userResult.rows[0].id;

            const categories = ['conexao', 'amigos', 'hot', 'picante'];
            const accessInsertQuery = 'INSERT INTO user_access (user_id, category, has_access) VALUES ($1, $2, $3)';

            await Promise.all(categories.map(category => {
                return pool.query(accessInsertQuery, [newUserId, category, false]);
            }));

            res.json({ "message": "Usuário criado com sucesso!", "userId": newUserId });

        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({ "error": "Este nome de usuário já existe." });
            }
            console.error("Erro no registro:", error);
            res.status(500).json({ "error": "Erro no servidor ao registrar usuário." });
        }
    }
);

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Nome de usuário e senha são obrigatórios." });
    }
    try {
        const sql = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(sql, [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({ "message": "Login bem-sucedido!", "username": user.username });
        } else {
            res.status(400).json({ "error": "Usuário ou senha inválidos." });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ "error": "Erro no servidor ao fazer login." });
    }
});

// ROTA PARA BUSCAR PERMISSÕES
app.get('/api/access/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const sql = `
            SELECT ua.category, ua.has_access
            FROM users u
            JOIN user_access ua ON u.id = ua.user_id
            WHERE u.username = $1`;
        const result = await pool.query(sql, [username]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ "error": "Usuário não encontrado ou sem permissões." });
        }
        const accessObject = {};
        rows.forEach(row => {
            accessObject[row.category] = !!row.has_access;
        });
        res.json(accessObject);
    } catch (error) {
        console.error("Erro ao buscar permissões:", error);
        res.status(500).json({ "error": "Erro no servidor ao buscar permissões." });
    }
});


// =================================================================
// =================== INICIAR O SERVIDOR ==========================
// =================================================================

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});