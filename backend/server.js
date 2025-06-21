// server.js (VERSÃO ANTERIOR À VALIDAÇÃO DE E-MAIL POR CÓDIGO)

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const dns = require('dns'); // Mantém o DNS para validação MX

const app = express();

// Configuração do CORS: Permite requisições do seu frontend Netlify
const corsOptions = {
    origin: process.env.FRONTEND_URL, // Variável de ambiente com a URL do seu frontend Netlify
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Configuração da conexão com o PostgreSQL
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YEtVb3eI5RAK@ep-yellow-dawn-a8k4xiu6-pooler.eastus2.azure.neon.tech/neondb?ssl=require";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Conectar ao banco de dados e criar tabelas (sem is_verified e verification_token)
pool.connect()
    .then(client => {
        console.log("Conectado ao banco de dados PostgreSQL.");
        return client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
                -- is_verified BOOLEAN DEFAULT FALSE,       -- REMOVIDO
                -- verification_token TEXT UNIQUE           -- REMOVIDO
                -- token_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- REMOVIDO
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

// Middleware customizado para validação de domínio MX (mantido)
const validateMxRecord = async (value, { req }) => {
    const domain = value.split('@')[1];
    if (!domain) {
        throw new Error('Formato de e-mail inválido (domínio ausente).');
    }

    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                reject(new Error('O domínio do e-mail não existe ou não está configurado para receber e-mails.'));
            } else {
                resolve(true);
            }
        });
    });
};

// =================================================================
// =================== ROTAS DA API ================================
// =================================================================

// ROTA DE REGISTRO (revertida para não enviar e-mail de verificação)
app.post('/api/register',
    // Middleware de validação do express-validator (mantido)
    [
        body('username')
            .isEmail().withMessage('O nome de usuário deve ser um e-mail válido.')
            .custom(validateMxRecord), // Validação customizada do MX Record
        body('password')
            .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres.')
            .matches(/[A-Z]/).withMessage('A senha deve conter pelo menos uma letra maiúscula.')
            .matches(/[a-z]/).withMessage('A senha deve conter pelo menos uma letra minúscula.')
            .matches(/[0-9]/).withMessage('A senha deve conter pelo menos um número.')
            .matches(/[^A-Za-z0-9]/).withMessage('A senha deve conter pelo menos um caractere especial.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const userInsertQuery = `
                INSERT INTO users (username, password)
                VALUES ($1, $2) RETURNING id`; // Inserir sem is_verified e token

            const userResult = await pool.query(userInsertQuery, [username, hashedPassword]);
            const newUserId = userResult.rows[0].id;

            const categories = ['conexao', 'amigos', 'hot', 'picante'];
            const accessInsertQuery = 'INSERT INTO user_access (user_id, category, has_access) VALUES ($1, $2, $3)';

            await Promise.all(categories.map(category => {
                return pool.query(accessInsertQuery, [newUserId, category, false]);
            }));

            // Removida a chamada para sendVerificationEmail
            res.json({
                "message": "Usuário criado com sucesso!",
                "userId": newUserId
            });

        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({ "error": "Este nome de usuário já existe." });
            }
            console.error("Erro no registro:", error);
            res.status(500).json({ "error": "Erro no servidor ao registrar usuário." });
        }
    }
);

// ROTA DE VERIFICAÇÃO DE E-MAIL (REMOVIDA ou inutilizada)
// Se esta rota foi app.get('/api/verify-email') e agora é app.post,
// precisamos ter certeza de que não há conflito ou resíduo.
// Se você quiser removê-la completamente, pode apagar este bloco.
// Se ela foi apenas mudada para POST, o GET antigo não existiria de qualquer forma.
// A rota POST /api/verify-email será REMOVIDA
// A rota POST /api/resend-verification será REMOVIDA

// ROTA DE LOGIN (revertida para não verificar is_verified)
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

        // Removida a verificação is_verified
        // if (!user.is_verified) {
        //     return res.status(403).json({ "error": "Sua conta ainda não foi verificada. Por favor, verifique seu e-mail." });
        // }

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

// ROTA PARA BUSCAR PERMISSÕES (mantida)
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