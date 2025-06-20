// server.js (VERSÃO COMPLETA E ATUALIZADA COM VALIDAÇÕES E VERIFICAÇÃO DE E-MAIL POR CÓDIGO)

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const dns = require('dns');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YEtVb3eI5RAK@ep-yellow-dawn-a8k4xiu6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Configuração do Nodemailer para Gmail (use variáveis de ambiente!)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Seu e-mail do Gmail
        pass: process.env.GMAIL_APP_PASSWORD // A senha de aplicativo que você gerou
    }
});

// Conectar ao banco de dados e criar tabelas (AGORA COM is_verified E verification_token)
pool.connect()
    .then(client => {
        console.log("Conectado ao banco de dados PostgreSQL.");
        return client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token TEXT UNIQUE,
                token_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// Middleware customizado para validação de domínio MX
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

// Função para gerar um código numérico de 6 dígitos
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Gera um número entre 100000 e 999999
};

// Função para enviar e-mail de verificação com código
const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.GMAIL_USER, // Seu e-mail do Gmail
        to: email,
        subject: 'Código de Verificação da sua conta do Jogo de Desafios!',
        html: `
            <p>Olá,</p>
            <p>Seu código de verificação para o Jogo de Desafios para Casal é:</p>
            <h2 style="color: #1abc9c; font-size: 2em; text-align: center;">${code}</h2>
            <p>Por favor, use este código na página de verificação para ativar sua conta.</p>
            <p>Este código é válido por 10 minutos.</p>
            <p>Se você não se registrou em nosso jogo, por favor ignore este e-mail.</p>
            <p>Atenciosamente,</p>
            <p>A Equipe do Jogo de Desafios</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`E-mail de verificação enviado para ${email}`);
    } catch (error) {
        console.error(`Erro ao enviar e-mail para ${email}:`, error);
        throw new Error('Não foi possível enviar o e-mail de verificação.');
    }
};

// =================================================================
// =================== ROTAS DA API ================================
// =================================================================

// ROTA DE REGISTRO
app.post('/api/register',
    // Middleware de validação do express-validator
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
            const verificationCode = generateVerificationCode(); // Gerar código numérico
            const tokenCreatedAt = new Date(); // Timestamp de criação do token

            const userInsertQuery = `
                INSERT INTO users (username, password, is_verified, verification_token, token_created_at)
                VALUES ($1, $2, FALSE, $3, $4) RETURNING id`; // Inserir com FALSE, token e timestamp

            const userResult = await pool.query(userInsertQuery, [username, hashedPassword, verificationCode, tokenCreatedAt]);
            const newUserId = userResult.rows[0].id;

            const categories = ['conexao', 'amigos', 'hot', 'picante'];
            const accessInsertQuery = 'INSERT INTO user_access (user_id, category, has_access) VALUES ($1, $2, $3)';

            await Promise.all(categories.map(category => {
                return pool.query(accessInsertQuery, [newUserId, category, false]);
            }));
            
            // Tenta enviar o e-mail de verificação com o CÓDIGO
            await sendVerificationEmail(username, verificationCode);

            res.json({
                "message": "Usuário criado com sucesso! Por favor, verifique seu e-mail para ativar sua conta.",
                "userId": newUserId
            });

        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({ "error": "Este nome de usuário já existe." });
            }
            console.error("Erro no registro:", error);
            res.status(500).json({ "error": "Erro no servidor ao registrar usuário ou enviar e-mail de verificação." });
        }
    }
);

// ROTA PARA VERIFICAÇÃO DE E-MAIL (AGORA VIA POST COM CÓDIGO)
app.post('/api/verify-email', async (req, res) => {
    const { email, token } = req.body; // Recebe e-mail e token (código) via POST

    if (!email || !token) {
        return res.status(400).json({ "error": "E-mail e código de verificação são obrigatórios." });
    }

    try {
        const userSql = `SELECT * FROM users WHERE username = $1`;
        const userResult = await pool.query(userSql, [email]);
        const user = userResult.rows[0];

        if (!user || user.verification_token !== token) {
            return res.status(400).json({ "error": "Código de verificação inválido." });
        }

        // Verifica a expiração do token (10 minutos)
        const tokenCreationTime = new Date(user.token_created_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos em milissegundos
        if (tokenCreationTime < tenMinutesAgo) {
            return res.status(400).json({ "error": "Código de verificação expirado. Por favor, solicite um novo." });
        }

        const updateSql = `UPDATE users SET is_verified = TRUE, verification_token = NULL, token_created_at = NULL WHERE username = $1 RETURNING id`;
        const updateResult = await pool.query(updateSql, [email]);

        if (updateResult.rowCount > 0) {
            res.json({ "message": "Conta verificada com sucesso!" });
        } else {
            res.status(400).json({ "error": "Falha na verificação. Código inválido ou e-mail não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao verificar e-mail:", error);
        res.status(500).json({ "error": "Erro interno do servidor ao verificar e-mail." });
    }
});

// NOVA ROTA PARA REENVIAR CÓDIGO DE VERIFICAÇÃO
app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ "error": "E-mail é obrigatório para reenviar o código." });
    }

    try {
        const userSql = `SELECT * FROM users WHERE username = $1`;
        const userResult = await pool.query(userSql, [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ "error": "E-mail não encontrado." });
        }
        if (user.is_verified) {
            return res.status(400).json({ "error": "Esta conta já está verificada." });
        }

        const newVerificationCode = generateVerificationCode();
        const tokenCreatedAt = new Date();

        const updateSql = `UPDATE users SET verification_token = $1, token_created_at = $2 WHERE username = $3 RETURNING id`;
        await pool.query(updateSql, [newVerificationCode, tokenCreatedAt, email]);

        await sendVerificationEmail(email, newVerificationCode);

        res.json({ "message": "Novo código de verificação enviado com sucesso!" });

    } catch (error) {
        console.error("Erro ao reenviar código de verificação:", error);
        res.status(500).json({ "error": "Erro interno do servidor ao reenviar código de verificação." });
    }
});


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

        // Verifica se a conta está verificada
        if (!user.is_verified) {
            return res.status(403).json({ "error": "Sua conta ainda não foi verificada. Por favor, verifique seu e-mail." });
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